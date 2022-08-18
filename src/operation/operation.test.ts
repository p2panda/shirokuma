// SPDX-License-Identifier: AGPL-3.0-or-later

import { getOperationFields } from './';
import { marshallRequestFields } from '../utils';

describe('operation', () => {
  describe('getOperationFields', () => {
    it('creates a WebAssembly OperationField', async () => {
      const fields = marshallRequestFields({
        channel: 5,
        temperature: 12.921,
        message: 'chin chin',
        serious: false,
      });

      const operationFields = getOperationFields(fields);

      const outputRepresentation =
        'OperationFields(OperationFields({"channel": Integer(5), "message": ' +
        'String("chin chin"), "serious": Boolean(false), "temperature": Float(12.921)}))';
      // @TODO: This does not exist anymore
      // expect(operationFields.toString()).toEqual(outputRepresentation);
    });
  });
});
