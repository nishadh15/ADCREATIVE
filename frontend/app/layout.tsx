import "./globals.css";
import { Big_Shoulders_Display, Space_Grotesk, Space_Mono } from "next/font/google";

const display = Big_Shoulders_Display({ subsets: ["latin"], weight: ["800", "900"], variable: "--font-display", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono", display: "swap" });

export const metadata = { title: "Blank Hanger AI Marketing Manager" };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${display.variable} ${grotesk.variable} ${mono.variable}`}><body className="font-sans">{children}</body></html>;
}
