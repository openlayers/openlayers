goog.require('ga.Map');
goog.require('ga.layer');
goog.require('ol.RendererHints');
goog.require('ol.View2D');


var map = new ga.Map({
  layers: [
    ga.layer('ch.swisstopo.pixelkarte-farbe'),
    ga.layer('ch.bfe.sachplan-geologie-tiefenlager')
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    zoom: 12
  })
});
