// SPDX-License-Identifier: AGPL-3.0-or-later

import { Document } from './document';

import type { DocumentFields } from './types';

export class Collection extends Array {
  #documents: Document[];

  constructor(documents: Document[], values: DocumentFields[]) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    super(...values);

    this.#documents = documents;
  }

  getDocuments(): Document[] {
    return this.#documents;
  }
}
