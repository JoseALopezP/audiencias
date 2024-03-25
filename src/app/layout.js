import "./globals.css";
import { titillium } from "./ui/fonts";

export const metadata = {
  title: "Ofijup - UAC",
  description: "Gestión UAC",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={titillium.className}>
        {children}
      </body>
    </html>
  );
}