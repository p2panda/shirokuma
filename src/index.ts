// SPDX-License-Identifier: AGPL-3.0-or-later

import { initWebAssembly as init } from 'p2panda-js';

export { Session } from './session';
export { KeyPair } from './identity';

/**
 * Initialise WebAssembly code.
 *
 * Run this method once in the beginning of your application before you access
 * any method of `shirokuma`.
 */
export async function initWebAssembly() {
  await init();
}
