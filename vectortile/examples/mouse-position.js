var mousePositionControl = new ol.control.MousePosition({
  coordinateFormat: ol.coordinate.createStringXY(4),
  projection: 'EPSG:4326',
  // comment the following two lines to have the mouse position
  // be placed within the map.
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
  undefinedHTML: '&nbsp;'
});

var map = new ol.Map({
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }).extend([mousePositionControl]),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

var projectionSelect = $('#projection');
projectionSelect.on('change', function() {
  mousePositionControl.setProjection(ol.proj.get(this.value));
});
projectionSelect.val(mousePositionControl.getProjection().getCode());

var precisionInput = $('#precision');
precisionInput.on('change', function() {
  var format = ol.coordinate.createStringXY(this.valueAsNumber);
  mousePositionControl.setCoordinateFormat(format);
});
