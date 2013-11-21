goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');

// main map
var mainView = new ol.View2D({
  zoom: 2
});
var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: mainView
});

// overview map
var overviewView = new ol.View2D();
var overviewMap = new ol.Map({
  controls: [],
  target: 'overviewmap',
  view: overviewView
});

var setOverviewResolution = function() {
  overviewView.setResolution(16 * mainView.getResolution());
};

// have both maps share the same layers
overviewMap.bindTo('layergroup', map);

// make the overview map view's center follow the main map view's center
overviewMap.getView().bindTo('center', map.getView());

// listen to the main map view's resolution change to adjust the overview
// resolution accordingly
mainView.on('change:resolution', setOverviewResolution);

// initialize the main map view's position in the end, which will adjust
// the overview map view's position too
mainView.setCenter([0, 0]);
setOverviewResolution();
