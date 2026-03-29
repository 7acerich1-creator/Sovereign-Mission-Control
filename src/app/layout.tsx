import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "MISSION CONTROL :: Sovereign Synthesis",
  description: "Advanced AI Agent Command Cockpit",
};

import { AgentProvider } from "@/lib/AgentContext";
import { ThemeProvider } from "@/lib/ThemeContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="app-container">
        <ThemeProvider>
          <AgentProvider>
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </AgentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
