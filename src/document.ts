// SPDX-License-Identifier: AGPL-3.0-or-later

import { Session } from './session';

import type { SchemaId, DocumentId, DocumentViewId, Fields } from './types';

export class Document {
  readonly schemaId: SchemaId;

  readonly documentId: DocumentId;

  viewId: DocumentViewId;

  readonly session: Session;

  fields: Fields;

  constructor(
    args: {
      fields: Fields;
      schemaId: SchemaId;
      documentId: DocumentId;
      viewId: DocumentViewId;
    },
    session: Session,
  ) {
    const { fields, schemaId, documentId, viewId } = args;

    this.schemaId = schemaId;
    this.fields = fields;
    this.documentId = documentId;
    this.viewId = viewId;

    this.session = session;
  }

  async update(fields: Fields): Promise<DocumentViewId> {
    const viewId = await this.session.update(fields, this.viewId, {
      schemaId: this.schemaId,
      documentId: this.documentId,
    });

    this.viewId = viewId;
    return viewId;
  }

  async delete(): Promise<DocumentViewId> {
    const viewId = await this.session.delete(this.viewId, {
      schemaId: this.schemaId,
      documentId: this.documentId,
    });

    this.viewId = viewId;
    return viewId;
  }
}
