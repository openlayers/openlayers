import _ol_Attribution_ from '../src/ol/attribution';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_XYZ_ from '../src/ol/source/xyz';


var attribution = new _ol_Attribution_({
  html: 'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
      'rest/services/World_Topo_Map/MapServer">ArcGIS</a>'
});

var map = new _ol_Map_({
  target: 'map',
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_XYZ_({
        attributions: [attribution],
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
            'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
      })
    })
  ],
  view: new _ol_View_({
    center: _ol_proj_.fromLonLat([-121.1, 47.5]),
    zoom: 7
  })
});
