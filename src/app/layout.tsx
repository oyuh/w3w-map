import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "W3W GTA Viewer",
  description: "GTA V Map with What3Words Grid Overlay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-mono bg-brutal-bg text-brutal-text overflow-hidden">
        {children}
      </body>
    </html>
  );
}
