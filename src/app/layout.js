// Import your global CSS file
import "./globals.css";
// Import a font from Google
import { Inter } from "next/font/google";
// Import the Link component
import Link from "next/link";
// Import Image component for optimized image handling
import Image from "next/image";
// Import the new ThemeToggle component
import ThemeToggle from "./home/components/ThemeToggle";
// Import the new HomePageBackground component
import HomePageBackground from "./home/components/HomePageBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "EcoSnap",
  description: "Track and report environmental issues easily",
  icons: {
    icon: "/eco_logo_navy.png",   
    shortcut: "/eco_logo_navy.png",
    apple: "/eco_logo_navy.png",
  },
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* The HomePageBackground component will now manage the background */}
        <HomePageBackground>
          <header className="bg-gray-800 text-white p-1 bg-opacity-70">
            <nav className="flex items-center justify-between">
              {/* Left-aligned content: Logo and "EcoSnap" text with the heart */}
              <div className="flex items-center space-x-2 ml-4">
                {/* Your actual logo image */}
                <Image
                  src="/eco_logo_navy.png" // Path to your logo in the public directory
                  alt="EcoSnap Logo"
                  width={90}
                  height={70}
                />
                <Link href="/" className="text-2xl font-bold flex items-center space-x-1">
                  <span>EcoSnap</span>
                  {/* Heart SVG now to the right of "EcoSnap" text */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                </Link>
              </div>

              {/* Right-aligned content: Navigation links with button styles */}
              <div className="flex items-center mr-4">
                <Link
                  href="/about"
                  className="bg-[#435875] text-white py-2 px-4 rounded-md transition duration-300 ease-in-out hover:bg-[#5a718e] shadow-md mr-2"
                >
                  About
                </Link>
                <Link
                  href="/contact-us"
                  className="bg-[#435875] text-white py-2 px-4 rounded-md transition duration-300 ease-in-out hover:bg-[#5a718e] shadow-md"
                >
                  Contact Us
                </Link>
                <ThemeToggle />
              </div>
            </nav>
          </header>

          <main className="flex-grow p-4">
            {children}
          </main>

          <footer className="bg-gray-800 text-white text-center p-4 bg-opacity-70 mt-auto">
            <p>© 2025 EcoSnap. All rights reserved.</p>
          </footer>
        </HomePageBackground>
      </body>
    </html>
  );
}
