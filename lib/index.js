window.module = {};

const Cookies = require('js-cookie');
const creaturejs = require('creaturejs');
const frontendApi = require('./frontend-api.js');

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
  actionLogout: () => {
    const pageEl = $('.page.action-logout')[0];
    pageEl.style.display = 'block';

    return () => {
      pageEl.style.display = 'none';
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

    $('#deploy-asset-words-input')[0].value = frontendApi.makeWords();

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#asset-assetname')[0].innerText = '';
      $('#send-asset-address-input')[0].value = '';
      $('#send-asset-quantity-input')[0].value = '';
      $('#deploy-asset-words-input')[0].value = '';
      $('#deploy-asset-quantity-input')[0].value = '';
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
    const address = frontendApi.getAddress(words);
    const key = frontendApi.getKey(words);

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
        frontendApi.requestBTCBalance(address),
        frontendApi.requestXCPBalance(address),
        frontendApi.requestAssetBalances(address),
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
              $('#asset-assetname')[0].innerText = asset;

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

  const _load = spec => {
    const words = Cookies.get('words');
    const action = spec.x;

    if (words) {
      if (action) {
        document.body.classList.add('iframe');

        if (action === 'send') {
          const dst = spec.d;
          const asset = spec.a;
          const quantity = parseInt(spec.v, 10);

          if (dst && asset && !isNaN(quantity)) {
            _setPage('actionConfirm');
          } else {
            _respond('invalid arguments');
          }
        } else if (action === 'verify') {
          const dst = spec.d;
          const asset = spec.a;
          const quantity = parseInt(spec.v, 10);

          if (dst && asset && !isNaN(quantity)) {
            const src = frontendApi.getAddress(words);

            frontendApi.requestVerify(src, dst, asset, quantity)
              .then(ok => {
                _respond(null, ok);
              })
              .catch(err => {
                _respond(null, false);
              });
          } else {
            _respond('invalid arguments');
          }
        } else if (action === 'status') {
          const src = frontendApi.getAddress(words);

          frontendApi.requestStatus(src)
            .then(status => {
              _respond(null, status);
            })
            .catch(err => {
              _respond(err);
            });
        } else if (action === 'receive') {
          const src = spec.s;
          const asset = spec.a;
          const quantity = parseInt(spec.v, 10);
          const wifKey = spec.k;

          if (src && asset && !isNaN(quantity) && wifKey) {
            const dst = frontendApi.getAddress(words);

            frontendApi.requestSend(src, dst, asset, quantity, wifKey)
              .then(() => {
                _respond(null, true);
              })
              .catch(err => {
                _respond(null, false);
              });
          } else {
            _respond('invalid arguments');
          }
        } else if (action === 'login') {
          _setPage('actionLogin');
        } else if (action === 'logout') {
          _setPage('actionLogout');
        } else {
          _respond('invalid action');
        }
      } else {
        _setPage('account');
      }
    } else {
      if (action) {
        if (action === 'status') {
          _respond(null, null);
        } else {
          document.body.classList.add('iframe');

          _setPage('actionLogin');
        }
      } else {
        _setPage('login');
      }
    }

    window.addEventListener('beforeunload', () => {
      _respond({
        error: 'window closed',
      });
    });
  };
  const _postMessage = (() => {
    const target = window.opener || window.parent || window;

    return m => {
      target.postMessage(m, '*');
    };
  })();
  const _respond = (error, result) => {
    const o = {};
    if (!error) {
      o.result = result;
    } else {
      o.error = error;
    }
    _postMessage(o);
  };

  $('#action-confirm-logout-button')[0].addEventListener('click', e => {
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
  const assetAssetname = $('#asset-assetname')[0];
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
    loginInput.value = frontendApi.makeWords();
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
  const actionLoginInput = $('#action-login-input')[0];
  $('#action-login-generate')[0].addEventListener('click', e => {
    actionLoginInput.value = frontendApi.makeWords();
    actionLoginInput.focus();
    actionLoginInput.select();
  });
  $('#action-login-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const words = actionLoginInput.value;
    const wordsArray = words.split(' ');

    if (wordsArray.length === 12) {
      _login(words);

      _respond(null, true);
      // _setPage('actionConfirm'); // XXX should retry the action here instead of assuming it was a confirmation
    } else {
      const err = new Error('invalid words: ' + JSON.stringify(words));
      console.warn(err);
    }
  });
  $('#action-logout-confirm-button')[0].addEventListener('click', e => {
    _logout();

    _respond(null, true);
  });
  $('#action-logout-cancel-button')[0].addEventListener('click', e => {
    _respond(null, false);
  });

  $('#approve-button')[0].addEventListener('click', e => {
    _respond(null, 'accept'); // XXX make this actually perform the send and return the txid
  });
  $('#reject-button')[0].addEventListener('click', e => {
    _respond(null, 'reject');
  });

  $('#btc-balance')[0].addEventListener('click', e => {
    const asset = 'BTC';

    $('#asset-assetname')[0].innerText = asset;

    _setPage('btc');
  });
  $('#xcp-balance')[0].addEventListener('click', e => {
    const asset = 'XCP';

    $('#asset-assetname')[0].innerText = asset;

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

    frontendApi.requestMempool()
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
    const quantity = parseInt($('#send-asset-quantity-input')[0].value, 10);

    if (address && !isNaN(quantity)) {
      console.log('send asset', {address, quantity});
    }
  });
  const deployAsssetsWordInput = $('#deploy-asset-words-input')[0];
  deployAsssetsWordInput.addEventListener('click', e => {
    deployAsssetsWordInput.focus();
    deployAsssetsWordInput.select();
  });
  $('#deploy-asset-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const words = $('#deploy-asset-words-input')[0].value;
    const quantity = parseInt($('#deploy-asset-quantity-input')[0].value, 10);

    if (words && !isNaN(quantity)) {
      const src = assetUsername.innerText;
      const asset = assetAssetname.innerText;
      const wifKey = privateKeyValue.innerText;

      frontendApi.requestDeploy(src, words, asset, quantity, wifKey)
        .then(txid => {
          console.log('deploy', {txid});
        })
        .catch(err => {
          console.warn(err);
        });
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

      frontendApi.requestIssuance(src, assetName, assetDescription, assetQuantity, assetDivisible, wifKey)
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

      frontendApi.requestBurn(src, burnQuantity, wifKey)
        .then(tx => {
          console.log('burned', tx);
        })
        .catch(err => {
          console.warn(err);
        });
    }
  });

  const words = Cookies.get('words');
  if (words) {
    _login(words);
  }

  const _getQueryVariables = variable => {
    const result = {};
    const vars = window.location.search.slice(1).split('&');

    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');

      result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }

    return result;
  };
  _load(_getQueryVariables());
};
_boot();
