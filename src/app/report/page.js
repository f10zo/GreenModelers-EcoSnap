import Link from 'next/link';
import UploadForm from '../home/components/UploadForm';

export default function ReportPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-gray-900 dark:text-gray-100 p-4">
            <UploadForm />
        </div>
    );
}
