import _ol_ from '../index';
import _ol_Attribution_ from '../attribution';
import _ol_TileUrlFunction_ from '../tileurlfunction';
import _ol_extent_ from '../extent';
import _ol_net_ from '../net';
import _ol_proj_ from '../proj';
import _ol_source_State_ from '../source/state';
import _ol_source_TileImage_ from '../source/tileimage';
import _ol_tilecoord_ from '../tilecoord';
import _ol_tilegrid_ from '../tilegrid';

/**
 * @classdesc
 * Layer source for Bing Maps tile data.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.BingMapsOptions} options Bing Maps options.
 * @api
 */
var _ol_source_BingMaps_ = function(options) {

  /**
   * @private
   * @type {boolean}
   */
  this.hidpi_ = options.hidpi !== undefined ? options.hidpi : false;

  _ol_source_TileImage_.call(this, {
    cacheSize: options.cacheSize,
    crossOrigin: 'anonymous',
    opaque: true,
    projection: _ol_proj_.get('EPSG:3857'),
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    state: _ol_source_State_.LOADING,
    tileLoadFunction: options.tileLoadFunction,
    tilePixelRatio: this.hidpi_ ? 2 : 1,
    wrapX: options.wrapX !== undefined ? options.wrapX : true
  });

  /**
   * @private
   * @type {string}
   */
  this.culture_ = options.culture !== undefined ? options.culture : 'en-us';

  /**
   * @private
   * @type {number}
   */
  this.maxZoom_ = options.maxZoom !== undefined ? options.maxZoom : -1;

  /**
   * @private
   * @type {string}
   */
  this.apiKey_ = options.key;

  /**
   * @private
   * @type {string}
   */
  this.imagerySet_ = options.imagerySet;

  var url = 'https://dev.virtualearth.net/REST/v1/Imagery/Metadata/' +
      this.imagerySet_ +
      '?uriScheme=https&include=ImageryProviders&key=' + this.apiKey_;

  _ol_net_.jsonp(url, this.handleImageryMetadataResponse.bind(this), undefined,
      'jsonp');

};

_ol_.inherits(_ol_source_BingMaps_, _ol_source_TileImage_);


/**
 * The attribution containing a link to the Microsoft® Bing™ Maps Platform APIs’
 * Terms Of Use.
 * @const
 * @type {ol.Attribution}
 * @api
 */
_ol_source_BingMaps_.TOS_ATTRIBUTION = new _ol_Attribution_({
  html: '<a class="ol-attribution-bing-tos" ' +
      'href="https://www.microsoft.com/maps/product/terms.html">' +
      'Terms of Use</a>'
});


/**
 * Get the api key used for this source.
 *
 * @return {string} The api key.
 * @api
 */
_ol_source_BingMaps_.prototype.getApiKey = function() {
  return this.apiKey_;
};


/**
 * Get the imagery set associated with this source.
 *
 * @return {string} The imagery set.
 * @api
 */
_ol_source_BingMaps_.prototype.getImagerySet = function() {
  return this.imagerySet_;
};


/**
 * @param {BingMapsImageryMetadataResponse} response Response.
 */
_ol_source_BingMaps_.prototype.handleImageryMetadataResponse = function(response) {
  if (response.statusCode != 200 ||
      response.statusDescription != 'OK' ||
      response.authenticationResultCode != 'ValidCredentials' ||
      response.resourceSets.length != 1 ||
      response.resourceSets[0].resources.length != 1) {
    this.setState(_ol_source_State_.ERROR);
    return;
  }

  var brandLogoUri = response.brandLogoUri;
  if (brandLogoUri.indexOf('https') == -1) {
    brandLogoUri = brandLogoUri.replace('http', 'https');
  }
  //var copyright = response.copyright;  // FIXME do we need to display this?
  var resource = response.resourceSets[0].resources[0];
  var maxZoom = this.maxZoom_ == -1 ? resource.zoomMax : this.maxZoom_;

  var sourceProjection = this.getProjection();
  var extent = _ol_tilegrid_.extentFromProjection(sourceProjection);
  var tileSize = resource.imageWidth == resource.imageHeight ?
    resource.imageWidth : [resource.imageWidth, resource.imageHeight];
  var tileGrid = _ol_tilegrid_.createXYZ({
    extent: extent,
    minZoom: resource.zoomMin,
    maxZoom: maxZoom,
    tileSize: tileSize / (this.hidpi_ ? 2 : 1)
  });
  this.tileGrid = tileGrid;

  var culture = this.culture_;
  var hidpi = this.hidpi_;
  this.tileUrlFunction = _ol_TileUrlFunction_.createFromTileUrlFunctions(
      resource.imageUrlSubdomains.map(function(subdomain) {
        var quadKeyTileCoord = [0, 0, 0];
        var imageUrl = resource.imageUrl
            .replace('{subdomain}', subdomain)
            .replace('{culture}', culture);
        return (
          /**
           * @param {ol.TileCoord} tileCoord Tile coordinate.
           * @param {number} pixelRatio Pixel ratio.
           * @param {ol.proj.Projection} projection Projection.
           * @return {string|undefined} Tile URL.
           */
          function(tileCoord, pixelRatio, projection) {
            if (!tileCoord) {
              return undefined;
            } else {
              _ol_tilecoord_.createOrUpdate(tileCoord[0], tileCoord[1],
                  -tileCoord[2] - 1, quadKeyTileCoord);
              var url = imageUrl;
              if (hidpi) {
                url += '&dpi=d1&device=mobile';
              }
              return url.replace('{quadkey}', _ol_tilecoord_.quadKey(
                  quadKeyTileCoord));
            }
          }
        );
      }));

  if (resource.imageryProviders) {
    var transform = _ol_proj_.getTransformFromProjections(
        _ol_proj_.get('EPSG:4326'), this.getProjection());

    var attributions = resource.imageryProviders.map(function(imageryProvider) {
      var html = imageryProvider.attribution;
      /** @type {Object.<string, Array.<ol.TileRange>>} */
      var tileRanges = {};
      imageryProvider.coverageAreas.forEach(function(coverageArea) {
        var minZ = coverageArea.zoomMin;
        var maxZ = Math.min(coverageArea.zoomMax, maxZoom);
        var bbox = coverageArea.bbox;
        var epsg4326Extent = [bbox[1], bbox[0], bbox[3], bbox[2]];
        var extent = _ol_extent_.applyTransform(epsg4326Extent, transform);
        var tileRange, z, zKey;
        for (z = minZ; z <= maxZ; ++z) {
          zKey = z.toString();
          tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);
          if (zKey in tileRanges) {
            tileRanges[zKey].push(tileRange);
          } else {
            tileRanges[zKey] = [tileRange];
          }
        }
      });
      return new _ol_Attribution_({html: html, tileRanges: tileRanges});
    });
    attributions.push(_ol_source_BingMaps_.TOS_ATTRIBUTION);
    this.setAttributions(attributions);
  }

  this.setLogo(brandLogoUri);

  this.setState(_ol_source_State_.READY);
};
export default _ol_source_BingMaps_;
