import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_format_GPX_ from '../src/ol/format/gpx';
import _ol_format_GeoJSON_ from '../src/ol/format/geojson';
import _ol_format_IGC_ from '../src/ol/format/igc';
import _ol_format_KML_ from '../src/ol/format/kml';
import _ol_format_TopoJSON_ from '../src/ol/format/topojson';
import _ol_interaction_ from '../src/ol/interaction';
import _ol_interaction_DragAndDrop_ from '../src/ol/interaction/draganddrop';
import _ol_layer_Image_ from '../src/ol/layer/image';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_BingMaps_ from '../src/ol/source/bingmaps';
import _ol_source_ImageVector_ from '../src/ol/source/imagevector';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Circle_ from '../src/ol/style/circle';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';


var defaultStyle = {
  'Point': new _ol_style_Style_({
    image: new _ol_style_Circle_({
      fill: new _ol_style_Fill_({
        color: 'rgba(255,255,0,0.5)'
      }),
      radius: 5,
      stroke: new _ol_style_Stroke_({
        color: '#ff0',
        width: 1
      })
    })
  }),
  'LineString': new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: '#f00',
      width: 3
    })
  }),
  'Polygon': new _ol_style_Style_({
    fill: new _ol_style_Fill_({
      color: 'rgba(0,255,255,0.5)'
    }),
    stroke: new _ol_style_Stroke_({
      color: '#0ff',
      width: 1
    })
  }),
  'MultiPoint': new _ol_style_Style_({
    image: new _ol_style_Circle_({
      fill: new _ol_style_Fill_({
        color: 'rgba(255,0,255,0.5)'
      }),
      radius: 5,
      stroke: new _ol_style_Stroke_({
        color: '#f0f',
        width: 1
      })
    })
  }),
  'MultiLineString': new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: '#0f0',
      width: 3
    })
  }),
  'MultiPolygon': new _ol_style_Style_({
    fill: new _ol_style_Fill_({
      color: 'rgba(0,0,255,0.5)'
    }),
    stroke: new _ol_style_Stroke_({
      color: '#00f',
      width: 1
    })
  })
};

var styleFunction = function(feature, resolution) {
  var featureStyleFunction = feature.getStyleFunction();
  if (featureStyleFunction) {
    return featureStyleFunction.call(feature, resolution);
  } else {
    return defaultStyle[feature.getGeometry().getType()];
  }
};

var dragAndDropInteraction = new _ol_interaction_DragAndDrop_({
  formatConstructors: [
    _ol_format_GPX_,
    _ol_format_GeoJSON_,
    _ol_format_IGC_,
    _ol_format_KML_,
    _ol_format_TopoJSON_
  ]
});

var map = new _ol_Map_({
  interactions: _ol_interaction_.defaults().extend([dragAndDropInteraction]),
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_BingMaps_({
        imagerySet: 'Aerial',
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5'
      })
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});

dragAndDropInteraction.on('addfeatures', function(event) {
  var vectorSource = new _ol_source_Vector_({
    features: event.features
  });
  map.addLayer(new _ol_layer_Image_({
    source: new _ol_source_ImageVector_({
      source: vectorSource,
      style: styleFunction
    })
  }));
  map.getView().fit(vectorSource.getExtent());
});

var displayFeatureInfo = function(pixel) {
  var features = [];
  map.forEachFeatureAtPixel(pixel, function(feature) {
    features.push(feature);
  });
  if (features.length > 0) {
    var info = [];
    var i, ii;
    for (i = 0, ii = features.length; i < ii; ++i) {
      info.push(features[i].get('name'));
    }
    document.getElementById('info').innerHTML = info.join(', ') || '&nbsp';
  } else {
    document.getElementById('info').innerHTML = '&nbsp;';
  }
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function(evt) {
  displayFeatureInfo(evt.pixel);
});
