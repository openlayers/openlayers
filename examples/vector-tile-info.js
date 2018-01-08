import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import _ol_layer_VectorTile_ from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';

var map = new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  }),
  layers: [new _ol_layer_VectorTile_({
    source: new VectorTileSource({
      format: new MVT(),
      url: 'https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer/tile/{z}/{y}/{x}.pbf'
    })
  })]
});

map.on('pointermove', showInfo);

var info = document.getElementById('info');
function showInfo(event) {
  var features = map.getFeaturesAtPixel(event.pixel);
  if (!features) {
    info.innerText = '';
    info.style.opacity = 0;
    return;
  }
  var properties = features[0].getProperties();
  info.innerText = JSON.stringify(properties, null, 2);
  info.style.opacity = 1;
}
