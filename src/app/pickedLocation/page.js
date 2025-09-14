// src/app/pickedLocation/page.js

"use client";

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react'; // Import Suspense from React

// Dynamically import the map component
const ClientMap = dynamic(() => import('./components/ClientMap'), {
  ssr: false,
});

export default function PickedLocationPage() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4" onClick={handleClose}>
      <div 
        className="w-full max-w-4xl h-[70vh] rounded-2xl overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Wrap the component that uses searchParams inside a Suspense boundary */}
        <Suspense fallback={<div>Loading map...</div>}>
          <ClientMap />
        </Suspense>
        
        {/* Your other HTML elements */}
        <div className="absolute top-0 left-0 right-0 p-2 text-center text-white font-bold text-sm">
          Click anywhere to close
        </div>
        
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-[1000] p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}