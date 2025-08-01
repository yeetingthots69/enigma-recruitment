"use client";
import * as React from "react";
import { Box, ThemeProvider } from "@mui/material";
import { SidebarNavigation } from "enigma/components/common/SidebarNavigation";
import { MainContent } from "./mainContent";
import theme from "enigma/styles/theme";
import {Session} from "next-auth";
import {User} from "enigma/types/models";
import {JobApplicationWithFlatJob} from "enigma/services/jobApplicationServices";

export default function UserDetails({session, user, applications}: {
    session: Session | null,
    user: User | null,
    applications: JobApplicationWithFlatJob[] | null
}) {
    // 19% for expanded sidebar, 6% for collapsed sidebar
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const sidebarWidth = isCollapsed ? '6%' : '19%';
    return (
        <ThemeProvider theme={theme}>
            <Box component="main" sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-start",
            }}>
                <SidebarNavigation session={session} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                <Box sx={{
                    pt: 10,
                    width: '100%',
                    position: 'relative',
                    marginLeft: {sm: sidebarWidth},
                    '@media (max-width: 991px)': {
                        marginLeft: '0',
                        width: '100%',
                    },
                }}
                >
                    <MainContent user={user} applications={applications}/>
                </Box>
            </Box>
        </ThemeProvider>
    );
}