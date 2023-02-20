// SPDX-License-Identifier: AGPL-3.0-or-later

/* eslint-disable @typescript-eslint/ban-ts-comment */

import { Session } from '../src';

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
