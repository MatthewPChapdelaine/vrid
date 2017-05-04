window.module = {};

const Cookies = require('js-cookie');
const creaturejs = require('creaturejs');
const api = require('./frontend-api.js');

window.$ = s => document.querySelectorAll(s);

const _makeAssetName = () => {
  const min = 95428956661682180; // bigint(26).pow(12).add(1).toJSNumber()
  const max = 18446744073709552000; // bigint(256).pow(8).toJSNumber()
  return 'A' + (min + (Math.random() * (max - min)));
};

const pages = {
  login: () => {
    const pageEl = $('.page.login')[0];
    pageEl.style.display = 'block';

    const privateKeyValue = $('#private-key-value')[0];
    privateKeyValue.innerText = '';

    return () => {
      pageEl.style.display = 'none';

      $('#login-input')[0].value = '';
    };
  },
  actionConfirm: () => {
    const pageEl = $('.page.action-confirm')[0];
    pageEl.style.display = 'block';

    return () => {
      pageEl.style.display = 'none';
    };
  },
  actionLogin: () => {
    const pageEl = $('.page.action-login')[0];
    pageEl.style.display = 'block';

    return () => {
      pageEl.style.display = 'none';

      $('#action-login-input')[0].value = '';
    };
  },
  account: () => {
    const statusbarEl = $('.statusbar.account')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.account')[0];
    pageEl.style.display = 'block';

    return () => {
      statusbarEl.style.display = 'none';
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
    const statusbarEl = $('.statusbar.asset')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.asset')[0];
    pageEl.style.display = 'block';

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#asset-assetname')[0].innerText = '';
      $('#send-asset-address-input')[0].value = '';
      $('#send-asset-quantity-input')[0].value = '';
      $('#issue-input')[0].value = '';
      $('#transfer-input')[0].value = '';
    };
  },
  btc: () => {
    const statusbarEl = $('.statusbar.btc')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.btc')[0];
    pageEl.style.display = 'block';

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#send-btc-address-input')[0].value = '';
      $('#send-btc-quantity-input')[0].value = '';
    };
  },
  xcp: () => {
    const statusbarEl = $('.statusbar.xcp')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.xcp')[0];
    pageEl.style.display = 'block';

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#send-xcp-address-input')[0].value = '';
      $('#send-xcp-quantity-input')[0].value = '';
    };
  },
  createAsset: () => {
    const statusbarEl = $('.statusbar.create-asset')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.create-asset')[0];
    pageEl.style.display = 'block';

    const createAssetNameInput = $('#create-asset-name-input')[0];
    createAssetNameInput.value = _makeAssetName();
    createAssetNameInput.focus();
    createAssetNameInput.select();

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#create-asset-name-input')[0].value = '';
      $('#create-asset-description-input')[0].value = '';
      $('#create-asset-quantity-input')[0].value = 1;
    };
  },
  createBurn: () => {
    const statusbarEl = $('.statusbar.create-burn')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.create-burn')[0];
    pageEl.style.display = 'block';

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#create-burn-quantity-input')[0].value = '';
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

  const _login = words => {
    const address = api.getAddress(words);
    const key = api.getKey(words);

    Cookies.set('words', words, {
      expires: 365,
    });

    const _loadSync = () => {
      actionUsername.innerText = address;
      accountUsername.innerText = address;
      btcUsername.innerText = address;
      xcpUsername.innerText = address;
      assetUsername.innerText = address;
      createAssetUsername.innerText = address;
      createBurnUsername.innerText = address;

      const src = creaturejs.makeStaticCreature('user:' + address);
      [
        $('#account-icon')[0],
        $('#btc-icon')[0],
        $('#xcp-icon')[0],
        $('#asset-icon')[0],
        $('#create-asset-icon')[0],
        $('#create-burn-icon')[0],
      ].forEach(icon => {
        icon.src = src;
      });

      privateKeyValue.innerText = key;

      $('#btc-balance-value')[0].innerText = 0;
    };
    const _loadAsync = () => {
      Promise.all([
        api.requestBTCBalance(address),
        api.requestXCPBalance(address),
        api.requestAssetBalances(address),
      ])
        .then(([
          btcBalance,
          xcpBalance,
          assetBalances,
        ]) => {
          $('#btc-balance-value')[0].innerText = btcBalance.toFixed(8);
          $('#xcp-balance-value')[0].innerText = xcpBalance.toFixed(8);

          const assetsGrid = $('#assets-grid')[0];
          while (assetsGrid.hasChildNodes()) {
            assetsGrid.removeChild(assetsGrid.lastChild);
          }
          const assetEls = assetBalances.map(({asset, quantity}) => {
            const el = document.createElement('a');
            el.classList.add('asset');
            el.innerHTML = `\
              <div class=name>${asset}</div>
              <div class=quantity>${quantity}</div>
            `;
            el.addEventListener('click', e => {
              const assetAssetname = $('#asset-assetname')[0];
              assetAssetname.innerText = asset;

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
  };
  const _logout = () => {
    Cookies.remove('words');
  };
  const _postMessage = m => {
    window.parent.postMessage(m, '*');
  };

  $('#action-logout-button')[0].addEventListener('click', e => {
    _logout();

    _setPage('actionLogin');
  });
  [
    $('#account-logout-button')[0],
    $('#asset-logout-button')[0],
    $('#create-asset-logout-button')[0],
    $('#create-burn-logout-button')[0],
  ].forEach(logoutButton => {
    logoutButton.addEventListener('click', e => {
      _logout();

      _setPage('login');
    });
  });
  const actionUsername = $('#action-username')[0];
  const accountUsername = $('#account-username')[0];
  const btcUsername = $('#btc-username')[0];
  const xcpUsername = $('#xcp-username')[0];
  const assetUsername = $('#asset-username')[0];
  const createAssetUsername = $('#create-asset-username')[0];
  const createBurnUsername = $('#create-burn-username')[0];
  [btcUsername, xcpUsername, assetUsername, createAssetUsername, createBurnUsername].forEach(username => {
    username.addEventListener('click', e => {
      _setPage('account');
    });
  });

  const loginInput = $('#login-input')[0];
  loginInput.focus();
  $('#login-generate')[0].addEventListener('click', e => {
    loginInput.value = api.makeWords();
    loginInput.focus();
    loginInput.select();
  });
  $('#login-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const words = loginInput.value;
    const wordsArray = words.split(' ');

    if (wordsArray.length === 12) {
      _login(words);

      _setPage('account');
    } else {
      const err = new Error('invalid words: ' + JSON.stringify(words));
      console.warn(err);
    }
  });
  $('#action-login-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const words = $('#action-login-input')[0].value;
    const wordsArray = words.split(' ');

    if (wordsArray.length === 12) {
      _login(words);

      _setPage('actionConfirm'); // XXX should retry the action here instead of assuming it was a confirmation
    } else {
      const err = new Error('invalid words: ' + JSON.stringify(words));
      console.warn(err);
    }
  });

  $('#approve-button')[0].addEventListener('click', e => {
    _postMessage({ // XXX make this actually perform the send and return the txid
      id: id,
      result: 'accept',
    });
  });
  $('#reject-button')[0].addEventListener('click', e => {
    _postMessage({
      id: id,
      result: 'reject',
    });
  });

  $('#btc-balance')[0].addEventListener('click', e => {
    const asset = 'BTC';

    const assetAssetname = $('#asset-assetname')[0];
    assetAssetname.innerText = asset;

    _setPage('btc');
  });
  $('#xcp-balance')[0].addEventListener('click', e => {
    const asset = 'XCP';

    const assetAssetname = $('#asset-assetname')[0];
    assetAssetname.innerText = asset;

    _setPage('xcp');
  });

  $('#create-asset')[0].addEventListener('click', e => {
    _setPage('createAsset');
  });
  $('#create-burn')[0].addEventListener('click', e => {
    _setPage('createBurn');
  });

  $('#get-mempool')[0].addEventListener('click', e => {
    const mempoolData = $('#mempool-data')[0];
    mempoolData.innerText = '';

    api.requestMempool()
      .then(mempool => {
        mempoolData.innerText = JSON.stringify(mempool, null, 2);
      })
      .catch(err => {
        console.warn(err);
      });
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

  $('#send-asset-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const address = $('#send-asset-address-input')[0].value;
    const quantity = $('#send-asset-quantity-input')[0].value;

    if (address) {
      console.log('send asset', {address, quantity});
    }
  });
  $('#send-btc-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const address = $('#send-btc-address-input')[0].value;
    const quantity = $('#send-btc-quantity-input')[0].value;

    if (address) {
      console.log('send btc', {address, quantity});
    }
  });
  $('#send-xcp-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const address = $('#send-xcp-address-input')[0].value;
    const quantity = $('#send-xcp-quantity-input')[0].value;

    if (address) {
      console.log('send xcp', {address, quantity});
    }
  });

  $('#create-asset-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const assetName = $('#create-asset-name-input')[0].value;
    const assetDescription = $('#create-asset-description-input')[0].value;
    const assetQuantity = parseInt($('#create-asset-quantity-input')[0].value, 10);
    const assetDivisible = $('#create-asset-divisible-input')[0].checked;

    if (assetName && !isNaN(assetQuantity)) {
      const src = createAssetUsername.innerText;
      const wifKey = privateKeyValue.innerText;

      api.requestIssuance(src, assetName, assetDescription, assetQuantity, assetDivisible, wifKey)
        .then(tx => {
          console.log('issued', tx);
        })
        .catch(err => {
          console.warn(err);
        });
    }
  });
  const createAssetNameInput = $('#create-asset-name-input')[0];
  createAssetNameInput.addEventListener('blur', e => {
     createAssetNameInput.value = createAssetNameInput.value.toUpperCase().replace(/[^a-z0-9]/ig, '');
  });
  $('#create-asset-generate')[0].addEventListener('click', e => {
    createAssetNameInput.value = _makeAssetName();
    createAssetNameInput.focus();
    createAssetNameInput.select();
  });

  $('#create-burn-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const burnQuantity = parseInt($('#create-burn-quantity-input')[0].value, 10);

    if (!isNaN(burnQuantity)) {
      const src = createAssetUsername.innerText;
      const wifKey = privateKeyValue.innerText;

      api.requestBurn(src, burnQuantity, wifKey)
        .then(tx => {
          console.log('burned', tx);
        })
        .catch(err => {
          console.warn(err);
        });
    }
  });

  const _getQueryVariable = variable => {
    const vars = window.location.search.slice(1).split('&');

    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');

      if (decodeURIComponent(pair[0]) === variable) {
        return decodeURIComponent(pair[1]);
      }
    }

    return null;
  };
  const words = Cookies.get('words');
  const action = _getQueryVariable('x');
  const id = _getQueryVariable('i');
  if (words) {
    _login(words);

    if (action && id) {
      document.body.classList.add('iframe');

      if (action === 'send') {
        const dst = _getQueryVariable('d');
        const asset = _getQueryVariable('a');
        const quantity = parseInt(_getQueryVariable('v'), 10);

        if (dst && asset && !isNaN(quantity)) {
          _setPage('actionConfirm');
        } else {
          _postMessage({
            id: id,
            error: 'invalid arguments',
          });
        }
      } else if (action === 'verify') {
        const dst = _getQueryVariable('d');
        const asset = _getQueryVariable('a');
        const quantity = parseInt(_getQueryVariable('v'), 10);

        if (dst && asset && !isNaN(quantity)) {
          const src = api.getAddress(words);

          api.requestVerify(src, dst, asset, quantity)
            .then(ok => {
              _postMessage({
                id: id,
                result: ok,
              });
            })
            .catch(err => {
              _postMessage({
                id: id,
                result: false,
              });
            });
        } else {
          _postMessage({
            id: id,
            error: 'invalid arguments',
          });
        }
      } else if (action === 'status') {
        const src = api.getAddress(words);

        api.requestStatus(src)
          .then(status => {
            _postMessage({
              id: id,
              result: status,
            });
          })
          .catch(err => {
            _postMessage({
              id: id,
              error: err,
            });
          });
      } else if (action === 'receive') {
        const src = _getQueryVariable('s');
        const asset = _getQueryVariable('a');
        const quantity = parseInt(_getQueryVariable('v'), 10);
        const wifKey = _getQueryVariable('k');

        if (src && asset && !isNaN(quantity) && wifKey) {
          const dst = api.getAddress(words);

          api.requestSend(src, dst, asset, quantity, wifKey)
            .then(() => {
              _postMessage({
                id: id,
                result: true,
              });
            })
            .catch(err => {
              _postMessage({
                id: id,
                result: false,
              });
            });
        } else {
          _postMessage({
            id: id,
            error: 'invalid arguments',
          });
        }
      } else {
        _postMessage({
          id: id,
          error: 'invalid action',
        });
      }
    } else {
      _setPage('account');
    }
  } else {
    if (action && id) {
      if (action === 'status') {
        _postMessage({
          id: id,
          result: null,
        });
      } else {
        document.body.classList.add('iframe');

        _setPage('actionLogin');
      }
    } else {
      _setPage('login');
    }
  }
};
_boot();
