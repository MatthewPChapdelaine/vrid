const assetWalletStaticLib = require('assetwallet-static');

module.exports = ({random, fetch, Headers, btoa}) => {

const assetWalletStatic = assetWalletStaticLib({random});

const _createIssueTx = (src, asset, quantity) => fetch(
  'https://hub.zeovr.io:14001', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpcuser:rpcpassword'));
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
        "description": "",
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
const _requestListUnspent = src => fetch(
  `https://hub.zeovr.io:18333/listunspent/${src}` // test
)
  .then(res => {
    if (res.status >= 200 && res.status < 300) {
      return res.json();
    } else {
      const err = new Error('API returned failure status code: ' + res.status);
      return Promise.reject(err);
    }
  });
const _createSignedSendBTCTx = (src, dst, value, wifKey) => _requestListUnspent(src)
  .then(utxos => {
    const tx = new assetWalletStatic.bitcore.Transaction()
      .to(dst, value * 1e8)
      .fee(0)
      .change(src);

    utxos = utxos
      // .filter(utxo => utxo.confirmations > 0)
      .sort((a, b) => a.satoshis - b.satoshis);
    let index = 0;
    while (tx.inputAmount < tx.outputAmount) {
      tx.from(utxos[index++]);
    }

    if (tx.inputAmount >= tx.outputAmount) {
      return Promise.resolve(
        tx
          .sign(new assetWalletStatic.bitcore.PrivateKey(wifKey))
          .toString()
      );
    } else {
      return Promise.reject('insufficient funds');
    }
  });

const _createSendTx = (src, dst, asset, quantity) => fetch(
  'https://hub.zeovr.io:14001', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpcuser:rpcpassword'));
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
        "fee": 0,
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
const _createReceiveTx = (src, dst, asset, quantity) => fetch(
  'https://hub.zeovr.io:14001', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpcuser:rpcpassword'));
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
        "fee": 0,
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
const _signBroadcastTx = (rawTx, wifKey) => signTx(rawTx, wifKey)
  .then(signedRawTx => _broadcastTx(signedRawTx));
const _signBroadcastBTCTx = (rawTx, wifKey) => _signBTCTx(rawTx, wifKey)
  .then(signedRawTx => _broadcastTx(signedRawTx));
const _signBTCTx = (rawTx, wifKey) => new Promise((accept, reject) => {
  const signedRawTx = new assetWalletStatic.bitcore.Transaction(rawTx)
    .sign(wifKey)
    .toString();
  accept(signedRawTx);
});
const _broadcastTx = signedRawTx => fetch(
  'https://hub.zeovr.io:18333/send', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      return headers;
    })(),
    body: JSON.stringify({
      "tx": signedRawTx,
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
const signTx = (rawTx, wifKey) => assetWalletStatic.signTx(rawTx, wifKey);
const requestBTCBalance = src => fetch(
  `https://hub.zeovr.io:18333/balance/${src}` // test
)
  .then(res => {
    if (res.status >= 200 && res.status < 300) {
      return res.json();
    } else {
      const err = new Error('API returned failure status code: ' + res.status);
      return Promise.reject(err);
    }
  })
  .then(result => result && (result.balance / 1e8));
const requestLiveBTCBalance = src => fetch(
  `https://hub.zeovr.io:18333/unconfirmedbalance/${src}` // test
)
  .then(res => {
    if (res.status >= 200 && res.status < 300) {
      return res.json();
    } else {
      const err = new Error('API returned failure status code: ' + res.status);
      return Promise.reject(err);
    }
  })
  .then(result => result && (result.balance / 1e8));
const requestAsset = (src, asset) => requestAssets(src)
  .then(assetSpecs => {
    const assetSpec = assetSpecs.find(assetSpec => assetSpec.asset === asset);
    return assetSpec !== undefined ? assetSpec.quantity : 0;
  });
const requestAssets = src => _requestAllAssets(src)
  .then(assetSpecs => assetSpecs.filter(assetSpec => assetSpec.quantity > 0));
const _requestAllAssetBalances = src => fetch(
  'https://hub.zeovr.io:14001', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpcuser:rpcpassword'));
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
const _requestAllAssets = src => _requestAllAssetBalances(src);
const requestHolders = asset => fetch(
  'https://hub.zeovr.io:14001', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpcuser:rpcpassword'));
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
  'https://hub.zeovr.io:18333', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('backenduser:backendpassword'));
      return headers;
    })(),
    body: JSON.stringify({
      "jsonrpc": "2.0",
      "id": 0,
      "method": "getrawmempool",
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
const requestCounterpartyMempool = () => fetch(
  'https://hub.zeovr.io:14001', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpcuser:rpcpassword'));
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
const requestLiveAssetBalance = (src, asset) => _requestAllLiveAssetBalances(src)
  .then(assetSpecs => {
    const assetSpec = assetSpecs.find(assetSpec => assetSpec.asset === asset);
    return assetSpec !== undefined ? assetSpec.quantity : 0;
  });
const requestLiveAssetBalances = src => _requestAllLiveAssetBalances(src)
  .then(assetSpecs => assetSpecs.filter(assetSpec => assetSpec.quantity > 0));
const _requestAllLiveAssetBalances = src => Promise.all([
  _requestAllAssetBalances(src),
  _requestAllOpenOrders(),
  requestCounterpartyMempool(),
])
  .then(([
    balances,
    orders,
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

    const orderAssetDiffs = (() => {
      const mempoolOrders = _getMempoolOrders(mempool);
      const mempoolOrderTxHashes = mempoolOrders.map(({tx_hash}) => tx_hash);
      const allOrders = orders.concat(mempoolOrders);
      _resolveOrders(allOrders);
      return _getOrderAssetDiffs(
        allOrders
          .filter(order => order.source === src && mempoolOrderTxHashes.includes(order.tx_hash))
      );
    })();
    for (let i = 0; i < orderAssetDiffs.length; i++) {
      const orderAssetDiff = orderAssetDiffs[i];
      const {asset, quantity} = orderAssetDiff;
      const assetSpec = _getAssetSpec(asset);
      assetSpec.quantity += quantity;
    }

    return Promise.resolve(result);
  });
const requestLiveAsset = (src, asset) => requestLiveAssets(src)
  .then(assetSpecs => {
    const assetSpec = assetSpecs.find(assetSpec => assetSpec.asset === asset);
    return assetSpec !== undefined ? assetSpec.quantity : 0;
  });
const _requestAllLiveAssets = src => _requestAllLiveAssetBalances(src);
const requestLiveAssets = src => _requestAllLiveAssets(src)
  .then(assetSpecs => assetSpecs.filter(assetSpec => assetSpec.quantity > 0));
const requestOrders = src => _requestAllOpenOrders()
  .then(orders => orders.filter(order => order.src === src))
  .then(_decorateOrders);
const requestLiveOrders = src => Promise.all([
  _requestAllOpenOrders(),
  requestCounterpartyMempool(),
])
  .then(([
    orders,
    mempool,
  ]) =>
    _resolveOrders(orders.concat(_getMempoolOrders(mempool)))
      .filter(order => order.source === src && order.status === 'open')
  )
  .then(_decorateOrders);
const _resolveOrders = orders => {
  // cancel orders
  const cancelledOrderIds = orders
    .filter(order => !order.source)
    .map(order => order.tx_hash);
  orders = orders.filter(order => !!order.source);
  for (let i = 0; i < cancelledOrderIds.length; i++) {
    const cancelledOrderId = cancelledOrderIds[i];
    const order = orders.find(order => order.tx_hash === cancelledOrderId);

    if (order) {
      order.status = 'cancelled';
    }
  }

  // sort orders
  const _sellPrice = order => order.get_remaining / order.give_remaining;
  const _buyPrice = order => order.give_remaining / order.get_remaining;
  orders = orders.sort((a, b) => {
    const sellPriceDiff = _sellPrice(a) - _sellPrice(b);

    if (sellPriceDiff !== 0) {
      return sellPriceDiff;
    } else {
      const timestampDiff = a.timestamp - b.timestamp;

      if (timestampDiff !== 0) {
        return timestampDiff;
      } else {
        return a.tx_hash.localeCompare(b.tx_hash);
      }
    }
  });

  // fill orders
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];

    order.give_remaining_start = order.give_remaining;
    order.get_remaining_start = order.get_remaining;
  }

  let mutated = true;
  while (mutated) {
    mutated = false;

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];

      if (order.status !== 'filled' && order.status === 'open') {
        const matchingOrder = orders.find(order2 =>
          order2 !== order &&
          order.give_asset === order2.get_asset && order.get_asset === order2.give_asset &&
          order.give_remaining <= order2.get_remaining && order.get_remaining <= order2.give_remaining && _sellPrice(order2) <= _buyPrice(order)
        );

        if (matchingOrder) {
          matchingOrder.give_remaining -= order.get_remaining;
          matchingOrder.get_remaining -= order.give_remaining;
          if (matchingOrder.give_remaining <= 0 && matchingOrder.get_remaining <= 0) {
            matchingOrder.status = 'filled';
          }

          order.give_remaining = 0;
          order.get_remaining = 0;
          order.status = 'filled';

          mutated = true;
          break;
        }
      }
    }
  }

  return orders;
};
const _getOrderAssetDiffs = orders => {
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

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const {status} = order;

    if (status === 'open') {
      const {give_asset, give_remaining, get_asset, get_remaining} = order;

      const giveAssetSpec = _getAssetSpec(give_asset);
      giveAssetSpec.quantity -= give_remaining;

      const getAssetSpec = _getAssetSpec(get_asset);
      getAssetSpec.quantity += get_remaining;
    } else if (status === 'cancelled') {
      const {give_asset, give_remaining, get_asset, get_remaining} = order;

      const giveAssetSpec = _getAssetSpec(give_asset);
      giveAssetSpec.quantity += give_remaining;

      const getAssetSpec = _getAssetSpec(get_asset);
      getAssetSpec.quantity -= get_remaining;
    }
  }

  return result;
};
const _requestAllOpenOrders = () => fetch(
  'https://hub.zeovr.io:14001', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpcuser:rpcpassword'));
      return headers;
    })(),
    body: JSON.stringify({
      "jsonrpc": "2.0",
      "id": 0,
      "method": "get_orders",
      "params": {
        "filters": [
          {
            "field": "status",
            "op": "==",
            "value": "open"
          },
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
const _getMempoolOrders = mempool => mempool
  .filter(entry => entry.category === 'orders')
  .map(entry => {
    const order = JSON.parse(entry.bindings);
    if (order.source && !order.status) { // non-cancellation entry but not decorated with status, so decorate it
      order.status = 'open';
    }
    return order;
  });
const _decorateOrders = orders => orders.map(order => {
  const {tx_hash, give_asset, give_remaining, get_asset, get_remaining} = order;
  return {
    id: tx_hash,
    srcAsset: give_asset,
    srcQuantity: give_remaining,
    dstAsset: get_asset,
    dstQuantity: get_remaining,
  };
});
const _checkCounterOrder = (srcAsset, srcQuantity, dstAsset, dstQuantity) => Promise.all([
  _requestAllOpenOrders(),
  requestCounterpartyMempool(),
])
  .then(([
    orders,
    mempool,
  ]) => {
    const fakeOrder = {
      status: 'open',
      source: 'fake',
      give_asset: srcAsset,
      give_quantity: srcQuantity,
      give_remaining: srcQuantity,
      get_asset: dstAsset,
      get_quantity: dstQuantity,
      get_remaining: dstQuantity,
    };

    _resolveOrders(
      orders
        .concat(_getMempoolOrders(mempool))
        .concat([fakeOrder])
    );

    return Promise.resolve(fakeOrder.status === 'filled');
  });

const requestIssuance = (src, asset, quantity, wifKey) => _createIssueTx(src, asset, quantity)
  .then(rawTx => _signBroadcastTx(rawTx, wifKey));
const requestVerify = (src, dst, asset, quantity) => _createSendTx(src, dst, asset, quantity)
  .then(() => true)
  .catch(() => false);
const requestStatus = src => requestAssets(src);
const requestSendBTC = (src, dst, value, wifKey) => _createSignedSendBTCTx(src, dst, value, wifKey)
  .then(signedRawTx => _broadcastTx(signedRawTx));
const requestSend = (src, dst, asset, quantity, wifKey) => {
  if (src !== dst) {
    return _createSendTx(src, dst, asset, quantity)
      .then(rawTx => _signBroadcastTx(rawTx, wifKey));
  } else {
    return requestLiveAssetBalance(src, asset)
      .then(balance => {
        if (balance >= quantity) {
          return Promise.resolve(null);
        } else {
          const err = new Error('insufficient funds');
          return Promise.reject(err);
        }
      });
  }
};
const requestReceiveAsset = (src, dst, asset, quantity, wifKey) => _createReceiveTx(src, dst, asset, quantity)
  .then(rawTx => _signBroadcastTx(rawTx, wifKey));
const requestPackAsset = (src, dst, asset, quantity, wifKey) => _createSendTx(src, dst, asset, quantity)
  .then(rawTx => _signBroadcastTx(rawTx, wifKey));
const requestCreateOrder = (src, srcAsset, srcQuantity, dstAsset, dstQuantity, expiration, wifKey, {immediate = false} = {}) => new Promise((accept, reject) => {
  if (immediate) {
    _checkCounterOrder(srcAsset, srcQuantity, dstAsset, dstQuantity)
      .then(ok => {
        if (ok) {
          return Promise.resolve();
        } else {
          const err = new Error('could not find immediate counterorder');
          err.code = 'EIMMEDIATE';
          return Promise.reject(err);
        }
      })
      .then(accept)
      .catch(reject);
  } else {
    accept();
  }
})
  .then(() => fetch(
    'https://hub.zeovr.io:14001', // test
    {
      method: 'POST',
      headers: (() => {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Authorization', 'Basic ' + btoa('rpcuser:rpcpassword'));
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
  ))
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
  'https://hub.zeovr.io:14001', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpcuser:rpcpassword'));
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
  'https://hub.zeovr.io:14001', // test
  {
    method: 'POST',
    headers: (() => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Basic ' + btoa('rpcuser:rpcpassword'));
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

return {
  makeWords,
  getAddress,
  getKey,
  requestBTCBalance,
  requestLiveBTCBalance,
  requestAsset,
  requestAssets,
  requestOrders,
  requestHolders,
  requestMempool,
  requestCounterpartyMempool,
  requestLiveAssetBalance,
  requestLiveAssetBalances,
  requestLiveAsset,
  requestLiveAssets,
  requestLiveOrders,
  requestIssuance,
  requestVerify,
  requestStatus,
  requestSendBTC,
  requestSend,
  requestReceiveAsset,
  requestPackAsset,
  requestCreateOrder,
  requestCancelOrder,
  requestOrderMatches,
};

};
