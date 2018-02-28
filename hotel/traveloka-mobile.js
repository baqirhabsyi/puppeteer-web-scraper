// Import dependencies
const puppeteer = require('puppeteer');
const firedb = require('../db/firestore');
const crypto = require('crypto');
const sha1 = x => crypto.createHash('sha1').update(x, 'utf8').digest('hex');

const tmblog = 'Traveloka Mobile: ';
const ios11UserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A356 Safari/604.1';

async function run() {
  let isFinishedRun = false;

  while (isFinishedRun == false) {
    try {
      var browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
        //headless: false
      });

      const page = await browser.newPage();

      // Navigating to traveloka
      console.log(tmblog, 'Navigating to Home Page');
      await page.setUserAgent(ios11UserAgent);
      await page.setViewport({ width: 480, height: 800 });
      await page.goto('https://m.traveloka.com/en/hotel', { timeout: 3000000 });

      await page.waitFor(5000);
      const CITY = 'Jakarta, Indonesia';
      console.log(tmblog, 'City to be searched is: ', CITY);

      // Begin input city for searching
      const HOTEL_INPUT_SELECT = '#app > div > div:nth-child(2) > div > div.UROaK > div:nth-child(1) > div > div._22dfu';
      await page.click(HOTEL_INPUT_SELECT);
      console.log(tmblog, 'Clicked Select Destination button');
      
      // Click searchbar
      await page.waitFor(1000);
      const CITY_SEARCH_BUTTON = 'body > div:nth-child(11) > span > div > div > div > input';
      await page.click(CITY_SEARCH_BUTTON);

      // Input City
      await page.keyboard.type(CITY);
      await page.waitFor(3000);
      console.log(tmblog, 'Inputted city to be searched.');
      
      // Select First Suggestion
      const FIRST_ITEM_SELECTOR = 'body > div:nth-child(11) > span > div > ul > li:nth-child(2)';
      await page.click(FIRST_ITEM_SELECTOR);
      console.log(tmblog, 'Clicked First Suggestion');

      // Click Search now button
      await page.waitFor(3000);
      const SEARCH_NOW_BUTTON_SELECTOR = '#app > div > div:nth-child(2) > div > div.UROaK > button';
      await page.click(SEARCH_NOW_BUTTON_SELECTOR);
      console.log(tmblog, 'Clicked Search Now button.');

      // Get number of pages inside
      await page.waitFor(5000);
      const numPages = await getNumPages(page);
      console.log(tmblog, 'Number of pages is: ', numPages);

      let datas = []; // Array to store scraping data

      const FIRST_IMAGE_SELECTOR = '#hotelMain > div.hotelContent > ul > li:nth-child(1) > div > div.hotelThumbWrapper > div';
      // Loop through the pages to get the items
      for (let h = 1; h <= numPages; h++) {
        // Wait for the first item to load
        console.log(tmblog, 'Page number: ', h, '/', numPages);
        await page.waitFor(2000);

        // Get number of items inside page
        const LIST_LENGTH_CLASS = '.hotelSearchResult';
        let listLength = await page.evaluate((sel) => {
          return document.querySelectorAll(sel).length;
        }, LIST_LENGTH_CLASS);
        console.log(tmblog, 'Number of items inside page is: ', listLength);

        // Get data from all items
        const HOTEL_URL_SELECTOR = '#hotelMain > div.hotelContent > ul > li:nth-child(INDEX)';
        const HOTEL_NAME_SELECTOR_ALTERNATE = '#hotelMain > div.hotelContent > ul > li:nth-child(INDEX) > div > div.hotelSearchDescription > h3';


        for (let i = 1; i <= listLength + 2; i++) {
          let hotelUrlSelector = HOTEL_URL_SELECTOR.replace('INDEX', i);
          let hotelNameSelector = HOTEL_NAME_SELECTOR_ALTERNATE.replace('INDEX', i);

          let hotelUrl = await page.evaluate((sel) => {
            try {
              return document.body.querySelector(sel).getAttribute('data-url');
            } catch (error) {
              return null;
            }
          }, hotelUrlSelector);

          let hotelName = await page.evaluate((sel) => {
            let element = document.body.querySelector(sel);
            return element ? element.innerText : null;
          }, hotelNameSelector);

          if (hotelName != null) {
            const data = {
              'hotelName': hotelName,
              'hotelUrl': hotelUrl
            };
            datas.push(data);
          }
        }

        const NEXT_BUTTON_SELECTOR = '.normalLink.hotelNextPageButton';
        const nextButton = await page.evaluate((sel) => {
          try {
            return document.body.querySelector(sel).getAttribute('href');
          } catch (error) {
            return null;
          }
        }, NEXT_BUTTON_SELECTOR);

        if (nextButton != null) {
          await page.goto(nextButton);
        } else {
          console.log(tmblog, 'We\'ve reached the end of the search results.');
          break;
        }
      }

      await saveToFireStore(datas);

      isFinishedRun = true;
    } catch (error) {
      console.error(tmblog, 'Error occured: ' + error);
      console.log(tmblog, 'Trying to scrape again.');
      browser.close();
    }
  }
}

async function saveToFireStore(data) {
  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    const { hotelName } = item;
    const hashedName = sha1(hotelName);
    firedb.collection('traveloka')
      .doc(hashedName)
      .update(item)
      .then(() => console.log(tmblog, 'Added ', hotelName, ' to the database.'))
      .catch((error) => {
        console.error('Error writing document: ', error);
      });
  }
}

async function getNumPages(page) {
  const TOTAL_COUNT_SELECTOR = '#hotelMain > div.hotelContent > div.hotelPageNavWrapper > div.paginationSubtitle';

  let inner  = await page.evaluate((sel) => {
    return document.body.querySelector(sel).innerText;
  }, TOTAL_COUNT_SELECTOR);

  const strings = inner.split(' ');

  return Math.ceil(strings[1] / 18);
}

module.exports = run;
