const puppeteer = require('puppeteer');
const fs = require('fs');
const _ = require('lodash');

async function run() {
  const browser = await puppeteer.launch({
    headless: false
  });

  const page = await browser.newPage();

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
  // await page.waitFor(1000);
  // await page.keyboard.press('Enter');
  await page.waitFor(1000);
  await page.click(FIND_HOTELS_BUTTON_SELECTOR);
  await page.waitForNavigation();
  await page.waitFor(1000);
  
  const datePickCloseVis = await checkSelectorVisibility(page, DATE_PICK_CLOSE_SELECTOR);
  if (datePickCloseVis != null) {
    await page.click(DATE_PICK_CLOSE_SELECTOR);
    await page.waitFor(1000);
  }
  
  // await page.click(CLOSE_SURVEY_SELECTOR);
  // await page.waitFor(1000);

  const numPages = await getNumPages(page);
  
  let data = [];

  for (let h = 1; h <= numPages; h++) {
    console.log('Page number: ', h);
    await page.waitForSelector(FIRST_IMAGE_SELECTOR, { visible: true });
    await page.waitFor(2000);

    let listLength = await page.evaluate(() => {
      console.log('anjing');
      console.log(document.getElementsByClassName('listing').length);
    });

    // Different Strat for Tripadvisor cos' they have weird selector naming
    // Might have to resort to Umar's way of using the classes and get the items from it
    const HOTEL_NAME_CLASS = 'price.__resizeWatch';
    let hotelNames = await page.evaluate((sel) => {
      let names = []
      let elements = document.getElementsByClassName(sel);
      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        const nama = element.innerHTML;
        console.log(nama);
        names.push(name);
      }
      return names;
    }, HOTEL_NAME_CLASS);
    await console.log(hotelNames);
  }
}

async function checkSelectorVisibility(page, selector) {
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
