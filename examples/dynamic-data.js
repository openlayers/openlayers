goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var map = new ol.Map({
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

var imageStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 5,
    snapToPixel: false,
    fill: new ol.style.Fill({color: 'yellow'}),
    stroke: new ol.style.Stroke({color: 'red', width: 1})
  })
});

var headInnerImageStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 2,
    snapToPixel: false,
    fill: new ol.style.Fill({color: 'blue'})
  })
});

var headOuterImageStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 5,
    snapToPixel: false,
    fill: new ol.style.Fill({color: 'black'})
  })
});

var n = 200;
var omegaTheta = 30000; // Rotation period in ms
var R = 7e6;
var r = 2e6;
var p = 2e6;
map.on('postcompose', function(event) {
  var vectorContext = event.vectorContext;
  var frameState = event.frameState;
  var theta = 2 * Math.PI * frameState.time / omegaTheta;
  var coordinates = [];
  var i;
  for (i = 0; i < n; ++i) {
    var t = theta + 2 * Math.PI * i / n;
    var x = (R + r) * Math.cos(t) + p * Math.cos((R + r) * t / r);
    var y = (R + r) * Math.sin(t) + p * Math.sin((R + r) * t / r);
    coordinates.push([x, y]);
  }
  vectorContext.setStyle(imageStyle);
  vectorContext.drawGeometry(new ol.geom.MultiPoint(coordinates));

  var headPoint = new ol.geom.Point(coordinates[coordinates.length - 1]);

  vectorContext.setStyle(headOuterImageStyle);
  vectorContext.drawGeometry(headPoint);

  vectorContext.setStyle(headInnerImageStyle);
  vectorContext.drawGeometry(headPoint);

  map.render();
});
map.render();
