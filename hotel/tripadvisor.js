const puppeteer = require('puppeteer');
const fs = require('fs');
const _ = require('lodash');

async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.setViewport({ width: 800, height: 600, isMobile: true, isLandscape: true});
  await page.goto('https://tripadvisor.com');

  const CITY_INPUT_SELECTOR = '#taplc_trip_search_home_default_0 > div.ui_columns.datepicker_box.trip_search.metaDatePicker.rounded_lockup.easyClear.usePickerTypeIcons.preDates.noDates.with_children > div.prw_rup.prw_search_typeahead.ui_column.is-3.responsive_inline_priority.search_typeahead.wctx-tripsearch > div > span > input';
  const FIND_HOTELS_BUTTON_SELECTOR = '#SUBMIT_HOTELS';
  const FIRST_IMAGE_SELECTOR = '#taplc_hsx_hotel_list_lite_dusty_hotels_combined_sponsored_0 > div:nth-child(2) > div > div.meta_listing.ui_columns.is-mobile > div.ui_column.is-4.thumbnail-column > div > div:nth-child(1) > div > div.aspect.is-shown-at-tablet > div';
  const NEXT_BUTTON_SELECTOR = '#taplc_main_pagination_bar_dusty_hotels_resp_0 > div > div > div > a';
  const DATE_PICK_CLOSE_SELECTOR = '#BODY_BLOCK_JQUERY_REFLOW > span > div.body_text > div > div > div.rsdc-title > div';
  const CLOSE_SURVEY_SELECTOR = '#BODY_BLOCK_JQUERY_REFLOW > div.QSISlider.SI_cI4TogBwm0kQBwN_SliderContainer > div:nth-child(9) > div';
  

  const city = 'Jakarta';

  await page.waitForSelector(FIND_HOTELS_BUTTON_SELECTOR, {
    timeout: 0
  });

  await page.click(CITY_INPUT_SELECTOR);
  await page.waitFor(1000);
  await page.keyboard.type(city);
  await page.waitFor(1000);
  await page.click(FIND_HOTELS_BUTTON_SELECTOR);
  await page.waitForNavigation();

  await page.waitFor(1000);
  const closeSelector = '#taplc_hsx_special_messaging_dusty_hotels_0 > div > div > div.prw_rup.prw_hotels_special_message > div > span.close.ui_icon.times';
  await page.click(closeSelector);
  // const datePickCloseVis = await checkSelectorVisibility(page, DATE_PICK_CLOSE_SELECTOR);
  // if (datePickCloseVis != null) {
  //   await page.click(DATE_PICK_CLOSE_SELECTOR);
  //   await page.waitFor(1000);
  // }

  console.log('Sebelum getNumPages');
  const numPages = await getNumPages(page);
  
  let datas = [];

  const LENGTH_SELECTOR_CLASS = 'listing';
  for (let h = 1; h <= numPages; h++) {
    console.log('Page number: ', h);
    await page.waitForSelector(FIRST_IMAGE_SELECTOR, { visible: true });
    await page.waitFor(1000);

    //const datab = await getInfo(page);
    // Different Strat for Tripadvisor cos' they have weird selector naming
    // Might have to resort to Umar's way of using the classes and get the items from it
    const kontol = await page.$$('.listing');
    const penis = _.values(kontol);
    // penis.forEach(tutut => {
    //   console.log(tutut);
    // })

    // const perangBintang = await page.$$eval('.listing');
    // const vader = _.values(perangBintang);
    // console.log(vader);

    //console.log(kontol);
    //console.log(JSON.stringify(kontol));
    let hotels = await page.evaluate(() => {
      return document.querySelectorAll('.listing');
    });
    //console.log(JSON.stringify(hotels));
    const tai = await hotels.jsonValue();
    const berak = await hotels.asElement();
    const mencret = JSON.stringify(berak);
    // console.log(mencret);
    // console.log(tai.length);

    // for (let i = 0; i < hotels.length; i++) {
    //   const element = hotels[i];
    //   console.log(element);
    // }
  }
  console.log(datas)
}

async function getInfo(page) {
  const asu = 'listing';
    let listLength = await page.evaluate((sel) => {
      return document.getElementsByClassName(sel).length;
    }, asu);
    console.log(listLength)
  let datas = [];
  const HOTEL_NAME_SELECTOR = '#taplc_hsx_hotel_list_lite_dusty_hotels_combined_sponsored_0 > div:nth-child(INDEX) > div > div.meta_listing.ui_columns.is-mobile > div:nth-child(2) > div.prw_rup.prw_meta_hsx_listing_name.listing-title > div';
    const HOTEL_PRICE_SELECTOR = '#taplc_hsx_hotel_list_lite_dusty_hotels_combined_sponsored_0 > div:nth-child(INDEX) > div > div.meta_listing.ui_columns.is-mobile > div:nth-child(2) > div.main-cols > div.comm-col > div > div > div.premium_offer.ui_columns.is-mobile.is-gapless.is-multiline.withXthrough.hasStrikeThrough.bookableOffer > div.priceBlock.ui_column.is-12-tablet > div.price-wrap > div';

    for (let i = 0; i < listLength.length; i++) {
      console.log('masuk for')
      const hotelNameSelector = HOTEL_NAME_SELECTOR.replace('INDEX', i);
      const hotelPriceSelector = HOTEL_PRICE_SELECTOR.replace('INDEX', i);

      const name = await page.evaluate((sel) => {
        return document.querySelector(sel).innerText;
      }, hotelNameSelector);

      const price = await page.evaluate((sel) => {
        return document.querySelector(sel).innerText;
      }, hotelPriceSelector);
      console.log(name, ' => ', price);

      if (name != null && price != null) {
        const data = {
          hotelName: name,
          hotelPrice: price
        }
        datas.push(data);
      }
    }
    return datas;
}

async function getHotelNames(page) {
  const HOTEL_NAME_CLASS = 'price-wrap';
  let namaNama = [];
  let elements = await page.evaluateHa((sel) => {
    return document.getElementsByClassName(sel);
  }, HOTEL_NAME_CLASS);

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const nama = element.childNodes[1].text;
    console.log(nama);
    namaNama.push(nama);
  }

  return namaNama;
}

async function checkSelectorVisibility(page, selector) {
  console.log(page.$(selector));
  return page.$(selector);
}

async function getNumPages(page) {
  const LAST_NUM_CLASS = '.pageNum.last.taLnk';
  const LAST_NUM_SELECTOR = '#taplc_main_pagination_bar_dusty_hotels_resp_0 > div > div > div > div > a.pageNum.last.taLnk';

  let inner = await page.evaluate((sel) => {
    let html = document.querySelector(sel).innerHTML;
    return html.trim();
  }, LAST_NUM_SELECTOR);

  const numPages = parseInt(inner);

  console.log('Number of Pages: ', numPages);

  return numPages;
}

run();
