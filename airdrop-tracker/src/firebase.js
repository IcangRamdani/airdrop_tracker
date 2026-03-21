import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAyUDgROJvSpLCbbT3j40HwYjcY3Znk2Sc",
  authDomain: "airdrop-tracker-c88fe.firebaseapp.com",
  projectId: "airdrop-tracker-c88fe",
  storageBucket: "airdrop-tracker-c88fe.firebasestorage.app",
  messagingSenderId: "641267840674",
  appId: "1:641267840674:web:429297fdd897eb2c2049fb",
  measurementId: "G-VH97BDQ73M"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);