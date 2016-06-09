goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.render');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var canvas = document.getElementById('canvas');
var vectorContext = ol.render.toContext(canvas.getContext('2d'), {size: [100, 100]});

var fill = new ol.style.Fill({color: 'blue'});
var stroke = new ol.style.Stroke({color: 'black'});
var style = new ol.style.Style({
  fill: fill,
  stroke: stroke,
  image: new ol.style.Circle({
    radius: 10,
    fill: fill,
    stroke: stroke
  })
});
vectorContext.setStyle(style);

vectorContext.drawGeometry(new ol.geom.LineString([[10, 10], [90, 90]]));
vectorContext.drawGeometry(new ol.geom.Polygon([[[2, 2], [98, 2], [2, 98], [2, 2]]]));
vectorContext.drawGeometry(new ol.geom.Point([88, 88]));
