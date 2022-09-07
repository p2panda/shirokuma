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

## Usage

`shirokuma` runs in web browsers and can be integrated in a bundle for example
via Webpack or Rollup.

```js
import { KeyPair, Session, initWebAssembly } from 'shirokuma';

// This method needs to be run once before to initialise the embedded
// WebAssembly code in this package
await initWebAssembly();

// This example uses the "chat" schema at which this hash is pointing. We are
// still working on a good way for you to create and access data schemas. For
// now you can use https://github.com/p2panda/fishyfish to do so
const CHAT_SCHEMA =
  'chat_message_0020a654068b26617ebd6574b1b03853193ccab2295a983bc85a5891793422832655';

// Create a key pair for every usage context of p2panda, i.e. every device and
// every piece of software that is used. Key pairs should never have to be
// transferred between different devices of a user
const keyPair = new KeyPair();

// Open a long running connection to a p2panda node and configure it so all
// calls in this session are executed using that key pair
const session = new Session('https://welle.liebechaos.org').setKeyPair(keyPair);

// Compose your operation payload, according to chosen schema
const payload = {
  message: 'Hi there',
};

// Send new chat operation to the node
await session.create(payload, { schema: CHAT_SCHEMA });

// Query instances from the p2panda node
import { gql, useQuery } from '@apollo/client';

const GET_CHAT_MESSAGES = gql`
  all_${CHAT_SCHEMA} {
    fields {
      message
    }
  }
`;

const Chat = () => {
  const { loading, error, data } = useQuery(GET_CHAT_MESSAGES);

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  return (
    <ul>
      {data[`all_${CHAT_SCHEMA}`].map((doc) => (
        <li key={doc.id}>{doc.fields.message}</li>
      ))}
    </ul>
  );
};
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

### Debug logging

Enable debug logging for node environments by setting an environment variable:

```bash
export DEBUG='shirokuma*'
```

Enable debug logging from a browser console by storing a key `debug` in local storage:

```js
localStorage.debug = 'shirokuma*';
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
<img src="https://raw.githubusercontent.com/p2panda/.github/main/assets/eu-flag-logo.png" width="auto" height="80px">

*This project has received funding from the European Union’s Horizon 2020
research and innovation programme within the framework of the NGI-POINTER
Project funded under grant agreement No 871528*
