// SPDX-License-Identifier: AGPL-3.0-or-later

import { Document } from './document';
import { Session } from './session';

import type { DocumentId, DocumentViewId, Fields, SchemaId } from './types';

type FindArgs = {
  documentId?: DocumentId;
  viewId?: DocumentViewId;
  fields?: string[];
  // @TODO
  // orderBy?: { [field: string]: 'asc' | 'desc' };
  // where?: { [field: string]: EasyValues };
};

export class Schema {
  readonly schemaId: SchemaId;

  readonly session: Session;

  constructor(schemaId: SchemaId, session: Session) {
    this.schemaId = schemaId;
    this.session = session;
  }

  /* async find(args: FindArgs): Promise<Document> {
    const document = new Document(this.schemaId, this.session);

    return document;
  } */

  // async findCollection(): Promise<Collection> {}

  async create(fields: Fields): Promise<Document> {
    const { schemaId } = this;

    const documentId = (await this.session.create(fields, {
      schemaId,
    })) as DocumentId;

    const document = new Document(
      {
        fields,
        schemaId,
        documentId,
        viewId: documentId,
      },
      this.session,
    );

    return document;
  }
}
