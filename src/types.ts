// SPDX-License-Identifier: AGPL-3.0-or-later

import type { EasyValues, KeyPair, OperationFields } from 'p2panda-js';

export type PublicKey = string;

export type EntryHash = string;

export type DocumentViewId = string | string[];

/**
 * Application- (custom) or System schema (constant) identifier.
 */
export type SchemaId =
  | 'schema_definition_v1'
  | 'schema_field_definition_v1'
  | string;

export type Fields = EasyValues | OperationFields;

export type CreateArgs = {
  schemaId: SchemaId;
  fields: Fields;
};

export type UpdateArgs = {
  schemaId: SchemaId;
  previous: DocumentViewId;
  fields: Fields;
};

export type DeleteArgs = {
  schemaId: SchemaId;
  previous: DocumentViewId;
};

export type EntryArgs = {
  keyPair: KeyPair;
  nextArgs: NextArgs;
};

export type NextArgs = {
  skiplink?: string;
  backlink?: string;
  seqNum: string | bigint | number;
  logId: string | bigint | number;
};

export type EncodedEntry = string;

export type EncodedOperation = string;

export type Payload = {
  entry: EncodedEntry;
  operation: EncodedOperation;
};

export type PayloadWithViewId = Payload & {
  localViewId: EntryHash;
};

export type NextArgsVariables = {
  publicKey: PublicKey;
  viewId?: DocumentViewId;
};

export type PublishVariables = Payload;
