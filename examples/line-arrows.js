import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import Draw from '../src/ol/interaction/Draw.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import _ol_style_Icon_ from '../src/ol/style/Icon.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';

var raster = new TileLayer({
  source: new OSM()
});

var source = new VectorSource();

var styleFunction = function(feature) {
  var geometry = feature.getGeometry();
  var styles = [
    // linestring
    new Style({
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
    styles.push(new Style({
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
var vector = new VectorLayer({
  source: source,
  style: styleFunction
});

var map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4
  })
});

map.addInteraction(new Draw({
  source: source,
  type: 'LineString'
}));
