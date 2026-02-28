import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shubharambh - Find Your Perfect Event Venue",
  description: "Discover event venues, get quotes from multiple vendors, and plan your celebration with ease. Wedding, engagement, birthday, and anniversary venues.",
  keywords: "event venues, wedding venues, party halls, event planning, venue booking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <ChatBot />
        </Providers>
      </body>
    </html>
  );
}
