// SPDX-License-Identifier: AGPL-3.0-or-later

/* eslint-disable @typescript-eslint/ban-ts-comment */

import fetchMockJest from 'fetch-mock-jest';

import fixtures from './fixtures.json';

import { Session, KeyPair } from '../src/index.js';
import { GQL_PUBLISH, GQL_NEXT_ARGS } from '../src/graphql.js';

import type { DocumentViewId, Fields } from '../src/types.js';
import type { FetchMockStatic } from 'fetch-mock';

/**
 * Set up GraphQL server mock. It will respond to:
 * - query `nextArgs`: always returns entry args for sequence number 6
 * - mutation `publish` always returns a response as if sequence number 5 had
 *   been published.
 */
jest.mock('node-fetch', () => fetchMockJest.sandbox());
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetchMock: FetchMockStatic = require('node-fetch');

// @ts-ignore
fetchMock.config.matchPartialBody = true;

describe('Session', () => {
  it('requires an endpoint parameter', () => {
    expect(() => {
      // @ts-ignore: We deliberately use the API wrong here
      new Session();
    }).toThrow('Missing `endpoint` parameter for creating a session');

    expect(() => {
      new Session('');
    }).toThrow('Missing `endpoint` parameter for creating a session');
  });
});

describe('nextArgs', () => {
  beforeEach(() => {
    fetchMock.mock(
      {
        name: 'nextArgs',
        url: 'http://localhost:2020/graphql',
        body: {
          query: GQL_NEXT_ARGS,
          variables: {
            publicKey: fixtures.publicKey,
            viewId: fixtures.entries[0].entryHash,
          },
        },
      },
      {
        data: {
          nextArgs: fixtures.nextArgs[4],
        },
      },
    );
  });

  afterEach(() => {
    // @ts-ignore
    fetchMock.mockReset();
  });

  it('returns next entry arguments from node', async () => {
    const session = new Session('http://localhost:2020/graphql');

    const nextArgs = await session.nextArgs(
      fixtures.publicKey,
      fixtures.entries[0].entryHash,
    );
    const expectedArgs = fixtures.nextArgs[4];
    expect(nextArgs.skiplink).toEqual(expectedArgs.skiplink);
    expect(nextArgs.backlink).toEqual(expectedArgs.backlink);
    expect(nextArgs.seqNum).toEqual(expectedArgs.seqNum);
    expect(nextArgs.logId).toEqual(expectedArgs.logId);
  });
});

describe('publish', () => {
  beforeEach(() => {
    fetchMock.mock(
      {
        name: 'publish',
        url: 'http://localhost:2020/graphql',
        body: {
          query: GQL_PUBLISH,
          variables: {
            entry: fixtures.entries[3].encodedEntry,
            operation: fixtures.entries[3].encodedOperation,
          },
        },
      },
      {
        data: {
          nextArgs: fixtures.nextArgs[4],
        },
      },
    );
  });

  afterEach(() => {
    // @ts-ignore
    fetchMock.mockReset();
  });

  it('can publish entries and retreive the next document view id', async () => {
    const session = new Session('http://localhost:2020/graphql').setKeyPair(
      new KeyPair(fixtures.privateKey),
    );

    const viewId = await session.publish(
      fixtures.entries[3].encodedEntry,
      fixtures.entries[3].encodedOperation,
    );

    expect(viewId).toEqual(fixtures.entries[3].entryHash);
  });

  it('throws when publishing without all required parameters', async () => {
    const session = new Session('http://localhost:2020/graphql').setKeyPair(
      new KeyPair(fixtures.privateKey),
    );

    await expect(
      // @ts-ignore: We deliberately use the API wrong here
      session.publish(null, fixtures.entries[3].encodedOperation),
    ).rejects.toThrow();
    await expect(
      // @ts-ignore: We deliberately use the API wrong here
      session.publish(fixtures.entries[3].encodedEntry, null),
    ).rejects.toThrow();
  });
});

describe('create', () => {
  let session: Session;

  beforeEach(() => {
    fetchMock
      .mock(
        {
          name: 'nextArgs',
          url: 'http://localhost:2020/graphql',
          body: { query: GQL_NEXT_ARGS },
        },
        {
          data: {
            nextArgs: fixtures.nextArgs[0],
          },
        },
      )
      .mock(
        {
          name: 'publish',
          url: 'http://localhost:2020/graphql',
          body: { query: GQL_PUBLISH },
        },
        {
          data: {
            nextArgs: fixtures.nextArgs[1],
          },
        },
      );
  });

  afterEach(() => {
    // @ts-ignore
    fetchMock.mockReset();
  });

  beforeEach(async () => {
    session = new Session('http://localhost:2020/graphql');
    session.setKeyPair(new KeyPair(fixtures.privateKey));
  });

  it('returns the id of the created document', async () => {
    const fields = fixtures.operations[0].fields as Fields;

    await expect(
      session.create(fields, {
        schemaId: fixtures.schemaId,
      }),
    ).resolves.toBe(fixtures.entries[0].entryHash);
  });

  it('throws when missing a required parameter', async () => {
    await expect(
      // @ts-ignore: We deliberately use the API wrong here
      session.setKeyPair(new KeyPair()).create(),
    ).rejects.toThrow();
  });
});

describe('update', () => {
  let session: Session;

  beforeEach(() => {
    fetchMock
      .mock(
        {
          name: 'nextArgs',
          url: 'http://localhost:2020/graphql',
          body: { query: GQL_NEXT_ARGS },
        },
        {
          data: {
            nextArgs: fixtures.nextArgs[1],
          },
        },
      )
      .mock(
        {
          name: 'publish',
          url: 'http://localhost:2020/graphql',
          body: { query: GQL_PUBLISH },
        },
        {
          data: {
            nextArgs: fixtures.nextArgs[2],
          },
        },
      );
  });

  afterEach(() => {
    // @ts-ignore
    fetchMock.mockReset();
  });

  beforeEach(async () => {
    session = new Session('http://localhost:2020/graphql');
    session.setKeyPair(new KeyPair(fixtures.privateKey));
  });

  it('returns the local view id of the updated document', async () => {
    const fields = fixtures.operations[1].fields as Fields;
    const previous = fixtures.operations[1].previous as DocumentViewId;

    await expect(
      session.update(fields, previous, {
        schemaId: fixtures.schemaId,
      }),
    ).resolves.toBe(fixtures.entries[1].entryHash);
  });

  it('throws when missing a required parameter', async () => {
    await expect(
      // @ts-ignore: We deliberately use the API wrong here
      session.update(null, { schemaId: fixtures.schemaId }),
    ).rejects.toThrow();

    await expect(
      // @ts-ignore: We deliberately use the API wrong here
      session.update({
        message: 'Doing it wrong',
      }),
    ).rejects.toThrow();
  });
});

describe('delete', () => {
  let session: Session;

  beforeEach(() => {
    fetchMock
      .mock(
        {
          name: 'nextArgs',
          url: 'http://localhost:2020/graphql',
          body: { query: GQL_NEXT_ARGS },
        },
        {
          data: {
            nextArgs: fixtures.nextArgs[3],
          },
        },
      )
      .mock(
        {
          name: 'publish',
          url: 'http://localhost:2020/graphql',
          body: { query: GQL_PUBLISH },
        },
        {
          data: {
            nextArgs: fixtures.nextArgs[4],
          },
        },
      );
  });

  afterEach(() => {
    // @ts-ignore
    fetchMock.mockReset();
  });

  beforeEach(async () => {
    session = new Session('http://localhost:2020/graphql');
    session.setKeyPair(new KeyPair(fixtures.privateKey));
  });

  it('returns the local view id of the deleted document', async () => {
    const previous = fixtures.operations[3].previous as DocumentViewId;

    await expect(
      session.delete(previous, {
        schemaId: fixtures.schemaId,
      }),
    ).resolves.toBe(fixtures.entries[3].entryHash);

    expect(await session.setSchemaId(fixtures.schemaId).delete(previous))
      .resolves;
  });

  it('throws when missing a required parameter', async () => {
    await expect(
      // @ts-ignore: We deliberately use the API wrong here
      session.delete(null, { schemaId: fixtures.schemaId }),
    ).rejects.toThrow();

    await expect(
      // @ts-ignore: We deliberately use the API wrong here
      session.delete(null),
    ).rejects.toThrow();
  });
});
