/**
 * File for all top-level (in the `ol` namespace) typedefs used by the compiler,
 * and referenced by JSDoc.
 */


/**
 * @typedef {string|Array.<string>|ol.Attribution|Array.<ol.Attribution>}
 * @api
 */
ol.AttributionLike;


/**
 * A function returning the canvas element (`{HTMLCanvasElement}`)
 * used by the source as an image. The arguments passed to the function are:
 * {@link ol.Extent} the image extent, `{number}` the image resolution,
 * `{number}` the device pixel ratio, {@link ol.Size} the image size, and
 * {@link ol.proj.Projection} the image projection. The canvas returned by
 * this function is cached by the source. The this keyword inside the function
 * references the {@link ol.source.ImageCanvas}.
 *
 * @typedef {function(this:ol.source.ImageCanvas, ol.Extent, number,
 *     number, ol.Size, ol.proj.Projection): HTMLCanvasElement}
 * @api
 */
ol.CanvasFunctionType;


/**
 * @typedef {function((ol.Coordinate|undefined)): (ol.Coordinate|undefined)}
 */
ol.CenterConstraintType;


/**
 * A color represented as a short array [red, green, blue, alpha].
 * red, green, and blue should be integers in the range 0..255 inclusive.
 * alpha should be a float in the range 0..1 inclusive. If no alpha value is
 * given then `1` will be used.
 * @typedef {Array.<number>}
 * @api
 */
ol.Color;


/**
 * A type accepted by CanvasRenderingContext2D.fillStyle.
 * Represents a color, pattern, or gradient.
 *
 * @typedef {string|CanvasPattern|CanvasGradient}
 * @api
 */
ol.ColorLike;


/**
 * An array of numbers representing an xy coordinate. Example: `[16, 48]`.
 * @typedef {Array.<number>} ol.Coordinate
 * @api stable
 */
ol.Coordinate;


/**
 * A function that takes a {@link ol.Coordinate} and transforms it into a
 * `{string}`.
 *
 * @typedef {function((ol.Coordinate|undefined)): string}
 * @api stable
 */
ol.CoordinateFormatType;


/**
 * An array of numbers representing an extent: `[minx, miny, maxx, maxy]`.
 * @typedef {Array.<number>}
 * @api stable
 */
ol.Extent;


/**
 * {@link ol.source.Vector} sources use a function of this type to load
 * features.
 *
 * This function takes an {@link ol.Extent} representing the area to be loaded,
 * a `{number}` representing the resolution (map units per pixel) and an
 * {@link ol.proj.Projection} for the projection  as arguments. `this` within
 * the function is bound to the {@link ol.source.Vector} it's called from.
 *
 * The function is responsible for loading the features and adding them to the
 * source.
 * @api
 * @typedef {function(this:ol.source.Vector, ol.Extent, number,
 *                    ol.proj.Projection)}
 */
ol.FeatureLoader;


/**
 * A function that returns an array of {@link ol.style.Style styles} given a
 * resolution. The `this` keyword inside the function references the
 * {@link ol.Feature} to be styled.
 *
 * @typedef {function(this: ol.Feature, number):
 *     (ol.style.Style|Array.<ol.style.Style>)}
 * @api stable
 */
ol.FeatureStyleFunction;


/**
 * {@link ol.source.Vector} sources use a function of this type to get the url
 * to load features from.
 *
 * This function takes an {@link ol.Extent} representing the area to be loaded,
 * a `{number}` representing the resolution (map units per pixel) and an
 * {@link ol.proj.Projection} for the projection  as arguments and returns a
 * `{string}` representing the URL.
 * @api
 * @typedef {function(ol.Extent, number, ol.proj.Projection) : string}
 */
ol.FeatureUrlFunction;


/**
 * A function that is called to trigger asynchronous canvas drawing.  It is
 * called with a "done" callback that should be called when drawing is done.
 * If any error occurs during drawing, the "done" callback should be called with
 * that error.
 *
 * @typedef {function(function(Error))}
 */
ol.ImageCanvasLoader;


/**
 * A function that takes an {@link ol.Image} for the image and a `{string}` for
 * the src as arguments. It is supposed to make it so the underlying image
 * {@link ol.Image#getImage} is assigned the content specified by the src. If
 * not specified, the default is
 *
 *     function(image, src) {
 *       image.getImage().src = src;
 *     }
 *
 * Providing a custom `imageLoadFunction` can be useful to load images with
 * post requests or - in general - through XHR requests, where the src of the
 * image element would be set to a data URI when the content is loaded.
 *
 * @typedef {function(ol.Image, string)}
 * @api
 */
ol.ImageLoadFunctionType;


/**
 * One of `all`, `bbox`, `tile`.
 *
 * @typedef {function(ol.Extent, number): Array.<ol.Extent>}
 * @api
 */
ol.LoadingStrategy;


/**
 * @typedef {{controls: ol.Collection.<ol.control.Control>,
 *            interactions: ol.Collection.<ol.interaction.Interaction>,
 *            keyboardEventTarget: (Element|Document),
 *            logos: (Object.<string, (string|Element)>),
 *            overlays: ol.Collection.<ol.Overlay>,
 *            rendererConstructor:
 *                function(new: ol.renderer.Map, Element, ol.Map),
 *            values: Object.<string, *>}}
 */
ol.MapOptionsInternal;


/**
 * An array with two elements, representing a pixel. The first element is the
 * x-coordinate, the second the y-coordinate of the pixel.
 * @typedef {Array.<number>}
 * @api stable
 */
ol.Pixel;


/**
 * @typedef {function(ol.Map, ?olx.FrameState): boolean}
 */
ol.PostRenderFunction;


/**
 * Function to perform manipulations before rendering. This function is called
 * with the {@link ol.Map} as first and an optional {@link olx.FrameState} as
 * second argument. Return `true` to keep this function for the next frame,
 * `false` to remove it.
 * @typedef {function(ol.Map, ?olx.FrameState): boolean}
 * @api
 */
ol.PreRenderFunction;


/**
 * @typedef {function((number|undefined), number, number): (number|undefined)}
 */
ol.ResolutionConstraintType;


/**
 * @typedef {function((number|undefined), number): (number|undefined)}
 */
ol.RotationConstraintType;


/**
 * An array of numbers representing a size: `[width, height]`.
 * @typedef {Array.<number>}
 * @api stable
 */
ol.Size;


/**
 * An array of three numbers representing the location of a tile in a tile
 * grid. The order is `z`, `x`, and `y`. `z` is the zoom level.
 * @typedef {Array.<number>} ol.TileCoord
 * @api
 */
ol.TileCoord;


/**
 * A function that takes an {@link ol.Tile} for the tile and a `{string}` for
 * the url as arguments.
 *
 * @typedef {function(ol.Tile, string)}
 * @api
 */
ol.TileLoadFunctionType;


/**
 * @typedef {function(ol.Tile, string, ol.Coordinate, number): number}
 */
ol.TilePriorityFunction;


/**
 * @typedef {{
 *     dirty: boolean,
 *     renderedRenderOrder: (null|function(ol.Feature, ol.Feature):number),
 *     renderedTileRevision: number,
 *     renderedRevision: number,
 *     replayGroup: ol.render.IReplayGroup,
 *     skippedFeatures: Array.<string>}}
 */
ol.TileReplayState;


/**
 * {@link ol.source.Tile} sources use a function of this type to get the url
 * that provides a tile for a given tile coordinate.
 *
 * This function takes an {@link ol.TileCoord} for the tile coordinate, a
 * `{number}` representing the pixel ratio and an {@link ol.proj.Projection} for
 * the projection  as arguments and returns a `{string}` representing the tile
 * URL, or undefined if no tile should be requested for the passed tile
 * coordinate.
 *
 * @typedef {function(ol.TileCoord, number,
 *           ol.proj.Projection): (string|undefined)}
 * @api
 */
ol.TileUrlFunctionType;


/**
 * A transform function accepts an array of input coordinate values, an optional
 * output array, and an optional dimension (default should be 2).  The function
 * transforms the input coordinate values, populates the output array, and
 * returns the output array.
 *
 * @typedef {function(Array.<number>, Array.<number>=, number=): Array.<number>}
 * @api stable
 */
ol.TransformFunction;
