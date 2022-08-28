import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'build/index.js',
  output: {
    name: 'ol',
    format: 'umd',
    exports: 'default',
    file: 'build/full/ol.js',
    globals: {
      geotiff: 'geotiff',
    },
  },
  plugins: [
    resolve({moduleDirectories: ['build', 'node_modules']}),
    commonjs(),
  ],
  external: ['geotiff'],
};
