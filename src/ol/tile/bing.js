// FIXME handle minZoom/maxZoom in getAttributions
// FIXME optimize getAttributions (precalculate transformed coverage areas)

goog.provide('ol.layer.BingMaps');
goog.provide('ol.tilestore.BingMaps');

goog.require('goog.Uri');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.net.Jsonp');
goog.require('ol.TileLayer');
goog.require('ol.TileStore');
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
 * @extends {ol.TileLayer}
 * @param {ol.BingMapsStyle} style Bing Maps style.
 * @param {string} key Key.
 * @param {string=} opt_culture Culture.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.layer.BingMaps = function(style, key, opt_culture, opt_values) {
  var tileStore = new ol.tilestore.BingMaps(style, key, opt_culture,
      function(tileStore) {
        this.dispatchEvent(goog.events.EventType.LOAD);
      }, this);
  goog.base(this, tileStore, opt_values);
};
goog.inherits(ol.layer.BingMaps, ol.TileLayer);



/**
 * @constructor
 * @extends {ol.TileStore}
 * @param {ol.BingMapsStyle} style Bing Maps style.
 * @param {string} key Key.
 * @param {string=} opt_culture Culture.
 * @param {?function(ol.tilestore.BingMaps)=} opt_callback Callback.
 * @param {*=} opt_obj Object.
 */
ol.tilestore.BingMaps =
    function(style, key, opt_culture, opt_callback, opt_obj) {

  /**
   * @private
   * @type {string}
   */
  this.culture_ = goog.isDef(opt_culture) ? opt_culture : 'en-us';

  /**
   * @private
   * @type {Array.<BingMapsImageryProvider>}
   */
  this.imageryProviders_ = null;

  /**
   * @private
   * @type {boolean}
   */
  this.ready_ = false;

  /**
   * @private
   * @type {?function(ol.tilestore.BingMaps)}
   */
  this.callback_ = goog.isDef(opt_callback) ? opt_callback : null;

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

  /**
   * @private
   * @type {ol.TransformFunction}
   */
  this.attributionTransform_ = ol.Projection.getTransform(
      ol.Projection.getFromCode('EPSG:4326'), projection);

  goog.base(
      this, projection, null, ol.TileUrlFunction.nullTileUrlFunction, extent);

};
goog.inherits(ol.tilestore.BingMaps, ol.TileStore);


/**
 * @inheritDoc
 */
ol.tilestore.BingMaps.prototype.getAttributions = function(extent, resolution) {
  if (this.isReady()) {
    var attributions = [];
    goog.array.forEach(this.imageryProviders_, function(imageryProvider) {
      var include = goog.array.some(
          imageryProvider.coverageAreas,
          function(coverageArea) {
            var epsg4326CoverageAreaExtent = new ol.Extent(
                coverageArea.bbox[0], coverageArea.bbox[1],
                coverageArea.bbox[2], coverageArea.bbox[3]);
            var coverageAreaExtent = epsg4326CoverageAreaExtent.transform(
                this.attributionTransform_);
            return coverageAreaExtent.intersects(extent);
          });
      if (include) {
        attributions.push(imageryProvider.attribution);
      }
    });
    return attributions;
  } else {
    return [];
  }
};


/**
 * @param {BingMapsImageryMetadataResponse} response Response.
 */
ol.tilestore.BingMaps.prototype.handleImageryMetadataResponse =
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
  this.tileGrid = new ol.tilegrid.XYZ(zoomMax, tileSize);

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

  this.imageryProviders_ = resource.imageryProviders;

  this.ready_ = true;

  if (!goog.isNull(this.callback_)) {
    this.callback_.call(this.object_, this);
  }

};


/**
 * @inheritDoc
 */
ol.tilestore.BingMaps.prototype.isReady = function() {
  return this.ready_;
};
