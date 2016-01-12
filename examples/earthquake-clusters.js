goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.format.KML');
goog.require('ol.interaction');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.Cluster');
goog.require('ol.source.Stamen');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.RegularShape');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');


var earthquakeFill = new ol.style.Fill({
  color: 'rgba(255, 153, 0, 0.8)'
});
var earthquakeStroke = new ol.style.Stroke({
  color: 'rgba(255, 204, 0, 0.2)',
  width: 1
});
var textFill = new ol.style.Fill({
  color: '#fff'
});
var textStroke = new ol.style.Stroke({
  color: 'rgba(0, 0, 0, 0.6)',
  width: 3
});
var invisibleFill = new ol.style.Fill({
  color: 'rgba(255, 255, 255, 0.01)'
});

function createEarthquakeStyle(feature) {
  // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
  // standards-violating <magnitude> tag in each Placemark.  We extract it
  // from the Placemark's name instead.
  var name = feature.get('name');
  var magnitude = parseFloat(name.substr(2));
  var radius = 5 + 20 * (magnitude - 5);

  return new ol.style.Style({
    geometry: feature.getGeometry(),
    image: new ol.style.RegularShape({
      radius1: radius,
      radius2: 3,
      points: 5,
      angle: Math.PI,
      fill: earthquakeFill,
      stroke: earthquakeStroke
    })
  });
}

var maxFeatureCount, vector;
function calculateClusterInfo(resolution) {
  maxFeatureCount = 0;
  var features = vector.getSource().getFeatures();
  var feature, radius;
  for (var i = features.length - 1; i >= 0; --i) {
    feature = features[i];
    var originalFeatures = feature.get('features');
    var extent = ol.extent.createEmpty();
    var j, jj;
    for (j = 0, jj = originalFeatures.length; j < jj; ++j) {
      ol.extent.extend(extent, originalFeatures[j].getGeometry().getExtent());
    }
    maxFeatureCount = Math.max(maxFeatureCount, jj);
    radius = 0.25 * (ol.extent.getWidth(extent) + ol.extent.getHeight(extent)) /
        resolution;
    feature.set('radius', radius);
  }
}

var currentResolution;
function styleFunction(feature, resolution) {
  if (resolution != currentResolution) {
    calculateClusterInfo(resolution);
    currentResolution = resolution;
  }
  var style;
  var size = feature.get('features').length;
  if (size > 1) {
    style = new ol.style.Style({
      image: new ol.style.Circle({
        radius: feature.get('radius'),
        fill: new ol.style.Fill({
          color: [255, 153, 0, Math.min(0.8, 0.4 + (size / maxFeatureCount))]
        })
      }),
      text: new ol.style.Text({
        text: size.toString(),
        fill: textFill,
        stroke: textStroke
      })
    });
  } else {
    var originalFeature = feature.get('features')[0];
    style = createEarthquakeStyle(originalFeature);
  }
  return style;
}

function selectStyleFunction(feature) {
  var styles = [new ol.style.Style({
    image: new ol.style.Circle({
      radius: feature.get('radius'),
      fill: invisibleFill
    })
  })];
  var originalFeatures = feature.get('features');
  var originalFeature;
  for (var i = originalFeatures.length - 1; i >= 0; --i) {
    originalFeature = originalFeatures[i];
    styles.push(createEarthquakeStyle(originalFeature));
  }
  return styles;
}

vector = new ol.layer.Vector({
  source: new ol.source.Cluster({
    distance: 40,
    source: new ol.source.Vector({
      url: 'data/kml/2012_Earthquakes_Mag5.kml',
      format: new ol.format.KML({
        extractStyles: false
      })
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
  interactions: ol.interaction.defaults().extend([new ol.interaction.Select({
    condition: function(evt) {
      return evt.originalEvent.type == 'mousemove' ||
          evt.type == 'singleclick';
    },
    style: selectStyleFunction
  })]),
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});
