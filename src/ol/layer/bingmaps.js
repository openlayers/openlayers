goog.provide('ol.layer.BingMaps');
goog.provide('ol.tilesource.BingMaps');

goog.require('goog.Uri');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.net.Jsonp');
goog.require('ol.TileCoverageArea');
goog.require('ol.TileSource');
goog.require('ol.layer.TileLayer');
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
 * @extends {ol.layer.TileLayer}
 * @param {ol.BingMapsStyle} style Bing Maps style.
 * @param {string} key Key.
 * @param {string=} opt_culture Culture.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.layer.BingMaps = function(style, key, opt_culture, opt_values) {
  var tileSource = new ol.tilesource.BingMaps(style, key, opt_culture,
      function(tileSource) {
        this.dispatchEvent(goog.events.EventType.LOAD);
      }, this);
  goog.base(this, tileSource, opt_values);
};
goog.inherits(ol.layer.BingMaps, ol.layer.TileLayer);



/**
 * @constructor
 * @extends {ol.TileSource}
 * @param {ol.BingMapsStyle} style Bing Maps style.
 * @param {string} key Key.
 * @param {string=} opt_culture Culture.
 * @param {?function(ol.tilesource.BingMaps)=} opt_callback Callback.
 * @param {*=} opt_obj Object.
 */
ol.tilesource.BingMaps =
    function(style, key, opt_culture, opt_callback, opt_obj) {

  /**
   * @private
   * @type {string}
   */
  this.culture_ = opt_culture || 'en-us';

  /**
   * @private
   * @type {boolean}
   */
  this.ready_ = false;

  /**
   * @private
   * @type {?function(ol.tilesource.BingMaps)}
   */
  this.callback_ = opt_callback || null;

  /**
   * @private
   * @type {*}
   */
  this.object_ = opt_obj;

  var uri = new goog.Uri(
      'http://dev.virtualearth.net/REST/v1/Imagery/Metadata/' + style);
  var jsonp = new goog.net.Jsonp(uri, 'jsonp');
  jsonp.send({
    'include': 'ImageryProviders',
    'key': key
  }, goog.bind(this.handleImageryMetadataResponse, this));

  var projection = ol.Projection.getFromCode('EPSG:3857');
  var extent = projection.getExtent();

  goog.base(
      this, projection, null, ol.TileUrlFunction.nullTileUrlFunction, extent);

};
goog.inherits(ol.tilesource.BingMaps, ol.TileSource);


/**
 * @param {BingMapsImageryMetadataResponse} response Response.
 */
ol.tilesource.BingMaps.prototype.handleImageryMetadataResponse =
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
  var tileGrid = new ol.tilegrid.XYZ(zoomMax, tileSize);
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

  if (!goog.isNull(this.callback_)) {
    this.callback_.call(this.object_, this);
    this.callback_ = null;
    this.object_ = null;
  }

};


/**
 * @inheritDoc
 */
ol.tilesource.BingMaps.prototype.isReady = function() {
  return this.ready_;
};
