// src/lib/utils/exifUtils.js

/**
 * Converts Degrees, Minutes, Seconds (DMS) format from EXIF data to Decimal Degrees (DD).
 * @param {Array<number>} dmsArray - [Degree, Minute, Second]
 * @param {string} direction - 'N', 'S', 'E', or 'W'
 * @returns {number} Decimal Degrees
 */
export function dmsToDecimal(dmsArray, direction) {
    if (!dmsArray || dmsArray.length < 3) return null;

    // The EXIF library often returns coordinates as rational numbers (e.g., [1234, 100]), 
    // so we divide numerator by denominator to get the float value.
    const degree = dmsArray[0][0] / dmsArray[0][1];
    const minute = dmsArray[1][0] / dmsArray[1][1];
    const second = dmsArray[2][0] / dmsArray[2][1];

    let decimal = degree + (minute / 60) + (second / 3600);

    // If South or West, the decimal value should be negative
    if (direction === 'S' || direction === 'W') {
        decimal *= -1;
    }

    return parseFloat(decimal.toFixed(6)); // Keep 6 decimal places for precision
}

/**
 * Extracts GPS coordinates from EXIF data.
 * @param {object} exifData - The parsed EXIF object containing all tags.
 * @returns {{lat: number, lon: number} | null} Latitude and Longitude in Decimal Degrees
 */
export function extractGeolocation(exifData) {
    // Check if GPS data exists
    if (!exifData || !exifData.GPS) {
        return null;
    }

    const gpsData = exifData.GPS;

    const lat = dmsToDecimal(gpsData.GPSLatitude, gpsData.GPSLatitudeRef);
    const lon = dmsToDecimal(gpsData.GPSLongitude, gpsData.GPSLongitudeRef);

    // Return null if either coordinate is invalid
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
        return null;
    }

    return { lat, lon };
}