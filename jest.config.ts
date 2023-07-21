import type { Config } from '@jest/types';

export default {
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
} as Config.InitialOptions;
