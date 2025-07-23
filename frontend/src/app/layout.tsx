import type { Metadata } from "next";
import { Inter, Orbitron, Rajdhani, Space_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "@/styles/globals.css";
import { headers } from "next/headers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "TrustBank - Decentralized Trust-Based Lending",
  description:
    "A revolutionary DeFi protocol enabling undercollateralized lending through social trust networks",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${orbitron.variable} ${rajdhani.variable} ${spaceMono.variable}`}
      >
        <Providers cookies={cookies}>{children}</Providers>
      </body>
    </html>
  );
}
