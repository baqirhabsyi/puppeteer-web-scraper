//async function savetofirestore(collection, data) {
  const firedb = require('../db/firestore');
  const testData = require('../output/traveloka-hotel.json');
  const _ = require('lodash');
  
  const arr = _.values(testData);

  for (let index = 0; index < arr.length; index++) {
    const item = arr[index];
    const { hotelName, hotelPrice, hotelRateStar, hotelRateTrave, hotelRateTripAdv, hotelImageUrl } = item;
    //console.log(item);
    firedb.collection('traveloka')
      .doc()
      .set(item)
      .then(() => console.log('Added ', hotelName, ' to the database.'))
      .catch((error) => console.error('Error writing document: ', error));
  }
  
  // testData && Object.keys(testData).forEach(key => {
  //   const nestedContent = testData[key];

  //   if (typeof nestedContent === 'object') {
  //     Object.keys(nestedContent).forEach(docTitle => {
  //       firedb.collection('traveloka')
  //       .doc(docTitle)
  //       .set(nestedContent[docTitle])
  //       .then((res) => {
  //         console.log('Document successfully written.');
  //       })
  //       .catch((error) => {
  //         console.error('Error writing document: ', error);
  //       });
  //     });
  //   }
  // });

  // testData.forEach(item => {
  //   firedb.collection('traveloka')
  //     .doc(item)
  // })
//}

//await savetofirestore();
