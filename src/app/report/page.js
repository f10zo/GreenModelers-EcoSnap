import Link from 'next/link';
import UploadForm from '../home/components/UploadForm'; 

export default function ReportPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-gray-900 dark:text-gray-100 p-4">
            {/* Blurry, themed container for the form */}
            <div className="w-full max-w-2xl backdrop-blur-md bg-white/30 p-6 rounded-3xl shadow-xl transition-colors duration-500">
                <UploadForm />
            </div>
        </div>
    );
}