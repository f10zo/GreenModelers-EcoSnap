"use client";

import dynamic from 'next/dynamic';

const ClientMap = dynamic(() => import('./components/ClientMap'), {
  ssr: false,
});

export default function MapPage() {
  return <ClientMap />;
}