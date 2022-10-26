// SPDX-License-Identifier: AGPL-3.0-or-later

import debug from 'debug';
import { gql, GraphQLClient } from 'graphql-request';

import { createDocument, deleteDocument, updateDocument } from '../document';

import type { KeyPair } from 'p2panda-js';
import type { NextArgs, Fields, SchemaId } from '../types';

const log = debug('shirokuma:session');

export type Context = {
  keyPair: KeyPair;
  schema: SchemaId;
  session: Session;
};

type NextArgsVariables = {
  publicKey: string;
  viewId?: string;
};

// GraphQL query to retrieve next entry args from node.
export const GQL_NEXT_ARGS = gql`
  query NextArgs($publicKey: String!, $viewId: String) {
    nextArgs(publicKey: $publicKey, viewId: $viewId) {
      logId
      seqNum
      backlink
      skiplink
    }
  }
`;

type PublishVariables = {
  entry: string;
  operation: string;
};

// GraphQL mutation to publish an entry and retrieve arguments for encoding the
// next operation on the same document (those are currently not used to update
// the next entry arguments cache).
export const GQL_PUBLISH = gql`
  mutation Publish($entry: String!, $operation: String!) {
    publish(entry: $entry, operation: $operation) {
      logId
      seqNum
      backlink
      skiplink
    }
  }
`;

/**
 * Communicate with the p2panda network through a `Session` instance.
 *
 * `Session` provides a high-level interface to create data in the p2panda
 * network by creating, updating and deleting documents following data schemas.
 * It also provides a low-level API for directly accessing and creating
 * entries on the Bamboo append-only log structure.
 *
 * A session is configured with the URL of a p2panda node, which may be running
 * locally or on a remote machine. It is possible to set a fixed key pair
 * and/or data schema for a session by calling `setKeyPair()` and `setSchema()`
 * or you can also configure these through the `options` parameter of
 * methods.
 */
export class Session {
  // Address of a p2panda node that we can connect to
  endpoint: string;

  // A GraphQL client connected to the configured endpoint
  client: GraphQLClient;

  // Cached arguments for the next entry
  private nextArgs: { [cacheKey: string]: NextArgs } = {};

  constructor(endpoint: Session['endpoint']) {
    if (endpoint == null || endpoint === '') {
      throw new Error('Missing `endpoint` parameter for creating a session');
    }
    this.endpoint = endpoint;
    this.client = new GraphQLClient(endpoint);
  }

  private _schema: SchemaId | null = null;

  /**
   * Return currently configured schema.
   *
   * Throws if no schema is configured.
   */
  get schema(): SchemaId {
    if (!this._schema) {
      throw new Error(
        'Configure a schema with `session.schema()` or with the `options` ' +
          'parameter on methods.',
      );
    }
    return this._schema;
  }

  /**
   * Set a fixed schema for this session, which will be used if no other schema
   * is defined through a methods `options` parameter.
   *
   * @param val schema id
   * @returns Session
   */
  setSchema(val: SchemaId): Session {
    this._schema = val;
    return this;
  }

  private _keyPair: KeyPair | null = null;

  get keyPair(): KeyPair {
    if (!this._keyPair) {
      throw new Error(
        'Configure a key pair with `session.keyPair()` or with the `options` ' +
          'parameter on methods.',
      );
    }
    return this._keyPair;
  }

  /**
   * Set a fixed key pair for this session, which will be used by methods
   * unless a different key pair is configured through their `options`
   * parameters.
   *
   * This does not check the integrity or type of the supplied key pair!
   *
   * @param val key pair instance generated using the `KeyPair` class.
   * @returns key pair instance
   */
  setKeyPair(val: KeyPair): Session {
    this._keyPair = val;
    return this;
  }

  /**
   * Return arguments for constructing the next entry given author and schema.
   *
   * This uses the cache set through `Session._setnextArgs`.
   *
   * @param publicKey public key of the author
   * @param viewId optional document view id
   * @returns an `EntryArgs` object
   */
  async getNextArgs(publicKey: string, viewId?: string): Promise<NextArgs> {
    if (!publicKey) {
      throw new Error("Author's public key must be provided");
    }

    const variables: NextArgsVariables = {
      publicKey,
    };

    // Use cache only when viewId is set
    if (viewId) {
      const cacheKey = `${publicKey}/${viewId}`;
      const cachedValue = this.nextArgs[cacheKey];

      if (cachedValue) {
        delete this.nextArgs[cacheKey];
        log('request nextArgs [cached]', cachedValue);
        return cachedValue;
      }

      variables.viewId = viewId;
    }

    try {
      const data = await this.client.request(GQL_NEXT_ARGS, variables);
      // @TODO: Query `nextArgs` is deprecated and will be replaced by `nextArgs` soon
      const nextArgs = data.nextArgs;
      log('request nextArgs', nextArgs);
      return nextArgs;
    } catch (err) {
      log('Error fetching nextArgs');
      throw err;
    }
  }

  /**
   * Cache next entry args for a given author and document id.
   *
   * @param publicKey public key of the author
   * @param viewId document id
   * @param nextArgs an object with entry arguments
   */
  setNextArgs(publicKey: string, viewId: string, nextArgs: NextArgs): void {
    const cacheKey = `${publicKey}/${viewId}`;
    this.nextArgs[cacheKey] = nextArgs;
  }

  /**
   * Publish an encoded entry and operation.
   *
   * @param entry
   * @param operation
   * @returns next entry arguments
   */
  async publish(entry: string, operation: string): Promise<NextArgs> {
    if (!entry || !operation) {
      throw new Error('Encoded entry and operation must be provided');
    }

    const variables: PublishVariables = {
      entry,
      operation,
    };

    try {
      const data = await this.client.request(GQL_PUBLISH, variables);
      log('request publish', data);
      // @TODO: Query `publish` is deprecated and will be replaced by `publish` soon
      if (data?.publish == null) {
        throw new Error("Response doesn't contain field `publish`");
      }
      return data.publish;
    } catch (err) {
      log('Error publishing entry');
      throw err;
    }
  }

  // Document operations

  /**
   * Signs and publishes a CREATE operation for the given application data and
   * matching schema.
   *
   * Caches arguments for creating the next entry of this document in the given
   * session.
   *
   * @param fields application data to publish with the new entry, needs to match schema
   * @param options optional config object:
   * @param options.keyPair will be used to sign the new entry
   * @param options.schema hex-encoded schema id
   * @example
   * const operationFields = {
   *   message: 'ahoy'
   * };
   * await new Session(endpoint)
   *   .setKeyPair(keyPair)
   *   .create(operationFields, { schema });
   */
  async create(fields: Fields, options?: Partial<Context>): Promise<Session> {
    // We should validate the data against the schema here too eventually
    if (!fields) {
      throw new Error('Operation fields must be provided');
    }

    log('create document', fields);
    const mergedOptions = {
      schema: options?.schema || this.schema,
      keyPair: options?.keyPair || this.keyPair,
      session: this,
    };
    createDocument(fields, mergedOptions);

    return this;
  }

  /**
   * Signs and publishes an UPDATE operation for the given application data and
   * matching schema.
   *
   * The document to be updated is referenced by its document id, which is the
   * operation id of that document's initial `CREATE` operation.
   *
   * Caches arguments for creating the next entry of this schema in the given
   * session.
   *
   * @param documentId id of the document we update, this is the id of the root `create` operation
   * @param fields application data to publish with the new entry, needs to match schema
   * @param previousOperations array of operation ids identifying the tips of all currently un-merged branches in the document graph
   * @param options optional config object:
   * @param options.keyPair will be used to sign the new entry
   * @param options.schema hex-encoded schema id
   * @example
   * const documentId = '00200cf84048b0798942deba7b1b9fcd77ca72876643bd3fedfe612d4c6fb60436be';
   * const operationFields = {
   *   message: 'ahoy',
   * };
   * const previousOperations = [
   *   '00203341c9dd226525886ee77c95127cd12f74366703e02f9b48f3561a9866270f07',
   * ];
   * await new Session(endpoint)
   *   .setKeyPair(keyPair)
   *   .update(documentId, operationFields, previousOperations, { schema });
   */
  async update(
    fields: Fields,
    previousOperations: string[],
    options?: Partial<Context>,
  ): Promise<Session> {
    // We should validate the data against the schema here too eventually
    if (!previousOperations) {
      throw new Error('Previous view id must be provided');
    }

    if (!fields) {
      throw new Error('Operation fields must be provided');
    }

    log('update document wyth view ', previousOperations, fields);
    const mergedOptions = {
      schema: options?.schema || this.schema,
      keyPair: options?.keyPair || this.keyPair,
      session: this,
    };
    updateDocument(previousOperations, fields, mergedOptions);

    return this;
  }

  /**
   * Signs and publishes a DELETE operation for the given schema.
   *
   * The document to be deleted is referenced by its document id, which is the
   * operation id of that document's initial `CREATE` operation.
   *
   * Caches arguments for creating the next entry of this schema in the given session.
   *
   * @param documentId id of the document we delete, this is the hash of the root `create` entry
   * @param previousOperations array of operation ids identifying the tips of all currently un-merged branches in the document graph
   * @param options optional config object:
   * @param options.keyPair will be used to sign the new entry
   * @param options.schema hex-encoded schema id
   * @example
   * const documentId = '00200cf84048b0798942deba7b1b9fcd77ca72876643bd3fedfe612d4c6fb60436be';
   * const previousOperations = [
   *   '00203341c9dd226525886ee77c95127cd12f74366703e02f9b48f3561a9866270f07',
   * ];
   * await new Session(endpoint)
   *   .setKeyPair(keyPair)
   *   .delete(documentId, previousOperations, { schema });
   */
  async delete(
    previousOperations: string[],
    options?: Partial<Context>,
  ): Promise<Session> {
    if (!previousOperations) {
      throw new Error('Previous view id must be provided');
    }

    log('delete document with view ', previousOperations);
    const mergedOptions = {
      schema: options?.schema || this.schema,
      keyPair: options?.keyPair || this.keyPair,
      session: this,
    };
    deleteDocument(previousOperations, mergedOptions);

    return this;
  }

  toString(): string {
    const keyPairStr = this._keyPair
      ? ` key pair ${this._keyPair.publicKey().slice(-8)}`
      : '';
    const schemaStr = this._schema ? ` schema ${this.schema.slice(-8)}` : '';
    return `<Session ${this.endpoint}${keyPairStr}${schemaStr}>`;
  }
}
