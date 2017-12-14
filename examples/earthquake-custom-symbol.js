import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_format_KML_ from '../src/ol/format/KML.js';
import Polygon from '../src/ol/geom/Polygon.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_render_ from '../src/ol/render.js';
import _ol_source_Stamen_ from '../src/ol/source/Stamen.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Icon_ from '../src/ol/style/Icon.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';


var symbol = [[0, 0], [4, 2], [6, 0], [10, 5], [6, 3], [4, 5], [0, 0]];
var scale;
var scaleFunction = function(coordinate) {
  return [coordinate[0] * scale, coordinate[1] * scale];
};

var styleCache = {};
var styleFunction = function(feature) {
  // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
  // standards-violating <magnitude> tag in each Placemark.  We extract it from
  // the Placemark's name instead.
  var name = feature.get('name');
  var magnitude = parseFloat(name.substr(2));
  var size = parseInt(10 + 40 * (magnitude - 5), 10);
  scale = size / 10;
  var style = styleCache[size];
  if (!style) {
    var canvas =
        /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    var vectorContext = _ol_render_.toContext(
        /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d')),
        {size: [size, size], pixelRatio: 1});
    vectorContext.setStyle(new _ol_style_Style_({
      fill: new _ol_style_Fill_({color: 'rgba(255, 153, 0, 0.4)'}),
      stroke: new _ol_style_Stroke_({color: 'rgba(255, 204, 0, 0.2)', width: 2})
    }));
    vectorContext.drawGeometry(new Polygon([symbol.map(scaleFunction)]));
    style = new _ol_style_Style_({
      image: new _ol_style_Icon_({
        img: canvas,
        imgSize: [size, size],
        rotation: 1.2
      })
    });
    styleCache[size] = style;
  }
  return style;
};

var vector = new _ol_layer_Vector_({
  source: new _ol_source_Vector_({
    url: 'data/kml/2012_Earthquakes_Mag5.kml',
    format: new _ol_format_KML_({
      extractStyles: false
    })
  }),
  style: styleFunction
});

var raster = new _ol_layer_Tile_({
  source: new _ol_source_Stamen_({
    layer: 'toner'
  })
});

var map = new _ol_Map_({
  layers: [raster, vector],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});
