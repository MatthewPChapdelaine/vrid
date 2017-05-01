const path = require('path');
const http = require('http');

const express = require('express');
const rollup = require('rollup');
const rollupPluginNodeResolve = require('rollup-plugin-node-resolve');
const rollupPluginCommonJs = require('rollup-plugin-commonjs');
const rollupPluginJson = require('rollup-plugin-json');

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

_requestRollup(path.join('lib', 'index.js'))
  .then(indexJs => {
    const app = express();

    app.get('/js/index.js', (req, res, next) => {
      res.type('application/javastript');
      res.send(indexJs);
    });
    app.use('/', express.static('public'));

    http.createServer(app)
      .listen(3000, err => {
        if (!err) {
          console.log('http://127.0.0.1:3000');
        } else {
          console.warn(err);
        }
      });
  })
  .catch(err => {
    console.warn(err);
  });
