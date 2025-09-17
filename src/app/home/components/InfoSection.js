"use client";

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
      className={`w-full shadow-xl rounded-3xl p-4 overflow-y-auto border-2 transition-colors duration-500 ${currentTheme === "dark"
          ? "bg-slate-800/90 text-white border-green-700"
          : "bg-slate-100/90 text-black border-green-300"
        }`}
    >
      {/* ✅ This wrapper adds consistent spacing between paragraphs/sections */}
      <div className="space-y-4">
        <h3
          className={`text-2xl font-extrabold text-center transition-colors duration-500 ${currentTheme === "dark" ? "text-emerald-300" : "text-emerald-700"
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

        {/* ✅ Links section keeps its own spacing */}
        <div className="space-y-4">
          {/* Report and Share Info */}
          <Link href="/report">
            <div
              className={`cursor-pointer rounded-2xl p-3 shadow-md transition-all duration-500 hover:scale-[1.02] ${currentTheme === "dark"
                  ? "bg-gray-700 text-white"
                  : "bg-white text-black"
                }`}
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

          {/* Volunteer for Cleanup */}
          <Link href="/Impact-Together">
            <div
              className={`cursor-pointer rounded-2xl p-3 shadow-md transition-all duration-500 hover:scale-[1.02] ${currentTheme === "dark"
                  ? "bg-gray-700 text-white"
                  : "bg-white text-black"
                }`}
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
                    d="M15.042 2.222A2.43 2.43 0 0 0 13.564 1a2.446 2.446 0 0 0-1.728.516l-.884.664a1.983 1.983 0 0 0-.66.66l-.664.884c-.394.524-.95 1.05-1.554 1.444A4.57 4.57 0 0 0 6.5 6.5C4.013 4.013 1.5 6.5 1.5 6.5v8c0 1.25.75 2 2 2h4.5v-2h-3v-4.5h3v-3.5h-1.5c-1.25 0-2 .75-2 2v2.5h1.5v-1.5h1.5v-1.5h1.5v-1.5h1.5v-1.5h-1.5v-1.5h1.5v-1.5h1.5v-1.5zM12 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
                  />
                </svg>
                Volunteer for Cleanup
              </h4>
              <p
                className={`text-sm leading-relaxed transition-colors duration-500 ${currentTheme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
              >
                Join local <strong>cleanup groups</strong> to make a{" "}
                <strong>tangible difference</strong> in the health of our
                environment.
              </p>
            </div>
          </Link>

          {/* Contact Us */}
          <Link href="/contact-us">
            <div
              className={`cursor-pointer rounded-2xl p-3 shadow-md transition-all duration-500 hover:scale-[1.02] ${currentTheme === "dark"
                  ? "bg-gray-700 text-white"
                  : "bg-white text-black"
                }`}
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
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.5a2.25 2.25 0 0 1-2.36 0l-7.5-4.5a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
                Contact Us
              </h4>
              <p
                className={`text-sm leading-relaxed transition-colors duration-500 ${currentTheme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
              >
                Have questions, feedback, or ideas? Reach out to our team — we&apos;d
                love to hear from you!
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
