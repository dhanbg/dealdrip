import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { Toaster } from "sonner";
import { Toast } from "@/components/Toast";
import { ProductDialog } from "@/components/ProductDialog";
import { BagDialog } from "@/components/BagDialog";
import { CheckoutDialog } from "@/components/CheckoutDialog";
import { WebMCPBridge } from "@/components/WebMCPBridge";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Deal Drip — Beyond the screen",
  description:
    "Find your next setup in another dimension. Deal Drip’s curated audio, gaming, and everyday essentials, in interactive 3D.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#141518",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${manrope.variable}`}
    >
      <body>
        <a className="skip-link" href="#collection">
          Skip to products
        </a>
        <StoreProvider>
          {children}
          <ProductDialog />
          <BagDialog />
          <CheckoutDialog />
          <Toast />
          <WebMCPBridge />
          <Toaster richColors position="top-right" closeButton theme="dark" />
        </StoreProvider>
      </body>
    </html>
  );
}
