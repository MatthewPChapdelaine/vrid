const crypto = require('crypto');

const fetch = require('node-fetch');
const elliptic = require('elliptic');
const api = require('./api');

const secp256k1 = new elliptic.ec('secp256k1');

module.exports = api({
  random: () => {
    const array = new Uint32Array(1);
    const setArray = new Uint8Array(array.buffer);
    setArray.set(crypto.randomBytes(setArray.byteLength));
    return Math.abs(array[0] / 0xFFFFFFFF);
  },
  fetch: fetch,
  Headers: fetch.Headers,
  btoa: s => new Buffer(s, 'utf8').toString('base64'),
  getPublicKeyFromPrivateKey: privateKey => Uint8Array.from(secp256k1.keyFromPrivate(privateKey).getPublic('arr')),
});
