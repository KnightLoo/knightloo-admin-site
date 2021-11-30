// import firebase from 'firebase/app';
// import 'firebase/auth'
import { firebaseConfig } from '/config/firebaseApp.config.js'


// if (!firebase.apps.length) {
//     firebase.initializeApp(firebaseConfig);
// }

// export const auth = firebase.auth();
// export {firebase}

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);