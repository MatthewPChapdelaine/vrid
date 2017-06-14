window.module = {};

const Cookies = require('js-cookie');
const creaturejs = require('creaturejs');
const frontendApi = require('./frontend-api.js');

const CREDIT_ASSET_NAME = 'CRD';

window.$ = s => document.querySelectorAll(s);

const pages = {
  login: () => {
    const pageEl = $('.page.login')[0];
    pageEl.style.display = 'block';

    const secretValue = $('#secret-value')[0];
    secretValue.innerText = '';

    return () => {
      pageEl.style.display = 'none';

      $('#login-input')[0].value = '';
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
  charge: () => {
    const statusbarEl = $('.statusbar.charge')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.charge')[0];
    pageEl.style.display = 'block';

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#asset-assetname')[0].innerText = '';
      $('#send-asset-address-input')[0].value = '';
      $('#send-asset-quantity-input')[0].value = '';
      $('#transfer-input')[0].value = '';
    };
  },
  createAsset: () => {
    const statusbarEl = $('.statusbar.create-asset')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.create-asset')[0];
    pageEl.style.display = 'block';

    const createAssetNameInput = $('#create-asset-name-input')[0];
    createAssetNameInput.value = '';
    createAssetNameInput.focus();
    createAssetNameInput.select();

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#create-asset-name-input')[0].value = '';
      $('#create-asset-quantity-input')[0].value = 1;
    };
  },
  createOrder: () => {
    const statusbarEl = $('.statusbar.charge')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.charge')[0];
    pageEl.style.display = 'block';

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#charge-src-address-input')[0].value = '';
      $('#charge-src-asset-input')[0].value = '';
      $('#charge-src-quantity-input')[0].value = '';
      $('#charge-dst-asset-input')[0].value = '';
      $('#charge-dst-quantity-input')[0].value = '';
    };
  },
  monitor: () => {
    const statusbarEl = $('.statusbar.monitor')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.monitor')[0];
    pageEl.style.display = 'block';

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      const txInput = $('#monitor-tx-input')[0];
      txInput.value = '';
      const txData = $('#tx-data')[0];
      txData.innerText = '';
      const blocksData = $('#blocks-data')[0];
      blocksData.innerText = '';
      const mempoolData = $('#mempool-data')[0];
      mempoolData.innerText = '';

      const showSecrets = $('#show-secrets')[0];
      const hideSecrets = $('#hide-secrets')[0];
      const secretValue = $('#secret-value')[0];
      showSecrets.style.display = 'block';
      hideSecrets.style.display = 'none';
      secretValue.classList.remove('visible');
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
      accountUsername.innerText = address;
      assetUsername.innerText = address;
      createAssetUsername.innerText = address;
      chargeUsername.innerText = address;
      monitorUsername.innerText = address;

      const src = creaturejs.makeStaticCreature('user:' + address);
      [
        $('#account-icon')[0],
        $('#asset-icon')[0],
        $('#create-asset-icon')[0],
        $('#charge-icon')[0],
        $('#monitor-icon')[0],
      ].forEach(icon => {
        icon.src = src;
      });

      secretValue.innerText = JSON.stringify({
        words: words,
        address: address,
        privateKey: key
      }, null, 2);
    };
    const _loadAsync = () => {
      Promise.all([
        frontendApi.requestUnconfirmedBalances(address),
        frontendApi.requestUnconfirmedCharges(address),
      ])
        .then(([
          balances,
          charges,
        ]) => {
          const _loadAssets = () => {
            const assetsGrid = $('#assets-grid')[0];
            while (assetsGrid.hasChildNodes()) {
              assetsGrid.removeChild(assetsGrid.lastChild);
            }
            const assetEls = Object.keys(balances)
              .map(asset => {
                const quantity = balances[asset];

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
          };
          const _loadCharges = () => {
            const chargesGridEl = $('#charges-grid')[0];
            while (chargesGridEl.hasChildNodes()) {
              chargesGridEl.removeChild(chargesGridEl.lastChild);
            }
            const chargeEls = charges.map(({id, srcAsset, srcQuantity, dstAsset, dstQuantity}) => {
              const el = document.createElement('a');
              el.classList.add('order');
              el.innerHTML = `\
                <div class=charge-side>
                  <div class=address>${srcAddress}</div>
                  <div class=quantity>${srcQuantity}</div>
                  <div class=name>${srcAsset}</div>
                </div>
                <div class=charge-spacer>&#x21d2;</div>
                <div class=charge-side>
                  <div class=quantity>${dstQuantity}</div>
                  <div class=name>${dstAsset}</div>
                </div>
              `;
              el.addEventListener('click', e => {
                $('#order-id')[0].innerText = id;
                $('#order-src-asset-name')[0].innerText = srcAsset;
                $('#order-src-asset-quantity')[0].innerText = srcQuantity;
                $('#order-dst-asset-name')[0].innerText = dstAsset;
                $('#order-dst-asset-quantity')[0].innerText = dstQuantity;

                _setPage('order');
              });
              return el;
            });
            for (let i = 0; i < chargeEls.length; i++) {
              const chargeEl = chargeEls[i];
              chargesGridEl.appendChild(chargeEl);
            }
          };

          _loadAssets();
          _loadCharges();
        })
        .catch(err => {
          console.warn(err);
        });
    };
    _loadSync();
    _loadAsync();
  };
  const _jsonParse = s => {
    let error = null;
    let result;
    try {
      result = JSON.parse(s);
    } catch (err) {
      error = err;
    }
    if (!error) {
      return result;
    } else {
      return undefined;
    }
  };

  const _load = (words, spec) => {
    if (words) {
      /* const action = spec.x;

      if (action) {
        document.body.classList.add('iframe');

        if (action === 'authorize') {
          const url = spec.u;

          if (url) {
            $('#authorize-url')[0].innerText = url;

            _setPage('actionAuthorize');
          } else {
            _respond('invalid arguments');
          }
        } else {
          _respond('invalid action');
        }

        window.addEventListener('beforeunload', () => {
          _respond({
            error: 'window closed',
          });
        });
      } else { */
        _login(words);

        _setPage('account');
      // }
    } else {
      _setPage('login');
    }
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

  [
    $('#account-login-button')[0],
    $('#asset-login-button')[0],
    $('#create-asset-login-button')[0],
    $('#charge-login-button')[0],
    $('#monitor-login-button')[0],
  ].forEach(loginButton => {
    loginButton.addEventListener('click', e => {
      _setPage('login');
    });
  });
  const accountUsername = $('#account-username')[0];
  const assetUsername = $('#asset-username')[0];
  const assetAssetname = $('#asset-assetname')[0];
  const createAssetUsername = $('#create-asset-username')[0];
  const chargeUsername = $('#charge-username')[0];
  const monitorUsername = $('#monitor-username')[0];
  [assetUsername, createAssetUsername, chargeUsername, monitorUsername].forEach(username => {
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

  $('#create-asset')[0].addEventListener('click', e => {
    _setPage('createAsset');
  });
  $('#charge')[0].addEventListener('click', e => {
    _setPage('charge');
  });

  $('#monitor')[0].addEventListener('click', e => {
    _setPage('monitor');
  });
  $('#monitor-tx-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const txid = $('#monitor-tx-input')[0].value;
    const txData = $('#tx-data')[0];
    txData.innerText = '';

    frontendApi.requestTransaction(txid)
      .then(tx => {
        txData.innerText = JSON.stringify(tx, null, 2);
      })
      .catch(err => {
        console.warn(err);
      });
  });
  $('#blocks-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const blocksData = $('#blocks-data')[0];
    blocksData.innerText = '';

    frontendApi.requestBlockCache()
      .then(blocks => {
        blocksData.innerText = JSON.stringify(blocks, null, 2);
      })
      .catch(err => {
        console.warn(err);
      });
  });
  $('#mempool-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const mempoolData = $('#mempool-data')[0];
    mempoolData.innerText = '';

    Promise.all([
      frontendApi.requestMempool(),
      frontendApi.requestCounterpartyMempool(),
    ])
      .then(([
        mempool,
        counterpartyMempool,
      ]) => {
        mempoolData.innerText = JSON.stringify({
          mempool,
          counterpartyMempool,
        }, null, 2);
      })
      .catch(err => {
        console.warn(err);
      });
  });

  const showSecrets = $('#show-secrets')[0];
  const hideSecrets = $('#hide-secrets')[0];
  const secretValue = $('#secret-value')[0];
  showSecrets.addEventListener('click', e => {
    secretValue.classList.add('visible');
    showSecrets.style.display = 'none';
    hideSecrets.style.display = 'block';
  });
  hideSecrets.addEventListener('click', e => {
    secretValue.classList.remove('visible');
    showSecrets.style.display = 'block';
    hideSecrets.style.display = 'none';
  });

  $('#send-asset-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const dst = $('#send-asset-address-input')[0].value;
    const quantity = parseInt($('#send-asset-quantity-input')[0].value, 10);

    if (dst && !isNaN(quantity)) {
      const src = assetUsername.innerText;
      const asset = assetAssetname.innerText;
      const wifKey = JSON.parse(secretValue.innerText).privateKey;

      frontendApi.requestSend(src, dst, asset, quantity, wifKey)
        .then(txid => {
          console.log('send', {txid});
        })
        .catch(err => {
          console.warn(err);
        });
    }
  });
  $('#issue-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const quantity = parseInt($('#issue-input')[0].value, 10);

    if (!isNaN(quantity)) {
      const src = assetUsername.innerText;
      const asset = assetAssetname.innerText;
      const wifKey = JSON.parse(secretValue.innerText).privateKey;

      frontendApi.requestIssuance(src, asset, quantity, wifKey)
        .then(txid => {
          console.log('issued', {txid});
        })
        .catch(err => {
          console.warn(err);
        });
    }
  });

  $('#create-asset-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const assetName = $('#create-asset-name-input')[0].value;
    const assetQuantity = parseInt($('#create-asset-quantity-input')[0].value, 10);

    if (assetName && !isNaN(assetQuantity)) {
      const src = createAssetUsername.innerText;
      const wifKey = JSON.parse(secretValue.innerText).privateKey;

      frontendApi.requestIssuance(src, assetName, assetQuantity, wifKey)
        .then(txid => {
          console.log('created', {txid});
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

  $('#charge-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const srcAddress = $('#charge-src-address-input')[0].value;
    const srcAsset = $('#charge-src-asset-input')[0].value;
    const srcQuantity = parseInt($('#charge-src-quantity-input')[0].value, 10);
    const dstAsset = $('#charge-dst-asset-input')[0].value;
    const dstQuantity = parseInt($('#charge-dst-quantity-input')[0].value, 10);

    if (srcAsset && (srcAsset.length === 4 || srcAsset === CREDIT_ASSET_NAME) && !isNaN(srcQuantity) && dstAsset && !isNaN(dstQuantity)) {
      const dstAddress = chargeUsername.innerText;
      const wifKey = JSON.parse(secretValue.innerText).privateKey;

      frontendApi.requestCreateCharge(srcAsset, srcQuantity, dstAsset, dstQuantity, srcAddress, dstAddress)
        .then(result => {
          console.log('charge', result);
        })
        .catch(err => {
          console.warn(err);
        });
    }
  });

  const _getQueryVariables = variable => {
    const result = {};
    const vars = window.location.search.slice(1).split('&');

    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');

      result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }

    return result;
  };
  _load(Cookies.get('words'), _getQueryVariables());
};
_boot();
