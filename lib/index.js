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

    const privateKeyValue = $('#private-key-value')[0];
    privateKeyValue.innerText = '';

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

      const showPrivateKey = $('#show-private-key')[0];
      const hidePrivateKey = $('#hide-private-key')[0];

      const privateKeyValue = $('#private-key-value')[0];
      showPrivateKey.style.display = 'block';
      hidePrivateKey.style.display = 'none';
      privateKeyValue.classList.remove('visible');
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

      $('#asset-assetname')[0].innerText = '';
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

  [$('#account-logout-button')[0], $('#asset-logout-button')[0]].forEach(logoutButton => {
    logoutButton.addEventListener('click', e => {
      _setPage('login');
    });
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
    e.preventDefault();

    const wordsString = loginInput.value;
    const words = wordsString.split(' ');

    if (words.length === 12) {
      const address = api.getAddress(wordsString);
      const key = api.getKey(wordsString);

      const _loadSync = () => {
        accountUsername.innerText = address;
        assetUsername.innerText = address;

        const src = creaturejs.makeStaticCreature('user:' + address);
        [$('#account-icon')[0], $('#asset-icon')[0]].forEach(icon => {
          icon.src = src;
        });

        privateKeyValue.innerText = key;

        $('#bitcoin-balance-value')[0].innerText = 0;
      };
      const _loadAsync = () => {
        Promise.all([
          api.requestBitcoinBalance(address),
          api.requestAssetBalances(address),
        ])
          .then(([
            bitcoinBalance,
            assetBalances,
          ]) => {
            $('#bitcoin-balance-value')[0].innerText = bitcoinBalance.toFixed(8);

            const assetsGrid = $('#assets-grid')[0];
            while (assetsGrid.hasChildNodes()) {
              assetsGrid.removeChild(assetsGrid.lastChild);
            }
            const assetEls = assetBalances.map(({asset, quantity}) => {
              const el = document.createElement('a');
              el.classList.add('asset');
              el.innerHTML = `\
                <div class=quantity>${quantity}</div>
                <div class=name>${asset}</div>
              `;
              el.addEventListener('click', e => {
                const assetAssetname = $('#asset-assetname')[0];
                assetAssetname.innerText = asset;

                const downloadAsset = $('#download-asset')[0];
                downloadAsset.href = `/assets/${asset}`;

                _setPage('asset');
              });
              return el;
            });
            for (let i = 0; i < assetEls.length; i++) {
              const assetEl = assetEls[i];
              assetsGrid.appendChild(assetEl);
            }
          })
          .catch(err => {
            console.warn(err);
          });
      };
      _loadSync();
      _loadAsync();

      _setPage('account');
    } else {
      const err = new Error('invalid words: ' + JSON.stringify(wordsString));
      console.warn(err);
    }
  });

  $('#bitcoin-balance')[0].addEventListener('click', e => {
    const asset = 'BTC';

    const assetAssetname = $('#asset-assetname')[0];
    assetAssetname.innerText = asset;

    const downloadAsset = $('#download-asset')[0];
    downloadAsset.href = `/assets/${asset}`;

    _setPage('asset');
  });

  const showPrivateKey = $('#show-private-key')[0];
  const hidePrivateKey = $('#hide-private-key')[0];
  const privateKeyValue = $('#private-key-value')[0];
  showPrivateKey.addEventListener('click', e => {
    privateKeyValue.classList.add('visible');
    showPrivateKey.style.display = 'none';
    hidePrivateKey.style.display = 'block';
  });
  hidePrivateKey.addEventListener('click', e => {
    privateKeyValue.classList.remove('visible');
    showPrivateKey.style.display = 'block';
    hidePrivateKey.style.display = 'none';
  });

  const uploadAssetContainer = $('#upload-asset-container')[0];
  const uploadAsset = $('#upload-asset')[0];
  uploadAsset.addEventListener('click', e => {
    setTimeout(() => {
      const uploadAssetFile = $('#upload-asset-file')[0];
      uploadAssetContainer.removeChild(uploadAssetFile);
      uploadAssetContainer.appendChild(_makeUploadAssetFile());

      if (document.activeElement) {
        document.activeElement.blur();
      }
    });
  });
  const _makeUploadAssetFile = () => {
    const uploadAssetFile = document.createElement('input');
    uploadAssetFile.type = 'file';
    uploadAssetFile.name = 'upload-asset-file';
    uploadAssetFile.id = 'upload-asset-file';
    uploadAssetFile.addEventListener('change', e => {
      const files = e.target.files;

      console.log('upload files', files);
    });
    return uploadAssetFile;
  };
  uploadAssetContainer.appendChild(_makeUploadAssetFile());

  $('#send-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const address = $('#send-input')[0].value;

    if (address) {
      console.log('send', {address});
    }
  });
};
_boot();
