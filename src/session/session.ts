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

function getCacheKey(publicKey: PublicKey, viewId: DocumentViewId) {
  return `${publicKey}/${viewId}`;
}

/**
 * Configuration we can pass in into methods which will override the globally
 * set configuration for that session for that method call.
 */
type Configuration = {
  keyPair: KeyPair;
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
   * @param keyPair key pair instance generated using the `KeyPair` class.
   * @returns Session instance
   */
  setKeyPair(keyPair: KeyPair): Session {
    this.#keyPair = keyPair;
    return this;
  }

  async nextArgs(
    publicKey: PublicKey,
    viewId?: DocumentViewId,
  ): Promise<NextArgs> {
    if (!publicKey) {
      throw new Error("Author's public key must be provided");
    }

    // Use cache only when viewId is set. If it is not set we need to determine
    // the next free logId but we do not keep track of that currently, so let's
    // ask the node!
    if (viewId) {
      const cacheKey = getCacheKey(publicKey, viewId);
      const cachedValue = this.cache.get(cacheKey);

      if (cachedValue) {
        this.cache.remove(cacheKey);
        return cachedValue;
      }
    }

    const result = await nextArgs(this.client, {
      publicKey,
      viewId,
    });

    return result;
  }

  async publish(
    entry: EncodedEntry,
    operation: EncodedOperation,
  ): Promise<DocumentViewId> {
    if (!entry || !operation) {
      throw new Error('Encoded entry and operation must be provided');
    }

    const nextArgs = await publish(this.client, { entry, operation });

    const publicKey = this.keyPair.publicKey();
    const localViewId = generateHash(entry);
    const cacheKey = getCacheKey(publicKey, localViewId);
    this.cache.insert(cacheKey, nextArgs);

    return localViewId;
  }

  async create(
    fields: Fields,
    options?: Partial<Configuration>,
  ): Promise<DocumentViewId> {
    if (!fields) {
      throw new Error('Fields must be provided');
    }

    const schemaId = options?.schemaId || this.schemaId;
    const keyPair = options?.keyPair || this.keyPair;

    const publicKey = keyPair.publicKey();
    const nextArgs = await this.nextArgs(publicKey);

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

    const localViewId = await this.publish(entry, operation);
    return localViewId;
  }

  async update(
    fields: Fields,
    previous: DocumentViewId,
    options?: Partial<Configuration>,
  ): Promise<DocumentViewId> {
    if (!fields) {
      throw new Error('Fields must be provided');
    }

    if (!previous) {
      throw new Error('Document view id must be provided');
    }

    const schemaId = options?.schemaId || this.schemaId;
    const keyPair = options?.keyPair || this.keyPair;

    const publicKey = keyPair.publicKey();
    const nextArgs = await this.nextArgs(publicKey);

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

    const localViewId = await this.publish(entry, operation);
    return localViewId;
  }

  async delete(
    previous: DocumentViewId,
    options?: Partial<Configuration>,
  ): Promise<DocumentViewId> {
    if (!previous) {
      throw new Error('Document view id must be provided');
    }

    const schemaId = options?.schemaId || this.schemaId;
    const keyPair = options?.keyPair || this.keyPair;

    const publicKey = keyPair.publicKey();
    const nextArgs = await this.nextArgs(publicKey);

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

    const localViewId = await this.publish(entry, operation);
    return localViewId;
  }
}
