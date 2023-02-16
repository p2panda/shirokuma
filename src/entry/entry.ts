// SPDX-License-Identifier: AGPL-3.0-or-later

import { signAndEncodeEntry } from 'p2panda-js';

import type { EncodedOperation, EntryArgs, PublishVariables } from '../types';

/**
 * Sign and publish an entry given an encoded operation, key pair and entry
 * arguments (log id, sequence number, backlink and skiplink).
 *
 * Returns the encoded entry, encoded operation and entry hash.
 */
export function signAndHashEntry(
  operation: EncodedOperation,
  entryArgs: EntryArgs,
): PublishVariables {
  const { nextArgs, keyPair } = entryArgs;

  const entry = signAndEncodeEntry(
    {
      ...nextArgs,
      operation,
    },
    keyPair,
  );

  return {
    entry,
    operation,
  };
}
