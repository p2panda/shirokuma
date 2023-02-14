// SPDX-License-Identifier: AGPL-3.0-or-later

import pluginAlias from '@rollup/plugin-alias';
import pluginCommonJS from '@rollup/plugin-commonjs';
import pluginDts from 'rollup-plugin-dts';
import pluginJson from '@rollup/plugin-json';
import pluginTerser from '@rollup/plugin-terser';
import pluginTypeScript from '@rollup/plugin-typescript';
import { nodeResolve as pluginNodeResolve } from '@rollup/plugin-node-resolve';

import pkg from './package.json' assert { type: 'json' };

import type {
  RollupOptions,
  Plugin,
  ModuleFormat,
  OutputOptions,
} from 'rollup';

type BuildMode = 'inline' | 'slim' | 'node';

type BuildName = string;

type Config = {
  format: ModuleFormat;
  mode: BuildMode;
};

const SRC_DIR = 'src';
const DIST_DIR = 'lib';
const BUILD_FILE_NAME = 'index';
const USE_SOURCEMAP = true;

// Returns the name of the sub-directory which will be created in the target
// folder for each build.
function getBuildName({ format, mode }: Config): BuildName {
  if (mode === 'node') {
    return 'node';
  } else if (mode === 'inline') {
    return format;
  } else {
    return `${format}-slim`;
  }
}

// Returns the output file options for each build.
function getOutputs({ format, mode }: Config): OutputOptions[] {
  const result: OutputOptions[] = [];

  const dirName = getBuildName({ format, mode });
  const sourcemap = USE_SOURCEMAP;

  // Determine suffix of output files. For CommonJS builds we choose `.cjs`.
  const ext = format === 'cjs' ? 'cjs' : 'js';

  result.push({
    name: pkg.name,
    file: `${DIST_DIR}/${dirName}/${BUILD_FILE_NAME}.${ext}`,
    format,
    sourcemap,
  });

  // Provide a minified version for non-NodeJS builds
  if (mode !== 'node') {
    result.push({
      name: pkg.name,
      file: `${DIST_DIR}/${dirName}/${BUILD_FILE_NAME}.min.js`,
      format,
      sourcemap,
      plugins: [pluginTerser()],
    });
  }

  return result;
}

function getPlugins({ mode }: Config): Plugin[] {
  const result: Plugin[] = [];

  // @TODO: Add comment
  if (mode === 'node') {
    result.push(pluginJson());
  }

  // @TODO: Add comment
  if (mode !== 'node') {
    result.push(
      pluginNodeResolve({
        // Use the "browser" module resolutions in the dependencies' package.json
        browser: true,
      }),
    );
  }

  // @TODO: Add comment
  if (mode === 'slim') {
    result.push(
      pluginAlias({
        entries: [{ find: 'p2panda-js', replacement: 'p2panda-js/slim' }],
      }),
    );
  }

  // Compile TypeScript source code to JavaScript
  result.push(pluginTypeScript());

  // Convert CommonJS modules to ES6
  result.push(
    pluginCommonJS({
      extensions: ['.js', '.ts'],
    }),
  );

  return result;
}

function config({ format, mode }: Config): RollupOptions[] {
  const result: RollupOptions[] = [];

  // Determine entry point in `src`
  const input = `./${SRC_DIR}/index.ts`;

  // Determine where files of this build get written to
  const output = getOutputs({ format, mode });

  // Determine plugins which will be used to process this build
  const plugins = getPlugins({ format, mode });

  // Treat npm dependencies as external, except for UMD builds
  const external = format === 'umd' ? [] : Object.keys(pkg.dependencies);

  // Package build
  result.push({
    input,
    output,
    plugins,
    external,
  });

  // Generate TypeScript definition file for each build
  const dirName = getBuildName({ format, mode });
  result.push({
    input,
    output: {
      file: `${DIST_DIR}/${dirName}/${BUILD_FILE_NAME}.d.ts`,
      format,
    },
    plugins: [pluginDts()],
  });

  return result;
}

export default [
  ...config({
    format: 'umd',
    mode: 'inline',
  }),
  ...config({
    format: 'cjs',
    mode: 'inline',
  }),
  ...config({
    format: 'cjs',
    mode: 'slim',
  }),
  ...config({
    format: 'esm',
    mode: 'inline',
  }),
  ...config({
    format: 'esm',
    mode: 'slim',
  }),
  ...config({
    format: 'cjs',
    mode: 'node',
  }),
];
