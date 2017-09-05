import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_control_ from '../src/ol/control';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_OSM_ from '../src/ol/source/osm';

var osm = new _ol_layer_Tile_({
  source: new _ol_source_OSM_()
});

var map = new _ol_Map_({
  layers: [osm],
  target: 'map',
  controls: _ol_control_.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});

osm.on('precompose', function(event) {
  var ctx = event.context;
  ctx.save();
  var pixelRatio = event.frameState.pixelRatio;
  var size = map.getSize();
  ctx.translate(size[0] / 2 * pixelRatio, size[1] / 2 * pixelRatio);
  ctx.scale(3 * pixelRatio, 3 * pixelRatio);
  ctx.translate(-75, -80);
  ctx.beginPath();
  ctx.moveTo(75, 40);
  ctx.bezierCurveTo(75, 37, 70, 25, 50, 25);
  ctx.bezierCurveTo(20, 25, 20, 62.5, 20, 62.5);
  ctx.bezierCurveTo(20, 80, 40, 102, 75, 120);
  ctx.bezierCurveTo(110, 102, 130, 80, 130, 62.5);
  ctx.bezierCurveTo(130, 62.5, 130, 25, 100, 25);
  ctx.bezierCurveTo(85, 25, 75, 37, 75, 40);
  ctx.clip();
  ctx.translate(75, 80);
  ctx.scale(1 / 3 / pixelRatio, 1 / 3 / pixelRatio);
  ctx.translate(-size[0] / 2 * pixelRatio, -size[1] / 2 * pixelRatio);
});

osm.on('postcompose', function(event) {
  var ctx = event.context;
  ctx.restore();
});
