async function SaveToDb(collection, data) {
  const admin = require('firebase-admin');
  const serviceAccount = require('../creds/service-key.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount);
    databaseURL: 
  })
}

module.exports = SaveToDb(collection, data);