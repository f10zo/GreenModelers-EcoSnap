"use client";

import React from "react";
import UploadForm from "./home/components/UploadForm";
import Gallery from "./home/components/Gallery";
import InfoSection from "./home/components/InfoSection";

export default function Home() {
    return (
        <main className="relative min-h-screen flex items-center justify-center p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-screen-xl">
                <InfoSection />
                <UploadForm />
                <Gallery />
            </div>
        </main>
    );
}