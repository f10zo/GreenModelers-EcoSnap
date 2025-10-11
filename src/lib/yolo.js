// src/lib/yolo.js
"use client";

import * as cocossd from "@tensorflow-models/coco-ssd";

let yoloModel = null;

/**
 * Load COCO-SSD model once
 * @returns {Promise<Object>} - The loaded COCO-SSD model
 */
const loadYoloModel = async () => {
    if (!yoloModel) {
        yoloModel = await cocossd.load();
        console.log("✅ YOLO (COCO-SSD) model loaded");
    }
    return yoloModel;
};

/**
 * Detect objects in an image file and return an array of labels
 * @param {File} file - The image file
 * @returns {Promise<string[]>} - List of detected object labels
 */
export async function detectObjects(file) {
    if (!file) return [];

    // Convert file to HTMLImageElement
    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const img = new Image();
    img.src = dataUrl;

    await new Promise((resolve) => {
        img.onload = resolve;
    });

    // Load model (cached)
    const model = await loadYoloModel();

    // Detect objects
    const predictions = await model.detect(img);

    // Return only the class names (labels), no duplicates
    return [...new Set(predictions.map(pred => pred.class))];
}
