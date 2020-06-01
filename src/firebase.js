const fb = require('firebase-admin')
const serviceAccount = require("../serviceAccountKey.json")

fb.initializeApp({
  credential: fb.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.FIREBASE_APP}.firebaseio.com`
})

module.exports.db = () => fb.firestore()

module.exports.profilesRef = () => fb.firestore().collection("profiles")

module.exports.jobsRef = () => fb.firestore().collection("jobs")
