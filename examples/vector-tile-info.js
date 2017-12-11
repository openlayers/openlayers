import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_format_MVT_ from '../src/ol/format/MVT.js';
import _ol_layer_VectorTile_ from '../src/ol/layer/VectorTile.js';
import _ol_source_VectorTile_ from '../src/ol/source/VectorTile.js';

var map = new _ol_Map_({
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  }),
  layers: [new _ol_layer_VectorTile_({
    source: new _ol_source_VectorTile_({
      format: new _ol_format_MVT_(),
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
