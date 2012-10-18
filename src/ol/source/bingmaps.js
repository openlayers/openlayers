goog.provide('ol.BingMapsStyle');
goog.provide('ol.source.BingMaps');

goog.require('goog.Uri');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.net.Jsonp');
goog.require('ol.TileCoverageArea');
goog.require('ol.source.TileSource');
goog.require('ol.tilegrid.XYZ');


/**
 * @enum {string}
 */
ol.BingMapsStyle = {
  AERIAL: 'Aerial',
  AERIAL_WITH_LABELS: 'AerialWithLabels',
  ROAD: 'Road',
  ORDNANCE_SURVEY: 'OrdnanceSurvey',
  COLLINS_BART: 'CollinsBart'
};



/**
 * @constructor
 * @extends {ol.source.TileSource}
 * @param {ol.source.BingMapsOptions} bingMapsOptions Bing Maps options.
 */
ol.source.BingMaps = function(bingMapsOptions) {

  goog.base(this, {
    projection: ol.Projection.getFromCode('EPSG:3857')
  });

  /**
   * @private
   * @type {string}
   */
  this.culture_ = goog.isDef(bingMapsOptions.culture) ?
      bingMapsOptions.culture : 'en-us';

  /**
   * @private
   * @type {boolean}
   */
  this.ready_ = false;

  var uri = new goog.Uri(
      '//dev.virtualearth.net/REST/v1/Imagery/Metadata/' +
      bingMapsOptions.style);
  var jsonp = new goog.net.Jsonp(uri, 'jsonp');
  jsonp.send({
    'include': 'ImageryProviders',
    'key': bingMapsOptions.key
  }, goog.bind(this.handleImageryMetadataResponse, this));

};
goog.inherits(ol.source.BingMaps, ol.source.TileSource);


/**
 * @param {BingMapsImageryMetadataResponse} response Response.
 */
ol.source.BingMaps.prototype.handleImageryMetadataResponse =
    function(response) {

  goog.asserts.assert(
      response.authenticationResultCode == 'ValidCredentials');
  goog.asserts.assert(response.statusCode == 200);
  goog.asserts.assert(response.statusDescription == 'OK');

  var brandLogoUri = response.brandLogoUri;
  var copyright = response.copyright;
  goog.asserts.assert(response.resourceSets.length == 1);
  var resourceSet = response.resourceSets[0];
  goog.asserts.assert(resourceSet.resources.length == 1);
  var resource = resourceSet.resources[0];

  var zoomMin = resource.zoomMin;
  var zoomMax = resource.zoomMax;
  var tileSize = new ol.Size(resource.imageWidth, resource.imageHeight);
  var tileGrid = new ol.tilegrid.XYZ({
    maxZoom: zoomMax,
    tileSize: tileSize
  });
  this.tileGrid = tileGrid;

  this.tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
      function(tileCoord) {
        if (tileCoord.z < zoomMin || zoomMax < tileCoord.z) {
          return null;
        }
        var n = 1 << tileCoord.z;
        var y = -tileCoord.y - 1;
        if (y < 0 || n <= y) {
          return null;
        } else {
          var x = goog.math.modulo(tileCoord.x, n);
          return new ol.TileCoord(tileCoord.z, x, y);
        }
      },
      ol.TileUrlFunction.createFromTileUrlFunctions(
          goog.array.map(
              resource.imageUrlSubdomains,
              function(subdomain) {
                var imageUrl = resource.imageUrl
                    .replace('{subdomain}', subdomain)
                    .replace('{culture}', this.culture_);
                return function(tileCoord) {
                  if (goog.isNull(tileCoord)) {
                    return undefined;
                  } else {
                    return imageUrl.replace(
                        '{quadkey}', tileCoord.quadKey());
                  }
                };
              })));

  var projection = ol.Projection.getFromCode('EPSG:4326');
  var attributions = goog.array.map(
      resource.imageryProviders,
      function(imageryProvider) {
        var html = imageryProvider.attribution;
        var coverageAreas = goog.array.map(
            imageryProvider.coverageAreas,
            function(coverageArea) {
              var bbox = coverageArea.bbox;
              var extent = new ol.Extent(bbox[1], bbox[0], bbox[3], bbox[2]);
              var minZ = coverageArea.zoomMin;
              var maxZ = coverageArea.zoomMax;
              return new ol.TileCoverageArea(tileGrid, extent, minZ, maxZ);
            });
        return new ol.Attribution(html, coverageAreas, projection);
      });
  this.setAttributions(attributions);

  this.ready_ = true;

  this.dispatchLoadEvent();

};


/**
 * @inheritDoc
 */
ol.source.BingMaps.prototype.isReady = function() {
  return this.ready_;
};
