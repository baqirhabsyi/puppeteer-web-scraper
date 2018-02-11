const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const run = require('./hotel/traveloka');
const pegipegi = require('./hotel/pegipegi');

app.listen(port, () => {
  console.log('App running on port ', port);

  run();
  pegipegi();
  setInterval(run, 7200000);
  setInterval(pegipegi, 720000);
});

app.get('/', (req, res) => {
  res.send('You\'ve come to the scraping hub of mz ganteng.');
});
