import React from 'react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="backdrop-blur-sm bg-white/30 rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto text-center text-black">
        <Image 
          // Corrected path: use the relative path from the public directory
          src="/kin2.jpg" 
          alt="Lake view" 
          width={500} 
          height={300} 
          className="rounded-lg mb-6 mx-auto" 
        />

        <h1 className="text-4xl font-extrabold mb-4">About Our Project</h1>
        <p className="text-lg font-semibold text-gray-800">
          This project is dedicated to monitoring and protecting our local lake.
          By allowing users to report pollution and share information, we aim to
          foster a cleaner, healthier environment for everyone.
        </p>
        <p className="mt-4 text-base font-medium text-gray-800">
          You can contribute by uploading reports and volunteering for cleanup efforts.
        </p>
      </div>
    </div>
  );
}