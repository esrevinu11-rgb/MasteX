import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MasteX — AI-Powered WAEC Study Platform",
  description: "Stop memorising. Start mastering. AI-powered WAEC prep for Ghana SHS students with spaced repetition, weekly quests, and national rankings.",
  keywords: "WAEC, Ghana SHS, study, AI, Core Mathematics, English Language, Integrated Science, Social Studies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full bg-[#0F0E0C] text-[#F5F0E8] font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
