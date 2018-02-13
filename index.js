const crypto = require('crypto');
const sha1 = x => crypto.createHash('sha1').update(x, 'utf8').digest('hex');

console.log(sha1('The Grove Suites Jakarta'));

const firedb = require('./db/firestore');
const hotel = 'The Grove Suites Jakarta';

const traveRef = firedb.collection('traveloka');
const pegiRef = firedb.collection('pegipegi');

const qntlo = traveRef.where('hotelName', '==', hotel).get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
    });
  })
  .catch(err => console.log('Error getting documents', err));

const tytyd = pegiRef.where('hotelName')