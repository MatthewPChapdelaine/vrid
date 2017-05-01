window.module = {};

const creaturejs = require('creaturejs');
const api = require('./api.js');

const $ = s => document.querySelectorAll(s);

$('#header-icon')[0].src = creaturejs.makeStaticCreature('user');

const pages = {
  login: () => {
    const pageEl = $('.page.login')[0];
    pageEl.style.display = 'block';

    return () => {
      pageEl.style.display = 'none';
    };
  },
  account: () => {
    const pageEl = $('.page.account')[0];
    pageEl.style.display = 'block';

    return () => {
      pageEl.style.display = 'none';
    };
  },
};

const _boot = () => {
  let pageCleanup = null;
  const _setPage = page => {
    if (pageCleanup) {
      pageCleanup();
      pageCleanup = null;
    }

    pageCleanup = pages[page]();
  };
  _setPage('login');

  $('#logout-button')[0].addEventListener('click', e => {
    _setPage('login');
  });

  const loginInput = $('#login-input')[0];
  $('#login-generate')[0].addEventListener('click', e => {
    loginInput.value = api.makeWords();
  });
  $('#login-form')[0].addEventListener('submit', e => {
    const wordsString = loginInput.value;
    const words = wordsString.split(' ');

    if (words.length === 12) {
      console.log('login', {words});

      _setPage('account');
    } else {
      const err = new Error('invalid words: ' + JSON.stringify(wordsString));
      console.warn(err);
    }

    e.preventDefault();
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
