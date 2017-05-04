const path = require('path');
const fs = require('fs');
const http = require('http');

const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const express = require('express');
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
      _requestRollup(path.join(__dirname, 'lib', 'index.js'))
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
        app.post(path.join(prefix, '/api/login'), (req, res, next) => {
          const authorization = req.get('Authorization');

          const _respondInvalid = () => {
            res.status(400);
            res.send();
          };

          if (authorization) {
            const wordsString = authorization.match(/^Words (.+)$/);

            if (wordsString) {
              res.set('Set-Cookie', 'words=' + wordsString + '; HttpOnly');
              res.send();
            } else {
              _respondInvalid();
            }
          } else {
            _respondInvalid();
          }
        });
        app.post(path.join(prefix, '/api/logout'), (req, res, next) => {
          res.set('Set-Cookie', 'words=deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT');
          res.send();
        });
        app.get(path.join(prefix, '/api/status'), (req, res, next) => {
          const cookieHeader = req.get('Cookie');

          const _respondDefault = () => {
            res.json({
              assets: [],
            });
          };

          if (cookieHeader) {
            const c = cookie.parse(cookieHeader);
            const words = c && c.words;

            if (words) {
              const address = backendApi.getAddress(words);

              backendApi.requestAssetBalances(address)
                .then(assetSpecs => {
                  res.json({
                    assets: assetSpecs,
                  });
                })
                .catch(err => {
                  res.status(500);
                  res.send(err.stack);
                });
            } else {
              _respondDefault();
            }
          } else {
            _respondDefault();
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
