goog.require('goog.userAgent');

goog.provide('ol');


/**
 * @define {boolean} Assume touch.
 */
ol.ASSUME_TOUCH = false;


/**
 * @define {boolean} Replace unused entries with NaNs.
 */
ol.BUFFER_REPLACE_UNUSED_ENTRIES_WITH_NANS = goog.DEBUG;


/**
 * @define {number} Default maximum zoom for default tile grids.
 */
ol.DEFAULT_MAX_ZOOM = 42;


/**
 * @define {number} Default high water mark.
 */
ol.DEFAULT_TILE_CACHE_HIGH_WATER_MARK = 2048;


/**
 * @define {number} Default tile size.
 */
ol.DEFAULT_TILE_SIZE = 256;


/**
 * @define {string} Default WMS version.
 */
ol.DEFAULT_WMS_VERSION = '1.3.0';


/**
 * @define {number} Drag-rotate-zoom animation duration.
 */
ol.DRAGROTATEANDZOOM_ANIMATION_DURATION = 400;


/**
 * @define {number} Drag-rotate animation duration.
 */
ol.DRAGROTATE_ANIMATION_DURATION = 250;


/**
 * @define {number} Drag-zoom animation duration.
 */
ol.DRAGZOOM_ANIMATION_DURATION = 200;


/**
 * @define {number} Hysterisis pixels.
 */
ol.DRAG_BOX_HYSTERESIS_PIXELS = 8;


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
 * @define {boolean} Enable named colors.
 * Enabling named colors adds about 3KB uncompressed / 1.5KB compressed to the
 * final build size.
 */
ol.ENABLE_NAMED_COLORS = true;


/**
 * @define {boolean} Enable Proj4js.
 */
ol.ENABLE_PROJ4JS = true;


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
 * @define {number} Keyboard pan duration.
 */
ol.KEYBOARD_PAN_DURATION = 100;


/**
 * @define {number} Maximum mouse wheel delta.
 */
ol.MOUSEWHEELZOOM_MAXDELTA = 1;


/**
 * @define {number} Mouse wheel timeout duration.
 */
ol.MOUSEWHEELZOOM_TIMEOUT_DURATION = 80;


/**
 * @define {number} Rotate animation duration.
 */
ol.ROTATE_ANIMATION_DURATION = 250;


/**
 * @define {number} Texture cache high water mark.
 */
ol.WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK = 1024;


/**
 * @define {number} Zoom slider animation duration.
 */
ol.ZOOMSLIDER_ANIMATION_DURATION = 200;


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
