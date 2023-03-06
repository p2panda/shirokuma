// SPDX-License-Identifier: AGPL-3.0-or-later

import { KeyPair, initWebAssembly } from 'p2panda-js';

import { Session } from './session';

export {
  Session,

  /**
   * Ed25519 key pair to sign Bamboo entries with.
   * @example
   * ```
   * import { KeyPair } from 'shirokuma';
   *
   * const keyPair = new KeyPair();
   * console.log(keyPair.publicKey());
   * ```
   */
  KeyPair,

  /**
   * Depending on which `shirokuma` build you chose to import into your project,
   * the WebAssembly code needs to be initialised in different ways:
   *
   * 1. NodeJS: No initialisation needed. You can optionally activate debug tools
   * for better error messages in WebAssembly code by calling `initWebAssembly`.
   *
   * 2. UMD, CJS and ESM builds with inlined WebAssembly code running in the
   * browser: WebAssembly needs to be decoded and initialised by calling
   * `initWebAssembly` once before all other methods. This will also implicitly
   * activate debug tools for better error messages in WebAssembly code.
   *
   * 3. CJS and ESM "slim" builds running in browser: WebAssembly needs to be
   * initialised by providing external "p2panda.wasm" file path as an input
   * when calling `initWebAssembly` methods. This will also implicitly activate
   * debug tools for better error messages in WebAssembly code.
   */
  initWebAssembly,
};

export type { Options } from './session';
export type { SchemaId, NextArgs, DocumentViewId, Fields } from './types';
