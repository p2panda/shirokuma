// SPDX-License-Identifier: AGPL-3.0-or-later

import debug from 'debug';
import { encodeOperation } from 'p2panda-js';

import { getOperationFields } from '../operation';
import { marshallRequestFields } from '../utils';
import { signPublishEntry } from '../entry';

import type { Context } from '../session';
import type { Fields } from '../types';

const log = debug('shirokuma:document');

/**
 * Signs and publishes a CREATE operation for the given application data and
 * matching document id.
 *
 * Returns the encoded entry that was created.
 */
export const createDocument = async (
  fields: Fields,
  { keyPair, schema, session }: Context,
): Promise<string> => {
  log(`Creating document`, fields);

  const fieldsTagged = marshallRequestFields(fields);
  const operationFields = getOperationFields(fieldsTagged);
  const encodedOperation = encodeOperation({
    action: 'create',
    schemaId: schema,
    fields: operationFields,
  });

  const entryEncoded = signPublishEntry(encodedOperation, {
    keyPair,
    schema,
    session,
  });

  return entryEncoded;
};

/**
 * Signs and publishes an UPDATE operation for the given document id and
 * fields.
 *
 * Returns the encoded entry that was created.
 */
export const updateDocument = async (
  previous: string[],
  fields: Fields,
  { keyPair, schema, session }: Context,
): Promise<string> => {
  log(`Updating document view`, {
    previous,
    fields,
  });

  const fieldsTagged = marshallRequestFields(fields);
  const operationFields = getOperationFields(fieldsTagged);

  const encodedOperation = encodeOperation({
    action: 'update',
    schemaId: schema,
    previous,
    fields: operationFields,
  });

  const entryEncoded = await signPublishEntry(
    encodedOperation,
    {
      keyPair,
      schema,
      session,
    },
    previous,
  );

  return entryEncoded;
};

/**
 * Signs and publishes a DELETE operation for the given document id.
 *
 * Returns the encoded entry that was created.
 */
export const deleteDocument = async (
  previous: string[],
  { keyPair, schema, session }: Context,
): Promise<string> => {
  log('Deleting document with view ', { previous });

  const encodedOperation = encodeOperation({
    action: 'delete',
    schemaId: schema,
    previous,
  });

  const encodedEntry = await signPublishEntry(
    encodedOperation,
    {
      keyPair,
      schema,
      session,
    },
    previous,
  );

  return encodedEntry;
};
