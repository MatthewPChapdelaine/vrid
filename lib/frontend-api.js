const api = require('./api');

module.exports = api({
  random: () => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return Math.abs(array[0] / 0xFFFFFFFF);
  },
  fetch: window.fetch,
  Headers: window.Headers,
  encodeUtf8: s => new TextEncoder().encode(s),
  crdsUrl: `CRDS_URL`,
});
