const sha256 = require('fast-sha256');
const secp256k1 = require('eccrypto-sync/secp256k1');
const base58 = require('./base58');

module.exports = ({random, fetch, Headers, btoa, crdsUrl}) => {

const getAddress = privateKey => base58.encode(sha256(Uint8Array.from(secp256k1.keyFromPrivate(privateKey).getPublic('arr'))));
const requestStatus = () => fetch(`${crdsUrl}/status`)
  .then(_resJson);
const requestBlockCache = () => fetch(`${crdsUrl}/blockcache`)
  .then(_resJson);
const requestUnconfirmedBalances = address => fetch(`${crdsUrl}/unconfirmedBalances/${encodeURIComponent(address)}`)
  .then(_resJson);
const requestUnconfirmedCharges = address => fetch(`${crdsUrl}/unconfirmedCharges/${encodeURIComponent(address)}`)
  .then(_resJson);
const requestMempool = () => fetch(`${crdsUrl}/mempool`)
  .then(_resJson);
const requestCreateSend = (asset, quantity, srcAddress, dstAddress, privateKey) => _requestStatus()
  .then(status => {
    const {startHeight, timestamp} = status;
    const privateKeyBuffer = _base64ToArray(privateKey);
    const publicKey = eccrypto.getPublic(privateKeyBuffer);
    const publicKeyString = _arrayToBase64(publicKey);
    const payload = JSON.stringify({type: 'send', startHeight, asset, quantity, srcAddress, dstAddress, publicKey: publicKeyString, timestamp});
    const payloadHash = sha256(payload);
    const payloadHashString = _arrayToHex(payloadHash);
    const signature = eccrypto.sign(privateKeyBuffer, payloadHash)
    const signatureString = _arrayToBase64(signature);
    const message = {
      payload: payload,
      hash: payloadHashString,
      signature: signatureString,
    };

    return fetch(`${crdsUrl}/submitMessage`, {
      method: 'POST',
      headers: (() => {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        return headers;
      })(),
      body: JSON.stringify(messge),
    })
    .then(_resJson);
  });
const requestCreateCharge = (srcAddress, dstAddress, srcAsset, srcQuantity, dstAsset, dstQuantity) => fetch(`${crdsUrl}/createCharge`, {
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
const requestCreatePack = (srcAddress, dstAddress, asset, quantity, privateKey) => fetch(`${crdsUrl}/createPack`, {
  method: 'POST',
  headers: (() => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    return headers;
  })(),
  body: JSON.stringify({
    srcAddress,
    dstAddress,
    asset,
    quantity,
    privateKey,
  }),
})
  .then(_resJson);
const requestCreateChargeback = (chargeHash, privateKey) => fetch(`${crdsUrl}/createChargeback`, {
  method: 'POST',
  headers: (() => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    return headers;
  })(),
  body: JSON.stringify({
    chargeHash,
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
    return Promise.reject({
      status: res.status,
      stack: 'API returned failure status code: ' + res.status,
    });
  }
};
const _base64ToArray = s => {
  const raw = atob(s);
  const array = new Uint8Array(new ArrayBuffer(raw.length));
  for(i = 0; i < raw.length; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
};
const _arrayToBase64 = array => {
  let binary = '';
  for (let i = 0; i < array.byteLength; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
};
const _arrayToHex = array => {
  let result = '';
  for (let i = 0; i < array.byteLength; i++) {
    const n = array[i];
    result += ('00' + n.toString(16)).slice(-2);
  }
  return result;
};

return {
  getAddress,
  requestStatus,
  requestBlockCache,
  requestUnconfirmedBalances,
  requestUnconfirmedCharges,
  requestMempool,
  requestCreateSend,
  requestCreateCharge,
  requestCreatePack,
  requestCreateChargeback,
  requestCreateMinter,
  requestCreateMint,
};

};
