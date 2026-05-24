import localFont from "next/font/local";
import "prosemirror-view/style/prosemirror.css";
import "@excalidraw/excalidraw/index.css";
import "./globals.css";
import ClientProviders from "./components/ClientProviders";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Contexlia",
  description: "Contexlia Resource Finder",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
        suppressHydrationWarning
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
