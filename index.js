const http = require('http');

const express = require('express');

const app = express();
app.use('/', express.static('public'));
http.createServer(app)
  .listen(3000, err => {
    if (!err) {
      console.log('http://127.0.0.1:3000');
    } else {
      console.warn(err);
    }
  });
