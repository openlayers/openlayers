import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'build/index.js',
  output: {
    name: 'ol',
    format: 'umd',
    exports: 'default',
    file: 'build/full/ol.cjs',
    globals: {
      geotiff: 'geotiff',
    },
  },
  plugins: [
    resolve({moduleDirectories: ['build', 'node_modules']}),
    commonjs(),
    esbuild({minify: true}),
  ],
  external: ['geotiff'],
};
