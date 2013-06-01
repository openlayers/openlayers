goog.provide('ol.source.BingMaps');

goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.net.Jsonp');
goog.require('ol.Attribution');
goog.require('ol.TileRange');
goog.require('ol.TileUrlFunction');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.ImageTileSource');
goog.require('ol.tilegrid.XYZ');



/**
 * @constructor
 * @extends {ol.source.ImageTileSource}
 * @param {ol.source.BingMapsOptions} options Bing Maps options.
 */
ol.source.BingMaps = function(options) {

  goog.base(this, {
    crossOrigin: 'anonymous',
    opaque: true,
    projection: ol.proj.get('EPSG:3857')
  });

  /**
   * @private
   * @type {string}
   */
  this.culture_ = goog.isDef(options.culture) ? options.culture : 'en-us';

  /**
   * @private
   * @type {boolean}
   */
  this.ready_ = false;

  var uri = new goog.Uri(
      '//dev.virtualearth.net/REST/v1/Imagery/Metadata/' + options.style);
  var jsonp = new goog.net.Jsonp(uri, 'jsonp');
  jsonp.send({
    'include': 'ImageryProviders',
    'key': options.key
  }, goog.bind(this.handleImageryMetadataResponse, this));

};
goog.inherits(ol.source.BingMaps, ol.source.ImageTileSource);


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
  //var copyright = response.copyright;  // FIXME do we need to display this?
  goog.asserts.assert(response.resourceSets.length == 1);
  var resourceSet = response.resourceSets[0];
  goog.asserts.assert(resourceSet.resources.length == 1);
  var resource = resourceSet.resources[0];

  var tileGrid = new ol.tilegrid.XYZ({
    minZoom: resource.zoomMin,
    maxZoom: resource.zoomMax,
    tileSize: [resource.imageWidth, resource.imageHeight]
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
                     * @param {ol.Projection} projection Projection.
                     * @return {string|undefined} Tile URL.
                     */
                    function(tileCoord, projection) {
                      goog.asserts.assert(ol.proj.equivalent(
                          projection, this.getProjection()));
                      if (goog.isNull(tileCoord)) {
                        return undefined;
                      } else {
                        return imageUrl.replace(
                            '{quadkey}', tileCoord.quadKey());
                      }
                    });
              })));

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
              var epsg4326Extent = [bbox[1], bbox[3], bbox[0], bbox[2]];
              var extent = ol.extent.transform(epsg4326Extent, transform);
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
        return new ol.Attribution(html, tileRanges);
      });
  this.setAttributions(attributions);

  this.setLogo(brandLogoUri);

  this.ready_ = true;

  this.dispatchLoadEvent();

};


/**
 * @inheritDoc
 */
ol.source.BingMaps.prototype.isReady = function() {
  return this.ready_;
};
