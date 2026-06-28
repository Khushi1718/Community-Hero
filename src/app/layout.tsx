import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Community Hero",
  description: "Hyperlocal Problem Solver",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Community Hero",
  },
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] flex flex-col bg-surface-50 text-surface-900 selection:bg-primary-200 selection:text-primary-900" suppressHydrationWarning>
        <ClerkProvider>
          <AuthProvider>
            <div className="flex-1 flex flex-col pb-20 md:pb-0 relative">
              <Navbar />
              <div className="flex-1">
                {children}
              </div>
            </div>
            <BottomNav />
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}