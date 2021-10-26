import GeoTIFF from '../src/ol/source/GeoTIFF.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';

// scale values in this range to 0 - 1
const min = 10000;
const max = 15000;

const base =
  'https://landsat-pds.s3.amazonaws.com/c1/L8/139/045/LC08_L1TP_139045_20170304_20170316_01_T1/LC08_L1TP_139045_20170304_20170316_01_T1';

const source = new GeoTIFF({
  sources: [
    {
      url: `${base}_B6.TIF`,
      overviews: [`${base}_B6.TIF.ovr`],
      min: min,
      max: max,
      nodata: 0,
    },
    {
      url: `${base}_B5.TIF`,
      overviews: [`${base}_B5.TIF.ovr`],
      min: min,
      max: max,
      nodata: 0,
    },
    {
      url: `${base}_B3.TIF`,
      overviews: [`${base}_B3.TIF.ovr`],
      min: min,
      max: max,
      nodata: 0,
    },
  ],
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      style: {
        saturation: -0.3,
      },
      source: source,
    }),
  ],
  view: source.getView(),
});
