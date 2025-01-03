import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recurwise",
  description: "Keep track of your subscription",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-sans antialiased bg-gray-50"
        style={{ fontFamily: "Geist, sans-serif" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
