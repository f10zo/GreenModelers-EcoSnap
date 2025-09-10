import React from 'react';

export default function InfoSection() {
    return (
        <div className="w-full bg-slate-100/90 shadow-xl rounded-3xl p-6 overflow-y-auto text-black border-2 border-green-300 md:col-span-2 lg:col-span-3">
            <h3 className="text-3xl font-extrabold mb-4 text-emerald-700 text-center">Keep Our Lake Clean! 💧</h3>
            <p className="mb-4 text-base text-gray-700 leading-relaxed text-center">
                <strong className="text-lg text-emerald-600">Every action helps!</strong> Let&apos;s protect our vital natural resources together.
            </p>
            <div className="space-y-6">
                <div className="bg-white rounded-2xl p-4 shadow-md transition-transform duration-300 hover:scale-[1.02]">
                    <h4 className="text-xl font-bold mb-2 text-sky-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 2.222A2.43 2.43 0 0 0 13.564 1a2.446 2.446 0 0 0-1.728.516l-.884.664a1.983 1.983 0 0 0-.66.66l-.664.884c-.394.524-.95 1.05-1.554 1.444A4.57 4.57 0 0 0 6.5 6.5C4.013 4.013 1.5 6.5 1.5 6.5v8c0 1.25.75 2 2 2h4.5v-2h-3v-4.5h3v-3.5h-1.5c-1.25 0-2 .75-2 2v2.5h1.5v-1.5h1.5v-1.5h1.5v-1.5h-1.5v-1.5h1.5v-1.5h1.5v-1.5zM12 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                        </svg>
                        Volunteer for Cleanup
                    </h4>
                    <p className="text-sm leading-relaxed text-gray-600">
                        Join local <strong>cleanup groups</strong> to make a <strong>tangible difference</strong> in the health of our environment.
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-md transition-transform duration-300 hover:scale-[1.02]">
                    <h4 className="text-xl font-bold mb-2 text-sky-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.793V21h-8.207L12 12.793l9-9zM3.5 10.5V3h8.5v7.5H3.5z" />
                        </svg>
                        Reduce Plastic Use
                    </h4>
                    <p className="text-sm leading-relaxed text-gray-600">
                        Choose <strong>reusable items</strong> over single-use plastics like bottles and bags to protect aquatic life.
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-md transition-transform duration-300 hover:scale-[1.02]">
                    <h4 className="text-xl font-bold mb-2 text-sky-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Report and Share Info
                    </h4>
                    <p className="text-sm leading-relaxed text-gray-600">
                        The information you upload is crucial. <strong>Share it with authorities</strong> to prompt effective action against pollution.
                    </p>
                </div>
            </div>
            <p className="mt-6 text-base italic text-emerald-800 font-semibold text-center">
                Together, we can ensure the lake remains vibrant and healthy!
            </p>
        </div>
    );
}