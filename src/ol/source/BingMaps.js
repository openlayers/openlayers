/**
 * @module ol/source/BingMaps
 */
import {inherits} from '../util.js';
import {createFromTileUrlFunctions} from '../tileurlfunction.js';
import {applyTransform, intersects} from '../extent.js';
import {jsonp as requestJSONP} from '../net.js';
import {get as getProjection, getTransformFromProjections} from '../proj.js';
import SourceState from '../source/State.js';
import TileImage from '../source/TileImage.js';
import {createOrUpdate, quadKey} from '../tilecoord.js';
import {createXYZ, extentFromProjection} from '../tilegrid.js';

/**
 * @typedef {Object} Options
 * @property {number} [cacheSize=2048] Cache size.
 * @property {boolean} [hidpi=false] If `true` hidpi tiles will be requested.
 * @property {string} [culture='en-us'] Culture code.
 * @property {string} key Bing Maps API key. Get yours at http://www.bingmapsportal.com/.
 * @property {string} imagerySet Type of imagery.
 * @property {number} [maxZoom=21] Max zoom. Default is what's advertized by the BingMaps service.
 * @property {number} [reprojectionErrorThreshold=0.5] Maximum allowed reprojection error (in pixels).
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {module:ol/Tile~LoadFunction} [tileLoadFunction] Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * @property {number} [transition] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 */

/**
 * @classdesc
 * Layer source for Bing Maps tile data.
 *
 * @constructor
 * @extends {module:ol/source/TileImage}
 * @param {module:ol/source/BingMaps~Options=} options Bing Maps options.
 * @api
 */
const BingMaps = function(options) {

  /**
   * @private
   * @type {boolean}
   */
  this.hidpi_ = options.hidpi !== undefined ? options.hidpi : false;

  TileImage.call(this, {
    cacheSize: options.cacheSize,
    crossOrigin: 'anonymous',
    opaque: true,
    projection: getProjection('EPSG:3857'),
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    state: SourceState.LOADING,
    tileLoadFunction: options.tileLoadFunction,
    tilePixelRatio: this.hidpi_ ? 2 : 1,
    wrapX: options.wrapX !== undefined ? options.wrapX : true,
    transition: options.transition
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

  const url = 'https://dev.virtualearth.net/REST/v1/Imagery/Metadata/' +
      this.imagerySet_ +
      '?uriScheme=https&include=ImageryProviders&key=' + this.apiKey_ +
      '&c=' + this.culture_;

  requestJSONP(url, this.handleImageryMetadataResponse.bind(this), undefined,
    'jsonp');

};

inherits(BingMaps, TileImage);


/**
 * The attribution containing a link to the Microsoft® Bing™ Maps Platform APIs’
 * Terms Of Use.
 * @const
 * @type {string}
 */
const TOS_ATTRIBUTION = '<a class="ol-attribution-bing-tos" ' +
      'href="https://www.microsoft.com/maps/product/terms.html">' +
      'Terms of Use</a>';


/**
 * Get the api key used for this source.
 *
 * @return {string} The api key.
 * @api
 */
BingMaps.prototype.getApiKey = function() {
  return this.apiKey_;
};


/**
 * Get the imagery set associated with this source.
 *
 * @return {string} The imagery set.
 * @api
 */
BingMaps.prototype.getImagerySet = function() {
  return this.imagerySet_;
};


/**
 * @param {BingMapsImageryMetadataResponse} response Response.
 */
BingMaps.prototype.handleImageryMetadataResponse = function(response) {
  if (response.statusCode != 200 ||
      response.statusDescription != 'OK' ||
      response.authenticationResultCode != 'ValidCredentials' ||
      response.resourceSets.length != 1 ||
      response.resourceSets[0].resources.length != 1) {
    this.setState(SourceState.ERROR);
    return;
  }

  const resource = response.resourceSets[0].resources[0];
  const maxZoom = this.maxZoom_ == -1 ? resource.zoomMax : this.maxZoom_;

  const sourceProjection = this.getProjection();
  const extent = extentFromProjection(sourceProjection);
  const tileSize = resource.imageWidth == resource.imageHeight ?
    resource.imageWidth : [resource.imageWidth, resource.imageHeight];
  const tileGrid = createXYZ({
    extent: extent,
    minZoom: resource.zoomMin,
    maxZoom: maxZoom,
    tileSize: tileSize / (this.hidpi_ ? 2 : 1)
  });
  this.tileGrid = tileGrid;

  const culture = this.culture_;
  const hidpi = this.hidpi_;
  this.tileUrlFunction = createFromTileUrlFunctions(
    resource.imageUrlSubdomains.map(function(subdomain) {
      const quadKeyTileCoord = [0, 0, 0];
      const imageUrl = resource.imageUrl
        .replace('{subdomain}', subdomain)
        .replace('{culture}', culture);
      return (
        /**
         * @param {module:ol/tilecoord~TileCoord} tileCoord Tile coordinate.
         * @param {number} pixelRatio Pixel ratio.
         * @param {module:ol/proj/Projection} projection Projection.
         * @return {string|undefined} Tile URL.
         */
        function(tileCoord, pixelRatio, projection) {
          if (!tileCoord) {
            return undefined;
          } else {
            createOrUpdate(tileCoord[0], tileCoord[1], -tileCoord[2] - 1, quadKeyTileCoord);
            let url = imageUrl;
            if (hidpi) {
              url += '&dpi=d1&device=mobile';
            }
            return url.replace('{quadkey}', quadKey(quadKeyTileCoord));
          }
        }
      );
    }));

  if (resource.imageryProviders) {
    const transform = getTransformFromProjections(
      getProjection('EPSG:4326'), this.getProjection());

    this.setAttributions(function(frameState) {
      const attributions = [];
      const zoom = frameState.viewState.zoom;
      resource.imageryProviders.map(function(imageryProvider) {
        let intersecting = false;
        const coverageAreas = imageryProvider.coverageAreas;
        for (let i = 0, ii = coverageAreas.length; i < ii; ++i) {
          const coverageArea = coverageAreas[i];
          if (zoom >= coverageArea.zoomMin && zoom <= coverageArea.zoomMax) {
            const bbox = coverageArea.bbox;
            const epsg4326Extent = [bbox[1], bbox[0], bbox[3], bbox[2]];
            const extent = applyTransform(epsg4326Extent, transform);
            if (intersects(extent, frameState.extent)) {
              intersecting = true;
              break;
            }
          }
        }
        if (intersecting) {
          attributions.push(imageryProvider.attribution);
        }
      });

      attributions.push(TOS_ATTRIBUTION);
      return attributions;
    });
  }

  this.setState(SourceState.READY);
};
export default BingMaps;
