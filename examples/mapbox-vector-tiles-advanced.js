import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import {get as getProjection} from '../src/ol/proj.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import {Fill, Icon, Stroke, Style, Text} from '../src/ol/style.js';
import TileGrid from '../src/ol/tilegrid/TileGrid.js';


const key = 'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2pzbmg0Nmk5MGF5NzQzbzRnbDNoeHJrbiJ9.7_-_gL8ur7ZtEiNwRfCy7Q';

// Calculation of resolutions that match zoom levels 1, 3, 5, 7, 9, 11, 13, 15.
const resolutions = [];
for (let i = 0; i <= 8; ++i) {
  resolutions.push(156543.03392804097 / Math.pow(2, i * 2));
}
// Calculation of tile urls for zoom levels 1, 3, 5, 7, 9, 11, 13, 15.
function tileUrlFunction(tileCoord) {
  return ('https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
      '{z}/{x}/{y}.vector.pbf?access_token=' + key)
    .replace('{z}', String(tileCoord[0] * 2 - 1))
    .replace('{x}', String(tileCoord[1]))
    .replace('{y}', String(tileCoord[2]))
    .replace('{a-d}', 'abcd'.substr(
      ((tileCoord[1] << tileCoord[0]) + tileCoord[2]) % 4, 1));
}

const map = new Map({
  layers: [
    new VectorTileLayer({
      source: new VectorTileSource({
        attributions: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
          '© <a href="https://www.openstreetmap.org/copyright">' +
          'OpenStreetMap contributors</a>',
        format: new MVT(),
        tileGrid: new TileGrid({
          extent: getProjection('EPSG:3857').getExtent(),
          resolutions: resolutions,
          tileSize: 512
        }),
        tileUrlFunction: tileUrlFunction
      }),
      style: createMapboxStreetsV6Style(Style, Fill, Stroke, Icon, Text)
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    minZoom: 1,
    zoom: 2
  })
});
