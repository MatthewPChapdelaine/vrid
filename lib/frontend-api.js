const assetWalletStatic = require('assetwallet-static');
const utilBitcore = require('./util.bitcore.js')

// this is used to ensure that destination addresses have enough BTC to retrieve sent assets
// const DUST_SIZE = 17830;
const DUST_SIZE = 2e4;

const _createIssueTx = (src, asset, description, quantity, divisible) => fetch(
  // 'https://public.coindaddy.io:14000/api/', // live
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
        "divisible": divisible,
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
const _requestUtxos = src => fetch(
  // 'https://blockexplorer.com/api/addrs/${src}/utxo', // live
  `https://testnet.blockexplorer.com/api/addrs/${src}/utxo`, // test
)
  .then(res => {
    if (res.status >= 200 && res.status < 300) {
      return res.json();
    } else {
      const err = new Error('API returned failure status code: ' + res.status);
      return Promise.reject(err);
    }
  });
const _createSendBTCTx = (src, dst, quantity, wifKey) => _requestUtxos(src)
  .then(utxos =>
    new assetWalletStatic.bitcore.Transaction()
      .from(utxos)
      .to(dst, quantity)
      .sign(new assetWalletStatic.bitcore.PrivateKey(wifKey))
  );

const _createSendTx = (src, dst, asset, quantity) => fetch(
  // 'https://public.coindaddy.io:14000/api/', // live
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
        "regular_dust_size": DUST_SIZE,
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
const _createReceiveTx = (src, dst, asset, quantity) => fetch(
  // 'https://public.coindaddy.io:14000/api/', // live
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
        "fee": DUST_SIZE,
        "regular_dust_size": 0,
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
  // 'https://public.coindaddy.io:14000/api/', // live
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
const _broadcastTx = (rawTx, wifKey) => new Promise((accept, reject) => {
  new utilBitcore.CWPrivateKey(wifKey).signRawTransaction(rawTx, (err, signedRawTx) => {
    if (!err) {
      fetch(
        // 'https://blockexplorer.com/api/tx/send', // live
        'https://testnet.blockexplorer.com/api/tx/send', // test
        {
          method: 'POST',
          headers: (() => {
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            return headers;
          })(),
          body: JSON.stringify({
            "rawtx": signedRawTx,
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
        .then(result => result && result.txid)
        .then(accept)
        .catch(reject);
    } else {
      reject(err);
    }
  });
});

const makeWords = () => assetWalletStatic.makeWords();
const getAddress = words => assetWalletStatic.getAddress(words);
const getKey = words => assetWalletStatic.getKey(words);
const requestBTCBalance = src => fetch(`https://tbtc.blockr.io/api/v1/address/balance/${src}`, {
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
const requestLiveBTCBalance = src => {
  const _requestUnconfirmedBTCBalance = src => fetch(`https://tbtc.blockr.io/api/v1/address/unconfirmed/${src}`, {
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
    requestBTCBalance(src),
    _requestUnconfirmedBTCBalance(src),
  ])
    .then(([
      confirmedBalance,
      unconfirmedBalance,
    ]) => confirmedBalance + unconfirmedBalance);
};
const requestXCPBalance = src => _requestAllAssets(src)
  .then(assetSpecs => {
    const assetSpec = assetSpecs.find(assetSpec => assetSpec.asset === 'XCP');
    return assetSpec !== undefined ? (assetSpec.quantity / 1e8) : 0;
  });
const requestLiveXCPBalance = src => _requestAllLiveAssetBalances(src)
  .then(assetSpecs => {
    const assetSpec = assetSpecs.find(assetSpec => assetSpec.asset === 'XCP');
    return assetSpec !== undefined ? (assetSpec.quantity / 1e8) : 0;
  });
const requestAsset = (src, asset) => requestAssets(src)
  .then(assetSpecs => {
    const assetSpec = assetSpecs.find(assetSpec => assetSpec.asset === asset);
    return assetSpec !== undefined ? assetSpec.quantity : 0;
  });
const requestAssets = src => _requestAllAssets(src)
  .then(assetSpecs => assetSpecs.filter(assetSpec => assetSpec.asset !== 'XCP'));
const _requestAllAssetBalances = src => fetch(
  // 'https://public.coindaddy.io:14000/api/', // live
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
const _requestAllAssets = src => _requestAllAssetBalances(src)
  .then(_decorateAssets);
const _decorateAssets = assetSpecs =>
  fetch(
    // 'https://public.coindaddy.io:14000/api/', // live
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
        "method": "get_issuances",
        "params": {
          "filters": assetSpecs.map(({asset}) => ({
            "field": "asset",
            "op": "==",
            "value": asset
          })),
          "filterop": "or"
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
      return Promise.resolve(body.result.sort((a, b) => b.block_index - a.block_index));
    } else {
      return Promise.reject(body.error);
    }
  })
  .then(issuances => assetSpecs.map(assetSpec => {
    const {asset, quantity} = assetSpec;
    const issuance = issuances.find(issuance => issuance.asset === asset);
    const description = issuance ? issuance.description : '';
    const divisible = issuance ? Boolean(issuance.divisible) : false;

    return {
      asset,
      quantity,
      description,
      divisible,
    };
  }));
const requestHolders = asset => fetch(
  // 'https://public.coindaddy.io:14000/api/', // live
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
const requestMempool = () => fetch(
  // 'https://public.coindaddy.io:14000/api/', // live
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
      "method": "get_mempool",
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
const requestLiveAsset = (src, asset) => requestLiveAssets(src)
  .then(assetSpecs => {
    const assetSpec = assetSpecs.find(assetSpec => assetSpec.asset === asset);
    return assetSpec !== undefined ? assetSpec.quantity : 0;
  });
const _requestAllLiveAssetBalances = src => Promise.all([
  _requestAllAssetBalances(src),
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
    }

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

          if (assetSpec) {
            assetSpec.quantity += quantity;
          }
        }
      } else if (category === 'sends') {
        const {bindings} = entry;
        const bindingsJson = JSON.parse(bindings);
        const {source, destination} = bindingsJson;

        if (source === src) {
          const {asset, quantity} = bindingsJson;
          const assetSpec = _getAssetSpec(asset);

          if (assetSpec) {
            assetSpec.quantity -= quantity;
          }
        } else if (destination === src) {
          const {asset, quantity} = bindingsJson;
          const assetSpec = _getAssetSpec(asset);

          if (assetSpec) {
            assetSpec.quantity += quantity;
          }
        }
      }
    }

    return Promise.resolve(result);
  });
const _requestAllLiveAssets = src => _requestAllLiveAssetBalances(src)
  .then(_decorateAssets);
const requestLiveAssets = src => _requestAllLiveAssets(src)
  .then(assetSpecs => assetSpecs.filter(assetSpec => assetSpec.asset !== 'XCP'));
const requestIssuance = (src, asset, description, quantity, divisible, wifKey) => _createIssueTx(src, asset, description, quantity, divisible)
  .then(rawTx => _broadcastTx(rawTx, wifKey));
const requestVerify = (src, dst, asset, quantity) => _createSendTx(src, dst, asset, quantity)
  .then(() => true)
  .catch(() => false);
const requestStatus = src => requestAssets(src);
const requestSendBTC = (src, dst, quantity, wifKey) => _createSendBTCTx(src, dst, quantity)
  .then(rawTx => _broadcastTx(rawTx, wifKey));
const requestSend = (src, dst, asset, quantity, wifKey) => _createSendTx(src, dst, asset, quantity)
  .then(rawTx => _broadcastTx(rawTx, wifKey));
const requestReceive = (src, dst, asset, quantity, words) => _createReceiveTx(src, dst, asset, quantity)
  .then(rawTx => {
    const wifKey = getKey(words);

    return _broadcastTx(rawTx, wifKey);
  });
const requestDeploy = (src, words, asset, quantity, wifKey) => {
  const deployBitcoinAddress = getAddress(words);

  return _createSendTx(src, deployBitcoinAddress, asset, quantity)
    .then(rawTx => _broadcastTx(rawTx, wifKey));
};
const requestBurn = (src, quantity, wifKey) => _createBurnTx(src, quantity)
  .then(rawTx => _broadcastTx(rawTx, wifKey));

module.exports = {
  makeWords,
  getAddress,
  getKey,
  requestBTCBalance,
  requestLiveBTCBalance,
  requestXCPBalance,
  requestLiveXCPBalance,
  requestAsset,
  requestAssets,
  requestHolders,
  requestMempool,
  requestLiveAsset,
  requestLiveAssets,
  requestIssuance,
  requestVerify,
  requestStatus,
  requestSendBTC,
  requestSend,
  requestReceive,
  requestDeploy,
  requestBurn,
};
