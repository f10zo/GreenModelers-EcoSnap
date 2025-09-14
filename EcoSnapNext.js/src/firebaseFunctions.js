// src/firebaseFunctions.js
import { storage, db } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs } from "firebase/firestore";

// Save a report
export async function saveReport(file, description, location, pollutionLevel, date) {
  const storageRef = ref(storage, `reports/${Date.now()}-${file.name}`);
  await uploadBytes(storageRef, file);
  const imageUrl = await getDownloadURL(storageRef);

  await addDoc(collection(db, "reports"), {
    description,
    location,
    pollution_level: pollutionLevel,
    date,
    imageUrl,
  });
}

// Get all reports
export async function getGallery() {
  const snapshot = await getDocs(collection(db, "reports"));
  return snapshot.docs.map(doc => doc.data());
}
