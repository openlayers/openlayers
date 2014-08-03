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


var dims = {
  a0: [1189, 841],
  a1: [841, 594],
  a2: [594, 420],
  a3: [420, 297],
  a4: [297, 210],
  a5: [210, 148]
};

var exportElement = document.getElementById('export-pdf');

exportElement.addEventListener('click', function(e) {

  if (exportElement.className.indexOf('disabled') > -1) {
    return;
  }
  exportElement.className += ' disabled';

  var format = document.getElementById('format').value;
  var resolution = document.getElementById('resolution').value;
  var dim = dims[format];
  var width = Math.round(dim[0] * resolution / 25.4);
  var height = Math.round(dim[1] * resolution / 25.4);

  map.once('postcompose', function(event) {
    var tileQueue = map.getTileQueue();
    // To prevent potential unexpected division-by-zero
    // behaviour, tileTotalCount must be larger than 0.
    var tileTotalCount = tileQueue.getCount() || 1;
    var interval;
    interval = setInterval(function() {
      var tileCount = tileQueue.getCount();
      var ratio = 1 - tileCount / tileTotalCount;
      exportElement.innerText = (100 * ratio).toFixed(1) + '%';
      if (ratio == 1 && !tileQueue.getTilesLoading()) {
        clearInterval(interval);
        exportElement.innerText = 'Done';
        var canvas = event.context.canvas;
        var data = canvas.toDataURL('image/jpeg');
        var pdf = new jsPDF('landscape', undefined, format);
        pdf.addImage(data, 'JPEG', 0, 0, dim[0], dim[1]);
        pdf.save('map.pdf');
        // TODO restore size
        // TODO restore button
      }
    }, 100);
  });

  var extent = map.getView().calculateExtent(
      /** @type {ol.Size} */ (map.getSize()));
  map.setSize([width, height]);
  map.getView().fitExtent(extent, /** @type {ol.Size} */ (map.getSize()));
  map.renderSync();

}, false);
