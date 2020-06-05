import resolve from '@rollup/plugin-node-resolve';
import compiler from '@ampproject/rollup-plugin-closure-compiler';


export default {
  input: 'ts-compiled/index.js',
  output: {
    compact: false,
    file: 'dist/hartree.min.js',
    format: 'umd',
    name: 'hartree'
  },
  plugins: [
    compiler({
      compilation_level: 'ADVANCED',
      externs: [
        './externs/extern.js',
        './externs/d3-select.js',
        './externs/svg.js',
      ],
      assume_function_wrapper: true,
      use_types_for_optimization: true,
      generate_exports: true,
      language_out: 'ECMASCRIPT5',
      js: './node_modules/google-closure-library',
    }),
    resolve(),
  ],
};