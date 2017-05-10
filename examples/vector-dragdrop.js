goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GPX');
goog.require('ol.parser.GeoJSON');
goog.require('ol.parser.KML');
goog.require('ol.parser.ogc.GML_v3');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.Vector');


// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.');
}

function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();

  var files = evt.dataTransfer.files; // FileList object.
  for (var i = 0, f; f = files[i]; i++) {
    var type = files[i].type;
    var name = files[i].name;
    var reader = new FileReader();
    // Closure to capture the file information.
    reader.onload = (function(theFile) {
      return function(e) {
        var text = e.target.result;
        var parser;
        if (type === 'text/xml') {
          if (text.indexOf('<gpx') !== -1) {
            parser = new ol.parser.GPX();
          } else if (text.indexOf('FeatureCollection') !== -1) {
            // TODO how to detect v2 or v3
            parser = new ol.parser.ogc.GML_v3();
          }
        }
        if (type === 'application/vnd.google-earth.kml+xml') {
          parser = new ol.parser.KML();
        } else if (type === '' && name.indexOf('json') !== -1) {
          parser = new ol.parser.GeoJSON();
        }
        if (goog.isDef(parser)) {
          var lyr = new ol.layer.Vector({
            source: new ol.source.Vector({
              data: text,
              parser: parser
            })
          });
          // TODO zoom to data extent
          map.getLayers().push(lyr);
        }
      };
    })(f);
    reader.readAsText(f);
  }
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
var dropZone = document.getElementById('map');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);

var raster = new ol.layer.Tile({
  source: new ol.source.MapQuestOpenAerial()
});

var map = new ol.Map({
  layers: [raster],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 1
  })
});
