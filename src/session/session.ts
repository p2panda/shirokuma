import { GraphQLClient } from 'graphql-request';

import { KeyPair } from '../identity';

import type { SchemaId } from '../types';

export class Session {
  /**
   * Address of a p2panda node that we can connect to.
   */
  readonly endpoint: string;

  /**
   * A GraphQL client connected to the configured endpoint.
   */
  readonly client: GraphQLClient;

  constructor(endpoint: Session['endpoint']) {
    if (!endpoint) {
      throw new Error('Missing `endpoint` parameter for creating a session');
    }

    this.endpoint = endpoint;
    this.client = new GraphQLClient(endpoint);
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
}
