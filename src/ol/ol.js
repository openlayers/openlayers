goog.require('goog.userAgent');

goog.provide('ol');


/**
 * @define {boolean} Assume touch.
 */
ol.ASSUME_TOUCH = false;


/**
 * @define {boolean} Whether to enable canvas.
 */
ol.ENABLE_CANVAS = true;


/**
 * @define {boolean} Whether to enable DOM.
 */
ol.ENABLE_DOM = true;


/**
 * @define {boolean} Whether to enable rendering of image layers.
 */
ol.ENABLE_IMAGE = true;


/**
 * @define {boolean} Whether to enable rendering of tile layers.
 */
ol.ENABLE_TILE = true;


/**
 * @define {boolean} Whether to enable rendering of vector layers.
 */
ol.ENABLE_VECTOR = true;


/**
 * @define {boolean} Whether to enable WebGL.
 */
ol.ENABLE_WEBGL = true;


/**
 * @define {boolean} Whether to support legacy IE (7-8).
 */
ol.LEGACY_IE_SUPPORT = false;


/**
 * The page is loaded using HTTPS.
 * @const
 * @type {boolean}
 */
ol.IS_HTTPS = goog.global.location.protocol === 'https:';


/**
 * Whether the current browser is legacy IE
 * @const
 * @type {boolean}
 */
ol.IS_LEGACY_IE = goog.userAgent.IE &&
    !goog.userAgent.isVersionOrHigher('9.0') && goog.userAgent.VERSION !== '';


/**
 * ol.inherits is an alias to the goog.inherits function. It is exported
 * for use in non-compiled application code.
 *
 * FIXME: We use a new line to fake the linter. Without the new line the
 * linter complains with:
 *
 * "Missing newline between constructor and goog.inherits"
 * @todo api
 */
ol.inherits =
    goog.inherits;
