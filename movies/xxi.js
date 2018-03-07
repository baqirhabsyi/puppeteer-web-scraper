const puppeteer = require('puppeteer');
const firedb = require('../db/firestore');
const crypto = require('crypto');
const _ = require('lodash');
const moment = require('moment-timezone');
const sha1 = x => crypto.createHash('sha1').update(x, 'utf8').digest('hex');

const xxilog = 'XXI: ';
const cityList = [
  {
    cityName: 'bekasi',
    cityUrl: 'https://m.21cineplex.com/gui.list_theater.php?city_id=4'
  },
  {
    cityName: 'bogor',
    cityUrl: 'https://m.21cineplex.com/gui.list_theater.php?city_id=3'
  },
  {
    cityName: 'jakarta',
    cityUrl: 'https://m.21cineplex.com/gui.list_theater.php?city_id=10'
  },
  {
    cityName: 'tangerang',
    cityUrl: 'https://m.21cineplex.com/gui.list_theater.php?city_id=15'
  }
];

const NOW_PLAYING_URL = 'https://m.21cineplex.com/gui.list_movie.php?order=1&p=pl';

async function run() {
  moment.locale('id');
  let isFinishedRun = false;
  const currentDay = moment().tz('Asia/Jakarta').format('dddd');

  while (isFinishedRun == false) {
    try {
      var browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        //headless: false
      });

      const page = await browser.newPage();
      const urlxxi = 'https://m.21cineplex.com/';
      let nowPlaying = [];
      let theaters = [];
      let movies = [];

      // Loop through the cities listed in the array
      for(let h = 0; h < cityList.length; h++) {
        const { cityName, cityUrl } = cityList[h];

        console.log(xxilog, 'Scraping city ', cityName);
        await page.goto(cityUrl, { waitUntil: 'networkidle0' });

        //#region Get Now Playing
        console.log(xxilog, 'Going to now playing page');
        await page.goto(NOW_PLAYING_URL, { waitUntil: 'networkidle0' });
        const NOW_PLAYING_LIST_SELECTORS = '#menu_ol_arrow > li:nth-child(INDEX) > a';

        // Get the length of the items inside the list
        const itemLength = await page.evaluate(() => {
          return document.getElementsByTagName('li').length;
        });

        // Get Now Playing in the current city
        for (let a = 1; a <= itemLength; a++) {
          const nowPlayingListSelectors = NOW_PLAYING_LIST_SELECTORS.replace('INDEX', a);
          let nowPlayingTitle = await page.evaluate((sel) => {
            let element = document.body.querySelector(sel);
            return element ? element.innerText : null;
          }, nowPlayingListSelectors);

          const nowPlayingUrl = await page.evaluate((sel) => {
            try {
              return document.body.querySelector(sel).getAttribute('href');
            } catch (error) {
              return null;
            }
          }, nowPlayingListSelectors);

          if (nowPlayingTitle != null) {
            if (nowPlayingTitle.includes('( 3D)')) {
              nowPlayingTitle = nowPlayingTitle.replace('( 3D)', '(IMAX 3D)');
            }
            const data = {
              movieTitle: nowPlayingTitle,
              movieUrl: nowPlayingUrl,
              movieCity: cityName
            };

            nowPlaying.push(data);
          }
        }

        //#endregion

        //#region Get all movies data from all theaters inside the city
        // Get all theaters title and links to each theater
        const THEATERS_URL = 'https://m.21cineplex.com/gui.list_theater.php?p=th';
        await page.goto(THEATERS_URL, { waitUntil: 'networkidle0' });
        await page.waitFor(2000);
      
        const theatersLink = await page.evaluate((cityName, url) => {
          const anchors = Array.from(document.getElementsByTagName('li'));
          return anchors.map(anchor => {
            const title = anchor.innerText.trim();
            const linkArr = anchor.getElementsByTagName('a');
            const link = linkArr[0].getAttribute('href');
            return { theaterName: title, theaterCity: cityName, theaterLink: url + link };
          });
        }, cityName, urlxxi);

        // Remove movie data from theaters array
        nowPlaying.forEach(item => {
          const title = item.movieTitle;
          _.remove(theatersLink, { theaterName: title });
        });

        theatersLink.forEach(item => {
          theaters.push(item);
        });

        // Go to each theaters and scrape the schedule
        for (let i = 0; i < theatersLink.length; i++) {
          const theaterLink = theatersLink[i].theaterLink;
          const theaterName = theatersLink[i].theaterName;
          await page.goto(theaterLink, { waitUntil: 'networkidle0', timeout: 1000000000 });

          const movieTitles = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('#menu_ol_schedule'));
            return anchors.map(anchor => {
              const title = anchor.innerText.trim();
              if (title.includes('( 3D)')) {
                const bener = title.replace('( 3D)', '(IMAX 3D)');
                return { title: bener };
              }
              return { title: title };
            });
          });
        
          const moviesPlaying = await page.evaluate((cityName, theaterName, currentDay) => {
            const anchors = Array.from(document.getElementsByClassName('schedule_timeshow'));
            return anchors.map(anchor => {
              const dateAnchor = anchor.getElementsByClassName('p_date');
              const date = dateAnchor[0].innerText.trim();
              const dateToReplace = `Date: ${currentDay},`;
              const dateBener = date.replace(dateToReplace, '');
              const timeAnchor = anchor.getElementsByClassName('p_time');
              const time = timeAnchor[0].innerText.trim();
              const htmAnchor = anchor.getElementsByClassName('p_price');
              const htm = htmAnchor[0].innerText.trim();
              return { 
                city: cityName,
                date: dateBener,
                htm: htm.replace('HTM: Rp.', '').replace(',', '').trim(),
                time: time,
                room_type: '-',
                source: 'cineplex',
                theater: theaterName
              };
            });
          }, cityName, theaterName, currentDay);

          const merged = _.merge(movieTitles, moviesPlaying);
          merged.forEach(item => movies.push(item));
        }
        //#endregion
      }

      //#region Save scraping data to Firebase
      await saveNowPlaying(nowPlaying);
      await saveTheatersList(theaters);
      await saveMoviesList(movies);
      //#endregion

      isFinishedRun = true;
      await browser.close();
    } catch (error) {
      console.error(xxilog, error);
      browser.close();
    }
  }
}

async function saveNowPlaying(data) {
  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    const { movieTitle, movieCity } = item;
    const toBeHashed = `${movieTitle} and ${movieCity}`;
    const hashed = sha1(toBeHashed);
    firedb.collection('npNew')
      .doc(hashed)
      .set(item)
      .then(() => {
        if (index == data.length < 1) {
          console.log(xxilog, 'Finished saving Now Playing data to the database.');
        }
      })
      .catch((error) => {
        console.error('Error writing document: ', error);
      });
  }
}

async function saveTheatersList(data) {
  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    console.log(item);
    const { theaterName, theaterCity } = item;
    const toBeHashed = `${theaterName} and ${theaterCity}`;
    const hashed = sha1(toBeHashed);
    firedb.collection('theatersNew')
      .doc(hashed)
      .set(item)
      .then(() => {
        if (index == data.length < 1) {
          console.log(xxilog, 'Finished saving Theaters data to the database.');
        }
      })
      .catch((error) => {
        console.error('Error writing document: ', error);
      });
  }
}

async function saveMoviesList(data) {
  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    const { title, city, theaters } = item;
    const toBeHashed = `${title} and ${city} and ${theaters}`;
    const hashed = sha1(toBeHashed);
    firedb.collection('movieNew')
      .doc(hashed)
      .set(item)
      .then(() => {
        if (index == data.length < 1) {
          console.log(xxilog, 'Finished saving Movies data to the database.');
        }
      })
      .catch((error) => {
        console.error('Error writing document: ', error);
      });
  }
}

module.exports = run;
