window.module = {};

const Cookies = require('js-cookie');
const creaturejs = require('creaturejs');
const frontendApi = require('./frontend-api.js');
const base64 = require('./base64');

window.$ = s => document.querySelectorAll(s);

const baseUrl = '/id';

const pages = {
  login: () => {
    const statusbarEl = $('.statusbar.login')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.login')[0];
    pageEl.style.display = 'block';

    return () => {
      statusbarEl.style.display = 'none';
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
      $('#mint-asset-form')[0].style.display = '';
      $('#price-asset-form')[0].style.display = '';
      $('#mint-subasset-name-input')[0].value = '';
      $('#mint-quantity-input')[0].value = '';
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
    };
  },
  buyAsset: () => {
    const statusbarEl = $('.statusbar.buy-asset')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.buy-asset')[0];
    pageEl.style.display = 'block';

    const buyAssetNameInput = $('#buy-asset-name-input')[0];
    buyAssetNameInput.value = '';
    buyAssetNameInput.focus();
    buyAssetNameInput.select();

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#buy-asset-name-input')[0].value = '';
      $('#buy-asset-quantity-input')[0].value = '';
    };
  },
  confirmPurchase: () => {
    const statusbarEl = $('.statusbar.confirm-purchase')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.confirm-purchase')[0];
    pageEl.style.display = 'block';

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#confirm-purchase-asset')[0].innerText = '';
      $('#confirm-purchase-price')[0].innerText = '';
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

const _getAssetSpec = asset => {
  const match = asset.match(/^(.+):mint$/);

  if (match) {
    return {
      asset: match[1],
      mint : true,
    };
  } else {
    return {
      asset: asset,
      mint : false,
    };
  }
};

const loginUsername = $('#login-username')[0];
const accountUsername = $('#account-username')[0];
const assetUsername = $('#asset-username')[0];
const assetAssetname = $('#asset-assetname')[0];
const createAssetUsername = $('#create-asset-username')[0];
const buyAssetUsername = $('#buy-asset-username')[0];
const confirmPurchaseUsername = $('#confirm-purchase-username')[0];
const monitorUsername = $('#monitor-username')[0];

let balances = [];

const _boot = () => {
  let pageCleanup = null;
  const _setPage = page => {
    if (pageCleanup) {
      pageCleanup();
      pageCleanup = null;
    }

    pageCleanup = pages[page]();
  };

  const _login = privateKey => {
    const privateKeyBuffer = base64.decode(privateKey);
    const address = frontendApi.getAddress(privateKeyBuffer);

    Cookies.set('privateKey', privateKey, {
      expires: 365,
    });

    loginUsername.innerText = address;
    accountUsername.innerText = address;
    assetUsername.innerText = address;
    createAssetUsername.innerText = address;
    buyAssetUsername.innerText = address;
    confirmPurchaseUsername.innerText = address;
    monitorUsername.innerText = address;

    const src = creaturejs.makeStaticCreature('user:' + address);
    [
      $('#login-icon')[0],
      $('#account-icon')[0],
      $('#asset-icon')[0],
      $('#create-asset-icon')[0],
      $('#buy-asset-icon')[0],
      $('#confirm-purchase-icon')[0],
      $('#monitor-icon')[0],
    ].forEach(icon => {
      icon.src = src;
    });

    secretValue.innerText = JSON.stringify({
      privateKey: privateKey,
      address: address,
    }, null, 2);

    return Promise.resolve();
  };
  const _loadAsync = privateKey => {
    const privateKeyBuffer = base64.decode(privateKey);
    const address = frontendApi.getAddress(privateKeyBuffer);

    return Promise.all([
      frontendApi.requestUnconfirmedBalances(address, {
        proxy: true,
      }),
    ])
      .then(([
        newBalances,
      ]) => {
        const _loadAssets = () => {
          const assetsGrid = $('#assets-grid')[0];
          while (assetsGrid.hasChildNodes()) {
            assetsGrid.removeChild(assetsGrid.lastChild);
          }
          const assetEls = Object.keys(newBalances)
            .map(asset => {
              const assetSpec = _getAssetSpec(asset);
              const quantity = newBalances[asset];

              const el = document.createElement('a');
              el.classList.add('asset');
              el.innerHTML = `\
                <div class=icon>
                  <img class=img src="${creaturejs.makeStaticCreature('asset:' + assetSpec.asset)}">
                </div>
                <div class=sub>
                  <div class=name>${asset}</div>
                  <div class=quantity>${quantity}</div>
                </div>
              `;
              el.addEventListener('click', e => {
                _navigate('/assets/' + asset);
              });
              return el;
            });
          for (let i = 0; i < assetEls.length; i++) {
            const assetEl = assetEls[i];
            assetsGrid.appendChild(assetEl);
          }

          balances = newBalances;
        };

        _loadAssets();
      })
      .catch(err => {
        console.warn(err);
      });
  };
  const _init = () => {
    const privateKey = Cookies.get('privateKey');

    return _login(privateKey)
      .then(() => _loadAsync(privateKey));
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

  const _load = url => {
    let match = url.match(/^\/id(?:\/(login|assets\/[^\/]+|createAsset|buyAsset|confirmPurchase|monitor))?(?:\?(.*))?$/);
    const pageMatch = (match && match[1]) || '';
    const queryString = (match && match[2]) || '';

    if (pageMatch === 'login') {
      _setPage('login');
    } else if (match = pageMatch.match(/^assets\/(.+)$/)) {
      const asset = match[1];
      const assetSpec = _getAssetSpec(asset);

      $('#asset-assetname')[0].innerText = asset;
      $('#mint-asset-form')[0].style.display = (balances[assetSpec.asset + ':mint'] > 0) ? null : 'none';
      $('#price-asset-form')[0].style.display = (balances[assetSpec.asset + ':mint'] > 0) ? null : 'none';

      _setPage('asset');
    } else if (pageMatch === 'createAsset') {
      _setPage('createAsset');
    } else if (pageMatch === 'buyAsset') {
      _setPage('buyAsset');
    } else if (pageMatch === 'confirmPurchase') {
      const query = _parseQueryString(queryString);
      const {asset, price: priceString} = query;
      const price = parseInt(priceString, 10);

      if (asset && isFinite(price) && price > 0 && Math.floor(price) === price) {
        $('#confirm-purchase-asset')[0].innerText = asset;
        $('#confirm-purchase-price')[0].innerText = price;

        _setPage('confirmPurchase');
      } else {
        console.log('invalid confirm purchase args', query);

        _setPage('account');
      }
    } else if (pageMatch === 'monitor') {
      _setPage('monitor');
    } else {
      _setPage('account');
    }
  };
  const _navigate = url => {
    const fullUrl = baseUrl + url;

    history.pushState(null, '', fullUrl);

    _load(fullUrl);
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
    $('#login-login-button')[0],
    $('#account-login-button')[0],
    $('#asset-login-button')[0],
    $('#create-asset-login-button')[0],
    $('#buy-asset-login-button')[0],
    $('#confirm-purchase-login-button')[0],
    $('#monitor-login-button')[0],
  ].forEach(loginButton => {
    loginButton.addEventListener('click', e => {
      _navigate('/login');
    });
  });
  [loginUsername, assetUsername, createAssetUsername, buyAssetUsername, confirmPurchaseUsername, monitorUsername].forEach(username => {
    username.addEventListener('click', e => {
      _navigate('');
    });
  });

  const loginInput = $('#login-input')[0];
  loginInput.focus();
  $('#login-generate')[0].addEventListener('click', e => {
    const privateKey = (() => {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return array;
    })();
    const privateKeyString = base64.encode(privateKey);
    loginInput.value = privateKeyString;
    loginInput.focus();
    loginInput.select();
  });
  $('#login-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const privateKey = loginInput.value;
    if (privateKey) {
      _login(privateKey);

      _navigate('');
    }
  });

  $('#create-asset')[0].addEventListener('click', e => {
    _navigate('/createAsset');
  });

  $('#buy-asset')[0].addEventListener('click', e => {
    _navigate('/buyAsset');
  });

  $('#monitor')[0].addEventListener('click', e => {
    _navigate('/monitor');
  });
  $('#blocks-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const blocksData = $('#blocks-data')[0];
    blocksData.innerText = '';

    frontendApi.requestBlockCache({
      proxy: true,
    })
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

    frontendApi.requestMempool({
      proxy: true,
    })
      .then(mempool=> {
        mempoolData.innerText = JSON.stringify(mempool, null, 2);
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

    const dstAddress = $('#send-asset-address-input')[0].value;
    const quantity = parseInt($('#send-asset-quantity-input')[0].value, 10);

    if (dstAddress && !isNaN(quantity)) {
      const srcAddress = assetUsername.innerText;
      const asset = assetAssetname.innerText;
      const {privateKey} = JSON.parse(secretValue.innerText);

      frontendApi.requestCreateSend(asset, quantity, srcAddress, dstAddress, privateKey)
        .then(result => {
          console.log('send', result);
        })
        .catch(err => {
          console.warn(err);
        });
    }
  });
  $('#mint-asset-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const quantity = parseInt($('#mint-quantity-input')[0].value, 10);

    if (!isNaN(quantity)) {
      const baseAsset = assetAssetname.innerText.replace(/:.*$/, '');
      const subasset = $('#mint-subasset-name-input')[0].value;
      const asset = baseAsset + (subasset ? ('.' + subasset) : '');
      const {privateKey} = JSON.parse(secretValue.innerText);

      frontendApi.requestCreateMint(asset, quantity, privateKey)
        .then(result => {
          console.log('minted', result);
        })
        .catch(err => {
          console.warn(err);
        });
    }
  });
  const mintSubassetNameInput = $('#mint-subasset-name-input')[0];
  mintSubassetNameInput.addEventListener('blur', e => {
     mintSubassetNameInput.value = mintSubassetNameInput.value.toUpperCase().replace(/[^a-z0-9]/ig, '');
  });

  $('#price-asset-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const price = parseInt($('#price-asset-input')[0].value, 10);

    if (!isNaN(price)) {
      const asset = assetAssetname.innerText.replace(/:.*$/, '');
      const {privateKey} = JSON.parse(secretValue.innerText);

      frontendApi.requestCreatePrice(asset, price, privateKey)
        .then(result => {
          console.log('priced', result);
        })
        .catch(err => {
          console.warn(err);
        });
    }
  });

  $('#create-asset-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const asset = $('#create-asset-name-input')[0].value;

    if (asset) {
      const {privateKey} = JSON.parse(secretValue.innerText);

      frontendApi.requestCreateMinter(asset, privateKey)
        .then(result => {
          console.log('created', result);
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

  $('#buy-asset-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const asset = $('#buy-asset-name-input')[0].value;
    const quantity = parseInt($('#buy-asset-quantity-input')[0].value, 10);

    if (asset && !isNaN(quantity)) {
      frontendApi.requestUnconfirmedPrice(asset)
        .then(price => {
          if (isFinite(price) && price > 0) {
            const {privateKey} = JSON.parse(secretValue.innerText);
            return frontendApi.requestCreateBuy(asset, quantity, price, privateKey);
          } else {
            const err = new Error('asset is not for sale');
            return Promise.reject(err);
          }
        })
        .then(result => {
          console.log('buyed', result);
        })
        .catch(err => {
          console.warn(err);
        });
    }
  });
  const buyAssetNameInput = $('#buy-asset-name-input')[0];
  buyAssetNameInput.addEventListener('blur', e => {
     buyAssetNameInput.value = buyAssetNameInput.value.toUpperCase().replace(/[^a-z0-9]/ig, '');
  });

  $('#confirm-purchase-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const asset = $('#confirm-purchase-asset')[0].value;
    const quantity = 1;
    const price = parseInt($('#confirm-purchase-price')[0].value, 10);

    frontendApi.requestCreateBuy(asset, quantity, price, privateKey)
      .then(result => {
        console.log('purchased', result);

        _setPage('account');
      })
      .catch(err => {
        console.warn(err);
      });
  });

  const _parseQueryString = s => {
    const result = {};
    const vars = s.split('&');

    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');

      result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }

    return result;
  };

  window.addEventListener('popstate', () => {
    _load(document.location.href.replace(/^[a-z]+:\/\/[^\/]+/, ''));
  });

  _init()
    .then(() => _load(document.location.href.replace(/^[a-z]+:\/\/[^\/]+/, '')));
};
_boot();
