import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "./home/components/Navbar";
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
      <body className="flex flex-col min-h-screen">
        <HomePageBackground>
          <Navbar />
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