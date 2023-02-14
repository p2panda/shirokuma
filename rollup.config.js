// SPDX-License-Identifier: AGPL-3.0-or-later

import pluginCommonJS from '@rollup/plugin-commonjs';
import pluginDts from 'rollup-plugin-dts';
import pluginJSON from '@rollup/plugin-json';
import pluginTerser from '@rollup/plugin-terser';
import pluginTypeScript from '@rollup/plugin-typescript';
import { babel as pluginBabel } from '@rollup/plugin-babel';
import { nodeResolve as pluginNodeResolve } from '@rollup/plugin-node-resolve';

const SRC_DIR = 'src';
const DIST_DIR = 'lib';

const name = 'shirokuma';
const input = `./${SRC_DIR}/index.ts`;
const sourcemap = true;

function config(format) {
  // Determine suffix of output files. For CommonJS builds we choose `.cjs`.
  const ext = format === 'cjs' ? 'cjs' : 'js';

  return [
    {
      input,
      output: [
        {
          name,
          file: `${DIST_DIR}/${format}/index.${ext}`,
          format,
          sourcemap,
        },
        {
          name,
          file: `${DIST_DIR}/${format}/index.min.js`,
          format,
          sourcemap,
          plugins: [pluginTerser()],
        },
      ],
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
