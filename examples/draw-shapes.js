import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_geom_Polygon_ from '../src/ol/geom/polygon';
import _ol_interaction_Draw_ from '../src/ol/interaction/draw';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_Vector_ from '../src/ol/source/vector';

var raster = new _ol_layer_Tile_({
  source: new _ol_source_OSM_()
});

var source = new _ol_source_Vector_({wrapX: false});

var vector = new _ol_layer_Vector_({
  source: source
});

var map = new _ol_Map_({
  layers: [raster, vector],
  target: 'map',
  view: new _ol_View_({
    center: [-11000000, 4600000],
    zoom: 4
  })
});

var typeSelect = document.getElementById('type');

var draw; // global so we can remove it later
function addInteraction() {
  var value = typeSelect.value;
  if (value !== 'None') {
    var geometryFunction;
    if (value === 'Square') {
      value = 'Circle';
      geometryFunction = _ol_interaction_Draw_.createRegularPolygon(4);
    } else if (value === 'Box') {
      value = 'Circle';
      geometryFunction = _ol_interaction_Draw_.createBox();
    } else if (value === 'Star') {
      value = 'Circle';
      geometryFunction = function(coordinates, geometry) {
        if (!geometry) {
          geometry = new _ol_geom_Polygon_(null);
        }
        var center = coordinates[0];
        var last = coordinates[1];
        var dx = center[0] - last[0];
        var dy = center[1] - last[1];
        var radius = Math.sqrt(dx * dx + dy * dy);
        var rotation = Math.atan2(dy, dx);
        var newCoordinates = [];
        var numPoints = 12;
        for (var i = 0; i < numPoints; ++i) {
          var angle = rotation + i * 2 * Math.PI / numPoints;
          var fraction = i % 2 === 0 ? 1 : 0.5;
          var offsetX = radius * fraction * Math.cos(angle);
          var offsetY = radius * fraction * Math.sin(angle);
          newCoordinates.push([center[0] + offsetX, center[1] + offsetY]);
        }
        newCoordinates.push(newCoordinates[0].slice());
        geometry.setCoordinates([newCoordinates]);
        return geometry;
      };
    }
    draw = new _ol_interaction_Draw_({
      source: source,
      type: /** @type {ol.geom.GeometryType} */ (value),
      geometryFunction: geometryFunction
    });
    map.addInteraction(draw);
  }
}


/**
 * Handle change event.
 */
typeSelect.onchange = function() {
  map.removeInteraction(draw);
  addInteraction();
};

addInteraction();
