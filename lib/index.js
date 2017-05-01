window.module = {};

const creaturejs = require('creaturejs');
const api = require('./api.js');

const _boot = () => {
  const $ = s => document.querySelectorAll(s);

  $('#header-icon')[0].src = creaturejs.makeStaticCreature('user');

  $('#login-form')[0].addEventListener('submit', e => {
    const wordsString = $('#login-input')[0].value;
    const words = wordsString.split(' ');

    if (words.length === 12) {
      console.log('login', {words});
    } else {
      const err = new Error('invalid words: ' + JSON.stringify(wordsString));
      console.warn(err);
    }
  });

  const assetsGrid = $('#assets-grid')[0];
  const assetEls = (() => {
    const result = Array(10);
    for (let i = 0; i < result.length; i++) {
      const el = document.createElement('a');
      el.href = '#';
      el.classList.add('asset');
      el.innerHTML = `\
        Asset
      `;
      result[i] = el;
    }
    return result;
  })();
  assetEls.forEach(assetEr => {
    assetsGrid.appendChild(assetEr);
  });
};
_boot();
