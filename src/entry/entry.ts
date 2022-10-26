// SPDX-License-Identifier: AGPL-3.0-or-later

import debug from 'debug';
import { signAndEncodeEntry, generateHash } from 'p2panda-js';

import { Context } from '../session';

const log = debug('shirokuma:entry');

/**
 * Sign and publish an entry given a prepared `Operation`, `KeyPair` and
 * `Session`.
 *
 * Sets next entry args on the supplied session's entry args cache.
 *
 * Returns the encoded entry.
 */
export const signPublishEntry = async (
  operationEncoded: string,
  { keyPair, session }: Context,
  viewId?: string[],
): Promise<string> => {
  const publicKey = keyPair.publicKey();
  const viewIdStr = viewId ? viewId.join('_') : undefined;

  log('Signing and publishing entry');
  const nextArgs = await session.getNextArgs(publicKey, viewIdStr);

  log('Retrieved next args for', {
    publicKey,
    viewId,
    nextArgs,
  });

  const entryEncoded = signAndEncodeEntry(
    {
      ...nextArgs,
      payload: operationEncoded,
    },
    keyPair,
  );
  const entryHash = generateHash(entryEncoded);
  log('Signed and encoded entry');

  const publishNextArgs = await session.publish(entryEncoded, operationEncoded);
  log('Published entry');

  // Cache next entry args for next publish. Use the entry hash as the document
  // id for CREATE operations.
  session.setNextArgs(publicKey, entryHash, publishNextArgs);
  log('Cached next arguments');

  return entryEncoded;
};
