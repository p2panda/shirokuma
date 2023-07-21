<h1 align="center">shirokuma</h1>

<div align="center">
  <strong>TypeScript framework to easily write p2panda applications</strong>
</div>

<br />

<div align="center">
  <!-- CI status -->
  <a href="https://github.com/p2panda/shirokuma/actions">
    <img src="https://img.shields.io/github/checks-status/p2panda/shirokuma/main?style=flat-square" alt="CI Status" />
  </a>
  <!-- NPM version -->
  <a href="https://www.npmjs.com/package/shirokuma">
    <img src="https://img.shields.io/npm/v/shirokuma?style=flat-square" alt="NPM version" />
  </a>
</div>

<div align="center">
  <h3>
    <a href="https://github.com/p2panda/shirokuma#installation">
      Installation
    </a>
    <span> | </span>
    <a href="https://github.com/p2panda/shirokuma/releases">
      Releases
    </a>
    <span> | </span>
    <a href="https://github.com/p2panda/handbook#how-to-contribute">
      Contributing
    </a>
  </h3>
</div>

<br />

This library provides all tools required to write an [`p2panda`] application in TypeScript, running in any modern web browser.

[`p2panda`]: https://p2panda.org

## Installation

To install `shirokuma` run:

```
npm i shirokuma
```

## Example

```typescript
import { KeyPair, Session, initWebAssembly } from 'shirokuma';

// This method needs to be run once before to initialise the embedded
// WebAssembly code in this package
await initWebAssembly();

// This example uses the "chat" schema at which this hash is pointing
const CHAT_SCHEMA =
  'chat_message_0020a654068b26617ebd6574b1b03853193ccab2295a983bc85a5891793422832655';

// Create a key pair
const keyPair = new KeyPair();

// Open a long running connection to a p2panda node and configure it so all
// calls in this session are executed using that key pair
const session = new Session('http://localhost:2020/graphql').setKeyPair(keyPair);

// Compose your operation payload, according to chosen schema
const fields = {
  message: 'Hi there',
};

// Create and send a new chat message to the node
await session.create(fields, { schemaId: CHAT_SCHEMA });
```

## Usage

`shirokuma` runs both in NodeJS and web browsers and comes as a ES and
CommonJS. It can easily be integrated into Webpack, Rollup or other tools.

Since `shirokuma` contains WebAssembly code, it is necessary to initialise it
before using the methods in the Browser. This initialisation step is not
required in NodeJS contexts.

To make this step a little bit easier `shirokuma` inlines the WebAssembly code
as a base64 string which gets decoded automatically during initialisation. For
manual initialisation the package also comes with "slim" versions where you
need to provide a path to the ".wasm" file yourself.

### Browser

To quickly get started, you can run `shirokuma` in any modern browser as an ES module like that. Note that this uses the bundled version, with all 3rd party dependencies included plus the WebAssembly code itself:

```html
<script type="module">
  import { initWebAssembly, KeyPair } from 'https://cdn.jsdelivr.net/npm/shirokuma@0.2.0/lib/esm-bundle/index.min.js';

  initWebAssembly().then(() => {
    const keyPair = new KeyPair();
    console.log(keyPair.publicKey());
  });
</script>
```

### NodeJS

```javascript
import { KeyPair } from 'shirokuma';
const keyPair = new KeyPair();
console.log(keyPair.publicKey());
```

### Bundlers

```javascript
import { initWebAssembly, KeyPair } from 'shirokuma';

// This only needs to be done once before using all `shirokuma` methods.
await initWebAssembly();

const keyPair = new KeyPair();
console.log(keyPair.publicKey());
```

### Manually load `.wasm`

Running `shirokuma` in the browser automatically inlines the WebAssembly
inside the JavaScript file, encoded as a base64 string. While this works for
most developers, it also doubles the size of the imported file. To avoid larger
payloads and decoding times you can load the `.wasm` file manually by using a
"slim" version. For this you need to initialise the module by passing the path
to the file into `initWebAssembly`:

```javascript
// Import from `slim` module to manually initialise WebAssembly code
import { initWebAssembly, KeyPair } from 'shirokuma/slim';
import wasm from 'shirokuma/p2panda.wasm';

// When running shirokuma in the browser, this method needs to run once
// before using all other methods
await initWebAssembly(wasm);

const keyPair = new KeyPair();
console.log(keyPair.publicKey());
```

## Development

```bash
# Install dependencies
npm install

# Check code formatting
npm run lint

# Run tests
npm test

# Bundle js package
npm run build
```

### Documentation

```bash
# Generate documentation
npm run docs

# Show documentation in browser
npx serve ./docs
```

## License

GNU Affero General Public License v3.0 [`AGPL-3.0-or-later`](LICENSE)

## Supported by

<img src="https://raw.githubusercontent.com/p2panda/.github/main/assets/ngi-logo.png" width="auto" height="80px"><br />
<img src="https://raw.githubusercontent.com/p2panda/.github/main/assets/nlnet-logo.svg" width="auto" height="80px"><br />
<img src="https://raw.githubusercontent.com/p2panda/.github/main/assets/eu-flag-logo.png" width="auto" height="80px">

*This project has received funding from the European Union’s Horizon 2020
research and innovation programme within the framework of the NGI-POINTER
Project funded under grant agreement No 871528*
