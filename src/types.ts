// SPDX-License-Identifier: AGPL-3.0-or-later

import type { EasyValues, KeyPair, OperationFields } from 'p2panda-js';

/**
 * Ed25519 public key of author.
 */
export type PublicKey = string;

/**
 * YASMF-BLAKE3 hash of an Bamboo entry.
 */
export type EntryHash = string;

export type DocumentId = string;

/**
 * Document view id which contains one to many operation ids, either as one
 * string separated by underscores or as an array of strings.
 */
export type DocumentViewId = string | string[];

/**
 * Application- (custom) or System schema (constant) identifier.
 */
export type SchemaId =
  | 'schema_definition_v1'
  | 'schema_field_definition_v1'
  | string;

/**
 * Data fields sent within an operation.
 */
export type Fields = EasyValues | OperationFields;

/**
 * Arguments required to create a new document.
 */
export type CreateArgs = {
  schemaId: SchemaId;
  fields: Fields;
};

/**
 * Arguments required to update a new document.
 */
export type UpdateArgs = {
  schemaId: SchemaId;
  previous: DocumentViewId;
  fields: Fields;
};

/**
 * Arguments required to delete a new document.
 */
export type DeleteArgs = {
  schemaId: SchemaId;
  previous: DocumentViewId;
};

/**
 * Arguments required to create and sign a new Bamboo entry.
 */
export type EntryArgs = {
  keyPair: KeyPair;
  nextArgs: NextArgs;
};

/**
 * Response data from `nextArgs` and `publish` GraphQL query. Contains all the
 * important bits to create a new Bamboo entry.
 */
export type NextArgs = {
  skiplink?: string;
  backlink?: string;
  seqNum: string | bigint | number;
  logId: string | bigint | number;
};

/**
 * Bamboo entry bytes, encoded as hexadecimal string.
 */
export type EncodedEntry = string;

/**
 * CBOR operation bytes, encoded as hexadecimal string.
 */
export type EncodedOperation = string;

/**
 * To-be-published entry and operation data.
 */
export type Payload = {
  entry: EncodedEntry;
  operation: EncodedOperation;
};

/**
 * To-be-published entry and operation data plus additional information about
 * the current, local document view id
 */
export type PayloadWithViewId = Payload & {
  localViewId: EntryHash;
};

/**
 * Request data for `nextArgs` GraphQL query.
 */
export type NextArgsVariables = {
  publicKey: PublicKey;
  viewId?: DocumentViewId;
};

/**
 * Request data for `publish` GraphQL mutation.
 */
export type PublishVariables = Payload;

export type FieldString = {
  type: 'str';
};

export type FieldInteger = {
  type: 'int';
};

export type FieldFloat = {
  type: 'float';
};

export type FieldBoolean = {
  type: 'bool';
};

export type FieldRelation = {
  type: 'relation';
  value: string;
};

export type FieldRelationList = {
  type: 'relation_list';
  value: string[];
};

export type FieldPinnedRelation = {
  type: 'pinned_relation';
  value: string[];
};

export type FieldPinnedRelationList = {
  type: 'pinned_relation_list';
  value: string[][];
};

export type SchemaFields = {
  [name: string]:
    | FieldString
    | FieldBoolean
    | FieldFloat
    | FieldInteger
    | FieldRelation
    | FieldRelationList
    | FieldPinnedRelation
    | FieldPinnedRelationList;
};

export type DocumentValue =
  | string
  | boolean
  | number
  | bigint
  | string[]
  | string[][];

export type DocumentFields = {
  [name: string]: DocumentValue;
};
