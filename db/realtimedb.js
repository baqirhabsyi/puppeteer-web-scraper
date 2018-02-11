const admin = require('firebase-admin');

const serviceAccount = require('../creds/serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://travelokadbjkt.firebaseio.com'
});

const firertdb = admin.database();

module.exports = firertdb;
