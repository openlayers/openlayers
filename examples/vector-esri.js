import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import EsriJSON from '../src/ol/format/EsriJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_loadingstrategy_ from '../src/ol/loadingstrategy.js';
import {fromLonLat} from '../src/ol/proj.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_source_XYZ_ from '../src/ol/source/XYZ.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';
import _ol_tilegrid_ from '../src/ol/tilegrid.js';


var serviceUrl = 'https://sampleserver3.arcgisonline.com/ArcGIS/rest/services/' +
    'Petroleum/KSFields/FeatureServer/';
var layer = '0';

var esrijsonFormat = new EsriJSON();

var styleCache = {
  'ABANDONED': new _ol_style_Style_({
    fill: new _ol_style_Fill_({
      color: 'rgba(225, 225, 225, 255)'
    }),
    stroke: new _ol_style_Stroke_({
      color: 'rgba(0, 0, 0, 255)',
      width: 0.4
    })
  }),
  'GAS': new _ol_style_Style_({
    fill: new _ol_style_Fill_({
      color: 'rgba(255, 0, 0, 255)'
    }),
    stroke: new _ol_style_Stroke_({
      color: 'rgba(110, 110, 110, 255)',
      width: 0.4
    })
  }),
  'OIL': new _ol_style_Style_({
    fill: new _ol_style_Fill_({
      color: 'rgba(56, 168, 0, 255)'
    }),
    stroke: new _ol_style_Stroke_({
      color: 'rgba(110, 110, 110, 255)',
      width: 0
    })
  }),
  'OILGAS': new _ol_style_Style_({
    fill: new _ol_style_Fill_({
      color: 'rgba(168, 112, 0, 255)'
    }),
    stroke: new _ol_style_Stroke_({
      color: 'rgba(110, 110, 110, 255)',
      width: 0.4
    })
  })
};

var vectorSource = new _ol_source_Vector_({
  loader: function(extent, resolution, projection) {
    var url = serviceUrl + layer + '/query/?f=json&' +
        'returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry=' +
        encodeURIComponent('{"xmin":' + extent[0] + ',"ymin":' +
            extent[1] + ',"xmax":' + extent[2] + ',"ymax":' + extent[3] +
            ',"spatialReference":{"wkid":102100}}') +
        '&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*' +
        '&outSR=102100';
    $.ajax({url: url, dataType: 'jsonp', success: function(response) {
      if (response.error) {
        alert(response.error.message + '\n' +
            response.error.details.join('\n'));
      } else {
        // dataProjection will be read from document
        var features = esrijsonFormat.readFeatures(response, {
          featureProjection: projection
        });
        if (features.length > 0) {
          vectorSource.addFeatures(features);
        }
      }
    }});
  },
  strategy: _ol_loadingstrategy_.tile(_ol_tilegrid_.createXYZ({
    tileSize: 512
  }))
});

var vector = new _ol_layer_Vector_({
  source: vectorSource,
  style: function(feature) {
    var classify = feature.get('activeprod');
    return styleCache[classify];
  }
});

var raster = new TileLayer({
  source: new _ol_source_XYZ_({
    attributions: 'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
        'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
        'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
  })
});

var map = new _ol_Map_({
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new _ol_View_({
    center: fromLonLat([-97.6114, 38.8403]),
    zoom: 7
  })
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
      info.push(features[i].get('field_name'));
    }
    document.getElementById('info').innerHTML = info.join(', ') || '(unknown)';
    map.getTarget().style.cursor = 'pointer';
  } else {
    document.getElementById('info').innerHTML = '&nbsp;';
    map.getTarget().style.cursor = '';
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
