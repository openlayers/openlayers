import cjs from 'rollup-plugin-commonjs';
import node from 'rollup-plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';

const {BUILD} = process.env;
const production = BUILD === 'production';

const config = [{
  input: ['src/ol/worker/worker.js'],
  output: {
    file: 'build/worker/hash.rollup.worker.js',
    format: 'iife',
  },
  experimentalCodeSplitting: true,
  treeshake: true,
  plugins: [
    node(),
    cjs(),
    terser()
  ]
}];

export default config
