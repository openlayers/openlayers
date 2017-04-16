goog.require('ol.Map');
goog.require('ol.Overlay');
goog.require('ol.View');


var map = new ol.Map({
  target: document.getElementById('map'),
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

var count = 1000;
var e = 18000000;
for (var i = 0; i < count; ++i) {
  map.addOverlay(new ol.Overlay({
    position: [2 * e * Math.random() - e, 2 * e * Math.random() - e],
    element: $("<div class='overlay'></div>")[0]
  }));
}
