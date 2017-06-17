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
      $('#mint-form')[0].style.display = '';
      $('#mint-input')[0].value = '';
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
  charges: () => {
    const statusbarEl = $('.statusbar.charges')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.charges')[0];
    pageEl.style.display = 'block';

    _renderCharges();

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';
    };
  },
  createCharge: () => {
    const statusbarEl = $('.statusbar.create-charge')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.create-charge')[0];
    pageEl.style.display = 'block';

    return () => {
      statusbarEl.style.display = 'none';
      pageEl.style.display = 'none';

      $('#create-charge-src-address-input')[0].value = '';
      $('#create-charge-src-asset-input')[0].value = '';
      $('#create-charge-src-quantity-input')[0].value = '';
      $('#create-charge-dst-asset-input')[0].value = '';
      $('#create-charge-dst-quantity-input')[0].value = '';
    };
  },
  monitor: () => {
    const statusbarEl = $('.statusbar.monitor')[0];
    statusbarEl.style.display = 'flex';
    const pageEl = $('.page.monitor')[0];
    pageEl.style.display = 'block';

    _renderLocked();

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

const accountUsername = $('#account-username')[0];
const assetUsername = $('#asset-username')[0];
const assetAssetname = $('#asset-assetname')[0];
const createAssetUsername = $('#create-asset-username')[0];
const chargesUsername = $('#charges-username')[0];
const createChargeUsername = $('#create-charge-username')[0];
const monitorUsername = $('#monitor-username')[0];

let charges = [];
let chargePage = 0;
let numChargePages = 0;
const CHARGES_PER_PAGE = 8;
const _renderCharges = () => {
  const chargesGridEl = $('#charges-grid')[0];
  while (chargesGridEl.hasChildNodes()) {
    chargesGridEl.removeChild(chargesGridEl.lastChild);
  }
  const chargeEls = charges
    .slice(chargePage * CHARGES_PER_PAGE, (chargePage + 1) * CHARGES_PER_PAGE)
    .map(({id, srcAddress, dstAddress, srcAsset, srcQuantity, dstAsset, dstQuantity, signature}) => {
      const _getAssetSpec = asset => {
        const match = asset && asset.match(/^(.+):mint$/);

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
      const srcAssetSpec = _getAssetSpec(srcAsset);
      const dstAssetSpec = _getAssetSpec(dstAsset);
      const localAddress = accountUsername.innerText;

      const el = document.createElement('div');
      el.classList.add('charge');
      el.innerHTML = `\
        <div class=charge-side>
          <div class=address>${srcAddress}</div>
          ${srcAddress === localAddress ? `<svg class="address-icon" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z"/>
              <path d="M0 0h24v24H0z" fill="none"/>
          </svg>` : ''}
          <img class=img src="${creaturejs.makeStaticCreature('asset:' + srcAssetSpec.asset)}">
          <div class=name>${srcAsset}</div>
          <div class=quantity>${srcQuantity}</div>
          ${srcAssetSpec.mint ? `<svg class="icon" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>` : ''}
        </div>
        ${dstAsset ? `\
          <div class=charge-spacer>&#x21d4;</div>
          <div class=charge-side>
            <div class=address>${dstAddress}</div>
            ${dstAddress === localAddress ? `<svg class="address-icon" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z"/>
              <path d="M0 0h24v24H0z" fill="none"/>
          </svg>` : ''}
            <img class=img src="${creaturejs.makeStaticCreature('asset:' + dstAssetSpec.asset)}">
            <div class=name>${dstAsset}</div>
            <div class=quantity>${dstQuantity}</div>
            ${dstAssetSpec.mint ? `<svg class="icon" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>` : ''}
          </div>
          <a class=remove>&#x00d7;</a>
        ` : ''}
      `;
      el.querySelectorAll('.remove')[0].addEventListener('click', e => {
        const {privateKey} = JSON.parse(secretValue.innerText);

        frontendApi.requestCreateChargeback(signature, privateKey)
          .then(result => {
            console.log('chargeback', result);

            if (el.parentNode === chargesGridEl) {
              chargesGridEl.removeChild(el);
            }
          })
          .catch(err => {
            console.warn(err);
          });
      });
      return el;
    });
  for (let i = 0; i < chargeEls.length; i++) {
    const chargeEl = chargeEls[i];
    chargesGridEl.appendChild(chargeEl);
  }
};

let locked = false;
const _renderLocked = () => {
console.log('render locked', locked);
  $('#lock-locked-status')[0].style.display = locked ? null : 'none';
  $('#lock-unlocked-status')[0].style.display = !locked ? null : 'none';

  $('#lock-locked-button')[0].style.display = locked ? null : 'none';
  $('#lock-unlocked-button')[0].style.display = !locked ? null : 'none';
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

  const _login = privateKey => {
    const privateKeyBuffer = _base64ToArray(privateKey);
    const address = frontendApi.getAddress(privateKeyBuffer);

    Cookies.set('privateKey', privateKey, {
      expires: 365,
    });

    const _loadSync = () => {
      accountUsername.innerText = address;
      assetUsername.innerText = address;
      createAssetUsername.innerText = address;
      chargesUsername.innerText = address;
      createChargeUsername.innerText = address;
      monitorUsername.innerText = address;

      const src = creaturejs.makeStaticCreature('user:' + address);
      [
        $('#account-icon')[0],
        $('#asset-icon')[0],
        $('#create-asset-icon')[0],
        $('#charges-icon')[0],
        $('#create-charge-icon')[0],
        $('#monitor-icon')[0],
      ].forEach(icon => {
        icon.src = src;
      });

      secretValue.innerText = JSON.stringify({
        privateKey: privateKey,
        address: address,
      }, null, 2);
    };
    const _loadAsync = () => {
      Promise.all([
        frontendApi.requestUnconfirmedBalances(address),
        frontendApi.requestUnconfirmedCharges(address),
      ])
        .then(([
          newBalances,
          newCharges,
        ]) => {
          const _loadAssets = () => {
            const assetsGrid = $('#assets-grid')[0];
            while (assetsGrid.hasChildNodes()) {
              assetsGrid.removeChild(assetsGrid.lastChild);
            }
            const assetEls = Object.keys(newBalances)
              .map(asset => {
                const assetSpec = (() => {
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
                })();
                const quantity = newBalances[asset];

                const el = document.createElement('a');
                el.classList.add('asset');
                el.innerHTML = `\
                  <img class=img src="${creaturejs.makeStaticCreature('asset:' + assetSpec.asset)}">
                  <div class=name>${asset}</div>
                  <div class=quantity>${quantity}</div>
                  ${assetSpec.mint ? `<svg class="icon" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>` : ''}
                `;
                el.addEventListener('click', e => {
                  $('#asset-assetname')[0].innerText = asset;
                  $('#mint-form')[0].style.display = (newBalances[assetSpec.asset + ':mint'] > 0) ? null : 'none';

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
            charges = newCharges;
            numChargePages = Math.ceil(newCharges.length / CHARGES_PER_PAGE);
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

  const _load = (privateKey, spec) => {
    if (privateKey) {
      _login(privateKey);

      _setPage('account');
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
    $('#charges-login-button')[0],
    $('#create-charge-login-button')[0],
    $('#monitor-login-button')[0],
  ].forEach(loginButton => {
    loginButton.addEventListener('click', e => {
      _setPage('login');
    });
  });
  [assetUsername, createAssetUsername, chargesUsername, createChargeUsername, monitorUsername].forEach(username => {
    username.addEventListener('click', e => {
      _setPage('account');
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
    const privateKeyString = _arrayToBase64(privateKey);
    loginInput.value = privateKeyString;
    loginInput.focus();
    loginInput.select();
  });
  $('#login-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const privateKey = loginInput.value;
    if (privateKey) {
      _login(privateKey);

      _setPage('account');
    }
  });

  $('#create-asset')[0].addEventListener('click', e => {
    _setPage('createAsset');
  });

  $('#charges')[0].addEventListener('click', e => {
    _setPage('charges');
  });

  $('#create-charge')[0].addEventListener('click', e => {
    _setPage('createCharge');
  });

  $('#monitor')[0].addEventListener('click', e => {
    _setPage('monitor');
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
  $('#lock-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    // XXX send to the backend here

    locked = !locked;

    _renderLocked();
  });
  $('#mempool-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const mempoolData = $('#mempool-data')[0];
    mempoolData.innerText = '';

    frontendApi.requestMempool()
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

    if (dstAddress && !isNaN(quantity) && quantity > 0 && _roundToCents(quantity) === quantity) {
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
  $('#mint-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const quantity = parseInt($('#mint-input')[0].value, 10);

    if (!isNaN(quantity) && quantity > 0 && _roundToCents(quantity) === quantity) {
      const address = assetUsername.innerText;
      const asset = assetAssetname.innerText.replace(/:.*$/, '');
      const {privateKey} = JSON.parse(secretValue.innerText);

      frontendApi.requestCreateMint(asset, quantity, address, privateKey)
        .then(result => {
          console.log('minted', result);
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
      const address = createAssetUsername.innerText;
      const {privateKey} = JSON.parse(secretValue.innerText);

      frontendApi.requestCreateMinter(address, asset, privateKey)
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

  $('#prev-charges')[0].addEventListener('click', e => {
    chargePage = Math.max(chargePage - 1, 0);

    _renderCharges();
  });
  $('#next-charges')[0].addEventListener('click', e => {
    chargePage = Math.min(chargePage + 1, numChargePages - 1);

    _renderCharges();
  });

  $('#create-charge-form')[0].addEventListener('submit', e => {
    e.preventDefault();

    const srcAddress = $('#create-charge-src-address-input')[0].value;
    const srcAsset = $create-('#charge-src-asset-input')[0].value;
    const srcQuantity = parseInt($('#create-charge-src-quantity-input')[0].value, 10);
    const dstAsset = $('#create-charge-dst-asset-input')[0].value;
    const dstQuantity = parseInt($('#create-charge-dst-quantity-input')[0].value, 10);

    if (srcAddress && srcAsset && !isNaN(srcQuantity) && dstAsset && !isNaN(dstQuantity)) {
      const dstAddress = createChargeUsername.innerText;

      frontendApi.requestCreateCharge(srcAddress, dstAddress, srcAsset, srcQuantity, dstAsset, dstQuantity)
        .then(result => {
          console.log('create charge', result);
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
  const _arrayToBase64 = array => btoa(String.fromCharCode.apply(null, array));
  const _base64ToArray = base64 => {
    const raw = atob(base64);
    const rawLength = raw.length;
    const array = new Uint8Array(new ArrayBuffer(rawLength));
    for (let i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  };
  const _roundToCents = n => Math.round(n * 100) / 100;

  _load(Cookies.get('privateKey'), _getQueryVariables());
};
_boot();
