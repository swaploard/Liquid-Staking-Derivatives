import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liquid Staking Derivatives",
  description: "Liquid Staking Derivatives (LSD) Collateralized Loan Protocol (like a MakerDAO-style vault using stETH, rETH, bETH as collateral to mint or borrow stablecoins like DAI/USDC)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
