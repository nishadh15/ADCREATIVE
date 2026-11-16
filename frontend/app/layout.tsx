import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata = { title: "Blank Hanger AI Marketing Manager" };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={jakarta.variable}><body className="font-sans">{children}</body></html>;
}
