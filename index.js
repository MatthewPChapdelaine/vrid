const path = require('path');
const fs = require('fs');
const http = require('http');

const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const express = require('express');
const rollup = require('rollup');
const rollupPluginNodeResolve = require('rollup-plugin-node-resolve');
const rollupPluginCommonJs = require('rollup-plugin-commonjs');
const rollupPluginJson = require('rollup-plugin-json');
const Busboy = require('busboy');

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
  } = {}) {
    this.prefix = prefix;
  }

  requestApp() {
    const {prefix} = this;

    return _requestRollup(path.join(__dirname, 'lib', 'index.js'))
      .then(indexJs => {
        const app = express();
        app.get(path.join(prefix, '/js/index.js'), (req, res, next) => {
          res.type('application/javastript');
          res.send(indexJs);
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
