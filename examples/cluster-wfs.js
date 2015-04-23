goog.require('ol.source.Vector');
goog.require('ol.source.Cluster');
goog.require('ol.source.OSM');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Vector');
goog.require('ol.layer.Tile');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Text');
goog.require('ol.Map');
goog.require('ol.View');

var vectorSource = new ol.source.Vector({
  'format': new ol.format.GeoJSON(),
  'loader': function(extent, resolution, projection) {
    var url = "http://mhc-macris.net:8080/geoserver/MHC/ows?service=WFS&version=1.0.0"
          + "&request=GetFeature&typeName=MHC:in_pts&outputFormat=json&outputFormat=text/javascript"
          + "&format_options=callback:geoJsonLoader"
          + "&srsname=EPSG:3857&bbox=" + extent.join(",") + ",EPSG:3857";
    $.ajax({
      'url': url,
      'dataType': 'jsonp',
      'success': function(response) {
        var format = new ol.format.GeoJSON();
        var features = format.readFeatures(response, {featureProjection: projection});
        vectorSource.addFeatures(features);
      }
    });
  },
  'projection': new ol.proj.Projection({
    'code': 'EPSG:3857',
    'units': 'degrees',
    'axisOrientation': 'nue'}),
  'strategy': ol.loadingstrategy.bbox
});

var geoJsonLoader = function(response) {
  var format = new ol.format.GeoJSON();
  vectorSource.addFeatures(format.readFeatures(response));
};

var clusterLayer = new ol.layer.Vector({
  'source': new ol.source.Cluster({
    'distance': 40,
    'source': vectorSource
  }),
  'style': function(features, resolution) {
    var size = features.get('features').length;
    var sizeOut = size;

    if(sizeOut < 10) {
      sizeOut = 10;
    } else if(sizeOut > 50) {
      sizeOut = 50;
    }

    var style = [
      new ol.style.Style({
        'image': new ol.style.Circle({
          'fill': new ol.style.Fill({
            'color': [51, 153, 204, 1.0]
          }),
          'snapToPixel': true,
          'radius': sizeOut
        }),
        'text': new ol.style.Text({
          'offsetX': 0,
          'offsetY': 0,
          'fill': new ol.style.Fill({
            'color': [255, 255, 255, 1.0]
          }),
          'text': size.toString()
        })
      })
    ];

    return style;
  }
});

var tileLayer = new ol.layer.Tile({
  'title': 'Streets',
  'source': new ol.source.OSM()
});


var map = new ol.Map({
  'target': 'map',
  'layers': [tileLayer, clusterLayer],
  'view': new ol.View({
    'center': ol.proj.transform([-72.638429, 42.313229], 'EPSG:4326', 'EPSG:3857'),
    'zoom': 16,
    'projection': 'EPSG:3857'
  })
});
