import "./globals.css"; // Import your global CSS file
import { Inter } from "next/font/google"; // Import a font from Google
import Link from "next/link"; // The change: Import the Link component

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "My Next.js App",
  description: "A description of my Next.js application.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <header className="bg-gray-800 text-white p-4 bg-opacity-70">
            <nav>
              {/* The changes are here: Replaced <a> with <Link> */}
              <Link href="/">Home</Link>
              <Link href="/about" className="ml-4">About</Link>
              <Link href="/contact-us" className="ml-4">Contact</Link>
            </nav>
          </header>

          <main className="flex-grow p-4">
            {children}
          </main>

          {/* Updated footer to match the header and include the new text */}
          <footer className="bg-gray-800 text-white text-center p-4 bg-opacity-70 mt-auto">
            <p>© 2025 EcoSnap. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
