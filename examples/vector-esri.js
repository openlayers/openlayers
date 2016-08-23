goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.EsriJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.loadingstrategy');
goog.require('ol.proj');
goog.require('ol.source.Vector');
goog.require('ol.source.XYZ');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.tilegrid');


var serviceUrl = 'http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/' +
    'Petroleum/KSFields/FeatureServer/';
var layer = '0';

var esrijsonFormat = new ol.format.EsriJSON();

var styleCache = {
  'ABANDONED': new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(225, 225, 225, 255)'
    }),
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 0, 0, 255)',
      width: 0.4
    })
  }),
  'GAS': new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 0, 0, 255)'
    }),
    stroke: new ol.style.Stroke({
      color: 'rgba(110, 110, 110, 255)',
      width: 0.4
    })
  }),
  'OIL': new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(56, 168, 0, 255)'
    }),
    stroke: new ol.style.Stroke({
      color: 'rgba(110, 110, 110, 255)',
      width: 0
    })
  }),
  'OILGAS': new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(168, 112, 0, 255)'
    }),
    stroke: new ol.style.Stroke({
      color: 'rgba(110, 110, 110, 255)',
      width: 0.4
    })
  })
};

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
  source: vectorSource,
  style: function(feature) {
    var classify = feature.get('activeprod');
    return styleCache[classify];
  }
});

var raster = new ol.layer.Tile({
  source: new ol.source.XYZ({
    attributions: 'Tiles © <a href="http://services.arcgisonline.com/ArcGIS/' +
        'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
        'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new ol.View({
    center: ol.proj.transform([-97.6114, 38.8403], 'EPSG:4326', 'EPSG:3857'),
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
