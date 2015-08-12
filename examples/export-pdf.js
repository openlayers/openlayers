goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.format.WKT');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');

var raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var format = new ol.format.WKT();
var feature = format.readFeature(
    'POLYGON((10.689697265625 -25.0927734375, 34.595947265625 ' +
        '-20.1708984375, 38.814697265625 -35.6396484375, 13.502197265625 ' +
        '-39.1552734375, 10.689697265625 -25.0927734375))');
feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [feature]
  })
});


var map = new ol.Map({
  layers: [raster, vector],
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


var dims = {
  a0: [1189, 841],
  a1: [841, 594],
  a2: [594, 420],
  a3: [420, 297],
  a4: [297, 210],
  a5: [210, 148]
};

var exportButton = document.getElementById('export-pdf');

exportButton.addEventListener('click', function(e) {

  exportButton.disabled = true;

  var format = document.getElementById('format').value;
  var resolution = document.getElementById('resolution').value;
  var dim = dims[format];
  var width = Math.round(dim[0] * resolution / 25.4);
  var height = Math.round(dim[1] * resolution / 25.4);
  var size = /** @type {ol.Size} */ (map.getSize());
  var extent = map.getView().calculateExtent(size);

  map.once('postcompose', function(event) {
    var tileQueue = map.getTileQueue();
    // To prevent potential unexpected division-by-zero
    // behaviour, tileTotalCount must be larger than 0.
    var tileTotalCount = tileQueue.getCount() || 1;
    var interval;
    interval = setInterval(function() {
      var tileCount = tileQueue.getCount();
      var ratio = 1 - tileCount / tileTotalCount;
      if (ratio == 1 && !tileQueue.getTilesLoading()) {
        clearInterval(interval);
        var canvas = event.context.canvas;
        var data = canvas.toDataURL('image/jpeg');
        var pdf = new jsPDF('landscape', undefined, format);
        pdf.addImage(data, 'JPEG', 0, 0, dim[0], dim[1]);
        pdf.save('map.pdf');
        map.setSize(size);
        map.getView().fit(extent, size);
        map.renderSync();
        exportButton.disabled = false;
      }
    }, 100);
  });

  map.setSize([width, height]);
  map.getView().fit(extent, /** @type {ol.Size} */ (map.getSize()));
  map.renderSync();

}, false);
