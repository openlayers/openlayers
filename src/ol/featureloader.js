/**
 * @module ol/featureloader
 */
import {UNDEFINED} from './functions.js';
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
 * @typedef {function(this:module:ol/source/Vector, module:ol/extent~Extent, number,
 *                    module:ol/proj/Projection)} FeatureLoader
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
 * @typedef {function(module:ol/extent~Extent, number, module:ol/proj/Projection): string} FeatureUrlFunction
 * @api
 */


/**
 * @param {string|module:ol/featureloader~FeatureUrlFunction} url Feature URL service.
 * @param {module:ol/format/Feature} format Feature format.
 * @param {function(this:module:ol/VectorTile, Array.<module:ol/Feature>, module:ol/proj/Projection, module:ol/extent~Extent)|function(this:module:ol/source/Vector, Array.<module:ol/Feature>)} success
 *     Function called with the loaded features and optionally with the data
 *     projection. Called with the vector tile or source as `this`.
 * @param {function(this:module:ol/VectorTile)|function(this:module:ol/source/Vector)} failure
 *     Function called when loading failed. Called with the vector tile or
 *     source as `this`.
 * @return {module:ol/featureloader~FeatureLoader} The feature loader.
 */
export function loadFeaturesXhr(url, format, success, failure) {
  return (
    /**
     * @param {module:ol/extent~Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @param {module:ol/proj/Projection} projection Projection.
     * @this {module:ol/source/Vector|module:ol/VectorTile}
     */
    function(extent, resolution, projection) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET',
        typeof url === 'function' ? url(extent, resolution, projection) : url,
        true);
      if (format.getType() == FormatType.ARRAY_BUFFER) {
        xhr.responseType = 'arraybuffer';
      }
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
            success.call(this, format.readFeatures(source,
              {featureProjection: projection}),
            format.readProjection(source), format.getLastExtent());
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
 * @param {string|module:ol/featureloader~FeatureUrlFunction} url Feature URL service.
 * @param {module:ol/format/Feature} format Feature format.
 * @return {module:ol/featureloader~FeatureLoader} The feature loader.
 * @api
 */
export function xhr(url, format) {
  return loadFeaturesXhr(url, format,
    /**
     * @param {Array.<module:ol/Feature>} features The loaded features.
     * @param {module:ol/proj/Projection} dataProjection Data
     * projection.
     * @this {module:ol/source/Vector}
     */
    function(features, dataProjection) {
      this.addFeatures(features);
    }, /* FIXME handle error */ UNDEFINED);
}
