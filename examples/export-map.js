// NOCOMPILE
// this example uses FileSaver.js for which we don't have an externs file.
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    new ol.layer.Vector({
      source: new ol.source.Vector({
        url: 'data/geojson/countries.geojson',
        format: new ol.format.GeoJSON()
      })
    })
  ],
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

document.getElementById('export-png').addEventListener('click', function() {
  map.once('postcompose', function(event) {
    var canvas = event.context.canvas;
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(canvas.msToBlob(), 'map.png');
    } else {
      canvas.toBlob(function(blob) {
        saveAs(blob, 'map.png');
      });
    }
  });
  map.renderSync();
});
