const puppeteer = require('puppeteer');
const _ = require('lodash');
const moment = require('moment');
const crypto = require('crypto');
const sha1 = x => crypto.createHash('sha1').update(x, 'utf8').digest('hex');

async function run() {
  let isFinishedRun = false;
  
  while (isFinishedRun == false) {
    try {
      var browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      // Get Date
      const currentYear = moment().format('YYYY');
      const currentMonth = moment().format('M');
      const currentDay = moment().format('D');
      
      const page = await browser.newPage();
      const url = 'https://www.pegipegi.com/hotel/CITY/1.html?stayYear=YEAR&stayMonth=MONTH&stayDay=DAY&stayCount=2&roomCrack=100000';
      const CITY = 'Jakarta';

      let navigatingUrl = url.replace('CITY', CITY).replace('YEAR', currentYear).replace('MONTH', currentMonth).replace('MONTH', currentMonth).replace('DAY', currentDay);
      // Navigate to pegipegi.com
      console.log('Navigating to pegipegi.com');
      await page.setViewport({ width: 1366, height: 768 });
      await page.goto(navigatingUrl, { timeout: 3000000 });

      const numPages = await getNumPages(page);
      console.log('Number of Pages is: ', numPages);

      // Assign Selectors for detecting page load
      const FIRST_ITEM_SELECTOR = '#hotel-search-result > div.widget.listResult > div:nth-child(1) > a';
      const LENGTH_SELECTOR_CLASS = 'imageHotel';

      // Assign selectors for data scraping
      const HOTEL_NAME_SELECTOR = '#hotel-search-result > div.widget.listResult > div:nth-child(INDEX) > div.right > div.contentLeft > div.title';
      const ALTERNATE_HOTEL_NAME_SELECTOR = '#hotel-search-result > div.widget.listResult > div:nth-child(INDEX) > a > span';
      const HOTEL_PRICE_SELECTOR = '#hotel-search-result > div.widget.listResult > div:nth-child(INDEX) > div.right > div.contentRight > div.contentPrice > div.diskonPrice.formButton';
      const HOTEL_RATING_SELECTOR = '#hotel-search-result > div.widget.listResult > div:nth-child(INDEX) > div.right > div.contentRight > div.ratingList > span.ratingLeft';
      const HOTEL_URL_SELECTOR = '#hotel-search-result > div.widget.listResult > div:nth-child(INDEX) > a';
                                  

      let datas = []; // Array to store scraping data

      for (let h = 1; h <= numPages; h++) {
        console.log('Page number: ', h, ' of ', numPages);
        // Wait for first item has loaded
        await page.waitForSelector(FIRST_ITEM_SELECTOR, { visible: true }) ;

        // Get number of items inside the page
        let listLength = await page.evaluate((sel) => {
          return document.getElementsByClassName(sel).length;
        }, LENGTH_SELECTOR_CLASS);

        console.log('There are ', listLength, ' number of items inside this page.');

        // Get from all items
        for (let i = 1; i <= listLength; i++) {
          let hotelNameSelector = HOTEL_NAME_SELECTOR.replace('INDEX', i);
          let hotePriceSelector = HOTEL_PRICE_SELECTOR.replace('INDEX', i);
          let hotelRatingSelector = HOTEL_RATING_SELECTOR.replace('INDEX', i);
          let hotelUrlSelector = HOTEL_URL_SELECTOR.replace('INDEX', i);

          let hotelName = await page.evaluate((sel) => {
            let element = document.querySelector(sel);
            return element ? element.innerText : null;
          }, hotelNameSelector);

          let hotelPrice = await page.evaluate((sel) => {
            let element = document.querySelector(sel);
            return element ? element.innerText.replace('Rp ', '').replace(',', '') : null;
          }, hotePriceSelector);

          let hotelRating = await page.evaluate((sel) => {
            let element = document.body.querySelector(sel);
            return element ? element.innerHTML : null;
          }, hotelRatingSelector);

          let hotelUrl = await page.evaluate((sel) => {
            try {
              return document.body.querySelector(sel).getAttribute('href');
            } catch (error) {
              return null;
            }
          }, hotelUrlSelector);

          if (hotelName != null) {
            // Put the scraped data inside an object
            const data = {
              'hotelName': hotelName,
              'hotelPrice': hotelPrice,
              'hotelUrl': hotelUrl,
              'hotelRating': hotelRating
            };
            datas.push(data); // Push the object into the array
          }
        }
        const toBeReplaced = h + '.html';
        const nextPage = h + 1;
        const replacement = nextPage + '.html';
        navigatingUrl = navigatingUrl.replace(toBeReplaced, replacement);
        await page.goto(navigatingUrl, { timeout: 3000000 });
      }

      const json = await JSON.stringify(datas);
      console.log(datas);
      // await fs.writeFileSync('../output/pegipegi-hotel.json', json, err => err ? console.error('Error writing file to storage: ', err) : console.log('Results saved to JSON file!'));

      saveToFirestore(datas);
      
      isFinishedRun = true;
      await browser.close();
    } catch (error) {
      console.error('Error has occured: ', error);
      browser.close();
    }
  }
}

async function saveToFirestore(json) {
  const firedb = require('../db/firestore');
  const arr = _.values(json);

  for (let index = 0; index < arr.length; index++) {
    const item = arr[index];
    const { hotelName } = item;
    const hashedName = sha1(hotelName);
    firedb.collection('pegipegi').doc(hashedName).set(item)
      .then(() => console.log('Added ', hotelName, ' to the database.'))
      .catch((error) => {
        console.error('Error writing document: ', error);
      });
    console.log('Finished saving to database');
  }
}

async function getNumPages(page) {
  const TOTAL_COUNT_SELECTOR = '#hotel-search-result > div.mainSearchResult > div > input[type="hidden"]';

  let inner = await page.evaluate((sel) => {
    return document.body.querySelector(sel).getAttribute('value');
  }, TOTAL_COUNT_SELECTOR);

  const totalItems = parseInt(inner);

  return Math.ceil(totalItems / 30);
}

//run();
module.exports = run;
