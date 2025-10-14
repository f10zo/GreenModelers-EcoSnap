'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function ContactUsPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        mobile: "", // without +972 inside
        email: "",
        message: "",
    });
    const [status, setStatus] = useState("");
    const [currentTheme, setCurrentTheme] = useState('light');
    const [errors, setErrors] = useState({
        firstName: "",
        lastName: "",
        mobile: "",
        email: "",
        message: "", 
    });

    const allowedEmailEndings = [".com", ".org", ".net", ".co.il"];
    const MAX_MESSAGE_LENGTH = 500; // Define max length
    const MIN_MESSAGE_LENGTH = 10; // Define min length
    const [navbarHeight, setNavbarHeight] = useState(0);

    const validateName = (name) => /^[A-Za-z\s]{2,}$/.test(name);

    const validateMobile = (mobile) => {
        if (!mobile) return false;
        if (mobile.startsWith("0")) return mobile.length === 10;
        return mobile.length === 9;
    };

    const validateEmail = (email) => {
        const emailRegex = /^(?!.*\.\.)(?!.*\.$)(?!^\.)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(email)) return false;
        return allowedEmailEndings.some(end => email.endsWith(end));
    };
    
    // New validation function for message
    const validateMessage = (message) => {
        const trimmed = message.trim();
        if (trimmed.length === 0) return "Message is required.";
        if (trimmed.length < MIN_MESSAGE_LENGTH) return `Message must be at least ${MIN_MESSAGE_LENGTH} characters.`;
        return ""; // Empty string means valid
    }

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setCurrentTheme(document.documentElement.className);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        const updateNavbarHeight = () => {
            const navbar = document.querySelector('header');
            if (navbar) setNavbarHeight(navbar.offsetHeight);
        };
        updateNavbarHeight();
        window.addEventListener("resize", updateNavbarHeight);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", updateNavbarHeight);
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let val = value;
        let newErrors = { ...errors };

        if (name === "mobile") {
            val = val.replace(/[^\d]/g, "");
            if (val.startsWith("0")) val = val.slice(0, 10);
            else val = val.slice(0, 9);
            newErrors.mobile = validateMobile(val) ? "" : "Invalid mobile number";
            setFormData(prev => ({ ...prev, mobile: val }));

        } else if (name === "firstName" || name === "lastName") {
            val = val.replace(/[^A-Za-z\s]/g, "");
            newErrors[name] = validateName(val) ? "" : "Only letters and spaces, min 2 characters";
            setFormData(prev => ({ ...prev, [name]: val }));

        } else if (name === "email") {
            val = val.replace(/[^A-Za-z0-9@._%+-]/g, "");
            const atCount = (val.match(/@/g) || []).length;
            if (atCount > 1) val = val.slice(0, -1);
            newErrors.email = validateEmail(val) ? "" : "Invalid email format";
            setFormData(prev => ({ ...prev, email: val }));

        } else if (name === "message") {
            newErrors.message = validateMessage(value);
            setFormData(prev => ({ ...prev, message: value }));
        }
        
        setErrors(newErrors);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const firstNameValid = validateName(formData.firstName);
        const lastNameValid = validateName(formData.lastName);
        const mobileValid = validateMobile(formData.mobile);
        const emailValid = validateEmail(formData.email);
        const messageError = validateMessage(formData.message);
        const allValid = firstNameValid && lastNameValid && mobileValid && emailValid && messageError === "";

        if (!allValid) {
            setStatus("❌ Please correct the errors before submitting");
            setErrors({
                firstName: firstNameValid ? "" : "Only letters and spaces, min 2 characters",
                lastName: lastNameValid ? "" : "Only letters and spaces, min 2 characters",
                mobile: mobileValid ? "" : "Invalid mobile number",
                email: emailValid ? "" : "Invalid email format",
                message: messageError, 
            });
            return;
        }

        setStatus("Sending...");
        try {
            await addDoc(collection(db, "contactRequests"), {
                ...formData,
                createdAt: serverTimestamp(),
            });
            setStatus("✅ Your message has been sent successfully!");
            setFormData({ firstName: "", lastName: "", mobile: "", email: "", message: "" });
            setErrors({ firstName: "", lastName: "", mobile: "", email: "", message: "" });
        } catch (error) {
            console.error("Firebase submission error:", error);
            setStatus("❌ Failed to send your message. Please try again.");
        }
    };

    const inputClass = (fieldError) =>
        `p-2 sm:p-3 w-full rounded border transition-colors duration-500
        ${fieldError ? "border-red-500" : "border-emerald-200"}
        ${currentTheme.includes('dark')
            ? "bg-emerald-900/50 text-emerald-100 placeholder-emerald-200 backdrop-blur-sm"
            : "bg-emerald-50/50 text-emerald-900 placeholder-emerald-400 backdrop-blur-sm"}`;

    return (
        <main style={{ paddingTop: `${navbarHeight}px` }} className="font-sans transition-colors duration-500">
            <div className="container mx-auto max-w-7xl">
                <div className={`backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-8 space-y-6 sm:space-y-8
                    grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-2 sm:mt-4 transition-colors duration-500
                    ${currentTheme.includes('dark') ? 'bg-gray-950/60 text-white' : 'bg-emerald-50/50 text-emerald-900'}`}>

                    {/* Contact Form */}
                    <div className="space-y-4 sm:space-y-6 order-1 md:order-2">
                        <h2 className={`text-2xl sm:text-3xl md:text-3xl font-extrabold text-center 
                            ${currentTheme.includes('dark') ? 'text-emerald-300' : 'text-emerald-900'}`}>
                            CONTACT US
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            {/* Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="flex flex-col">
                                    <input type="text" name="firstName" placeholder="First Name *"
                                        value={formData.firstName} onChange={handleChange} className={inputClass(errors.firstName)} required />
                                    {errors.firstName && <span className="text-red-500 text-sm mt-1">{errors.firstName}</span>}
                                </div>
                                <div className="flex flex-col">
                                    <input type="text" name="lastName" placeholder="Last Name *"
                                        value={formData.lastName} onChange={handleChange} className={inputClass(errors.lastName)} required />
                                    {errors.lastName && <span className="text-red-500 text-sm mt-1">{errors.lastName}</span>}
                                </div>
                            </div>

                            {/* Mobile & Email */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="flex flex-col">
                                    <div className="flex items-center">
                                        <span className={`mr-2 ${currentTheme.includes('dark') ? 'text-emerald-300' : 'text-emerald-700'}`}>+972</span>
                                        <input type="tel" name="mobile" placeholder="Mobile No *"
                                            value={formData.mobile} onChange={handleChange} className={`${inputClass(errors.mobile)} flex-1`} required />
                                    </div>
                                    {errors.mobile && <span className="text-red-500 text-sm mt-1">{errors.mobile}</span>}
                                </div>
                                <div className="flex flex-col">
                                    <input type="text" name="email" placeholder="Email ID *"
                                        value={formData.email} onChange={handleChange} className={inputClass(errors.email)} required />
                                    {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email}</span>}
                                </div>
                            </div>

                            {/* Message */}
                            <div className="flex flex-col">
                                <textarea name="message" placeholder={`Message * (min ${MIN_MESSAGE_LENGTH}, max ${MAX_MESSAGE_LENGTH} characters)`} rows={4} maxLength={MAX_MESSAGE_LENGTH}
                                    value={formData.message} onChange={handleChange} className={inputClass(errors.message)} required></textarea>
                                {errors.message && <span className="text-red-500 text-sm mt-1">{errors.message}</span>}
                                <p className={`text-right text-sm mt-1 ${formData.message.length >= MAX_MESSAGE_LENGTH ? 'text-red-500' : currentTheme.includes('dark') ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                    {formData.message.length}/{MAX_MESSAGE_LENGTH}
                                </p>
                            </div>

                            <button type="submit" className="w-full p-3 sm:p-3 bg-emerald-700 text-white rounded hover:bg-emerald-800 transition-all">
                                Submit
                            </button>
                        </form>

                        {status && <p className={`text-center mt-2 sm:mt-4 font-bold ${currentTheme.includes('dark') ? 'text-emerald-300' : 'text-emerald-900'}`}>{status}</p>}
                    </div>

                    {/* Info Section - Unchanged */}
                    {/* ... (rest of the Info Section) ... */}
                    <div className="space-y-6 sm:space-y-8 order-2 md:order-1">
                        <h2 className={`text-2xl sm:text-3xl md:text-3xl font-extrabold mb-4 sm:mb-6 ${currentTheme.includes("dark") ? "text-emerald-300" : "text-emerald-900"}`}>
                            Get In Touch With Us Now!
                        </h2>
                        {/* Mission */}
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="text-3xl p-2 rounded-full text-white">🎯</div>
                            <div>
                                <h3 className={`font-extrabold text-lg sm:text-xl md:text-xl mb-1 sm:mb-2 ${currentTheme.includes("dark") ? "text-emerald-300" : "text-emerald-900"}`}>
                                    Our Mission
                                </h3>
                                <p className={`text-lg font-serif transition-colors duration-500 ${currentTheme.includes("dark") ? "text-emerald-50" : "text-emerald-800"}`}>
                                    Our <strong>M</strong>ission is to help communities protect lakes and nature by reporting pollution.
                                </p>
                            </div>
                        </div>

                        {/* How to Get Involved */}
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="text-3xl p-2 rounded-full text-white">🤝</div>
                            <div>
                                <h3 className={`font-extrabold text-lg sm:text-xl md:text-xl mb-1 sm:mb-2 ${currentTheme.includes("dark") ? "text-emerald-300" : "text-emerald-900"}`}>
                                    How to Get Involved
                                </h3>
                                <p className={`text-lg font-serif transition-colors duration-500 ${currentTheme.includes("dark") ? "text-emerald-50" : "text-emerald-800"}`}>
                                    You can contribute by uploading pollution reports, <strong>V</strong>olunteering for cleanup events, and spreading awareness. Every action counts!
                                </p>
                            </div>
                        </div>

                        {/* Together */}
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="text-3xl p-2 rounded-full text-white">🌍</div>
                            <div>
                                <h3 className={`font-extrabold text-lg sm:text-xl md:text-xl mb-1 sm:mb-2 ${currentTheme.includes("dark") ? "text-emerald-300" : "text-emerald-900"}`}>
                                    Together, We Can Make a Difference
                                </h3>
                                <p className={`text-lg font-serif transition-colors duration-500 ${currentTheme.includes("dark") ? "text-emerald-50" : "text-emerald-800"}`}>
                                    <strong>W</strong>e believe your reports are vital in helping local organizations and authorities respond quickly to environmental issues. Together, we can make a difference.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}