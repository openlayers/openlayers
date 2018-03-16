/**
 * @module ol/typedefs
 */

//FIXME Remove when reworking typedefs, export typedefs as variables instead
const ol = {};

/**
 * File for all typedefs used by the compiler, and referenced by JSDoc.
 *
 * These look like vars (or var properties), but in fact are simply identifiers
 * for the Closure compiler. Originally they were included in the appropriate
 * namespace file, but with the move away from Closure namespaces and towards
 * self-contained standard modules are now all in this file.
 * Unlike the other type definitions - enums and constructor functions - they
 * are not code and so are not imported or exported. They are only referred to
 * in type-defining comments used by the Closure compiler, and so should not
 * appear in module code.
 *
 * They are now all in the `ol` namespace.
 */


/**
 * @typedef {{x: number, y: number, width: number, height: number}}
 */
ol.AtlasBlock;


/**
 * Provides information for an image inside an atlas.
 * `offsetX` and `offsetY` are the position of the image inside
 * the atlas image `image`.
 * @typedef {{offsetX: number, offsetY: number, image: HTMLCanvasElement}}
 */
ol.AtlasInfo;


/**
 * Provides information for an image inside an atlas manager.
 * `offsetX` and `offsetY` is the position of the image inside
 * the atlas image `image` and the position of the hit-detection image
 * inside the hit-detection atlas image `hitImage`.
 * @typedef {{offsetX: number, offsetY: number, image: HTMLCanvasElement,
 *    hitImage: HTMLCanvasElement}}
 */
ol.AtlasManagerInfo;


/**
 * A type that can be used to provide attribution information for data sources.
 *
 * It represents either
 * * a simple string (e.g. `'© Acme Inc.'`)
 * * an array of simple strings (e.g. `['© Acme Inc.', '© Bacme Inc.']`)
 * * a function that returns a string or array of strings (`{@link ol.Attribution}`)
 *
 * @typedef {string|Array.<string>|ol.Attribution}
 */
ol.AttributionLike;


/**
 * A function that returns a string or an array of strings representing source
 * attributions.
 *
 * @typedef {function(olx.FrameState): (string|Array.<string>)}
 */
ol.Attribution;


/**
 * @typedef {{fillStyle: ol.ColorLike}}
 */
ol.CanvasFillState;


/**
 * A function returning the canvas element (`{HTMLCanvasElement}`)
 * used by the source as an image. The arguments passed to the function are:
 * {@link module:ol/extent~Extent} the image extent, `{number}` the image resolution,
 * `{number}` the device pixel ratio, {@link module:ol/size~Size} the image size, and
 * {@link module:ol/proj/Projection~Projection} the image projection. The canvas returned by
 * this function is cached by the source. The this keyword inside the function
 * references the {@link ol.source.ImageCanvas}.
 *
 * @typedef {function(this:ol.source.ImageCanvas, module:ol/extent~Extent, number,
 *     number, module:ol/size~Size, module:ol/proj/Projection~Projection): HTMLCanvasElement}
 */
ol.CanvasFunctionType;


/**
 * @typedef {{currentFillStyle: (ol.ColorLike|undefined),
 *            currentStrokeStyle: (ol.ColorLike|undefined),
 *            currentLineCap: (string|undefined),
 *            currentLineDash: Array.<number>,
 *            currentLineDashOffset: (number|undefined),
 *            currentLineJoin: (string|undefined),
 *            currentLineWidth: (number|undefined),
 *            currentMiterLimit: (number|undefined),
 *            lastStroke: (number|undefined),
 *            fillStyle: (ol.ColorLike|undefined),
 *            strokeStyle: (ol.ColorLike|undefined),
 *            lineCap: (string|undefined),
 *            lineDash: Array.<number>,
 *            lineDashOffset: (number|undefined),
 *            lineJoin: (string|undefined),
 *            lineWidth: (number|undefined),
 *            miterLimit: (number|undefined)}|null}
 */
ol.CanvasFillStrokeState;


/**
 * @typedef {{lineCap: string,
 *            lineDash: Array.<number>,
 *            lineDashOffset: number,
 *            lineJoin: string,
 *            lineWidth: number,
 *            miterLimit: number,
 *            strokeStyle: ol.ColorLike}}
 */
ol.CanvasStrokeState;


/**
 * @typedef {{font: string,
 *            textAlign: (string|undefined),
 *            textBaseline: string}}
 */
ol.CanvasTextState;


/**
 * @typedef {{strokeStyle: (ol.ColorLike|undefined), strokeWidth: number,
 *   size: number, lineDash: Array.<number>}}
 */
ol.CircleRenderOptions;


/**
 * Container for decluttered replay instructions that need to be rendered or
 * omitted together, i.e. when styles render both an image and text, or for the
 * characters that form text along lines. The basic elements of this array are
 * `[minX, minY, maxX, maxY, count]`, where the first four entries are the
 * rendered extent of the group in pixel space. `count` is the number of styles
 * in the group, i.e. 2 when an image and a text are grouped, or 1 otherwise.
 * In addition to these four elements, declutter instruction arrays (i.e. the
 * arguments to @{link ol.render.canvas.drawImage} are appended to the array.
 * @typedef {Array.<*>}
 */
ol.DeclutterGroup;


/**
 * @typedef {{x: number, xunits: (ol.style.IconAnchorUnits|undefined),
 *            y: number, yunits: (ol.style.IconAnchorUnits|undefined),
 *            origin: (ol.style.IconOrigin|undefined)}}
 */
ol.KMLVec2_;


/**
 * @typedef {{flatCoordinates: Array.<number>,
 *            whens: Array.<number>}}
 */
ol.KMLGxTrackObject_;


/**
 * @typedef {{hasZ: (boolean|undefined), hasM: (boolean|undefined)}}
 */
ol.LayoutOptions;


/**
 * @typedef {{prev: (ol.LinkedListItem|undefined),
 *            next: (ol.LinkedListItem|undefined),
 *            data: ?}}
 */
ol.LinkedListItem;


/**
 * A function that takes an {@link module:ol/extent~Extent} and a resolution as arguments, and
 * returns an array of {@link module:ol/extent~Extent} with the extents to load. Usually this
 * is one of the standard {@link ol.loadingstrategy} strategies.
 *
 * @typedef {function(module:ol/extent~Extent, number): Array.<module:ol/extent~Extent>}
 */
ol.LoadingStrategy;


/**
 * @typedef {{key_: string,
 *            newer: Object,
 *            older: Object,
 *            value_: *}}
 */
ol.LRUCacheEntry;


/**
 * A function that takes an array of input data, performs some operation, and
 * returns an array of output data.
 * For `pixel` type operations, the function will be called with an array of
 * pixels, where each pixel is an array of four numbers (`[r, g, b, a]`) in the
 * range of 0 - 255. It should return a single pixel array.
 * For `'image'` type operations, functions will be called with an array of
 * {@link ImageData https://developer.mozilla.org/en-US/docs/Web/API/ImageData}
 * and should return a single {@link ImageData
 * https://developer.mozilla.org/en-US/docs/Web/API/ImageData}.  The operations
 * are called with a second "data" argument, which can be used for storage.  The
 * data object is accessible from raster events, where it can be initialized in
 * "beforeoperations" and accessed again in "afteroperations".
 *
 * @typedef {function((Array.<Array.<number>>|Array.<ImageData>), Object):
 *     (Array.<number>|ImageData)}
 */
ol.RasterOperation;


/**
 * @typedef {{
 *   strokeStyle: (ol.ColorLike|undefined),
 *   strokeWidth: number,
 *   size: number,
 *   lineCap: string,
 *   lineDash: Array.<number>,
 *   lineJoin: string,
 *   miterLimit: number
 * }}
 */
ol.RegularShapeRenderOptions;


/**
 * @typedef {function(module:ol/extent~Extent, number, number) : ol.ImageBase}
 */
ol.ReprojImageFunctionType;


/**
 * @typedef {function(number, number, number, number) : ol.Tile}
 */
ol.ReprojTileFunctionType;


/**
 * Single triangle; consists of 3 source points and 3 target points.
 *
 * @typedef {{source: Array.<module:ol/coordinate~Coordinate>,
 *            target: Array.<module:ol/coordinate~Coordinate>}}
 */
ol.ReprojTriangle;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *            extent: (null|module:ol/extent~Extent|undefined),
 *            projection: module:ol/proj~ProjectionLike,
 *            resolutions: (Array.<number>|undefined),
 *            state: (ol.source.State|undefined)}}
 */
ol.SourceImageOptions;


/**
 * @typedef {{revision: number,
 *            resolution: number,
 *            extent: module:ol/extent~Extent}}
 */
ol.SourceRasterRenderedState;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *            projection: module:ol/proj~ProjectionLike,
 *            state: (ol.source.State|undefined),
 *            wrapX: (boolean|undefined)}}
 */
ol.SourceSourceOptions;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *            cacheSize: (number|undefined),
 *            extent: (module:ol/extent~Extent|undefined),
 *            opaque: (boolean|undefined),
 *            tilePixelRatio: (number|undefined),
 *            projection: module:ol/proj~ProjectionLike,
 *            state: (ol.source.State|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            wrapX: (boolean|undefined),
 *            transition: (number|undefined)}}
 */
ol.SourceTileOptions;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *            cacheSize: (number|undefined),
 *            extent: (module:ol/extent~Extent|undefined),
 *            opaque: (boolean|undefined),
 *            projection: module:ol/proj~ProjectionLike,
 *            state: (ol.source.State|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            tileLoadFunction: module:ol/Tile~LoadFunction,
 *            tilePixelRatio: (number|undefined),
 *            tileUrlFunction: (module:ol/tileurlfunction~Type|undefined),
 *            url: (string|undefined),
 *            urls: (Array.<string>|undefined),
 *            wrapX: (boolean|undefined),
 *            transition: (number|undefined)}}
 */
ol.SourceUrlTileOptions;


/**
 * A function that takes an {@link module:ol/Feature~Feature} as argument and returns an
 * {@link module:ol/geom/Geometry~Geometry} that will be rendered and styled for the feature.
 *
 * @typedef {function((module:ol/Feature~Feature|ol.render.Feature)):
 *     (module:ol/geom/Geometry~Geometry|ol.render.Feature|undefined)}
 */
ol.StyleGeometryFunction;


/**
 * Custom renderer function. Takes two arguments:
 *
 * 1. The pixel coordinates of the geometry in GeoJSON notation.
 * 2. The {@link olx.render.State} of the layer renderer.
 *
 * @typedef {function((module:ol/coordinate~Coordinate|Array<module:ol/coordinate~Coordinate>|Array.<Array.<module:ol/coordinate~Coordinate>>),olx.render.State)}
 */
ol.StyleRenderFunction;


/**
 * @typedef {{opacity: number,
 *            rotateWithView: boolean,
 *            rotation: number,
 *            scale: number,
 *            snapToPixel: boolean}}
 */
ol.StyleImageOptions;


/**
 * @typedef {{buf: ol.webgl.Buffer,
 *            buffer: WebGLBuffer}}
 */
ol.WebglBufferCacheEntry;


/**
 * @typedef {{atlas: ol.style.AtlasManager,
 *            width: Object.<string, number>,
 *            height: number}}
 */
ol.WebglGlyphAtlas;


/**
 * @typedef {{p0: ol.WebglPolygonVertex,
 *            p1: ol.WebglPolygonVertex}}
 */
ol.WebglPolygonSegment;

/**
 * @typedef {{x: number,
 *            y: number,
 *            i: number,
 *            reflex: (boolean|undefined)}}
 */
ol.WebglPolygonVertex;


/**
 * @typedef {{magFilter: number, minFilter: number, texture: WebGLTexture}}
 */
ol.WebglTextureCacheEntry;


/**
 * Number of features; bounds/extent.
 * @typedef {{numberOfFeatures: number,
 *            bounds: module:ol/extent~Extent}}
 */
ol.WFSFeatureCollectionMetadata;


/**
 * Total deleted; total inserted; total updated; array of insert ids.
 * @typedef {{totalDeleted: number,
 *            totalInserted: number,
 *            totalUpdated: number,
 *            insertIds: Array.<string>}}
 */
ol.WFSTransactionResponse;


/**
 * @typedef {{type: number, value: (number|string|undefined), position: number}}
 */
ol.WKTToken;


/**
 * @typedef {{minX: number, minY: number, maxX: number, maxY: number,
 *            value: (Object|undefined)}}
 */
ol.RBushEntry;
