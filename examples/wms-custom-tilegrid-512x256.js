import Map from 'ol/Map';
import View from 'ol/View';
import {getWidth} from 'ol/extent';
import TileLayer from 'ol/layer/Tile';
import {get as getProjection} from 'ol/proj';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import TileGrid from 'ol/tilegrid/TileGrid';


const projExtent = getProjection('EPSG:3857').getExtent();
const startResolution = getWidth(projExtent) / 256;
const resolutions = new Array(22);
for (let i = 0, ii = resolutions.length; i < ii; ++i) {
  resolutions[i] = startResolution / Math.pow(2, i);
}
const tileGrid = new TileGrid({
  extent: [-13884991, 2870341, -7455066, 6338219],
  resolutions: resolutions,
  tileSize: [512, 256]
});

const layers = [
  new TileLayer({
    source: new OSM()
  }),
  new TileLayer({
    source: new TileWMS({
      url: 'https://ahocevar.com/geoserver/wms',
      params: {'LAYERS': 'topp:states', 'TILED': true},
      serverType: 'geoserver',
      tileGrid: tileGrid
    })
  })
];
const map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [-10997148, 4569099],
    zoom: 4
  })
});
