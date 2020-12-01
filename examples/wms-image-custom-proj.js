import ImageLayer from '../src/ol/layer/Image.js';
import ImageWMS from '../src/ol/source/ImageWMS.js';
import Map from '../src/ol/Map.js';
import Projection from '../src/ol/proj/Projection.js';
import View from '../src/ol/View.js';
import proj4 from 'proj4';
import {ScaleLine, defaults as defaultControls} from '../src/ol/control.js';
import {fromLonLat} from '../src/ol/proj.js';
import {register} from '../src/ol/proj/proj4.js';

// Transparent Proj4js support:
//
// EPSG:21781 is known to Proj4js because its definition is registered by
// calling proj4.defs(). Now when we create an ol/proj/Projection instance with
// the 'EPSG:21781' code, OpenLayers will pick up the transform functions from
// Proj4js. To get the registered ol/proj/Projection instance with other
// parameters like units and axis orientation applied from Proj4js, use
// `ol/proj#get('EPSG:21781')`.
//
// Note that we are setting the projection's extent here, which is used to
// determine the view resolution for zoom level 0. Recommended values for a
// projection's validity extent can be found at https://epsg.io/.

proj4.defs(
  'EPSG:21781',
  '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 ' +
    '+x_0=600000 +y_0=200000 +ellps=bessel ' +
    '+towgs84=660.077,13.551,369.344,2.484,1.783,2.939,5.66 +units=m +no_defs'
);
register(proj4);

const projection = new Projection({
  code: 'EPSG:21781',
  extent: [485869.5728, 76443.1884, 837076.5648, 299941.7864],
});

const extent = [420000, 30000, 900000, 350000];
const layers = [
  new ImageLayer({
    extent: extent,
    source: new ImageWMS({
      url: 'https://wms.geo.admin.ch/',
      crossOrigin: 'anonymous',
      attributions:
        '© <a href="https://shop.swisstopo.admin.ch/en/products/maps/national/lk1000"' +
        'target="_blank">Pixelmap 1:1000000 / geo.admin.ch</a>',
      params: {
        'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
        'FORMAT': 'image/jpeg',
      },
      serverType: 'mapserver',
    }),
  }),
  new ImageLayer({
    extent: extent,
    source: new ImageWMS({
      url: 'https://wms.geo.admin.ch/',
      crossOrigin: 'anonymous',
      attributions:
        '© <a href="https://www.hydrodaten.admin.ch/en/notes-on-the-flood-alert-maps.html"' +
        'target="_blank">Flood Alert / geo.admin.ch</a>',
      params: {'LAYERS': 'ch.bafu.hydroweb-warnkarte_national'},
      serverType: 'mapserver',
    }),
  }),
];

const map = new Map({
  controls: defaultControls().extend([new ScaleLine()]),
  layers: layers,
  target: 'map',
  view: new View({
    projection: projection,
    center: fromLonLat([8.23, 46.86], projection),
    extent: extent,
    zoom: 2,
  }),
});
