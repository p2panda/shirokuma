// SPDX-License-Identifier: AGPL-3.0-or-later

import fs from 'fs';
import path from 'path';

import pluginAlias from '@rollup/plugin-alias';
import pluginCommonJS from '@rollup/plugin-commonjs';
import pluginDts from 'rollup-plugin-dts';
import pluginTerser from '@rollup/plugin-terser';
import pluginTypeScript from '@rollup/plugin-typescript';
import { nodeResolve as pluginNodeResolve } from '@rollup/plugin-node-resolve';

import type {
  RollupOptions,
  Plugin,
  ModuleFormat,
  OutputOptions,
} from 'rollup';

type BuildMode = 'inline' | 'slim' | 'bundle';

type BuildName = string;

type Config = {
  format: ModuleFormat;
  mode: BuildMode;
};

const SRC_DIR = 'src';
const DIST_DIR = 'lib';
const BUILD_FILE_NAME = 'index';
const USE_SOURCEMAP = true;

// Helper to load `package.json` file
const pkg = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), {
    encoding: 'utf8',
  }),
);

// Plugin to copy `p2panda.wasm` file from `p2panda-js` into export.
function pluginCopyWasm(): Plugin {
  return {
    name: 'copy-wasm',
    resolveImportMeta: () => `""`,
    generateBundle() {
      fs.mkdirSync(DIST_DIR, { recursive: true });
      fs.copyFileSync(
        path.resolve('./node_modules/p2panda-js/lib/p2panda.wasm'),
        path.resolve(`${DIST_DIR}/p2panda.wasm`),
      );
    },
  };
}

// Returns the name of the sub-directory which will be created in the target
// folder for each build.
function getBuildName({ format, mode }: Config): BuildName {
  if (mode === 'bundle') {
    return `${format}-bundle`;
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

  // Provide a minified version for all builds
  result.push({
    name: pkg.name,
    file: `${DIST_DIR}/${dirName}/${BUILD_FILE_NAME}.min.js`,
    format,
    sourcemap,
    // @ts-expect-error: TypeScript misinterprets the module configuration
    plugins: [pluginTerser()],
  });

  return result;
}

function getPlugins({ mode }: Config): Plugin[] {
  const result: Plugin[] = [];

  // Convert external CommonJS- to ES6 modules
  result.push(
    // @ts-expect-error: TypeScript misinterprets the module configuration
    pluginCommonJS({
      extensions: ['.js', '.ts'],
    }),
  );

  // In umd builds we're bundling the dependencies as well, we need this plugin
  // here to help locating external dependencies
  if (mode === 'bundle') {
    result.push(
      pluginNodeResolve({
        // Use the "browser" module resolutions in the dependencies' package.json
        browser: true,
      }),
    );
  }

  // graphql-web-lite provides an alias package that can be swapped in for
  // the standard graphql package in client-side applications. It aims to
  // reduce the size of imports that are in common use by GraphQL clients
  // and users, while still providing most graphql exports that are used
  // in other contexts.
  const entries = [{ find: 'graphql', replacement: 'graphql-web-lite' }];

  // Whenever we want to build a "slim" version of shirokuma we have to import
  // the "slim" version of p2panda-js.
  //
  // The "slim" version does not contain the WebAssembly inlined (as a base64
  // string) and is therefore smaller.
  if (mode === 'slim') {
    entries.push({ find: 'p2panda-js', replacement: 'p2panda-js/slim' });
  }

  result.push(
    // @ts-expect-error: TypeScript misinterprets the module configuration
    pluginAlias({
      entries,
    }),
  );

  // Compile TypeScript source code to JavaScript
  // @ts-expect-error: TypeScript misinterprets the module configuration
  result.push(pluginTypeScript());

  // We only need to copy this once
  result.push(pluginCopyWasm());

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

  // We build modules in two versions: 1. with no 3rd party dependencies included
  // and 2. bundled inside of them.
  //
  // Bundling them is somewhat a shame, but we hope that this will account for
  // the "quick" uses of shirokuma.
  const external = mode === 'bundle' ? [] : Object.keys(pkg.dependencies);

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
    format: 'cjs',
    mode: 'inline',
  }),
  ...config({
    format: 'cjs',
    mode: 'slim',
  }),
  ...config({
    format: 'cjs',
    mode: 'bundle',
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
    format: 'esm',
    mode: 'bundle',
  }),
];
