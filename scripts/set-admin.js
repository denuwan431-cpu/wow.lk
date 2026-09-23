// Run after creating the admin email/password user in Firebase Authentication.
// 1) Download a Firebase service-account JSON and save it as ./serviceAccount.json
// 2) Run: node scripts/set-admin.js admin@example.com
const admin=require('firebase-admin');const fs=require('fs');
const serviceAccount=require('../serviceAccount.json');
admin.initializeApp({credential:admin.credential.cert(serviceAccount)});
const email=process.argv[2];
if(!email){console.error('Usage: node scripts/set-admin.js admin@example.com');process.exit(1)}
admin.auth().getUserByEmail(email).then(u=>admin.auth().setCustomUserClaims(u.uid,{admin:true})).then(()=>{console.log('Admin claim granted. Sign out/in again in admin.html.');return admin.app().delete()}).catch(e=>{console.error(e);process.exit(1)});
