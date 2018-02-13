const puppeteer = require('puppeteer');
const firedb = require('../db/firestore');
const crypto = require('crypto');
const sha1 = x => crypto.createHash('sha1').update(x, 'utf8').digest('hex');

const xxilog = 'XXI: ';
const cityList = {
  jakarta: 'https://m.21cineplex.com/gui.list_theater.php?city_id=10',
  bekasi: 'https://m.21cineplex.com/gui.list_theater.php?city_id=4',
  tangerang: 'https://m.21cineplex.com/gui.list_theater.php?city_id=15',
  bogor: 'https://m.21cineplex.com/gui.list_theater.php?city_id=3',
};

async function run() {
  let isFinishedRun = false;

  while (isFinishedRun == false) {
    try {
      var browser = await puppeteer.launch({
        //args: ['--no-sandbox', '--disable-setuid-sandbox']
        headless: false
      });

      const page = await browser.newPage();

      // Navigate to theaters list
      console.log(xxilog, 'Navigating to theaters list.');
      
    } catch (error) {
      console.error(xxilog, error);
    }
  }
}

run();
