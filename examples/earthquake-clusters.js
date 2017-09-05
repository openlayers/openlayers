import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_extent_ from '../src/ol/extent';
import _ol_format_KML_ from '../src/ol/format/kml';
import _ol_interaction_ from '../src/ol/interaction';
import _ol_interaction_Select_ from '../src/ol/interaction/select';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_Cluster_ from '../src/ol/source/cluster';
import _ol_source_Stamen_ from '../src/ol/source/stamen';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Circle_ from '../src/ol/style/circle';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_RegularShape_ from '../src/ol/style/regularshape';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';
import _ol_style_Text_ from '../src/ol/style/text';


var earthquakeFill = new _ol_style_Fill_({
  color: 'rgba(255, 153, 0, 0.8)'
});
var earthquakeStroke = new _ol_style_Stroke_({
  color: 'rgba(255, 204, 0, 0.2)',
  width: 1
});
var textFill = new _ol_style_Fill_({
  color: '#fff'
});
var textStroke = new _ol_style_Stroke_({
  color: 'rgba(0, 0, 0, 0.6)',
  width: 3
});
var invisibleFill = new _ol_style_Fill_({
  color: 'rgba(255, 255, 255, 0.01)'
});

function createEarthquakeStyle(feature) {
  // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
  // standards-violating <magnitude> tag in each Placemark.  We extract it
  // from the Placemark's name instead.
  var name = feature.get('name');
  var magnitude = parseFloat(name.substr(2));
  var radius = 5 + 20 * (magnitude - 5);

  return new _ol_style_Style_({
    geometry: feature.getGeometry(),
    image: new _ol_style_RegularShape_({
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
    var extent = _ol_extent_.createEmpty();
    var j, jj;
    for (j = 0, jj = originalFeatures.length; j < jj; ++j) {
      _ol_extent_.extend(extent, originalFeatures[j].getGeometry().getExtent());
    }
    maxFeatureCount = Math.max(maxFeatureCount, jj);
    radius = 0.25 * (_ol_extent_.getWidth(extent) + _ol_extent_.getHeight(extent)) /
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
    style = new _ol_style_Style_({
      image: new _ol_style_Circle_({
        radius: feature.get('radius'),
        fill: new _ol_style_Fill_({
          color: [255, 153, 0, Math.min(0.8, 0.4 + (size / maxFeatureCount))]
        })
      }),
      text: new _ol_style_Text_({
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
  var styles = [new _ol_style_Style_({
    image: new _ol_style_Circle_({
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

vector = new _ol_layer_Vector_({
  source: new _ol_source_Cluster_({
    distance: 40,
    source: new _ol_source_Vector_({
      url: 'data/kml/2012_Earthquakes_Mag5.kml',
      format: new _ol_format_KML_({
        extractStyles: false
      })
    })
  }),
  style: styleFunction
});

var raster = new _ol_layer_Tile_({
  source: new _ol_source_Stamen_({
    layer: 'toner'
  })
});

var map = new _ol_Map_({
  layers: [raster, vector],
  interactions: _ol_interaction_.defaults().extend([new _ol_interaction_Select_({
    condition: function(evt) {
      return  evt.type == 'pointermove' ||
          evt.type == 'singleclick';
    },
    style: selectStyleFunction
  })]),
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});
