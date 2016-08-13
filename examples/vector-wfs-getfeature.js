goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.ogc.filter');
goog.require('ol.format.WFS');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.BingMaps');
goog.require('ol.source.Vector');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var vectorSource = new ol.source.Vector();
var vector = new ol.layer.Vector({
  source: vectorSource,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 0, 255, 1.0)',
      width: 2
    })
  })
});

var raster = new ol.layer.Tile({
  source: new ol.source.BingMaps({
    imagerySet: 'Aerial',
    key: 'AkGbxXx6tDWf1swIhPJyoAVp06H0s0gDTYslNWWHZ6RoPqMpB9ld5FY1WutX8UoF'
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new ol.View({
    center: [-8908887.277395891, 5381918.072437216],
    maxZoom: 19,
    zoom: 12
  })
});

// generate a GetFeature request
var featureRequest = new ol.format.WFS().writeGetFeature({
  srsName: 'EPSG:3857',
  featureNS: 'http://openstreemap.org',
  featurePrefix: 'osm',
  featureTypes: ['water_areas'],
  outputFormat: 'application/json',
  filter: ol.format.ogc.filter.and(
    ol.format.ogc.filter.like('name', 'Mississippi*'),
    ol.format.ogc.filter.equalTo('waterway', 'riverbank')
  )
});

// then post the request and add the received features to a layer
fetch('http://demo.boundlessgeo.com/geoserver/wfs', {
  method: 'POST',
  body: new XMLSerializer().serializeToString(featureRequest)
}).then(function(response) {
  return response.json();
}).then(function(json) {
  var features = new ol.format.GeoJSON().readFeatures(json);
  vectorSource.addFeatures(features);
  map.getView().fit(vectorSource.getExtent(), /** @type {ol.Size} */ (map.getSize()));
});
