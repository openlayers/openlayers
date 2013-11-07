goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.expr');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GeoJSON');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Rule');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');


var raster = new ol.layer.Tile({
  source: new ol.source.MapQuestOpenAerial()
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    parser: new ol.parser.GeoJSON(),
    url: 'data/countries.geojson'
  }),
  style: new ol.style.Style({rules: [
    new ol.style.Rule({
      symbolizers: [
        new ol.style.Fill({
          color: 'white',
          opacity: 0.6
        }),
        new ol.style.Stroke({
          color: '#319FD3',
          opacity: 1
        })
      ]
    }),
    new ol.style.Rule({
      maxResolution: 5000,
      symbolizers: [
        new ol.style.Text({
          color: 'black',
          text: ol.expr.parse('name'),
          fontFamily: 'Calibri,sans-serif',
          fontSize: 12,
          stroke: new ol.style.Stroke({
            color: 'white',
            width: 3
          })
        })
      ]
    })
  ]})
});

var map = new ol.Map({
  layers: [raster, vector],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 1
  })
});

var displayFeatureInfo = function(pixel) {
  map.getFeatures({
    pixel: pixel,
    layers: [vector],
    success: function(featuresByLayer) {
      var features = featuresByLayer[0];
      document.getElementById('info').innerHTML = features.length > 0 ?
          features[0].getId() + ': ' + features[0].get('name') :
          '&nbsp;';
    }
  });
};

$(map.getViewport()).on('mousemove', function(evt) {
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('singleclick', function(evt) {
  var pixel = evt.getPixel();
  displayFeatureInfo(pixel);
});
