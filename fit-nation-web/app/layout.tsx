import type { Metadata } from "next";
import "./globals.css";
import "./branch-details.css";
import "./home-details.css";
import "./experience.css";
import "./site-header.css";
import "./contact.css";
import "./cinematic.css";

export const metadata: Metadata = {
  title: "Fit Nation Hyderabad | Show up. Get stronger.",
  description: "Explore Fit Nation Hyderabad. Find your branch, discover strength training, yoga and Zumba, and enquire about your first visit.",
  icons: {
    icon: "/fit-nation-official-logo.jpg",
    shortcut: "/fit-nation-official-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
