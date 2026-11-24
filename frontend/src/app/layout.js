import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "CircuitSetu",
  description: "Open Source Circuit Simulator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
