goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.KML');
goog.require('ol.geom.Polygon');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.render');
goog.require('ol.source.Stamen');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var symbol = [[0, 0], [4, 2], [6, 0], [10, 5], [6, 3], [4, 5], [0, 0]];
var scale;
var scaleFunction = function(coordinate) {
  return [coordinate[0] * scale, coordinate[1] * scale];
};

var styleCache = {};
var styleFunction = function(feature) {
  // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
  // standards-violating <magnitude> tag in each Placemark.  We extract it from
  // the Placemark's name instead.
  var name = feature.get('name');
  var magnitude = parseFloat(name.substr(2));
  var size = parseInt(10 + 40 * (magnitude - 5), 10);
  scale = size / 10;
  var style = styleCache[size];
  if (!style) {
    var canvas =
        /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    var vectorContext = ol.render.toContext(
        /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d')),
        {size: [size, size], pixelRatio: 1});
    vectorContext.setStyle(new ol.style.Style({
      fill: new ol.style.Fill({color: 'rgba(255, 153, 0, 0.4)'}),
      stroke: new ol.style.Stroke({color: 'rgba(255, 204, 0, 0.2)', width: 2})
    }));
    vectorContext.drawGeometry(new ol.geom.Polygon([symbol.map(scaleFunction)]));
    style = new ol.style.Style({
      image: new ol.style.Icon({
        img: canvas,
        imgSize: [size, size],
        rotation: 1.2
      })
    });
    styleCache[size] = style;
  }
  return style;
};

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/kml/2012_Earthquakes_Mag5.kml',
    format: new ol.format.KML({
      extractStyles: false
    })
  }),
  style: styleFunction
});

var raster = new ol.layer.Tile({
  source: new ol.source.Stamen({
    layer: 'toner'
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});
