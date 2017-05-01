const path = require('path');
const fs = require('fs');
const http = require('http');
const child_process = require('child_process');

const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const express = require('express');
const rollup = require('rollup');
const rollupPluginNodeResolve = require('rollup-plugin-node-resolve');
const rollupPluginCommonJs = require('rollup-plugin-commonjs');
const rollupPluginJson = require('rollup-plugin-json');
const Busboy = require('busboy');

const dataPath = path.join(__dirname, 'data');

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
    const assetsStatic = express.static(dataPath);
    function serveAssetsStatic(req, res, next) {
      const asset = req.params[0];
      let filePath = req.params[1];

      const _serveSingle = () => {
        req.url = '/' + asset + filePath;

        res.set('X-Content-Type-Options', 'nosniff');

        assetsStatic(req, res, next);
      };

      if (!/^\/?$/.test(filePath)) {
        _serveSingle();
      } else {
        const fullPath = path.join(dataPath, asset);

        const _serveMultiple = () => {
          res.type('application/octet-stream');
          res.set('Content-Disposition', 'attachment; filename="' + asset + '.zip"');

          const zipProcess = child_process.spawn('zip', [
            '-r',
            '-',
            '.',
          ], {
            cwd: fullPath,
          });

          zipProcess.stdout.pipe(res);
          zipProcess.stderr.pipe(process.stderr);
          zipProcess.on('exit', code => {
            if (code !== 0) {
              res.status(500);
              res.send('zip returned non-zero status code: ' + code);
            }
          });
        };

        fs.readdir(fullPath, (err, files) => {
          if (!err) {
            if (files.length === 0) {
              _serveSingle();
            } else {
              _serveMultiple();
            }
          } else {
            res.status(404);
            res.send();
          }
        });
      }
    }
    app.get(/^\/assets\/([^\/]+)((?:\/.*)?)$/, serveAssetsStatic);
    app.put(/^\/assets\/(.+)$/, (req, res, next) => {
      const id = req.params[0];
      const assetPath = path.join(dataPath, id);

      rimraf(assetPath, err => {
        if (!err) {
          mkdirp(assetPath, err => {
            if (!err) {
              const busboy = new Busboy({
                headers: req.headers,
              });
              busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
                const ws = fs.createWriteStream(path.join(assetPath, fieldname));
                file.pipe(ws);
              });
              busboy.on('finish', () => {
                res.send();
              });

              req.pipe(busboy);
            } else {
              res.status(500);
              res.send(err.stack);
            }
          });
        } else {
          res.status(500);
          res.send(err.stack);
        }
      });
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
