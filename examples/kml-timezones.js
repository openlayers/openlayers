goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.KML');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.Stamen');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


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
  return new ol.style.Style({
    fill: new ol.style.Fill({
      color: [0xff, 0xff, 0x33, opacity]
    }),
    stroke: new ol.style.Stroke({
      color: '#ffffff'
    })
  });
};

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/kml/timezones.kml',
    format: new ol.format.KML({
      extractStyles: false
    })
  }),
  style: styleFunction
});

var raster = new ol.layer.Tile({
  source: new ol.source.Stamen({
    layer: 'toner'
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  target: 'map',
  view: new ol.View({
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
