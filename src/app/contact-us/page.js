"use client";

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, addDoc, onSnapshot, collection, query, where, serverTimestamp } from 'firebase/firestore';

// IMPORTANT: These global variables are provided by the environment.
// Do not modify them.
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

export default function ContactUsPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [publicMessages, setPublicMessages] = useState([]);
    const [privateMessages, setPrivateMessages] = useState([]);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [isFirebaseReady, setIsFirebaseReady] = useState(false);

    // Effect to initialize Firebase and handle authentication
    useEffect(() => {
        // Only initialize if firebaseConfig is valid
        if (firebaseConfig && Object.keys(firebaseConfig).length > 0) {
            const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
            const firestoreDb = getFirestore(app);
            const firestoreAuth = getAuth(app);
            setDb(firestoreDb);
            setAuth(firestoreAuth);
            setIsFirebaseReady(true);

            const unsubscribeAuth = onAuthStateChanged(firestoreAuth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(firestoreAuth, initialAuthToken);
                        } else {
                            await signInAnonymously(firestoreAuth);
                        }
                    } catch (error) {
                        console.error("Authentication failed:", error);
                    }
                }
                setIsAuthReady(true);
            });
            return () => unsubscribeAuth();
        }
    }, [initialAuthToken, JSON.stringify(firebaseConfig)]);

    // Effect for fetching public messages
    useEffect(() => {
        if (!userId || !db) return;

        const publicContactsRef = collection(db, 'artifacts', appId, 'public', 'data', 'contacts');
        const q = query(publicContactsRef);

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            messages.sort((a, b) => {
                const aTime = a.timestamp?.toDate() || new Date(0);
                const bTime = b.timestamp?.toDate() || new Date(0);
                return bTime - aTime;
            });
            setPublicMessages(messages);
        }, (error) => {
            console.error("Error fetching public messages:", error);
            setStatusMessage({ text: "Error loading public messages.", type: "error" });
        });

        return () => unsubscribeSnapshot();
    }, [userId, appId, db]);

    // Effect for fetching private messages for the current user
    useEffect(() => {
        if (!userId || !db) return;

        const privateContactsRef = collection(db, 'artifacts', appId, 'users', userId, 'contacts');
        const q = query(privateContactsRef);

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            messages.sort((a, b) => {
                const aTime = a.timestamp?.toDate() || new Date(0);
                const bTime = b.timestamp?.toDate() || new Date(0);
                return bTime - aTime;
            });
            setPrivateMessages(messages);
        }, (error) => {
            console.error("Error fetching private messages:", error);
            setStatusMessage({ text: "Error loading private messages.", type: "error" });
        });

        return () => unsubscribeSnapshot();
    }, [userId, appId, db]);

    const showStatusMessage = (text, type) => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage({ text: '', type: '' }), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // This check is now redundant because the button is disabled, but it's good practice
        // to keep for safety.
        if (!userId) {
            showStatusMessage("Authentication is not ready. Please wait.", "error");
            return;
        }

        setIsSubmitting(true);

        const contactData = {
            name,
            email,
            message,
            timestamp: serverTimestamp(),
            userId
        };

        let collectionPath;
        if (visibility === 'public') {
            collectionPath = `artifacts/${appId}/public/data/contacts`;
        } else {
            collectionPath = `artifacts/${appId}/users/${userId}/contacts`;
        }

        try {
            await addDoc(collection(db, collectionPath), contactData);
            showStatusMessage("Your message has been sent successfully!", "success");
            setName('');
            setEmail('');
            setMessage('');
        } catch (error) {
            console.error("Error adding document: ", error);
            showStatusMessage("An error occurred. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getMessageBoxClass = () => {
        if (statusMessage.type === 'success') return 'bg-green-100 text-green-700';
        if (statusMessage.type === 'error') return 'bg-red-100 text-red-700';
        return '';
    };

    const MessageCard = ({ contact }) => (
        <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
            <p className="font-semibold text-gray-900">{contact.name}</p>
            <p className="text-sm text-gray-500">{contact.email}</p>
            <p className="mt-2 text-gray-700">{contact.message}</p>
            {contact.timestamp && (
                <p className="mt-2 text-xs text-right text-gray-400">{new Date(contact.timestamp.toDate()).toLocaleString()}</p>
            )}
        </div>
    );
    

    return (
        <div className="bg-gray-100 min-h-screen p-8 font-sans">
            <div className="container mx-auto max-w-2xl">
                <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Get In Touch</h1>
                        <p className="text-gray-600">
                            We&apos;d love to hear from you. Fill out the form below to send us a message.
                        </p>
                        <div className="mt-4 text-xs text-gray-500 break-all">User ID: {userId || 'Authenticating...'}</div>
                    </div>

                    {statusMessage.text && (
                        <div className={`rounded-lg p-4 font-medium text-center transition-opacity duration-300 ${getMessageBoxClass()}`}>
                            {statusMessage.text}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                            <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows="4" required className="form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"></textarea>
                        </div>
                        
                        <fieldset>
                            <legend className="text-sm font-medium text-gray-700 mb-2">Message Visibility</legend>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                    <input id="public" name="visibility" type="radio" value="public" checked={visibility === 'public'} onChange={(e) => setVisibility(e.target.value)} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <label htmlFor="public" className="ml-2 text-sm text-gray-700">Public (Visible to everyone)</label>
                                </div>
                                <div className="flex items-center">
                                    <input id="private" name="visibility" type="radio" value="private" checked={visibility === 'private'} onChange={(e) => setVisibility(e.target.value)} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <label htmlFor="private" className="ml-2 text-sm text-gray-700">Private (Visible to you only)</label>
                                </div>
                            </div>
                        </fieldset>

                        <button type="submit" disabled={isSubmitting || !isAuthReady || !isFirebaseReady} className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isAuthReady ? (isSubmitting ? 'Submitting...' : 'Submit Message') : 'Authenticating...'}
                        </button>
                    </form>

                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Public Messages</h2>
                        <div className="space-y-4">
                            {isFirebaseReady ? (
                                publicMessages.length > 0 ? (
                                    publicMessages.map((contact) => (
                                        <MessageCard key={contact.id} contact={contact} />
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 mt-4">No public messages yet. Be the first to post!</div>
                                )
                            ) : (
                                <div className="text-center text-gray-500 mt-4">Loading messages...</div>
                            )}
                        </div>
                    </div>
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Your Private Messages</h2>
                        <div className="space-y-4">
                            {isFirebaseReady ? (
                                privateMessages.length > 0 ? (
                                    privateMessages.map((contact) => (
                                        <MessageCard key={contact.id} contact={contact} />
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 mt-4">No private messages found.</div>
                                )
                            ) : (
                                <div className="text-center text-gray-500 mt-4">Loading messages...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
