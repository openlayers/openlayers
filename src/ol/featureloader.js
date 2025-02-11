/**
 * @module ol/featureloader
 */

/**
 *
 * @type {boolean}
 * @private
 */
let withCredentials = false;

/**
 * {@link module:ol/source/Vector~VectorSource} sources use a function of this type to
 * load features.
 *
 * This function takes up to 5 arguments. These are an {@link module:ol/extent~Extent} representing
 * the area to be loaded, a `{number}` representing the resolution (map units per pixel), a
 * {@link module:ol/proj/Projection~Projection} for the projection, an optional success callback that should get
 * the loaded features passed as an argument and an optional failure callback with no arguments. If
 * the callbacks are not used, the corresponding vector source will not fire `'featuresloadend'` and
 * `'featuresloaderror'` events. `this` within the function is bound to the
 * {@link module:ol/source/Vector~VectorSource} it's called from.
 *
 * The function is responsible for loading the features and adding them to the
 * source.
 *
 * @template {import("./Feature.js").FeatureLike} [FeatureType=import("./Feature.js").FeatureLike]
 * @typedef {(
 *           extent: import("./extent.js").Extent,
 *           resolution: number,
 *           projection: import("./proj/Projection.js").default,
 *           success?: (features: Array<FeatureType>) => void,
 *           failure?: () => void) => void} FeatureLoader
 * @api
 */

/**
 * {@link module:ol/source/Vector~VectorSource} sources use a function of this type to
 * get the url to load features from.
 *
 * This function takes an {@link module:ol/extent~Extent} representing the area
 * to be loaded, a `{number}` representing the resolution (map units per pixel)
 * and an {@link module:ol/proj/Projection~Projection} for the projection  as
 * arguments and returns a `{string}` representing the URL.
 * @typedef {function(import("./extent.js").Extent, number, import("./proj/Projection.js").default): string} FeatureUrlFunction
 * @api
 */

/**
 * @template {import("./Feature.js").FeatureLike} [FeatureType=import("./Feature.js").default]
 * @param {string|FeatureUrlFunction} url Feature URL service.
 * @param {import("./format/Feature.js").default<FeatureType>} format Feature format.
 * @param {import("./extent.js").Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {import("./proj/Projection.js").default} projection Projection.
 * @param {function(Array<FeatureType>, import("./proj/Projection.js").default): void} success Success
 *      Function called with the loaded features and optionally with the data projection.
 * @param {function(): void} failure Failure
 *      Function called when loading failed.
 */
export function loadFeaturesXhr(
  url,
  format,
  extent,
  resolution,
  projection,
  success,
  failure,
) {
  const xhr = new XMLHttpRequest();
  xhr.open(
    'GET',
    typeof url === 'function' ? url(extent, resolution, projection) : url,
    true,
  );
  if (format.getType() == 'arraybuffer') {
    xhr.responseType = 'arraybuffer';
  }
  xhr.withCredentials = withCredentials;
  /**
   * @param {Event} event Event.
   * @private
   */
  xhr.onload = function (event) {
    // status will be 0 for file:// urls
    if (!xhr.status || (xhr.status >= 200 && xhr.status < 300)) {
      const type = format.getType();
      try {
        /** @type {Document|Node|Object|string|undefined} */
        let source;
        if (type == 'text' || type == 'json') {
          source = xhr.responseText;
        } else if (type == 'xml') {
          source = xhr.responseXML || xhr.responseText;
        } else if (type == 'arraybuffer') {
          source = /** @type {ArrayBuffer} */ (xhr.response);
        }
        if (source) {
          success(
            /** @type {Array<FeatureType>} */
            (
              format.readFeatures(source, {
                extent: extent,
                featureProjection: projection,
              })
            ),
            format.readProjection(source),
          );
        } else {
          failure();
        }
      } catch {
        failure();
      }
    } else {
      failure();
    }
  };
  /**
   * @private
   */
  xhr.onerror = failure;
  xhr.send();
}

/**
 * Create an XHR feature loader for a `url` and `format`. The feature loader
 * loads features (with XHR), parses the features, and adds them to the
 * vector source.
 *
 * @template {import("./Feature.js").FeatureLike} [FeatureType=import("./Feature.js").default]
 * @param {string|FeatureUrlFunction} url Feature URL service.
 * @param {import("./format/Feature.js").default<FeatureType>} format Feature format.
 * @return {FeatureLoader<FeatureType>} The feature loader.
 * @api
 */
export function xhr(url, format) {
  /**
   * @param {import("./extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {import("./proj/Projection.js").default} projection Projection.
   * @param {function(Array<FeatureType>): void} [success] Success
   *      Function called when loading succeeded.
   * @param {function(): void} [failure] Failure
   *      Function called when loading failed.
   * @this {import("./source/Vector.js").default<FeatureType>}
   */
  return function (extent, resolution, projection, success, failure) {
    loadFeaturesXhr(
      url,
      format,
      extent,
      resolution,
      projection,
      /**
       * @param {Array<FeatureType>} features The loaded features.
       * @param {import("./proj/Projection.js").default} dataProjection Data
       * projection.
       */
      (features, dataProjection) => {
        this.addFeatures(features);
        if (success !== undefined) {
          success(features);
        }
      },
      () => {
        this.changed();
        if (failure !== undefined) {
          failure();
        }
      },
    );
  };
}

/**
 * Setter for the withCredentials configuration for the XHR.
 *
 * @param {boolean} xhrWithCredentials The value of withCredentials to set.
 * Compare https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/
 * @api
 */
export function setWithCredentials(xhrWithCredentials) {
  withCredentials = xhrWithCredentials;
}
