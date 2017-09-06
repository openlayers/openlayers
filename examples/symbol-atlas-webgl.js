import _ol_Feature_ from '../src/ol/feature';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_geom_Point_ from '../src/ol/geom/point';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_AtlasManager_ from '../src/ol/style/atlasmanager';
import _ol_style_Circle_ from '../src/ol/style/circle';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_RegularShape_ from '../src/ol/style/regularshape';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';

var atlasManager = new _ol_style_AtlasManager_({
  // we increase the initial size so that all symbols fit into
  // a single atlas image
  initialSize: 512
});

var symbolInfo = [{
  opacity: 1.0,
  scale: 1.0,
  fillColor: 'rgba(255, 153, 0, 0.4)',
  strokeColor: 'rgba(255, 204, 0, 0.2)'
}, {
  opacity: 0.75,
  scale: 1.25,
  fillColor: 'rgba(70, 80, 224, 0.4)',
  strokeColor: 'rgba(12, 21, 138, 0.2)'
}, {
  opacity: 0.5,
  scale: 1.5,
  fillColor: 'rgba(66, 150, 79, 0.4)',
  strokeColor: 'rgba(20, 99, 32, 0.2)'
}, {
  opacity: 1.0,
  scale: 1.0,
  fillColor: 'rgba(176, 61, 35, 0.4)',
  strokeColor: 'rgba(145, 43, 20, 0.2)'
}];

var radiuses = [3, 6, 9, 15, 19, 25];
var symbolCount = symbolInfo.length * radiuses.length * 2;
var symbols = [];
var i, j;
for (i = 0; i < symbolInfo.length; ++i) {
  var info = symbolInfo[i];
  for (j = 0; j < radiuses.length; ++j) {
    // circle symbol
    symbols.push(new _ol_style_Circle_({
      opacity: info.opacity,
      scale: info.scale,
      radius: radiuses[j],
      fill: new _ol_style_Fill_({
        color: info.fillColor
      }),
      stroke: new _ol_style_Stroke_({
        color: info.strokeColor,
        width: 1
      }),
      // by passing the atlas manager to the symbol,
      // the symbol will be added to an atlas
      atlasManager: atlasManager
    }));

    // star symbol
    symbols.push(new _ol_style_RegularShape_({
      points: 8,
      opacity: info.opacity,
      scale: info.scale,
      radius: radiuses[j],
      radius2: radiuses[j] * 0.7,
      angle: 1.4,
      fill: new _ol_style_Fill_({
        color: info.fillColor
      }),
      stroke: new _ol_style_Stroke_({
        color: info.strokeColor,
        width: 1
      }),
      atlasManager: atlasManager
    }));
  }
}

var featureCount = 50000;
var features = new Array(featureCount);
var feature, geometry;
var e = 25000000;
for (i = 0; i < featureCount; ++i) {
  geometry = new _ol_geom_Point_(
      [2 * e * Math.random() - e, 2 * e * Math.random() - e]);
  feature = new _ol_Feature_(geometry);
  feature.setStyle(
      new _ol_style_Style_({
        image: symbols[i % symbolCount]
      })
  );
  features[i] = feature;
}

var vectorSource = new _ol_source_Vector_({
  features: features
});
var vector = new _ol_layer_Vector_({
  source: vectorSource
});

var map = new _ol_Map_({
  renderer: /** @type {Array<ol.renderer.Type>} */ (['webgl', 'canvas']),
  layers: [vector],
  target: document.getElementById('map'),
  view: new _ol_View_({
    center: [0, 0],
    zoom: 4
  })
});
