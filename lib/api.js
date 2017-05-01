// const request = require('request');
const mnemonic = require('mnemonic-browser');
const bitcore = require('./deps/bitcore-lib');
const utilBitcore = require('./util.bitcore.js')

const NET = bitcore.Networks.testnet;

const cryptoRandom = () => {
  const array = new Float64Array(1);
  window.crypto.getRandomValues(array);
  return Math.abs(array / Number.MAX_VALUE);
};

const _makeWords = () => {
  const result = Array(12);
  for (let i = 0; i < result.length; i++) {
    result[i] = mnemonic.words[Math.floor(cryptoRandom() * mnemonic.words.length)];
  }
  return result.join(' ');
};
const _parseWords = words => {
  const m = mnemonic.fromWords(words.split(' '))
  const pk = bitcore.HDPrivateKey.fromSeed(m.toHex(), NET);
  const derived = pk.derive("m/0'/0/" + "0");
  const address = new bitcore.Address(derived.publicKey, NET);

  const wifKey = derived.privateKey.toWIF();
  const bitcoinAddress = address.toString();

  return {
    wifKey,
    bitcoinAddress,
  };
};

const _createSendTx = (src, dst, asset, quantity) => new Promise((accept, reject) => {
  request({
    method: 'POST',
    // url: 'https://rpc:1234@public.coindaddy.io:14000/api/', // live
    url: 'https://rpc:1234@public.coindaddy.io:14001/api/', // test
    body: {
      "jsonrpc": "2.0",
      "id": 0,
      "method": "create_send",
      "params": {
        "source": src,
        "destination": dst,
        "asset": asset,
        "quantity": quantity,
      }
    },
    json: true,
  }, (err, res, body) => {
    if (!err) {
      if (!body.error) {
        accept(body.result);
      } else {
        reject(body.error);
      }
    } else {
      reject(err);
    }
  });
});
const _decodeTx = (rawTx, wifKey) => new Promise((accept, reject) => {
  new utilBitcore.CWPrivateKey(wifKey).signRawTransaction(rawTx, (err, result) => {
    if (!err) {
      request({
        method: 'POST',
        // url: 'http://btc.blockr.io/api/v1/tx/decode', // live
        url: 'http://tbtc.blockr.io/api/v1/tx/decode', // test
        body: {
          hex: result,
          // hex: 'c' + result.slice(1),
        },
        json: true,
      }, (err, res, body) => {
        if (!err) {
          accept(body);
        } else {
          reject(err);
        }
      });
    } else {
      reject(err);
    }
  });
});
const _broadcastTx = (rawTx, wifKey) => new Promise((accept, reject) => {
  new utilBitcore.CWPrivateKey(wifKey).signRawTransaction(rawTx, (err, result) => {
    if (!err) {
      request({
        method: 'POST',
        // url: 'http://btc.blockr.io/api/v1/tx/push', // live
        url: 'http://tbtc.blockr.io/api/v1/tx/push', // test
        body: {
          hex: result,
          // hex: 'c' + result.slice(1),
        },
        json: true,
      }, (err, res, body) => {
        if (!err) {
          accept(body);
        } else {
          reject(err);
        }
      });
    } else {
      reject(err);
    }
  });
});

const getAddress = words => _parseWords(words).bitcoinAddress;
const requestBalances = src => new Promise((accept, reject) => {
  request({
    method: 'POST',
    // url: 'https://rpc:1234@public.coindaddy.io:14000/api/', // live
    url: 'https://rpc:1234@public.coindaddy.io:14001/api/', // test
    body: {
      "jsonrpc": "2.0",
      "id": 0,
      "method": "get_balances",
      "params": {
        "filters": [
          {
            "field": "address",
            "op": "==",
            "value": src
          }
        ],
       },
    },
    json: true,
  }, (err, res, body) => {
    if (!err) {
      if (!body.error) {
        accept(body.result);
      } else {
        reject(body.error);
      }
    } else {
      reject(err);
    }
  });
});
const requestHolders = asset => new Promise((accept, reject) => {
  request({
    method: 'POST',
    // url: 'https://rpc:1234@public.coindaddy.io:14000/api/', // live
    url: 'https://rpc:1234@public.coindaddy.io:14001/api/', // test
    body: {
      "jsonrpc": "2.0",
      "id": 0,
       "method": "get_holders",
      "params": {
        "asset": asset,
      }
    },
    json: true,
  }, (err, res, body) => {
    if (!err) {
      if (!body.error) {
        accept(body.result);
      } else {
        reject(body.error);
      }
    } else {
      reject(err);
    }
  });
});
const requestMempool = () => new Promise((accept, reject) => {
  request({
    method: 'POST',
    // url: 'https://rpc:1234@public.coindaddy.io:14000/api/', // live
    url: 'https://rpc:1234@public.coindaddy.io:14001/api/', // test
    body: {
      "jsonrpc": "2.0",
      "id": 0,
      "method": "get_mempool",
    },
    json: true,
  }, (err, res, body) => {
    if (!err) {
      if (!body.error) {
        accept(body.result);
      } else {
        reject(body.error);
      }
    } else {
      reject(err);
    }
  });
});
const requestLiveBalances = src => Promise.all([
  requestBalances(src),
  requestMempool(),
])
  .then(([
    balances,
    mempool,
  ]) => {
    const result = [];

    const _getAssetSpec = asset => {
      let assetSpec = result.find(assetSpec => assetSpec.asset === asset);
      if (!assetSpec) {
        assetSpec = {
          asset: asset,
          quantity: 0,
        };
        result.push(assetSpec);
      }
      return assetSpec;
    };

    for (let i = 0; i < balances.length; i++) {
      const balance = balances[i];
      const {asset, quantity} = balance;
      const assetSpec = _getAssetSpec(asset);
      assetSpec.quantity += quantity;
    }

    for (let i = 0; i < mempool.length; i++) {
      const entry = mempool[i];
      const {category} = entry;

      if (category === 'issuances') {
        const {bindings} = entry;
        const bindingsJson = JSON.parse(bindings);
        const {issuer} = bindingsJson;

        if (issuer === src) {
          const {asset, quantity} = bindingsJson;
          const assetSpec = _getAssetSpec(asset);
          assetSpec.quantity += quantity;
        }
      } else if (category === 'sends') {
        const {bindings} = entry;
        const bindingsJson = JSON.parse(bindings);
        const {source, destination} = bindingsJson;

        if (source === src) {
          const {asset, quantity} = bindingsJson;
          const assetSpec = _getAssetSpec(asset);
          assetSpec.quantity -= quantity;
        } else if (destination === src) {
          const {asset, quantity} = bindingsJson;
          const assetSpec = _getAssetSpec(asset);
          assetSpec.quantity += quantity;
        }
      }
    }

    return Promise.resolve(result);
  });
const requestSend = (src, dst, asset, quantity, wifKey) => _createSendTx(src, dst, asset, quantity)
  .then(rawTx => _broadcastTx(rawTx, wifKey));
const requestPack = (src, asset, quantity, wifKey) => {
  const words = _makeWords();
  const {bitcoinAddress: packBitcoinAddress} = _parseWords(words);

  return _createSendTx(src, packBitcoinAddress, asset, quantity)
    .then(rawTx => _broadcastTx(rawTx, wifKey))
    .then(() => Promise.resolve(words));
};

module.exports = {
  getAddress,
  requestBalances,
  requestHolders,
  requestMempool,
  requestLiveBalances,
  requestSend,
  requestPack,
};
