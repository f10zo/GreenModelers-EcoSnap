import { Inter } from "next/font/google";
import ClientLayout from "./ClientLayout"; // Import the new component

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
    // 🛑 CHANGE MADE HERE: Added suppressHydrationWarning
    <html lang="en" className={inter.className} suppressHydrationWarning>
      {/* The ClientLayout component wraps the children */}
      <ClientLayout>
        {children}
      </ClientLayout>
    </html>
  );
}