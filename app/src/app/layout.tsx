import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Header } from "@/components/Header";
import { WalletProviders } from "@/components/WalletProviders";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Earmark",
  description: "Medical fundraisers where donations can only go to a verified clinic or back to the donors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <WalletProviders>
          <Header />
          <main className="mx-auto max-w-[1160px] px-6 pb-16 pt-10">{children}</main>
        </WalletProviders>
      </body>
    </html>
  );
}
