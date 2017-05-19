window.module = {};

const Cookies = require('js-cookie');
const creaturejs = require('creaturejs');
const frontendApi = require('./frontend-api.js');

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

      const showSecrets = $('#show-secrets')[0];
      const hideSecrets = $('#hide-secrets')[0];

      const secretValue = $('#secret-value')[0];
      showSecrets.style.display = 'block';
      hideSecrets.style.display = 'none';
      secretValue.classList.remove('visible');
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
      $('#send-btc-value-input')[0].value = '';
      $('#pack-btc-value-input')[0].value = '';
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
      $('#pack-asset-quantity-input')[0].value = '';
      $('#issue-input')[0].value = '';
      $('#transfer-input')[0].value = '';
    };
  },
  order: () => {
    const statusbarEl = $('.statusbar.order')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.order')[0];
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
  unpack: () => {
    const statusbarEl = $('.statusbar.unpack')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.unpack')[0];
    pageEl.style.display = 'block';

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#unpack-input')[0].value = '';
    };
  },
  createOrder: () => {
    const statusbarEl = $('.statusbar.create-order')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.create-order')[0];
    pageEl.style.display = 'block';

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#create-order-src-asset-input')[0].value = '';
      $('#create-order-src-quantity-input')[0].value = '';
      $('#create-order-dst-asset-input')[0].value = '';
      $('#create-order-dst-quantity-input')[0].value = '';
      $('#create-order-expiration-input')[0].value = '';
      $('#create-order-require-immediate')[0].checked = false;
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
      assetUsername.innerText = address;
      createAssetUsername.innerText = address;
      unpackUsername.innerText = address;
      orderUsername.innerText = address;
      createOrderUsername.innerText = address;
      monitorUsername.innerText = address;

      const src = creaturejs.makeStaticCreature('user:' + address);
      [
        $('#account-icon')[0],
        $('#btc-icon')[0],
        $('#asset-icon')[0],
        $('#create-asset-icon')[0],
        $('#unpack-icon')[0],
        $('#order-icon')[0],
        $('#create-order-icon')[0],
        $('#monitor-icon')[0],
      ].forEach(icon => {
        icon.src = src;
      });

      secretValue.innerText = JSON.stringify({
        words: words,
        address: address,
        privateKey: key
      }, null, 2);

      $('#btc-balance-value')[0].innerText = 0;
    };
    const _loadAsync = () => {
      Promise.all([
        frontendApi.requestLiveBTCBalance(address),
        frontendApi.requestLiveAssets(address),
        frontendApi.requestLiveOrders(address),
      ])
        .then(([
          btcBalance,
          assetSpecs,
          orderSpecs,
        ]) => {
          const _loadBalances = () => {
            $('#btc-balance-value')[0].innerText = btcBalance.toFixed(8);
          };
          const _loadAssets = () => {
            const assetsGrid = $('#assets-grid')[0];
            while (assetsGrid.hasChildNodes()) {
              assetsGrid.removeChild(assetsGrid.lastChild);
            }
            const assetEls = assetSpecs.map(({asset, quantity}) => {
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
          const _loadOrders = () => {
            const ordersGrid = $('#orders-grid')[0];
            while (ordersGrid.hasChildNodes()) {
              ordersGrid.removeChild(ordersGrid.lastChild);
            }
            const orderEls = orderSpecs.map(({id, srcAsset, srcQuantity, dstAsset, dstQuantity}) => {
              const el = document.createElement('a');
              el.classList.add('order');
              el.innerHTML = `\
                <div class=order-side>
                  <div class=quantity>${srcQuantity}</div>
                  <div class=name>${srcAsset}</div>
                </div>
                <div class=order-spacer>&#x21d2;</div>
                <div class=order-side>
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
            for (let i = 0; i < orderEls.length; i++) {
              const orderEl = orderEls[i];
              ordersGrid.appendChild(orderEl);
            }
          };

          _loadBalances();
          _loadAssets();
          _loadOrders();
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
    $('#unpack-logout-button')[0],
    $('#order-logout-button')[0],
    $('#create-order-logout-button')[0],
    $('#monitor-logout-button')[0],
  ].forEach(logoutButton => {
    logoutButton.addEventListener('click', e => {
      _logout();

      _setPage('login');
    });
  });
  const actionUsername = $('#action-username')[0];
  const accountUsername = $('#account-username')[0];
  const btcUsername = $('#btc-username')[0];
  const assetUsername = $('#asset-username')[0];
  const assetAssetname = $('#asset-assetname')[0];
  const createAssetUsername = $('#create-asset-username')[0];
  const unpackUsername = $('#unpack-username')[0];
  const orderUsername = $('#order-username')[0];
  const createOrderUsername = $('#create-order-username')[0];
  const monitorUsername = $('#monitor-username')[0];
  [btcUsername, assetUsername, createAssetUsername, unpackUsername, orderUsername, createOrderUsername, monitorUsername].forEach(username => {
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

  $('#create-asset')[0].addEventListener('click', e => {
    _setPage('createAsset');
  });
  $('#unpack')[0].addEventListener('click', e => {
    _setPage('unpack');
  });
  $('#create-order')[0].addEventListener('click', e => {
    _setPage('createOrder');
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

    frontendApi.requestBlocks()
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

  $('#send-btc-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const dst = $('#send-btc-address-input')[0].value;
    const value = parseInt($('#send-btc-value-input')[0].value, 10);

    if (dst && !isNaN(value)) {
      const src = createAssetUsername.innerText;
      const wifKey = JSON.parse(secretValue.innerText).privateKey;

      frontendApi.requestSendBTC(src, dst, value, wifKey)
        .then(txid => {
          console.log('send btc', {txid});
        })
        .catch(err => {
          console.warn(err);
        });
    }
  });
  $('#pack-btc-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const value = parseInt($('#pack-btc-value-input')[0].value, 10);

    if (!isNaN(value)) {
      const words = frontendApi.makeWords();
      const src = assetUsername.innerText;
      const dst = frontendApi.getAddress(words);
      const wifKey = JSON.parse(secretValue.innerText).privateKey;

      console.log('packing btc', {words});

      frontendApi.requestPackBTC(src, dst, value, wifKey)
        .then(txid => {
          console.log('pack btc', {txid});

          $('#pack-btc-output')[0].innerText = JSON.stringify({
            words,
            value,
            txid,
          });
        })
        .catch(err => {
          console.warn(err);
        });
    }
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
  $('#pack-asset-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const quantity = parseInt($('#pack-asset-quantity-input')[0].value, 10);

    if (!isNaN(quantity)) {
      const words = frontendApi.makeWords();
      const src = assetUsername.innerText;
      const dst = frontendApi.getAddress(words);
      const asset = assetAssetname.innerText;
      const wifKey = JSON.parse(secretValue.innerText).privateKey;

      console.log('packing asset', {words});

      frontendApi.requestPackAsset(src, dst, asset, quantity, wifKey)
        .then(txid => {
          console.log('pack asset', {txid});

          $('#pack-asset-output')[0].innerText = JSON.stringify({
            words,
            asset,
            quantity,
            txid,
          });
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

  $('#cancel-order-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const src = assetUsername.innerText;
    const orderId = $('#order-id')[0].innerText;
    const wifKey = JSON.parse(secretValue.innerText).privateKey;

    frontendApi.requestCancelOrder(src, orderId, wifKey)
      .then(orderid => {
        console.log('cancel', {orderid});
      })
      .catch(err => {
        console.warn(err);
      });
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

  $('#unpack-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const s = $('#unpack-input')[0].value;
    const j = _jsonParse(s);

    if (j && typeof j === 'object') {
      if (typeof j.words === 'string' && typeof j.asset === 'string' && typeof j.quantity === 'number') {
        const {words, asset, quantity} = j;
        const src = frontendApi.getAddress(words);
        const dst = assetUsername.innerText;
        const wifKey = frontendApi.getKey(words);

        frontendApi.requestReceiveAsset(src, dst, asset, quantity, wifKey)
          .then(txid => {
            console.log('unpack asset', {txid});
          })
          .catch(err => {
            console.warn(err);
          });
      } else if (typeof j.words === 'string' && typeof j.value === 'number') {
        const {words, value} = j;
        const src = frontendApi.getAddress(words);
        const dst = assetUsername.innerText;
        const wifKey = frontendApi.getKey(words);

        frontendApi.requestReceiveBTC(src, dst, value, wifKey)
          .then(txid => {
            console.log('unpack btc', {txid});
          })
          .catch(err => {
            console.warn(err);
          });
      }
    }
  });

  $('#create-order-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const srcAsset = $('#create-order-src-asset-input')[0].value;
    const srcQuantity = parseInt($('#create-order-src-quantity-input')[0].value, 10);
    const dstAsset = $('#create-order-dst-asset-input')[0].value;
    const dstQuantity = parseInt($('#create-order-dst-quantity-input')[0].value, 10);
    const expiration = parseInt($('#create-order-expiration-input')[0].value, 10);
    const immediate = $('#create-order-require-immediate')[0].checked;

    if (srcAsset && !isNaN(srcQuantity) && dstAsset && !isNaN(dstQuantity) && !isNaN(expiration)) {
      const src = createOrderUsername.innerText;
      const wifKey = JSON.parse(secretValue.innerText).privateKey;

      frontendApi.requestCreateOrder(src, srcAsset, srcQuantity, dstAsset, dstQuantity, expiration, wifKey, {immediate})
        .then(orderid => {
          console.log('order', {orderid});
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
