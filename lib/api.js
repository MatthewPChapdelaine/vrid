module.exports = ({random, fetch, Headers, btoa}) => {

const requestBlockCache = () => fetch(`${crdsUrl}/blockcache`)
  .then(_resJson);
const requestUnconfirmedBalances = address => fetch(`${crdsUrl}/unconfirmedBalances/${address}`)
  .then(_resJson);
const requestUnconfirmedCharges = address => fetch(`${crdsUrl}/unconfirmedCharges/${address}`)
  .then(_resJson);
const requestMempool = () => fetch(`${crdsUrl}/mempool`)
  .then(_resJson);
const requestCreateCharge = (srcAsset, srcQuantity, dstAsset, dstQuantity, srcAddress, dstAddress) => fetch(`${crdsUrl}/createCharge`, {
  method: 'POST',
  headers: (() => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Basic ' + btoa('rpcuser:rpcpassword'));
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
const requestSend = (asset, quantity, srcAddress, dstAddress, privateKey) => fetch(`${crdsUrl}/createSend`, {
  method: 'POST',
  headers: (() => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Basic ' + btoa('rpcuser:rpcpassword'));
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

const _resJson = res => {
  if (res.status >= 200 && res.status < 300) {
    return res.json();
  } else {
    const err = new Error('API returned failure status code: ' + res.status);
    return Promise.reject(err);
  }
};

return {
  requestBlockCache,
  requestUnconfirmedBalances,
  requestUnconfirmedCharges,
  requestMempool,
  requestCreateCharge
  requestSend,
};

};
