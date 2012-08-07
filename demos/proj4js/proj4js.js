goog.require('goog.dom');
goog.require('ol.Coordinate');
goog.require('ol.Projection');


var outputElement = document.getElementById('output');

var point, transformedPoint;

point = new ol.Coordinate(-626172.13571216376, 6887893.4928337997);
transformedPoint = ol.Projection.transformWithCodes(
    point, 'GOOGLE', 'WGS84');
outputElement.appendChild(goog.dom.createTextNode(transformedPoint.toString()));

Proj4js.defs['EPSG:21781'] =
    '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 ' +
    '+x_0=600000 +y_0=200000 +ellps=bessel ' +
    '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs';

point = new ol.Coordinate(7.439583333333333, 46.95240555555556);
transformedPoint = ol.Projection.transformWithCodes(
    point, 'EPSG:4326', 'EPSG:21781');
outputElement.appendChild(goog.dom.createTextNode(transformedPoint.toString()));
