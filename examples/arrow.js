goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.Stroke');
goog.require('ol.style.ArrowShape');
goog.require('ol.style.Style');


var lineStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'red',
    width: 1
  })
});

var extractRotation = function extractRotation(lineString) {

  var n0,n1,nm,p0,p1;
  var coordinates = lineString.getCoordinates();
  var n = coordinates.length;
  if (n <= 1) {
    return null;
  }

  if (n % 2 == 0) {

    n1 = n / 2;
    n0 = n1 - 1;

    p0 = coordinates[n0];
    p1 = coordinates[n1];

    return {
      p:[0.5 * (p0[0] + p1[0]), 0.5 * (p0[1] + p1[1])],
      rotation: Math.atan2(p1[1] - p0[1], p1[0] - p0[0])
    };
  } else {

    nm = Math.floor(n / 2);
    n0 = nm - 1;
    n1 = nm + 1;
    p0 = coordinates[n0];
    p1 = coordinates[n1];

    return {
      p:coordinates[nm],
      rotation: Math.atan2(p1[1] - p0[1], p1[0] - p0[0])
    };
  }
};

var createArrowStyle = function createArrowStyle(cp,fillColor, strokeColor) {
  return new ol.style.Style({
    geometry: new ol.geom.Point(cp.p),
    image: new ol.style.ArrowShape({
      fill: new ol.style.Fill({color: fillColor}),
      length: 50,
      width: 25,
      stroke: new ol.style.Stroke({
        color: strokeColor
      }),
      rotateWithView: false,
      angle: -cp.rotation
    })
  });
};

var styleFunction = function(feature) {
  var styles = [lineStyle];
  var cp = extractRotation(feature.getGeometry());

  if (cp) {
    styles.push(createArrowStyle(cp,'rgba(255,0,0,0.2)','rgba(255,0,0,0.6)'));
  }
  return styles;
};

var geojsonObject = {
  'type': 'FeatureCollection',
  'crs': {
    'type': 'name',
    'properties': {
      'name': 'EPSG:3857'
    }
  },
  'features': [
    {
      'type': 'Feature',
      'geometry': {
        'type': 'LineString',
        'coordinates': [[4e6, -2e6], [8e6, 2e6]]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'LineString',
        'coordinates': [[-4e6, 2e6], [0.0, 2e6], [0.0, -2e6]]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'LineString',
        'coordinates': [[-12e6, 2e6], [-8e6, 2e6], [-12e6, -2e6], [-8e6, -2e6]]
      }
    }
  ]
};

var vectorSource = new ol.source.Vector({
  features: (new ol.format.GeoJSON()).readFeatures(geojsonObject)
});

var vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  style: styleFunction
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    vectorLayer
  ],
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});
