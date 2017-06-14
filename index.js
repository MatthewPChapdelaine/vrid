const path = require('path');
const fs = require('fs');
const http = require('http');
const querystring = require('querystring');
const crypto = require('crypto');

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
const backendApi = require('./lib/backend-api');

const _readFile = (p, opts) => new Promise((accept, reject) => {
  fs.readFile(p, opts, (err, data) => {
    if (!err) {
      accept(data);
    } else {
      reject(err);
    }
  });
});
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
    origin = '',
    sso: {
      secretKey = 'password',
      emailDomain = 'example.com',
      redirectUrl = 'http://example.com/sso',
    } = {},
  } = {}) {
    this.prefix = prefix;
    this.origin = origin;
    this.sso = {
      secretKey,
      emailDomain,
      redirectUrl,
    };
  }

  requestApp() {
    const {prefix, origin, sso} = this;

    return Promise.all([
      _readFile(path.join(__dirname, 'public', 'index.html'), 'utf8'),
      _requestIndexJsRollup(),
    ])
      .then(([
        indexHtml,
        indexJs,
      ])  => {
        const app = express();
        app.get(path.join(prefix, '/'), (req, res, next) => {
          res.type('text/html');
          res.send(indexHtml);
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
        const ensureOriginError = (req, res, next) => {
          if (req.get('Origin') === origin) {
            next();
          } else {
            res.status(401);
            res.send();
          }
        };
        const ensureWordsDefault = (req, res, next) => {
          if (!req.words) {
            const words = backendApi.makeWords();
            req.words = words;

            _setCookie(res, 'words', words, {
              httpOnly: false,
            });
          }

          next();
        };
        const ensureWordsRespond = defaultJson => (req, res, next) => {
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
        const _setCookie = (res, key, value, {httpOnly = true} = {}) => {
          const valueString = typeof value === 'string' ? value : JSON.stringify(value);
          res.setHeader('Set-Cookie', cookie.serialize(key, valueString, {
            path: '/',
            httpOnly: httpOnly,
            maxAge: 60 * 60 * 24 * 7 * 52 * 10, // 10 years
          }));
        };
        app.options(path.join(prefix, '/api/*'), cors, (req, res, next) => {
          res.send();
        });
        app.get(path.join(prefix, '/sso'), cors, cookieParser, wordsParser, ensureWordsDefault, (req, res, next) => {
          const {query} = req;
          const {sso: ssoBase64String = ''} = query;
          const ssoString = new Buffer(ssoBase64String, 'base64').toString('utf8');
          const ssoJson = querystring.parse(ssoString);
          const {nonce} = ssoJson;

          if (nonce) {
            const {words} = req;
            const address = backendApi.getAddress(words);

            const payload = {
              nonce: nonce,
              email: address + '@' + sso.emailDomain,
              require_activation: false,
              external_id: address,
              username: address,
              name: address,
              suppress_welcome_message: true,
            };
            const payloadString = querystring.stringify(payload);
            const payloadBase64 = new Buffer(payloadString, 'utf8').toString('base64');
            const sigHex = (() => {
              const hmac = crypto.createHmac('sha256', sso.secretKey);
              hmac.update(payloadBase64);
              return hmac.digest('hex');
            })();
            const redirectUrl = sso.redirectUrl + '?' + querystring.stringify({
              sso: payloadBase64,
              sig: sigHex,
            });
            res.redirect(redirectUrl);
          } else {
            res.status(400);
            res.send('Invalid sso query');
          }
        });
        app.get(path.join(prefix, '/api/status'), cors, cookieParser, wordsParser, ensureWordsRespond({
          address: null,
          assets: [],
        }), (req, res, next) => {
          const {words} = req;
          const address = backendApi.getAddress(words);

          Promise.all([
            backendApi.requestUnconfirmedBalances(address),
          ])
            .then(balances => {
              res.json({
                address,
                balances,
              });
            })
            .catch(err => {
              res.status(500);
              res.send(err.stack);
            });
        });
        app.post(path.join(prefix, '/api/charge'), cors, cookieParser, wordsParser, ensureWordsError, bodyParserJson, (req, res, next) => {
          const {words, body} = req;

          if (
            typeof body == 'object' && body &&
            typeof body.asset === 'string' &&
            typeof body.quantity === 'number' &&
            typeof body.srcAddress === 'string' &&
            typeof body.dstAddress === 'string'
          ) {
            const {asset, quantity, srcAddress, dstAddress} = body;

            backendApi.requestCharge(asset, quantity, srcAddress, dstAddress)
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
