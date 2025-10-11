"use client";

import * as tf from "@tensorflow/tfjs";

// Global model variable
let model = null;

/**
 * Load CircularNet model from public folder
 * @returns {Promise<tf.GraphModel>}
 */
export const loadCircularNetModel = async () => {
    if (!model) {
        model = await tf.loadGraphModel("/circularnet/model.json"); // Ensure model.json is in public/circularnet
        console.log("✅ CircularNet model loaded");
    }
    return model;
};

/**
 * Convert image File to tensor suitable for the model
 * @param {File} file
 * @returns {Promise<tf.Tensor4D>}
 */
const fileToTensor = async (file) => {
    // Convert file to Data URL
    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    // Create image element
    const img = new Image();
    img.src = dataUrl;

    // Wait until image is loaded
    await new Promise((resolve) => {
        img.onload = resolve;
    });

    // Convert to tensor and preprocess
    let tensor = tf.browser.fromPixels(img).toFloat();

    // ✅ Resize to model input (32x32) instead of 224x224
    tensor = tf.image.resizeBilinear(tensor, [32, 32]);

    // Add batch dimension and normalize to [0,1]
    tensor = tensor.expandDims(0).div(255.0);

    return tensor;
};

/**
 * Run CircularNet on an image file and return detected trash labels
 * @param {File} file - Image file
 * @returns {Promise<string[]>} - Detected trash object labels
 */
export const detectCircularNetObjects = async (file) => {
    if (!file) return [];

    const tensor = await fileToTensor(file);
    const model = await loadCircularNetModel();

    // Predict probabilities
    const predictions = await model.predict(tensor).data();

    // Map predictions to labels
    const labels = ["plastic_bottle", "can", "paper", "other_trash"];
    const detected = [];

    predictions.forEach((prob, idx) => {
        if (prob > 0.5) detected.push(labels[idx]);
    });

    return detected;
};

/**
 * Optional: run prediction and return full probabilities for all labels
 * @param {File} file - Image file
 * @returns {Promise<{label: string, probability: number}[]>}
 */
export const predictCircularNetFull = async (file) => {
    if (!file) return [];

    const tensor = await fileToTensor(file);
    const model = await loadCircularNetModel();

    const predictions = await model.predict(tensor).data();
    const labels = ["plastic_bottle", "can", "paper", "other_trash"];

    return labels.map((label, idx) => ({
        label,
        probability: predictions[idx],
    }));
};
