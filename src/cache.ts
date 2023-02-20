// SPDX-License-Identifier: AGPL-3.0-or-later

export class Cache<T> {
  private storage: { [key: string]: T };

  constructor() {
    this.storage = {};
  }

  insert(key: string, value: T) {
    this.storage[key] = value;
  }

  get(key: string): T | null {
    if (key in this.storage) {
      return this.storage[key];
    }

    return null;
  }

  remove(key: string) {
    delete this.storage[key];
  }
}
