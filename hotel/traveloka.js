// Import Dependencies
const puppeteer = require('puppeteer');
const firedb = require('../db/firestore');
const crypto = require('crypto');
const sha1 = x => crypto.createHash('sha1').update(x, 'utf8').digest('hex');
const traveLog = 'Traveloka: ';


async function run() {
  let isFinishedRun = false;

  while (isFinishedRun == false) {
    try {
      var browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
        //headless: false
      });
      
      let OLD_CITY_SELECTOR, OLD_SEARCH_HOTEL_SELECTOR, HOTEL_SELECTOR;
  
      OLD_CITY_SELECTOR = '#hotelSourceArea > div.tv-search-result-input-container > input';
      HOTEL_SELECTOR = '#multiSearchContainerTabs > li:nth-child(2) > a > span';
      OLD_AUTOCOMPLETE_SUGGESTION_SELECTOR = '#hotelSourceArea > div.widgetAcResult > div.widgetAcResultRow.active > div > div.tv-hotel-autocomplete-top-content > div.tv-hotel-autocomplete-title > strong';
      OLD_SEARCH_HOTEL_SELECTOR = '#searchHotelSubmit';
      const AUTO_COMPLETE_SELECTOR = '#hotelSourceArea > div.widgetAcResult > div.widgetAcResultRow.active';
      const TEST = '#hotelSourceArea > div.widgetAcResult > div:nth-child(2) > div';
  
      const page = await browser.newPage();
  
      // Navigating to Traveloka
      console.log(traveLog, 'Navigating to Home Page');
      await page.setViewport({ width: 1366, height: 768 });
      await page.goto('https://www.traveloka.com/en/old', {
        timeout: 3000000
      });
  
      await page.waitFor(5000);
  
      const CITY = 'Jakarta, Indonesia';
      console.log(traveLog, 'City to be searched is: ', CITY); 
  
      // Begin input city for searching
  
      await page.click(HOTEL_SELECTOR);
      await console.log(traveLog, 'Clicked hotel tab.');
      await page.click(OLD_CITY_SELECTOR);
      await console.log(traveLog, 'Clicked City Input TextBox');
      await page.keyboard.type(CITY);
      await console.log(traveLog, 'Finished typing city.');
      await page.waitFor(1000);
      await page.keyboard.press('Enter');
      await page.waitFor(1000);
      await page.click('.tv-searchButton');
      await console.log(traveLog, 'Clicked Search Button');
  
      console.log(traveLog, 'Navigating to search page...');
      await page.waitFor(20000);
  
      // Process data to be scraped
  
      const numPages = await getNumPages(page); // Get how many pages in search result
  
      const LENGTH_SELECTOR_CLASS = '_3DegG';
      const PAGE_NUMBERS_CLASS = 'fyGvr';
      const HOTEL_NAME_SELECTOR = '#desktopContentV3 > div > div > div._3Rofa.OFzKc > div:nth-child(4) > div._3mvEl > div._1mhOj > div > div:nth-child(INDEX) > div._3DegG > div:nth-child(1) > div > div > div._10tLO.tvat-hotelName';
      const HOTEL_PRICE_SELECTOR = '#desktopContentV3 > div > div > div._3Rofa.OFzKc > div:nth-child(4) > div._3mvEl > div._1mhOj > div > div:nth-child(INDEX) > div._3DegG > div._3Hvrg._3frb2.tvat-searchRoomsLoadingBar > div.gQpPC.tvat-primaryPrice';
      const HOTEL_RATE_STAR_SELECTOR = '#desktopContentV3 > div > div > div._3Rofa.OFzKc > div:nth-child(4) > div._3mvEl > div._1mhOj > div > div:nth-child(INDEX) > div._3DegG > div:nth-child(1) > div > div > div._3-_ya > div > div > meta';
      const HOTEL_RATE_TRAVE_SELECTOR = '#desktopContentV3 > div > div > div._3Rofa.OFzKc > div:nth-child(4) > div._3mvEl > div._1mhOj > div > div:nth-child(INDEX) > div._3DegG > div:nth-child(1) > div > div > div._1nj4N > div._6DkD1 > span.tvat-ratingScore';
      const HOTEL_RATE_TRIPADVISOR_SELECTOR = '#desktopContentV3 > div > div > div._3Rofa.OFzKc > div:nth-child(4) > div._3mvEl > div._1mhOj > div > div:nth-child(INDEX) > div._3DegG > div:nth-child(1) > div > div > div._1nj4N > div._3h0Xr > img';
      const HOTEL_IMAGE_URL_SELECTOR = '#desktopContentV3 > div > div > div._3Rofa.OFzKc > div:nth-child(4) > div._3mvEl > div._1mhOj > div > div:nth-child(INDEX) > div._3DegG > div:nth-child(1) > div > img';
      const NEXT_BUTTON_SELECTOR = '#desktopContentV3 > div > div > div._3Rofa.OFzKc > div:nth-child(4) > div._3mvEl > div._1mhOj > div > div._1ihZF._2zINZ > div:nth-child(INDEX)';
      const FIRST_IMAGE_SELECTOR = '#desktopContentV3 > div > div > div._3Rofa.OFzKc > div:nth-child(4) > div._3mvEl > div._1mhOj > div > div:nth-child(1) > div._3DegG > div:nth-child(1) > div > img';
      const HOTEL_ITEM_CLICK_SELECTOR = '#desktopContentV3 > div > div > div._3Rofa.OFzKc > div:nth-child(4) > div._3mvEl > div._1mhOj > div > div:nth-child(INDEX)';
  
      let data = []; // Declare variable to store scraping data.
  
      // Loop through number of pages
      for (let h = 1; h <= numPages; h++) { 
  
        // Wait for first item has loaded
        await page.waitForSelector(FIRST_IMAGE_SELECTOR, { visible: true }); 
        await page.waitFor(2000);
  
        // Get number of items inside a page
        let listLength = await page.evaluate((sel) => {
          return document.getElementsByClassName(sel).length;
        }, LENGTH_SELECTOR_CLASS);
  
        // Get Index of next button
        let nextLength = await page.evaluate((sel) => {
          return document.getElementsByClassName(sel).length;
        }, PAGE_NUMBERS_CLASS);

        console.log(traveLog, 'Page number: ', h);
        console.log(traveLog, 'Number of items in page: ', listLength);
        //console.log(nextLength);//
        let nextIndex = undefined;
        if (h == 1 || h == 2 || h == numPages - 1 || h == numPages) {
          nextIndex = 8;
        } else if (h == 3 || h == numPages - 2) {
          nextIndex = 9;
        } else if (h >= 4 && h <= numPages - 3) {
          nextIndex = 10;
        }
  
        //console.log(nextIndex);
        
        // Loop through item to scrape the items
        for (let i = 1; i <= listLength; i++) {
          let hotelNameSelector = HOTEL_NAME_SELECTOR.replace('INDEX', i);
          let hotelPriceSelector = HOTEL_PRICE_SELECTOR.replace('INDEX', i);
          let hotelRateStarSelector = HOTEL_RATE_STAR_SELECTOR.replace('INDEX', i);
          let hotelRateTraveSelector = HOTEL_RATE_TRAVE_SELECTOR.replace('INDEX', i);
          let hotelRateTripAdvSelector = HOTEL_RATE_TRIPADVISOR_SELECTOR.replace('INDEX', i);
          let hotelImageUrlSelector = HOTEL_IMAGE_URL_SELECTOR.replace('INDEX', i);
          let hotelItemClickSelector = HOTEL_ITEM_CLICK_SELECTOR.replace('INDEX', i);
  
          let hotelName = await page.evaluate((sel) => {
            let element = document.querySelector(sel);
            return element ? element.innerHTML : null;
          }, hotelNameSelector);
  
          let hotelPrice = await page.evaluate((sel) => {
            let element = document.querySelector(sel);
            return element ? element.innerHTML.replace('Rp ', '').replace('.', '') : null;
          }, hotelPriceSelector);
  
          let hotelRateStar = await page.evaluate((sel) => {
            try {
              return document.body.querySelector(sel).getAttribute('content');
            } catch (error) {
              return null;
            }
          }, hotelRateStarSelector);
  
          let hotelRateTrave = await page.evaluate((sel) => {
            let element = document.querySelector(sel);
            return element ? element.innerHTML : null;
          }, hotelRateTraveSelector);
  
          let hotelRateTripAdv = await page.evaluate((sel) => {
            try {
              return document.body.querySelector(sel).getAttribute('src').substring(59, 62);
            } catch (error) {
              return null;
            }
          }, hotelRateTripAdvSelector);
  
          let hotelImageUrl = await page.evaluate((sel) => {
            try {
              return document.body.querySelector(sel).getAttribute('src');
            } catch (error) {
              return null;
            }
          }, hotelImageUrlSelector);
  
          if (hotelName != null) {
            const datas = {
              'hotelName': hotelName,
              'hotelPrice': hotelPrice,
              'hotelRateStar': hotelRateStar,
              'hotelRateTrave': hotelRateTrave,
              'hotelRateTripAdv': hotelRateTripAdv,
              'hotelImageUrl': hotelImageUrl,
              'hotelCity': CITY
            };
            data.push(datas); // Push the scraped data to the array
          }
        }
        await page.evaluate(() => {
          window.scrollBy(window.innerWidth, window.innerHeight);
        });
  
        let nextButtonSelector = NEXT_BUTTON_SELECTOR.replace('INDEX', nextIndex);
        await page.click(nextButtonSelector);
      }

      await saveToFirestore(data);
			
      console.log(traveLog, 'Finished Saving to Database');
      isFinishedRun = true;
      await browser.close();
    } catch (error) {
      console.error('Error occured: ', error);
      console.log(traveLog, 'Trying to scrape again');
      browser.close();
    }
  }
  
}

async function saveToFirestore(data) {
  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    const { hotelName } = item;
    const hashedName = sha1(hotelName);
    firedb.collection('traveloka')
      .doc(hashedName)
      .set(item)
      .then(() => console.log(traveLog, 'Added ', hotelName, ' to the database.'))
      .catch((error) => {
        console.error(traveLog, 'Error writing document: ', error);
        return false;
      });
  }
}

async function getNumPages(page) {
  const LAST_NUM_SELECTOR = '#desktopContentV3 > div > div > div._3Rofa.OFzKc > div:nth-child(4) > div._3mvEl > div._1mhOj > div > div._1ihZF._2zINZ > div:nth-child(7)';
  await page.waitForSelector(LAST_NUM_SELECTOR, { visible: true });
  let inner = await page.evaluate((sel) => {
    let html = document.querySelector(sel).innerHTML;

    return html.trim();
  }, LAST_NUM_SELECTOR);

  const numPages = parseInt(inner);

  console.log('Number of Pages: ', numPages);
  
  return numPages;
}

module.exports = run;
