var scaleLineControl = new ol.control.ScaleLine();

var map = new ol.Map({
  controls: ol.control.defaults().extend([
    scaleLineControl
  ]),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});


var unitsSelect = new ol.dom.Input(document.getElementById('units'));
unitsSelect.bindTo('value', scaleLineControl, 'units');
