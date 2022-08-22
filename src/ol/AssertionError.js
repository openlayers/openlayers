/**
 * @module ol/AssertionError
 */

/** @type {Object<number, string>} */
const messages = {
  1: 'The view center is not defined',
  2: 'The view resolution is not defined',
  3: 'The view rotation is not defined',
  4: '`image` and `src` cannot be provided at the same time',
  5: '`imgSize` must be set when `image` is provided',
  7: '`format` must be set when `url` is set',
  8: 'Unknown `serverType` configured',
  9: '`url` must be configured or set using `#setUrl()`',
  10: 'The default `geometryFunction` can only handle `Point` geometries',
  11: '`options.featureTypes` must be an Array',
  12: '`options.geometryName` must also be provided when `options.bbox` is set',
  13: 'Invalid corner',
  14: 'Invalid color',
  15: 'Tried to get a value for a key that does not exist in the cache',
  16: 'Tried to set a value for a key that is used already',
  17: '`resolutions` must be sorted in descending order',
  18: 'Either `origin` or `origins` must be configured, never both',
  19: 'Number of `tileSizes` and `resolutions` must be equal',
  20: 'Number of `origins` and `resolutions` must be equal',
  22: 'Either `tileSize` or `tileSizes` must be configured, never both',
  24: 'Invalid extent or geometry provided as `geometry`',
  25: 'Cannot fit empty extent provided as `geometry`',
  26: 'Features must have an id set',
  27: 'Features must have an id set',
  28: '`renderMode` must be `"hybrid"` or `"vector"`',
  30: 'The passed `feature` was already added to the source',
  31: 'Tried to enqueue an `element` that was already added to the queue',
  32: 'Transformation matrix cannot be inverted',
  33: 'Invalid units',
  34: 'Invalid geometry layout',
  36: 'Unknown SRS type',
  37: 'Unknown geometry type found',
  38: '`styleMapValue` has an unknown type',
  39: 'Unknown geometry type',
  40: 'Expected `feature` to have a geometry',
  41: 'Expected an `ol/style/Style` or an array of `ol/style/Style.js`',
  42: 'Question unknown, the answer is 42',
  43: 'Expected `layers` to be an array or a `Collection`',
  47: 'Expected `controls` to be an array or an `ol/Collection`',
  48: 'Expected `interactions` to be an array or an `ol/Collection`',
  49: 'Expected `overlays` to be an array or an `ol/Collection`',
  50: '`options.featureTypes` should be an Array',
  51: 'Either `url` or `tileJSON` options must be provided',
  52: 'Unknown `serverType` configured',
  53: 'Unknown `tierSizeCalculation` configured',
  55: 'The {-y} placeholder requires a tile grid with extent',
  56: 'mapBrowserEvent must originate from a pointer event',
  57: 'At least 2 conditions are required',
  59: 'Invalid command found in the PBF',
  60: 'Missing or invalid `size`',
  61: 'Cannot determine IIIF Image API version from provided image information JSON',
  62: 'A `WebGLArrayBuffer` must either be of type `ELEMENT_ARRAY_BUFFER` or `ARRAY_BUFFER`',
  64: 'Layer opacity must be a number',
  66: '`forEachFeatureAtCoordinate` cannot be used on a WebGL layer if the hit detection logic has not been enabled. This is done by providing adequate shaders using the `hitVertexShader` and `hitFragmentShader` properties of `WebGLPointsLayerRenderer`',
  67: 'A layer can only be added to the map once. Use either `layer.setMap()` or `map.addLayer()`, not both',
  68: 'A VectorTile source can only be rendered if it has a projection compatible with the view projection',
};

/**
 * Error object thrown when an assertion failed. This is an ECMA-262 Error,
 * extended with a `code` property.
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error.
 */
class AssertionError extends Error {
  /**
   * @param {number} code Error code.
   */
  constructor(code) {
    const message = messages[code];

    super(message);

    /**
     * Error code. The meaning of the code can be found on
     * https://openlayers.org/en/latest/doc/errors/ (replace `latest` with
     * the version found in the OpenLayers script's header comment if a version
     * other than the latest is used).
     * @type {number}
     * @deprecated ol/AssertionError and error codes will be removed in v8.0
     * @api
     */
    this.code = code;

    /**
     * @type {string}
     */
    this.name = 'AssertionError';

    // Re-assign message, see https://github.com/Rich-Harris/buble/issues/40
    this.message = message;
  }
}

export default AssertionError;
