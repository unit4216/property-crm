import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { MuiThemeRegistry } from "@/components/mui-theme-registry";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Property CRM",
  description: "A mini property management CRM.",
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
    >
      <body className="min-h-full">
        <MuiThemeRegistry>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 overflow-x-hidden">
              <main className="mx-auto w-full max-w-5xl px-8 py-8">
                {children}
              </main>
            </div>
          </div>
        </MuiThemeRegistry>
      </body>
    </html>
  );
}
