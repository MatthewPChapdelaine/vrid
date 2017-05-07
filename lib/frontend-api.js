const assetWalletStatic = require('assetwallet-static');
const utilBitcore = require('./util.bitcore.js')

// this is used to ensure that destination addresses have enough BTC to retrieve sent assets
// const DUST_SIZE = 17830;
const DUST_SIZE = 0.0002 * 1e8;
// const DUST_SIZE = 0.001 * 1e8;

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
const _createSignedSendBTCTx = (src, dst, quantity, wifKey) => _requestUtxos(src)
  .then(utxos => {
    const tx = new assetWalletStatic.bitcore.Transaction()
      .to(dst, quantity)
      .change(src);

    utxos = utxos.sort((a, b) => a.satoshis - b.satoshis);
    let index = 0;
    while (tx.inputAmount < (tx.outputAmount + tx._estimateFee())) {
      tx.from(utxos[index++]);
    }

    if (tx.inputAmount >= (tx.outputAmount + tx._estimateFee())) {
      tx
        .fee(tx._estimateFee());
      return Promise.resolve(
        tx
          .sign(new assetWalletStatic.bitcore.PrivateKey(wifKey))
          .toString()
      );
    } else {
      return Promise.reject('insufficient funds');
    }
  });

const _createSendTx = (src, dst, asset, quantity, {dust = false} = {}) => fetch(
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
    body: (() => {
      const o = {
        "jsonrpc": "2.0",
        "id": 0,
        "method": "create_send",
        "params": {
          "source": src,
          "destination": dst,
          "asset": asset,
          "quantity": quantity,
        }
      };
      if (dust) {
        o.params.regular_dust_size = DUST_SIZE;
      }
      return JSON.stringify(o);
    })(),
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
const _createReceiveTx = (src, dst, asset, quantity, {dust = false} = {}) => fetch(
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
    body: (() => {
      const o = {
        "jsonrpc": "2.0",
        "id": 0,
        "method": "create_send",
        "params": {
          "source": src,
          "destination": dst,
          "asset": asset,
          "quantity": quantity,
        }
      };
      if (dust) {
        o.params.fee = DUST_SIZE;
        o.params.regular_dust_size = 0;
      }
      return JSON.stringify(o);
    })(),
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
const _signBroadcastTx = (rawTx, wifKey) => _signTx(rawTx, wifKey)
  .then(signedRawTx => _broadcastTx(signedRawTx));
const _signTx = (rawTx, wifKey) => new Promise((accept, reject) => {
  new utilBitcore.CWPrivateKey(wifKey).signRawTransaction(rawTx, (err, signedRawTx) => {
    if (!err) {
      accept(signedRawTx);
    } else {
      reject(err);
    }
  });
});
const _signBroadcastBTCTx = (rawTx, wifKey) => _signBTCTx(rawTx, wifKey)
  .then(signedRawTx => _broadcastTx(signedRawTx));
const _signBTCTx = (rawTx, wifKey) => new Promise((accept, reject) => {
  const signedRawTx = new assetWalletStatic.bitcore.Transaction(rawTx)
    .sign(wifKey)
    .toString();
  accept(signedRawTx);
});
const _broadcastTx = signedRawTx => fetch(
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
  .then(result => result && result.txid);

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
  .then(assetSpecs => assetSpecs.filter(assetSpec => assetSpec.asset !== 'XCP' && assetSpec.quantity > 0));
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
  .then(assetSpecs => assetSpecs.filter(assetSpec => assetSpec.asset !== 'XCP' && assetSpec.quantity > 0));
const requestLiveOrders = src => fetch(
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
      "method": "get_orders",
      "params": {
        "filters": [
          {
            "field": "source",
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
  })
  .then(orderSpecs =>
    orderSpecs
      .filter(orderSpec => orderSpec.give_remaining > 0 || orderSpec.get_remaining > 0)
      .map(orderSpec => {
        const {tx_hash, give_asset, give_remaining, get_asset, get_remaining} = orderSpec;
        return {
          id: tx_hash,
          srcAsset: give_asset,
          srcQuantity: give_remaining,
          dstAsset: get_asset,
          dstQuantity: get_remaining,
        };
      })
  );

const requestIssuance = (src, asset, description, quantity, divisible, wifKey) => _createIssueTx(src, asset, description, quantity, divisible)
  .then(rawTx => _signBroadcastTx(rawTx, wifKey));
const requestVerify = (src, dst, asset, quantity) => _createSendTx(src, dst, asset, quantity)
  .then(() => true)
  .catch(() => false);
const requestStatus = src => requestAssets(src);
const requestSendBTC = (src, dst, quantity, wifKey) => _createSignedSendBTCTx(src, dst, quantity, wifKey)
  .then(signedRawTx => _broadcastTx(signedRawTx));
const requestSend = (src, dst, asset, quantity, wifKey) => _createSendTx(src, dst, asset, quantity)
  .then(rawTx => _signBroadcastTx(rawTx, wifKey));
const requestReceive = (src, dst, asset, quantity, wifKey) => _createReceiveTx(src, dst, asset, quantity, {dust: true})
  .then(rawTx => _signBroadcastTx(rawTx, wifKey));
const requestPack = (src, dst, asset, quantity, wifKey) => _createSendTx(src, dst, asset, quantity, {dust: true})
  .then(rawTx => _signBroadcastTx(rawTx, wifKey));
const requestBurn = (src, quantity, wifKey) => _createBurnTx(src, quantity)
  .then(rawTx => _signBroadcastTx(rawTx, wifKey));
const requestCreateOrder = (src, srcAsset, srcQuantity, dstAsset, dstQuantity, expiration, wifKey) => fetch(
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
      "method": "create_order",
      "params": {
        "source": src,
        "give_asset": srcAsset,
        "give_quantity": srcQuantity,
        "get_asset": dstAsset,
        "get_quantity": dstQuantity,
        "expiration": expiration,
        "fee_required": 0,
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
  })
  .then(rawTx => _signBroadcastTx(rawTx, wifKey));
const requestCancelOrder = (src, orderId, wifKey) => fetch(
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
      "method": "create_cancel",
      "params": {
        "source": src,
        "offer_hash": orderId,
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
  })
  .then(rawTx => _signBroadcastTx(rawTx, wifKey));
const requestOrderMatches = (src) => fetch(
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
      "method": "get_order_matches",
      "params": {
        "filters": [
          {
            "field": "tx0_address",
            "op": "==",
            "value": src
          },
          {
            "field": "tx1_address",
            "op": "==",
            "value": src
          }
        ],
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
      return Promise.resolve(body.result);
    } else {
      return Promise.reject(body.error);
    }
  });
const requestSwap = (src, dst, asset1, quantity1, asset2, quantity2, wifKey1, wifKey2) => Promise.all([
  _createSendTx(src, dst, asset1, quantity1, wifKey1).then(rawTx => _signTx(rawTx, wifKey1)),
  _createSendTx(dst, src, asset2, quantity2, wifKey2).then(rawTx => _signTx(rawTx, wifKey2)),
])
  .then(([
    signedRawTx1,
    signedRawTx2,
  ]) => Promise.all([
    _broadcastTx(signedRawTx1),
    _broadcastTx(signedRawTx2),
  ]));

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
  requestLiveOrders,
  requestIssuance,
  requestVerify,
  requestStatus,
  requestSendBTC,
  requestSend,
  requestReceive,
  requestPack,
  requestBurn,
  requestCreateOrder,
  requestCancelOrder,
  requestOrderMatches,
  requestSwap,
};
