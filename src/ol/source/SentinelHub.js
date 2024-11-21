/**
 * @module ol/source/SentinelHub
 */

import DataTileSource from './DataTile.js';
import {
  equivalent as equivalentProjections,
  get as getProjection,
} from '../proj.js';

const defaultProcessUrl = 'https://services.sentinel-hub.com/api/v1/process';

const defaultTokenUrl =
  'https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token';

const defaultEvalscriptVersion = '3';

/**
 * @type {import('../size.js').Size}
 */
const defaultTileSize = [512, 512];

const maxRetries = 10;
const baseDelay = 500;

/**
 * @typedef {Object} AuthConfig
 * @property {string} [tokenUrl='https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token'] The URL to get the authentication token.
 * @property {string} clientId The client ID.
 * @property {string} clientSecret The client secret.
 */

/**
 * @typedef {Object} AccessTokenClaims
 * @property {number} exp The expiration time of the token (in seconds).
 */

/**
 * @typedef {Object} Evalscript
 * @property {Setup} setup The setup function.
 * @property {EvaluatePixel} evaluatePixel The function to transform input samples into output values.
 * @property {UpdateOutput} [updateOutput] Optional function to adjust the output bands.
 * @property {UpdateOutputMetadata} [updateOutputMetadata] Optional function to update the output metadata.
 * @property {Collections} [preProcessScenes] Optional function called before processing.
 * @property {string} [version='3'] The Evalscript version.
 */

/**
 * @typedef {function(): SetupResult} Setup
 */

/**
 * @typedef {function(Sample|Array<Sample>, Scenes, InputMetadata, CustomData, OutputMetadata): OutputValues|Array<number>|void} EvaluatePixel
 */

/**
 * @typedef {function(Object<string, UpdatedOutputDescription>): void} UpdateOutput
 */

/**
 * @typedef {function(Scenes, InputMetadata, OutputMetadata): void} UpdateOutputMetadata
 */

/**
 * @typedef {Object} SetupResult
 * @property {Array<string>|Array<InputDescription>} input Description of the input data.
 * @property {OutputDescription|Array<OutputDescription>} output Description of the output data.
 * @property {'SIMPLE'|'ORBIT'|'TILE'} [mosaicking='SIMPLE'] Control how samples from input scenes are composed.
 */

/**
 * @typedef {Object} InputDescription
 * @property {Array<string>} bands Input band identifiers.
 * @property {string|Array<string>} [units] Input band units.
 * @property {Array<string>} [metadata] Properties to include in the input metadata.
 */

/**
 * @typedef {Object} OutputDescription
 * @property {string} [id='default'] Output identifier.
 * @property {number} bands Number of output bands.
 * @property {SampleType} [sampleType='AUTO'] Output sample type.
 * @property {number} [nodataValue] Output nodata value.
 */

/**
 * @typedef {Object} UpdatedOutputDescription
 * @property {number} bands Number of output bands.
 */

/**
 * @typedef {'INT8'|'UINT8'|'INT16'|'UINT16'|'FLOAT32'|'AUTO'} SampleType
 */

/**
 * @typedef {Object<string, number>} Sample
 */

/**
 * @typedef {Object} Collections
 * @property {string} [from] For 'ORBIT' mosaicking, this will be the start of the search interval.
 * @property {string} [to] For 'ORBIT' mosaicking, this will be the end of the search interval.
 * @property {Scenes} scenes The scenes in the collection.
 */

/**
 * @typedef {Object} Scenes
 * @property {Array<Orbit>} [orbit] Information about scenes included in the tile when 'mosaicking' is 'ORBIT'.
 * @property {Array<Tile>} [tiles] Information about scenes included in the tile when 'mosaicking' is 'TILE'.
 */

/**
 * @typedef {Object} Orbit
 * @property {string} dateFrom The earliest date for all scenes included in the tile.
 * @property {string} dateTo The latest date for scenes included in the tile.
 * @property {Array} tiles Metadata for each tile.
 */

/**
 * @typedef {Object} Tile
 * @property {string} date The date of scene used in the tile.
 * @property {number} cloudCoverage The estimated percentage of pixels obscured by clouds in the scene.
 * @property {string} dataPath The path to the data in storage.
 * @property {number} shId The internal identifier for the scene.
 */

/**
 * @typedef {Object} InputMetadata
 * @property {string} serviceVersion The version of the service used for processing.
 * @property {number} normalizationFactor The factor used to convert digital number (DN) values to reflectance.
 */

/**
 * @typedef {Object<string, unknown>} CustomData
 */

/**
 * @typedef {Object} OutputMetadata
 * @property {Object} userData Arbitrary user data.
 */

/**
 * @typedef {Object<string, Array<number>>} OutputValues
 */

/**
 * @typedef {Object} ProcessRequest
 * @property {ProcessRequestInput} input Input data configuration.
 * @property {string} evalscript The Evalscript used for processing.
 * @property {ProcessRequestOutput} [output] The output configuration.
 */

/**
 * @typedef {Object} ProcessRequestInput
 * @property {ProcessRequestInputBounds} bounds The bounding box of the input data.
 * @property {Array<ProcessRequestInputDataItem>} data The intput data.
 */

/**
 * @typedef {Object} ProcessRequestInputDataItem
 * @property {string} [type] The type of the input data.
 * @property {string} [id] The identifier of the input data.
 * @property {DataFilter} [dataFilter] The filter to apply to the input data.
 * @property {Object<string, unknown>} [processing] The processing to apply to the input data.
 */

/**
 * @typedef {Object} DataFilter
 * @property {TimeRange} [timeRange] The data time range.
 * @property {number} [maxCloudCoverage] The maximum cloud coverage (0-100).
 */

/**
 * @typedef {Object} TimeRange
 * @property {string} [from] The start time (inclusive).
 * @property {string} [to] The end time (inclusive).
 */

/**
 * @typedef {Object} ProcessRequestInputBounds
 * @property {Array<number>} [bbox] The bounding box of the input data.
 * @property {ProcessRequestInputBoundsProperties} [properties] The properties of the bounding box.
 * @property {import("geojson").Geometry} [geometry] The geometry of the bounding box.
 */

/**
 * @typedef {Object} ProcessRequestInputBoundsProperties
 * @property {string} crs The coordinate reference system of the bounding box.
 */

/**
 * @typedef {Object} ProcessRequestOutput
 * @property {number} [width] Image width in pixels.
 * @property {number} [height] Image height in pixels.
 * @property {number} [resx] Spatial resolution in the x direction.
 * @property {number} [resy] Spatial resolution in the y direction.
 * @property {Array<ProcessRequestOutputResponse>} [responses] Response configuration.
 */

/**
 * @typedef {Object} ProcessRequestOutputResponse
 * @property {string} [identifier] Identifier used to connect results to outputs from the setup.
 * @property {ProcessRequestOutputFormat} [format] Response format.
 */

/**
 * @typedef {Object} ProcessRequestOutputFormat
 * @property {string} [type] The output format type.
 */

/**
 * @param {Evalscript} evalscript The object to serialize.
 * @return {string} The serialized Evalscript.
 */
function serializeEvalscript(evalscript) {
  const version = evalscript.version || defaultEvalscriptVersion;
  return `//VERSION=${version}
    ${serializeFunction('setup', evalscript.setup)}
    ${serializeFunction('evaluatePixel', evalscript.evaluatePixel)}
    ${serializeFunction('updateOutput', evalscript.updateOutput)}
  `;
}

/**
 * Get a loaded image given a response.
 *
 * @param {Response} response The response.
 * @return {Promise<HTMLImageElement>} The image.
 */
async function imageFromResponse(response) {
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const image = new Image();
    const blobUrl = URL.createObjectURL(blob);
    image.onload = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Failed to load image'));
    };
    image.src = blobUrl;
  });
}

/**
 * @param {number} ms Milliseconds.
 * @return {Promise<void>} A promise that resolves after the given time.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {AuthConfig} auth The authentication configuration.
 * @return {Promise<string>} The authentication token.
 */
async function getToken(auth) {
  const url = auth.tokenUrl || defaultTokenUrl;
  const body = new URLSearchParams();
  body.append('grant_type', 'client_credentials');
  body.append('client_id', auth.clientId);
  body.append('client_secret', auth.clientSecret);

  /**
   * @type {RequestInit}
   */
  const options = {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body,
  };
  const response = await fetch(url, options);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Bad client id or secret');
    }
    throw new Error('Failed to get token');
  }
  const data = await response.json();
  return data.access_token;
}

/**
 * @param {string} token The access token to parse.
 * @return {AccessTokenClaims} The parsed token claims.
 */
export function parseTokenClaims(token) {
  const base64EncodedClaims = token
    .split('.')[1]
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const chars = atob(base64EncodedClaims).split('');
  const count = chars.length;
  const uriEncodedChars = new Array(count);
  for (let i = 0; i < count; ++i) {
    const c = chars[i];
    uriEncodedChars[i] = '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }

  return JSON.parse(decodeURIComponent(uriEncodedChars.join('')));
}

/**
 * Gets a CRS identifier accepted by Sentinel Hub.
 * See https://docs.sentinel-hub.com/api/latest/api/process/crs/.
 *
 * @param {import("../proj/Projection.js").default} projection The projection.
 * @return {string} The projection identifier accepted by Sentinel Hub.
 */
export function getProjectionIdentifier(projection) {
  const ogcId = 'http://www.opengis.net/def/crs/';
  const code = projection.getCode();
  if (code.startsWith(ogcId)) {
    return code;
  }
  if (code.startsWith('EPSG:')) {
    return `${ogcId}EPSG/0/${code.slice(5)}`;
  }
  if (equivalentProjections(projection, getProjection('EPSG:4326'))) {
    return `${ogcId}EPSG/0/4326`;
  }

  // hope for the best
  return code;
}

/**
 * This is intended to work with named functions, anonymous functions, arrow functions, and object methods.
 * Due to how the Evalscript is executed, these are serialized as function expressions using `var`.
 *
 * @param {string} name The name of the function.
 * @param {Function|undefined} func The function to serialize.
 * @return {string} The serialized function.
 */
export function serializeFunction(name, func) {
  if (!func) {
    return '';
  }
  let expression = func.toString();
  if (
    func.name &&
    func.name !== 'function' &&
    expression.match(new RegExp('^' + func.name.replace('$', '\\$') + '\\b'))
  ) {
    // assume function came from an object property using method syntax
    expression = 'function ' + expression;
  }
  return `var ${name} = ${expression};`;
}

/**
 * @typedef {Object} Options
 * @property {AuthConfig|string} [auth] The authentication configuration with `clientId` and `clientSecret` or an access token.
 * See [Sentinel Hub authentication](https://docs.sentinel-hub.com/api/latest/api/overview/authentication/)
 * for details.  If not provided in the constructor, the source will not be rendered until {@link module:ol/source/SentinelHub~SentinelHub#setAuth}
 * is called.
 * @property {Array<ProcessRequestInputDataItem>} [data] The input data configuration.  If not provided in the constructor,
 * the source will not be rendered until {@link module:ol/source/SentinelHub~SentinelHub#setData} is called.
 * @property {Evalscript|string} [evalscript] The process applied to the input data.  If not provided in the constructor,
 * the source will not be rendered until {@link module:ol/source/SentinelHub~SentinelHub#setEvalscript} is called.  See the
 * `setEvalscript` documentation for details on the restrictions when passing process functions.
 * @property {number|import("../size.js").Size} [tileSize=[512, 512]] The pixel width and height of the source tiles.
 * @property {string} [url='https://services.sentinel-hub.com/api/v1/process'] The Sentinel Hub Processing API URL.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is the view projection.
 * @property {boolean} [attributionsCollapsible=true] Allow the attributions to be collapsed.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
 * @property {boolean} [wrapX=true] Wrap the world horizontally.
 * @property {number} [transition] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 */

/**
 * @classdesc
 * A tile source that generates tiles using the Sentinel Hub [Processing API](https://docs.sentinel-hub.com/api/latest/api/process/).
 * All of the constructor options are optional, however the source will not be ready for rendering until the `auth`, `data`,
 * and `evalscript` properties are provided.  These can be set after construction with the {@link module:ol/source/SentinelHub~SentinelHub#setAuth},
 * {@link module:ol/source/SentinelHub~SentinelHub#setData}, and {@link module:ol/source/SentinelHub~SentinelHub#setEvalscript}
 * methods.
 *
 * If there are errors while configuring the source or fetching an access token, the `change` event will be fired and the
 * source state will be set to `error`.  See the {@link module:ol/source/SentinelHub~SentinelHub#getError} method for
 * details on handling these errors.
 * @api
 */
class SentinelHub extends DataTileSource {
  /**
   * @param {Options} [options] Sentinel Hub options.
   */
  constructor(options) {
    /**
     * @type {Options}
     */
    const config = options || {};

    super({
      state: 'loading',
      projection: config.projection,
      attributionsCollapsible: config.attributionsCollapsible,
      interpolate: config.interpolate,
      tileSize: config.tileSize || defaultTileSize,
      wrapX: config.wrapX !== undefined ? config.wrapX : true,
      transition: config.transition,
    });

    this.setLoader((x, y, z) => this.loadTile_(x, y, z, 1));

    /**
     * @type {Error|null}
     */
    this.error_ = null;

    /**
     * @type {string}
     * @private
     */
    this.evalscript_ = '';

    /**
     * @type {Array<ProcessRequestInputDataItem>|null}
     * @private
     */
    this.inputData_ = null;

    /**
     * @type {string}
     * @private
     */
    this.processUrl_ = config.url || defaultProcessUrl;

    /**
     * @type {string}
     * @private
     */
    this.token_ = '';

    /**
     * @type {ReturnType<typeof setTimeout>}
     * @private
     */
    this.tokenRenewalId_;

    if (config.auth) {
      this.setAuth(config.auth);
    }

    if (config.data) {
      this.setData(config.data);
    }

    if (config.evalscript) {
      this.setEvalscript(config.evalscript);
    }
  }

  /**
   * Set the authentication configuration for the source (if not provided in the constructor).
   * If an object with `clientId` and `clientSecret` is provided, an access token will be fetched
   * and used with processing requests.  Alternatively, an access token can be supplied directly.
   *
   * @param {AuthConfig|string} auth The auth config or access token.
   * @api
   */
  async setAuth(auth) {
    clearTimeout(this.tokenRenewalId_);

    if (typeof auth === 'string') {
      this.token_ = auth;
      this.fireWhenReady_();
      return;
    }

    /**
     * @type {string}
     */
    let token;

    /**
     * @type {AccessTokenClaims}
     */
    let claims;

    try {
      token = await getToken(auth);
      claims = parseTokenClaims(token);
    } catch (error) {
      this.error_ = error;
      this.setState('error');
      return;
    }
    this.token_ = token;

    const expiry = claims.exp * 1000;
    const timeout = Math.max(expiry - Date.now() - 60 * 1000, 1);
    this.tokenRenewalId_ = setTimeout(() => this.setAuth(auth), timeout);
    this.fireWhenReady_();
  }

  /**
   * Set or update the input data used.
   *
   * @param {Array<ProcessRequestInputDataItem>} data The input data configuration.
   * @api
   */
  setData(data) {
    this.inputData_ = data;
    this.fireWhenReady_();
  }

  /**
   * Set or update the Evalscript used to process the data.  Either a process object or a string
   * Evalscript can be provided.  If a process object is provided, it will be serialized to produce the
   * Evalscript string.  Because these functions will be serialized and executed by the Processing API,
   * they cannot refer to other variables or functions that are not provided by the Processing API
   * context.
   *
   * @param {Evalscript|string} evalscript The process to apply to the input data.
   * @api
   */
  setEvalscript(evalscript) {
    let script;
    if (typeof evalscript === 'string') {
      script = evalscript;
    } else {
      try {
        script = serializeEvalscript(evalscript);
      } catch (error) {
        this.error_ = error;
        this.setState('error');
        return;
      }
    }
    this.evalscript_ = script;
    this.fireWhenReady_();
  }

  fireWhenReady_() {
    if (!this.token_ || !this.evalscript_ || !this.inputData_) {
      return;
    }
    const state = this.getState();
    if (state === 'ready') {
      this.changed();
      return;
    }
    this.setState('ready');
  }

  /**
   * @param {number} z The z tile index.
   * @param {number} x The x tile index.
   * @param {number} y The y tile index.
   * @param {number} attempt The attempt number (starting with 1).  Incremented with retries.
   * @return {Promise<import('../DataTile.js').Data>} The composed tile data.
   * @private
   */
  async loadTile_(z, x, y, attempt) {
    const tileGrid = this.getTileGrid();
    const extent = tileGrid.getTileCoordExtent([z, x, y]);
    const tileSize = this.getTileSize(z);
    const projection = this.getProjection();

    /**
     * @type {ProcessRequest}
     */
    const body = {
      input: {
        bounds: {
          bbox: extent,
          properties: {crs: getProjectionIdentifier(projection)},
        },
        data: this.inputData_,
      },
      output: {
        width: tileSize[0],
        height: tileSize[1],
      },
      evalscript: this.evalscript_,
    };

    /**
     * @type {RequestInit}
     */
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token_}`,
        'Access-Control-Request-Headers': 'Retry-After',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    };

    const response = await fetch(this.processUrl_, options);
    if (!response.ok) {
      if (response.status === 429 && attempt < maxRetries - 1) {
        // The Retry-After header includes unreasonable wait times, instead use exponential backoff.
        const retryAfter = baseDelay * 2 ** attempt;
        await delay(retryAfter);
        return this.loadTile_(x, y, z, attempt + 1);
      }
      throw new Error(`Failed to get tile: ${response.statusText}`);
    }

    return imageFromResponse(response);
  }

  /**
   * When the source state is `error`, use this function to get more information about the error.
   * To debug a faulty configuration, you may want to use a listener like this:
   * ```js
   * source.on('change', () => {
   *   if (source.getState() === 'error') {
   *     console.error(source.getError());
   *   }
   * });
   * ```
   *
   * @return {Error|null} A source loading error.
   * @api
   */
  getError() {
    return this.error_;
  }

  /**
   * Clean up.
   * @override
   */
  disposeInternal() {
    clearTimeout(this.tokenRenewalId_);
    super.disposeInternal();
  }
}

export default SentinelHub;
