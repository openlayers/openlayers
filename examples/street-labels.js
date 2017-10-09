goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.BingMaps');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Style');
goog.require('ol.style.Text');

var style = new ol.style.Style({
  text: new ol.style.Text({
    font: 'bold 11px "Open Sans", "Arial Unicode MS", "sans-serif"',
    placement: 'line',
    fill: new ol.style.Fill({
      color: 'white'
    })
  })
});

var viewExtent = [1817379, 6139595, 1827851, 6143616];
var map = new ol.Map({
  layers: [new ol.layer.Tile({
    source: new ol.source.BingMaps({
      key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
      imagerySet: 'Aerial'
    })
  }), new ol.layer.Vector({
    declutter: true,
    source: new ol.source.Vector({
      format: new ol.format.GeoJSON(),
      url: 'data/geojson/vienna-streets.geojson'
    }),
    style: function(feature) {
      style.getText().setText(feature.get('name'));
      return style;
    }
  })],
  target: 'map',
  view: new ol.View({
    extent: viewExtent,
    center: ol.extent.getCenter(viewExtent),
    zoom: 17,
    minZoom: 14
  })
});
