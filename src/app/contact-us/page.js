"use client";

import React, { useState, useEffect } from 'react';

export default function ContactUsPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [currentTheme, setCurrentTheme] = useState('light');

    // Effect to detect the current theme
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const newTheme = document.documentElement.className;
            setCurrentTheme(newTheme);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submit button was clicked. Form data:", { name, email, message });
        // No action is performed after this point.
    };
    

    return (
        <div className={`min-h-screen p-8 font-sans transition-colors duration-500`}>
            <div className="container mx-auto max-w-2xl">
                <div className={`backdrop-blur-sm rounded-xl shadow-lg p-8 space-y-8 transition-colors duration-500 ${currentTheme.includes('dark') ? 'bg-gray-800/60 text-white' : 'bg-white/30 text-black'}`}>
                    <div className="text-center">
                        <h1 className={`text-4xl font-bold mb-2 transition-colors duration-500 ${currentTheme.includes('dark') ? 'text-white-300' : 'text-white-700'}`}>Get In Touch With Us Now!</h1>
                        <p className={`transition-colors duration-500 ${currentTheme.includes('dark') ? 'text-gray-300' : 'text-gray-800'}`}>
                            We'd love to hear from you. Fill out the form below to send us a message.
                        </p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className={`block text-sm font-medium mb-1 transition-colors duration-500 ${currentTheme.includes('dark') ? 'text-gray-300' : 'text-gray-700'}`}>Your Name</label>
                            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className={`form-input w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors duration-500 ${currentTheme.includes('dark') ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/70 border-gray-300 text-black placeholder-gray-500'}`} />
                        </div>

                        <div>
                            <label htmlFor="email" className={`block text-sm font-medium mb-1 transition-colors duration-500 ${currentTheme.includes('dark') ? 'text-gray-300' : 'text-gray-700'}`}>Your Email</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={`form-input w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors duration-500 ${currentTheme.includes('dark') ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/70 border-gray-300 text-black placeholder-gray-500'}`} />
                        </div>

                        <div>
                            <label htmlFor="message" className={`block text-sm font-medium mb-1 transition-colors duration-500 ${currentTheme.includes('dark') ? 'text-gray-300' : 'text-gray-700'}`}>Your Message</label>
                            <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows="4" required className={`form-input w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors duration-500 ${currentTheme.includes('dark') ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/70 border-gray-300 text-black placeholder-gray-500'}`}></textarea>
                        </div>
                        
                        <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105">
                            Submit Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
