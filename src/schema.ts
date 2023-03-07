// SPDX-License-Identifier: AGPL-3.0-or-later

import { gql } from 'graphql-request';

import { Document } from './document';
import { Session } from './session';
import { marshallFields } from './utils';

import type {
  DocumentFields,
  DocumentId,
  DocumentViewId,
  FieldBoolean,
  FieldFloat,
  FieldInteger,
  FieldPinnedRelation,
  FieldPinnedRelationList,
  FieldRelation,
  FieldRelationList,
  FieldString,
  SchemaFields,
  SchemaId,
} from './types';

type FindArgs = {
  documentId?: DocumentId;
  viewId?: DocumentViewId;
};

type DocumentResponse = {
  document: {
    meta: {
      documentId: string;
      viewId: string;
    };
    fields: DocumentResponseFields;
  };
};

type DocumentResponseFields = {
  [name: string]:
    | string
    | number
    | boolean
    | DocumentResponseRelation
    | DocumentResponseRelationList
    | DocumentResponsePinnedRelation
    | DocumentResponsePinnedRelationList;
};

type DocumentResponseRelation = {
  meta: {
    documentId: string;
  };
};

type DocumentResponseRelationList = [
  {
    meta: {
      documentId: string;
    };
  },
];

type DocumentResponsePinnedRelation = {
  meta: {
    viewId: string;
  };
};

type DocumentResponsePinnedRelationList = [
  {
    meta: {
      viewId: string;
    };
  },
];

type CollectionResponse = {
  collections: [
    {
      meta: {
        documentId: string;
        viewId: string;
      };
      fields: DocumentResponseFields;
    },
  ];
};

type Collection = {
  documents: Document[];
  [Symbol.iterator](): {
    next(): {
      value?: DocumentFields;
      done: boolean;
    };
  };
};

export const FieldType = {
  String: (): FieldString => {
    return {
      type: 'str',
    };
  },
  Integer: (): FieldInteger => {
    return {
      type: 'int',
    };
  },
  Float: (): FieldFloat => {
    return {
      type: 'float',
    };
  },
  Boolean: (): FieldBoolean => {
    return {
      type: 'bool',
    };
  },
  Relation: (schemaId: SchemaId): FieldRelation => {
    return {
      type: 'relation',
      schemaId,
    };
  },
  RelationList: (schemaId: SchemaId): FieldRelationList => {
    return {
      type: 'relation_list',
      schemaId,
    };
  },
  PinnedRelation: (schemaId: SchemaId): FieldPinnedRelation => {
    return {
      type: 'pinned_relation',
      schemaId,
    };
  },
  PinnedRelationList: (schemaId: SchemaId): FieldPinnedRelationList => {
    return {
      type: 'pinned_relation_list',
      schemaId,
    };
  },
};

function getQueryFields(schemaFields: SchemaFields): string[] {
  return Object.keys(schemaFields).reduce<string[]>((acc, fieldName) => {
    const fieldType = schemaFields[fieldName].type;

    if (['relation', 'relation_list'].includes(fieldType)) {
      acc.push(`${fieldName}: { meta { documentId } }`);
    } else if (
      ['pinned_relation', 'pinned_relation_list'].includes(fieldType)
    ) {
      acc.push(`${fieldName}: { meta { viewId } }`);
    } else {
      acc.push(fieldName);
    }

    return acc;
  }, []);
}

function getResponseFields(
  fields: DocumentResponseFields,
  schemaFields: SchemaFields,
): DocumentFields {
  return Object.keys(fields).reduce<DocumentFields>((acc, fieldName) => {
    const fieldType = schemaFields[fieldName].type;
    const value = fields[fieldName];

    if (fieldType === 'relation') {
      acc[fieldName] = (value as DocumentResponseRelation).meta.documentId;
    } else if (fieldType === 'relation_list') {
      acc[fieldName] = (value as DocumentResponseRelationList).map(
        (relation) => {
          return relation.meta.documentId;
        },
      );
    } else if (fieldType === 'pinned_relation') {
      acc[fieldName] = (value as DocumentResponsePinnedRelation).meta.viewId;
    } else if (fieldType === 'pinned_relation_list') {
      acc[fieldName] = (value as DocumentResponsePinnedRelationList).map(
        (relation) => {
          return relation.meta.viewId;
        },
      );
    } else {
      acc[fieldName] = value as string | number | boolean;
    }

    return acc;
  }, {});
}

export class Schema {
  #session: Session;

  #schemaFields: SchemaFields;

  readonly schemaId: SchemaId;

  constructor(
    args: { schemaId: SchemaId; schemaFields: SchemaFields },
    session: Session,
  ) {
    const { schemaFields, schemaId } = args;

    this.#session = session;
    this.#schemaFields = schemaFields;

    this.schemaId = schemaId;
  }

  async find(args: FindArgs): Promise<Document> {
    const queryArgs = [];
    if (args.documentId) {
      queryArgs.push(`id: ${args.documentId}`);
    } else {
      queryArgs.push(`viewId: ${args.viewId}`);
    }

    const queryFields = getQueryFields(this.#schemaFields);

    const query = gql`
      {
        document: ${this.schemaId}(${queryArgs.join(', ')}) {
          meta {
            documentId
            viewId
          }
          fields {
            ${queryFields.join('\n')}
          }
        }
      }
    `;

    const response = await this.#session.client.request<DocumentResponse>(
      query,
    );

    const { documentId, viewId } = response.document.meta;
    const fields = getResponseFields(
      response.document.fields,
      this.#schemaFields,
    );

    const document = new Document(
      {
        fields,
        schemaId: this.schemaId,
        schemaFields: this.#schemaFields,
        documentId,
        viewId,
      },
      this.#session,
    );

    return document;
  }

  async findCollection(): Promise<Collection> {
    const queryFields = getQueryFields(this.#schemaFields);

    const query = gql`
      {
        collection: all_${this.schemaId} {
          meta {
            documentId
            viewId
          }
          fields {
            ${queryFields.join('\n')}
          }
        }
      }
    `;

    const response = await this.#session.client.request<CollectionResponse>(
      query,
    );

    const values: DocumentFields[] = [];
    const documents = response.collections.map((item) => {
      const { documentId, viewId } = item.meta;

      const fields = getResponseFields(item.fields, this.#schemaFields);
      values.push(fields);

      return new Document(
        {
          fields,
          schemaId: this.schemaId,
          schemaFields: this.#schemaFields,
          documentId,
          viewId,
        },
        this.#session,
      );
    });

    return {
      documents,

      [Symbol.iterator]() {
        let nextIndex = 0;

        return {
          next() {
            return nextIndex < values.length
              ? {
                  value: values[nextIndex++],
                  done: false,
                }
              : {
                  done: true,
                };
          },
        };
      },
    };
  }

  async create(fields: DocumentFields): Promise<Document> {
    const { schemaId } = this;

    const operationFields = marshallFields(fields, this.#schemaFields);

    const documentId = await this.#session.create(operationFields, {
      schemaId,
    });

    const document = new Document(
      {
        fields,
        schemaId,
        schemaFields: this.#schemaFields,
        documentId: documentId as DocumentId,
        viewId: documentId,
      },
      this.#session,
    );

    return document;
  }
}
