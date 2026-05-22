import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
 apiKey: "AIzaSyBP5OC6t1f8JFKRtIyUKs4XYy6mKux7DaM",
    authDomain: "healthflow-c3cf4.firebaseapp.com",
    projectId: "healthflow-c3cf4",
    storageBucket: "healthflow-c3cf4.firebasestorage.app",
    messagingSenderId: "191195014532",
    appId: "1:191195014532:web:810029bacd018fec4b29d1",
    measurementId: "G-J7RQMLKMJJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);