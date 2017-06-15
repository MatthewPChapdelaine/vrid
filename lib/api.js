const sha256 = require('fast-sha256');
const base58 = require('./base58');
const elliptic = require('./elliptic');

const secp256k1 = new elliptic.ec('secp256k1');

module.exports = ({random, fetch, Headers, btoa, crdsUrl}) => {

const getAddress = privateKey => base58.encode(sha256(Uint8Array.from(secp256k1.keyFromPrivate(privateKey).getPublic('arr'))));
const requestBlockCache = () => fetch(`${crdsUrl}/blockcache`)
  .then(_resJson);
const requestUnconfirmedBalances = address => fetch(`${crdsUrl}/unconfirmedBalances/${encodeURIComponent(address)}`)
  .then(_resJson);
const requestUnconfirmedCharges = address => fetch(`${crdsUrl}/unconfirmedCharges/${encodeURIComponent(address)}`)
  .then(_resJson);
const requestMempool = () => fetch(`${crdsUrl}/mempool`)
  .then(_resJson);
const requestCreateSend = (asset, quantity, srcAddress, dstAddress, privateKey) => fetch(`${crdsUrl}/createSend`, {
  method: 'POST',
  headers: (() => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    return headers;
  })(),
  body: JSON.stringify({
    asset,
    quantity,
    srcAddress,
    dstAddress,
    privateKey,
  }),
})
  .then(_resJson);
const requestCreateCharge = (srcAsset, srcQuantity, dstAsset, dstQuantity, srcAddress, dstAddress) => fetch(`${crdsUrl}/createCharge`, {
  method: 'POST',
  headers: (() => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    return headers;
  })(),
  body: JSON.stringify({
    srcAsset,
    srcQuantity,
    dstAsset,
    dstQuantity,
    srcAddress,
    dstAddress,
  }),
})
  .then(_resJson);
const requestCreateChargeback = (chargeSignature, privateKey) => fetch(`${crdsUrl}/createChargeback`, {
  method: 'POST',
  headers: (() => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    return headers;
  })(),
  body: JSON.stringify({
    chargeSignature,
    privateKey,
  }),
})
  .then(_resJson);
const requestCreateMinter = (address, asset, privateKey) => fetch(`${crdsUrl}/createMinter`, {
  method: 'POST',
  headers: (() => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    return headers;
  })(),
  body: JSON.stringify({
    address,
    asset,
    privateKey,
  }),
})
  .then(_resJson);
const requestCreateMint = (asset, quantity, address, privateKey) => fetch(`${crdsUrl}/createMint`, {
  method: 'POST',
  headers: (() => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    return headers;
  })(),
  body: JSON.stringify({
    asset,
    quantity,
    address,
    privateKey,
  }),
})
  .then(_resJson);

const _resJson = res => {
  if (res.status >= 200 && res.status < 300) {
    return res.json();
  } else {
    const err = new Error('API returned failure status code: ' + res.status);
    return Promise.reject(err);
  }
};

return {
  getAddress,
  requestBlockCache,
  requestUnconfirmedBalances,
  requestUnconfirmedCharges,
  requestMempool,
  requestCreateSend,
  requestCreateCharge,
  requestCreateChargeback,
  requestCreateMinter,
  requestCreateMint,
};

};
