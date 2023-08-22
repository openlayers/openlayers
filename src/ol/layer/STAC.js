/**
 * @module ol/layer/STAC
 */
import ErrorEvent from '../events/ErrorEvent.js';
import GeoJSON from '../format/GeoJSON.js';
import GeoTIFF from '../source/GeoTIFF.js';
import ImageLayer from './Image.js';
import Layer from './Layer.js';
import LayerGroup from './Group.js';
import StaticImage from '../source/ImageStatic.js';
import TileJSON from '../source/TileJSON.js';
import TileLayer from './Tile.js';
import VectorLayer from './Vector.js';
import VectorSource from '../source/Vector.js';
import WMS from '../source/TileWMS.js';
import WMTS, {optionsFromCapabilities} from '../source/WMTS.js';
import WebGLTileLayer from './WebGLTile.js';
import XYZ from '../source/XYZ.js';
import create, {Asset, STAC} from 'stac-js';
import {
  defaultBoundsStyle,
  defaultCollectionStyle,
  getBoundsStyle,
  getGeoTiffSourceInfoFromAsset,
  getProjection,
  getSpecificWebMapUrl,
  getWmtsCapabilities,
} from './stacUtil.js';
import {toGeoJSON} from 'stac-js/src/geo.js';
import {transformExtent} from '../proj.js';

/**
 * @typedef {import("../extent.js").Extent} Extent
 */
/**
 * @typedef {import("../source/GeoTIFF.js").Options} GeoTIFFSourceOptions
 */
/**
 * @typedef {import("../source/ImageStatic.js").Options} ImageStaticSourceOptions
 */
/**
 * @typedef {import("stac-js").Link} Link
 */
/**
 * @typedef {import("stac-js").STACObject} STACObject
 */
/**
 * @typedef {import('../style.js').Style} Style
 */
/**
 * @typedef {import("../source/XYZ.js").Options} XYZSourceOptions
 */

/**
 * @typedef {Object} Options
 * @property {string} [url] The STAC URL. Any of `url` and `data` must be provided.
 * Can also be used as url for data, if it is absolute and doesn't contain a self link.
 * @property {STAC|Asset|Object} [data] The STAC metadata. Any of `url` and `data` must be provided.
 * `data` take precedence over `url`.
 * @property {Array<string|Asset>|null} [assets=null] The selector for the assets to be rendered,
 * only for STAC Items and Collections.
 * This can be an array of strings corresponding to asset keys or Asset objects.
 * null shows the default asset, an empty array shows no asset.
 * @property {Array<number>} [bands] The (one-based) bands to show.
 * @property {function(GeoTIFFSourceOptions, Asset):(GeoTIFFSourceOptions|Promise<GeoTIFFSourceOptions>)} [getGeoTIFFSourceOptions]
 * Optional function that can be used to configure the underlying GeoTIFF sources. The function can do any additional work
 * and return the completed options or a promise for the same. The function will be called with the current source options
 * and the STAC Asset.
 * @property {function(ImageStaticSourceOptions, (Asset|Link)):(ImageStaticSourceOptions|Promise<ImageStaticSourceOptions>)} [getImageStaticSourceOptions]
 * Optional function that can be used to configure the underlying ImageStatic sources. The function can do any additional work
 * and return the completed options or a promise for the same. The function will be called with the current source options
 * and the STAC Asset or Link.
 * @property {function(XYZSourceOptions, (Asset|Link)):(XYZSourceOptions|Promise<XYZSourceOptions>)} [getXYZSourceOptions]
 * Optional function that can be used to configure the underlying XYZ sources that displays imagery. The function can do any
 * additional work and return the completed options or a promise for the same. The function will be called with the current
 * source options and the STAC Asset or Link.
 * @property {boolean} [displayGeoTiffByDefault=false] Allow to choose non-cloud-optimized GeoTiffs as default image to show,
 * which might not work well for larger files or larger amounts of files.
 * @property {boolean} [displayPreview=false] Allow to display images that a browser can display (e.g. PNG, JPEG),
 * usually assets with role `thumbnail` or the link with relation type `preview`.
 * The previews are usually not covering the full extents and as such may be placed incorrectly on the map.
 * For performance reasons, it is recommended to enable this option if you pass in STAC API Items.
 * @property {boolean} [displayOverview=true] Allow to display COGs and, if `displayGeoTiffByDefault` is enabled, GeoTiffs,
 * usually the assets with role `overview` or `visual`.
 * @property {string|boolean} [displayWebMapLink=false] Allow to display a layer based on the information provided through the
 * web map links extension. It is only used if no other data is shown. You can set a specific type of
 * web map link (`tilejson`, `wms`, `wmts`, `xyz`), let OpenLayers choose (`true`) or disable the functionality (`false`).
 * @property {Style} [boundsStyle] The style for the overall bounds / footprint.
 * @property {Style} [collectionStyle] The style for individual items in a list of STAC Items or Collections.
 * @property {null|string} [crossOrigin] For thumbnails: The `crossOrigin` attribute for loaded images / tiles.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {function(Asset):string|null} [buildTileUrlTemplate=null] A function that generates a URL template for a tile server (XYZ),
 * which will be used instead of the client-side GeoTIFF rendering (except if `useTileLayerAsFallback` is `true`).
 * @property {boolean} [useTileLayerAsFallback=false] Uses the given URL template only when the client-side GeoTIFF rendering fails.
 * @property {number} [opacity=1] Opacity (0, 1).
 * @property {boolean} [visible=true] Visibility.
 * @property {Extent} [extent] The bounding extent for layer rendering.  The layer will not be
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
 */

/**
 * @classdesc
 * Renders STAC entities such as STAC Items, Collectons or lists of them as returned by APIs.
 * The layers created by this LayerGroup all have a 'stac' value that can be retrieved using `layer.get('stac')`.
 *
 * @extends LayerGroup
 * @fires sourceready
 * @fires assetsready
 * @fires ErorEvent#event:error
 * @api
 */
class STACLayer extends LayerGroup {
  /**
   * @param {Options} options Layer options.
   */
  constructor(options) {
    const superOptions = {};
    [
      'opacity',
      'visible',
      'zIndex',
      'minResolution',
      'maxResolution',
      'minZoom',
      'maxZoom',
    ].forEach((key) => (superOptions[key] = options[key]));

    super(superOptions);

    /**
     * @type {function(GeoTIFFSourceOptions, Asset):(GeoTIFFSourceOptions|Promise<GeoTIFFSourceOptions>)}
     * @private
     */
    this.getGeoTIFFSourceOptions_ = options.getGeoTIFFSourceOptions;

    /**
     * @type {function(ImageStaticSourceOptions, (Asset|Link)):(ImageStaticSourceOptions|Promise<ImageStaticSourceOptions>)}
     * @private
     */
    this.getImageStaticSourceOptions_ = options.getImageStaticSourceOptions;

    /**
     * @type {function(XYZSourceOptions, (Asset|Link)):(XYZSourceOptions|Promise<XYZSourceOptions>)}
     * @private
     */
    this.getXYZSourceOptions_ = options.getXYZSourceOptions;

    /**
     * @type {STAC|Asset}
     * @private
     */
    this.data_;

    /**
     * @type {Array<Asset> | null}
     * @private
     */
    this.assets_ = null;

    /**
     * @type {Array<number>}
     * @private
     */
    this.bands_ = [];

    /**
     * @type {string | null}
     * @private
     */
    this.crossOrigin_ = options.crossOrigin || null;

    /**
     * @type {boolean}
     * @private
     */
    this.displayGeoTiffByDefault_ = Boolean(options.displayGeoTiffByDefault);

    /**
     * @type {boolean}
     * @private
     */
    this.displayPreview_ = Boolean(options.displayPreview);

    /**
     * @type {boolean}
     * @private
     */
    this.displayOverview_ = options.displayOverview === false ? false : true;

    /**
     * @type {string|boolean}
     */
    this.displayWebMapLink_ = options.displayWebMapLink || false;

    /**
     * @type {function(Asset):string|null}
     * @private
     */
    this.buildTileUrlTemplate_ = options.buildTileUrlTemplate || null;

    /**
     * @type {boolean}
     * @private
     */
    this.useTileLayerAsFallback_ = options.useTileLayerAsFallback || false;

    /**
     * @type {Style}
     * @private
     */
    this.boundsStyle_ = options.boundsStyle || defaultBoundsStyle;

    /**
     * @type {Style}
     * @private
     */
    this.collectionStyle_ = options.collectionStyle || defaultCollectionStyle;

    /**
     * @type {VectorLayer|null}
     * @private
     */
    this.boundsLayer_ = null;

    if (options.data) {
      try {
        this.configure_(
          options.data,
          options.url,
          options.assets,
          options.bands
        );
      } catch (error) {
        this.handleError_(error);
      }
      return;
    }

    if (!options.url) {
      throw new Error('Either url or data must be provided');
    }

    fetch(options.url)
      .then((response) => response.json())
      .then((data) =>
        this.configure_(data, options.url, options.assets, options.bands)
      )
      .catch((error) => this.handleError_(error));
  }

  /**
   * Returns the vector layer that visualizes the bounds / footprint.
   * @return {VectorLayer|null} The vector layer for the bounds
   */
  getBoundsLayer() {
    return this.boundsLayer_;
  }

  /**
   * @private
   * @param {Error} error The error.
   */
  handleError_(error) {
    /**
     * Error event.
     *
     * @event ErorEvent#event:error
     * @type {Object}
     * @property {Error} error - Provides the original error.
     */
    this.dispatchEvent(new ErrorEvent(error));
  }

  /**
   * @private
   * @param {STAC|Asset|Object} data The STAC data.
   * @param {string} url The url to the data.
   * @param {Array<Asset|string> | null} assets The assets to show.
   * @param {Array<number>} bands The (one-based) bands to show.
   */
  configure_(data, url = null, assets = null, bands = []) {
    if (data instanceof Asset || data instanceof STAC) {
      this.data_ = data;
    } else {
      this.data_ = create(data);
    }
    if (url && url.includes('://')) {
      this.data_.setAbsoluteUrl(url);
    }
    this.bands_ = bands;

    this.boundsLayer_ = this.addFootprint_();
    const updateBoundsStyle = () => {
      if (this.boundsLayer_) {
        this.boundsLayer_.setStyle(getBoundsStyle(this.boundsStyle_, this));
      }
    };
    this.getLayers().on('add', updateBoundsStyle);
    this.getLayers().on('remove', updateBoundsStyle);

    this.setAssets(assets)
      .then(() => {
        /**
         * Invoked once all assets are loaded and shown on the map.
         *
         * @event assetsready
         */
        return this.dispatchEvent('assetsready');
      })
      .catch((error) => this.handleError_(error));

    /**
     * Invoked once the source is ready.
     * If you provide the data inline, the event is likely fired before you can
     * attach a listener to it. So this only really helps if a url is provided.
     *
     * @event sourceready
     */
    this.dispatchEvent('sourceready');
  }

  /**
   * @private
   * @return {Promise} Resolves when complete.
   */
  async addApiCollection_() {
    const promises = this.getData()
      .getAll()
      .map((obj) => {
        const subgroup = new STACLayer({
          data: obj,
          crossOrigin: this.crossOrigin_,
          boundsStyle: this.collectionStyle_,
          displayGeoTiffByDefault: this.displayGeoTiffByDefault_,
          displayOverview: this.displayOverview_,
          displayPreview: this.displayPreview_,
        });
        this.addLayer_(subgroup);
        return subgroup;
      });
    return await Promise.all(promises);
  }

  /**
   * @private
   * @return {Promise} Resolves when complete.
   */
  async addStacAssets_() {
    let assets = this.getAssets();
    if (assets === null) {
      assets = [];
      // No specific asset given by the user, visualize the default geotiff
      const geotiff = this.getData().getDefaultGeoTIFF(
        true,
        !this.displayGeoTiffByDefault_
      );
      if (geotiff) {
        assets.push(geotiff);
      } else {
        // This may return Links or Assets
        const thumbnails = this.getData().getThumbnails();
        if (thumbnails.length > 0) {
          assets.push(thumbnails[0]);
        }
      }
    }

    const promises = assets.map((asset) => this.addImagery_(asset));
    return await Promise.all(promises);
  }

  /**
   * @private
   * @param {Asset|Link} [ref] A STAC Link or Asset
   * @return {Promise<Layer|undefined>} Resolves with a Layer or undefined when complete.
   */
  async addImagery_(ref) {
    if (!ref) {
      return;
    }
    if (ref.isGeoTIFF()) {
      return await this.addGeoTiff_(ref);
    }
    if (ref.canBrowserDisplayImage()) {
      return await this.addThumbnail_(ref);
    }
  }

  /**
   * @private
   * @param {Asset|Link} [thumbnail] A STAC Link or Asset
   * @return {Promise<ImageLayer|undefined>} Resolves with am ImageLayer or udnefined when complete.
   */
  async addThumbnail_(thumbnail) {
    if (!this.displayPreview_) {
      return;
    }
    /**
     * @type {ImageStaticSourceOptions}
     */
    let options = {
      url: thumbnail.getAbsoluteUrl(),
      projection: await getProjection(thumbnail, 'EPSG:4326'),
      imageExtent: thumbnail.getContext().getBoundingBox(),
      crossOrigin: this.crossOrigin_,
    };
    if (this.getImageStaticSourceOptions_) {
      options = await this.getImageStaticSourceOptions_(options, thumbnail);
    }
    const layer = new ImageLayer({
      source: new StaticImage(options),
    });
    this.addLayer_(layer, thumbnail);
    return layer;
  }

  /**
   * Adds a layer for the web map links available in the STAC links.
   * @return {Promise<Array<TileLayer>|undefined>} Resolves with a Layer or undefined when complete.
   */
  async addWebMapLinks_() {
    const links = this.getWebMapLinks();
    if (links.length > 0) {
      return await this.addLayerForLink(links[0]);
    }
  }

  /**
   * Adds a layer for a link that implements the web-map-links extension.
   * Supports: TileJSON, WMS, WMTS, XYZ
   * @see https://github.com/stac-extensions/web-map-links
   * @param {Link} link A web map link
   * @return {Promise<Array<TileLayer>|undefined>} Resolves with a list of layers or undefined when complete.
   */
  async addLayerForLink(link) {
    // Replace any occurances of {s} if possible, otherwise return
    const url = getSpecificWebMapUrl(link);
    if (!url) {
      return;
    }

    const options = {
      attributions:
        link.getMetadata('attribution') ||
        this.data_.getMetadata('attribution'),
      crossOrigin: this.crossOrigin_,
      url,
    };

    const sources = [];
    switch (link.rel) {
      case 'tilejson':
        sources.push(new TileJSON(options));
        break;
      case 'wms':
        if (!Array.isArray(link['wms:layers'])) {
          return;
        }
        const styles = link['wms:styles'] || '';
        for (const layer of link['wms:layers']) {
          const params = Object.assign(
            {
              LAYERS: layer,
              STYLES: styles,
            },
            link['wms:dimensions']
          );
          const wmsOptions = Object.assign({}, options, {params});
          sources.push(new WMS(wmsOptions));
        }
        break;
      case 'wmts':
        const wmtsCapabilities = await getWmtsCapabilities(url);
        if (!wmtsCapabilities) {
          return;
        }
        const layers = Array.isArray(link['wmts:layer'])
          ? link['wmts:layer']
          : [link['wmts:layer']];
        for (const layer of layers) {
          const wmtsOptions = Object.assign({}, options, {layer});
          sources.push(
            new WMTS(optionsFromCapabilities(wmtsCapabilities, wmtsOptions))
          );
        }
        break;
      case 'xyz':
        sources.push(new XYZ(options));
        break;
      default:
        return;
    }

    return sources.map((source) => {
      const layer = new TileLayer({
        source,
      });
      this.addLayer_(layer, link);
      return layer;
    });
  }

  /**
   * @private
   * @param {Asset} [asset] A STAC Asset
   * @return {Promise<Layer|undefined>} Resolves with a Layer or undefined when complete.
   */
  async addGeoTiff_(asset) {
    if (!this.displayOverview_) {
      return;
    }

    if (this.buildTileUrlTemplate_ && !this.useTileLayerAsFallback_) {
      return await this.addTileLayerForImagery_(asset);
    }

    const sourceInfo = getGeoTiffSourceInfoFromAsset(asset, this.bands_);

    /**
     * @type {GeoTIFFSourceOptions}
     */
    let options = {
      sources: [sourceInfo],
    };

    const projection = await getProjection(asset);
    if (projection) {
      options.projection = projection;
    }

    if (this.getGeoTIFFSourceOptions_) {
      options = await this.getGeoTIFFSourceOptions_(options, asset);
    }

    const tileserverFallback = async (asset, layer) => {
      if (layer) {
        this.getLayers().remove(layer);
      }
      return await this.addTileLayerForImagery_(asset);
    };
    try {
      const source = new GeoTIFF(options);
      const layer = new WebGLTileLayer({source});
      if (this.useTileLayerAsFallback_) {
        const errorFn = () => tileserverFallback(asset, layer);
        source.on('error', errorFn);
        source.on('tileloaderror', errorFn);
        // see https://github.com/openlayers/openlayers/issues/14926
        source.on('change', () => {
          if (source.getState() === 'error') {
            tileserverFallback(asset, layer);
          }
        });
        layer.on('error', errorFn);
        // Call this to ensure we can load the GeoTIFF, otherwise try fallback
        await source.getView();
      }
      this.addLayer_(layer, asset);
      return layer;
    } catch (error) {
      if (this.useTileLayerAsFallback_) {
        return await tileserverFallback(asset, null);
      }
      this.handleError_(error);
    }
  }

  /**
   * @private
   * @param {Asset|Link} [data] A STAC Asset or Link
   * @return {Promise<TileLayer>} Resolves with a TileLayer when complete.
   */
  async addTileLayerForImagery_(data) {
    /**
     * @type {XYZSourceOptions}
     */
    let options = {
      crossOrigin: this.crossOrigin_,
      url: this.buildTileUrlTemplate_(data),
    };
    if (this.getXYZSourceOptions_) {
      options = await this.getXYZSourceOptions_(options, data);
    }
    const layer = new TileLayer({
      source: new XYZ(options),
    });
    this.addLayer_(layer, data);
    return layer;
  }

  /**
   * @param {Layer|LayerGroup} [layer] A Layer to add to the LayerGroup
   * @param {STACObject} [data] The STAC object, can be any class exposed by stac-js
   * @param {number} [zIndex=0] The z-index for the layer
   * @private
   */
  addLayer_(layer, data, zIndex = 0) {
    layer.set('stac', data);
    layer.setZIndex(zIndex);
    this.getLayers().push(layer);
  }

  /**
   * @private
   * @return {VectorLayer|null} The vector layer showing the geometry/bbox.
   */
  addFootprint_() {
    let geojson = null;
    const data = this.getData();
    if (data.isItemCollection() || data.isCollectionCollection()) {
      geojson = toGeoJSON(data.getBoundingBox());
    } else {
      geojson = data.toGeoJSON();
    }

    if (geojson) {
      const format = new GeoJSON();
      const source = new VectorSource({
        format,
        loader: (extent, resolution, projection) => {
          const features = format.readFeatures(geojson, {
            featureProjection: projection,
          });
          source.addFeatures(features);
        },
      });
      const vectorLayer = new VectorLayer({
        source,
        style: getBoundsStyle(this.boundsStyle_, this),
      });
      vectorLayer.set('bounds', true);
      this.addLayer_(vectorLayer, data, 1);
      return vectorLayer;
    }

    return null;
  }

  /**
   * @private
   */
  async updateLayers_() {
    // Remove old layers
    const oldLayers = this.getLayers();
    for (let i = oldLayers.getLength() - 1; i >= 0; i--) {
      const layer = oldLayers.item(i);
      const stac = layer.get('stac');
      if (stac && (stac.isLink() || stac.isAsset())) {
        oldLayers.removeAt(i);
      }
    }

    // Add new layers
    const data = this.getData();
    if (data.isItemCollection() || data.isCollectionCollection()) {
      await this.addApiCollection_();
    } else if (data.isItem() || data.isCollection()) {
      await this.addStacAssets_();
    }
    if (this.displayWebMapLink_ && this.hasOnlyBounds()) {
      await this.addWebMapLinks_();
    }
  }

  /**
   * Indicates whether the LayerGroup shows only the bounds layer (i.e. no imagery/tile layers).
   * @return {boolean} `true` if only the bounds layer is shown, `false` otherwise.
   */
  hasOnlyBounds() {
    const boundsLayer = this.getBoundsLayer();
    const imgLayer = this.getLayersArray().find(
      (layer) => layer !== boundsLayer
    );
    return typeof imgLayer === 'undefined';
  }

  /**
   * Returns all potential web map links based on the given value for `displayWebMapLink`.
   * @return {Array<Link>} An array of links.
   */
  getWebMapLinks() {
    let types = ['xyz', 'tilejson', 'wmts', 'wms']; // This also defines the priority
    if (typeof this.displayWebMapLink_ === 'string') {
      types = [this.displayWebMapLink_];
    }
    const links = this.data_.getLinksWithRels(types);
    links.sort((a, b) => {
      const prioA = types.indexOf(a.rel);
      const prioB = types.indexOf(b.rel);
      return prioA - prioB;
    });
    return links;
  }

  /**
   * Update the assets to be rendered.
   * @param {Array<string|Asset>|null} assets The assets to show.
   * @return {Promise} Resolves when all assets are rendered.
   */
  async setAssets(assets) {
    if (Array.isArray(assets)) {
      this.assets_ = assets.map((asset) => {
        if (typeof asset === 'string') {
          return this.getData().getAsset(asset);
        }
        if (!(asset instanceof Asset)) {
          return new Asset(asset);
        }
        return asset;
      });
    } else {
      this.assets_ = null;
    }
    await this.updateLayers_();
  }

  /**
   * Get the STAC object.
   *
   * @return {STAC|Asset} The STAC object.
   */
  getData() {
    return this.data_;
  }

  /**
   * Get the STAC assets shown.
   *
   * @return {Array<Asset>} The STAC assets.
   */
  getAssets() {
    return this.assets_;
  }

  /**
   * Get the extent of the layer.
   *
   * @return {Extent|undefined} The layer extent.
   */
  getExtent() {
    const data = this.getData();
    if (!data) {
      return;
    }

    const layer = this.getLayers().item(0);
    if (!layer || !(layer instanceof Layer)) {
      return;
    }

    const map = layer.getMapInternal();
    if (!map) {
      return;
    }

    const view = map.getView();
    if (!view) {
      return;
    }

    const bbox = data.getBoundingBox();
    if (bbox) {
      return transformExtent(bbox, 'EPSG:4326', view.getProjection());
    }
  }
}

export default STACLayer;
