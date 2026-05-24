import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "ArcNFT — NFT Marketplace on Arc Testnet",
  description: "Mint, buy, and sell NFTs on Arc Chain. Upload to IPFS via Pinata.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <ToastProvider>
            <Navbar />
            <main className="relative z-10 max-w-6xl mx-auto px-4 py-10">
              {children}
            </main>
            <footer className="relative z-10 text-center text-xs text-gray-600 py-8">
              ArcNFT · Built on{" "}
              <a href="https://testnet.arcscan.app" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">
                Arc Testnet
              </a>{" "}
              ·{" "}
              <a href="https://x.com/lexiweb31" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">
                @lexiweb31
              </a>
            </footer>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
