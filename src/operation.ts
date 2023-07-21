// SPDX-License-Identifier: AGPL-3.0-or-later

import { encodeOperation } from 'p2panda-js';

import { signAndHashEntry } from './entry.js';

import type {
  CreateArgs,
  DeleteArgs,
  EntryArgs,
  PublishVariables,
  UpdateArgs,
} from './types.js';

/**
 * Encodes and signs a CREATE operation with the given data fields.
 *
 * Returns the encoded entry and encoded operation.
 */
export function createOperation(
  args: CreateArgs,
  entryArgs: EntryArgs,
): PublishVariables {
  const operation = encodeOperation({
    action: 'create',
    ...args,
  });

  return signAndHashEntry(operation, entryArgs);
}

/**
 * Encodes and signs an UPDATE operation for the given document view id and
 * fields.
 *
 * Returns the encoded entry and encoded operation.
 */
export function updateOperation(
  args: UpdateArgs,
  entryArgs: EntryArgs,
): PublishVariables {
  const operation = encodeOperation({
    action: 'update',
    ...args,
  });

  return signAndHashEntry(operation, entryArgs);
}

/**
 * Encodes and signs a DELETE operation for the given document view id.
 *
 * Returns the encoded entry and encoded operation.
 */
export function deleteOperation(
  args: DeleteArgs,
  entryArgs: EntryArgs,
): PublishVariables {
  const operation = encodeOperation({
    action: 'delete',
    ...args,
  });

  return signAndHashEntry(operation, entryArgs);
}
