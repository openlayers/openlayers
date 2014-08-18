goog.provide('ol.source.BingMaps');

goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.net.Jsonp');
goog.require('ol');
goog.require('ol.Attribution');
goog.require('ol.TileRange');
goog.require('ol.TileUrlFunction');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.State');
goog.require('ol.source.TileImage');
goog.require('ol.tilecoord');
goog.require('ol.tilegrid.XYZ');



/**
 * @classdesc
 * Layer source for Bing Maps tile data.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.BingMapsOptions} options Bing Maps options.
 * @api stable
 */
ol.source.BingMaps = function(options) {

  goog.base(this, {
    crossOrigin: 'anonymous',
    opaque: true,
    projection: ol.proj.get('EPSG:3857'),
    state: ol.source.State.LOADING,
    tileLoadFunction: options.tileLoadFunction
  });

  /**
   * @private
   * @type {string}
   */
  this.culture_ = goog.isDef(options.culture) ? options.culture : 'en-us';

  var protocol = ol.IS_HTTPS ? 'https:' : 'http:';
  var uri = new goog.Uri(
      protocol + '//dev.virtualearth.net/REST/v1/Imagery/Metadata/' +
      options.imagerySet);

  var jsonp = new goog.net.Jsonp(uri, 'jsonp');
  jsonp.send({
    'include': 'ImageryProviders',
    'key': options.key
  }, goog.bind(this.handleImageryMetadataResponse, this));

};
goog.inherits(ol.source.BingMaps, ol.source.TileImage);


/**
 * @const
 * @type {ol.Attribution}
 * @api
 */
ol.source.BingMaps.TOS_ATTRIBUTION = new ol.Attribution({
  html: '<a class="ol-attribution-bing-tos" target="_blank" ' +
      'href="http://www.microsoft.com/maps/product/terms.html">' +
      'Terms of Use</a>'
});


/**
 * @param {BingMapsImageryMetadataResponse} response Response.
 */
ol.source.BingMaps.prototype.handleImageryMetadataResponse =
    function(response) {

  if (response.statusCode != 200 ||
      response.statusDescription != 'OK' ||
      response.authenticationResultCode != 'ValidCredentials' ||
      response.resourceSets.length != 1 ||
      response.resourceSets[0].resources.length != 1) {
    this.setState(ol.source.State.ERROR);
    return;
  }

  var brandLogoUri = response.brandLogoUri;
  //var copyright = response.copyright;  // FIXME do we need to display this?
  var resource = response.resourceSets[0].resources[0];

  goog.asserts.assert(resource.imageWidth == resource.imageHeight);
  var sourceProjection = this.getProjection();
  var tileGrid = new ol.tilegrid.XYZ({
    extent: ol.tilegrid.extentFromProjection(sourceProjection),
    minZoom: resource.zoomMin,
    maxZoom: resource.zoomMax,
    tileSize: resource.imageWidth
  });
  this.tileGrid = tileGrid;

  var culture = this.culture_;
  this.tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
      tileGrid.createTileCoordTransform(),
      ol.TileUrlFunction.createFromTileUrlFunctions(
          goog.array.map(
              resource.imageUrlSubdomains,
              function(subdomain) {
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
                      goog.asserts.assert(ol.proj.equivalent(
                          projection, sourceProjection));
                      if (goog.isNull(tileCoord)) {
                        return undefined;
                      } else {
                        return imageUrl.replace(
                            '{quadkey}', ol.tilecoord.quadKey(tileCoord));
                      }
                    });
              })));

  if (resource.imageryProviders) {
    var transform = ol.proj.getTransformFromProjections(
        ol.proj.get('EPSG:4326'), this.getProjection());

    var attributions = goog.array.map(
        resource.imageryProviders,
        function(imageryProvider) {
          var html = imageryProvider.attribution;
          /** @type {Object.<string, Array.<ol.TileRange>>} */
          var tileRanges = {};
          goog.array.forEach(
              imageryProvider.coverageAreas,
              function(coverageArea) {
                var minZ = coverageArea.zoomMin;
                var maxZ = coverageArea.zoomMax;
                var bbox = coverageArea.bbox;
                var epsg4326Extent = [bbox[1], bbox[0], bbox[3], bbox[2]];
                var extent = ol.extent.applyTransform(
                    epsg4326Extent, transform);
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
          return new ol.Attribution({html: html, tileRanges: tileRanges});
        });
    attributions.push(ol.source.BingMaps.TOS_ATTRIBUTION);
    this.setAttributions(attributions);
  }

  this.setLogo(brandLogoUri);

  this.setState(ol.source.State.READY);

};
