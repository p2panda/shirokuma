// SPDX-License-Identifier: AGPL-3.0-or-later

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
  fields?: string[];
  // @TODO
  // orderBy?: { [field: string]: 'asc' | 'desc' };
  // where?: { [field: string]: EasyValues };
};

export const FieldType = {
  STRING: (): FieldString => {
    return {
      type: 'str',
    };
  },
  INTEGER: (): FieldInteger => {
    return {
      type: 'int',
    };
  },
  FLOAT: (): FieldFloat => {
    return {
      type: 'float',
    };
  },
  BOOLEAN: (): FieldBoolean => {
    return {
      type: 'bool',
    };
  },
  RELATION: (value: DocumentId): FieldRelation => {
    return {
      type: 'relation',
      value,
    };
  },
  RELATION_LIST: (value: DocumentId[]): FieldRelationList => {
    return {
      type: 'relation_list',
      value,
    };
  },
  PINNED_RELATION: (value: DocumentViewId): FieldPinnedRelation => {
    return {
      type: 'pinned_relation',
      value: typeof value === 'string' ? value.split('_') : value,
    };
  },
  PINNED_RELATION_LIST: (value: DocumentViewId[]): FieldPinnedRelationList => {
    return {
      type: 'pinned_relation_list',
      value: value.map((item) => {
        return typeof item === 'string' ? item.split('_') : item;
      }),
    };
  },
};

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

  /* async find(args: FindArgs): Promise<Document> {
    const document = new Document(this.schemaId, this.session);

    return document;
  } */

  // async findCollection(): Promise<Collection> {}

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
