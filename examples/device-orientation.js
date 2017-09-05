// NOCOMPILE
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_control_ from '../src/ol/control';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_math_ from '../src/ol/math';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_OSM_ from '../src/ol/source/osm';

var projection = _ol_proj_.get('EPSG:3857');
var view = new _ol_View_({
  center: [0, 0],
  projection: projection,
  extent: projection.getExtent(),
  zoom: 2
});
var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  controls: _ol_control_.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: view
});

function el(id) {
  return document.getElementById(id);
}


var gn = new GyroNorm();

gn.init().then(function() {
  gn.start(function(event) {
    var center = view.getCenter();
    var resolution = view.getResolution();
    var alpha = _ol_math_.toRadians(event.do.beta);
    var beta = _ol_math_.toRadians(event.do.beta);
    var gamma = _ol_math_.toRadians(event.do.gamma);

    el('alpha').innerText = alpha + ' [rad]';
    el('beta').innerText = beta + ' [rad]';
    el('gamma').innerText = gamma + ' [rad]';

    center[0] -= resolution * gamma * 25;
    center[1] += resolution * beta * 25;

    view.setCenter(view.constrainCenter(center));
  });
});
