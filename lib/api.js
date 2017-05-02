const mnemonic = require('mnemonic-browser');
const bitcore = require('./deps/bitcore-lib');
const utilBitcore = require('./util.bitcore.js')

const NET = bitcore.Networks.testnet;

const cryptoRandom = () => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return Math.abs(array[0] / 0xFFFFFFFF);
};

const makeWords = () => {
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

const _createIssueTx = (src, asset, quantity, description) => fetch(
  // 'https://rpc:1234@public.coindaddy.io:14000/api/', // live
  'https://public.coindaddy.io:14001/api/', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpc:1234'));
      return headers;
    })(),
    body: JSON.stringify({
      "jsonrpc": "2.0",
      "id": 0,
      "method": "create_issuance",
      "params": {
        "source": src,
        "asset": asset,
        "quantity": quantity,
        "divisible": false,
        "description": description,
      }
    }),
  }
)
  .then(res => {
    if (res.status >= 200 && res.status < 300) {
      return res.json();
    } else {
      const err = new Error('API returned failure status code: ' + res.status);
      return Promise.reject(err);
    }
  })
  .then(body => {
    if (!body.error) {
      return Promise.resolve(body.result);
    } else {
      return Promise.reject(body.error);
    }
  });
const _createSendTx = (src, dst, asset, quantity) => fetch(
  // 'https://rpc:1234@public.coindaddy.io:14000/api/', // live
  'https://public.coindaddy.io:14001/api/', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpc:1234'));
      return headers;
    })(),
    body: JSON.stringify({
      "jsonrpc": "2.0",
      "id": 0,
      "method": "create_send",
      "params": {
        "source": src,
        "destination": dst,
        "asset": asset,
        "quantity": quantity,
      }
    }),
  }
)
  .then(res => {
    if (res.status >= 200 && res.status < 300) {
      return res.json();
    } else {
      const err = new Error('API returned failure status code: ' + res.status);
      return Promise.reject(err);
    }
  })
  .then(body => {
    if (!body.error) {
      return Promise.resolve(body.result);
    } else {
      return Promise.reject(body.error);
    }
  });
const _createBurnTx = (src, quantity) => fetch(
  // 'https://rpc:1234@public.coindaddy.io:14000/api/', // live
  'https://public.coindaddy.io:14001/api/', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpc:1234'));
      return headers;
    })(),
    body: JSON.stringify({
      "jsonrpc": "2.0",
      "id": 0,
      "method": "create_burn",
      "params": {
        "source": src,
        "quantity": quantity,
      }
    }),
  }
)
  .then(res => {
    if (res.status >= 200 && res.status < 300) {
      return res.json();
    } else {
      const err = new Error('API returned failure status code: ' + res.status);
      return Promise.reject(err);
    }
  })
  .then(body => {
    if (!body.error) {
      return Promise.resolve(body.result);
    } else {
      return Promise.reject(body.error);
    }
  });
const _decodeTx = rawTx => new bitcore.Transaction(rawTx).toObject();
const _broadcastTx = (rawTx, wifKey) => new Promise((accept, reject) => {
  new utilBitcore.CWPrivateKey(wifKey).signRawTransaction(rawTx, (err, result) => {
    if (!err) {
      fetch(
        // 'https://blockexplorer.com/api/tx/send', // live
        'https://testnet.blockexplorer.com/api/tx/send', // test
        {
          method: 'POST',
          body: result,
        }
      )
        .then(res => {
          if (res.status >= 200 && res.status < 300) {
            return res.json();
          } else {
            const err = new Error('API returned failure status code: ' + res.status);
            return Promise.reject(err);
          }
        })
        .then(accept)
        .catch(reject);
    } else {
      reject(err);
    }
  });
});

const getAddress = words => _parseWords(words).bitcoinAddress;
const getKey = words => _parseWords(words).wifKey;
const requestBitcoinBalance = src => {
  const _requestConfirmedBitcoinBalance = src => fetch(`https://tbtc.blockr.io/api/v1/address/balance/${src}`, {
    mode: 'cors',
  })
    .then(res => {
      if (res.status >= 200 && res.status < 300) {
        return res.json();
      } else {
        const err = new Error('API returned failure status code: ' + res.status);
        return Promise.reject(err);
      }
    })
    .then(result => result.data.balance);
  const _requestUnconfirmedBitcoinBalance = src => fetch(`https://tbtc.blockr.io/api/v1/address/unconfirmed/${src}`, {
    mode: 'cors',
  })
    .then(res => {
      if (res.status >= 200 && res.status < 300) {
        return res.json();
      } else {
        const err = new Error('API returned failure status code: ' + res.status);
        return Promise.reject(err);
      }
    })
    .then(result => result.data.unconfirmed.reduce((acc, tx) => acc + tx.amount, 0));

  return Promise.all([
    _requestConfirmedBitcoinBalance(src),
    _requestUnconfirmedBitcoinBalance(src),
  ])
    .then(([
      confirmedBalance,
      unconfirmedBalance,
    ]) => confirmedBalance + unconfirmedBalance);
};
const requestAssetBalances = src => fetch(
  // 'https://rpc:1234@public.coindaddy.io:14000/api/', // live
  'https://public.coindaddy.io:14001/api/', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpc:1234'));
      return headers;
    })(),
    body: JSON.stringify({
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
    }),
  }
)
  .then(res => {
    if (res.status >= 200 && res.status < 300) {
      return res.json();
    } else {
      const err = new Error('API returned failure status code: ' + res.status);
      return Promise.reject(err);
    }
  })
  .then(body => {
    if (!body.error) {
      return Promise.resolve(body.result);
    } else {
      return Promise.reject(body.error);
    }
  });
const requestHolders = asset => fetch(
  // 'https://rpc:1234@public.coindaddy.io:14000/api/', // live
  'https://public.coindaddy.io:14001/api/', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpc:1234'));
      return headers;
    })(),
    body: JSON.stringify({
      "jsonrpc": "2.0",
      "id": 0,
       "method": "get_holders",
      "params": {
        "asset": asset,
      }
    }),
  }
)
  .then(body => {
    if (!body.error) {
      return Promise.resolve(body.result);
    } else {
      return Promise.reject(body.error);
    }
  });
const requestMempool = () => fetch(
  // 'https://rpc:1234@public.coindaddy.io:14000/api/', // live
  'https://rpc:1234@public.coindaddy.io:14001/api/', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpc:1234'));
      return headers;
    })(),
    body: JSON.stringify({
      "jsonrpc": "2.0",
      "id": 0,
      "method": "get_mempool",
    }),
  }
)
  .then(body => {
    if (!body.error) {
      return Promise.resolve(body.result);
    } else {
      return Promise.reject(body.error);
    }
  });
const requestLiveAssetBalances = src => Promise.all([
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
const requestIssuance = (src, asset, quantity, description, wifKey) => _createIssueTx(src, asset, quantity, description)
  .then(rawTx => _decodeTx(rawTx, wifKey));
const requestSend = (src, dst, asset, quantity, wifKey) => _createSendTx(src, dst, asset, quantity)
  .then(rawTx => _broadcastTx(rawTx, wifKey));
const requestPack = (src, asset, quantity, wifKey) => {
  const words = makeWords();
  const {bitcoinAddress: packBitcoinAddress} = _parseWords(words);

  return _createSendTx(src, packBitcoinAddress, asset, quantity)
    .then(rawTx => _broadcastTx(rawTx, wifKey))
    .then(() => Promise.resolve(words));
};
const requestBurn = (src, quantity, wifKey) => _createBurnTx(src, quantity)
  .then(rawTx => _decodeTx(rawTx, wifKey));

module.exports = {
  makeWords,
  getAddress,
  getKey,
  requestBitcoinBalance,
  requestAssetBalances,
  requestHolders,
  requestMempool,
  requestLiveAssetBalances,
  requestIssuance,
  requestSend,
  requestPack,
  requestBurn,
};
