import React from 'react';

export default function InfoSection() {
    return (
        <div className="w-full backdrop-blur-sm bg-white/30 shadow-lg rounded-3xl p-6 overflow-y-auto text-black md:col-span-2 lg:col-span-3">
            <h3 className="text-2xl font-extrabold mb-4 text-blue-800">Keep Our Lake Clean!</h3>
            <p className="mb-4 text-sm text-gray-800 leading-relaxed">
                <strong className="text-base text-green-700">Every action helps!</strong> Let's protect our natural resources together.
            </p>
            <div className="space-y-4">
                <div>
                    <h4 className="text-xl font-bold mb-2 text-purple-700">1. Volunteer for Cleanup</h4>
                    <p className="text-sm leading-relaxed">
                        Join local **cleanup groups** to make a **tangible difference** in the health of our environment.
                    </p>
                </div>
                <div>
                    <h4 className="text-xl font-bold mb-2 text-orange-700">2. Reduce Plastic Use</h4>
                    <p className="text-sm leading-relaxed">
                        Choose **reusable items** over single-use plastics like bottles and bags to protect aquatic life.
                    </p>
                </div>
                <div>
                    <h4 className="text-xl font-bold mb-2 text-teal-700">3. Report and Share Info</h4>
                    <p className="text-sm leading-relaxed">
                        The information you upload is crucial. **Share it with authorities** to prompt effective action against pollution.
                    </p>
                </div>
            </div>
            <p className="mt-4 text-base italic text-gray-900 font-semibold text-center">
                Together, we can ensure the lake remains vibrant and healthy!
            </p>
        </div>
    );
}