import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC8rgs6QozunZRQ_WSHbWnQ1vdDc-mKMeI",
  authDomain: "habit-tracker-dccc6.firebaseapp.com",
  projectId: "habit-tracker-dccc6",
  storageBucket: "habit-tracker-dccc6.firebasestorage.app",
  messagingSenderId: "1095336971809",
  appId: "1:1095336971809:web:e176c5ee0bb35aa4959d60"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);