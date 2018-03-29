
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
