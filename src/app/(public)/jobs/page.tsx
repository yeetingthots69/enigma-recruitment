import React from 'react';
import LandingPage from "enigma/pages/landing/landingPage";
import { auth } from "enigma/auth";
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

export default async function Page() {
    const session = await auth();
    return (
        <LandingPage session={session} />
    );
}

export async function generateMetadata() {
    return {
        title: 'Open Jobs | Enigma Recruitment',
    };
}