const fetch = require('node-fetch');
const api = require('./api');

module.exports = api({
  fetch: fetch,
  Headers: fetch.Headers,
  btoa: s => new Buffer(s, 'utf8').toString('base64'),
});
