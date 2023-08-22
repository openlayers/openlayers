import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import STAC from '../src/ol/layer/STAC.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import proj4 from 'proj4';
import {register} from '../src/ol/proj/proj4.js';

register(proj4); // required to support source reprojection

const layer = new STAC({
  url: 'https://www.planet.com/data/stac/open-skysat-data/angkor-wat/dsm.json',
  data: {
    'assets': {
      'dsm': {
        'href':
          'https://storage.googleapis.com/open-cogs/planet-stac/angkor-wat/3d-geofox.ai/angkor-wat-dsm.tif',
        'proj:epsg': 32648,
        'proj:shape': [8675, 36244],
        'proj:transform': [
          374283.8729316911, 0.699999988079071, 0, 1498553.1898692613, 0,
          -0.699999988079071,
        ],
        'raster:bands': [
          {
            'data_type': 'float32',
            'statistics': {
              'maximum': 96.446,
              'mean': 26.839,
              'minimum': 2.095,
              'stddev': 10.117,
            },
            'nodata': 'nan',
          },
        ],
        'roles': ['data', 'surface-model'],
        'title': 'Digital Surface Model',
        'type': 'image/tiff; application=geotiff; profile=cloud-optimized',
      },
    },
    'bbox': [103.8381461, 13.3233018, 103.8953104, 13.5529222],
    'collection': 'angkor-wat',
    'geometry': {
      'coordinates': [
        [
          [103.8381461, 13.5526676],
          [103.83925, 13.3233018],
          [103.8953104, 13.323552],
          [103.8942598, 13.5529222],
          [103.8381461, 13.5526676],
        ],
      ],
      'type': 'Polygon',
    },
    'id': 'angkor-wat-3d-dsm',
    'links': [
      {
        'href':
          'https://www.planet.com/data/stac/open-skysat-data/angkor-wat/item.json',
        'rel': 'self',
        'type': 'application/json',
      },
    ],
    'properties': {
      'datetime': null,
      'description':
        'Digital Surface Model (DSM) of Angkor Wat, Cambodia, created from stereo images captured by a [Planet](https://planet.com) SkySat satellite. It is distributed as a single band Cloud-optimized GeoTiff, with each pixel representing the height at that location.',
      'end_datetime': '2020-12-14T03:22:28.5Z',
      'providers': [
        {
          'description':
            'Contact Planet at [planet.com/contact-sales](https://www.planet.com/contact-sales/)',
          'name': 'Planet Labs PBC',
          'roles': ['producer', 'licensor'],
          'url': 'https://www.planet.com',
        },
        {
          'name': 'Geofox.ai',
          'roles': ['processor'],
          'url': 'https://www.geofox.ai',
        },
      ],
      'start_datetime': '2020-12-14T03:21:56.5Z',
      'title': 'Digital Surface Model',
    },
    'stac_extensions': [
      'https://stac-extensions.github.io/projection/v1.1.0/schema.json',
      'https://stac-extensions.github.io/raster/v1.1.0/schema.json',
    ],
    'stac_version': '1.0.0',
    'type': 'Feature',
  },
});

const background = new TileLayer({
  source: new OSM(),
});

const map = new Map({
  target: 'map',
  layers: [background, layer],
});
map.getView().fit(layer.getExtent());
