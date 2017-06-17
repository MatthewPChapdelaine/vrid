# VRID: a frontend for [CRD](https://github.com/modulesio/crds)

#### Usage

```
npm i -g vrid
vrid host=127.0.0.1 port=8000 crdsUrl=https://crds.server.example:9999/
```

## Motivation

To allow Virtual Reality metaverse servers to support distributed, permissionless, realtime transactions between mutually untrusting parties running untrusted code.

This is one of the key components powering [`Zeo`](https://github.com/modulesio/zeo).

## Overview

This is a web frontend for the [`CRD`](https://github.com/modulesio/crds) blockchain. Basically, it's a "web wallet" that stores your `CRD` private key in a browser cookie.

<img>

VRID can be used to manage your `CRD` address, send funds, mint assets, create charges, issue chargebacks -- virtually everything supported by the `CRD` blockchain -- but it also exposes your _public_ (but not private) key to apps that query for it.

The fact that your public key can be queried by any web site/app is a _good thing_, because it allows them to provide CRD-powered services to you without either of you needing to ask or even trust each other. Every transaction is enforced on the `CRD` blockchain, and if any party misbehaves it will either be rejected by the consensus rules, or can be undone via the `CRD` chargeback model. For a deeper technical discussion, see [`CRD`](https://github.com/modulesio/crds).

The result is a truly decentralized, permissionless, payments platform that runs from your browser.

VRID doesn't do much on its own: it just provides a web API to talk to to a `crds` node (specified by `crdsUrl`) running somewhere. Specifically, VRID does not store anything (not even your public key) on the server.
