const api = require('./api');

module.exports = api({
  fetch: window.fetch,
  Headers: window.Headers,
  btoa: window.btoa,
});
