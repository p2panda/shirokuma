import { GraphQLClient, gql } from 'graphql-request';

import type { NextArgs, NextArgsVariables, PublishVariables } from '../types';

/**
 * GraphQL query to retrieve arguments to create a new entry from node.
 */
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

/**
 * GraphQL mutation to publish an entry and operation and retrieve arguments
 * for encoding the next one.
 */
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
 * Return arguments for constructing the next entry given author and document
 * view id.
 *
 * This uses the cache set through `Session._setnextArgs`.
 *
 * @param client GraphQLClient instance
 * @param variables.publicKey public key of the author
 * @param variables.viewId optional document view id
 * @returns `NextArgs` object
 */
export async function nextArgs(
  client: GraphQLClient,
  variables: NextArgsVariables,
): Promise<NextArgs> {
  if (!variables) {
    throw new Error('Query variables must be provided');
  }

  if (!variables.publicKey) {
    throw new Error("Author's public key must be provided");
  }

  try {
    const response = await client.request(GQL_NEXT_ARGS, variables);
    return response.nextArgs;
  } catch (error) {
    // @TODO: Add logging
    throw error;
  }
}

/**
 * Publish an encoded entry and operation.
 *
 * @param client GraphQLClient instance
 * @param variables.entry Encoded entry
 * @param variables.operation Encoded operation
 * @returns `NextArgs` object
 */
export async function publish(
  client: GraphQLClient,
  variables: PublishVariables,
): Promise<NextArgs> {
  if (!variables) {
    throw new Error('Query variables must be provided');
  }

  if (!variables.entry || !variables.operation) {
    throw new Error('Encoded entry and operation must be provided');
  }

  try {
    const response = await client.request(GQL_PUBLISH, variables);
    return response.publish;
  } catch (error) {
    // @TODO: Add logging
    throw error;
  }
}
