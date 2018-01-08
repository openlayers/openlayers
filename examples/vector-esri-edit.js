import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import EsriJSON from '../src/ol/format/EsriJSON.js';
import {defaults as defaultInteractions} from '../src/ol/interaction.js';
import Draw from '../src/ol/interaction/Draw.js';
import _ol_interaction_Modify_ from '../src/ol/interaction/Modify.js';
import _ol_interaction_Select_ from '../src/ol/interaction/Select.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_loadingstrategy_ from '../src/ol/loadingstrategy.js';
import {fromLonLat} from '../src/ol/proj.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_source_XYZ_ from '../src/ol/source/XYZ.js';
import _ol_tilegrid_ from '../src/ol/tilegrid.js';


var serviceUrl = 'https://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/' +
    'services/PDX_Pedestrian_Districts/FeatureServer/';
var layer = '0';

var esrijsonFormat = new EsriJSON();

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
  source: vectorSource
});

var raster = new TileLayer({
  source: new _ol_source_XYZ_({
    attributions: 'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
        'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
        'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
  })
});

var draw = new Draw({
  source: vectorSource,
  type: 'Polygon'
});

var select = new _ol_interaction_Select_();
select.setActive(false);
var selected = select.getFeatures();

var modify = new _ol_interaction_Modify_({
  features: selected
});
modify.setActive(false);

var map = new Map({
  interactions: defaultInteractions().extend([draw, select, modify]),
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new View({
    center: fromLonLat([-122.619, 45.512]),
    zoom: 12
  })
});

var typeSelect = document.getElementById('type');


/**
 * Let user change the interaction type.
 */
typeSelect.onchange = function() {
  draw.setActive(typeSelect.value === 'DRAW');
  select.setActive(typeSelect.value === 'MODIFY');
  modify.setActive(typeSelect.value === 'MODIFY');
};

var dirty = {};

selected.on('add', function(evt) {
  var feature = evt.element;
  feature.on('change', function(evt) {
    dirty[evt.target.getId()] = true;
  });
});

selected.on('remove', function(evt) {
  var feature = evt.element;
  var fid = feature.getId();
  if (dirty[fid] === true) {
    var payload = '[' + esrijsonFormat.writeFeature(feature, {
      featureProjection: map.getView().getProjection()
    }) + ']';
    var url = serviceUrl + layer + '/updateFeatures';
    $.post(url, {f: 'json', features: payload}).done(function(data) {
      var result = JSON.parse(data);
      if (result.updateResults && result.updateResults.length > 0) {
        if (result.updateResults[0].success !== true) {
          var error = result.updateResults[0].error;
          alert(error.description + ' (' + error.code + ')');
        } else {
          delete dirty[fid];
        }
      }
    });
  }
});

draw.on('drawend', function(evt) {
  var feature = evt.feature;
  var payload = '[' + esrijsonFormat.writeFeature(feature, {
    featureProjection: map.getView().getProjection()
  }) + ']';
  var url = serviceUrl + layer + '/addFeatures';
  $.post(url, {f: 'json', features: payload}).done(function(data) {
    var result = JSON.parse(data);
    if (result.addResults && result.addResults.length > 0) {
      if (result.addResults[0].success === true) {
        feature.setId(result.addResults[0]['objectId']);
        vectorSource.clear();
      } else {
        var error = result.addResults[0].error;
        alert(error.description + ' (' + error.code + ')');
      }
    }
  });
});
