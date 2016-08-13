/* eslint-disable openlayers-internal/no-missing-requires */

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
 * @typedef {string|Array.<string>|ol.Attribution|Array.<ol.Attribution>}
 */
ol.AttributionLike;


/**
 * @typedef {{fillStyle: ol.ColorLike}}
 */
ol.CanvasFillState;


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
 */
ol.CanvasFunctionType;


/**
 * @typedef {{lineCap: string,
 *            lineDash: Array.<number>,
 *            lineJoin: string,
 *            lineWidth: number,
 *            miterLimit: number,
 *            strokeStyle: string}}
 */
ol.CanvasStrokeState;


/**
 * @typedef {{font: string,
 *            textAlign: string,
 *            textBaseline: string}}
 */
ol.CanvasTextState;


/**
 * @typedef {function((ol.Coordinate|undefined)): (ol.Coordinate|undefined)}
 */
ol.CenterConstraintType;


/**
 * @typedef {{strokeStyle: (string|undefined), strokeWidth: number,
 *   size: number, lineDash: Array.<number>}}
 */
ol.CircleRenderOptions;


/**
 * A color represented as a short array [red, green, blue, alpha].
 * red, green, and blue should be integers in the range 0..255 inclusive.
 * alpha should be a float in the range 0..1 inclusive. If no alpha value is
 * given then `1` will be used.
 * @typedef {Array.<number>|Uint8Array|Uint8ClampedArray}
 */
ol.Color;


/**
 * A type accepted by CanvasRenderingContext2D.fillStyle.
 * Represents a color, pattern, or gradient.
 *
 * @typedef {string|CanvasPattern|CanvasGradient}
 */
ol.ColorLike;


/**
 * An array of numbers representing an xy coordinate. Example: `[16, 48]`.
 * @typedef {Array.<number>}
 */
ol.Coordinate;


/**
 * A function that takes a {@link ol.Coordinate} and transforms it into a
 * `{string}`.
 *
 * @typedef {function((ol.Coordinate|undefined)): string}
 */
ol.CoordinateFormatType;


/**
 * A function that takes a {@link ol.MapBrowserEvent} and two
 * {@link ol.Pixel}s and returns a `{boolean}`. If the condition is met,
 * true should be returned.
 * @typedef {function(ol.MapBrowserEvent, ol.Pixel, ol.Pixel):boolean}
 */
ol.DragBoxEndConditionType;


/**
 * Function that takes coordinates and an optional existing geometry as
 * arguments, and returns a geometry. The optional existing geometry is the
 * geometry that is returned when the function is called without a second
 * argument.
 * @typedef {function(!(ol.Coordinate|Array.<ol.Coordinate>|
 *     Array.<Array.<ol.Coordinate>>), ol.geom.SimpleGeometry=):
 *     ol.geom.SimpleGeometry}
 */
ol.DrawGeometryFunctionType;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a
 * `{boolean}`. If the condition is met, true should be returned.
 *
 * @typedef {function(ol.MapBrowserEvent): boolean}
 */
ol.EventsConditionType;


/**
 * Key to use with {@link ol.Observable#unByKey}.
 *
 * @typedef {{bindTo: (Object|undefined),
 *     boundListener: (ol.EventsListenerFunctionType|undefined),
 *     callOnce: boolean,
 *     deleteIndex: (number|undefined),
 *     listener: ol.EventsListenerFunctionType,
 *     target: (EventTarget|ol.events.EventTarget),
 *     type: string}}
 */
ol.EventsKey;


/**
 * Listener function. This function is called with an event object as argument.
 * When the function returns `false`, event propagation will stop.
 *
 * @typedef {function(ol.events.Event)|function(ol.events.Event): boolean}
 */
ol.EventsListenerFunctionType;


/**
 * @typedef {EventTarget|ol.events.EventTarget}
 */
ol.EventTargetLike;


/**
 * An array of numbers representing an extent: `[minx, miny, maxx, maxy]`.
 * @typedef {Array.<number>}
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
 */
ol.ImageLoadFunctionType;


/**
 * @typedef {{x: number, xunits: (ol.style.IconAnchorUnits|undefined),
 *            y: number, yunits: (ol.style.IconAnchorUnits|undefined)}}
 */
ol.KMLVec2_;


/**
 * @typedef {{flatCoordinates: Array.<number>,
 *            whens: Array.<number>}}
 */
ol.KMLGxTrackObject_;


/**
 * @typedef {{layer: ol.layer.Layer,
 *            opacity: number,
 *            sourceState: ol.source.State,
 *            visible: boolean,
 *            managed: boolean,
 *            extent: (ol.Extent|undefined),
 *            zIndex: number,
 *            maxResolution: number,
 *            minResolution: number}}
 */
ol.LayerState;


/**
 * A function that takes an {@link ol.Extent} and a resolution as arguments, and
 * returns an array of {@link ol.Extent} with the extents to load. Usually this
 * is one of the standard {@link ol.loadingstrategy} strategies.
 *
 * @typedef {function(ol.Extent, number): Array.<ol.Extent>}
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
 * An array representing an affine 2d transformation for use with
 * {@link ol.transform} functions. The array has 6 elements.
 * @typedef {Array.<number>}
 */
ol.Transform;


/**
 * @typedef {{depth: (Array.<number>|undefined),
 *            feature: ol.Feature,
 *            geometry: ol.geom.SimpleGeometry,
 *            index: (number),
 *            segment: Array.<ol.Extent>}}
 */
ol.ModifySegmentDataType;


/**
 * An array with two elements, representing a pixel. The first element is the
 * x-coordinate, the second the y-coordinate of the pixel.
 * @typedef {Array.<number>}
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
 */
ol.PreRenderFunction;


/**
 * A projection as {@link ol.proj.Projection}, SRS identifier string or
 * undefined.
 * @typedef {ol.proj.Projection|string|undefined} ol.ProjectionLike
 */
ol.ProjectionLike;


/**
 * A function that takes an array of input data, performs some operation, and
 * returns an array of ouput data.
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
 *   strokeStyle: (string|undefined),
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
 * @typedef {function(ol.Extent, number, number) : ol.ImageBase}
 */
ol.ReprojImageFunctionType;


/**
 * @typedef {function(number, number, number, number) : ol.Tile}
 */
ol.ReprojTileFunctionType;


/**
 * Single triangle; consists of 3 source points and 3 target points.
 *
 * @typedef {{source: Array.<ol.Coordinate>,
 *            target: Array.<ol.Coordinate>}}
 */
ol.ReprojTriangle;


/**
 * @typedef {function((number|undefined), number, number): (number|undefined)}
 */
ol.ResolutionConstraintType;


/**
 * @typedef {function((number|undefined), number): (number|undefined)}
 */
ol.RotationConstraintType;


/**
 * A function that takes an {@link ol.Feature} or {@link ol.render.Feature} and
 * an {@link ol.layer.Layer} and returns `true` if the feature may be selected
 * or `false` otherwise.
 * @typedef {function((ol.Feature|ol.render.Feature), ol.layer.Layer):
 *     boolean}
 */
ol.SelectFilterFunction;


/**
 * An array of numbers representing a size: `[width, height]`.
 * @typedef {Array.<number>}
 */
ol.Size;


/**
 * @typedef {{
 *     snapped: {boolean},
 *     vertex: (ol.Coordinate|null),
 *     vertexPixel: (ol.Pixel|null)
 * }}
 */
ol.SnapResultType;


/**
 * @typedef {{
 *     feature: ol.Feature,
 *     segment: Array.<ol.Coordinate>
 * }}
 */
ol.SnapSegmentDataType;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *            extent: (null|ol.Extent|undefined),
 *            logo: (string|olx.LogoOptions|undefined),
 *            projection: ol.ProjectionLike,
 *            resolutions: (Array.<number>|undefined),
 *            state: (ol.source.State|undefined)}}
 */
ol.SourceImageOptions;


/**
 * @typedef {{revision: number,
 *            resolution: number,
 *            extent: ol.Extent}}
 */
ol.SourceRasterRenderedState;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *            logo: (string|olx.LogoOptions|undefined),
 *            projection: ol.ProjectionLike,
 *            state: (ol.source.State|undefined),
 *            wrapX: (boolean|undefined)}}
 */
ol.SourceSourceOptions;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *            cacheSize: (number|undefined),
 *            extent: (ol.Extent|undefined),
 *            logo: (string|olx.LogoOptions|undefined),
 *            opaque: (boolean|undefined),
 *            tilePixelRatio: (number|undefined),
 *            projection: ol.ProjectionLike,
 *            state: (ol.source.State|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            wrapX: (boolean|undefined)}}
 */
ol.SourceTileOptions;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *            cacheSize: (number|undefined),
 *            extent: (ol.Extent|undefined),
 *            logo: (string|olx.LogoOptions|undefined),
 *            opaque: (boolean|undefined),
 *            projection: ol.ProjectionLike,
 *            state: (ol.source.State|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            tileLoadFunction: ol.TileLoadFunctionType,
 *            tilePixelRatio: (number|undefined),
 *            tileUrlFunction: (ol.TileUrlFunctionType|undefined),
 *            url: (string|undefined),
 *            urls: (Array.<string>|undefined),
 *            wrapX: (boolean|undefined)}}
 */
ol.SourceUrlTileOptions;


/**
 * A function that takes an {@link ol.Feature} and a `{number}` representing
 * the view's resolution. The function should return a {@link ol.style.Style}
 * or an array of them. This way e.g. a vector layer can be styled.
 *
 * @typedef {function((ol.Feature|ol.render.Feature), number):
 *     (ol.style.Style|Array.<ol.style.Style>)}
 */
ol.StyleFunction;


/**
 * A function that takes an {@link ol.Feature} as argument and returns an
 * {@link ol.geom.Geometry} that will be rendered and styled for the feature.
 *
 * @typedef {function((ol.Feature|ol.render.Feature)):
 *     (ol.geom.Geometry|ol.render.Feature|undefined)}
 */
ol.StyleGeometryFunction;


/**
 * @typedef {{opacity: number,
 *            rotateWithView: boolean,
 *            rotation: number,
 *            scale: number,
 *            snapToPixel: boolean}}
 */
ol.StyleImageOptions;


/**
 * An array of three numbers representing the location of a tile in a tile
 * grid. The order is `z`, `x`, and `y`. `z` is the zoom level.
 * @typedef {Array.<number>} ol.TileCoord
 */
ol.TileCoord;


/**
 * A function that takes an {@link ol.Tile} for the tile and a `{string}` for
 * the url as arguments.
 *
 * @typedef {function(ol.Tile, string)}
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
 *     replayGroup: ol.render.ReplayGroup,
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
 */
ol.TileUrlFunctionType;


/**
 * A transform function accepts an array of input coordinate values, an optional
 * output array, and an optional dimension (default should be 2).  The function
 * transforms the input coordinate values, populates the output array, and
 * returns the output array.
 *
 * @typedef {function(Array.<number>, Array.<number>=, number=): Array.<number>}
 */
ol.TransformFunction;


/**
 * @typedef {{buf: ol.webgl.Buffer,
 *            buffer: WebGLBuffer}}
 */
ol.WebglBufferCacheEntry;


/**
 * @typedef {{magFilter: number, minFilter: number, texture: WebGLTexture}}
 */
ol.WebglTextureCacheEntry;


/**
 * Number of features; bounds/extent.
 * @typedef {{numberOfFeatures: number,
 *            bounds: ol.Extent}}
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
 * When using {@link ol.xml.makeChildAppender} or
 * {@link ol.xml.makeSimpleNodeFactory}, the top `objectStack` item needs to
 * have this structure.
 * @typedef {{node:Node}}
 */
ol.XmlNodeStackItem;


/**
 * @typedef {function(Node, Array.<*>)}
 */
ol.XmlParser;


/**
 * @typedef {function(Node, *, Array.<*>)}
 */
ol.XmlSerializer;


/**
 * @typedef {{minX: number, minY: number, maxX: number, maxY: number,
 *            value: (Object|undefined)}}
 */
ol.RBushEntry;
