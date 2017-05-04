const request = require('request');
const assetWalletStatic = require('assetwallet-static');

const getAddress = words => assetWalletStatic.getAddress(words);
const getKey = words => assetWalletStatic.getKey(words);
const requestAssetBalance = (src, asset) => requestAssetBalances(src)
  .then(assetSpecs => {
    const assetSpec = assetSpecs.find(assetSpec => assetSpec.asset === asset);
    return assetSpec !== undefined ? assetSpec.quantity : 0;
  });
const requestAssetBalances = src => _requestAllAssetBalances(src)
  .then(assetSpecs => assetSpecs.filter(assetSpec => assetSpec.asset !== 'XCP'));
const _requestAllAssetBalances = src => new Promise((accept, reject) => {
  request.post(
    // 'https://public.coindaddy.io:14000/api/', // live
    'https://public.coindaddy.io:14001/api/', // test
    {
      headers: {
        'Authorization': 'Basic ' + new Buffer('rpc:1234', 'utf8').toString('base64'),
      },
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
          const assetSpecs = body.result;
          for (let i = 0; i < assetSpecs.length; i++) {
            const assetSpec = assetSpecs[i];
            assetSpec.quantity = assetSpec.quantity;
          }
          accept(assetSpecs);
        } else {
          reject(body.error);
        }
      } else {
        const err = new Error('API returned failure status code: ' + res.statusCode);
        reject(err);
      }
    });
});

module.exports = {
  getAddress,
  getKey,
  requestAssetBalance,
  requestAssetBalances,
};
