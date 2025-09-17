'use client';

import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import Gallery from "./home/components/Gallery";
import InfoSection from "./home/components/InfoSection";
import dynamic from "next/dynamic";

const ReportsMap = dynamic(
  () => import("./home/components/ReportsMap"),
  { ssr: false } // disable server-side rendering
);

export default function Home() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "reports"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setReports(items);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reports:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading reports...</div>;
    }

    return (
        <main className="relative min-h-screen flex items-center justify-center p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-screen-xl">
                <InfoSection />
                <ReportsMap reports={reports} />
                <div className="md:col-span-2">
                    <Gallery reports={reports} />
                </div>
            </div>
        </main>
    );
}