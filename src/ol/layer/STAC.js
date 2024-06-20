/**
 * @module ol/layer/STAC
 */
import GeoTIFF from '../source/GeoTIFF.js';
import WebGLTileLayer from './WebGLTile.js';
import {
  fromEPSGCode,
  isRegistered as isProj4Registered,
} from '../proj/proj4.js';

/**
 * @typedef {Object} Item
 * @property {string} type The item type ("Feature").
 * @property {string} stac_version The STAC version.
 * @property {string} id The item identifier.
 * @property {import("geojson").GeoJSON|null} geometry The item footprint.
 * @property {Array<number>} [bbox] The bounding box (only required if geometry is null).
 * @property {Object} properties The item properties.
 * @property {Array<Link>} links Links to other resources.
 * @property {Object<string, Asset>} assets Asset lookup.
 * @property {string} collection The collection id (if the item is part of a collection).
 */

/**
 * @typedef {Object} Link
 * @property {string} href The URL.
 * @property {string} rel The link relationship.
 * @property {string} [type] The media type.
 * @property {string} [title] The link title.
 */

/**
 * @typedef {Object} Asset
 * @property {string} href The asset URL.
 * @property {string} [title] The asset title.
 * @property {string} [description] The asset description.
 * @property {string} [type] The media type.
 * @property {Array<string>} [roles] The asset roles.
 */

/**
 * @typedef {import("../source/GeoTIFF.js").Options} SourceOptions
 */

/**
 * @param {Asset} asset The asset.
 * @return {number} A relative ranking (lower is better).
 */
function getAssetTypeRank(asset) {
  if (!asset.type) {
    return Infinity;
  }
  const type = asset.type.toLowerCase();
  if (type === 'image/tiff; application=geotiff; profile=cloud-optimized') {
    return 0;
  }
  if (type === 'image/vnd.stac.geotiff; cloud-optimized=true') {
    return 0;
  }
  if (type.includes('geotiff')) {
    if (type.includes('cloud-optimized')) {
      return 0;
    }
    return 1;
  }
  if (type.includes('image/tiff')) {
    return 2;
  }
  return Infinity;
}

/**
 * @param {Asset} asset The asset.
 * @return {number} The relative ranking (lower is better).
 */
function getAssetRolesRank(asset) {
  const roles = asset.roles;
  if (!roles) {
    return Infinity;
  }
  for (let i = 0; i < roles.length; ++i) {
    const role = roles[i];
    if (role === 'overview') {
      return 0;
    }
    if (role === 'data') {
      return 1;
    }
  }
  return Infinity;
}

/**
 * @param {Object<string, Asset>} assets A lookup of assets.
 * @return {Array<Asset>} The assets to be rendered.
 */
function assetSelectorByRank(assets) {
  /** @type {Array<Asset>} */
  const array = [];

  for (const k in assets) {
    array.push(assets[k]);
  }

  array.sort((a, b) => {
    const aTypeRank = getAssetTypeRank(a);
    const bTypeRank = getAssetTypeRank(b);
    if (aTypeRank < bTypeRank) {
      return -1;
    }
    if (aTypeRank > bTypeRank) {
      return 1;
    }
    return getAssetRolesRank(a) - getAssetRolesRank(b);
  });

  return [array[0]];
}

/**
 * @param {Array<string>} keys The asset keys.
 * @return {AssetSelector} An asset selector.
 */
function getAssetSelectorByKeys(keys) {
  return function (assets) {
    return keys.map((key) => {
      const asset = assets[key];
      if (!asset) {
        throw new Error(`No asset with key "${key}" found`);
      }
      return asset;
    });
  };
}

/**
 * @typedef {function(Object<string, Asset>):Array<Asset>} AssetSelector
 */

/**
 * @typedef {Object} Options
 * @property {Array<string>|AssetSelector} [assets] The selector for the assets to be rendered.  This can be an
 * array of strings corresponding to asset keys or a function that returns an array of assets
 * given item's asset lookup object.
 * @property {string} [url] The STAC item URL.  One of `url` or `item` must be provided.
 * @property {Object} [item] The STAC item metadata.  One of `url` or `item` must be provided.
 * @property {function(Item, SourceOptions):(SourceOptions|Promise<SourceOptions>)} [getSourceOptions] Optional function that can be used to
 * configure the underlying source.  The function will be called with the STAC Item metadata and the current source options.
 * The function can do any additional work and return the completed options or a promise for the same.
 * @property {import("./WebGLTile.js").Style} [style] Style to apply to the layer.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
 * rendered outside of this extent.
 * @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
 * will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
 * for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
 * method was used.
 * @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
 * visible.
 * @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
 * be visible.
 * @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
 * visible.
 * @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
 * be visible.
 * @property {number} [preload=0] Preload. Load low-resolution tiles up to `preload` levels. `0`
 * means no preloading.
 * @property {number} [cacheSize=512] The internal texture cache size.  This needs to be large enough to render
 * two zoom levels worth of tiles.
 * @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
 */

/**
 * @classdesc
 * Renders assets from a STAC Item.
 *
 * @extends WebGLTileLayer
 * @api
 */
class STACLayer extends WebGLTileLayer {
  /**
   * @param {Options} options Layer options.
   */
  constructor(options) {
    const superOptions = Object.assign({}, options);

    delete superOptions.assets;
    delete superOptions.url;
    delete superOptions.item;
    delete superOptions.getSourceOptions;

    super(superOptions);

    /**
     * @type {AssetSelector}
     * @private
     */
    this.assetSelector_;
    if (!options.assets) {
      this.assetSelector_ = assetSelectorByRank;
    } else if (Array.isArray(options.assets)) {
      this.assetSelector_ = getAssetSelectorByKeys(options.assets);
    } else {
      this.assetSelector_ = options.assets;
    }

    /**
     * @type {function(Item, SourceOptions):(SourceOptions|Promise<SourceOptions>)}
     * @private
     */
    this.getSourceOptions_ = options.getSourceOptions;

    /**
     * @type {Item}
     * @private
     */
    this.item_;

    if (options.item) {
      this.configure_(options.item).catch((error) => this.handleError_(error));
      return;
    }

    const url = options.url;
    if (!url) {
      throw new Error('Either url or item must be provided');
    }

    fetch(url)
      .then((response) => response.json())
      .then((item) => this.configure_(item))
      .catch((error) => this.handleError_(error));
  }

  /**
   * @param {Error} error The error.
   * @private
   */
  handleError_(error) {
    // TODO: error state, event, or callback?
    console.error(error); // eslint-disable-line no-console
  }

  /**
   * @param {Item} item The item data.
   * @return {Promise} Resolves when complete.
   * @private
   */
  configure_(item) {
    this.item_ = item;
    const assets = this.assetSelector_(item.assets);
    return this.updateSource_(assets);
  }

  /**
   * @param {Array<Asset>} assets The assets to render.
   * @private
   */
  async updateSource_(assets) {
    /**
     * @type {SourceOptions}
     */
    let options = {
      sources: assets.map((asset) => ({
        url: asset.href,
      })),
    };

    const item = this.item_;
    let projection;
    if (isProj4Registered()) {
      const epsgCode = item.properties['proj:epsg'];
      if (epsgCode) {
        try {
          projection = await fromEPSGCode(epsgCode);
        } catch (_) {
          // pass
        }
        if (projection) {
          options.projection = projection;
        }
      }
    }

    if (this.getSourceOptions_) {
      options = await this.getSourceOptions_(item, options);
    }

    const source = new GeoTIFF(options);
    this.setSource(source);
  }

  /**
   * Update the assets to be rendered.
   * @param {Array<string>} keys Asset keys.
   */
  setAssets(keys) {
    const assets = getAssetSelectorByKeys(keys)(this.item_.assets);
    this.updateSource_(assets);
  }

  /**
   * Get the item metadata.
   * @return {Item} The item.
   */
  getItem() {
    return this.item_;
  }
}

export default STACLayer;
