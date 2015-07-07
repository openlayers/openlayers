goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.control.MousePosition');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.source.TileArcGISRest');
goog.require('ol.source.XYZ');
goog.require('ol.tilegrid.TileGrid');

var map;

var getResolutionsFromConfig = function(config) {
  var tileInfo = config['tileInfo'];
  if (tileInfo) {
    var resolutions = [];
    for (var i = 0, ii = tileInfo.lods.length; i < ii; ++i) {
      resolutions.push(tileInfo.lods[i].resolution);
    }
    return resolutions;
  }
};

var getProjectionFromConfig = function(config) {
  var epsg = 'EPSG:' + config.spatialReference.wkid;
  var units = config.units === 'esriMeters' ? 'm' : 'degrees';
  var projection = ol.proj.get(epsg) ? ol.proj.get(epsg) :
      new ol.proj.Projection({code: epsg, units: units});
  return projection;
};

var createXYZSource = function(config, serviceUrl, attributions, projection,
    resolutions) {
  var tileInfo = config['tileInfo'];
  var tileSize = [
    tileInfo.width || tileInfo.cols,
    tileInfo.height || tileInfo.rows
  ];
  var tileOrigin = [
    tileInfo.origin.x,
    tileInfo.origin.y
  ];
  var urls;
  var suffix = '/tile/{z}/{y}/{x}';
  if (config.tileServers) {
    urls = config.tileServers;
    for (var i = 0, ii = urls.length; i < ii; ++i) {
      urls[i] += suffix;
    }
  } else {
    urls = [serviceUrl += suffix];
  }
  var width = tileSize[0] * resolutions[0];
  var height = tileSize[1] * resolutions[0];
  var tileUrlFunction, extent, tileGrid;
  if (projection.getCode() === 'EPSG:4326') {
    tileUrlFunction = function(tileCoord) {
      var url = urls.length === 1 ? urls[0] :
          urls[Math.floor(Math.random() * (urls.length - 0 + 1)) + 0];
      return url.replace('{z}', (tileCoord[0] - 1).toString())
          .replace('{x}', tileCoord[1].toString())
          .replace('{y}', (-tileCoord[2] - 1).toString());
    };
  } else {
    extent = [
      tileOrigin[0],
      tileOrigin[1] - height,
      tileOrigin[0] + width,
      tileOrigin[1]
    ];
    tileGrid = new ol.tilegrid.TileGrid({
      origin: tileOrigin,
      resolutions: resolutions
    });
  }
  return {
    extent: extent,
    source: new ol.source.XYZ({
      attributions: attributions,
      projection: projection,
      extent: extent,
      tileSize: tileSize,
      tileGrid: tileGrid,
      tileUrlFunction: tileUrlFunction,
      urls: urls
    })
  };
};

var createArcGISRestSource = function(attributions, serviceUrl) {
  return {
    source: new ol.source.TileArcGISRest({
      url: serviceUrl,
      attributions: attributions
    })
  };
};

var createLayerFromConfig = function(config, serviceUrl, projection,
    resolutions) {
  var attributions = [
    new ol.Attribution({
      html: config['copyrightText']
    })
  ];
  var sourceInfo;
  if (config.tileInfo) {
    sourceInfo = createXYZSource(config, serviceUrl, attributions, projection,
        resolutions);
  } else {
    sourceInfo = createArcGISRestSource(attributions, serviceUrl);
  }
  return new ol.layer.Tile({
    source: sourceInfo.source,
    extent: sourceInfo.extent
  });
};

document.getElementById('get-caps').addEventListener('click', function() {
  var capsUrl = document.getElementById('caps-url').value;
  if (capsUrl.charAt(capsUrl.length - 1) === '?') {
    capsUrl = capsUrl.substring(0, capsUrl.length - 1);
  }
  $.ajax({
    url: capsUrl,
    jsonp: 'callback',
    dataType: 'jsonp',
    data: {
      f: 'json'
    },
    success: function(config) {
      if (config.error) {
        alert(config.error.message + '\n' +
            config.error.details.join('\n'));
      } else {
        var projection = getProjectionFromConfig(config);
        var resolutions = getResolutionsFromConfig(config);
        var layer = createLayerFromConfig(config, capsUrl, projection,
            resolutions);
        var fullExtent = [
          config['fullExtent']['xmin'],
          config['fullExtent']['ymin'],
          config['fullExtent']['xmax'],
          config['fullExtent']['ymax']
        ];
        if (!map) {
          map = new ol.Map({
            controls: ol.control.defaults().extend([
              new ol.control.MousePosition()]),
            layers: [layer],
            target: 'map',
            view: new ol.View({
              resolutions: resolutions,
              projection: projection
            })
          });
        } else {
          map.getLayers().clear();
          map.setView(new ol.View({
            resolutions: resolutions,
            projection: projection
          }));
          map.addLayer(layer);
        }
        map.getView().fit(fullExtent, /** @type {ol.Size} */(map.getSize()));
      }
    }
  });
});
