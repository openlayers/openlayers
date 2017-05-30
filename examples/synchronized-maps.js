goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.ViewHint');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapQuestOSM');
goog.require('ol.source.MapQuestOpenAerial');


var map1 = new ol.Map({
  target: 'map1',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuestOpenAerial()
    })
  ],
  view: new ol.View2D({
    center: [0, 0],
    zoom: 1
  })
});

var map2 = new ol.Map({
  target: 'map2',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuestOSM()
    })
  ],
  view: new ol.View2D({
    center: [0, 0],
    zoom: 1
  })
});


function matchViewState(map, frame) {
  var hints = frame.viewHints;
  if (hints[ol.ViewHint.ANIMATING] || hints[ol.ViewHint.INTERACTING]) {
    var view = map.getView();
    var state = frame.view2DState;
    map.withFrozenRendering(function() {
      var center = view.getCenter();
      if (center[0] !== state.center[0] || center[1] !== state.center[1]) {
        view.setCenter(state.center);
      }
      if (view.getResolution() !== state.resolution) {
        view.setResolution(state.resolution);
      }
      if (view.getRotation() !== state.rotation) {
        view.setRotation(state.rotation);
      }
    });
  }
}

map1.on('postrender', function(event) {
  matchViewState(map2, event.frameState);
});

map2.on('postrender', function(event) {
  matchViewState(map1, event.frameState);
});
