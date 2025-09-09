// app/layout.js
import "./globals.css"; // Import your global CSS file
import { Inter } from "next/font/google"; // Import a font from Google

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "My Next.js App",
  description: "A description of my Next.js application.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen"> {/* Use flexbox to push footer to bottom */}
          <header className="bg-gray-800 text-white p-4 bg-opacity-70"> {/* Added bg-opacity for readability */}
            <nav>
              <a href="/">Home</a>
              <a href="/about" className="ml-4">About</a>
            </nav>
          </header>

          <main className="flex-grow p-4"> {/* flex-grow will make main take up available space */}
            {children} {/* This is where the page content will be rendered */}
          </main>

          <footer className="bg-gray-200 text-center p-4 bg-opacity-70 mt-auto"> {/* mt-auto pushes footer down */}
            <p>© {new Date().getFullYear()} My Next.js App</p>
          </footer>
        </div>
      </body>
    </html>
  );
}