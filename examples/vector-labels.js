import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_format_GeoJSON_ from '../src/ol/format/geojson';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Circle_ from '../src/ol/style/circle';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';
import _ol_style_Text_ from '../src/ol/style/text';


var myDom = {
  points: {
    text: document.getElementById('points-text'),
    align: document.getElementById('points-align'),
    baseline: document.getElementById('points-baseline'),
    rotation: document.getElementById('points-rotation'),
    font: document.getElementById('points-font'),
    weight: document.getElementById('points-weight'),
    size: document.getElementById('points-size'),
    offsetX: document.getElementById('points-offset-x'),
    offsetY: document.getElementById('points-offset-y'),
    color: document.getElementById('points-color'),
    outline: document.getElementById('points-outline'),
    outlineWidth: document.getElementById('points-outline-width'),
    maxreso: document.getElementById('points-maxreso')
  },
  lines: {
    text: document.getElementById('lines-text'),
    align: document.getElementById('lines-align'),
    baseline: document.getElementById('lines-baseline'),
    rotation: document.getElementById('lines-rotation'),
    font: document.getElementById('lines-font'),
    weight: document.getElementById('lines-weight'),
    size: document.getElementById('lines-size'),
    offsetX: document.getElementById('lines-offset-x'),
    offsetY: document.getElementById('lines-offset-y'),
    color: document.getElementById('lines-color'),
    outline: document.getElementById('lines-outline'),
    outlineWidth: document.getElementById('lines-outline-width'),
    maxreso: document.getElementById('lines-maxreso')
  },
  polygons: {
    text: document.getElementById('polygons-text'),
    align: document.getElementById('polygons-align'),
    baseline: document.getElementById('polygons-baseline'),
    rotation: document.getElementById('polygons-rotation'),
    font: document.getElementById('polygons-font'),
    weight: document.getElementById('polygons-weight'),
    size: document.getElementById('polygons-size'),
    offsetX: document.getElementById('polygons-offset-x'),
    offsetY: document.getElementById('polygons-offset-y'),
    color: document.getElementById('polygons-color'),
    outline: document.getElementById('polygons-outline'),
    outlineWidth: document.getElementById('polygons-outline-width'),
    maxreso: document.getElementById('polygons-maxreso')
  }
};

var getText = function(feature, resolution, dom) {
  var type = dom.text.value;
  var maxResolution = dom.maxreso.value;
  var text = feature.get('name');

  if (resolution > maxResolution) {
    text = '';
  } else if (type == 'hide') {
    text = '';
  } else if (type == 'shorten') {
    text = text.trunc(12);
  } else if (type == 'wrap') {
    text = stringDivider(text, 16, '\n');
  }

  return text;
};


var createTextStyle = function(feature, resolution, dom) {
  var align = dom.align.value;
  var baseline = dom.baseline.value;
  var size = dom.size.value;
  var offsetX = parseInt(dom.offsetX.value, 10);
  var offsetY = parseInt(dom.offsetY.value, 10);
  var weight = dom.weight.value;
  var rotation = parseFloat(dom.rotation.value);
  var font = weight + ' ' + size + ' ' + dom.font.value;
  var fillColor = dom.color.value;
  var outlineColor = dom.outline.value;
  var outlineWidth = parseInt(dom.outlineWidth.value, 10);

  return new _ol_style_Text_({
    textAlign: align,
    textBaseline: baseline,
    font: font,
    text: getText(feature, resolution, dom),
    fill: new _ol_style_Fill_({color: fillColor}),
    stroke: new _ol_style_Stroke_({color: outlineColor, width: outlineWidth}),
    offsetX: offsetX,
    offsetY: offsetY,
    rotation: rotation
  });
};


// Polygons
function polygonStyleFunction(feature, resolution) {
  return new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: 'blue',
      width: 1
    }),
    fill: new _ol_style_Fill_({
      color: 'rgba(0, 0, 255, 0.1)'
    }),
    text: createTextStyle(feature, resolution, myDom.polygons)
  });
}

var vectorPolygons = new _ol_layer_Vector_({
  source: new _ol_source_Vector_({
    url: 'data/geojson/polygon-samples.geojson',
    format: new _ol_format_GeoJSON_()
  }),
  style: polygonStyleFunction
});


// Lines
function lineStyleFunction(feature, resolution) {
  return new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: 'green',
      width: 2
    }),
    text: createTextStyle(feature, resolution, myDom.lines)
  });
}

var vectorLines = new _ol_layer_Vector_({
  source: new _ol_source_Vector_({
    url: 'data/geojson/line-samples.geojson',
    format: new _ol_format_GeoJSON_()
  }),
  style: lineStyleFunction
});


// Points
function pointStyleFunction(feature, resolution) {
  return new _ol_style_Style_({
    image: new _ol_style_Circle_({
      radius: 10,
      fill: new _ol_style_Fill_({color: 'rgba(255, 0, 0, 0.1)'}),
      stroke: new _ol_style_Stroke_({color: 'red', width: 1})
    }),
    text: createTextStyle(feature, resolution, myDom.points)
  });
}

var vectorPoints = new _ol_layer_Vector_({
  source: new _ol_source_Vector_({
    url: 'data/geojson/point-samples.geojson',
    format: new _ol_format_GeoJSON_()
  }),
  style: pointStyleFunction
});

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    }),
    vectorPolygons,
    vectorLines,
    vectorPoints
  ],
  target: 'map',
  view: new _ol_View_({
    center: [-8161939, 6095025],
    zoom: 8
  })
});

document.getElementById('refresh-points')
    .addEventListener('click', function() {
      vectorPoints.setStyle(pointStyleFunction);
    });

document.getElementById('refresh-lines')
    .addEventListener('click', function() {
      vectorLines.setStyle(lineStyleFunction);
    });

document.getElementById('refresh-polygons')
    .addEventListener('click', function() {
      vectorPolygons.setStyle(polygonStyleFunction);
    });


/**
 * @param {number} n The max number of characters to keep.
 * @return {string} Truncated string.
 */
String.prototype.trunc = String.prototype.trunc ||
    function(n) {
      return this.length > n ? this.substr(0, n - 1) + '...' : this.substr(0);
    };


// http://stackoverflow.com/questions/14484787/wrap-text-in-javascript
function stringDivider(str, width, spaceReplacer) {
  if (str.length > width) {
    var p = width;
    while (p > 0 && (str[p] != ' ' && str[p] != '-')) {
      p--;
    }
    if (p > 0) {
      var left;
      if (str.substring(p, p + 1) == '-') {
        left = str.substring(0, p + 1);
      } else {
        left = str.substring(0, p);
      }
      var right = str.substring(p + 1);
      return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
    }
  }
  return str;
}
