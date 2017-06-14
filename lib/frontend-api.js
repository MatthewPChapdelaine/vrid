const api = require('./api');
const elliptic = require('elliptic');

const secp256k1 = new elliptic.ec('secp256k1');

module.exports = api({
  random: () => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return Math.abs(array[0] / 0xFFFFFFFF);
  },
  fetch: window.fetch,
  Headers: window.Headers,
  btoa: window.btoa,
  getPublicKeyFromPrivateKey: privateKey => Uint8Array.from(secp256k1.keyFromPrivate(privateKey).getPublic('arr')),
});
