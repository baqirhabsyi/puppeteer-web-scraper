// Import Dependencies
const puppeteer = require('puppeteer');
const fs = require('fs');
const savetofirebase = require('../operations/savetofirestore');

async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });

  let OLD_CITY_SELECTOR, OLD_SEARCH_HOTEL_SELECTOR, HOTEL_SELECTOR;

  OLD_CITY_SELECTOR = '#hotelSourceArea > div.tv-search-result-input-container > input';
  HOTEL_SELECTOR = '#multiSearchContainerTabs > li:nth-child(2) > a > span';
  OLD_AUTOCOMPLETE_SUGGESTION_SELECTOR = '#hotelSourceArea > div.widgetAcResult > div.widgetAcResultRow.active > div > div.tv-hotel-autocomplete-top-content > div.tv-hotel-autocomplete-title > strong';
  OLD_SEARCH_HOTEL_SELECTOR = '#searchHotelSubmit';
  const AUTO_COMPLETE_SELECTOR = '#hotelSourceArea > div.widgetAcResult > div.widgetAcResultRow.active';
  const TEST = '#hotelSourceArea > div.widgetAcResult > div:nth-child(2) > div';

  const page = await browser.newPage();

  console.log('gantwang')
  await page.goto('https://www.traveloka.com/en/old', {
    timeout: 3000000
  });

  //await page.waitForNavigation({timeout: 0});

  await page.waitFor(5000);

  const CITY = 'Jakarta, Indonesia';

  const cnlto = '#desktop-topbar > header > div._2IQBe._20UM-._3tdyJ > div._1j6c6._25Fug._3YnO_._7UTJP > svg';
  
  

  //await page.waitForSelector(HOTEL_SELECTOR);
  await page.click(HOTEL_SELECTOR);
  await console.log('click hotel tab');
  await page.click(OLD_CITY_SELECTOR);
  await console.log('kelar click city textbox');
  await page.keyboard.type(CITY);
  await console.log('kelar typing city');
  await console.log('clicked autocomplete suggestion');
  await page.waitFor(1000);
  await page.keyboard.press('Enter');
  await page.waitFor(1000);
  await page.click(OLD_SEARCH_HOTEL_SELECTOR, { clickCount: 2 });
  await console.log('clicked autocomplete suggestion');
  await page.waitFor(20000);

  const numPages = await getNumPages(page);
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

  let data = [];

  for (let h = 1; h <= numPages; h++) {
    await page.waitForSelector(FIRST_IMAGE_SELECTOR, { visible: true });
    await page.waitFor(2000);

    let listLength = await page.evaluate((sel) => {
      return document.getElementsByClassName(sel).length;
    }, LENGTH_SELECTOR_CLASS);

    let nextLength = await page.evaluate((sel) => {
      return document.getElementsByClassName(sel).length;
    }, PAGE_NUMBERS_CLASS);

    await page.evaluate((sel) => {
      return document.getElementsByClassName(sel).length;
    }, )
    
    console.log('Page nomor: ', h)
    console.log(listLength);
    console.log(nextLength);
    let nextIndex = undefined;
    if (h == 1 || h == 2 || h == numPages - 1 || h == numPages) {
      nextIndex = 8;
    } else if (h == 3 || h == numPages - 2) {
      nextIndex = 9;
    } else if (h >= 4 && h <= numPages - 3) {
      nextIndex = 10;
    }


    console.log(nextIndex);

    for (let i = 1; i <= listLength; i++) {
      let hotelNameSelector = HOTEL_NAME_SELECTOR.replace('INDEX', i);
      let hotelPriceSelector = HOTEL_PRICE_SELECTOR.replace('INDEX', i);
      let hotelRateStarSelector = HOTEL_RATE_STAR_SELECTOR.replace('INDEX', i);
      let hotelRateTraveSelector = HOTEL_RATE_TRAVE_SELECTOR.replace('INDEX', i);
      let hotelRateTripAdvSelector = HOTEL_RATE_TRIPADVISOR_SELECTOR.replace('INDEX', i);
      let hotelImageUrlSelector = HOTEL_IMAGE_URL_SELECTOR.replace('INDEX', i);

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
            return document.body.querySelector(sel).getAttribute("content");
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
          return document.body.querySelector(sel).getAttribute("src").substring(59, 62);
        } catch (error) {
          return null;
        }
      }, hotelRateTripAdvSelector);

      let hotelImageUrl = await page.evaluate((sel) => {
        try {
          return document.body.querySelector(sel).getAttribute("src");
        } catch (error) {
          return null;
        }
      }, hotelImageUrlSelector);

      if (hotelName != null) {
        const datas = {
          "hotelName": hotelName,
          "hotelPrice": hotelPrice,
          "hotelRateStar": hotelRateStar,
          "hotelRateTrave": hotelRateTrave,
          "hotelRateTripAdv": hotelRateTripAdv,
          "hotelImageUrl": hotelImageUrl
        };
        data.push(datas);
      }
    }
    await page.evaluate(() => {
      window.scrollBy(window.innerWidth, window.innerHeight);
    });

    let nextButtonSelector = NEXT_BUTTON_SELECTOR.replace('INDEX', nextIndex);
    await page.click(nextButtonSelector);
  }

  const json = await JSON.stringify(data);
  const saved = await savetofirestore('traveloka', json);

  if (saved == true) {
    console.log('Files saved to DB! \n Closing Scraper');
    await browser.close();
  } else {
    console.error('Error saving to db, saving to local file instead.');
    await fs.writeFile('../output/traveloka-hotel.json', json, err => err ? console.error('Error occured: ', err) : console.log('Results saved to JSON file!'));
    await browser.close();
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

run();
