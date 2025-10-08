// src/lib/utils/helpers.js

/**
 * Helper function to get the current formatted date and time in Israel time.
 */
export const getCurrentDateTime = () => {
    const now = new Date();
    const options = { timeZone: "Asia/Jerusalem" };
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const israelDateInput = `${year}-${month}-${day}`;
    const israelTime = now.toLocaleTimeString("en-GB", {
        ...options,
        hour: "2-digit",
        minute: "2-digit",
    });
    return { dateInput: israelDateInput, time: israelTime };
};

/**
 * Helper function to convert a base64 string to a Blob.
 */
export const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};


/**
 * Helper function for reverse geocoding using OpenStreetMap Nominatim.
 */
export const geocodeAddress = async (latitude, longitude) => {
    // Add type check for robustness
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
                headers: {
                    "User-Agent": "EcoSnap", // Keep the required User-Agent
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch location data: ${response.status}`);
        }
        const data = await response.json();

        if (data && data.display_name) {
            // 🛑 THE CRITICAL CHANGE IS HERE 🛑
            // Return the full formatted address string.
            return data.display_name;
        } else {
            return "No address found for these coordinates.";
        }
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return "Location lookup failed (API Error).";
    }
};