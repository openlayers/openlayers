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
    source: new TileWMS({
      url: 'https://ahocevar.com/geoserver/ne/wms',
      params: {'LAYERS': 'ne:ne_10m_admin_0_countries', 'TILED': true},
      serverType: 'geoserver'
    })
  })
];
const map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1
  })
});
