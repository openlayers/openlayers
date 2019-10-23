/**
 * @module ol/source/BingMaps
 */

import {createFromTileUrlFunctions} from '../tileurlfunction.js';
import {applyTransform, intersects} from '../extent.js';
import {jsonp as requestJSONP} from '../net.js';
import {get as getProjection, getTransformFromProjections} from '../proj.js';
import SourceState from './State.js';
import TileImage from './TileImage.js';
import {createOrUpdate} from '../tilecoord.js';
import {createXYZ, extentFromProjection} from '../tilegrid.js';


/**
 * @param {import('../tilecoord.js').TileCoord} tileCoord Tile coord.
 * @return {string} Quad key.
 */
export function quadKey(tileCoord) {
  const z = tileCoord[0];
  const digits = new Array(z);
  let mask = 1 << (z - 1);
  let i, charCode;
  for (i = 0; i < z; ++i) {
    // 48 is charCode for 0 - '0'.charCodeAt(0)
    charCode = 48;
    if (tileCoord[1] & mask) {
      charCode += 1;
    }
    if (tileCoord[2] & mask) {
      charCode += 2;
    }
    digits[i] = String.fromCharCode(charCode);
    mask >>= 1;
  }
  return digits.join('');
}


/**
 * The attribution containing a link to the Microsoft® Bing™ Maps Platform APIs’
 * Terms Of Use.
 * @const
 * @type {string}
 */
const TOS_ATTRIBUTION = '<a class="ol-attribution-bing-tos" ' +
      'href="https://www.microsoft.com/maps/product/terms.html" target="_blank">' +
      'Terms of Use</a>';


/**
 * @typedef {Object} Options
 * @property {number} [cacheSize] Tile cache size. The default depends on the screen size. Will increase if too small.
 * @property {boolean} [hidpi=false] If `true` hidpi tiles will be requested.
 * @property {string} [culture='en-us'] Culture code.
 * @property {string} key Bing Maps API key. Get yours at http://www.bingmapsportal.com/.
 * @property {string} imagerySet Type of imagery.
 * @property {number} [maxZoom=21] Max zoom. Default is what's advertized by the BingMaps service.
 * @property {number} [reprojectionErrorThreshold=0.5] Maximum allowed reprojection error (in pixels).
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {import("../Tile.js").LoadFunction} [tileLoadFunction] Optional function to load a tile given a URL. The default is
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
 * @typedef {Object} BingMapsImageryMetadataResponse
 * @property {number} statusCode The response status code
 * @property {string} statusDescription The response status description
 * @property {string} authenticationResultCode The authentication result code
 * @property {Array<ResourceSet>} resourceSets The array of resource sets
 */


/**
 * @typedef {Object} ResourceSet
 * @property {Array<Resource>} resources
 */


/**
 * @typedef {Object} Resource
 * @property {number} imageHeight The image height
 * @property {number} imageWidth The image width
 * @property {number} zoomMin The minimum zoom level
 * @property {number} zoomMax The maximum zoom level
 * @property {string} imageUrl The image URL
 * @property {Array<string>} imageUrlSubdomains The image URL subdomains for rotation
 * @property {Array<ImageryProvider>} [imageryProviders] The array of ImageryProviders
 */


/**
 * @typedef {Object} ImageryProvider
 * @property {Array<CoverageArea>} coverageAreas The coverage areas
 * @property {string} [attribution] The attribution
 */


/**
 * @typedef {Object} CoverageArea
 * @property {number} zoomMin The minimum zoom
 * @property {number} zoomMax The maximum zoom
 * @property {Array<number>} bbox The coverage bounding box
 */


/**
 * @classdesc
 * Layer source for Bing Maps tile data.
 * @api
 */
class BingMaps extends TileImage {
  /**
   * @param {Options} options Bing Maps options.
   */
  constructor(options) {

    const hidpi = options.hidpi !== undefined ? options.hidpi : false;

    super({
      cacheSize: options.cacheSize,
      crossOrigin: 'anonymous',
      opaque: true,
      projection: getProjection('EPSG:3857'),
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      state: SourceState.LOADING,
      tileLoadFunction: options.tileLoadFunction,
      tilePixelRatio: hidpi ? 2 : 1,
      wrapX: options.wrapX !== undefined ? options.wrapX : true,
      transition: options.transition
    });

    /**
     * @private
     * @type {boolean}
     */
    this.hidpi_ = hidpi;


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

  }

  /**
   * Get the api key used for this source.
   *
   * @return {string} The api key.
   * @api
   */
  getApiKey() {
    return this.apiKey_;
  }

  /**
   * Get the imagery set associated with this source.
   *
   * @return {string} The imagery set.
   * @api
   */
  getImagerySet() {
    return this.imagerySet_;
  }

  /**
   * @param {BingMapsImageryMetadataResponse} response Response.
   */
  handleImageryMetadataResponse(response) {
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
    const scale = this.hidpi_ ? 2 : 1;
    const tileSize = resource.imageWidth == resource.imageHeight ?
      resource.imageWidth / scale :
      [resource.imageWidth / scale, resource.imageHeight / scale];

    const tileGrid = createXYZ({
      extent: extent,
      minZoom: resource.zoomMin,
      maxZoom: maxZoom,
      tileSize: tileSize
    });
    this.tileGrid = tileGrid;

    const culture = this.culture_;
    const hidpi = this.hidpi_;
    this.tileUrlFunction = createFromTileUrlFunctions(
      resource.imageUrlSubdomains.map(function(subdomain) {
        /** @type {import('../tilecoord.js').TileCoord} */
        const quadKeyTileCoord = [0, 0, 0];
        const imageUrl = resource.imageUrl
          .replace('{subdomain}', subdomain)
          .replace('{culture}', culture);
        return (
          /**
           * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
           * @param {number} pixelRatio Pixel ratio.
           * @param {import("../proj/Projection.js").default} projection Projection.
           * @return {string|undefined} Tile URL.
           */
          function(tileCoord, pixelRatio, projection) {
            if (!tileCoord) {
              return undefined;
            } else {
              createOrUpdate(tileCoord[0], tileCoord[1], tileCoord[2], quadKeyTileCoord);
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
        const viewState = frameState.viewState;
        const tileGrid = this.getTileGrid();
        const z = tileGrid.getZForResolution(viewState.resolution, this.zDirection);
        const tileCoord = tileGrid.getTileCoordForCoordAndZ(viewState.center, z);
        const zoom = tileCoord[0];
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
      }.bind(this));
    }

    this.setState(SourceState.READY);
  }
}

export default BingMaps;
