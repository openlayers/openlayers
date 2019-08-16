/**
 * @module ol/featureloader
 */
import {VOID} from './functions.js';
import FormatType from './format/FormatType.js';

/**
 * {@link module:ol/source/Vector} sources use a function of this type to
 * load features.
 *
 * This function takes an {@link module:ol/extent~Extent} representing the area to be loaded,
 * a `{number}` representing the resolution (map units per pixel) and an
 * {@link module:ol/proj/Projection} for the projection  as
 * arguments. `this` within the function is bound to the
 * {@link module:ol/source/Vector} it's called from.
 *
 * The function is responsible for loading the features and adding them to the
 * source.
 * @typedef {function(this:(import("./source/Vector").default|import("./VectorTile.js").default), import("./extent.js").Extent, number,
 *                    import("./proj/Projection.js").default): void} FeatureLoader
 * @api
 */


/**
 * {@link module:ol/source/Vector} sources use a function of this type to
 * get the url to load features from.
 *
 * This function takes an {@link module:ol/extent~Extent} representing the area
 * to be loaded, a `{number}` representing the resolution (map units per pixel)
 * and an {@link module:ol/proj/Projection} for the projection  as
 * arguments and returns a `{string}` representing the URL.
 * @typedef {function(import("./extent.js").Extent, number, import("./proj/Projection.js").default): string} FeatureUrlFunction
 * @api
 */


/**
 * @param {string|FeatureUrlFunction} url Feature URL service.
 * @param {import("./format/Feature.js").default} format Feature format.
 * @param {function(this:import("./VectorTile.js").default, Array<import("./Feature.js").default>, import("./proj/Projection.js").default, import("./extent.js").Extent): void|function(this:import("./source/Vector").default, Array<import("./Feature.js").default>): void} success
 *     Function called with the loaded features and optionally with the data
 *     projection. Called with the vector tile or source as `this`.
 * @param {function(this:import("./VectorTile.js").default): void|function(this:import("./source/Vector").default): void} failure
 *     Function called when loading failed. Called with the vector tile or
 *     source as `this`.
 * @return {FeatureLoader} The feature loader.
 */
export function loadFeaturesXhr(url, format, success, failure) {
  return (
    /**
     * @param {import("./extent.js").Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @param {import("./proj/Projection.js").default} projection Projection.
     * @this {import("./source/Vector").default|import("./VectorTile.js").default}
     */
    function(extent, resolution, projection) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET',
        typeof url === 'function' ? url(extent, resolution, projection) : url,
        true);
      if (format.getType() == FormatType.ARRAY_BUFFER) {
        xhr.responseType = 'arraybuffer';
      }
      xhr.withCredentials = true;
      /**
       * @param {Event} event Event.
       * @private
       */
      xhr.onload = function(event) {
        // status will be 0 for file:// urls
        if (!xhr.status || xhr.status >= 200 && xhr.status < 300) {
          const type = format.getType();
          /** @type {Document|Node|Object|string|undefined} */
          let source;
          if (type == FormatType.JSON || type == FormatType.TEXT) {
            source = xhr.responseText;
          } else if (type == FormatType.XML) {
            source = xhr.responseXML;
            if (!source) {
              source = new DOMParser().parseFromString(xhr.responseText, 'application/xml');
            }
          } else if (type == FormatType.ARRAY_BUFFER) {
            source = /** @type {ArrayBuffer} */ (xhr.response);
          }
          if (source) {
            success.call(this, format.readFeatures(source, {
              extent: extent,
              featureProjection: projection
            }),
            format.readProjection(source));
          } else {
            failure.call(this);
          }
        } else {
          failure.call(this);
        }
      }.bind(this);
      /**
       * @private
       */
      xhr.onerror = function() {
        failure.call(this);
      }.bind(this);
      xhr.send();
    }
  );
}


/**
 * Create an XHR feature loader for a `url` and `format`. The feature loader
 * loads features (with XHR), parses the features, and adds them to the
 * vector source.
 * @param {string|FeatureUrlFunction} url Feature URL service.
 * @param {import("./format/Feature.js").default} format Feature format.
 * @return {FeatureLoader} The feature loader.
 * @api
 */
export function xhr(url, format) {
  return loadFeaturesXhr(url, format,
    /**
     * @param {Array<import("./Feature.js").default>} features The loaded features.
     * @param {import("./proj/Projection.js").default} dataProjection Data
     * projection.
     * @this {import("./source/Vector").default|import("./VectorTile.js").default}
     */
    function(features, dataProjection) {
      const sourceOrTile = /** @type {?} */ (this);
      if (typeof sourceOrTile.addFeatures === 'function') {
        /** @type {import("./source/Vector").default} */ (sourceOrTile).addFeatures(features);
      }
    }, /* FIXME handle error */ VOID);
}
