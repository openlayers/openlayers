import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import _ol_interaction_Draw_ from '../src/ol/interaction/Draw.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_style_Icon_ from '../src/ol/style/Icon.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';

var raster = new _ol_layer_Tile_({
  source: new _ol_source_OSM_()
});

var source = new _ol_source_Vector_();

var styleFunction = function(feature) {
  var geometry = feature.getGeometry();
  var styles = [
    // linestring
    new _ol_style_Style_({
      stroke: new _ol_style_Stroke_({
        color: '#ffcc33',
        width: 2
      })
    })
  ];

  geometry.forEachSegment(function(start, end) {
    var dx = end[0] - start[0];
    var dy = end[1] - start[1];
    var rotation = Math.atan2(dy, dx);
    // arrows
    styles.push(new _ol_style_Style_({
      geometry: new Point(end),
      image: new _ol_style_Icon_({
        src: 'data/arrow.png',
        anchor: [0.75, 0.5],
        rotateWithView: true,
        rotation: -rotation
      })
    }));
  });

  return styles;
};
var vector = new _ol_layer_Vector_({
  source: source,
  style: styleFunction
});

var map = new _ol_Map_({
  layers: [raster, vector],
  target: 'map',
  view: new _ol_View_({
    center: [-11000000, 4600000],
    zoom: 4
  })
});

map.addInteraction(new _ol_interaction_Draw_({
  source: source,
  type: 'LineString'
}));
