
/**
 * @type {Object}
 */
let olx;


/**
 * @typedef {{context: CanvasRenderingContext2D,
 *     feature: (module:ol/Feature~Feature|ol.render.Feature),
 *     geometry: module:ol/geom/SimpleGeometry~SimpleGeometry,
 *     pixelRatio: number,
 *     resolution: number,
 *     rotation: number}}
 */
olx.render.State;


/**
 * Canvas context that the layer is being rendered to.
 * @type {CanvasRenderingContext2D}
 * @api
 */
olx.render.State.prototype.context;


/**
 * Pixel ratio used by the layer renderer.
 * @type {number}
 * @api
 */
olx.render.State.prototype.pixelRatio;


/**
 * Resolution that the render batch was created and optimized for. This is
 * not the view's resolution that is being rendered.
 * @type {number}
 * @api
 */
olx.render.State.prototype.resolution;


/**
 * Rotation of the rendered layer in radians.
 * @type {number}
 * @api
 */
olx.render.State.prototype.rotation;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     distance: (number|undefined),
 *     extent: (ol.Extent|undefined),
 *     format: (ol.format.Feature|undefined),
 *     geometryFunction: (undefined|function(module:ol/Feature~Feature):module:ol/geom/Point~Point),
 *     projection: ol.ProjectionLike,
 *     source: ol.source.Vector,
 *     wrapX: (boolean|undefined)}}
 */
olx.source.ClusterOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.ClusterOptions.prototype.attributions;


/**
 * Minimum distance in pixels between clusters. Default is `20`.
 * @type {number|undefined}
 * @api
 */
olx.source.ClusterOptions.prototype.distance;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 * @api
 */
olx.source.ClusterOptions.prototype.extent;


/**
 * Function that takes an {@link module:ol/Feature~Feature} as argument and returns an
 * {@link module:ol/geom/Point~Point} as cluster calculation point for the feature. When a
 * feature should not be considered for clustering, the function should return
 * `null`. The default, which works when the underyling source contains point
 * features only, is
 * ```js
 * function(feature) {
 *   return feature.getGeometry();
 * }
 * ```
 * See {@link module:ol/geom/Polygon~Polygon#getInteriorPoint} for a way to get a cluster
 * calculation point for polygons.
 * @type {undefined|function(module:ol/Feature~Feature):module:ol/geom/Point~Point}
 * @api
 */
olx.source.ClusterOptions.prototype.geometryFunction;


/**
 * Format.
 * @type {ol.format.Feature|undefined}
 * @api
 */
olx.source.ClusterOptions.prototype.format;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.ClusterOptions.prototype.projection;


/**
 * Source.
 * @type {ol.source.Vector}
 * @api
 */
olx.source.ClusterOptions.prototype.source;


/**
 * WrapX. Default is true
 * @type {boolean|undefined}
 * @api
 */
olx.source.ClusterOptions.prototype.wrapX;


/**
 * @typedef {{preemptive: (boolean|undefined),
 *     jsonp: (boolean|undefined),
 *     tileJSON: (TileJSON|undefined),
 *     url: (string|undefined)}}
 */
olx.source.TileUTFGridOptions;


/**
 * Use JSONP with callback to load the TileJSON. Useful when the server
 * does not support CORS. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.TileUTFGridOptions.prototype.jsonp;


/**
 * If `true` the TileUTFGrid source loads the tiles based on their "visibility".
 * This improves the speed of response, but increases traffic.
 * Note that if set to `false`, you need to pass `true` as `opt_request`
 * to the `forDataAtCoordinateAndResolution` method otherwise no data
 * will ever be loaded.
 * Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.TileUTFGridOptions.prototype.preemptive;


/**
 * TileJSON configuration for this source. If not provided, `url` must be
 * configured.
 * @type {TileJSON|undefined}
 * @api
 */
olx.source.TileUTFGridOptions.prototype.tileJSON;


/**
 * TileJSON endpoint that provides the configuration for this source. Request
 * will be made through JSONP. If not provided, `tileJSON` must be configured.
 * @type {string|undefined}
 * @api
 */
olx.source.TileUTFGridOptions.prototype.url;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *            cacheSize: (number|undefined),
 *            crossOrigin: (null|string|undefined),
 *            opaque: (boolean|undefined),
 *            projection: ol.ProjectionLike,
 *            reprojectionErrorThreshold: (number|undefined),
 *            state: (ol.source.State|undefined),
 *            tileClass: (function(new: ol.ImageTile, ol.TileCoord,
 *                                 ol.TileState, string, ?string,
 *                                 ol.TileLoadFunctionType)|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *            tilePixelRatio: (number|undefined),
 *            tileUrlFunction: (ol.TileUrlFunctionType|undefined),
 *            url: (string|undefined),
 *            urls: (Array.<string>|undefined),
 *            wrapX: (boolean|undefined),
 *            transition: (number|undefined)}}
 */
olx.source.TileImageOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.attributions;


/**
 * Cache size. Default is `2048`.
 * @type {number|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.cacheSize;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.crossOrigin;


/**
 * Whether the layer is opaque.
 * @type {boolean|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.opaque;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.TileImageOptions.prototype.projection;


/**
 * Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @type {number|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.reprojectionErrorThreshold;


/**
 * Source state.
 * @type {ol.source.State|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.state;


/**
 * Class used to instantiate image tiles. Default is {@link ol.ImageTile}.
 * @type {function(new: ol.ImageTile, ol.TileCoord,
 *                 ol.TileState, string, ?string,
 *                 ol.TileLoadFunctionType)|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.tileClass;


/**
 * Tile grid.
 * @type {ol.tilegrid.TileGrid|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.tileGrid;


/**
 * Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @type {ol.TileLoadFunctionType|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.tileLoadFunction;


/**
 * The pixel ratio used by the tile service. For example, if the tile
 * service advertizes 256px by 256px tiles but actually sends 512px
 * by 512px images (for retina/hidpi devices) then `tilePixelRatio`
 * should be set to `2`. Default is `1`.
 * @type {number|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.tilePixelRatio;


/**
 * Optional function to get tile URL given a tile coordinate and the projection.
 * @type {ol.TileUrlFunctionType|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.tileUrlFunction;


/**
 * URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * @type {string|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.url;


/**
 * An array of URL templates.
 * @type {Array.<string>|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.urls;


/**
 * Whether to wrap the world horizontally. The default, `undefined`, is to
 * request out-of-bounds tiles from the server. When set to `false`, only one
 * world will be rendered. When set to `true`, tiles will be requested for one
 * world only, but they will be wrapped horizontally to render multiple worlds.
 * @type {boolean|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.wrapX;


/**
 * Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * @type {number|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.transition;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *            cacheSize: (number|undefined),
 *            format: (ol.format.Feature|undefined),
 *            overlaps: (boolean|undefined),
 *            projection: ol.ProjectionLike,
 *            state: (ol.source.State|undefined),
 *            tileClass: (function(new: ol.VectorTile, ol.TileCoord,
 *                 ol.TileState, string, ol.format.Feature,
 *                 ol.TileLoadFunctionType)|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *            tileUrlFunction: (ol.TileUrlFunctionType|undefined),
 *            url: (string|undefined),
 *            urls: (Array.<string>|undefined),
 *            wrapX: (boolean|undefined),
 *            transition: (number|undefined)}}
 */
olx.source.VectorTileOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.attributions;


/**
 * Cache size. Default is `128`.
 * @type {number|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.cacheSize;


/**
 * Feature format for tiles. Used and required by the default
 * `tileLoadFunction`.
 * @type {ol.format.Feature|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.format;


/**
 * This source may have overlapping geometries. Default is `true`. Setting this
 * to `false` (e.g. for sources with polygons that represent administrative
 * boundaries or TopoJSON sources) allows the renderer to optimise fill and
 * stroke operations.
 * @type {boolean|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.overlaps;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.VectorTileOptions.prototype.projection;


/**
 * Source state.
 * @type {ol.source.State|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.state;


/**
 * Class used to instantiate vector tiles. Default is {@link ol.VectorTile}.
 * @type {function(new: ol.VectorTile, ol.TileCoord,
 *                 ol.TileState, string, ol.format.Feature,
 *                 ol.TileLoadFunctionType)|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.tileClass;


/**
 * Tile grid.
 * @type {ol.tilegrid.TileGrid|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.tileGrid;


/**
 * Optional function to load a tile given a URL. Could look like this:
 * ```js
 * function(tile, url) {
 *   tile.setLoader(function() {
 *     var data = // ... fetch data
 *     var format = tile.getFormat();
 *     tile.setFeatures(format.readFeatures(data, {
 *       // uncomment the line below for ol.format.MVT only
 *       extent: tile.getExtent(),
 *       featureProjection: map.getView().getProjection()
 *     }));
 *   };
 * });
 * ```
 * @type {ol.TileLoadFunctionType|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.tileLoadFunction;


/**
 * Optional function to get tile URL given a tile coordinate and the projection.
 * @type {ol.TileUrlFunctionType|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.tileUrlFunction;


/**
 * URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * @type {string|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.url;


/**
 * An array of URL templates.
 * @type {Array.<string>|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.urls;


/**
 * Whether to wrap the world horizontally. When set to `false`, only one world
 * will be rendered. When set to `true`, tiles will be wrapped horizontally to
 * render multiple worlds. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.wrapX;


/**
 * Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * @type {number|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.transition;


/**
 * @typedef {{url: (string|undefined),
 *     displayDpi: (number|undefined),
 *     metersPerUnit: (number|undefined),
 *     hidpi: (boolean|undefined),
 *     useOverlay: (boolean|undefined),
 *     projection: ol.ProjectionLike,
 *     ratio: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     imageLoadFunction: (ol.ImageLoadFunctionType|undefined),
 *     params: (Object|undefined)}}
 */
olx.source.ImageMapGuideOptions;


/**
 * The mapagent url.
 * @type {string|undefined}
 * @api
 */
olx.source.ImageMapGuideOptions.prototype.url;


/**
 * The display resolution. Default is `96`.
 * @type {number|undefined}
 * @api
 */
olx.source.ImageMapGuideOptions.prototype.displayDpi;


/**
 * The meters-per-unit value. Default is `1`.
 * @type {number|undefined}
 * @api
 */
olx.source.ImageMapGuideOptions.prototype.metersPerUnit;


/**
 * Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.ImageMapGuideOptions.prototype.hidpi;


/**
 * If `true`, will use `GETDYNAMICMAPOVERLAYIMAGE`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.ImageMapGuideOptions.prototype.useOverlay;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.ImageMapGuideOptions.prototype.projection;


/**
 * Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the width and height of the map viewport, and so on. Must be `1` or
 * higher. Default is `1`.
 * @type {number|undefined}
 * @api
 */
olx.source.ImageMapGuideOptions.prototype.ratio;


/**
 * Resolutions. If specified, requests will be made for these resolutions only.
 * @type {Array.<number>|undefined}
 * @api
 */
olx.source.ImageMapGuideOptions.prototype.resolutions;


/**
 * Optional function to load an image given a URL.
 * @type {ol.ImageLoadFunctionType|undefined}
 * @api
 */
olx.source.ImageMapGuideOptions.prototype.imageLoadFunction;


/**
 * Additional parameters.
 * @type {Object|undefined}
 * @api
 */
olx.source.ImageMapGuideOptions.prototype.params;


/**
 * @typedef {{cacheSize: (number|undefined),
 *     layer: string,
 *     reprojectionErrorThreshold: (number|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: (string|undefined)}}
 */
olx.source.MapQuestOptions;


/**
 * Cache size. Default is `2048`.
 * @type {number|undefined}
 * @api
 */
olx.source.MapQuestOptions.prototype.cacheSize;


/**
 * Layer. Possible values are `osm`, `sat`, and `hyb`.
 * @type {string}
 * @api
 */
olx.source.MapQuestOptions.prototype.layer;


/**
 * Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @type {number|undefined}
 * @api
 */
olx.source.MapQuestOptions.prototype.reprojectionErrorThreshold;


/**
 * Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @type {ol.TileLoadFunctionType|undefined}
 * @api
 */
olx.source.MapQuestOptions.prototype.tileLoadFunction;


/**
 * URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * @type {string|undefined}
 * @api
 */
olx.source.MapQuestOptions.prototype.url;


/**
 * @typedef {{projection: ol.ProjectionLike,
 *     tileGrid: (ol.tilegrid.TileGrid|undefined),
 *     wrapX: (boolean|undefined)}}
 */
olx.source.TileDebugOptions;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.TileDebugOptions.prototype.projection;


/**
 * Tile grid.
 * @type {ol.tilegrid.TileGrid|undefined}
 * @api
 */
olx.source.TileDebugOptions.prototype.tileGrid;


/**
 * Whether to wrap the world horizontally. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.TileDebugOptions.prototype.wrapX;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     crossOrigin: (null|string|undefined),
 *     maxZoom: (number|undefined),
 *     opaque: (boolean|undefined),
 *     reprojectionErrorThreshold: (number|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: (string|undefined),
 *     wrapX: (boolean|undefined)}}
 */
olx.source.OSMOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.OSMOptions.prototype.attributions;


/**
 * Cache size. Default is `2048`.
 * @type {number|undefined}
 * @api
 */
olx.source.OSMOptions.prototype.cacheSize;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 *
 * Default is `anonymous`.
 * @type {null|string|undefined}
 * @api
 */
olx.source.OSMOptions.prototype.crossOrigin;


/**
 * Max zoom. Default is `19`.
 * @type {number|undefined}
 * @api
 */
olx.source.OSMOptions.prototype.maxZoom;


/**
 * Whether the layer is opaque. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.OSMOptions.prototype.opaque;


/**
 * Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @type {number|undefined}
 * @api
 */
olx.source.OSMOptions.prototype.reprojectionErrorThreshold;


/**
 * Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @type {ol.TileLoadFunctionType|undefined}
 * @api
 */
olx.source.OSMOptions.prototype.tileLoadFunction;


/**
 * URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * Default is `https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
 * @type {string|undefined}
 * @api
 */
olx.source.OSMOptions.prototype.url;


/**
 * Whether to wrap the world horizontally. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.OSMOptions.prototype.wrapX;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     canvasFunction: ol.CanvasFunctionType,
 *     projection: ol.ProjectionLike,
 *     ratio: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     state: (ol.source.State|undefined)}}
 */
olx.source.ImageCanvasOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.ImageCanvasOptions.prototype.attributions;


/**
 * Canvas function. The function returning the canvas element used by the source
 * as an image. The arguments passed to the function are: `{ol.Extent}` the
 * image extent, `{number}` the image resolution, `{number}` the device pixel
 * ratio, `{ol.Size}` the image size, and `{module:ol/proj/Projection~Projection}` the image
 * projection. The canvas returned by this function is cached by the source. If
 * the value returned by the function is later changed then
 * `changed` should be called on the source for the source to
 * invalidate the current cached image. See @link: {@link module:ol/Observable~Observable#changed}
 * @type {ol.CanvasFunctionType}
 * @api
 */
olx.source.ImageCanvasOptions.prototype.canvasFunction;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.ImageCanvasOptions.prototype.projection;


/**
 * Ratio. 1 means canvases are the size of the map viewport, 2 means twice the
 * width and height of the map viewport, and so on. Must be `1` or higher.
 * Default is `1.5`.
 * @type {number|undefined}
 * @api
 */
olx.source.ImageCanvasOptions.prototype.ratio;


/**
 * Resolutions. If specified, new canvases will be created for these resolutions
 * only.
 * @type {Array.<number>|undefined}
 * @api
 */
olx.source.ImageCanvasOptions.prototype.resolutions;


/**
 * Source state.
 * @type {ol.source.State|undefined}
 * @api
 */
olx.source.ImageCanvasOptions.prototype.state;


/**
 * @typedef {{sources: Array.<ol.source.Source>,
 *     operation: (ol.RasterOperation|undefined),
 *     lib: (Object|undefined),
 *     threads: (number|undefined),
 *     operationType: (ol.source.RasterOperationType|undefined)}}
 * @api
 */
olx.source.RasterOptions;


/**
 * Input sources.
 * @type {Array.<ol.source.Source>}
 * @api
 */
olx.source.RasterOptions.prototype.sources;


/**
 * Raster operation.  The operation will be called with data from input sources
 * and the output will be assigned to the raster source.
 * @type {ol.RasterOperation|undefined}
 * @api
 */
olx.source.RasterOptions.prototype.operation;


/**
 * Functions that will be made available to operations run in a worker.
 * @type {Object|undefined}
 * @api
 */
olx.source.RasterOptions.prototype.lib;


/**
 * By default, operations will be run in a single worker thread.  To avoid using
 * workers altogether, set `threads: 0`.  For pixel operations, operations can
 * be run in multiple worker threads.  Note that there is additional overhead in
 * transferring data to multiple workers, and that depending on the user's
 * system, it may not be possible to parallelize the work.
 * @type {number|undefined}
 * @api
 */
olx.source.RasterOptions.prototype.threads;


/**
 * Operation type.  Supported values are `'pixel'` and `'image'`.  By default,
 * `'pixel'` operations are assumed, and operations will be called with an
 * array of pixels from input sources.  If set to `'image'`, operations will
 * be called with an array of ImageData objects from input sources.
 * @type {ol.source.RasterOperationType|undefined}
 * @api
 */
olx.source.RasterOptions.prototype.operationType;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     crossOrigin: (null|string|undefined),
 *     hidpi: (boolean|undefined),
 *     serverType: (ol.source.WMSServerType|string|undefined),
 *     imageLoadFunction: (ol.ImageLoadFunctionType|undefined),
 *     params: Object.<string,*>,
 *     projection: ol.ProjectionLike,
 *     ratio: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     url: (string|undefined)}}
 */
olx.source.ImageWMSOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.ImageWMSOptions.prototype.attributions;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api
 */
olx.source.ImageWMSOptions.prototype.crossOrigin;


/**
 * Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.ImageWMSOptions.prototype.hidpi;


/**
 * The type of the remote WMS server: `mapserver`, `geoserver` or `qgis`. Only
 * needed if `hidpi` is `true`. Default is `undefined`.
 * @type {ol.source.WMSServerType|string|undefined}
 * @api
 */
olx.source.ImageWMSOptions.prototype.serverType;


/**
 * Optional function to load an image given a URL.
 * @type {ol.ImageLoadFunctionType|undefined}
 * @api
 */
olx.source.ImageWMSOptions.prototype.imageLoadFunction;


/**
 * WMS request parameters. At least a `LAYERS` param is required. `STYLES` is
 * `''` by default. `VERSION` is `1.3.0` by default. `WIDTH`, `HEIGHT`, `BBOX`
 * and `CRS` (`SRS` for WMS version < 1.3.0) will be set dynamically.
 * @type {Object.<string,*>}
 * @api
 */
olx.source.ImageWMSOptions.prototype.params;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.ImageWMSOptions.prototype.projection;


/**
 * Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the width and height of the map viewport, and so on. Must be `1` or
 * higher. Default is `1.5`.
 * @type {number|undefined}
 * @api
 */
olx.source.ImageWMSOptions.prototype.ratio;


/**
 * Resolutions. If specified, requests will be made for these resolutions only.
 * @type {Array.<number>|undefined}
 * @api
 */
olx.source.ImageWMSOptions.prototype.resolutions;


/**
 * WMS service URL.
 * @type {string|undefined}
 * @api
 */
olx.source.ImageWMSOptions.prototype.url;


/**
 * @typedef {{
 *     cacheSize: (number|undefined),
 *     layer: string,
 *     minZoom: (number|undefined),
 *     maxZoom: (number|undefined),
 *     opaque: (boolean|undefined),
 *     reprojectionErrorThreshold: (number|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: (string|undefined),
 *     wrapX: (boolean|undefined)
 * }}
 */
olx.source.StamenOptions;


/**
 * Cache size. Default is `2048`.
 * @type {number|undefined}
 * @api
 */
olx.source.StamenOptions.prototype.cacheSize;

/**
 * Layer.
 * @type {string}
 * @api
 */
olx.source.StamenOptions.prototype.layer;


/**
 * Minimum zoom.
 * @type {number|undefined}
 * @api
 */
olx.source.StamenOptions.prototype.minZoom;


/**
 * Maximum zoom.
 * @type {number|undefined}
 * @api
 */
olx.source.StamenOptions.prototype.maxZoom;


/**
 * Whether the layer is opaque.
 * @type {boolean|undefined}
 * @api
 */
olx.source.StamenOptions.prototype.opaque;


/**
 * Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @type {number|undefined}
 * @api
 */
olx.source.StamenOptions.prototype.reprojectionErrorThreshold;


/**
 * Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @type {ol.TileLoadFunctionType|undefined}
 * @api
 */
olx.source.StamenOptions.prototype.tileLoadFunction;


/**
 * URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * @type {string|undefined}
 * @api
 */
olx.source.StamenOptions.prototype.url;


/**
 * Whether to wrap the world horizontally. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.StamenOptions.prototype.wrapX;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     crossOrigin: (null|string|undefined),
 *     imageExtent: (ol.Extent),
 *     imageLoadFunction: (ol.ImageLoadFunctionType|undefined),
 *     imageSize: (ol.Size|undefined),
 *     projection: ol.ProjectionLike,
 *     url: string}}
 */
olx.source.ImageStaticOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.ImageStaticOptions.prototype.attributions;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api
 */
olx.source.ImageStaticOptions.prototype.crossOrigin;


/**
 * Extent of the image in map coordinates.  This is the [left, bottom, right,
 * top] map coordinates of your image.
 * @type {ol.Extent}
 * @api
 */
olx.source.ImageStaticOptions.prototype.imageExtent;


/**
 * Optional function to load an image given a URL.
 * @type {ol.ImageLoadFunctionType|undefined}
 * @api
 */
olx.source.ImageStaticOptions.prototype.imageLoadFunction;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.ImageStaticOptions.prototype.projection;


/**
 * Size of the image in pixels. Usually the image size is auto-detected, so this
 * only needs to be set if auto-detection fails for some reason.
 * @type {ol.Size|undefined}
 * @api
 */
olx.source.ImageStaticOptions.prototype.imageSize;


/**
 * Image URL.
 * @type {string}
 * @api
 */
olx.source.ImageStaticOptions.prototype.url;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     crossOrigin: (null|string|undefined),
 *     params: (Object.<string, *>|undefined),
 *     tileGrid: (ol.tilegrid.TileGrid|undefined),
 *     projection: ol.ProjectionLike,
 *     reprojectionErrorThreshold: (number|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined),
 *     wrapX: (boolean|undefined),
 *     transition: (number|undefined)}}
 */
olx.source.TileArcGISRestOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.TileArcGISRestOptions.prototype.attributions;


/**
 * Cache size. Default is `2048`.
 * @type {number|undefined}
 * @api
 */
olx.source.TileArcGISRestOptions.prototype.cacheSize;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api
 */
olx.source.TileArcGISRestOptions.prototype.crossOrigin;


/**
 * ArcGIS Rest parameters. This field is optional. Service defaults will be
 * used for any fields not specified. `FORMAT` is `PNG32` by default. `F` is `IMAGE` by
 * default. `TRANSPARENT` is `true` by default.  `BBOX, `SIZE`, `BBOXSR`,
 * and `IMAGESR` will be set dynamically. Set `LAYERS` to
 * override the default service layer visibility. See
 * {@link http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Export_Map/02r3000000v7000000/}
 * for further reference.
 * @type {Object.<string,*>|undefined}
 * @api
 */
olx.source.TileArcGISRestOptions.prototype.params;


/**
 * Tile grid. Base this on the resolutions, tilesize and extent supported by the
 * server.
 * If this is not defined, a default grid will be used: if there is a projection
 * extent, the grid will be based on that; if not, a grid based on a global
 * extent with origin at 0,0 will be used.
 * @type {ol.tilegrid.TileGrid|undefined}
 * @api
 */
olx.source.TileArcGISRestOptions.prototype.tileGrid;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.TileArcGISRestOptions.prototype.projection;


/**
 * Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @type {number|undefined}
 * @api
 */
olx.source.TileArcGISRestOptions.prototype.reprojectionErrorThreshold;


/**
 * Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @type {ol.TileLoadFunctionType|undefined}
 * @api
 */
olx.source.TileArcGISRestOptions.prototype.tileLoadFunction;


/**
 * ArcGIS Rest service URL for a Map Service or Image Service. The
 * url should include /MapServer or /ImageServer.
 * @type {string|undefined}
 * @api
 */
olx.source.TileArcGISRestOptions.prototype.url;


/**
 * Whether to wrap the world horizontally. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.TileArcGISRestOptions.prototype.wrapX;


/**
 * Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * @type {number|undefined}
 * @api
 */
olx.source.TileArcGISRestOptions.prototype.transition;


/**
 * ArcGIS Rest service urls. Use this instead of `url` when the ArcGIS Service supports multiple
 * urls for export requests.
 * @type {Array.<string>|undefined}
 * @api
 */
olx.source.TileArcGISRestOptions.prototype.urls;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     crossOrigin: (null|string|undefined),
 *     jsonp: (boolean|undefined),
 *     reprojectionErrorThreshold: (number|undefined),
 *     tileJSON: (TileJSON|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: (string|undefined),
 *     wrapX: (boolean|undefined),
 *     transition: (number|undefined)}}
 */
olx.source.TileJSONOptions;


/**
 * Optional attributions for the source.  If provided, these will be used
 * instead of any attribution data advertised by the server.  If not provided,
 * any attributions advertised by the server will be used.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.TileJSONOptions.prototype.attributions;


/**
 * Cache size. Default is `2048`.
 * @type {number|undefined}
 * @api
 */
olx.source.TileJSONOptions.prototype.cacheSize;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api
 */
olx.source.TileJSONOptions.prototype.crossOrigin;


/**
 * Use JSONP with callback to load the TileJSON. Useful when the server
 * does not support CORS. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.TileJSONOptions.prototype.jsonp;


/**
 * Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @type {number|undefined}
 * @api
 */
olx.source.TileJSONOptions.prototype.reprojectionErrorThreshold;


/**
 * TileJSON configuration for this source. If not provided, `url` must be
 * configured.
 * @type {TileJSON|undefined}
 * @api
 */
olx.source.TileJSONOptions.prototype.tileJSON;


/**
 * Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @type {ol.TileLoadFunctionType|undefined}
 * @api
 */
olx.source.TileJSONOptions.prototype.tileLoadFunction;


/**
 * URL to the TileJSON file. If not provided, `tileJSON` must be configured.
 * @type {string|undefined}
 * @api
 */
olx.source.TileJSONOptions.prototype.url;


/**
 * Whether to wrap the world horizontally. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.TileJSONOptions.prototype.wrapX;


/**
 * Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * @type {number|undefined}
 * @api
 */
olx.source.TileJSONOptions.prototype.transition;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     params: Object.<string,*>,
 *     crossOrigin: (null|string|undefined),
 *     gutter: (number|undefined),
 *     hidpi: (boolean|undefined),
 *     tileClass: (function(new: ol.ImageTile, ol.TileCoord,
 *                          ol.TileState, string, ?string,
 *                          ol.TileLoadFunctionType)|undefined),
 *     tileGrid: (ol.tilegrid.TileGrid|undefined),
 *     projection: ol.ProjectionLike,
 *     reprojectionErrorThreshold: (number|undefined),
 *     serverType: (ol.source.WMSServerType|string|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined),
 *     wrapX: (boolean|undefined),
 *     transition: (number|undefined)}}
 */
olx.source.TileWMSOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.attributions;


/**
 * Cache size. Default is `2048`.
 * @type {number|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.cacheSize;


/**
 * WMS request parameters. At least a `LAYERS` param is required. `STYLES` is
 * `''` by default. `VERSION` is `1.3.0` by default. `WIDTH`, `HEIGHT`, `BBOX`
 * and `CRS` (`SRS` for WMS version < 1.3.0) will be set dynamically.
 * @type {Object.<string,*>}
 * @api
 */
olx.source.TileWMSOptions.prototype.params;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.crossOrigin;


/**
 * The size in pixels of the gutter around image tiles to ignore. By setting
 * this property to a non-zero value, images will be requested that are wider
 * and taller than the tile size by a value of `2 x gutter`. Defaults to zero.
 * Using a non-zero value allows artifacts of rendering at tile edges to be
 * ignored. If you control the WMS service it is recommended to address
 * "artifacts at tile edges" issues by properly configuring the WMS service. For
 * example, MapServer has a `tile_map_edge_buffer` configuration parameter for
 * this. See http://mapserver.org/output/tile_mode.html.
 * @type {number|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.gutter;


/**
 * Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.hidpi;


/**
 * Class used to instantiate image tiles. Default is {@link ol.ImageTile}.
 * @type {function(new: ol.ImageTile, ol.TileCoord,
 *                 ol.TileState, string, ?string,
 *                 ol.TileLoadFunctionType)|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.tileClass;


/**
 * Tile grid. Base this on the resolutions, tilesize and extent supported by the
 * server.
 * If this is not defined, a default grid will be used: if there is a projection
 * extent, the grid will be based on that; if not, a grid based on a global
 * extent with origin at 0,0 will be used.
 * @type {ol.tilegrid.TileGrid|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.tileGrid;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.TileWMSOptions.prototype.projection;


/**
 * Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @type {number|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.reprojectionErrorThreshold;


/**
 * The type of the remote WMS server. Currently only used when `hidpi` is
 * `true`. Default is `undefined`.
 * @type {ol.source.WMSServerType|string|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.serverType;


/**
 * Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @type {ol.TileLoadFunctionType|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.tileLoadFunction;


/**
 * WMS service URL.
 * @type {string|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.url;


/**
 * WMS service urls. Use this instead of `url` when the WMS supports multiple
 * urls for GetMap requests.
 * @type {Array.<string>|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.urls;


/**
 * Whether to wrap the world horizontally. When set to `false`, only one world
 * will be rendered. When `true`, tiles will be requested for one world only,
 * but they will be wrapped horizontally to render multiple worlds. The default
 * is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.wrapX;


/**
 * Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * @type {number|undefined}
 * @api
 */
olx.source.TileWMSOptions.prototype.transition;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     features: (Array.<module:ol/Feature~Feature>|ol.Collection.<module:ol/Feature~Feature>|undefined),
 *     format: (ol.format.Feature|undefined),
 *     loader: (module:ol/Feature~FeatureLoader|undefined),
 *     overlaps: (boolean|undefined),
 *     strategy: (ol.LoadingStrategy|undefined),
 *     url: (string|module:ol/Feature~FeatureUrlFunction|undefined),
 *     useSpatialIndex: (boolean|undefined),
 *     wrapX: (boolean|undefined)}}
 */
olx.source.VectorOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.VectorOptions.prototype.attributions;


/**
 * Features. If provided as {@link ol.Collection}, the features in the source
 * and the collection will stay in sync.
 * @type {Array.<module:ol/Feature~Feature>|ol.Collection.<module:ol/Feature~Feature>|undefined}
 * @api
 */
olx.source.VectorOptions.prototype.features;


/**
 * The feature format used by the XHR feature loader when `url` is set.
 * Required if `url` is set, otherwise ignored. Default is `undefined`.
 * @type {ol.format.Feature|undefined}
 * @api
 */
olx.source.VectorOptions.prototype.format;


/**
 * The loader function used to load features, from a remote source for example.
 * If this is not set and `url` is set, the source will create and use an XHR
 * feature loader.
 *
 * Example:
 *
 * ```js
 * var vectorSource = new ol.source.Vector({
 *   format: new ol.format.GeoJSON(),
 *   loader: function(extent, resolution, projection) {
 *      var proj = projection.getCode();
 *      var url = 'https://ahocevar.com/geoserver/wfs?service=WFS&' +
 *          'version=1.1.0&request=GetFeature&typename=osm:water_areas&' +
 *          'outputFormat=application/json&srsname=' + proj + '&' +
 *          'bbox=' + extent.join(',') + ',' + proj;
 *      var xhr = new XMLHttpRequest();
 *      xhr.open('GET', url);
 *      var onError = function() {
 *        vectorSource.removeLoadedExtent(extent);
 *      }
 *      xhr.onerror = onError;
 *      xhr.onload = function() {
 *        if (xhr.status == 200) {
 *          vectorSource.addFeatures(
 *              vectorSource.getFormat().readFeatures(xhr.responseText));
 *        } else {
 *          onError();
 *        }
 *      }
 *      xhr.send();
 *    },
 *    strategy: ol.loadingstrategy.bbox
 *  });
 * ```
 * @type {module:ol/Feature~FeatureLoader|undefined}
 * @api
 */
olx.source.VectorOptions.prototype.loader;


/**
 * This source may have overlapping geometries. Default is `true`. Setting this
 * to `false` (e.g. for sources with polygons that represent administrative
 * boundaries or TopoJSON sources) allows the renderer to optimise fill and
 * stroke operations.
 * @type {boolean|undefined}
 * @api
 */
olx.source.VectorOptions.prototype.overlaps;


/**
 * The loading strategy to use. By default an {@link ol.loadingstrategy.all}
 * strategy is used, a one-off strategy which loads all features at once.
 * @type {ol.LoadingStrategy|undefined}
 * @api
 */
olx.source.VectorOptions.prototype.strategy;


/**
 * Setting this option instructs the source to load features using an XHR loader
 * (see {@link ol.featureloader.xhr}). Use a `string` and an
 * {@link ol.loadingstrategy.all} for a one-off download of all features from
 * the given URL. Use a {@link module:ol/Feature~FeatureUrlFunction} to generate the url with
 * other loading strategies.
 * Requires `format` to be set as well.
 * When default XHR feature loader is provided, the features will
 * be transformed from the data projection to the view projection
 * during parsing. If your remote data source does not advertise its projection
 * properly, this transformation will be incorrect. For some formats, the
 * default projection (usually EPSG:4326) can be overridden by setting the
 * defaultDataProjection constructor option on the format.
 * Note that if a source contains non-feature data, such as a GeoJSON geometry
 * or a KML NetworkLink, these will be ignored. Use a custom loader to load these.
 * @type {string|module:ol/Feature~FeatureUrlFunction|undefined}
 * @api
 */
olx.source.VectorOptions.prototype.url;


/**
 * By default, an RTree is used as spatial index. When features are removed and
 * added frequently, and the total number of features is low, setting this to
 * `false` may improve performance.
 *
 * Note that
 * {@link ol.source.Vector#getFeaturesInExtent},
 * {@link ol.source.Vector#getClosestFeatureToCoordinate} and
 * {@link ol.source.Vector#getExtent} cannot be used when `useSpatialIndex` is
 * set to `false`, and {@link ol.source.Vector#forEachFeatureInExtent} will loop
 * through all features.
 *
 * When set to `false`, the features will be maintained in an
 * {@link ol.Collection}, which can be retrieved through
 * {@link ol.source.Vector#getFeaturesCollection}.
 *
 * The default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.VectorOptions.prototype.useSpatialIndex;


/**
 * Wrap the world horizontally. Default is `true`. For vector editing across the
 * -180° and 180° meridians to work properly, this should be set to `false`. The
 * resulting geometry coordinates will then exceed the world bounds.
 * @type {boolean|undefined}
 * @api
 */
olx.source.VectorOptions.prototype.wrapX;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     crossOrigin: (string|null|undefined),
 *     tileGrid: ol.tilegrid.WMTS,
 *     projection: ol.ProjectionLike,
 *     reprojectionErrorThreshold: (number|undefined),
 *     requestEncoding: (ol.source.WMTSRequestEncoding|string|undefined),
 *     layer: string,
 *     style: string,
 *     tilePixelRatio: (number|undefined),
 *     version: (string|undefined),
 *     format: (string|undefined),
 *     matrixSet: string,
 *     dimensions: (!Object|undefined),
 *     url: (string|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     urls: (Array.<string>|undefined),
 *     tileClass: (function(new: ol.ImageTile, ol.TileCoord,
 *                          ol.TileState, string, ?string,
 *                          ol.TileLoadFunctionType)|undefined),
 *     wrapX: (boolean|undefined),
 *     transition: (number|undefined)}}
 */
olx.source.WMTSOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.attributions;


/**
 * Cache size. Default is `2048`.
 * @type {number|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.cacheSize;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {string|null|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.crossOrigin;


/**
 * Tile grid.
 * @type {ol.tilegrid.WMTS}
 * @api
 */
olx.source.WMTSOptions.prototype.tileGrid;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.WMTSOptions.prototype.projection;


/**
 * Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @type {number|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.reprojectionErrorThreshold;


/**
 * Request encoding. Default is `KVP`.
 * @type {ol.source.WMTSRequestEncoding|string|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.requestEncoding;


/**
 * Layer name as advertised in the WMTS capabilities.
 * @type {string}
 * @api
 */
olx.source.WMTSOptions.prototype.layer;


/**
 * Style name as advertised in the WMTS capabilities.
 * @type {string}
 * @api
 */
olx.source.WMTSOptions.prototype.style;


/**
 * Class used to instantiate image tiles. Default is {@link ol.ImageTile}.
 * @type {function(new: ol.ImageTile, ol.TileCoord,
 *                 ol.TileState, string, ?string,
 *                 ol.TileLoadFunctionType)|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.tileClass;


/**
 * The pixel ratio used by the tile service. For example, if the tile
 * service advertizes 256px by 256px tiles but actually sends 512px
 * by 512px images (for retina/hidpi devices) then `tilePixelRatio`
 * should be set to `2`. Default is `1`.
 * @type {number|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.tilePixelRatio;


/**
 * WMTS version. Default is `1.0.0`.
 * @type {string|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.version;


/**
 * Image format. Default is `image/jpeg`.
 * @type {string|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.format;


/**
 * Matrix set.
 * @type {string}
 * @api
 */
olx.source.WMTSOptions.prototype.matrixSet;


/**
 * Additional "dimensions" for tile requests.  This is an object with properties
 * named like the advertised WMTS dimensions.
 * @type {!Object|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.dimensions;


/**
 * A URL for the service.  For the RESTful request encoding, this is a URL
 * template.  For KVP encoding, it is normal URL. A `{?-?}` template pattern,
 * for example `subdomain{a-f}.domain.com`, may be used instead of defining
 * each one separately in the `urls` option.
 * @type {string|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.url;


/**
 * Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @type {ol.TileLoadFunctionType|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.tileLoadFunction;


/**
 * An array of URLs.  Requests will be distributed among the URLs in this array.
 * @type {Array.<string>|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.urls;


/**
 * Whether to wrap the world horizontally. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.wrapX;


/**
 * Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * @type {number|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.transition;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     crossOrigin: (null|string|undefined),
 *     opaque: (boolean|undefined),
 *     projection: ol.ProjectionLike,
 *     reprojectionErrorThreshold: (number|undefined),
 *     maxZoom: (number|undefined),
 *     minZoom: (number|undefined),
 *     tileGrid: (ol.tilegrid.TileGrid|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     tilePixelRatio: (number|undefined),
 *     tileSize: (number|ol.Size|undefined),
 *     tileUrlFunction: (ol.TileUrlFunctionType|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined),
 *     wrapX: (boolean|undefined),
 *     transition: (number|undefined)}}
 */
olx.source.XYZOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.attributions;


/**
 * Cache size. Default is `2048`.
 * @type {number|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.cacheSize;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.crossOrigin;


/**
 * Whether the layer is opaque.
 * @type {boolean|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.opaque;


/**
 * Projection. Default is `EPSG:3857`.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.XYZOptions.prototype.projection;


/**
 * Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @type {number|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.reprojectionErrorThreshold;


/**
 * Optional max zoom level. Default is `18`.
 * @type {number|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.maxZoom;


/**
 * Optional min zoom level. Default is `0`.
 * @type {number|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.minZoom;


/**
 * Tile grid.
 * @type {ol.tilegrid.TileGrid|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.tileGrid;


/**
 * Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @type {ol.TileLoadFunctionType|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.tileLoadFunction;


/**
 * The pixel ratio used by the tile service. For example, if the tile
 * service advertizes 256px by 256px tiles but actually sends 512px
 * by 512px images (for retina/hidpi devices) then `tilePixelRatio`
 * should be set to `2`. Default is `1`.
 * @type {number|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.tilePixelRatio;


/**
 * The tile size used by the tile service. Default is `[256, 256]` pixels.
 * @type {number|ol.Size|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.tileSize;


/**
 * Optional function to get tile URL given a tile coordinate and the projection.
 * Required if url or urls are not provided.
 * @type {ol.TileUrlFunctionType|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.tileUrlFunction;


/**
 * URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * @type {string|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.url;


/**
 * An array of URL templates.
 * @type {Array.<string>|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.urls;


/**
 * Whether to wrap the world horizontally. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.wrapX;


/**
 * Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * @type {number|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.transition;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     crossOrigin: (null|string|undefined),
 *     projection: ol.ProjectionLike,
 *     maxZoom: (number|undefined),
 *     minZoom: (number|undefined),
 *     wrapX: (boolean|undefined),
 *     config: (Object|undefined),
 *     map: (string|undefined),
 *     account: string}}
 */
olx.source.CartoDBOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.CartoDBOptions.prototype.attributions;


/**
 * Cache size. Default is `2048`.
 * @type {number|undefined}
 * @api
 */
olx.source.CartoDBOptions.prototype.cacheSize;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api
 */
olx.source.CartoDBOptions.prototype.crossOrigin;


/**
 * Projection. Default is `EPSG:3857`.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.CartoDBOptions.prototype.projection;


/**
 * Optional max zoom level. Default is `18`.
 * @type {number|undefined}
 * @api
 */
olx.source.CartoDBOptions.prototype.maxZoom;


/**
 * Minimum zoom.
 * @type {number|undefined}
 * @api
 */
olx.source.CartoDBOptions.prototype.minZoom;


/**
 * Whether to wrap the world horizontally. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.CartoDBOptions.prototype.wrapX;


/**
 * If using anonymous maps, the CartoDB config to use. See
 * {@link http://docs.cartodb.com/cartodb-platform/maps-api/anonymous-maps/}
 * for more detail.
 * If using named maps, a key-value lookup with the template parameters.
 * See {@link http://docs.cartodb.com/cartodb-platform/maps-api/named-maps/}
 * for more detail.
 * @type {Object|undefined}
 * @api
 */
olx.source.CartoDBOptions.prototype.config;


/**
 * If using named maps, this will be the name of the template to load.
 * See {@link http://docs.cartodb.com/cartodb-platform/maps-api/named-maps/}
 * for more detail.
 * @type {string|undefined}
 * @api
 */
olx.source.CartoDBOptions.prototype.map;


/**
 * CartoDB account name
 * @type {string}
 * @api
 */
olx.source.CartoDBOptions.prototype.account;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     crossOrigin: (null|string|undefined),
 *     projection: (ol.ProjectionLike|undefined),
 *     reprojectionErrorThreshold: (number|undefined),
 *     url: !string,
 *     tierSizeCalculation: (string|undefined),
 *     size: ol.Size,
 *     extent: (ol.Extent|undefined),
 *     transition: (number|undefined),
 *     tileSize: (number|undefined)}}
 */
olx.source.ZoomifyOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.ZoomifyOptions.prototype.attributions;


/**
 * Cache size. Default is `2048`.
 * @type {number|undefined}
 * @api
 */
olx.source.ZoomifyOptions.prototype.cacheSize;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api
 */
olx.source.ZoomifyOptions.prototype.crossOrigin;


/**
 * Projection.
 * @type {ol.ProjectionLike|undefined}
 * @api
 */
olx.source.ZoomifyOptions.prototype.projection;


/**
 * Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @type {number|undefined}
 * @api
 */
olx.source.ZoomifyOptions.prototype.reprojectionErrorThreshold;


/**
 * URL template or base URL of the Zoomify service. A base URL is the fixed part
 * of the URL, excluding the tile group, z, x, and y folder structure, e.g.
 * `http://my.zoomify.info/IMAGE.TIF/`. A URL template must include
 * `{TileGroup}`, `{x}`, `{y}`, and `{z}` placeholders, e.g.
 * `http://my.zoomify.info/IMAGE.TIF/{TileGroup}/{z}-{x}-{y}.jpg`.
 * Internet Imaging Protocol (IIP) with JTL extension can be also used with
 * `{tileIndex}` and `{z}` placeholders, e.g.
 * `http://my.zoomify.info?FIF=IMAGE.TIF&JTL={z},{tileIndex}`.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * @type {!string}
 * @api
 */
olx.source.ZoomifyOptions.prototype.url;


/**
 * Tier size calculation method: `default` or `truncated`.
 * @type {string|undefined}
 * @api
 */
olx.source.ZoomifyOptions.prototype.tierSizeCalculation;


/**
 * Size of the image.
 * @type {ol.Size}
 * @api
 */
olx.source.ZoomifyOptions.prototype.size;


/**
 * Extent for the TileGrid that is created. Default sets the TileGrid in the
 * fourth quadrant, meaning extent is `[0, -height, width, 0]`. To change the
 * extent to the first quadrant (the default for OpenLayers 2) set the extent
 * as `[0, 0, width, height]`.
 * @type {ol.Extent|undefined}
 * @api
 */
olx.source.ZoomifyOptions.prototype.extent;


/**
 * Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * @type {number|undefined}
 * @api
 */
olx.source.ZoomifyOptions.prototype.transition;


/**
 * Tile size. Same tile size is used for all zoom levels. Default value is
 * `256`.
 * @type {number|undefined}
 * @api
 */
olx.source.ZoomifyOptions.prototype.tileSize;


/**
 * @typedef {{fill: (module:ol/style/Fill~Fill|undefined),
 *     radius: number,
 *     snapToPixel: (boolean|undefined),
 *     stroke: (module:ol/style/Stroke~Stroke|undefined),
 *     atlasManager: (module:ol/style/AtlasManager~AtlasManager|undefined)}}
 */
olx.style.CircleOptions;


/**
 * Fill style.
 * @type {module:ol/style/Fill~Fill|undefined}
 * @api
 */
olx.style.CircleOptions.prototype.fill;


/**
 * Circle radius.
 * @type {number}
 * @api
 */
olx.style.CircleOptions.prototype.radius;


/**
 * If `true` integral numbers of pixels are used as the X and Y pixel
 * coordinate when drawing the circle in the output canvas. If `false`
 * fractional numbers may be used. Using `true` allows for "sharp"
 * rendering (no blur), while using `false` allows for "accurate"
 * rendering. Note that accuracy is important if the circle's
 * position is animated. Without it, the circle may jitter noticeably.
 * Default value is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.style.CircleOptions.prototype.snapToPixel;


/**
 * Stroke style.
 * @type {module:ol/style/Stroke~Stroke|undefined}
 * @api
 */
olx.style.CircleOptions.prototype.stroke;


/**
 * The atlas manager to use for this circle. When using WebGL it is
 * recommended to use an atlas manager to avoid texture switching.
 * If an atlas manager is given, the circle is added to an atlas.
 * By default no atlas manager is used.
 * @type {module:ol/style/AtlasManager~AtlasManager|undefined}
 */
olx.style.CircleOptions.prototype.atlasManager;


/**
 * @typedef {{anchor: (Array.<number>|undefined),
 *     anchorOrigin: (module:ol/style/IconOrigin~IconOrigin|undefined),
 *     anchorXUnits: (module:ol/style/IconAnchorUnits~IconAnchorUnits|undefined),
 *     anchorYUnits: (module:ol/style/IconAnchorUnits~IconAnchorUnits|undefined),
 *     color: (ol.Color|string|undefined),
 *     crossOrigin: (null|string|undefined),
 *     img: (Image|HTMLCanvasElement|undefined),
 *     offset: (Array.<number>|undefined),
 *     offsetOrigin: (module:ol/style/IconOrigin~IconOrigin|undefined),
 *     opacity: (number|undefined),
 *     scale: (number|undefined),
 *     snapToPixel: (boolean|undefined),
 *     rotateWithView: (boolean|undefined),
 *     rotation: (number|undefined),
 *     size: (ol.Size|undefined),
 *     imgSize: (ol.Size|undefined),
 *     src: (string|undefined)}}
 */
olx.style.IconOptions;


/**
 * Anchor. Default value is `[0.5, 0.5]` (icon center).
 * @type {Array.<number>|undefined}
 * @api
 */
olx.style.IconOptions.prototype.anchor;


/**
 * Origin of the anchor: `bottom-left`, `bottom-right`, `top-left` or
 * `top-right`. Default is `top-left`.
 * @type {module:ol/style/IconOrigin~IconOrigin|undefined}
 * @api
 */
olx.style.IconOptions.prototype.anchorOrigin;


/**
 * Units in which the anchor x value is specified. A value of `'fraction'`
 * indicates the x value is a fraction of the icon. A value of `'pixels'`
 * indicates the x value in pixels. Default is `'fraction'`.
 * @type {module:ol/style/IconAnchorUnits~IconAnchorUnits|undefined}
 * @api
 */
olx.style.IconOptions.prototype.anchorXUnits;


/**
 * Units in which the anchor y value is specified. A value of `'fraction'`
 * indicates the y value is a fraction of the icon. A value of `'pixels'`
 * indicates the y value in pixels. Default is `'fraction'`.
 * @type {module:ol/style/IconAnchorUnits~IconAnchorUnits|undefined}
 * @api
 */
olx.style.IconOptions.prototype.anchorYUnits;


/**
 * Color to tint the icon. If not specified, the icon will be left as is.
 * @type {ol.Color|string|undefined}
 * @api
 */
olx.style.IconOptions.prototype.color;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api
 */
olx.style.IconOptions.prototype.crossOrigin;


/**
 * Image object for the icon. If the `src` option is not provided then the
 * provided image must already be loaded. And in that case, it is required
 * to provide the size of the image, with the `imgSize` option.
 * @type {Image|HTMLCanvasElement|undefined}
 * @api
 */
olx.style.IconOptions.prototype.img;


/**
 * Offset, which, together with the size and the offset origin,
 * define the sub-rectangle to use from the original icon image. Default value
 * is `[0, 0]`.
 * @type {Array.<number>|undefined}
 * @api
 */
olx.style.IconOptions.prototype.offset;


/**
 * Origin of the offset: `bottom-left`, `bottom-right`, `top-left` or
 * `top-right`. Default is `top-left`.
 * @type {module:ol/style/IconOrigin~IconOrigin|undefined}
 * @api
 */
olx.style.IconOptions.prototype.offsetOrigin;


/**
 * Opacity of the icon. Default is `1`.
 * @type {number|undefined}
 * @api
 */
olx.style.IconOptions.prototype.opacity;


/**
 * Scale. Default is `1`.
 * @type {number|undefined}
 * @api
 */
olx.style.IconOptions.prototype.scale;


/**
 * If `true` integral numbers of pixels are used as the X and Y pixel
 * coordinate when drawing the icon in the output canvas. If `false`
 * fractional numbers may be used. Using `true` allows for "sharp"
 * rendering (no blur), while using `false` allows for "accurate"
 * rendering. Note that accuracy is important if the icon's position
 * is animated. Without it, the icon may jitter noticeably. Default
 * value is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.style.IconOptions.prototype.snapToPixel;


/**
 * Whether to rotate the icon with the view. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.style.IconOptions.prototype.rotateWithView;


/**
 * Rotation in radians (positive rotation clockwise). Default is `0`.
 * @type {number|undefined}
 * @api
 */
olx.style.IconOptions.prototype.rotation;


/**
 * Icon size in pixel. Can be used together with `offset` to define the
 * sub-rectangle to use from the origin (sprite) icon image.
 * @type {ol.Size|undefined}
 * @api
 */
olx.style.IconOptions.prototype.size;


/**
 * Image size in pixels. Only required if `img` is set and `src` is not, and for
 * SVG images in Internet Explorer 11. The provided `imgSize` needs to match
 * the actual size of the image.
 * @type {ol.Size|undefined}
 * @api
 */
olx.style.IconOptions.prototype.imgSize;


/**
 * Image source URI.
 * @type {string|undefined}
 * @api
 */
olx.style.IconOptions.prototype.src;


/**
 * Specify radius for regular polygons, or radius1 and radius2 for stars.
 * @typedef {{fill: (module:ol/style/Fill~Fill|undefined),
 *     points: number,
 *     radius: (number|undefined),
 *     radius1: (number|undefined),
 *     radius2: (number|undefined),
 *     angle: (number|undefined),
 *     snapToPixel: (boolean|undefined),
 *     stroke: (module:ol/style/Stroke~Stroke|undefined),
 *     rotation: (number|undefined),
 *     rotateWithView: (boolean|undefined),
 *     atlasManager: (module:ol/style/AtlasManager~AtlasManager|undefined)}}
 */
olx.style.RegularShapeOptions;


/**
 * Fill style.
 * @type {module:ol/style/Fill~Fill|undefined}
 * @api
 */
olx.style.RegularShapeOptions.prototype.fill;


/**
 * Number of points for stars and regular polygons. In case of a polygon, the
 * number of points is the number of sides.
 * @type {number}
 * @api
 */
olx.style.RegularShapeOptions.prototype.points;


/**
 * Radius of a regular polygon.
 * @type {number|undefined}
 * @api
 */
olx.style.RegularShapeOptions.prototype.radius;


/**
 * Outer radius of a star.
 * @type {number|undefined}
 * @api
 */
olx.style.RegularShapeOptions.prototype.radius1;


/**
 * Inner radius of a star.
 * @type {number|undefined}
 * @api
 */
olx.style.RegularShapeOptions.prototype.radius2;


/**
 * Shape's angle in radians. A value of 0 will have one of the shape's point
 * facing up.
 * Default value is 0.
 * @type {number|undefined}
 * @api
 */
olx.style.RegularShapeOptions.prototype.angle;


/**
 * If `true` integral numbers of pixels are used as the X and Y pixel
 * coordinate when drawing the shape in the output canvas. If `false`
 * fractional numbers may be used. Using `true` allows for "sharp"
 * rendering (no blur), while using `false` allows for "accurate"
 * rendering. Note that accuracy is important if the shape's
 * position is animated. Without it, the shape may jitter noticeably.
 * Default value is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.style.RegularShapeOptions.prototype.snapToPixel;


/**
 * Stroke style.
 * @type {module:ol/style/Stroke~Stroke|undefined}
 * @api
 */
olx.style.RegularShapeOptions.prototype.stroke;


/**
 * Rotation in radians (positive rotation clockwise). Default is `0`.
 * @type {number|undefined}
 * @api
 */
olx.style.RegularShapeOptions.prototype.rotation;


/**
 * Whether to rotate the shape with the view. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.style.RegularShapeOptions.prototype.rotateWithView;


/**
 * The atlas manager to use for this symbol. When using WebGL it is
 * recommended to use an atlas manager to avoid texture switching.
 * If an atlas manager is given, the symbol is added to an atlas.
 * By default no atlas manager is used.
 * @type {module:ol/style/AtlasManager~AtlasManager|undefined}
 */
olx.style.RegularShapeOptions.prototype.atlasManager;


/**
 * @typedef {{font: (string|undefined),
 *     maxAngle: (number|undefined),
 *     offsetX: (number|undefined),
 *     offsetY: (number|undefined),
 *     overflow: (boolean|undefined),
 *     placement: (module:ol/style/Text~TextPlacement|string|undefined),
 *     scale: (number|undefined),
 *     rotateWithView: (boolean|undefined),
 *     rotation: (number|undefined),
 *     text: (string|undefined),
 *     textAlign: (string|undefined),
 *     textBaseline: (string|undefined),
 *     fill: (module:ol/style/Fill~Fill|undefined),
 *     stroke: (module:ol/style/Stroke~Stroke|undefined),
 *     backgroundFill: (module:ol/style/Fill~Fill|undefined),
 *     backgroundStroke: (module:ol/style/Stroke~Stroke|undefined),
 *     padding: (Array.<number>|undefined)}}
 */
olx.style.TextOptions;


/**
 * Font style as CSS 'font' value, see:
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font}.
 * Default is '10px sans-serif'
 * @type {string|undefined}
 * @api
 */
olx.style.TextOptions.prototype.font;


/**
 * When `placement` is set to `'line'`, allow a maximum angle between adjacent
 * characters. The expected value is in radians, and the default is 45°
 * (`Math.PI / 4`).
 * @type {number|undefined}
 * @api
 */
olx.style.TextOptions.prototype.maxAngle;


/**
 * Horizontal text offset in pixels. A positive will shift the text right.
 * Default is `0`.
 * @type {number|undefined}
 * @api
 */
olx.style.TextOptions.prototype.offsetX;


/**
 * Vertical text offset in pixels. A positive will shift the text down. Default
 * is `0`.
 * @type {number|undefined}
 * @api
 */
olx.style.TextOptions.prototype.offsetY;


/**
 * For polygon labels or when `placement` is set to `'line'`, allow text to
 * exceed the width of the polygon at the label position or the length of
 * the path that it follows. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.style.TextOptions.prototype.overflow;


/**
 * Text placement.
 * @type {module:ol/style/Text~TextPlacement|undefined}
 * @api
 */
olx.style.TextOptions.prototype.placement;


/**
 * Scale.
 * @type {number|undefined}
 * @api
 */
olx.style.TextOptions.prototype.scale;


/**
 * Whether to rotate the text with the view. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.style.TextOptions.prototype.rotateWithView;


/**
 * Rotation in radians (positive rotation clockwise). Default is `0`.
 * @type {number|undefined}
 * @api
 */
olx.style.TextOptions.prototype.rotation;


/**
 * Text content.
 * @type {string|undefined}
 * @api
 */
olx.style.TextOptions.prototype.text;


/**
 * Text alignment. Possible values: 'left', 'right', 'center', 'end' or 'start'.
 * Default is 'center' for `placement: 'point'`. For `placement: 'line'`, the
 * default is to let the renderer choose a placement where `maxAngle` is not
 * exceeded.
 * @type {string|undefined}
 * @api
 */
olx.style.TextOptions.prototype.textAlign;


/**
 * Text base line. Possible values: 'bottom', 'top', 'middle', 'alphabetic',
 * 'hanging', 'ideographic'. Default is 'middle'.
 * @type {string|undefined}
 * @api
 */
olx.style.TextOptions.prototype.textBaseline;


/**
 * Fill style. If none is provided, we'll use a dark fill-style (#333).
 * @type {module:ol/style/Fill~Fill|undefined}
 * @api
 */
olx.style.TextOptions.prototype.fill;


/**
 * Stroke style.
 * @type {module:ol/style/Stroke~Stroke|undefined}
 * @api
 */
olx.style.TextOptions.prototype.stroke;


/**
 * Fill style for the text background when `placement` is `'point'`. Default is
 * no fill.
 * @type {module:ol/style/Fill~Fill|undefined}
 * @api
 */
olx.style.TextOptions.prototype.backgroundFill;


/**
 * Stroke style for the text background  when `placement` is `'point'`. Default
 * is no stroke.
 * @type {module:ol/style/Stroke~Stroke|undefined}
 * @api
 */
olx.style.TextOptions.prototype.backgroundStroke;


/**
 * Padding in pixels around the text for decluttering and background. The order
 * of values in the array is `[top, right, bottom, left]`. Default is
 * `[0, 0, 0, 0]`.
 * @type {Array.<number>|undefined}
 * @api
 */
olx.style.TextOptions.prototype.padding;


/**
 * @typedef {{geometry: (undefined|string|module:ol/geom/Geometry~Geometry|ol.StyleGeometryFunction),
 *     fill: (module:ol/style/Fill~Fill|undefined),
 *     image: (module:ol/style/Image~ImageStyle|undefined),
 *     renderer: (ol.StyleRenderFunction|undefined),
 *     stroke: (module:ol/style/Stroke~Stroke|undefined),
 *     text: (module:ol/style/Text~Text|undefined),
 *     zIndex: (number|undefined)}}
 */
olx.style.StyleOptions;


/**
 * Feature property or geometry or function returning a geometry to render for
 * this style.
 * @type {undefined|string|module:ol/geom/Geometry~Geometry|ol.StyleGeometryFunction}
 * @api
 */
olx.style.StyleOptions.prototype.geometry;


/**
 * Fill style.
 * @type {module:ol/style/Fill~Fill|undefined}
 * @api
 */
olx.style.StyleOptions.prototype.fill;


/**
 * Image style.
 * @type {module:ol/style/Image~ImageStyle|undefined}
 * @api
 */
olx.style.StyleOptions.prototype.image;


/**
 * Custom renderer. When configured, `fill`, `stroke` and `image` will be
 * ignored, and the provided function will be called with each render frame for
 * each geometry.
 *
 * @type {ol.StyleRenderFunction|undefined}
 */
olx.style.StyleOptions.prototype.renderer;


/**
 * Stroke style.
 * @type {module:ol/style/Stroke~Stroke|undefined}
 * @api
 */
olx.style.StyleOptions.prototype.stroke;


/**
 * Text style.
 * @type {module:ol/style/Text~Text|undefined}
 * @api
 */
olx.style.StyleOptions.prototype.text;


/**
 * Z index.
 * @type {number|undefined}
 * @api
 */
olx.style.StyleOptions.prototype.zIndex;


/**
 * @typedef {{extent: (ol.Extent|undefined),
 *     minZoom: (number|undefined),
 *     origin: (ol.Coordinate|undefined),
 *     origins: (Array.<ol.Coordinate>|undefined),
 *     resolutions: !Array.<number>,
 *     sizes: (Array.<ol.Size>|undefined),
 *     tileSize: (number|ol.Size|undefined),
 *     tileSizes: (Array.<number|ol.Size>|undefined)}}
 */
olx.tilegrid.TileGridOptions;


/**
 * Extent for the tile grid. No tiles outside this extent will be requested by
 * {@link ol.source.Tile} sources. When no `origin` or `origins` are
 * configured, the `origin` will be set to the top-left corner of the extent.
 * @type {ol.Extent|undefined}
 * @api
 */
olx.tilegrid.TileGridOptions.prototype.extent;


/**
 * Minimum zoom. Default is 0.
 * @type {number|undefined}
 * @api
 */
olx.tilegrid.TileGridOptions.prototype.minZoom;


/**
 * The tile grid origin, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`).
 * Tile coordinates increase left to right and upwards. If not specified,
 * `extent` or `origins` must be provided.
 * @type {ol.Coordinate|undefined}
 * @api
 */
olx.tilegrid.TileGridOptions.prototype.origin;


/**
 * Tile grid origins, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`), for
 * each zoom level. If given, the array length should match the length of the
 * `resolutions` array, i.e. each resolution can have a different origin. Tile
 * coordinates increase left to right and upwards. If not specified, `extent`
 * or `origin` must be provided.
 * @type {Array.<ol.Coordinate>|undefined}
 * @api
 */
olx.tilegrid.TileGridOptions.prototype.origins;


/**
 * Resolutions. The array index of each resolution needs to match the zoom
 * level. This means that even if a `minZoom` is configured, the resolutions
 * array will have a length of `maxZoom + 1`.
 * @type {!Array.<number>}
 * @api
 */
olx.tilegrid.TileGridOptions.prototype.resolutions;


/**
 * Tile size. Default is `[256, 256]`.
 * @type {number|ol.Size|undefined}
 * @api
 */
olx.tilegrid.TileGridOptions.prototype.tileSize;


/**
 * Tile sizes. If given, the array length should match the length of the
 * `resolutions` array, i.e. each resolution can have a different tile size.
 * @type {Array.<number|ol.Size>|undefined}
 * @api
 */
olx.tilegrid.TileGridOptions.prototype.tileSizes;


/**
 * @typedef {{extent: (ol.Extent|undefined),
 *     origin: (ol.Coordinate|undefined),
 *     origins: (Array.<ol.Coordinate>|undefined),
 *     resolutions: !Array.<number>,
 *     matrixIds: !Array.<string>,
 *     sizes: (Array.<ol.Size>|undefined),
 *     tileSize: (number|ol.Size|undefined),
 *     tileSizes: (Array.<number|ol.Size>|undefined)}}
 */
olx.tilegrid.WMTSOptions;


/**
 * Extent for the tile grid. No tiles outside this extent will be requested by
 * {@link ol.source.Tile} sources. When no `origin` or `origins` are
 * configured, the `origin` will be set to the top-left corner of the extent.
 * @type {ol.Extent|undefined}
 * @api
 */
olx.tilegrid.WMTSOptions.prototype.extent;


/**
 * The tile grid origin, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`).
 * Tile coordinates increase left to right and upwards. If not specified,
 * `extent` or `origins` must be provided.
 * @type {ol.Coordinate|undefined}
 * @api
 */
olx.tilegrid.WMTSOptions.prototype.origin;


/**
 * Tile grid origins, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`), for
 * each zoom level. If given, the array length should match the length of the
 * `resolutions` array, i.e. each resolution can have a different origin. Tile
 * coordinates increase left to right and upwards. If not specified, `extent` or
 * `origin` must be provided.
 * @type {Array.<ol.Coordinate>|undefined}
 * @api
 */
olx.tilegrid.WMTSOptions.prototype.origins;


/**
 * Resolutions. The array index of each resolution needs to match the zoom
 * level. This means that even if a `minZoom` is configured, the resolutions
 * array will have a length of `maxZoom + 1`
 * @type {!Array.<number>}
 * @api
 */
olx.tilegrid.WMTSOptions.prototype.resolutions;


/**
 * matrix IDs. The length of this array needs to match the length of the
 * `resolutions` array.
 * @type {!Array.<string>}
 * @api
 */
olx.tilegrid.WMTSOptions.prototype.matrixIds;


/**
 * Number of tile rows and columns of the grid for each zoom level. The values
 * here are the `TileMatrixWidth` and `TileMatrixHeight` advertised in the
 * GetCapabilities response of the WMTS, and define the grid's extent together
 * with the `origin`. An `extent` can be configured in addition, and will
 * further limit the extent for which tile requests are made by sources. Note
 * that when the top-left corner of the `extent` is used as `origin` or
 * `origins`, then the `y` value must be negative because OpenLayers tile
 * coordinates increase upwards.
 * @type {Array.<ol.Size>|undefined}
 * @api
 */
olx.tilegrid.WMTSOptions.prototype.sizes;


/**
 * Tile size.
 * @type {number|ol.Size|undefined}
 * @api
 */
olx.tilegrid.WMTSOptions.prototype.tileSize;


/**
 * Tile sizes. The length of this array needs to match the length of the
 * `resolutions` array.
 * @type {Array.<number|ol.Size>|undefined}
 * @api
 */
olx.tilegrid.WMTSOptions.prototype.tileSizes;


/**
 * Number of tile columns that cover the grid's extent for each zoom level. Only
 * required when used with a source that has `wrapX` set to `true`, and only
 * when the grid's origin differs from the one of the projection's extent. The
 * array length has to match the length of the `resolutions` array, i.e. each
 * resolution will have a matching entry here.
 * @type {Array.<number>|undefined}
 * @api
 */
olx.tilegrid.WMTSOptions.prototype.widths;


/**
 * @typedef {{extent: (ol.Extent|undefined),
 *     maxZoom: (number|undefined),
 *     minZoom: (number|undefined),
 *     tileSize: (number|ol.Size|undefined)}}
 */
olx.tilegrid.XYZOptions;


/**
 * Extent for the tile grid.  The origin for an XYZ tile grid is the top-left
 * corner of the extent.  The zero level of the grid is defined by the
 * resolution at which one tile fits in the provided extent.  If not provided,
 * the extent of the EPSG:3857 projection is used.
 * @type {ol.Extent|undefined}
 * @api
 */
olx.tilegrid.XYZOptions.prototype.extent;


/**
 * Maximum zoom.  The default is `ol.DEFAULT_MAX_ZOOM`.  This determines the
 * number of levels in the grid set.  For example, a `maxZoom` of 21 means there
 * are 22 levels in the grid set.
 * @type {number|undefined}
 * @api
 */
olx.tilegrid.XYZOptions.prototype.maxZoom;


/**
 * Minimum zoom. Default is 0.
 * @type {number|undefined}
 * @api
 */
olx.tilegrid.XYZOptions.prototype.minZoom;


/**
 * Tile size in pixels. Default is `[256, 256]`.
 * @type {number|ol.Size|undefined}
 * @api
 */
olx.tilegrid.XYZOptions.prototype.tileSize;
