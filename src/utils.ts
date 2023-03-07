// SPDX-License-Identifier: AGPL-3.0-or-later

import { OperationFields } from 'p2panda-js';

import type { DocumentFields, SchemaFields } from './types';

export function marshallFields(
  fields: DocumentFields,
  schemaFields: SchemaFields,
): OperationFields {
  const result = new OperationFields();

  Object.keys(fields).forEach((fieldName) => {
    const fieldType = schemaFields[fieldName].type;
    const value = fields[fieldName];

    result.insert(fieldName, fieldType, value);
  });

  return result;
}
