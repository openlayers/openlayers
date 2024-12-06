import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import externalGlobals from 'rollup-plugin-external-globals';

export default {
  input: 'build/ol/dist/ol.js',
  output: {
    name: 'ol',
    format: 'iife',
    exports: 'default',
    file: 'build/full/ol.js',
    sourcemap: true,
  },
  plugins: [
    resolve({moduleDirectories: ['build', 'node_modules']}),
    commonjs(),
    externalGlobals({
      geotiff: 'GeoTIFF',
      'ol-mapbox-style': 'olms',
    }),
    terser(),
  ],
};
