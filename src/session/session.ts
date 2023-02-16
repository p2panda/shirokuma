import { GraphQLClient } from 'graphql-request';
import { generateHash, KeyPair } from 'p2panda-js';

import { Cache } from '../cache';
import {
  createOperation,
  deleteOperation,
  updateOperation,
} from '../operation';
import { nextArgs, publish } from '../graphql';

import type {
  DocumentViewId,
  EncodedEntry,
  EncodedOperation,
  Fields,
  NextArgs,
  PublicKey,
  SchemaId,
} from '../types';

/**
 * Helper method to derive a cache key string for entry arguments.
 */
function getCacheKey(publicKey: PublicKey, viewId: DocumentViewId) {
  return `${publicKey}/${viewId}`;
}

/**
 * Options we can pass in into methods which will override the globally set
 * options for that session for that method call.
 */
type Options = {
  /**
   * Key pair which is used for that method call to sign the entry.
   */
  keyPair: KeyPair;

  /**
   * Schema Id which is used for that method call to identify the schema of the
   * document.
   */
  schemaId: SchemaId;
};

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
  /**
   * Address of a p2panda node that we can connect to.
   */
  readonly endpoint: string;

  /**
   * A GraphQL client connected to the configured endpoint.
   */
  readonly client: GraphQLClient;

  /**
   * Internal cache to keep state required for creating Bamboo entries.
   */
  readonly cache: Cache<NextArgs>;

  constructor(endpoint: Session['endpoint']) {
    if (!endpoint) {
      throw new Error('Missing `endpoint` parameter for creating a session');
    }

    this.endpoint = endpoint;
    this.client = new GraphQLClient(endpoint);
    this.cache = new Cache();
  }

  /**
   * Globally configured schema id which is used as a default for all requests.
   */
  #schemaId: SchemaId | null = null;

  /**
   * Returns currently configured schema id.
   *
   * Throws if no schema id is configured.
   */
  get schemaId(): SchemaId {
    if (!this.#schemaId) {
      throw new Error(
        'Configure a schema id with `session.schemaId()` or with the `options` ' +
          'parameter on methods.',
      );
    }

    return this.#schemaId;
  }

  /**
   * Set a schema id for this whole session.
   *
   * This value will be used if no other schema id is defined through a methods
   * `options` parameter.
   *
   * @param id schema id
   * @returns Session instance
   */
  setSchemaId(id: SchemaId): Session {
    this.#schemaId = id;
    return this;
  }

  /**
   * Globally configured key pair which is used as a default for all requests.
   */
  #keyPair: KeyPair | null = null;

  /**
   * Returns currently configured key pair.
   *
   * Throws if no key pair is configured.
   */
  get keyPair(): KeyPair {
    if (!this.#keyPair) {
      throw new Error(
        'Configure a key pair with `session.keyPair()` or with the `options` ' +
          'parameter on methods.',
      );
    }

    return this.#keyPair;
  }

  /**
   * Set a fixed key pair for this session, which will be used by methods
   * unless a different key pair is configured through their `options`
   * parameters.
   *
   * This does not check the integrity or type of the supplied key pair!
   *
   * @param keyPair - key pair instance generated using the `KeyPair` class.
   * @returns Session instance
   */
  setKeyPair(keyPair: KeyPair): Session {
    this.#keyPair = keyPair;
    return this;
  }
  /**
   * Return arguments for constructing the next entry given public key and
   * schema id.
   *
   * This uses an internal cache which might know the arguments already.
   *
   * @param publicKey public key of the author
   * @param viewId optional document view id
   * @returns arguments used to create a new entry
   */
  async nextArgs(
    publicKey: PublicKey,
    viewId?: DocumentViewId,
  ): Promise<NextArgs> {
    if (!publicKey) {
      throw new Error("Author's public key must be provided");
    }

    // Use cache only when viewId is set.
    //
    // If it is not set we need to determine the next free logId but we do not
    // keep track of that currently, so let's ask the node in that case!
    if (viewId) {
      const cacheKey = getCacheKey(publicKey, viewId);
      const cachedValue = this.cache.get(cacheKey);

      if (cachedValue) {
        this.cache.remove(cacheKey);
        return cachedValue;
      }
    }

    // Ask node for next entry arguments if we can't determine them locally
    const result = await nextArgs(this.client, {
      publicKey,
      viewId,
    });

    return result;
  }

  /**
   * Publish an encoded entry and operation.
   *
   * This method returns the "local" document view id, which represents the
   * latest version of the document we've created, updated or deleted.
   *
   * It is "local" because it is the "latest version" from our perspective.
   * Concurrent updates through other peers might have happend but we didn't
   * know about them in the moment we've published our operation. p2panda
   * handles these concurrent updates internally for us.
   *
   * @param entry - encoded and signed entry, represented as hexadecimal
   * string
   * @param operation - encoded CBOR operation, represented as hexadecimal
   * string
   * @returns local document view id
   */
  async publish(
    entry: EncodedEntry,
    operation: EncodedOperation,
  ): Promise<DocumentViewId> {
    if (!entry || !operation) {
      throw new Error('Encoded entry and operation must be provided');
    }

    // Publish entry with operation payload and retreive next entry arguments
    // for future updates on that document
    const nextArgs = await publish(this.client, { entry, operation });

    // Store next entry arguments optimistically in our cache, so it's ready
    // next time we want to publish something related to this document
    const publicKey = this.keyPair.publicKey();
    const localViewId = generateHash(entry);
    const cacheKey = getCacheKey(publicKey, localViewId);
    this.cache.insert(cacheKey, nextArgs);

    // Return document view id of the "latest" version from our perspective,
    // hence "local"
    return localViewId;
  }

  /**
   * Creates a new document with the given fields and matching schema id.
   *
   * @param fields - application data to publish with the new entry, needs to
   * match schema
   * @param options - overrides globally set options for this method call
   * @param options.keyPair - will be used to sign the new entry
   * @param options.schemaId - will be used as the matching schema identifier
   * @returns Document id of the document we've created
   * @example
   * const endpoint = 'http://localhost:2020';
   * const keyPair = new KeyPair();
   * const schemaId = 'chat_00206394434d78553bd064c8ea9a61d2b9622826909966ae895eb1c8b692b335d919';
   *
   * const fields = {
   *   message: 'ahoy'
   * };
   *
   * await new Session(endpoint)
   *   .setKeyPair(keyPair)
   *   .create(fields, { schemaId });
   */
  async create(
    fields: Fields,
    options?: Partial<Options>,
  ): Promise<DocumentViewId> {
    if (!fields) {
      throw new Error('Fields must be provided');
    }

    const schemaId = options?.schemaId || this.schemaId;
    const keyPair = options?.keyPair || this.keyPair;

    // Retreive next entry arguments, potentially from cache
    const publicKey = keyPair.publicKey();
    const nextArgs = await this.nextArgs(publicKey);

    // Sign and encode entry with CREATE operation
    const { entry, operation } = createOperation(
      {
        schemaId,
        fields,
      },
      {
        keyPair,
        nextArgs,
      },
    );

    // Publish entry and operation on node, return the "local" document view id
    // which in this case will be the id of the document we've just created
    const localViewId = await this.publish(entry, operation);
    return localViewId;
  }

  /**
   * Updates a document with the given fields and matching schema id.
   *
   * The document to be updated is identified by the `previous` parameter which contains
   * the most recent known document view id.
   *
   * @param fields - data to publish with the new entry, needs to match schema
   * @param previous - array or string of operation ids identifying the tips of
   * all currently un-merged branches in the document graph
   * @param options - overrides globally set options for this method call
   * @param options.keyPair - will be used to sign the new entry
   * @param options.schemaId - will be used as the matching schema identifier
   * @returns Document view id, pointing at the exact version of the document
   * we've just updated
   * @example
   * const endpoint = 'http://localhost:2020';
   * const keyPair = new KeyPair();
   * const schemaId = 'chat_00206394434d78553bd064c8ea9a61d2b9622826909966ae895eb1c8b692b335d919';
   *
   * const session = new Session(endpoint)
   *   .setKeyPair(keyPair)
   *   .setSchemaId(schemaId);
   *
   * // Create a new document first
   * const viewId = await session.create({
   *   message: 'ahoy!'
   * });
   *
   * // Use the `viewId` to point our update at the document we've just created
   * await session.update({
   *   message: 'ahoy, my friend!'
   * }, viewId);
   */
  async update(
    fields: Fields,
    previous: DocumentViewId,
    options?: Partial<Options>,
  ): Promise<DocumentViewId> {
    if (!fields) {
      throw new Error('Fields must be provided');
    }

    if (!previous) {
      throw new Error('Document view id must be provided');
    }

    const schemaId = options?.schemaId || this.schemaId;
    const keyPair = options?.keyPair || this.keyPair;

    // Retreive next entry arguments, potentially from cache
    const publicKey = keyPair.publicKey();
    const nextArgs = await this.nextArgs(publicKey);

    // Sign and encode entry with UPDATE operation
    const { entry, operation } = updateOperation(
      {
        schemaId,
        previous,
        fields,
      },
      {
        keyPair,
        nextArgs,
      },
    );

    // Publish entry and operation on node, return the "local" document view id
    // which in this case will be the id of the update we've just made
    const localViewId = await this.publish(entry, operation);
    return localViewId;
  }

  /**
   * Deletes a document.
   *
   * The document to be deleted is identified by the `previous` parameter
   * which contains the most recent known document view id.
   *
   * @param previous - array or string of operation ids identifying the tips of
   * all currently un-merged branches in the document graph
   * @param options - overrides globally set options for this method call
   * @param options.keyPair - will be used to sign the new entry
   * @param options.schemaId - will be used as the matching schema identifier
   * @returns Document view id, pointing at the exact version of the document
   * we've just deleted
   * @example
   * const endpoint = 'http://localhost:2020';
   * const keyPair = new KeyPair();
   * const schemaId = 'chat_00206394434d78553bd064c8ea9a61d2b9622826909966ae895eb1c8b692b335d919';
   *
   * const session = new Session(endpoint)
   *   .setKeyPair(keyPair)
   *   .setSchemaId(schemaId);
   *
   * // Create a new document first
   * const viewId = await session.create({
   *   message: 'ahoy!'
   * });
   *
   * // Use the `viewId` to point our deletion at the document we've just created
   * await session.delete(viewId);
   */
  async delete(
    previous: DocumentViewId,
    options?: Partial<Options>,
  ): Promise<DocumentViewId> {
    if (!previous) {
      throw new Error('Document view id must be provided');
    }

    const schemaId = options?.schemaId || this.schemaId;
    const keyPair = options?.keyPair || this.keyPair;

    // Retreive next entry arguments, potentially from cache
    const publicKey = keyPair.publicKey();
    const nextArgs = await this.nextArgs(publicKey);

    // Sign and encode entry with DELETE operation
    const { entry, operation } = deleteOperation(
      {
        schemaId,
        previous,
      },
      {
        keyPair,
        nextArgs,
      },
    );

    // Publish entry and operation on node, return the "local" document view id
    // which in this case will be the id of the deletion we've just made
    const localViewId = await this.publish(entry, operation);
    return localViewId;
  }
}
