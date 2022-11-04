import GeoTIFF from '../src/ol/source/GeoTIFF.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';

const base1 = 'data/geotiff/nldeel_2011.tif';
const base2 = 'data/geotiff/claimregions.tif';

const source = new GeoTIFF({
  sources: [
    {
      url: `${base1}`,
      overviews: [`${base1}.ovr`],
      nodata: 0,
    },
    {
      url: `${base2}`,
      overviews: [`${base2}.ovr`],
      nodata: 0,
    },
  ],
});

const band1 = ['*', ['band', 1], 255 / 7];
const band2 = ['*', ['band', 2], 255 / 7];

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      style: {
        // Use red and blue channels to display national regions,
        // and green channel to show research sub-regionals.
        color: [
          'array',
          ['-', 1, band1],
          ['-', ['ceil', band2], band2],
          band1,
          ['band', 3],
        ],
      },
      source: source,
    }),
  ],
  view: source.getView(),
});
