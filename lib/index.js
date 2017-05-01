window.module = {};

const creaturejs = require('creaturejs');
const api = require('./api.js');

const $ = s => document.querySelectorAll(s);

const pages = {
  login: () => {
    const navbarEl = $('.navbar.login')[0];
    navbarEl.style.display = 'flex';
    const pageEl = $('.page.login')[0];
    pageEl.style.display = 'block';

    return () => {
      navbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#login-input')[0].value = '';
    };
  },
  account: () => {
    const navbarEl = $('.navbar.account')[0];
    navbarEl.style.display = 'flex';
    const pageEl = $('.page.account')[0];
    pageEl.style.display = 'block';

    return () => {
      navbarEl.style.display = 'none';
      pageEl.style.display = 'none';
    };
  },
  asset: () => {
    const navbarEl = $('.navbar.asset')[0];
    navbarEl.style.display = 'flex';
    const pageEl = $('.page.asset')[0];
    pageEl.style.display = 'block';

    return () => {
      navbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#send-input')[0].value = '';
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
  const accountUsername = $('#account-username')[0];
  const assetUsername = $('#asset-username')[0];
  assetUsername.addEventListener('click', e => {
    _setPage('account');
  });

  const loginInput = $('#login-input')[0];
  $('#login-generate')[0].addEventListener('click', e => {
    loginInput.value = api.makeWords();
  });
  $('#login-form')[0].addEventListener('submit', e => {
    const wordsString = loginInput.value;
    const words = wordsString.split(' ');

    if (words.length === 12) {
      const username = api.getAddress(wordsString);
      accountUsername.innerText = username;
      assetUsername.innerText = username;

      const src = creaturejs.makeStaticCreature('user:' + username);
      [$('#account-icon')[0], $('#asset-icon')[0]].forEach(icon => {
        icon.src = src;
      });

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
      el.onclick = e => {
        _setPage('asset');
      };
      result[i] = el;
    }
    return result;
  })();
  assetEls.forEach(assetEr => {
    assetsGrid.appendChild(assetEr);
  });

  $('#send-form')[0].addEventListener('submit', e => {
    const address = $('#send-input')[0].value;

    if (address) {
      console.log('send', {address});

      e.preventDefault();
    }
  });
};
_boot();
