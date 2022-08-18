import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const SRC_DIR = 'src';
const DIST_DIR = 'lib';

const input = `./${SRC_DIR}/index.ts`;
const format = 'es';

export default [
  {
    input,
    output: {
      file: `${DIST_DIR}/index.js`,
      format,
      sourcemap: true,
    },
    plugins: [typescript()],
  },
  {
    input,
    output: {
      file: `${DIST_DIR}/index.d.ts`,
      format,
    },
    plugins: [dts()],
  },
];
