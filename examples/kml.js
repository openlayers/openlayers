goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.KML');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.BingMaps');
goog.require('ol.source.KML');

var projection = ol.proj.get('EPSG:3857');

var raster = new ol.layer.Tile({
  source: new ol.source.BingMaps({
    imagerySet: 'Aerial',
    key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3'
  })
});

var vector = new ol.layer.Vector({
  source: new ol.source.KML({
    projection: projection,
    url: 'data/kml/2012-02-10.kml'
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new ol.View({
    center: [876970.8463461736, 5859807.853963373],
    projection: projection,
    zoom: 10
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
      info.push(features[i].get('name'));
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

var exportKMLElement = document.getElementById('export-kml');
if ('download' in exportKMLElement) {
  var vectorSource = /** @type {ol.source.Vector} */ (vector.getSource());
  exportKMLElement.addEventListener('click', function(e) {
    if (!exportKMLElement.href) {
      var features = [];
      vectorSource.forEachFeature(function(feature) {
        var clone = feature.clone();
        clone.setId(feature.getId());  // clone does not set the id
        clone.getGeometry().transform(projection, 'EPSG:4326');
        features.push(clone);
      });
      var node = new ol.format.KML().writeFeatures(features);
      var string = new XMLSerializer().serializeToString(
          /** @type {Node} */ (node));
      var base64 = exampleNS.strToBase64(string);
      exportKMLElement.href =
          'data:application/vnd.google-earth.kml+xml;base64,' + base64;
    }
  }, false);
} else {
  var info = document.getElementById('no-download');
  /**
   * display error message
   */
  info.style.display = '';
}
