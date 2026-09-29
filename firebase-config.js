// Import Firebase App
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";


// Import Firestore
import {
    getFirestore,
    getDocs,
    collection,
    query,
    orderBy,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// Import Authentication
import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


// Import Firebase Cloud Messaging
import {
    getMessaging,
    getToken,
    onMessage,
    isSupported
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging.js";


// Firebase configuration
const firebaseConfig = {

    apiKey:
        "AIzaSyA-hR_0wDdfi8IplhiC34KQYgOiEJ0qPJY",

    authDomain:
        "iqbal-sweet-house.firebaseapp.com",

    projectId:
        "iqbal-sweet-house",

    storageBucket:
        "iqbal-sweet-house.firebasestorage.app",

    messagingSenderId:
        "991959394451",

    appId:
        "1:991959394451:web:f4e16d2d6f37de81648566"
};


// Initialize Firebase
const app =
    initializeApp(firebaseConfig);


// Firestore
const db =
    getFirestore(app);


// Authentication
const auth =
    getAuth(app);


// Firebase Messaging
let messaging = null;

try {

    if (await isSupported()) {
        messaging = getMessaging(app);
    }

}
catch (error) {

    console.log(
        "Firebase Messaging is not supported in this browser."
    );

}


// Make Firebase available to admin.html

window.firebaseDB =
    db;

window.firebaseAuth =
    auth;


// Firestore functions

window.firebaseAddDoc =
    addDoc;

window.firebaseCollection =
    collection;

window.firebaseServerTimestamp =
    serverTimestamp;

window.firebaseGetDocs =
    getDocs;

window.firebaseQuery =
    query;

window.firebaseOrderBy =
    orderBy;

window.firebaseUpdateDoc =
    updateDoc;

window.firebaseDoc =
    doc;


// Authentication functions

window.firebaseSignIn =
    signInWithEmailAndPassword;

window.firebaseAuthStateChanged =
    onAuthStateChanged;


// FCM functions

window.firebaseMessaging =
    messaging;

window.firebaseGetToken =
    getToken;

window.firebaseOnMessage =
    onMessage;