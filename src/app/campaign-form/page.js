"use client";

import React, { useState, useEffect } from "react";
import PublishCampaignForm from './PublishCampaignForm';

export default function CampaignFormPage() {
  const [currentTheme, setCurrentTheme] = useState("light");
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const htmlClass = document.documentElement.className;
    setCurrentTheme(savedTheme || htmlClass || "light");

    const observer = new MutationObserver(() => {
      setCurrentTheme(document.documentElement.className);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Get navbar height dynamically
    const updateNavbarHeight = () => {
      const navbar = document.querySelector("header");
      if (navbar) setNavbarHeight(navbar.offsetHeight);
    };
    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateNavbarHeight);
    };
  }, []);

  return (
    <main style={{ paddingTop: `${navbarHeight}px` }} className="p-4 transition-colors duration-500">
      <PublishCampaignForm />
    </main>
  );
}
