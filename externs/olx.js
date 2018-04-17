
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
