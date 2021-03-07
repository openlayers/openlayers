import Map from '../src/ol/Map.js';
import Projection from '../src/ol/proj/Projection.js';
import TileLayer from '../src/ol/layer/Tile.js';
import TileWMS from '../src/ol/source/TileWMS.js';
import View from '../src/ol/View.js';
import {ScaleLine, defaults as defaultControls} from '../src/ol/control.js';
import {
  addCoordinateTransforms,
  addProjection,
  transform,
} from '../src/ol/proj.js';

// By default OpenLayers does not know about the EPSG:21781 (Swiss) projection.
// So we create a projection instance for EPSG:21781 and pass it to
// ol/proj~addProjection to make it available to the library for lookup by its
// code.

const projection = new Projection({
  code: 'EPSG:21781',
  // The extent is used to determine zoom level 0. Recommended values for a
  // projection's validity extent can be found at https://epsg.io/.
  extent: [485869.5728, 76443.1884, 837076.5648, 299941.7864],
  units: 'm',
});
addProjection(projection);

// We also declare EPSG:21781/EPSG:4326 transform functions. These functions
// are necessary for the ScaleLine control and when calling ol/proj~transform
// for setting the view's initial center (see below).

addCoordinateTransforms(
  'EPSG:4326',
  projection,
  function (coordinate) {
    return [
      WGStoCHy(coordinate[1], coordinate[0]),
      WGStoCHx(coordinate[1], coordinate[0]),
    ];
  },
  function (coordinate) {
    return [
      CHtoWGSlng(coordinate[0], coordinate[1]),
      CHtoWGSlat(coordinate[0], coordinate[1]),
    ];
  }
);

const extent = [420000, 30000, 900000, 350000];
const layers = [
  new TileLayer({
    extent: extent,
    source: new TileWMS({
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
  new TileLayer({
    extent: extent,
    source: new TileWMS({
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
  controls: defaultControls().extend([
    new ScaleLine({
      units: 'metric',
    }),
  ]),
  layers: layers,
  target: 'map',
  view: new View({
    projection: projection,
    center: transform([8.23, 46.86], 'EPSG:4326', 'EPSG:21781'),
    extent: extent,
    zoom: 2,
  }),
});

/*
 * Swiss projection transform functions downloaded from
 * https://www.swisstopo.admin.ch/en/knowledge-facts/surveying-geodesy/reference-systems/map-projections.html
 */

// Convert WGS lat/long (° dec) to CH y
function WGStoCHy(lat, lng) {
  // Converts degrees dec to sex
  lat = DECtoSEX(lat);
  lng = DECtoSEX(lng);

  // Converts degrees to seconds (sex)
  lat = DEGtoSEC(lat);
  lng = DEGtoSEC(lng);

  // Axillary values (% Bern)
  const lat_aux = (lat - 169028.66) / 10000;
  const lng_aux = (lng - 26782.5) / 10000;

  // Process Y
  const y =
    600072.37 +
    211455.93 * lng_aux -
    10938.51 * lng_aux * lat_aux -
    0.36 * lng_aux * Math.pow(lat_aux, 2) -
    44.54 * Math.pow(lng_aux, 3);

  return y;
}

// Convert WGS lat/long (° dec) to CH x
function WGStoCHx(lat, lng) {
  // Converts degrees dec to sex
  lat = DECtoSEX(lat);
  lng = DECtoSEX(lng);

  // Converts degrees to seconds (sex)
  lat = DEGtoSEC(lat);
  lng = DEGtoSEC(lng);

  // Axillary values (% Bern)
  const lat_aux = (lat - 169028.66) / 10000;
  const lng_aux = (lng - 26782.5) / 10000;

  // Process X
  const x =
    200147.07 +
    308807.95 * lat_aux +
    3745.25 * Math.pow(lng_aux, 2) +
    76.63 * Math.pow(lat_aux, 2) -
    194.56 * Math.pow(lng_aux, 2) * lat_aux +
    119.79 * Math.pow(lat_aux, 3);

  return x;
}

// Convert CH y/x to WGS lat
function CHtoWGSlat(y, x) {
  // Converts military to civil and to unit = 1000km
  // Axillary values (% Bern)
  const y_aux = (y - 600000) / 1000000;
  const x_aux = (x - 200000) / 1000000;

  // Process lat
  let lat =
    16.9023892 +
    3.238272 * x_aux -
    0.270978 * Math.pow(y_aux, 2) -
    0.002528 * Math.pow(x_aux, 2) -
    0.0447 * Math.pow(y_aux, 2) * x_aux -
    0.014 * Math.pow(x_aux, 3);

  // Unit 10000" to 1 " and converts seconds to degrees (dec)
  lat = (lat * 100) / 36;

  return lat;
}

// Convert CH y/x to WGS long
function CHtoWGSlng(y, x) {
  // Converts military to civil and to unit = 1000km
  // Axillary values (% Bern)
  const y_aux = (y - 600000) / 1000000;
  const x_aux = (x - 200000) / 1000000;

  // Process long
  let lng =
    2.6779094 +
    4.728982 * y_aux +
    0.791484 * y_aux * x_aux +
    0.1306 * y_aux * Math.pow(x_aux, 2) -
    0.0436 * Math.pow(y_aux, 3);

  // Unit 10000" to 1 " and converts seconds to degrees (dec)
  lng = (lng * 100) / 36;

  return lng;
}

// Convert DEC angle to SEX DMS
function DECtoSEX(angle) {
  // Extract DMS
  const deg = parseInt(angle, 10);
  const min = parseInt((angle - deg) * 60, 10);
  const sec = ((angle - deg) * 60 - min) * 60;

  // Result in degrees sex (dd.mmss)
  return deg + min / 100 + sec / 10000;
}

// Convert Degrees angle to seconds
function DEGtoSEC(angle) {
  // Extract DMS
  const deg = parseInt(angle, 10);
  let min = parseInt((angle - deg) * 100, 10);
  let sec = ((angle - deg) * 100 - min) * 100;

  // Avoid rounding problems with seconds=0
  const parts = String(angle).split('.');
  if (parts.length == 2 && parts[1].length == 2) {
    min = Number(parts[1]);
    sec = 0;
  }

  // Result in degrees sex (dd.mmss)
  return sec + min * 60 + deg * 3600;
}
