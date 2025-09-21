'use client';

import { useState, useEffect } from "react";
import Link from "next/link";

export default function InfoSection() {
  const [currentTheme, setCurrentTheme] = useState("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      const htmlClass = document.documentElement.className;
      setCurrentTheme(savedTheme || htmlClass || "light");
    }

    const observer = new MutationObserver(() => {
      setCurrentTheme(document.documentElement.className);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="w-full rounded-3xl p-4 overflow-y-auto border-2 transition-colors duration-500"
      style={{
        backdropFilter: "blur(12px)", // stronger blur for outer container
        backgroundColor:
          currentTheme === "dark"
            ? "rgba(15, 23, 42, 0.7)" // dark semi-transparent
            : "rgba(255, 255, 255, 0.35)", // light semi-transparent
        borderColor: currentTheme === "dark" ? "#22c55e" : "#4ade80",
        color: currentTheme === "dark" ? "#fff" : "#000",
      }}
    >
      <div className="space-y-4">
        <h3
          className={`text-3xl font-extrabold text-center transition-colors duration-500 ${currentTheme === "dark" ? "text-emerald-300" : "text-emerald-700"
            }`}
        >
          Keep Our Sea of Galilee Clean! 💧
        </h3>

        <p
          className={`text-sm leading-relaxed text-center transition-colors duration-500 ${currentTheme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
        >
          <strong
            className={`text-base font-bold transition-colors duration-500 ${currentTheme === "dark" ? "text-emerald-400" : "text-emerald-600"
              }`}
          >
            Every action helps!
          </strong>{" "}
          Let&apos;s protect our vital natural resources together.
        </p>

        {/* ✅ Section for Report and Share Info */}
        <div className="space-y-4 mt-6">
          <Link href="/report">
            <div
              className={`cursor-pointer rounded-2xl p-3 shadow-md transition-all duration-500 hover:scale-[1.02]`}
              style={{
                backdropFilter: "blur(3px)", // slightly blurred inner cards
                backgroundColor:
                  currentTheme === "dark"
                    ? "rgba(55, 65, 81, 0.85)"
                    : "rgba(255, 255, 255, 0.8)",
              }}
            >
              <h4
                className={`text-xl font-bold flex items-center gap-2 transition-colors duration-500 ${currentTheme === "dark" ? "text-sky-400" : "text-sky-600"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Report and Share Info
              </h4>
              <p
                className={`text-sm leading-relaxed transition-colors duration-500 ${currentTheme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
              >
                The information you upload is crucial.{" "}
                <strong>Share it with authorities</strong> to prompt effective
                action against pollution.
              </p>
            </div>
          </Link>
        </div>

        {/* ✅ Section for Add Campaigns */}
        <div className="space-y-4 mt-6">
          <Link href="/campaign-form">
            <div
              className={`cursor-pointer rounded-2xl p-3 shadow-md transition-all duration-500 hover:scale-[1.02]`}
              style={{
                backdropFilter: "blur(3px)",
                backgroundColor:
                  currentTheme === "dark"
                    ? "rgba(55, 65, 81, 0.85)"
                    : "rgba(255, 255, 255, 0.8)",
              }}
            >
              <h4
                className={`text-xl font-bold flex items-center gap-2 transition-colors duration-500 ${currentTheme === "dark" ? "text-sky-400" : "text-sky-600"
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.042 2.222A2.43 2.43 0 0 0 13.564 1a2.446 2.446 0 0 0-1.728.516l-.884.664a1.983 1.983 0 0 0-.66.66l-.664.884c-.394.524-.95 1.05-1.554 1.444A4.57 4.57 0 0 0 6.5 6.5C4.013 4.013 1.5 6.5 1.5 6.5v8c0 1.25.75 2 2 2h4.5v-2h-3v-4.5h3v-3.5h-1.5c-1.25 0-2 .75-2 2v2.5h1.5v-1.5h1.5v-1.5h1.5v-1.5h1.5v-1.5h-1.5v-1.5h1.5v-1.5h1.5v-1.5zM12 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
                  />
                </svg>
                Add Campaigns
              </h4>
              <p
                className={`text-sm leading-relaxed transition-colors duration-500 ${currentTheme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
              >
                Create and organize your own cleanup campaigns for others to join.
              </p>
            </div>
          </Link>
        </div>

        {/* Repeat same style for other inner sections */}
        {/* Volunteer for Cleanup */}
        <div className="space-y-4 mt-6">
          <Link href="/published-campaigns">
            <div
              className={`cursor-pointer rounded-2xl p-3 shadow-md transition-all duration-500 hover:scale-[1.02]`}
              style={{
                backdropFilter: "blur(3px)",
                backgroundColor:
                  currentTheme === "dark"
                    ? "rgba(55, 65, 81, 0.85)"
                    : "rgba(255, 255, 255, 0.8)",
              }}
            >
              <h4
                className={`text-xl font-bold flex items-center gap-2 transition-colors duration-500 ${currentTheme === "dark" ? "text-sky-400" : "text-sky-600"
                  }`}
              >
                Volunteer for Cleanup
              </h4>
              <p
                className={`text-sm leading-relaxed transition-colors duration-500 ${currentTheme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
              >
                Join local <strong>cleanup groups</strong> to make a{" "}
                <strong>tangible difference</strong> in the health of our environment.
              </p>
            </div>
          </Link>
        </div>

        {/* Contact Us */}
        <div className="space-y-4 mt-6">
          <Link href="/contact-us">
            <div
              className={`cursor-pointer rounded-2xl p-3 shadow-md transition-all duration-500 hover:scale-[1.02]`}
              style={{
                backdropFilter: "blur(3px)",
                backgroundColor:
                  currentTheme === "dark"
                    ? "rgba(55, 65, 81, 0.85)"
                    : "rgba(255, 255, 255, 0.8)",
              }}
            >
              <h4
                className={`text-xl font-bold flex items-center gap-2 transition-colors duration-500 ${currentTheme === "dark" ? "text-sky-400" : "text-sky-600"
                  }`}
              >
                Contact Us
              </h4>
              <p
                className={`text-sm leading-relaxed transition-colors duration-500 ${currentTheme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
              >
                Have questions, feedback, or ideas? Reach out to our team — we&apos;d love to hear from you!
              </p>
            </div>
          </Link>
        </div>

        <p
          className={`text-lg italic font-semibold text-center transition-colors duration-500 ${currentTheme === "dark" ? "text-emerald-200" : "text-emerald-800"
            }`}
        >
          Together, we can ensure OUR Lake remains vibrant and healthy!
        </p>
      </div>
    </div>
  );
}
