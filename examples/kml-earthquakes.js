import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import KML from '../src/ol/format/KML.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import Stamen from '../src/ol/source/Stamen.js';
import VectorSource from '../src/ol/source/Vector.js';
import _ol_style_Circle_ from '../src/ol/style/Circle.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';


var styleCache = {};
var styleFunction = function(feature) {
  // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
  // standards-violating <magnitude> tag in each Placemark.  We extract it from
  // the Placemark's name instead.
  var name = feature.get('name');
  var magnitude = parseFloat(name.substr(2));
  var radius = 5 + 20 * (magnitude - 5);
  var style = styleCache[radius];
  if (!style) {
    style = new _ol_style_Style_({
      image: new _ol_style_Circle_({
        radius: radius,
        fill: new _ol_style_Fill_({
          color: 'rgba(255, 153, 0, 0.4)'
        }),
        stroke: new _ol_style_Stroke_({
          color: 'rgba(255, 204, 0, 0.2)',
          width: 1
        })
      })
    });
    styleCache[radius] = style;
  }
  return style;
};

var vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/kml/2012_Earthquakes_Mag5.kml',
    format: new KML({
      extractStyles: false
    })
  }),
  style: styleFunction
});

var raster = new TileLayer({
  source: new Stamen({
    layer: 'toner'
  })
});

var map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

var info = $('#info');
info.tooltip({
  animation: false,
  trigger: 'manual'
});

var displayFeatureInfo = function(pixel) {
  info.css({
    left: pixel[0] + 'px',
    top: (pixel[1] - 15) + 'px'
  });
  var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
    return feature;
  });
  if (feature) {
    info.tooltip('hide')
        .attr('data-original-title', feature.get('name'))
        .tooltip('fixTitle')
        .tooltip('show');
  } else {
    info.tooltip('hide');
  }
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    info.tooltip('hide');
    return;
  }
  displayFeatureInfo(map.getEventPixel(evt.originalEvent));
});

map.on('click', function(evt) {
  displayFeatureInfo(evt.pixel);
});
