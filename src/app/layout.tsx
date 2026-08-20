import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "@/styles.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Deal Drip 15W — RGB Wireless Charging Bluetooth Speaker, Clock & TWS Stereo",
  description:
    "Deal Drip 15W: RGB wireless charging Bluetooth speaker with TWS dual stereo pairing, digital clock, dual alarms and colour-cycling ambient light. Rs. 3,500 Single / Rs. 6,000 Duo Pack in Nepal.",
  authors: [{ name: "Deal Drip" }],
  openGraph: {
    title: "Deal Drip 15W — RGB Wireless Charging Bluetooth Speaker, Clock & TWS Stereo",
    description:
      "15W Qi wireless charging, Bluetooth 5.0 with TWS dual stereo pairing, digital alarm clock and RGB ambient light. Buy 1 for Rs. 3,500 or 2 for Rs. 6,000 (Save Rs. 1,000).",
    url: "https://lively-product-launch.lovable.app/",
    siteName: "Deal Drip",
    images: [
      {
        url: "https://lively-product-launch.lovable.app/__l5e/assets-v1/09bed847-6420-4f11-9498-e942207ff543/poster.jpg",
        width: 1200,
        height: 630,
        alt: "Deal Drip 15W Speaker",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deal Drip 15W — RGB Wireless Charging Bluetooth Speaker, Clock & TWS Stereo",
    description:
      "15W Qi wireless charging, Bluetooth 5.0 with TWS dual stereo pairing, digital alarm clock and RGB ambient light. Buy 1 for Rs. 3,500 or 2 for Rs. 6,000 (Save Rs. 1,000).",
    images: [
      "https://lively-product-launch.lovable.app/__l5e/assets-v1/09bed847-6420-4f11-9498-e942207ff543/poster.jpg",
    ],
  },
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: "https://lively-product-launch.lovable.app/",
  },
};

import { CartProvider } from "@/lib/cart-context";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body className="bg-background text-foreground antialiased selection:bg-accent selection:text-accent-foreground">
        <CartProvider>
          {children}
          <Toaster position="top-center" richColors />
        </CartProvider>
      </body>
    </html>
  );
}
