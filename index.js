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
    origin = '',
  } = {}) {
    this.prefix = prefix;
    this.head = head;
    this.body = body;
  }

  requestApp() {
    const {prefix, head, body} = this;

    return Promise.all([
      transclude.requestFileTranscludeRequestHandler(path.join(__dirname, 'public', 'index.html'), s =>
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
          res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.set('Access-Control-Allow-Credentials', true);

          next();
        };
        const cookieParser = (req, res, next) => {
          const cookieHeader = req.get('Cookie');

          if (cookieHeader) {
            req.cookie = cookie.parse(cookieHeader);
          }

          next();
        };
        const wordsParser = (req, res, next) => {
          const words = req.cookie && req.cookie.words;

          if (words) {
            req.words = words;
          }

          next();
        };
        const authorizedParser = (req, res, next) => {
          const authorizedString = req.cookie && req.cookie.authorized;

          if (authorizedString) {
            const authorized = _jsonParse(authorizedString);

            if (authorized !== undefined) {
              req.authorized = authorized;
            }
          }

          next();
        };
        const ensureWordsDefault = defaultJson => (req, res, next) => {
          if (req.words) {
            next();
          } else {
            res.json(defaultJson);
          }
        };
        const ensureWordsError = (req, res, next) => {
          if (req.words) {
            next();
          } else {
            res.status(401);
            res.send();
          }
        };
        const _setCookie = (res, key, value) => {
          res.setHeader('Set-Cookie', cookie.serialize(key, JSON.stringify(value), {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7 * 52 * 10, // 10 years
          }));
        };
        app.options(path.join(prefix, '/api/*'), cors, (req, res, next) => {
          res.send();
        });
        app.get(path.join(prefix, '/api/cookie/:key'), cors, cookieParser, (req, res, next) => {
          const insecureString = req.cookie && req.cookie.insecure;

          if (insecureString) {
            const insecure = _jsonParse(insecureString);

            if (typeof insecure === 'object' && insecure && !Array.isArray(insecure)) {
              const {key} = req.params;
              const value = insecure[key];

              res.json({
                result: value,
              });
            } else {
              res.json({
                result: null,
              });
            }
          } else {
            res.json({
              result: null,
            });
          }
        });
        app.post(path.join(prefix, '/api/cookie/:key'), cors, bodyParserJson, (req, res, next) => {
          const insecure = (() => {
            const insecureString = req.cookie && req.cookie.insecure;

            if (insecureString) {
              const insecure = _jsonParse(insecureString);

              if (typeof insecure === 'object' && insecure && !Array.isArray(insecure)) {
                return insecure;
              } else {
                return {};
              }
            } else {
              return {};
            }
          })();
          const {key} = req.params;
          const {value = null} = req.body;
          insecure[key] = value;

          _setCookie(res, 'insecure', insecure);

          res.json({
            result: value,
          });
        });
        app.get(path.join(prefix, '/api/status'), cors, cookieParser, wordsParser, authorizedParser, ensureWordsDefault({
          address: null,
          assets: [],
          authorized: [],
        }), (req, res, next) => {
          const {words, authorized} = req;
          const address = backendApi.getAddress(words);

          Promise.all([
            backendApi.requestLiveBTCBalance(address),
            backendApi.requestLiveAssetBalances(address),
          ])
            .then(([
              btcBalance,
              assetSpecs,
            ]) => {
              res.json({
                address: address,
                balance: btcBalance,
                assets: assetSpecs,
                authorized: authorized,
              });
            })
            .catch(err => {
              res.status(500);
              res.send(err.stack);
            });
        });
        app.get(path.join(prefix, '/api/authorize'), cors, cookieParser, authorizedParser, bodyParserJson, (req, res, next) => {
          const {authorized, body} = req;

          if (
            typeof body == 'object' && body &&
            typeof body.url === 'string'
          ) {

          if (req.get('Origin') === origin) {
            const {authorized} = req;
            const {url} = body;

            if (!authorized.includes(url)) {
              authorized.push(url);
            }

            _setCookie(res, 'authorized', authorized);

            res.json({
              result: authorized,
            });
          } else {
            res.status(401);
            res.send();
          }
        });
        app.post(path.join(prefix, '/api/pay'), cors, cookieParser, wordsParser, ensureWordsError, bodyParserJson, (req, res, next) => {
          const {words, body} = req;

          if (
            typeof body == 'object' && body &&
            typeof body.address === 'string' &&
            typeof body.asset === 'string' &&
            typeof body.quantity === 'number'
          ) {
            const {address, asset, quantity} = body;
            const dst = address;
            const src = backendApi.getAddress(words);
            const wifKey = backendApi.getKey(words);

            backendApi.requestSend(src, dst, asset, quantity, wifKey)
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
        app.post(path.join(prefix, '/api/buy'), cors, cookieParser, wordsParser, ensureWordsError, bodyParserJson, (req, res, next) => {
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
        app.post(path.join(prefix, '/api/pack'), cors, cookieParser, wordsParser, ensureWordsError, bodyParserJson, (req, res, next) => {
          const {words: srcWords, body} = req;

          if (
            typeof body == 'object' && body &&
            typeof body.words === 'string' &&
            typeof body.value === 'number'
          ) {
            const {words: dstWords, value} = body;
            const src = backendApi.getAddress(srcWords);
            const wifKey = backendApi.getKey(srcWords);
            const dst = backendApi.getAddress(dstWords);

            backendApi.requestPackBTC(src, dst, value, wifKey)
              .then(txid => {
                res.json({
                  words: dstWords,
                  value,
                  txid,
                });
              })
              .catch(err => {
                res.status(500);
                res.send(err.stack);
              });
          } else if (
            typeof body == 'object' && body &&
            typeof body.words === 'string' &&
            typeof body.asset === 'string' &&
            typeof body.quantity === 'number'
          ) {
            const {words: dstWords, asset, quantity} = body;
            const src = backendApi.getAddress(srcWords);
            const wifKey = backendApi.getKey(srcWords);
            const dst = backendApi.getAddress(dstWords);

            backendApi.requestPackAsset(src, dst, asset, quantity, wifKey)
              .then(txid => {
                res.json({
                  words: dstWords,
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
        app.post(path.join(prefix, '/api/unpack'), cors, cookieParser, wordsParser, ensureWordsError, bodyParserJson, (req, res, next) => {
          const {words: dstWords, body} = req;

          if (
            typeof body == 'object' && body &&
            typeof body.words === 'string' &&
            typeof body.value === 'number'
          ) {
            const {words: srcWords, value} = body;
            const src = backendApi.getAddress(srcWords);
            const wifKey = backendApi.getKey(srcWords);
            const dst = backendApi.getAddress(dstWords);

            backendApi.requestReceiveBTC(src, dst, value, wifKey)
              .then(txid => {
                res.json({
                  txid,
                });
              })
              .catch(err => {
                res.status(500);
                res.send(err.stack);
              });
          } else if (
            typeof body == 'object' && body &&
            typeof body.words === 'string' &&
            typeof body.asset === 'string' &&
            typeof body.quantity === 'number'
          ) {
            const {words: srcWords, asset, quantity} = body;
            const src = backendApi.getAddress(srcWords);
            const wifKey = backendApi.getKey(srcWords);
            const dst = backendApi.getAddress(dstWords);

            backendApi.requestReceiveAsset(src, dst, asset, quantity, wifKey)
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

const _jsonParse = s => {
  let error = null;
  let result;
  try {
    result = JSON.parse(s);
  } catch (err) {
    error = err;
  }
  if (!error) {
    return result;
  } else {
    return undefined;
  }
};

module.exports = opts => new AssetWallet(opts);

if (!module.parent) {
  new AssetWallet()
    .listen();
}
