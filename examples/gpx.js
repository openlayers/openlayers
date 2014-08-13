goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.GPX');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.BingMaps');
goog.require('ol.source.GPX');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var projection = ol.proj.get('EPSG:3857');

var raster = new ol.layer.Tile({
  source: new ol.source.BingMaps({
    imagerySet: 'Aerial',
    key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3'
  })
});

var style = {
  'Point': [new ol.style.Style({
    image: new ol.style.Circle({
      fill: new ol.style.Fill({
        color: 'rgba(255,255,0,0.4)'
      }),
      radius: 5,
      stroke: new ol.style.Stroke({
        color: '#ff0',
        width: 1
      })
    })
  })],
  'LineString': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#f00',
      width: 3
    })
  })],
  'MultiLineString': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#0f0',
      width: 3
    })
  })]
};

var vector = new ol.layer.Vector({
  source: new ol.source.GPX({
    projection: projection,
    url: 'data/gpx/fells_loop.gpx'
  }),
  style: function(feature, resolution) {
    return style[feature.getGeometry().getType()];
  }
});

var map = new ol.Map({
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new ol.View({
    center: [-7916041.528716288, 5228379.045749711],
    zoom: 12
  })
});

var displayFeatureInfo = function(pixel) {
  var features = [];
  map.forEachFeatureAtPixel(pixel, function(feature, layer) {
    features.push(feature);
  });
  if (features.length > 0) {
    var info = [];
    var i, ii;
    for (i = 0, ii = features.length; i < ii; ++i) {
      info.push(features[i].get('desc'));
    }
    document.getElementById('info').innerHTML = info.join(', ') || '(unknown)';
    map.getTarget().style.cursor = 'pointer';
  } else {
    document.getElementById('info').innerHTML = '&nbsp;';
    map.getTarget().style.cursor = '';
  }
};

$(map.getViewport()).on('mousemove', function(evt) {
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function(evt) {
  displayFeatureInfo(evt.pixel);
});

var exportGPXElement = document.getElementById('export-gpx');
if ('download' in exportGPXElement) {
  var vectorSource = /** @type {ol.source.Vector} */ (vector.getSource());
  exportGPXElement.addEventListener('click', function(e) {
    if (!exportGPXElement.href) {
      var features = [];
      vectorSource.forEachFeature(function(feature) {
        var clone = feature.clone();
        clone.getGeometry().transform(projection, 'EPSG:4326');
        features.push(clone);
      });
      var node = new ol.format.GPX().writeFeatures(features);
      var string = new XMLSerializer().serializeToString(
          /** @type {Node} */ (node));
      var base64 = exampleNS.strToBase64(string);
      exportGPXElement.href =
          'data:gpx+xml;base64,' + base64;
    }
  }, false);
} else {
  var info = document.getElementById('no-download');
  /**
   * display error message
   */
  info.style.display = '';
}
