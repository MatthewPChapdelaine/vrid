const crypto = require('crypto');

const fetch = require('node-fetch');
const api = require('./api');

module.exports = ({crdsUrl}) => api({
  random: () => {
    const array = new Uint32Array(1);
    const setArray = new Uint8Array(array.buffer);
    setArray.set(crypto.randomBytes(setArray.byteLength));
    return Math.abs(array[0] / 0xFFFFFFFF);
  },
  fetch: fetch,
  Headers: fetch.Headers,
  btoa: s => new Buffer(s, 'utf8').toString('base64'),
  atob: s => new Buffer(s, 'base64').toString('utf8'),
  crdsUrl: crdsUrl,
});
