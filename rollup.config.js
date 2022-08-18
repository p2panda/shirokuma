import pluginCommonJS from '@rollup/plugin-commonjs';
import pluginDts from 'rollup-plugin-dts';
import pluginJSON from '@rollup/plugin-json';
import pluginTypeScript from '@rollup/plugin-typescript';
import { babel as pluginBabel } from '@rollup/plugin-babel';
import { nodeResolve as pluginNodeResolve } from '@rollup/plugin-node-resolve';

import { name } from './package.json';

const SRC_DIR = 'src';
const DIST_DIR = 'lib';

const input = `./${SRC_DIR}/index.ts`;

function config(format) {
  return [
    {
      input,
      output: {
        name,
        file: `${DIST_DIR}/${format}/index.js`,
        format,
      },
      plugins: [
        pluginTypeScript(),
        pluginNodeResolve({
          browser: true,
        }),
        pluginCommonJS({
          extensions: ['.js', '.ts'],
        }),
        pluginJSON(),
        pluginBabel({
          babelHelpers: 'bundled',
          compact: false,
        }),
      ],
    },
    {
      input,
      output: {
        file: `${DIST_DIR}/${format}/index.d.ts`,
        format,
      },
      plugins: [pluginDts()],
    },
  ];
}

export default [...config('esm'), ...config('cjs'), ...config('umd')];
