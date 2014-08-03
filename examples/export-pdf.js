goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});


var exportElement = document.getElementById('export-pdf');

exportElement.addEventListener('click', function(e) {
  map.once('postcompose', function(event) {
    var canvas = event.context.canvas;
    var data = canvas.toDataURL('image/jpeg');
    var pdf = new jsPDF('landscape');
    pdf.addImage(data, 'JPEG', 0, 0, 297, 210);
    pdf.save('map.pdf');
  });
  map.renderSync();
}, false);
