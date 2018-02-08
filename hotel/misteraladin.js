// Import Dependencies
const puppeteer = require('puppeteer');
const fs = require('fs');
const firedb = require('../db/firestore');
const _ = require('lodash');

async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: 1280,
    height: 720
  });

  await page.goto('https://www.misteraladin.com/', {
    timeout: 3000000
  });

  const CITY = 'Jakarta, Indonesia';
  const CITY_INPUT_SELECTOR = '#search';

  const SEE_ALL_JAKARTA_SELECTOR = '#site-content > div.section.top-destination.w-100 > div > div > div.popular-destinations-content > div > div:nth-child(3) > a';
  await page.click(SEE_ALL_JAKARTA_SELECTOR, { delay: 1000 });

  const FIRST_IMAGE_SELECTOR = '#main > div.hotel-results.wide-tpl > div > article:nth-child(1) > div.product-item_top > a > div';
  await page.waitForSelector(FIRST_IMAGE_SELECTOR);

  const pageNumber = await getPageNumber(page);

  console.log('There are ', pageNumber, ' pages of hotels.')

  const HOTEL_NAME_SELECTOR = '#main > div.hotel-results.wide-tpl > div > article:nth-child(INDEX) > div.product-item_middle > div > a > div:nth-child(1) > div > h3';
  const HOTEL_PRICE_SELECTOR = '#main > div.hotel-results.wide-tpl > div > article:nth-child(INDEX) > div.product-item_bottom > div.row.justify-content-between.align-items-center.product-item_room-cheapest > div.col-6.text-right > div > div:nth-child(2)';

  let datas = [];

  for (let h = 1; h <= pageNumber; h++) {
    console.log('Page number: ', h);
    const NEXT_BUTTON_SELECTOR = '.btn.btn-next';
    const LAYAR_ANJING_SELECTOR = '.ematic_closeExitIntentOverlay_2';
    const ALTERNATE_NEXT_BUTTON_SELECTOR = '.fa.fa-fw.fa-angle-double-right';

    try {
      await page.click(LAYAR_ANJING_SELECTOR);
      const listLength = await page.evaluate(() => {
        return document.getElementsByClassName('product-item').length;
      });
      console.log('Number of items in page: ', listLength);

      await page.hover(NEXT_BUTTON_SELECTOR);
      await page.waitFor(1000);
      await page.hover(FIRST_IMAGE_SELECTOR);

      await getItems(page, listLength, HOTEL_NAME_SELECTOR, HOTEL_PRICE_SELECTOR, FIRST_IMAGE_SELECTOR, datas);
      await page.waitForSelector(NEXT_BUTTON_SELECTOR, { visbile: true });

      await page.hover(NEXT_BUTTON_SELECTOR);
      await page.waitFor(3000);
      await page.click(NEXT_BUTTON_SELECTOR, { delay: 500 });

    } catch (error) {
      const listLength = await page.evaluate(() => {
        return document.getElementsByClassName('product-item').length;
      });
      console.log('Number of items in page: ', listLength);
      await getItems(page, listLength, HOTEL_NAME_SELECTOR, HOTEL_PRICE_SELECTOR, FIRST_IMAGE_SELECTOR, datas);
      await page.waitForSelector(NEXT_BUTTON_SELECTOR, { visbile: true });

      await page.hover(NEXT_BUTTON_SELECTOR);
      await page.waitFor(3000);
      await page.click(NEXT_BUTTON_SELECTOR, { delay: 500 });
      
    }
  }

  const json = await JSON.stringify(datas);

  await fs.writeFileSync('../output/misteraladin-hotel.json', json, err => err ? console.error('Error occured: ', err) : console.log('Results saved to JSON file!'));
  await SaveMisterAladin();

  await browser.close();
}

async function SaveMisterAladin() {
  
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

async function getItems(page, listLength, HOTEL_NAME_SELECTOR, HOTEL_PRICE_SELECTOR, FIRST_IMAGE_SELECTOR, datas) {
  for (let i = 1; i <= listLength + 5; i++) {
    await page.waitForSelector(FIRST_IMAGE_SELECTOR);
    const hotelNameSelector = HOTEL_NAME_SELECTOR.replace('INDEX', i);
    const hotelPriceSelector = HOTEL_PRICE_SELECTOR.replace('INDEX', i);
    let hotelName = await page.evaluate((sel) => {
      let element = document.querySelector(sel);
      return element ? element.innerText : null;
    }, hotelNameSelector);

    let hotelPrice = await page.evaluate((sel) => {
      let element = document.querySelector(sel);
      return element ? element.innerText : null;
    }, hotelPriceSelector);

    console.log(hotelName, ' => ', hotelPrice);

    if (hotelName != null) {
      datas.push({
        "hotelName": hotelName,
        "hotelPrice": hotelPrice
      });
    }
  }
}

async function getPageNumber(page) {
  const HOTEL_AMOUNT_SELECTOR = '#title-header-section > div > div > div.col.col-12.col-lg-9 > h1 > span:nth-child(1)';
  const numberOfHotels = await page.evaluate((sel) => {
    return document.querySelector(sel).innerText;
  }, HOTEL_AMOUNT_SELECTOR);

  const numbers = parseInt(numberOfHotels);

  console.log('Number of Hotels: ', numbers);
  return Math.ceil(numbers / 50); // Mister Aladin have around 50 items per page
}

run();
