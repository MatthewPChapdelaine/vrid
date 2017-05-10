const path = require('path');
const fs = require('fs');
const http = require('http');

const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const express = require('express');
const bodyParser = require('body-parser');
const bodyParserJson = bodyParser.json();
const cookie = require('cookie');
const rollup = require('rollup');
const rollupPluginNodeResolve = require('rollup-plugin-node-resolve');
const rollupPluginCommonJs = require('rollup-plugin-commonjs');
const rollupPluginJson = require('rollup-plugin-json');
const Busboy = require('busboy');
const transclude = require('transclude');
const backendApi = require('./lib/backend-api');

const _requestRollup = p => rollup.rollup({
  entry: p,
  plugins: [
    rollupPluginNodeResolve({
      main: true,
      preferBuiltins: false,
    }),
    rollupPluginCommonJs(),
    rollupPluginJson(),
  ],
})
  .then(bundle => {
    const result = bundle.generate({
      moduleName: module,
      format: 'cjs',
      useStrict: false,
    });
    const {code} = result;
    const wrappedCode = '(function() {\n' + code + '\n})();\n';
    return wrappedCode;
  });
const _requestIndexJsRollup = (() => {
  let indexJsRollupPromise = null;

  return () => {
    if (!indexJsRollupPromise) {
      indexJsRollupPromise = _requestRollup(path.join(__dirname, 'lib', 'index.js'));
    }

    return indexJsRollupPromise;
  };
})();

class AssetWallet {
  constructor({
    prefix = '',
    head = '',
    body = '',
  } = {}) {
    this.prefix = prefix;
    this.head = head;
    this.body = body;
  }

  requestApp() {
    const {prefix, head, body} = this;

    return Promise.all([
      transclude.requestTranscludeRequestHandler(path.join(__dirname, 'public', 'index.html'), s =>
        s
          .replace('<!-- HEAD -->', head)
          .replace('<!-- BODY -->', body)
      ),
      _requestIndexJsRollup(),
    ])
      .then(([
        indexHtmlHandler,
        indexJs,
      ])  => {
        const app = express();
        app.get(path.join(prefix, '/'), (req, res, next) => {
          res.type('text/html');

          indexHtmlHandler(req, res, next);
        });
        app.get(path.join(prefix, '/js/index.js'), (req, res, next) => {
          res.type('application/javascript');
          res.send(indexJs);
        });
        const cors = (req, res, next) => {
          res.set('Access-Control-Allow-Origin', req.get('Origin'));
          res.set('Access-Control-Allow-Credentials', true);

          next();
        };
        const wordsParser = (req, res, next) => {
          const cookieHeader = req.get('Cookie');

          const _respondDefault = () => {
            res.json({
              address: null,
              assets: [],
            });
          };

          if (cookieHeader) {
            const c = cookie.parse(cookieHeader);
            const words = c && c.words;

            if (words) {
              req.words = words;

              next();
            } else {
              _respondDefault();
            }
          } else {
            _respondDefault();
          }
        };
        app.get(path.join(prefix, '/api/status'), cors, wordsParser, (req, res, next) => {
          const {words} = req;
          const address = backendApi.getAddress(words);

          backendApi.requestLiveAssetBalances(address)
            .then(assetSpecs => {
              res.json({
                address: address,
                assets: assetSpecs,
              });
            })
            .catch(err => {
              res.status(500);
              res.send(err.stack);
            });
        });
        app.post(path.join(prefix, '/api/buy'), cors, wordsParser, bodyParserJson, (req, res, next) => {
          const {words, body} = req;

          if (
            typeof body == 'object' && body &&
            typeof body.srcAsset === 'string' &&
            typeof body.srcQuantity === 'number' &&
            typeof body.dstAsset === 'string' &&
            typeof body.dstQuantity === 'number'
          ) {
            const {srcAsset, srcQuantity, dstAsset, dstQuantity} = body;
            const address = backendApi.getAddress(words);
            const wifKey = backendApi.getKey(words);
            const expiration = 1;

            backendApi.requestCreateOrder(address, srcAsset, srcQuantity, dstAsset, dstQuantity, expiration, wifKey, {immediate: true})
              .then(txid => {
                res.json({
                  txid,
                });
              })
              .catch(err => {
                if (err.code === 'EIMMEDIATE') {
                  res.status(412);
                  res.send();
                } else {
                  res.status(500);
                  res.send(err.stack);
                }
              });
          } else {
            res.status(400);
            res.send();
          }
        });
        app.post(path.join(prefix, '/api/pack'), cors, wordsParser, bodyParserJson, (req, res, next) => {
          const {words: srcWords, body} = req;

          if (
            typeof body == 'object' && body &&
            typeof body.asset === 'string' &&
            typeof body.quantity === 'number'
          ) {
            const {asset, quantity} = body;
            const src = backendApi.getAddress(srcWords);
            const wifKey = backendApi.getKey(srcWords);
            const dstWords = backendApi.makeWords();
            const dst = backendApi.getAddress(dstWords);

            backendApi.requestPack(src, dst, asset, quantity, wifKey)
              .then(txid => {
                res.json({
                  words,
                  asset,
                  quantity,
                  txid,
                });
              })
              .catch(err => {
                res.status(500);
                res.send(err.stack);
              });
          } else {
            res.status(400);
            res.send();
          }
        });
        app.post(path.join(prefix, '/api/unpack'), cors, wordsParser, bodyParserJson, (req, res, next) => {
          const {words: dstWords, body} = req;

          if (
            typeof body == 'object' && body &&
            typeof body.words === 'string' &&
            typeof body.asset === 'string' &&
            typeof body.quantity === 'number'
          ) {
            const {words: srcWords, asset, quantity} = body;
            const src = backendApi.getAddress(srcWords);
            const wifKey = backendApi.getKey(srcWords);
            const dst = backendApi.getAddress(dstWords);

            backendApi.requestReceive(src, dst, asset, quantity, wifKey)
              .then(txid => {
                res.json({
                  txid,
                });
              })
              .catch(err => {
                res.status(500);
                res.send(err.stack);
              });
          } else {
            res.status(400);
            res.send();
          }
        });
        app.use(path.join(prefix, '/'), express.static(path.join(__dirname, 'public')));

        return Promise.resolve(app);
      });
  }

  listen({
    hostname = null,
    port = 3000,
  } = {}) {
    this.requestApp()
      .then(app => {
        http.createServer(app)
          .listen(port, hostname, err => {
            if (!err) {
              console.log(`http://${hostname || '127.0.0.1'}:${port}`);
            } else {
              console.warn(err);
            }
          });
      })
      .catch(err => {
        console.warn(err);
      });
  }
}

module.exports = opts => new AssetWallet(opts);

if (!module.parent) {
  new AssetWallet()
    .listen();
}
