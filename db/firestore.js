const admin = require('firebase-admin');

var serviceAccount = require('../creds/serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://travelokadbjkt.firebaseio.com'
});

var firedb = admin.firestore();

module.exports = firedb;
