import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import "./reference.css";
import "./details.css";
import "./columns.css";

export const metadata: Metadata = {
  title: "Payments | Dashboard",
  description: "A Stripe-inspired payments dashboard built with mock data.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
