import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'build/index.js',
  output: {
    name: 'ol',
    format: 'iife',
    exports: 'default',
    file: 'build/full/ol.js',
    sourcemap: true,
    globals: {
      geotiff: 'GeoTIFF',
      'ol-mapbox-style': 'olms',
    },
  },
  plugins: [
    resolve({moduleDirectories: ['build', 'node_modules']}),
    commonjs(),
    terser(),
  ],
};
