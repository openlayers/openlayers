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
 * A function that returns a string or an array of strings representing source
 * attributions.
 *
 * @typedef {function(olx.FrameState): (string|Array.<string>)}
 */
ol.Attribution;


/**
 * @typedef {{fillStyle: module:ol/colorlike~ColorLike}}
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
 * @typedef {{currentFillStyle: (module:ol/colorlike~ColorLike|undefined),
 *            currentStrokeStyle: (module:ol/colorlike~ColorLike|undefined),
 *            currentLineCap: (string|undefined),
 *            currentLineDash: Array.<number>,
 *            currentLineDashOffset: (number|undefined),
 *            currentLineJoin: (string|undefined),
 *            currentLineWidth: (number|undefined),
 *            currentMiterLimit: (number|undefined),
 *            lastStroke: (number|undefined),
 *            fillStyle: (module:ol/colorlike~ColorLike|undefined),
 *            strokeStyle: (module:ol/colorlike~ColorLike|undefined),
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
 *            strokeStyle: module:ol/colorlike~ColorLike}}
 */
ol.CanvasStrokeState;


/**
 * @typedef {{font: string,
 *            textAlign: (string|undefined),
 *            textBaseline: string}}
 */
ol.CanvasTextState;


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
 * A function that takes an {@link module:ol/extent~Extent} and a resolution as arguments, and
 * returns an array of {@link module:ol/extent~Extent} with the extents to load. Usually this
 * is one of the standard {@link ol.loadingstrategy} strategies.
 *
 * @typedef {function(module:ol/extent~Extent, number): Array.<module:ol/extent~Extent>}
 */
ol.LoadingStrategy;
