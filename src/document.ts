// SPDX-License-Identifier: AGPL-3.0-or-later

import { Session } from './session';
import { marshallFields } from './utils';

import type {
  DocumentFields,
  DocumentId,
  DocumentValue,
  DocumentViewId,
  SchemaFields,
  SchemaId,
} from './types';

export class Document {
  #session: Session;

  #fields: DocumentFields;

  #schemaFields: SchemaFields;

  readonly schemaId: SchemaId;

  readonly documentId: DocumentId;

  viewId: DocumentViewId;

  constructor(
    args: {
      fields: DocumentFields;
      schemaId: SchemaId;
      schemaFields: SchemaFields;
      documentId: DocumentId;
      viewId: DocumentViewId;
    },
    session: Session,
  ) {
    const { fields, schemaId, schemaFields, documentId, viewId } = args;

    this.#session = session;

    this.#fields = fields;
    this.#schemaFields = schemaFields;

    this.schemaId = schemaId;
    this.documentId = documentId;
    this.viewId = viewId;
  }

  get(name: string): DocumentValue {
    if (!(name in this.#fields)) {
      throw new Error(`'${name}' field not given in document`);
    }

    return this.#fields[name];
  }

  async update(fields: DocumentFields): Promise<DocumentViewId> {
    const operationFields = marshallFields(fields, this.#schemaFields);

    const viewId = await this.#session.update(operationFields, this.viewId, {
      schemaId: this.schemaId,
      documentId: this.documentId,
    });

    Object.keys(fields).forEach((fieldName) => {
      this.#fields[fieldName] = fields[fieldName];
    });

    this.viewId = viewId;

    return viewId;
  }

  async delete(): Promise<DocumentViewId> {
    const viewId = await this.#session.delete(this.viewId, {
      schemaId: this.schemaId,
      documentId: this.documentId,
    });

    this.viewId = viewId;
    return viewId;
  }
}
