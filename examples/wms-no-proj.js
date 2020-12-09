import ImageWMS from '../src/ol/source/ImageWMS.js';
import Map from '../src/ol/Map.js';
import Projection from '../src/ol/proj/Projection.js';
import TileWMS from '../src/ol/source/TileWMS.js';
import View from '../src/ol/View.js';
import {Image as ImageLayer, Tile as TileLayer} from '../src/ol/layer.js';
import {ScaleLine, defaults as defaultControls} from '../src/ol/control.js';

const layers = [
  new TileLayer({
    source: new TileWMS({
      attributions:
        '© <a href="https://shop.swisstopo.admin.ch/en/products/maps/national/lk1000"' +
        'target="_blank">Pixelmap 1:1000000 / geo.admin.ch</a>',
      crossOrigin: 'anonymous',
      params: {
        'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
        'FORMAT': 'image/jpeg',
      },
      url: 'https://wms.geo.admin.ch/',
    }),
  }),
  new ImageLayer({
    source: new ImageWMS({
      attributions:
        '© <a href="https://www.hydrodaten.admin.ch/en/notes-on-the-flood-alert-maps.html"' +
        'target="_blank">Flood Alert / geo.admin.ch</a>',
      crossOrigin: 'anonymous',
      params: {'LAYERS': 'ch.bafu.hydroweb-warnkarte_national'},
      serverType: 'mapserver',
      url: 'https://wms.geo.admin.ch/',
    }),
  }),
];

// A minimal projection object is configured with only the SRS code and the map
// units. No client-side coordinate transforms are possible with such a
// projection object. Requesting tiles only needs the code together with a
// tile grid of Cartesian coordinates; it does not matter how those
// coordinates relate to latitude or longitude.
//
// With no transforms available projection units must be assumed to represent
// true distances. In the case of local projections this may be a sufficiently
// close approximation for a meaningful (if not 100% accurate) ScaleLine control.

const projection = new Projection({
  code: 'EPSG:21781',
  units: 'm',
});

const map = new Map({
  controls: defaultControls().extend([new ScaleLine()]),
  layers: layers,
  target: 'map',
  view: new View({
    center: [660000, 190000],
    projection: projection,
    zoom: 9,
  }),
});
