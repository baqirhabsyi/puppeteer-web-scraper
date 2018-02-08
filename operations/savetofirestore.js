async function SaveTraveloka() {
  
  // const firedb = require('../db/firestore');
  // //const data = require();
  // const _ = require('lodash');
  
  // const arr = _.values(data);

  // for (let index = 0; index < arr.length; index++) {
  //   const item = arr[index];
  //   const { hotelName } = item;
  //   //console.log(item);
  //   firedb.collection(collection)
  //     .doc()
  //     .set(item)
  //     .then(() => console.log('Added ', hotelName, ' to the database.'))
  //     .then(() => {
  //       console.log('Success')
  //       return true;
  //     })
  //     .catch((error) => {
  //       console.error('Error writing document: ', error);
  //       return false;
  //     });
  // }
}

async function SaveMisterAladin() {
  const firedb = require('../db/firestore');
  const _ = require('lodash');
  const data = require('../output/misteraladin-hotel.json');
  const arr = _.values(data);

  for (let index = 0; index < arr.length; index++) {
    const item = arr[index];
    const { hotelName } = item;
    //console.log(item);
    firedb.collection('misteraladin')
      .doc()
      .set(item)
      .then(() => console.log('Added ', hotelName, ' to the database.'))
      .then(() => {
        console.log('Success')
        return true;
      })
      .catch((error) => {
        console.error('Error writing document: ', error);
        return false;
      });
  }
}

module.exports = {
  SaveTraveloka: SaveTraveloka(),
  SaveMisterAladin: SaveTraveloka()
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
