import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_format_KML_ from '../src/ol/format/kml';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_Stamen_ from '../src/ol/source/stamen';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';


/*
 * Compute the style of the feature.  Here we want the opacity of polygons to
 * be based on the offset from local noon.  For example, a timezone where it is
 * currently noon would have an opacity of 0.75.  And a timezone where it is
 * currently midnight would have an opacity of 0.  This doesn't account for
 * daylight savings, so don't use it to plan your vacation.
 */
var styleFunction = function(feature) {
  var offset = 0;
  var name = feature.get('name'); // e.g. GMT -08:30
  var match = name.match(/([\-+]\d{2}):(\d{2})$/);
  if (match) {
    var hours = parseInt(match[1], 10);
    var minutes = parseInt(match[2], 10);
    offset = 60 * hours + minutes;
  }
  var date = new Date();
  var local = new Date(date.getTime() +
      (date.getTimezoneOffset() + offset) * 60000);
  // offset from local noon (in hours)
  var delta = Math.abs(12 - local.getHours() + (local.getMinutes() / 60));
  if (delta > 12) {
    delta = 24 - delta;
  }
  var opacity = 0.75 * (1 - delta / 12);
  return new _ol_style_Style_({
    fill: new _ol_style_Fill_({
      color: [0xff, 0xff, 0x33, opacity]
    }),
    stroke: new _ol_style_Stroke_({
      color: '#ffffff'
    })
  });
};

var vector = new _ol_layer_Vector_({
  source: new _ol_source_Vector_({
    url: 'data/kml/timezones.kml',
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
