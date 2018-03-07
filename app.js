const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const run = require('./hotel/traveloka');
const pegipegi = require('./hotel/pegipegi');
const traveMobi = require('./hotel/traveloka-mobile');
const xxi = require('./movies/xxi');

app.listen(port, () => {
  console.log('App running on port ', port);

  // run();
  // pegipegi();
  // traveMobi();
  // xxi();
  // setInterval(run, 7200000);
  // setInterval(traveMobi, 720000);
  // setInterval(xxi, 82800000);
  // setInterval(pegipegi, 720000);
});

app.get('/', (req, res) => {
  res.send('You\'ve come to the scraping hub of mz ganteng.');
});

app.get('/test', (req, res) => {
  res.send('Aku ganteng sekali');
});

app.get('/travemobile', (req, res) => {
  traveMobi();
  res.send('Scraping traveloka mobile now, check progress at papertrail.');
});

app.get('/traveloka', (req, res) => {
  run();
  res.send('Scraping traveloka now, check progress at papertrail.');
});

app.get('/pegipegi', (req, res) => {
  pegipegi();
  res.send('Scraping pegipegi now, check progress at papertrail.');
});

app.get('/xxi', (req, res) => {
  xxi();
  res.send('Scraping XXI now, check progress at papertrail.');
});
