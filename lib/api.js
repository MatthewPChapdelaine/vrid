const fastSha256 = require('fast-sha256');
const secp256k1 = require('eccrypto-sync/secp256k1');
const base58 = require('./base58');

module.exports = ({random, fetch, Headers, encodeUtf8, crdsUrl}) => {

const NULL_PRIVATE_KEY = (() => {
  const result = new Uint8Array(32);
  result[0] = 0xFF;
  return result;
})();
// const NULL_PUBLIC_KEY = eccrypto.getPublic(NULL_PRIVATE_KEY);

const _getPublicKey = privateKey => Uint8Array.from(secp256k1.keyFromPrivate(privateKey).getPublic('arr'));
const getAddress = privateKey => base58.encode(_sha256(_getPublicKey(privateKey)));
const _getProxyUrl = proxy => proxy ? '/crds' : crdsUrl;
const requestStatus = ({proxy = false} = {}) => fetch(`${_getProxyUrl(proxy)}/status`)
  .then(_resJson);
const requestBlockCache = ({proxy = false} = {}) => fetch(`${_getProxyUrl(proxy)}/blockcache`)
  .then(_resJson);
const requestUnconfirmedBalances = (address, {proxy = false} = {}) => fetch(`${_getProxyUrl(proxy)}/unconfirmedBalances/${encodeURIComponent(address)}`)
  .then(_resJson);
const requestUnconfirmedCharges = (address, {proxy = false} = {}) => fetch(`${_getProxyUrl(proxy)}/unconfirmedCharges/${encodeURIComponent(address)}`)
  .then(_resJson);
const requestMempool = ({proxy = false} = {}) => fetch(`${_getProxyUrl(proxy)}/mempool`)
  .then(_resJson);
const _requestSubmitMessage = (message, {proxy = false} = {}) => fetch(`${_getProxyUrl(proxy)}/submitMessage`, {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      return headers;
    })(),
    body: JSON.stringify(message),
  })
  .then(_resJson);
const requestCreateSend = (asset, quantity, srcAddress, dstAddress, privateKey, {proxy = false} = {}) => requestStatus({proxy})
  .then(status => {
    const {startHeight, timestamp} = status;
    const privateKeyBuffer = _base64ToArray(privateKey);
    const publicKey = _getPublicKey(privateKeyBuffer);
    const publicKeyString = _arrayToBase64(publicKey);
    const payload = JSON.stringify({type: 'send', startHeight, asset, quantity, srcAddress, dstAddress, publicKey: publicKeyString, timestamp});
    const payloadHash = _sha256(payload);
    const payloadHashString = _arrayToHex(payloadHash);
    const signature = Uint8Array.from(secp256k1.sign(payloadHash, privateKeyBuffer).toDER());
    const signatureString = _arrayToBase64(signature);
    const message = {
      payload: payload,
      hash: payloadHashString,
      signature: signatureString,
    };

    return _requestSubmitMessage(message, {proxy});
  });
const requestCreateCharge = (srcAddress, dstAddress, srcAsset, srcQuantity, dstAsset, dstQuantity, {proxy = false} = {}) => requestStatus({proxy})
  .then(status => {
    const {startHeight, timestamp} = status;
    const privateKeyBuffer = NULL_PRIVATE_KEY;
    const payload = JSON.stringify({type: 'charge', srcAddress, dstAddress, srcAsset, srcQuantity, dstAsset, dstQuantity, startHeight, timestamp});
    const payloadHash = _sha256(payload);
    const payloadHashString = _arrayToHex(payloadHash);
    const signature = Uint8Array.from(secp256k1.sign(payloadHash, privateKeyBuffer).toDER());
    const signatureString = _arrayToBase64(signature);
    const message = {
      payload: payload,
      hash: payloadHashString,
      signature: signatureString,
    };

    return _requestSubmitMessage(message, {proxy});
  });
const requestCreatePack = (srcAddress, dstAddress, asset, quantity, privateKey, {proxy = false} = {}) => requestStatus()
  .then(status => {
    const {startHeight, timestamp} = status;
    const privateKeyBuffer = _base64ToArray(privateKey);
    const k = _getPublicKey(privateKeyBuffer);
    const publicKey = new Buffer(k.buffer, k.byteOffset, k.length);
    const publicKeyString = _arrayToBase64(publicKey);
    const payload = JSON.stringify({type: 'pack', srcAddress, dstAddress, asset, quantity, startHeight, timestamp, publicKey: publicKeyString});
    const payloadHash = _sha256(payload);
    const payloadHashString = _arrayToHex(payloadHash);
    const signature = Uint8Array.from(secp256k1.sign(payloadHash, privateKeyBuffer).toDER());
    const signatureString = _arrayToBase64(signature);
    const message = {
      payload: payload,
      hash: payloadHashString,
      signature: signatureString,
    };

    return _requestSubmitMessage(message, {proxy});
  });
const requestCreateChargeback = (chargeHash, privateKey, {proxy = false} = {}) => requestStatus()
  .then(status => {
    const {startHeight, timestamp} = status;
    const privateKeyBuffer = _base64ToArray(privateKey);
    const publicKey = _getPublicKey(privateKeyBuffer);
    const publicKeyString = _arrayToBase64(publicKey);
    const payload = JSON.stringify({type: 'chargeback', chargeHash, publicKey: publicKeyString, startHeight, timestamp});
    const payloadHash = _sha256(payload);
    const payloadHashString = _arrayToHex(payloadHash);
    const signature = Uint8Array.from(secp256k1.sign(payloadHash, privateKeyBuffer).toDER());
    const signatureString = _arrayToBase64(signature);
    const message = {
      payload: payload,
      hash: payloadHashString,
      signature: signatureString,
    };

    return _requestSubmitMessage(message, {proxy});
  });
const requestCreateMinter = (address, asset, privateKey, {proxy = false} = {}) => requestStatus()
  .then(status => {
    const {startHeight, timestamp} = status;
    const privateKeyBuffer = _base64ToArray(privateKey);
    const publicKey = _getPublicKey(privateKeyBuffer);
    const publicKeyString = _arrayToBase64(publicKey);
    const payload = JSON.stringify({type: 'minter', address, asset, publicKey: publicKeyString, startHeight, timestamp});
    const payloadBuffer = new TextEncoder('utf-8').encode(payload);
    const payloadHash = _sha256(payloadBuffer);
    const payloadHashString = _arrayToHex(payloadHash);
    const signature = Uint8Array.from(secp256k1.sign(payloadHash, privateKeyBuffer).toDER());
    const signatureString = _arrayToBase64(signature);
    const message = {
      payload: payload,
      hash: payloadHashString,
      signature: signatureString,
    };

    return _requestSubmitMessage(message, {proxy});
  });
const requestCreateMint = (asset, quantity, address, privateKey, {proxy = false} = {}) => requestStatus()
  .then(status => {
    const {startHeight, timestamp} = status;
    const privateKeyBuffer = _base64ToArray(privateKey);
    const publicKey = _getPublicKey(privateKeyBuffer);
    const publicKeyString = _arrayToBase64(publicKey);
    const payload = JSON.stringify({type: 'mint', asset, quantity, address, publicKey: publicKeyString, startHeight, timestamp});
    const payloadHash = _sha256(payload);
    const payloadHashString = _arrayToHex(payloadHash);
    const signature = Uint8Array.from(secp256k1.sign(payloadHash, privateKeyBuffer).toDER());
    const signatureString = _arrayToBase64(signature);
    const message = {
      payload: payload,
      hash: payloadHashString,
      signature: signatureString,
    };

    return _requestSubmitMessage(message, {proxy});
  });

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
const _base64ToArray = sB64Enc => {
  function _b64ToUint6(nChr) {
    return nChr > 64 && nChr < 91 ?
        nChr - 65
      : nChr > 96 && nChr < 123 ?
        nChr - 71
      : nChr > 47 && nChr < 58 ?
        nChr + 4
      : nChr === 43 ?
        62
      : nChr === 47 ?
        63
      :
        0;
  }

  const nInLen = sB64Enc.length;
  const nOutLen = ((nInLen * 3) >> 2) - +(sB64Enc[sB64Enc.length - 1] === '=') - +(sB64Enc[sB64Enc.length - 2] === '=');
  const taBytes = new Uint8Array(nOutLen);

  for (let nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= _b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
      }
      nUint24 = 0;
    }
  }

  return taBytes;
};
const _arrayToBase64 = bytes => {
  var base64    = ''
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  var byteLength    = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength    = byteLength - byteRemainder

  var a, b, c, d
  var chunk

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]

    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4 // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }

  return base64
};
const _arrayToHex = array => {
  let result = '';
  for (let i = 0; i < array.byteLength; i++) {
    const n = array[i];
    result += ('00' + n.toString(16)).slice(-2);
  }
  return result;
};
const _sha256 = o => {
  if (typeof o === 'string') {
    o = encodeUtf8(o);
  }
  return fastSha256(o);
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
