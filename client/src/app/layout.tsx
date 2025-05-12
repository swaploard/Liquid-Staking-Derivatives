import type { Metadata } from "next";
import { headers } from 'next/headers';
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner"

import "./globals.css";

import Providers from "./providers"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liquid Staking Derivatives (LSD)",
  description: "Collateralized Loan Protocol (like a MakerDAO-style vault using stETH, rETH, bETH as collateral to mint or borrow stablecoins like DAI/USDC)  ",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const cookie = headersList.get('cookie');

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers cookie={cookie ?? ''}>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
