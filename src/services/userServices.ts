// src/services/userServices.ts
"use server";

import Cookies from 'js-cookie'
import {
    RegisterSchema,
    LoginSchema,
    CreatePasswordSchema,
    ResetPasswordSchema,
    ChangePasswordSchema
} from "enigma/schemas";
import bcrypt from "bcryptjs";
import {prisma} from "../../prisma/prisma";
import * as z from "zod";
import {signIn} from "enigma/auth";
import {AuthError} from "next-auth";
import * as vts from "./verificationTokenServices";
import * as rpts from "./resetPasswordTokenServices";
import {sendResetPasswordEmail, sendVerificationEmail} from "enigma/services/mailServices";
import {User} from "enigma/types/models";
import {getResetPasswordTokenByToken} from "./resetPasswordTokenServices";

export interface UserProps {
    id: number;
    email: string;
    name: string;
    role: string;
    status: string;
    image: string | null;
    dob: Date | null;
    address: string | null;
}

export interface PaginatedUsers {
    users: Array<UserProps>;
    total: number;
}

export async function getPaginatedUsers(page: number = 1, pageSize: number = 10): Promise<PaginatedUsers> {
    const skip = (page - 1) * pageSize;
    const users = await prisma.user.findMany({
        skip,
        take: pageSize,
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            image: true,
            dob: true,
            address: true,
        }
    });
    if (!users) {
        console.log("userServices.getPaginatedUsers: Users not found");
    }
    const total = await prisma.user.count();
    return {users, total};
}

export const getUsers = async () => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                image: true,
                dob: true,
                address: true,
            },
        });
        if (!users) {
            console.log("userServices.getUsers: Users not found");
            return null;
        }
        return users as User[];
    } catch (error) {
        console.log("userServices.getUsers: Error fetching user: ", error);
        return null;
    }
}

export const getUser = async (id: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: {id: parseInt(id)}
        });
        if (!user) {
            console.log("userServices.getUser: User not found");
            return null;
        }
        return user;
    } catch (error) {
        console.log("userServices.getUser: Error fetching user: ", error);
        return null;
    }
}

export const getAccount = async (userId: string)  => {
    // Fetch the user account from the database if they log in with 3rd party services
    try {
        const account = await prisma.account.findFirst({
            where: {userId: parseInt(userId)}
        });
        if (!account) {
            console.log("userServices.getAccount: Account not found");
            return null;
        }
        return account;
    } catch (error) {
        console.log("userServices.getAccount: Error fetching account: ", error);
        return null;
    }

}

export const login = async (data: z.infer<typeof LoginSchema>) => {
    console.log("userServices.login: Attempting to log in user with data: ", data);
    // Validate the data using the LoginSchema
    const validatedData = LoginSchema.parse(data);
    console.log("userServices.login: Validated data: ", validatedData);
    if (!validatedData) {
        console.log("userServices.login: Invalid data");
        return {error: "Invalid data"};
    }
    // Destructure the validated data
    const {email, password} = validatedData;
    // Check if the user exists
    const existingUser = await prisma.user.findFirst({
        where: {email: email.toLowerCase()}
    });
    console.log("userServices.login: Existing user: ", existingUser);
    if (!existingUser || !existingUser.password || !existingUser.email) {
        console.log("userServices.login: User not found");
        return {error: "Invalid credentials"};
    }

    // Resend confirmation email in login page
    if (!existingUser.emailVerified) {
        console.log("userServices.login: Email not verified");
        const verificationToken = await vts.createVerificationToken(email);
        if (verificationToken) {
            await sendVerificationEmail(verificationToken?.email, existingUser.name, verificationToken?.token);
            return {error: "Please confirm your email address. A new confirmation email has been sent."};
        } else {
            console.log("userServices.login: Error creating newVerification token");
            return {error: "Error creating newVerification token"};
        }
    }
    console.log("userServices.login: User email verified");
    // Attempt to sign in using signIn() from Auth.js
    try {
        console.log("userServices.login: Attempting to sign in with credentials");
        await signIn('credentials', {
            email: existingUser.email,
            password: password,
            redirect: true,
            redirectTo: '/home'
        });
    } catch (error) {
        if (error instanceof AuthError) {
            console.log("userServices.login: Login failed: ", error);
            switch (error.type) {
                case "CredentialsSignin":
                    console.log("userServices.login: Invalid credentials");
                    return {error: "Invalid credentials"};
                default:
                    console.log("userServices.login: Email not verified");
                    return {error: "Please confirm your email address"};
            }
        }
        throw error;
    }
    return {success: "User logged in successfully"};
}

export async function loginGoogle() {
    try {
        await signIn('google', {redirectTo: '/home'});
        return undefined;
    } catch (error) {
        if (error instanceof AuthError) {
            console.log("Google login failed: ", error);
            return 'Google logged in failed: ' + error;
        }
        throw error;
    }
}

export async function newVerification(token: string) {
    // Check if the token is valid
    const existingToken = await vts.getVerificationTokenByToken(token);
    if (!existingToken) {
        console.log("userServices.newVerification: Token not found");
        return {error: "Token not found!"};
    }
    // Check if the token is expired
    const tokenExpired = new Date(existingToken.expires) < new Date();
    if (tokenExpired) {
        console.log("userServices.newVerification: Token expired");
        return {error: "Token expired!"};
    }
    // Check if the user exists with the email in the token
    const existingUser = await prisma.user.findFirst({
        where: {email: existingToken.email}
    });
    if (!existingUser) {
        console.log("userServices.newVerification: User not found");
        return {error: "Email not found!"};
    }
    // If newVerification is complete, update emailVerified column
    // and update email column with the email in the token
    // in case the user changes their email address in profile page
    await prisma.user.update({
        where: {id: existingUser.id},
        data: {
            emailVerified: new Date(),
            email: existingToken.email
        }
    });
    // Delete the newVerification token after successful newVerification
    await prisma.verificationToken.delete({
        where: {identifier: existingToken.identifier}
    });
    console.info("userServices.newVerification: User email verified successfully");
    return {success: "Email verified successfully!"};
}

export const resetPass = async (data: z.infer<typeof ResetPasswordSchema>) => {
    // Validate the data using the LoginSchema
    const validatedData = ResetPasswordSchema.parse(data);
    if (!validatedData) {
        console.log("userServices.resetPass: Invalid data");
        return {error: "Invalid data"};
    }
    // Destructure the validated data
    const {email} = validatedData;
    // Check if the user exists
    const existingUser = await prisma.user.findFirst({
        where: {email: email.toLowerCase()}
    });
    if (!existingUser) {
        return {success: "Success! If your email exists in our system, you should receive a reset password link in your inbox soon!"};
    }

    // Send reset password email
    const resetPasswordToken = await rpts.createResetPasswordToken(email);
    if (resetPasswordToken) {
        await sendResetPasswordEmail(resetPasswordToken?.email, existingUser.name, resetPasswordToken?.token);
        return {success: "Success! If your email exists in our system, you should receive a reset password link in your inbox soon!"};
    } else {
        console.log("userServices.resetPass: Error creating newVerification token");
        return {error: "Error creating reset password token"};
    }
}

export const changePass = async (data: z.infer<typeof ChangePasswordSchema>, token?: string | null) => {
    if (!token) return {error: "Missing token."}
    const validatedData = ChangePasswordSchema.parse(data);
    if (!validatedData) {
        console.log("userServices.changePass: Invalid data.");
        return {error: "Invalid data."};
    }
    const {password, confirmPassword} = validatedData;
    if (password !== confirmPassword) {
        console.log("userServices.changePass: Passwords don't match.");
        return {error: "Confirm password does not match! Please enter again."}
    }
    const existingToken = await getResetPasswordTokenByToken(token);
    if (!existingToken) {
        console.log("userServices.changePass: Invalid token.");
        return {error: "Invalid token. You have already changed your password with this token."};
    }
    const isExpired = new Date(existingToken.expires) < new Date();
    if (isExpired) {
        console.log("userServices.changePass: Token expired.");
        return {error: "Token expired."};
    }
    const existingUser = await prisma.user.findUnique({
        where: {email: existingToken.email}
    })
    if (!existingUser) {
        console.log("userServices.changePass: Email does not exist.");
        return {error: "Email does not exist."};
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
        where: {id: existingUser.id},
        data: {password: hashedPassword}
    });
    await prisma.resetPasswordToken.delete({
        where: {identifier: existingToken.identifier}
    });
    return {success: "Success! Password reset successfully! Redirecting you back to login..."};
}

export async function createPass(email: string, data: z.infer<typeof CreatePasswordSchema>) {
    const validatedData = CreatePasswordSchema.parse(data);
    if (!validatedData) {
        console.log("userServices.createPass: Invalid data");
        return {error: "Invalid data"};
    }
    // Destructure the validated data
    const {password, confirmPassword} = validatedData;
    // Check if the user exists
    const existingUser = await prisma.user.findFirst({
        where: {email: email.toLowerCase()}
    });
    if (!existingUser || !existingUser.password || !existingUser.email) {
        console.log("userServices.createPass: User not found");
        return {error: "Invalid credentials"};
    }

    // Attempt to sign in using signIn() from Auth.js
    try {
        await prisma.user.update({
            where: {email: email.toLowerCase()},
            data: {
                password: await bcrypt.hash(password, 10),
                emailVerified: new Date()
            }
        });
        await signIn('credentials', {
            email: existingUser.email,
            password: password,
            redirectTo: '/home'
        });
    } catch (error) {
        if (error instanceof AuthError) {
            console.log("userServices.createPass: Login failed: ", error);
            switch (error.type) {
                case "CredentialsSignin":
                    console.log("userServices.createPass: Invalid credentials");
                    return {error: "Invalid credentials"};
                default:
                    console.log("userServices.createPass: " + error.message);
                    return {error: error.message};
            }
        }
        throw error;
    }
    return {success: "Password created successfully, user logged in successfully"};
}

export const register = async (data: z.infer<typeof RegisterSchema>) => {
    try {
        // Validate the data using the RegisterSchema
        const validatedData = RegisterSchema.parse(data);
        if (!validatedData) {
            return {error: "Invalid data"};
        }
        // Destructure the validated data
        const {email, password, name} = validatedData;
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Check if the user already exists
        const existingUser = await prisma.user.findFirst({
            where: {email: email},
        });
        if (existingUser) {
            return {error: "User already exists"};
        }
        // Create the user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name: name,
            },
        });
        // Create a newVerification token
        const verificationToken = await vts.createVerificationToken(email);
        // Send the newVerification email
        if (verificationToken) {
            await sendVerificationEmail(verificationToken?.email, name, verificationToken?.token);
            return {success: "User created successfully, email newVerification sent!", user: user};
        } else {
            return {error: "Error when registering, please try again."};
        }
    } catch (error) {
        console.log("Error during registration: ", error);
        return {error: "An error occurred during registration"};
    }
}

export async function logout() {
    Cookies.remove('token');
}