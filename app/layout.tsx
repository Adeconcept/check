import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Checky",
  description: "Figma implementation for Checky's trust and verification flows."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
