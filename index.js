const path = require('path');
const fs = require('fs');
const http = require('http');
const querystring = require('querystring');
const crypto = require('crypto');

const mkdirp = require('mkdirp');
const express = require('express');
const bodyParser = require('body-parser');
const bodyParserJson = bodyParser.json();
const cookie = require('cookie');
const rollup = require('rollup');
const rollupPluginNodeResolve = require('rollup-plugin-node-resolve');
const rollupPluginCommonJs = require('rollup-plugin-commonjs');
const rollupPluginJson = require('rollup-plugin-json');
const eccrypto = require('eccrypto-sync');
const backendApiLib = require('./lib/backend-api');

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

class Vrid {
  constructor({
    prefix = '',
    origin = '',
    crdsUrl = '',
    sso: {
      secretKey = 'password',
      emailDomain = 'example.com',
      redirectUrl = 'http://example.com/sso',
    } = {},
  } = {}) {
    this.prefix = prefix;
    this.origin = origin;
    this.crdsUrl = crdsUrl;
    this.sso = {
      secretKey,
      emailDomain,
      redirectUrl,
    };
  }

  requestApp() {
    const {prefix, origin, crdsUrl, sso} = this;

    const backendApi = backendApiLib({crdsUrl});
    const _requestIndexJsRollup = () => _requestRollup(path.join(__dirname, 'lib', 'index.js'))
      .then(code => code.replace(/CRDS_URL/g, () => crdsUrl));

    return Promise.all([
      _readFile(path.join(__dirname, 'public', 'index.html'), 'utf8'),
      _requestIndexJsRollup(),
    ])
      .then(([
        indexHtml,
        indexJs,
      ]) => {
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
        const privateKeyParser = (req, res, next) => {
          const privateKey = req.cookie && req.cookie.privateKey;

          if (privateKey) {
            req.privateKey = privateKey;
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
        const ensurePrivateKeyDefault = (req, res, next) => {
          if (!req.privateKey) {
            const privateKey = crypto.randomBytes(32).toString('base64');
            req.privateKey = privateKey;

            _setCookie(res, 'privateKey', privateKey, {
              httpOnly: false,
            });
          }

          next();
        };
        const ensurePrivateKeyRespond = defaultJson => (req, res, next) => {
          if (req.privateKey) {
            next();
          } else {
            res.json(defaultJson);
          }
        };
        /* const ensurePrivateKeyError = (req, res, next) => {
          if (req.privateKey) {
            next();
          } else {
            res.status(401);
            res.send();
          }
        }; */
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
        app.get(path.join(prefix, '/sso'), cors, cookieParser, privateKeyParser, ensurePrivateKeyDefault, (req, res, next) => {
          const {query} = req;
          const {sso: ssoBase64String = ''} = query;
          const ssoString = new Buffer(ssoBase64String, 'base64').toString('utf8');
          const ssoJson = querystring.parse(ssoString);
          const {nonce} = ssoJson;

          if (nonce) {
            const {privateKey} = req;
            const privateKeyBuffer = new Buffer(privateKey, 'base64');
            const publicKey = eccrypto.getPublic(privateKeyBuffer);
            const publicKeyString = publicKey.toString('base64');
            const address = publicKeyString;

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
        app.get(path.join(prefix, '/api/status'), cors, cookieParser, privateKeyParser, ensurePrivateKeyRespond({
          address: null,
          assets: [],
        }), (req, res, next) => {
          const {privateKey} = req;
          const privateKeyBuffer = new Buffer(privateKey, 'base64');
          const publicKey = eccrypto.getPublic(privateKeyBuffer);
          const publicKeyString = publicKey.toString('base64');
          const address = publicKeyString;

          backendApi.requestUnconfirmedBalances(address)
            .then(balances => {
              const assets = Object.keys(balances).map(asset => ({
                asset: asset,
                quantity: balances[asset],
              }));

              res.json({
                address,
                assets,
              });
            })
            .catch(err => {
              res.status(500);
              res.send(err.stack);
            });
        });
        app.post(path.join(prefix, '/api/charge'), cors, cookieParser, bodyParserJson, (req, res, next) => {
          const {body} = req;

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

module.exports = opts => new Vrid(opts);

if (!module.parent) {
  new Vrid()
    .listen();
}
