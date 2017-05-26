goog.provide('ol');


/**
 * Constants defined with the define tag cannot be changed in application
 * code, but can be set at compile time.
 * Some reduce the size of the build in advanced compile mode.
 */


/**
 * @define {boolean} Assume touch.  Default is `false`.
 */
ol.ASSUME_TOUCH = false;


/**
 * TODO: rename this to something having to do with tile grids
 * see https://github.com/openlayers/openlayers/issues/2076
 * @define {number} Default maximum zoom for default tile grids.
 */
ol.DEFAULT_MAX_ZOOM = 42;


/**
 * @define {number} Default min zoom level for the map view.  Default is `0`.
 */
ol.DEFAULT_MIN_ZOOM = 0;


/**
 * @define {number} Default maximum allowed threshold  (in pixels) for
 *     reprojection triangulation. Default is `0.5`.
 */
ol.DEFAULT_RASTER_REPROJECTION_ERROR_THRESHOLD = 0.5;


/**
 * @define {number} Default tile size.
 */
ol.DEFAULT_TILE_SIZE = 256;


/**
 * @define {string} Default WMS version.
 */
ol.DEFAULT_WMS_VERSION = '1.3.0';


/**
 * @define {boolean} Enable the Canvas renderer.  Default is `true`. Setting
 *     this to false at compile time in advanced mode removes all code
 *     supporting the Canvas renderer from the build.
 */
ol.ENABLE_CANVAS = true;


/**
 * @define {boolean} Enable integration with the Proj4js library.  Default is
 *     `true`.
 */
ol.ENABLE_PROJ4JS = true;


/**
 * @define {boolean} Enable automatic reprojection of raster sources. Default is
 *     `true`.
 */
ol.ENABLE_RASTER_REPROJECTION = true;


/**
 * @define {boolean} Enable the WebGL renderer.  Default is `true`. Setting
 *     this to false at compile time in advanced mode removes all code
 *     supporting the WebGL renderer from the build.
 */
ol.ENABLE_WEBGL = true;


/**
 * @define {boolean} Include debuggable shader sources.  Default is `true`.
 *     This should be set to `false` for production builds (if `ol.ENABLE_WEBGL`
 *     is `true`).
 */
ol.DEBUG_WEBGL = true;


/**
 * @define {number} The size in pixels of the first atlas image. Default is
 * `256`.
 */
ol.INITIAL_ATLAS_SIZE = 256;


/**
 * @define {number} The maximum size in pixels of atlas images. Default is
 * `-1`, meaning it is not used (and `ol.WEBGL_MAX_TEXTURE_SIZE` is
 * used instead).
 */
ol.MAX_ATLAS_SIZE = -1;


/**
 * @define {number} Maximum mouse wheel delta.
 */
ol.MOUSEWHEELZOOM_MAXDELTA = 1;


/**
 * @define {number} Maximum width and/or height extent ratio that determines
 * when the overview map should be zoomed out.
 */
ol.OVERVIEWMAP_MAX_RATIO = 0.75;


/**
 * @define {number} Minimum width and/or height extent ratio that determines
 * when the overview map should be zoomed in.
 */
ol.OVERVIEWMAP_MIN_RATIO = 0.1;


/**
 * @define {number} Maximum number of source tiles for raster reprojection of
 *     a single tile.
 *     If too many source tiles are determined to be loaded to create a single
 *     reprojected tile the browser can become unresponsive or even crash.
 *     This can happen if the developer defines projections improperly and/or
 *     with unlimited extents.
 *     If too many tiles are required, no tiles are loaded and
 *     `ol.TileState.ERROR` state is set. Default is `100`.
 */
ol.RASTER_REPROJECTION_MAX_SOURCE_TILES = 100;


/**
 * @define {number} Maximum number of subdivision steps during raster
 *     reprojection triangulation. Prevents high memory usage and large
 *     number of proj4 calls (for certain transformations and areas).
 *     At most `2*(2^this)` triangles are created for each triangulated
 *     extent (tile/image). Default is `10`.
 */
ol.RASTER_REPROJECTION_MAX_SUBDIVISION = 10;


/**
 * @define {number} Maximum allowed size of triangle relative to world width.
 *     When transforming corners of world extent between certain projections,
 *     the resulting triangulation seems to have zero error and no subdivision
 *     is performed.
 *     If the triangle width is more than this (relative to world width; 0-1),
 *     subdivison is forced (up to `ol.RASTER_REPROJECTION_MAX_SUBDIVISION`).
 *     Default is `0.25`.
 */
ol.RASTER_REPROJECTION_MAX_TRIANGLE_WIDTH = 0.25;


/**
 * @define {number} Tolerance for geometry simplification in device pixels.
 */
ol.SIMPLIFY_TOLERANCE = 0.5;


/**
 * @define {number} Texture cache high water mark.
 */
ol.WEBGL_TEXTURE_CACHE_HIGH_WATER_MARK = 1024;


/**
 * @define {string} OpenLayers version.
 */
ol.VERSION = '';


/**
 * The maximum supported WebGL texture size in pixels. If WebGL is not
 * supported, the value is set to `undefined`.
 * @const
 * @type {number|undefined}
 */
ol.WEBGL_MAX_TEXTURE_SIZE; // value is set in `ol.has`


/**
 * List of supported WebGL extensions.
 * @const
 * @type {Array.<string>}
 */
ol.WEBGL_EXTENSIONS; // value is set in `ol.has`


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 *
 *     function ParentClass(a, b) { }
 *     ParentClass.prototype.foo = function(a) { }
 *
 *     function ChildClass(a, b, c) {
 *       // Call parent constructor
 *       ParentClass.call(this, a, b);
 *     }
 *     ol.inherits(ChildClass, ParentClass);
 *
 *     var child = new ChildClass('a', 'b', 'see');
 *     child.foo(); // This works.
 *
 * @param {!Function} childCtor Child constructor.
 * @param {!Function} parentCtor Parent constructor.
 * @function
 * @api
 */
ol.inherits = function(childCtor, parentCtor) {
  childCtor.prototype = Object.create(parentCtor.prototype);
  childCtor.prototype.constructor = childCtor;
};


/**
 * A reusable function, used e.g. as a default for callbacks.
 *
 * @return {undefined} Nothing.
 */
ol.nullFunction = function() {};


/**
 * Gets a unique ID for an object. This mutates the object so that further calls
 * with the same object as a parameter returns the same value. Unique IDs are generated
 * as a strictly increasing sequence. Adapted from goog.getUid.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
ol.getUid = function(obj) {
  return obj.ol_uid ||
      (obj.ol_uid = ++ol.uidCounter_);
};


/**
 * Counter for getUid.
 * @type {number}
 * @private
 */
ol.uidCounter_ = 0;
