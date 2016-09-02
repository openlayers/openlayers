goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.EsriJSON');
goog.require('ol.interaction');
goog.require('ol.interaction.Draw');
goog.require('ol.interaction.Modify');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.loadingstrategy');
goog.require('ol.proj');
goog.require('ol.source.Vector');
goog.require('ol.source.XYZ');
goog.require('ol.tilegrid');


var serviceUrl = 'http://services.arcgis.com/rOo16HdIMeOBI4Mb/arcgis/rest/' +
    'services/PDX_Pedestrian_Districts/FeatureServer/';
var layer = '0';

var esrijsonFormat = new ol.format.EsriJSON();

var vectorSource = new ol.source.Vector({
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
  strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
    tileSize: 512
  }))
});

var vector = new ol.layer.Vector({
  source: vectorSource
});

var raster = new ol.layer.Tile({
  source: new ol.source.XYZ({
    attributions: 'Tiles © <a href="http://services.arcgisonline.com/ArcGIS/' +
        'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
        'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
  })
});

var draw = new ol.interaction.Draw({
  source: vectorSource,
  type: /** @type {ol.geom.GeometryType} */ ('Polygon')
});

var select = new ol.interaction.Select();
select.setActive(false);
var selected = select.getFeatures();

var modify = new ol.interaction.Modify({
  features: selected
});
modify.setActive(false);

var map = new ol.Map({
  interactions: ol.interaction.defaults().extend([draw, select, modify]),
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new ol.View({
    center: ol.proj.transform([-122.619, 45.512], 'EPSG:4326', 'EPSG:3857'),
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
