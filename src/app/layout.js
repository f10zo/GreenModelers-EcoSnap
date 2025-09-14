import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./home/components/ThemeToggle";
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
        <HomePageBackground>
          <header className="bg-gray-800 text-white p-1 bg-opacity-70">
            <nav className="flex items-center justify-between flex-wrap sm:flex-nowrap">
              {/* Left: Logo and EcoSnap text */}
              <div className="flex items-center space-x-2 ml-2 sm:ml-4">
                <Image
                  src="/eco_logo_navy.png"
                  alt="EcoSnap Logo"
                  width={70} // slightly smaller on mobile
                  height={55}
                  className="sm:w-[90px] sm:h-[70px]"
                />
                <Link href="/" className="text-xl sm:text-2xl font-bold flex items-center space-x-1">
                  <span>EcoSnap</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                </Link>
              </div>

              {/* Right: Navbar links */}
              <div className="flex items-center mr-2 sm:mr-4 space-x-1 sm:space-x-3 mt-2 sm:mt-0">
                <Link
                  href="/about"
                  className="bg-[#435875] text-white px-3 py-2 sm:px-5 sm:py-3 rounded-md text-sm sm:text-base transition duration-300 ease-in-out hover:bg-[#5a718e] shadow-md"
                >
                  About
                </Link>
                <Link
                  href="/contact-us"
                  className="bg-[#435875] text-white px-3 py-2 sm:px-5 sm:py-3 rounded-md text-sm sm:text-base transition duration-300 ease-in-out hover:bg-[#5a718e] shadow-md"
                >
                  Contact Us
                </Link>
                <ThemeToggle />
              </div>


            </nav>
          </header>

          <main className="flex-grow p-4 sm:p-8">
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
