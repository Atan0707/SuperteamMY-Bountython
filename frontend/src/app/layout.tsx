import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./global.css";
import { WalletContextProvider } from "@/components/WalletProvider";
import { Navbar } from "@/components/navbar";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Payung",
  description: "Payung is a platform for creating and showcasing NFTs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletContextProvider>
          <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            <Navbar />
            {children}
          </main>
        </WalletContextProvider>
      </body>
    </html>
  );
}
