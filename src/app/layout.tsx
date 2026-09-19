import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#F46C6C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Miimoo Budgeting",
  description: "Clean, mobile-first personal budgeting and expense tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Miimoo",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#F7F8FA]`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#F7F8FA] text-[#2D3748]">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
