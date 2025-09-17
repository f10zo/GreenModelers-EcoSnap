import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Report Issue", href: "/report" }, 
    { name: "Impact Together", href: "/Impact-Together" },
    { name: "Contact", href: "/contact-us" },
  ];

  return (
    <header className="bg-gray-800 text-white p-1 bg-opacity-70">
      <nav className="flex items-center justify-between flex-wrap sm:flex-nowrap">
        {/* Left: Logo */}
        <div className="flex items-center ml-2 sm:ml-4">
          <Image
            src="/eco_logo_navy.png"
            alt="EcoSnap Logo"
            width={70}
            height={55}
            className="sm:w-[90px] sm:h-[70px]"
          />
        </div>

        {/* Right: Navbar links */}
        <div className="flex items-center space-x-1 sm:space-x-3 mr-2 sm:mr-4 mt-2 sm:mt-0">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="bg-[#435875] text-white px-3 py-2 sm:px-5 sm:py-3 rounded-md text-sm sm:text-base transition duration-300 ease-in-out hover:bg-[#5a718e] shadow-md"
            >
              {link.name}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
