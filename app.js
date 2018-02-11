const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const run = require('./hotel/traveloka');

app.listen(port, () => {
  console.log('App running on port ', port);

  run();
  setInterval(run, 7200000);
});

app.get('/', (req, res) => {
  res.send('You\'ve come to the scraping hub of mz ganteng.');
});
