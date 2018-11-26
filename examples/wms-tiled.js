import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';


const layers = [
  new TileLayer({
    source: new OSM()
  }),
  new TileLayer({
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: new TileWMS({
      url: 'https://ahocevar.com/geoserver/wms',
      params: {'LAYERS': 'topp:states', 'TILED': true},
      serverType: 'geoserver',
      // Countries have transparency, so do not fade tiles:
      transition: 0
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
