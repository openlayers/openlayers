/**
 * @type {Object}
 */
var olx;


/**
 * @typedef {{html: string,
 *     tileRanges: (Object.<string, Array.<ol.TileRange>>|undefined)}}
 * @todo api
 */
olx.AttributionOptions;


/**
 * HTML markup for this attribution.
 * @type {string}
 */
olx.AttributionOptions.prototype.html;


/**
 * Tile ranges (FOR INTERNAL USE ONLY).
 * @type {Object.<string, Array.<ol.TileRange>>|undefined}
 */
olx.AttributionOptions.prototype.tileRanges;


/**
 * @typedef {{loadTilesWhileAnimating: (boolean|undefined),
 *     loadTilesWhileInteracting: (boolean|undefined)}}
 * @todo api
 */
olx.DeviceOptions;


/**
 * When set to false, no tiles will be loaded while animating, which improves
 * responsiveness on devices with slow memory. Default is `true`.
 * @type {boolean|undefined}
 */
olx.DeviceOptions.prototype.loadTilesWhileAnimating;


/**
 * When set to false, no tiles will be loaded while interacting, which improves
 * responsiveness on devices with slow memory. Default is `true`.
 * @type {boolean|undefined}
 */
olx.DeviceOptions.prototype.loadTilesWhileInteracting;


/**
 * @typedef {{tracking: (boolean|undefined)}}
 * @todo api
 */
olx.DeviceOrientationOptions;


/**
 * Start tracking. Default is `false`.
 * @type {boolean|undefined}
 */
olx.DeviceOrientationOptions.prototype.tracking;


/**
 * @typedef {{tracking: (boolean|undefined),
 *     trackingOptions: (GeolocationPositionOptions|undefined),
 *     projection: ol.proj.ProjectionLike}}
 * @todo api
 */
olx.GeolocationOptions;


/**
 * Start Tracking. Default is `false`.
 * @type {boolean|undefined}
 */
olx.GeolocationOptions.prototype.tracking;


/**
 * Tracking options.
 * @type {GeolocationPositionOptions|undefined}
 */
olx.GeolocationOptions.prototype.trackingOptions;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.GeolocationOptions.prototype.projection;


/**
 * Object literal with config options for the map.
 * @typedef {{controls: (ol.Collection|Array.<ol.control.Control>|undefined),
 *     deviceOptions: (olx.DeviceOptions|undefined),
 *     pixelRatio: (number|undefined),
 *     interactions: (ol.Collection|Array.<ol.interaction.Interaction>|undefined),
 *     keyboardEventTarget: (Element|Document|string|undefined),
 *     layers: (Array.<ol.layer.Base>|ol.Collection|undefined),
 *     ol3Logo: (boolean|undefined),
 *     overlays: (ol.Collection|Array.<ol.Overlay>|undefined),
 *     renderer: (ol.RendererHint|Array.<ol.RendererHint|string>|string|undefined),
 *     target: (Element|string|undefined),
 *     view: (ol.IView|undefined)}}
 * @todo api
 */
olx.MapOptions;


/**
 * Controls initially added to the map.
 * @type {ol.Collection|Array.<ol.control.Control>|undefined}
 */
olx.MapOptions.prototype.controls;


/**
 * Device options for the map.
 * @type {olx.DeviceOptions|undefined}
 */
olx.MapOptions.prototype.deviceOptions;


/**
 * The ratio between physical pixels and device-independent pixels (dips) on the
 * device. If `undefined` then it gets set by using `window.devicePixelRatio`.
 * @type {number|undefined}
 */
olx.MapOptions.prototype.pixelRatio;


/**
 * Interactions that are initially added to the map.
 * @type {ol.Collection|Array.<ol.interaction.Interaction>|undefined}
 */
olx.MapOptions.prototype.interactions;


/**
 * The element to listen to keyboard events on. This determines when the
 * `KeyboardPan` and `KeyboardZoom` interactions trigger. For example, if this
 * option is set to `document` the keyboard interactions will always trigger. If
 * this option is not specified, the element the library listens to keyboard
 * events on is the map target (i.e. the user-provided div for the map). If this
 * is not `document` the target element needs to be focused for key events to be
 * emitted, requiring that the target element has a `tabindex` attribute.
 * @type {Element|Document|string|undefined}
 */
olx.MapOptions.prototype.keyboardEventTarget;


/**
 * Layers. Array or {@link ol.Collection} items are instances of
 * {@link ol.layer.Layer} or any of its {@link ol.layer} subclasses.
 * @type {Array.<ol.layer.Base>|ol.Collection|undefined}
 */
olx.MapOptions.prototype.layers;


/**
 * Show ol3 logo. Default is `true`.
 * @type {boolean|undefined}
 */
olx.MapOptions.prototype.ol3Logo;


/**
 * Overlays initially added to the map.
 * @type {ol.Collection|Array.<ol.Overlay>|undefined}
 */
olx.MapOptions.prototype.overlays;


/**
 * Renderer.
 * @type {ol.RendererHint|Array.<ol.RendererHint|string>|string|undefined}
 */
olx.MapOptions.prototype.renderer;


/**
 * The container for the map.
 * @type {Element|string|undefined}
 */
olx.MapOptions.prototype.target;


/**
 * The map's view. Currently {@link ol.View2D} is available as view.
 * @type {ol.IView|undefined}
 */
olx.MapOptions.prototype.view;


/**
 * Object literal with config options for the overlay.
 * @typedef {{element: (Element|undefined),
 *     position: (ol.Coordinate|undefined),
 *     positioning: (ol.OverlayPositioning|string|undefined),
 *     stopEvent: (boolean|undefined),
 *     insertFirst: (boolean|undefined),
 *     offsetX: (number|undefined),
 *     offsetY: (number|undefined)}}
 * @todo api
 */
olx.OverlayOptions;


/**
 * The overlay element.
 * @type {Element|undefined}
 */
olx.OverlayOptions.prototype.element;


/**
 * The overlay position in map projection.
 * @type {ol.Coordinate|undefined}
 */
olx.OverlayOptions.prototype.position;


/**
 * Positioning.
 * @type {ol.OverlayPositioning|string|undefined}
 */
olx.OverlayOptions.prototype.positioning;


/**
 * Whether event propagation to the map viewport should be stopped. Default is
 * `true`. If `true` the overlay is placed in the same container as that of the
 * controls (`ol-overlaycontainer-stopevent`).
 * @type {boolean|undefined}
 */
olx.OverlayOptions.prototype.stopEvent;


/**
 * Whether the overlay is inserted first in the overlay container, or appended.
 * Default is `true`. If the overlay is placed in the same container as that of
 * the controls (see the `stopEvent` option) you will probably set `insertFirst`
 * to `true` so the overlay is displayed below the controls.
 * @type {boolean|undefined}
 */
olx.OverlayOptions.prototype.insertFirst;


/**
 * Horizontal offset in pixels. A positive will shift the overlay right. Default
 * is `0`.
 * @type {number|undefined}
 */
olx.OverlayOptions.prototype.offsetX;


/**
 * Vertical offset in pixels. A positive will shift the overlay down. Default is
 * `0`.
 * @type {number|undefined}
 */
olx.OverlayOptions.prototype.offsetY;


/**
 * Object literal with config options for the Proj4js projection.
 * @typedef {{code: string,
 *     extent: (ol.Extent|undefined),
 *     global: (boolean|undefined)}}
 * @todo api
 */
olx.Proj4jsProjectionOptions;


/**
 * The SRS identifier code, e.g. `EPSG:31256`.
 * @type {string}
 */
olx.Proj4jsProjectionOptions.prototype.code;


/**
 * The validity extent for the SRS.
 * @type {ol.Extent|undefined}
 */
olx.Proj4jsProjectionOptions.prototype.extent;


/**
 * Whether the projection is valid for the whole globe. Default is `false`.
 * @type {boolean|undefined}
 */
olx.Proj4jsProjectionOptions.prototype.global;


/**
 * Object literal with config options for the projection.
 * @typedef {{code: string,
 *     units: (ol.proj.Units|string),
 *     extent: (ol.Extent|undefined),
 *     axisOrientation: (string|undefined),
 *     global: (boolean|undefined)}}
 * @todo api
 */
olx.ProjectionOptions;


/**
 * The SRS identifier code, e.g. `EPSG:4326`.
 * @type {string}
 */
olx.ProjectionOptions.prototype.code;


/**
 * Units.
 * @type {ol.proj.Units|string}
 */
olx.ProjectionOptions.prototype.units;


/**
 * The validity extent for the SRS.
 * @type {ol.Extent|undefined}
 */
olx.ProjectionOptions.prototype.extent;


/**
 * The axis orientation as specified in Proj4. The default is `enu`.
 * @type {string|undefined}
 */
olx.ProjectionOptions.prototype.axisOrientation;


/**
 * Whether the projection is valid for the whole globe. Default is `false`.
 * @type {boolean|undefined}
 */
olx.ProjectionOptions.prototype.global;


/**
 * Object literal with config options for the view.
 * @typedef {{center: (ol.Coordinate|undefined),
 *     constrainRotation: (boolean|number|undefined),
 *     enableRotation: (boolean|undefined),
 *     extent: (ol.Extent|undefined),
 *     maxResolution: (number|undefined),
 *     maxZoom: (number|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     resolution: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     rotation: (number|undefined),
 *     zoom: (number|undefined),
 *     zoomFactor: (number|undefined)}}
 * @todo api
 */
olx.View2DOptions;


/**
 * The initial center for the view. The coordinate system for the center is
 * specified with the `projection` option. Default is `undefined`, and layer
 * sources will not be fetched if this is not set.
 * @type {ol.Coordinate|undefined}
 */
olx.View2DOptions.prototype.center;


/**
 * Rotation constraint. `false` means no constraint. `true` means no constraint,
 * but snap to zero near zero. A number constraints the rotation to that number
 * of values. For example, `4` will constrain the rotation to 0, 90, 180, and
 * 270 degrees. The default is `true`.
 * @type {boolean|number|undefined}
 */
olx.View2DOptions.prototype.constrainRotation;


/**
 * Enable rotation. Default is `true`.
 * @type {boolean|undefined}
 */
olx.View2DOptions.prototype.enableRotation;


/**
 * The extent that constrains the center, in other words, center cannot be set
 * outside this extent. Default is `undefined`.
 * @type {ol.Extent|undefined}
 */
olx.View2DOptions.prototype.extent;


/**
 * The maximum resolution used to determine the resolution constraint. It is
 * used together with `maxZoom` and `zoomFactor`. If unspecified it is
 * calculated in such a way that the projection's validity extent fits in a
 * 256x256 px tile. If the projection is Spherical Mercator (the default) then
 * `maxResolution` defaults to `40075016.68557849 / 256 = 156543.03392804097`.
 * @type {number|undefined}
 */
olx.View2DOptions.prototype.maxResolution;


/**
 * The maximum zoom level used to determine the resolution constraint. It is
 * used together with `maxResolution` and `zoomFactor`. Default is `28`.
 * @type {number|undefined}
 */
olx.View2DOptions.prototype.maxZoom;


/**
 * The projection. Default is `EPSG:3857` (Spherical Mercator).
 * @type {ol.proj.ProjectionLike}
 */
olx.View2DOptions.prototype.projection;


/**
 * The initial resolution for the view. The units are `projection` units per
 * pixel (e.g. meters per pixel). An alternative to setting this is to set
 * `zoom`. Default is `undefined`, and layer sources will not be fetched if
 * neither this nor `zoom` are defined.
 * @type {number|undefined}
 */
olx.View2DOptions.prototype.resolution;


/**
 * Resolutions to determine the resolution constraint. If set the
 * `maxResolution`, `maxZoom` and `zoomFactor` options are ignored.
 * @type {Array.<number>|undefined}
 */
olx.View2DOptions.prototype.resolutions;


/**
 * The initial rotation for the view in radians (positive rotation clockwise).
 * Default is `0`.
 * @type {number|undefined}
 */
olx.View2DOptions.prototype.rotation;


/**
 * Only used if `resolution` is not defined. Zoom level used to calculate the
 * initial resolution for the view. The initial resolution is determined using
 * the `ol.View2D#constrainResolution` method.
 * @type {number|undefined}
 */
olx.View2DOptions.prototype.zoom;


/**
 * The zoom factor used to determine the resolution constraint. Used together
 * with `maxResolution` and `maxZoom`. Default is `2`.
 * @type {number|undefined}
 */
olx.View2DOptions.prototype.zoomFactor;


/**
 * @typedef {{resolution: number,
 *     start: (number|undefined),
 *     duration: (number|undefined),
 *     easing: (function(number):number|undefined)}}
 * @todo api
 */
olx.animation.BounceOptions;


/**
 * The resolution to start the bounce from, typically
 * `map.getView().getResolution()`.
 * @type {number}
 */
olx.animation.BounceOptions.prototype.resolution;


/**
 * The start time of the animation. Default is immediately.
 * @type {number|undefined}
 */
olx.animation.BounceOptions.prototype.start;


/**
 * The duration of the animation in milliseconds. Default is `1000`.
 * @type {number|undefined}
 */
olx.animation.BounceOptions.prototype.duration;


/**
 * The easing function to use. Default is `ol.easing.upAndDown`
 * @type {function(number):number|undefined}
 */
olx.animation.BounceOptions.prototype.easing;


/**
 * @typedef {{source: ol.Coordinate,
 *     start: (number|undefined),
 *     duration: (number|undefined),
 *     easing: (function(number):number|undefined)}}
 * @todo api
 */
olx.animation.PanOptions;


/**
 * The location to start panning from, typically `map.getView().getCenter()`.
 * @type {ol.Coordinate}
 */
olx.animation.PanOptions.prototype.source;


/**
 * The start time of the animation. Default is immediately.
 * @type {number|undefined}
 */
olx.animation.PanOptions.prototype.start;


/**
 * The duration of the animation in milliseconds. Default is `1000`.
 * @type {number|undefined}
 */
olx.animation.PanOptions.prototype.duration;


/**
 * The easing function to use. Default is `ol.easing.inAndOut`
 * @type {function(number):number|undefined}
 */
olx.animation.PanOptions.prototype.easing;


/**
 * @typedef {{rotation: (number|undefined),
 *     anchor: (ol.Coordinate|undefined),
 *     start: (number|undefined),
 *     duration: (number|undefined),
 *     easing: (function(number):number|undefined)}}
 * @todo api
 */
olx.animation.RotateOptions;


/**
 * The rotation value (in radians) to begin rotating from, typically
 * `map.getView().getRotation()`. If `undefined` then `0` is assumed.
 * @type {number|undefined}
 */
olx.animation.RotateOptions.prototype.rotation;


/**
 * The rotation center/anchor. The map rotates around the center of the view
 * if unspecified.
 * @type {ol.Coordinate|undefined}
 */
olx.animation.RotateOptions.prototype.anchor;


/**
 * The start time of the animation. Default is immediately.
 * @type {number|undefined}
 */
olx.animation.RotateOptions.prototype.start;


/**
 * The duration of the animation in milliseconds. Default is `1000`.
 * @type {number|undefined}
 */
olx.animation.RotateOptions.prototype.duration;


/**
 * The easing function to use. Default is `ol.easing.inAndOut`
 * @type {function(number):number|undefined}
 */
olx.animation.RotateOptions.prototype.easing;


/**
 * @typedef {{resolution: number,
 *     start: (number|undefined),
 *     duration: (number|undefined),
 *     easing: (function(number):number|undefined)}}
 * @todo api
 */
olx.animation.ZoomOptions;


/**
 * number The resolution to begin zooming from, typically
 * `map.getView().getResolution()`.
 * @type {number}
 */
olx.animation.ZoomOptions.prototype.resolution;


/**
 * The start time of the animation. Default is immediately.
 * @type {number|undefined}
 */
olx.animation.ZoomOptions.prototype.start;


/**
 * The duration of the animation in milliseconds. Default is `1000`.
 * @type {number|undefined}
 */
olx.animation.ZoomOptions.prototype.duration;


/**
 * Easing function.
 * @type {function(number):number|undefined}
 */
olx.animation.ZoomOptions.prototype.easing;


/**
 * @typedef {{className: (string|undefined),
 *     target: (Element|undefined)}}
 * @todo api
 */
olx.control.AttributionOptions;


/**
 * CSS class name. Default is `ol-attribution`.
 * @type {string|undefined}
 */
olx.control.AttributionOptions.prototype.className;


/**
 * Target.
 * @type {Element|undefined}
 */
olx.control.AttributionOptions.prototype.target;


/**
 * @typedef {{element: (Element|undefined),
 *     target: (Element|string|undefined)}}
 * @todo api
 */
olx.control.ControlOptions;


/**
 * The element is the control's container element. This only needs to be
 * specified if you're developing a custom control.
 * @type {Element|undefined}
 */
olx.control.ControlOptions.prototype.element;


/**
 * Specify a target if you want the control to be rendered outside of the map's
 * viewport.
 * @type {Element|string|undefined}
 */
olx.control.ControlOptions.prototype.target;


/**
 * @typedef {{attribution: (boolean|undefined),
 *     attributionOptions: (olx.control.AttributionOptions|undefined),
 *     logo: (boolean|undefined),
 *     logoOptions: (olx.control.LogoOptions|undefined),
 *     zoom: (boolean|undefined),
 *     zoomOptions: (olx.control.ZoomOptions|undefined)}}
 * @todo api
 */
olx.control.DefaultsOptions;


/**
 * Attribution. Default is `true`.
 * @type {boolean|undefined}
 */
olx.control.DefaultsOptions.prototype.attribution;


/**
 * Attribution options.
 * @type {olx.control.AttributionOptions|undefined}
 */
olx.control.DefaultsOptions.prototype.attributionOptions;


/**
 * Logo. Default is `true`.
 * @type {boolean|undefined}
 */
olx.control.DefaultsOptions.prototype.logo;


/**
 * Logo options.
 * @type {olx.control.LogoOptions|undefined}
 */
olx.control.DefaultsOptions.prototype.logoOptions;


/**
 * Zoom. Default is `true`.
 * @type {boolean|undefined}
 */
olx.control.DefaultsOptions.prototype.zoom;


/**
 * Zoom options.
 * @type {olx.control.ZoomOptions|undefined}
 */
olx.control.DefaultsOptions.prototype.zoomOptions;


/**
 * @typedef {{className: (string|undefined),
 *     tipLabel: (string|undefined),
 *     keys: (boolean|undefined),
 *     target: (Element|undefined)}}
 * @todo api
 */
olx.control.FullScreenOptions;


/**
 * CSS class name. Default is `ol-full-screen`.
 * @type {string|undefined}
 */
olx.control.FullScreenOptions.prototype.className;


/**
 * Text label to use for the button tip. Default is `Toggle full-screen`
 * @type {string|undefined}
 */
olx.control.FullScreenOptions.prototype.tipLabel;


/**
 * Full keyboard access.
 * @type {boolean|undefined}
 */
olx.control.FullScreenOptions.prototype.keys;


/**
 * Target.
 * @type {Element|undefined}
 */
olx.control.FullScreenOptions.prototype.target;


/**
 * @typedef {{className: (string|undefined),
 *     target: (Element|undefined)}}
 * @todo api
 */
olx.control.LogoOptions;


/**
 * CSS class name. Default is `ol-logo`.
 * @type {string|undefined}
 */
olx.control.LogoOptions.prototype.className;


/**
 * Target.
 * @type {Element|undefined}
 */
olx.control.LogoOptions.prototype.target;


/**
 * @typedef {{className: (string|undefined),
 *     coordinateFormat: (ol.CoordinateFormatType|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     target: (Element|undefined),
 *     undefinedHTML: (string|undefined)}}
 * @todo api
 */
olx.control.MousePositionOptions;


/**
 * CSS class name. Default is `ol-mouse-position`.
 * @type {string|undefined}
 */
olx.control.MousePositionOptions.prototype.className;


/**
 * Coordinate format.
 * @type {ol.CoordinateFormatType|undefined}
 */
olx.control.MousePositionOptions.prototype.coordinateFormat;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.control.MousePositionOptions.prototype.projection;


/**
 * Target.
 * @type {Element|undefined}
 */
olx.control.MousePositionOptions.prototype.target;


/**
 * Markup for undefined coordinates. Default is `` (empty string).
 * @type {string|undefined}
 */
olx.control.MousePositionOptions.prototype.undefinedHTML;


/**
 * @typedef {{className: (string|undefined),
 *     minWidth: (number|undefined),
 *     target: (Element|undefined),
 *     units: (ol.control.ScaleLineUnits|string|undefined)}}
 * @todo api
 */
olx.control.ScaleLineOptions;


/**
 * CSS Class name. Default is `ol-scale-line`.
 * @type {string|undefined}
 */
olx.control.ScaleLineOptions.prototype.className;


/**
 * Minimum width in pixels. Default is `64`.
 * @type {number|undefined}
 */
olx.control.ScaleLineOptions.prototype.minWidth;


/**
 * Target.
 * @type {Element|undefined}
 */
olx.control.ScaleLineOptions.prototype.target;


/**
 * Units. Default is `metric`.
 * @type {ol.control.ScaleLineUnits|string|undefined}
 */
olx.control.ScaleLineOptions.prototype.units;


/**
 * @typedef {{duration: (number|undefined),
 *     className: (string|undefined),
 *     zoomInLabel: (string|undefined),
 *     zoomOutLabel: (string|undefined),
 *     zoomInTipLabel: (string|undefined),
 *     zoomOutTipLabel: (string|undefined),
 *     delta: (number|undefined),
 *     target: (Element|undefined)}}
 * @todo api
 */
olx.control.ZoomOptions;


/**
 * Animation duration in milliseconds. Default is `250`.
 * @type {number|undefined}
 */
olx.control.ZoomOptions.prototype.duration;


/**
 * CSS class name. Default is `ol-zoom`.
 * @type {string|undefined}
 */
olx.control.ZoomOptions.prototype.className;


/**
 * Text label to use for the zoom-in button. Default is `+`
 * @type {string|undefined}
 */
olx.control.ZoomOptions.prototype.zoomInLabel;


/**
 * Text label to use for the zoom-out button. Default is `-`
 * @type {string|undefined}
 */
olx.control.ZoomOptions.prototype.zoomOutLabel;


/**
 * Text label to use for the button tip. Default is `Zoom in`
 * @type {string|undefined}
 */
olx.control.ZoomOptions.prototype.zoomInTipLabel;


/**
 * Text label to use for the button tip. Default is `Zoom out`
 * @type {string|undefined}
 */
olx.control.ZoomOptions.prototype.zoomOutTipLabel;


/**
 * The zoom delta applied on each click.
 * @type {number|undefined}
 */
olx.control.ZoomOptions.prototype.delta;


/**
 * Target.
 * @type {Element|undefined}
 */
olx.control.ZoomOptions.prototype.target;


/**
 * @typedef {{className: (string|undefined),
 *     maxResolution: (number|undefined),
 *     minResolution: (number|undefined)}}
 * @todo api
 */
olx.control.ZoomSliderOptions;


/**
 * CSS class name.
 * @type {string|undefined}
 */
olx.control.ZoomSliderOptions.prototype.className;


/**
 * Maximum resolution.
 * @type {number|undefined}
 */
olx.control.ZoomSliderOptions.prototype.maxResolution;


/**
 * Minimum resolution.
 * @type {number|undefined}
 */
olx.control.ZoomSliderOptions.prototype.minResolution;


/**
 * @typedef {{className: (string|undefined),
 *     target: (Element|undefined),
 *     tipLabel: (string|undefined),
 *     extent: (ol.Extent|undefined)}}
 * @todo api
 */
olx.control.ZoomToExtentOptions;


/**
 * Class name. Default is `ol-zoom-extent`.
 * @type {string|undefined}
 */
olx.control.ZoomToExtentOptions.prototype.className;


/**
 * Target.
 * @type {Element|undefined}
 */
olx.control.ZoomToExtentOptions.prototype.target;


/**
 * Text label to use for the button tip. Default is `Zoom to extent`
 * @type {string|undefined}
 */
olx.control.ZoomToExtentOptions.prototype.tipLabel;


/**
 * The extent to zoom to. If undefined the validity extent of the view
 * projection is used.
 * @type {ol.Extent|undefined}
 */
olx.control.ZoomToExtentOptions.prototype.extent;


/**
 * @typedef {{defaultProjection: ol.proj.ProjectionLike}}
 * @todo api
 */
olx.format.GeoJSONOptions;


/**
 * Default projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.format.GeoJSONOptions.prototype.defaultProjection;


/**
 * @typedef {{defaultProjection: ol.proj.ProjectionLike}}
 * @todo api
 */
olx.format.TopoJSONOptions;


/**
 * Default projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.format.TopoJSONOptions.prototype.defaultProjection;


/**
 * @typedef {{altitudeMode: (ol.format.IGCZ|undefined)}}
 * @todo api
 */
olx.format.IGCOptions;


/**
 * Altitude mode. Possible values are `barometric`, `gps`, and `none`. Default
 * is `none`.
 * @type {ol.format.IGCZ|undefined}
 */
olx.format.IGCOptions.prototype.altitudeMode;


/**
 * @typedef {{defaultStyle: (Array.<ol.style.Style>|undefined)}}
 * @todo api
 */
olx.format.KMLOptions;


/**
 * Default style. The default default style is the same as Google Earth.
 * @type {Array.<ol.style.Style>|undefined}
 */
olx.format.KMLOptions.prototype.defaultStyle;


/**
 * @typedef {{featureNS: string,
 *     featureType: string,
 *     srsName: string,
 *     surface: (boolean|undefined),
 *     curve: (boolean|undefined),
 *     multiCurve: (boolean|undefined),
 *     multiSurface: (boolean|undefined),
 *     schemaLocation: (string|undefined)}}
 * @todo api
 */
olx.format.GMLOptions;


/**
 * Feature namespace.
 * @type {string}
 */
olx.format.GMLOptions.prototype.featureNS;


/**
 * Feature type to parse.
 * @type {string}
 */
olx.format.GMLOptions.prototype.featureType;


/**
 * srsName to use when writing geometries.
 * @type {string}
 */
olx.format.GMLOptions.prototype.srsName;


/**
 * Write gml:Surface instead of gml:Polygon elements. This also affects the
 * elements in multi-part geometries. Default is `false´.
 * @type {boolean|undefined}
 */
olx.format.GMLOptions.prototype.surface;


/**
 * Write gml:Curve instead of gml:LineString elements. This also affects the
 * elements in multi-part geometries. Default is `false´.
 * @type {boolean|undefined}
 */
olx.format.GMLOptions.prototype.curve;


/**
 * Write gml:MultiCurve instead of gml:MultiLineString. Since the latter is
 * deprecated in GML 3, the default is `true´.
 * @type {boolean|undefined}
 */
olx.format.GMLOptions.prototype.multiCurve;


/**
 * Write gml:multiSurface instead of gml:MultiPolygon. Since the latter is
 * deprecated in GML 3, the default is `true´.
 * @type {boolean|undefined}
 */
olx.format.GMLOptions.prototype.multiSurface;


/**
 * Optional schemaLocation to use when writing out the GML, this will override
 * the default provided.
 * @type {string|undefined}
 */
olx.format.GMLOptions.prototype.schemaLocation;


/**
 * @typedef {{featureNS: string,
 *     featureType: string,
 *     schemaLocation: (string|undefined)}}
 * @todo api
 */
olx.format.WFSOptions;


/**
 * The namespace URI used for features.
 * @type {string}
 */
olx.format.WFSOptions.prototype.featureNS;


/**
 * The feature type to parse. Only used for read operations.
 * @type {string}
 */
olx.format.WFSOptions.prototype.featureType;


/**
 * Optional schemaLocation to use for serialization, this will override the
 * default.
 * @type {string|undefined}
 */
olx.format.WFSOptions.prototype.schemaLocation;


/**
 * @typedef {{featureNS: string,
 *     featurePrefix: string,
 *     featureTypes: Array.<string>,
 *     srsName: (string|undefined),
 *     handle: (string|undefined),
 *     outputFormat: (string|undefined),
 *     maxFeatures: (number|undefined),
 *     geometryName: (string|undefined),
 *     bbox: (ol.Extent|undefined)}}
 * @todo api
 */
olx.format.WFSWriteGetFeatureOptions;


/**
 * The namespace URI used for features.
 * @type {string}
 */
olx.format.WFSWriteGetFeatureOptions.prototype.featureNS;


/**
 * The prefix for the feature namespace.
 * @type {string}
 */
olx.format.WFSWriteGetFeatureOptions.prototype.featurePrefix;


/**
 * The feature type names.
 * @type {Array.<string>}
 */
olx.format.WFSWriteGetFeatureOptions.prototype.featureTypes;


/**
 * SRS name. No srsName attribute will be set on geometries when this is not
 * provided.
 * @type {string|undefined}
 */
olx.format.WFSWriteGetFeatureOptions.prototype.srsName;


/**
 * Handle.
 * @type {string|undefined}
 */
olx.format.WFSWriteGetFeatureOptions.prototype.handle;


/**
 * Output format.
 * @type {string|undefined}
 */
olx.format.WFSWriteGetFeatureOptions.prototype.outputFormat;


/**
 * Maximum number of features to fetch.
 * @type {number|undefined}
 */
olx.format.WFSWriteGetFeatureOptions.prototype.maxFeatures;


/**
 * Geometry name to use in a BBOX filter.
 * @type {string|undefined}
 */
olx.format.WFSWriteGetFeatureOptions.prototype.geometryName;


/**
 * Extent to use for the BBOX filter.
 * @type {ol.Extent|undefined}
 */
olx.format.WFSWriteGetFeatureOptions.prototype.bbox;


/**
 * @typedef {{featureNS: string,
 *     featurePrefix: string,
 *     featureType: string,
 *     srsName: (string|undefined),
 *     handle: (string|undefined),
 *     nativeElements: Array.<Object>}}
 * @todo api
 */
olx.format.WFSWriteTransactionOptions;


/**
 * The namespace URI used for features.
 * @type {string}
 */
olx.format.WFSWriteTransactionOptions.prototype.featureNS;


/**
 * The prefix for the feature namespace.
 * @type {string}
 */
olx.format.WFSWriteTransactionOptions.prototype.featurePrefix;


/**
 * The feature type name.
 * @type {string}
 */
olx.format.WFSWriteTransactionOptions.prototype.featureType;


/**
 * SRS name. No srsName attribute will be set on geometries when this is not
 * provided.
 * @type {string|undefined}
 */
olx.format.WFSWriteTransactionOptions.prototype.srsName;


/**
 * Handle.
 * @type {string|undefined}
 */
olx.format.WFSWriteTransactionOptions.prototype.handle;


/**
 * Native elements. Currently not supported.
 * @type {Array.<Object>}
 */
olx.format.WFSWriteTransactionOptions.prototype.nativeElements;


/**
 * Interactions for the map. Default is `true` for all options.
 * @typedef {{altShiftDragRotate: (boolean|undefined),
 *     doubleClickZoom: (boolean|undefined),
 *     keyboard: (boolean|undefined),
 *     mouseWheelZoom: (boolean|undefined),
 *     shiftDragZoom: (boolean|undefined),
 *     dragPan: (boolean|undefined),
 *     pinchRotate: (boolean|undefined),
 *     pinchZoom: (boolean|undefined),
 *     zoomDelta: (number|undefined),
 *     zoomDuration: (number|undefined)}}
 * @todo api
 */
olx.interaction.DefaultsOptions;


/**
 * Whether Alt-Shift-drag rotate is desired. Default is `true`.
 * @type {boolean|undefined}
 */
olx.interaction.DefaultsOptions.prototype.altShiftDragRotate;


/**
 * Whether double click zoom is desired. Default is `true`.
 * @type {boolean|undefined}
 */
olx.interaction.DefaultsOptions.prototype.doubleClickZoom;


/**
 * Whether keyboard interaction is desired. Default is `true`.
 * @type {boolean|undefined}
 */
olx.interaction.DefaultsOptions.prototype.keyboard;


/**
 * Whether mousewheel zoom is desired. Default is `true`.
 * @type {boolean|undefined}
 */
olx.interaction.DefaultsOptions.prototype.mouseWheelZoom;


/**
 * Whether Shift-drag zoom is desired. Default is `true`.
 * @type {boolean|undefined}
 */
olx.interaction.DefaultsOptions.prototype.shiftDragZoom;


/**
 * Whether drag pan is desired. Default is `true`.
 * @type {boolean|undefined}
 */
olx.interaction.DefaultsOptions.prototype.dragPan;


/**
 * Whether pinch rotate is desired. Default is `true`.
 * @type {boolean|undefined}
 */
olx.interaction.DefaultsOptions.prototype.pinchRotate;


/**
 * Whether pinch zoom is desired. Default is `true`.
 * @type {boolean|undefined}
 */
olx.interaction.DefaultsOptions.prototype.pinchZoom;


/**
 * Zoom delta.
 * @type {number|undefined}
 */
olx.interaction.DefaultsOptions.prototype.zoomDelta;


/**
 * Zoom duration.
 * @type {number|undefined}
 */
olx.interaction.DefaultsOptions.prototype.zoomDuration;


/**
 * @typedef {{duration: (number|undefined),
 *     delta: (number|undefined)}}
 * @todo api
 */
olx.interaction.DoubleClickZoomOptions;


/**
 * Animation duration in milliseconds. Default is `250`.
 * @type {number|undefined}
 */
olx.interaction.DoubleClickZoomOptions.prototype.duration;


/**
 * The zoom delta applied on each double click, default is `1`.
 * @type {number|undefined}
 */
olx.interaction.DoubleClickZoomOptions.prototype.delta;


/**
 * @typedef {{formatConstructors: (Array.<function(new: ol.format.Feature)>|undefined),
 *     reprojectTo: ol.proj.ProjectionLike}}
 * @todo api
 */
olx.interaction.DragAndDropOptions;


/**
 * Format constructors.
 * @type {Array.<function(new: ol.format.Feature)>|undefined}
 */
olx.interaction.DragAndDropOptions.prototype.formatConstructors;


/**
 * Target projection. By default, the map's view's projection is used.
 * @type {ol.proj.ProjectionLike}
 */
olx.interaction.DragAndDropOptions.prototype.reprojectTo;


/**
 * @typedef {{condition: (ol.events.ConditionType|undefined),
 *     style: ol.style.Style}}
 * @todo api
 */
olx.interaction.DragBoxOptions;


/**
 * A conditional modifier (i.e. Shift key) that determines if the interaction is
 * active or not, default is always.
 * @type {ol.events.ConditionType|undefined}
 */
olx.interaction.DragBoxOptions.prototype.condition;


/**
 * Style for the box.
 * @type {ol.style.Style}
 */
olx.interaction.DragBoxOptions.prototype.style;


/**
 * @typedef {{kinetic: (ol.Kinetic|undefined)}}
 * @todo api
 */
olx.interaction.DragPanOptions;


/**
 * Kinetic inertia to apply to the pan.
 * @type {ol.Kinetic|undefined}
 */
olx.interaction.DragPanOptions.prototype.kinetic;


/**
 * @typedef {{condition: (ol.events.ConditionType|undefined)}}
 * @todo api
 */
olx.interaction.DragRotateAndZoomOptions;


/**
 * A conditional modifier (i.e. Shift key) that determines if the interaction is
 * active or not, default is shify key.
 * @type {ol.events.ConditionType|undefined}
 */
olx.interaction.DragRotateAndZoomOptions.prototype.condition;


/**
 * @typedef {{condition: (ol.events.ConditionType|undefined)}}
 * @todo api
 */
olx.interaction.DragRotateOptions;


/**
 * A conditional modifier (i.e. Shift key) that determines if the interaction is
 * active or not, default is both shift and alt keys.
 * @type {ol.events.ConditionType|undefined}
 */
olx.interaction.DragRotateOptions.prototype.condition;


/**
 * @typedef {{condition: (ol.events.ConditionType|undefined),
 *     style: ol.style.Style}}
 * @todo api
 */
olx.interaction.DragZoomOptions;


/**
 * A conditional modifier (i.e. Shift key) that determines if the interaction is
 * active or not, default is shift key.
 * @type {ol.events.ConditionType|undefined}
 */
olx.interaction.DragZoomOptions.prototype.condition;


/**
 * Style for the box.
 * @type {ol.style.Style}
 */
olx.interaction.DragZoomOptions.prototype.style;


/**
 * @typedef {{features: (ol.Collection|undefined),
 *     source: (ol.source.Vector|undefined),
 *     snapTolerance: (number|undefined),
 *     type: ol.geom.GeometryType,
 *     minPointsPerRing: (number|undefined),
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction|undefined)}}
 * @todo api
 */
olx.interaction.DrawOptions;


/**
 * Destination collection for the drawn features.
 * @type {ol.Collection|undefined}
 */
olx.interaction.DrawOptions.prototype.features;


/**
 * Destination source for the drawn features.
 * @type {ol.source.Vector|undefined}
 */
olx.interaction.DrawOptions.prototype.source;


/**
 * Pixel distance for snapping to the drawing finish (default is 12).
 * @type {number|undefined}
 */
olx.interaction.DrawOptions.prototype.snapTolerance;


/**
 * Drawing type ('Point', 'LineString', 'Polygon', 'MultiPoint',
 * 'MultiLineString', or 'MultiPolygon').
 * @type {ol.geom.GeometryType}
 */
olx.interaction.DrawOptions.prototype.type;


/**
 * The number of points that must be drawn before a polygon ring can be finished
 * (default is 3).
 * @type {number|undefined}
 */
olx.interaction.DrawOptions.prototype.minPointsPerRing;


/**
 * Style for sketch features.
 * @type {ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction|undefined}
 */
olx.interaction.DrawOptions.prototype.style;


/**
 * @typedef {{condition: (ol.events.ConditionType|undefined),
 *     pixelDelta: (number|undefined)}}
 * @todo api
 */
olx.interaction.KeyboardPanOptions;


/**
 * A conditional modifier (i.e. Shift key) that determines if the interaction is
 * active or not, default is no modifiers.
 * @type {ol.events.ConditionType|undefined}
 */
olx.interaction.KeyboardPanOptions.prototype.condition;


/**
 * Pixel The amount to pan on each key press. Default is `128` pixels.
 * @type {number|undefined}
 */
olx.interaction.KeyboardPanOptions.prototype.pixelDelta;


/**
 * @typedef {{duration: (number|undefined),
 *     condition: (ol.events.ConditionType|undefined),
 *     delta: (number|undefined)}}
 * @todo api
 */
olx.interaction.KeyboardZoomOptions;


/**
 * Animation duration in milliseconds. Default is `100`.
 * @type {number|undefined}
 */
olx.interaction.KeyboardZoomOptions.prototype.duration;


/**
 * A conditional modifier (i.e. Shift key) that determines if the interaction is
 * active or not, default is no modifiers.
 * @type {ol.events.ConditionType|undefined}
 */
olx.interaction.KeyboardZoomOptions.prototype.condition;


/**
 * The amount to zoom on each key press. Default is `1`.
 * @type {number|undefined}
 */
olx.interaction.KeyboardZoomOptions.prototype.delta;


/**
 * @typedef {{deleteCondition: (ol.events.ConditionType|undefined),
 *     pixelTolerance: (number|undefined),
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction|undefined),
 *     features: ol.Collection}}
 * @todo api
 */
olx.interaction.ModifyOptions;


/**
 * Condition that determines which event results in a vertex deletion. Default
 * is a `singleclick` event with no modifier keys.
 * @type {ol.events.ConditionType|undefined}
 */
olx.interaction.ModifyOptions.prototype.deleteCondition;


/**
 * Pixel tolerance for considering the pointer close enough to a segment or
 * vertex for editing. Default is 10 pixels.
 * @type {number|undefined}
 */
olx.interaction.ModifyOptions.prototype.pixelTolerance;


/**
 * FeatureOverlay style.
 * @type {ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction|undefined}
 */
olx.interaction.ModifyOptions.prototype.style;


/**
 * The features the interaction works on.
 * @type {ol.Collection}
 */
olx.interaction.ModifyOptions.prototype.features;


/**
 * @typedef {{duration: (number|undefined)}}
 * @todo api
 */
olx.interaction.MouseWheelZoomOptions;


/**
 * Animation duration in milliseconds. Default is `250`.
 * @type {number|undefined}
 */
olx.interaction.MouseWheelZoomOptions.prototype.duration;


/**
 * @typedef {{threshold: (number|undefined)}}
 * @todo api
 */
olx.interaction.PinchRotateOptions;


/**
 * Minimal angle in radians to start a rotation. Default is `0.3`.
 * @type {number|undefined}
 */
olx.interaction.PinchRotateOptions.prototype.threshold;


/**
 * @typedef {{duration: (number|undefined)}}
 * @todo api
 */
olx.interaction.PinchZoomOptions;


/**
 * Animation duration in milliseconds. Default is `400`.
 * @type {number|undefined}
 */
olx.interaction.PinchZoomOptions.prototype.duration;


/**
 * @typedef {{addCondition: (ol.events.ConditionType|undefined),
 *     condition: (ol.events.ConditionType|undefined),
 *     layers: (Array.<ol.layer.Layer>|function(ol.layer.Layer): boolean|undefined),
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction|undefined),
 *     removeCondition: (ol.events.ConditionType|undefined),
 *     toggleCondition: (ol.events.ConditionType|undefined)}}
 * @todo api
 */
olx.interaction.SelectOptions;


/**
 * A conditional modifier (e.g. alt key) that determines if the feature is added
 * to the current selection. By default, this is never. Note that the default
 * toggle condition allows features to be added.
 * @type {ol.events.ConditionType|undefined}
 */
olx.interaction.SelectOptions.prototype.addCondition;


/**
 * A conditional modifier (e.g. shift key) that determines if the interaction is
 * active (i.e. selection occurs) or not. By default, a click with no modifier
 * keys toggles the selection.
 * @type {ol.events.ConditionType|undefined}
 */
olx.interaction.SelectOptions.prototype.condition;


/**
 * A list of layers from which features should be
 * selected. Alternatively, a filter function can be provided. The
 * function will be called for each layer in the map and should return
 * `true` for layers that you want to be selectable. If the option is
 * absent, all visible layers will be considered selectable.
 * @type {Array.<ol.layer.Layer>|function(ol.layer.Layer): boolean|undefined}
 */
olx.interaction.SelectOptions.prototype.layers;


/**
 * FeatureOverlay style.
 * @type {ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction|undefined}
 */
olx.interaction.SelectOptions.prototype.style;


/**
 * A conditional modifier (e.g. alt key) that determines if the feature is
 * removed from the current selection. By default, this is never.
 * @type {ol.events.ConditionType|undefined}
 */
olx.interaction.SelectOptions.prototype.removeCondition;


/**
 * A conditional modifier (e.g. shift key) that determines if the selection is
 * toggled in the current selection. By default, a shift-click toggles the
 * feature in the current selection.
 * @type {ol.events.ConditionType|undefined}
 */
olx.interaction.SelectOptions.prototype.toggleCondition;


/**
 * @typedef {{brightness: (number|undefined),
 *     contrast: (number|undefined),
 *     hue: (number|undefined),
 *     opacity: (number|undefined),
 *     saturation: (number|undefined),
 *     visible: (boolean|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined)}}
 * @todo api
 */
olx.layer.BaseOptions;


/**
 * Brightness. Default is `0`.
 * @type {number|undefined}
 */
olx.layer.BaseOptions.prototype.brightness;


/**
 * Contrast. Default is `1`.
 * @type {number|undefined}
 */
olx.layer.BaseOptions.prototype.contrast;


/**
 * Hue. Default is `0`.
 * @type {number|undefined}
 */
olx.layer.BaseOptions.prototype.hue;


/**
 * Opacity (0, 1). Default is `1`.
 * @type {number|undefined}
 */
olx.layer.BaseOptions.prototype.opacity;


/**
 * Saturation. Default is `1`.
 * @type {number|undefined}
 */
olx.layer.BaseOptions.prototype.saturation;


/**
 * Visibility. Default is `true`.
 * @type {boolean|undefined}
 */
olx.layer.BaseOptions.prototype.visible;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 */
olx.layer.BaseOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 */
olx.layer.BaseOptions.prototype.maxResolution;


/**
 * @typedef {{brightness: (number|undefined),
 *     contrast: (number|undefined),
 *     hue: (number|undefined),
 *     opacity: (number|undefined),
 *     saturation: (number|undefined),
 *     source: ol.source.Source,
 *     visible: (boolean|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined)}}
 * @todo api
 */
olx.layer.LayerOptions;


/**
 * Brightness. Default is `0`.
 * @type {number|undefined}
 */
olx.layer.LayerOptions.prototype.brightness;


/**
 * Contrast. Default is `1`.
 * @type {number|undefined}
 */
olx.layer.LayerOptions.prototype.contrast;


/**
 * Hue. Default is `0`.
 * @type {number|undefined}
 */
olx.layer.LayerOptions.prototype.hue;


/**
 * Opacity (0, 1). Default is `1`.
 * @type {number|undefined}
 */
olx.layer.LayerOptions.prototype.opacity;


/**
 * Saturation. Default is `1`.
 * @type {number|undefined}
 */
olx.layer.LayerOptions.prototype.saturation;


/**
 * Source for this layer.
 * @type {ol.source.Source}
 */
olx.layer.LayerOptions.prototype.source;


/**
 * Visibility. Default is `true` (visible).
 * @type {boolean|undefined}
 */
olx.layer.LayerOptions.prototype.visible;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 */
olx.layer.LayerOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 */
olx.layer.LayerOptions.prototype.maxResolution;


/**
 * @typedef {{brightness: (number|undefined),
 *     contrast: (number|undefined),
 *     hue: (number|undefined),
 *     opacity: (number|undefined),
 *     saturation: (number|undefined),
 *     visible: (boolean|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     layers: (Array.<ol.layer.Base>|ol.Collection|undefined)}}
 * @todo api
 */
olx.layer.GroupOptions;


/**
 * Brightness. Default is `0`.
 * @type {number|undefined}
 */
olx.layer.GroupOptions.prototype.brightness;


/**
 * Contrast. Default is `1`.
 * @type {number|undefined}
 */
olx.layer.GroupOptions.prototype.contrast;


/**
 * Hue. Default is `0`.
 * @type {number|undefined}
 */
olx.layer.GroupOptions.prototype.hue;


/**
 * Opacity (0, 1). Default is `1`.
 * @type {number|undefined}
 */
olx.layer.GroupOptions.prototype.opacity;


/**
 * Saturation. Default is `1`.
 * @type {number|undefined}
 */
olx.layer.GroupOptions.prototype.saturation;


/**
 * Visibility. Default is `true`.
 * @type {boolean|undefined}
 */
olx.layer.GroupOptions.prototype.visible;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 */
olx.layer.GroupOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 */
olx.layer.GroupOptions.prototype.maxResolution;


/**
 * Child layers.
 * @type {Array.<ol.layer.Base>|ol.Collection|undefined}
 */
olx.layer.GroupOptions.prototype.layers;


/**
 * @typedef {{brightness: (number|undefined),
 *     contrast: (number|undefined),
 *     hue: (number|undefined),
 *     gradient: (Array.<string>|undefined),
 *     radius: (number|undefined),
 *     blur: (number|undefined),
 *     shadow: (number|undefined),
 *     weight: (string|function(ol.Feature):number|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     opacity: (number|undefined),
 *     saturation: (number|undefined),
 *     source: ol.source.Vector,
 *     visible: (boolean|undefined)}}
 * @todo api
 */
olx.layer.HeatmapOptions;


/**
 * Brightness.
 * @type {number|undefined}
 */
olx.layer.HeatmapOptions.prototype.brightness;


/**
 * Contrast.
 * @type {number|undefined}
 */
olx.layer.HeatmapOptions.prototype.contrast;


/**
 * Hue.
 * @type {number|undefined}
 */
olx.layer.HeatmapOptions.prototype.hue;


/**
 * The color gradient of the heatmap, specified as an array of CSS color
 * strings. Default is `['#00f', '#0ff', '#0f0', '#ff0', '#f00']`.
 * @type {Array.<string>|undefined}
 */
olx.layer.HeatmapOptions.prototype.gradient;


/**
 * Radius size in pixels. Default is `8`.
 * @type {number|undefined}
 */
olx.layer.HeatmapOptions.prototype.radius;


/**
 * Blur size in pixels. Default is `15`.
 * @type {number|undefined}
 */
olx.layer.HeatmapOptions.prototype.blur;


/**
 * Shadow size in pixels. Default is `250`.
 * @type {number|undefined}
 */
olx.layer.HeatmapOptions.prototype.shadow;


/**
 * The feature attribute to use for the weight or a function that returns a
 * weight from a feature. Weight values should range from 0 to 1 (and values
 * outside will be clamped to that range). Default is `weight`.
 * @type {string|function(ol.Feature):number|undefined}
 */
olx.layer.HeatmapOptions.prototype.weight;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 */
olx.layer.HeatmapOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 */
olx.layer.HeatmapOptions.prototype.maxResolution;


/**
 * Opacity. 0-1. Default is `1`.
 * @type {number|undefined}
 */
olx.layer.HeatmapOptions.prototype.opacity;


/**
 * Saturation.
 * @type {number|undefined}
 */
olx.layer.HeatmapOptions.prototype.saturation;


/**
 * Source.
 * @type {ol.source.Vector}
 */
olx.layer.HeatmapOptions.prototype.source;


/**
 * Visibility. Default is `true` (visible).
 * @type {boolean|undefined}
 */
olx.layer.HeatmapOptions.prototype.visible;


/**
 * @typedef {{brightness: (number|undefined),
 *     contrast: (number|undefined),
 *     hue: (number|undefined),
 *     opacity: (number|undefined),
 *     preload: (number|undefined),
 *     saturation: (number|undefined),
 *     source: ol.source.Source,
 *     visible: (boolean|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     useInterimTilesOnError: (boolean|undefined)}}
 * @todo api
 */
olx.layer.TileOptions;


/**
 * Brightness. Default is `0`.
 * @type {number|undefined}
 */
olx.layer.TileOptions.prototype.brightness;


/**
 * Contrast. Default is `1`.
 * @type {number|undefined}
 */
olx.layer.TileOptions.prototype.contrast;


/**
 * Hue. Default is `0`.
 * @type {number|undefined}
 */
olx.layer.TileOptions.prototype.hue;


/**
 * Opacity (0, 1). Default is `1`.
 * @type {number|undefined}
 */
olx.layer.TileOptions.prototype.opacity;


/**
 * Preload.
 * @type {number|undefined}
 */
olx.layer.TileOptions.prototype.preload;


/**
 * Saturation. Default is `1`.
 * @type {number|undefined}
 */
olx.layer.TileOptions.prototype.saturation;


/**
 * Source for this layer.
 * @type {ol.source.Source}
 */
olx.layer.TileOptions.prototype.source;


/**
 * Visibility. Default is `true` (visible).
 * @type {boolean|undefined}
 */
olx.layer.TileOptions.prototype.visible;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 */
olx.layer.TileOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 */
olx.layer.TileOptions.prototype.maxResolution;


/**
 * Use interim tiles on error. Default is `true`.
 * @type {boolean|undefined}
 */
olx.layer.TileOptions.prototype.useInterimTilesOnError;


/**
 * @typedef {{brightness: (number|undefined),
 *     contrast: (number|undefined),
 *     renderOrder: (function(ol.Feature, ol.Feature):number|null|undefined),
 *     hue: (number|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     opacity: (number|undefined),
 *     saturation: (number|undefined),
 *     source: ol.source.Vector,
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction|undefined),
 *     visible: (boolean|undefined)}}
 * @todo api
 */
olx.layer.VectorOptions;


/**
 * Brightness.
 * @type {number|undefined}
 */
olx.layer.VectorOptions.prototype.brightness;


/**
 * Contrast.
 * @type {number|undefined}
 */
olx.layer.VectorOptions.prototype.contrast;


/**
 * Render order. Function to be used when sorting features before rendering. By
 * default features are drawn in the order that they are created. Use `null` to
 * avoid the sort, but get an undefined draw order.
 * @type {function(ol.Feature, ol.Feature):number|null|undefined}
 */
olx.layer.VectorOptions.prototype.renderOrder;


/**
 * Hue.
 * @type {number|undefined}
 */
olx.layer.VectorOptions.prototype.hue;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 */
olx.layer.VectorOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 */
olx.layer.VectorOptions.prototype.maxResolution;


/**
 * Opacity. 0-1. Default is `1`.
 * @type {number|undefined}
 */
olx.layer.VectorOptions.prototype.opacity;


/**
 * Saturation.
 * @type {number|undefined}
 */
olx.layer.VectorOptions.prototype.saturation;


/**
 * Source.
 * @type {ol.source.Vector}
 */
olx.layer.VectorOptions.prototype.source;


/**
 * Layer style.
 * @type {ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction|undefined}
 */
olx.layer.VectorOptions.prototype.style;


/**
 * Visibility. Default is `true` (visible).
 * @type {boolean|undefined}
 */
olx.layer.VectorOptions.prototype.visible;


/**
 * @typedef {{features: (Array.<ol.Feature>|ol.Collection|undefined),
 *     map: (ol.Map|undefined),
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction|undefined)}}
 * @todo api
 */
olx.FeatureOverlayOptions;


/**
 * Features.
 * @type {Array.<ol.Feature>|ol.Collection|undefined}
 */
olx.FeatureOverlayOptions.prototype.features;


/**
 * Map.
 * @type {ol.Map|undefined}
 */
olx.FeatureOverlayOptions.prototype.map;


/**
 * Feature style.
 * @type {ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction|undefined}
 */
olx.FeatureOverlayOptions.prototype.style;


/**
 * @typedef {{culture: (string|undefined),
 *     key: string,
 *     imagerySet: string,
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined)}}
 * @todo api
 */
olx.source.BingMapsOptions;


/**
 * Culture code. Default is `en-us`.
 * @type {string|undefined}
 */
olx.source.BingMapsOptions.prototype.culture;


/**
 * Bing Maps API key. Get yours at http://bingmapsportal.com/.
 * @type {string}
 */
olx.source.BingMapsOptions.prototype.key;


/**
 * Type of imagery.
 * @type {string}
 */
olx.source.BingMapsOptions.prototype.imagerySet;


/**
 * Optional function to load a tile given a URL.
 * @type {ol.TileLoadFunctionType|undefined}
 */
olx.source.BingMapsOptions.prototype.tileLoadFunction;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     extent: (ol.Extent|undefined),
 *     format: ol.format.Feature,
 *     logo: (string|undefined),
 *     projection: ol.proj.ProjectionLike}}
 * @todo api
 */
olx.source.FormatVectorOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.FormatVectorOptions.prototype.attributions;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.FormatVectorOptions.prototype.extent;


/**
 * Format.
 * @type {ol.format.Feature}
 */
olx.source.FormatVectorOptions.prototype.format;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.FormatVectorOptions.prototype.logo;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.FormatVectorOptions.prototype.projection;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     defaultProjection: ol.proj.ProjectionLike,
 *     extent: (ol.Extent|undefined),
 *     logo: (string|undefined),
 *     object: (GeoJSONObject|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     text: (string|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined)}}
 * @todo api
 */
olx.source.GeoJSONOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.GeoJSONOptions.prototype.attributions;


/**
 * Default projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.GeoJSONOptions.prototype.defaultProjection;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.GeoJSONOptions.prototype.extent;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.GeoJSONOptions.prototype.logo;


/**
 * Object.
 * @type {GeoJSONObject|undefined}
 */
olx.source.GeoJSONOptions.prototype.object;


/**
 * Destination projection. If provided, features will be transformed to this
 * projection. If not provided, features will not be transformed.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.GeoJSONOptions.prototype.projection;


/**
 * Text.
 * @type {string|undefined}
 */
olx.source.GeoJSONOptions.prototype.text;


/**
 * URL.
 * @type {string|undefined}
 */
olx.source.GeoJSONOptions.prototype.url;


/**
 * URLs.
 * @type {Array.<string>|undefined}
 */
olx.source.GeoJSONOptions.prototype.urls;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     doc: (Document|undefined),
 *     extent: (ol.Extent|undefined),
 *     logo: (string|undefined),
 *     node: (Node|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     text: (string|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined)}}
 * @todo api
 */
olx.source.GPXOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.GPXOptions.prototype.attributions;


/**
 * Document.
 * @type {Document|undefined}
 */
olx.source.GPXOptions.prototype.doc;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.GPXOptions.prototype.extent;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.GPXOptions.prototype.logo;


/**
 * Node.
 * @type {Node|undefined}
 */
olx.source.GPXOptions.prototype.node;


/**
 * Destination projection. If provided, features will be transformed to this
 * projection. If not provided, features will not be transformed.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.GPXOptions.prototype.projection;


/**
 * Text.
 * @type {string|undefined}
 */
olx.source.GPXOptions.prototype.text;


/**
 * URL.
 * @type {string|undefined}
 */
olx.source.GPXOptions.prototype.url;


/**
 * URLs.
 * @type {Array.<string>|undefined}
 */
olx.source.GPXOptions.prototype.urls;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            crossOrigin: (null|string|undefined),
 *            extent: (ol.Extent|undefined),
 *            logo: (string|undefined),
 *            opaque: (boolean|undefined),
 *            projection: ol.proj.ProjectionLike,
 *            tileClass: (function(new: ol.ImageTile, ol.TileCoord,
 *                                 ol.TileState, string, ?string,
 *                                 ol.TileLoadFunctionType)|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *            tileUrlFunction: (ol.TileUrlFunctionType|undefined)}}
 * @todo api
 */
olx.source.TileImageOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.TileImageOptions.prototype.attributions;


/**
 * crossOrigin setting for image requests. Default is `null`.
 * @type {null|string|undefined}
 */
olx.source.TileImageOptions.prototype.crossOrigin;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.TileImageOptions.prototype.extent;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.TileImageOptions.prototype.logo;


/**
 * Whether the layer is opaque.
 * @type {boolean|undefined}
 */
olx.source.TileImageOptions.prototype.opaque;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.TileImageOptions.prototype.projection;


/**
 * tile class
 * @type {function(new: ol.ImageTile, ol.TileCoord,
 *                 ol.TileState, string, ?string,
 *                 ol.TileLoadFunctionType)|undefined}
 */
olx.source.TileImageOptions.prototype.tileClass;


/**
 * Tile grid.
 * @type {ol.tilegrid.TileGrid|undefined}
 */
olx.source.TileImageOptions.prototype.tileGrid;


/**
 * Optional function to load a tile given a URL.
 * @type {ol.TileLoadFunctionType|undefined}
 */
olx.source.TileImageOptions.prototype.tileLoadFunction;


/**
 * Optional function to get tile URL given a tile coordinate and the projection.
 * @type {ol.TileUrlFunctionType|undefined}
 */
olx.source.TileImageOptions.prototype.tileUrlFunction;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     defaultProjection: ol.proj.ProjectionLike,
 *     extent: (ol.Extent|undefined),
 *     logo: (string|undefined),
 *     object: (GeoJSONObject|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     tileGrid: ol.tilegrid.TileGrid,
 *     tileUrlFunction: (ol.TileUrlFunctionType|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined)}}
 * @todo api
 */
olx.source.TileVectorOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.TileVectorOptions.prototype.attributions;


/**
 * Default projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.TileVectorOptions.prototype.defaultProjection;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.TileVectorOptions.prototype.extent;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.TileVectorOptions.prototype.logo;


/**
 * Object.
 * @type {GeoJSONObject|undefined}
 */
olx.source.TileVectorOptions.prototype.object;


/**
 * Destination projection. If provided, features will be transformed to this
 * projection. If not provided, features will not be transformed.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.TileVectorOptions.prototype.projection;


/**
 * Tile grid.
 * @type {ol.tilegrid.TileGrid}
 */
olx.source.TileVectorOptions.prototype.tileGrid;


/**
 * Optional function to get tile URL given a tile coordinate and the projection.
 * Required if url or urls are not provided.
 * @type {ol.TileUrlFunctionType|undefined}
 */
olx.source.TileVectorOptions.prototype.tileUrlFunction;


/**
 * URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * @type {string|undefined}
 */
olx.source.TileVectorOptions.prototype.url;


/**
 * An array of URL templates.
 * @type {Array.<string>|undefined}
 */
olx.source.TileVectorOptions.prototype.urls;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     defaultProjection: ol.proj.ProjectionLike,
 *     extent: (ol.Extent|undefined),
 *     logo: (string|undefined),
 *     object: (GeoJSONObject|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     text: (string|undefined),
 *     url: (string|undefined)}}
 * @todo api
 */
olx.source.TopoJSONOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.TopoJSONOptions.prototype.attributions;


/**
 * Default projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.TopoJSONOptions.prototype.defaultProjection;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.TopoJSONOptions.prototype.extent;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.TopoJSONOptions.prototype.logo;


/**
 * Object.
 * @type {GeoJSONObject|undefined}
 */
olx.source.TopoJSONOptions.prototype.object;


/**
 * Destination projection. If provided, features will be transformed to this
 * projection. If not provided, features will not be transformed.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.TopoJSONOptions.prototype.projection;


/**
 * Text.
 * @type {string|undefined}
 */
olx.source.TopoJSONOptions.prototype.text;


/**
 * URL.
 * @type {string|undefined}
 */
olx.source.TopoJSONOptions.prototype.url;


/**
 * @typedef {{altitudeMode: (ol.format.IGCZ|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     text: (string|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined)}}
 * @todo api
 */
olx.source.IGCOptions;


/**
 * Altitude mode. Possible values are `barometric`, `gps`, and `none`. Default
 * is `none`.
 * @type {ol.format.IGCZ|undefined}
 */
olx.source.IGCOptions.prototype.altitudeMode;


/**
 * Destination projection. If provided, features will be transformed to this
 * projection. If not provided, features will not be transformed.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.IGCOptions.prototype.projection;


/**
 * Text.
 * @type {string|undefined}
 */
olx.source.IGCOptions.prototype.text;


/**
 * URL.
 * @type {string|undefined}
 */
olx.source.IGCOptions.prototype.url;


/**
 * URLs.
 * @type {Array.<string>|undefined}
 */
olx.source.IGCOptions.prototype.urls;


/**
 * @typedef {{url: (string|undefined),
 *     displayDpi: (number|undefined),
 *     metersPerUnit: (number|undefined),
 *     extent: (ol.Extent|undefined),
 *     hidpi: (boolean|undefined),
 *     useOverlay: (boolean|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     ratio: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     params: (Object|undefined)}}
 * @todo api
 */
olx.source.MapGuideOptions;


/**
 * The mapagent url.
 * @type {string|undefined}
 */
olx.source.MapGuideOptions.prototype.url;


/**
 * The display resolution. Default is `96`.
 * @type {number|undefined}
 */
olx.source.MapGuideOptions.prototype.displayDpi;


/**
 * The meters-per-unit value. Default is `1`.
 * @type {number|undefined}
 */
olx.source.MapGuideOptions.prototype.metersPerUnit;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.MapGuideOptions.prototype.extent;


/**
 * Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * @type {boolean|undefined}
 */
olx.source.MapGuideOptions.prototype.hidpi;


/**
 * If `true`, will use `GETDYNAMICMAPOVERLAYIMAGE`.
 * @type {boolean|undefined}
 */
olx.source.MapGuideOptions.prototype.useOverlay;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.MapGuideOptions.prototype.projection;


/**
 * Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the size of the map viewport, and so on. Default is `1`.
 * @type {number|undefined}
 */
olx.source.MapGuideOptions.prototype.ratio;


/**
 * Resolutions. If specified, requests will be made for these resolutions only.
 * @type {Array.<number>|undefined}
 */
olx.source.MapGuideOptions.prototype.resolutions;


/**
 * Additional parameters.
 * @type {Object|undefined}
 */
olx.source.MapGuideOptions.prototype.params;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     defaultStyle: (Array.<ol.style.Style>|undefined),
 *     doc: (Document|undefined),
 *     extent: (ol.Extent|undefined),
 *     logo: (string|undefined),
 *     node: (Node|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     text: (string|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined)}}
 * @todo api
 */
olx.source.KMLOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.KMLOptions.prototype.attributions;


/**
 * Default style.
 * @type {Array.<ol.style.Style>|undefined}
 */
olx.source.KMLOptions.prototype.defaultStyle;


/**
 * Document.
 * @type {Document|undefined}
 */
olx.source.KMLOptions.prototype.doc;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.KMLOptions.prototype.extent;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.KMLOptions.prototype.logo;


/**
 * Node.
 * @type {Node|undefined}
 */
olx.source.KMLOptions.prototype.node;


/**
 * Destination projection. If provided, features will be transformed to this
 * projection. If not provided, features will not be transformed.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.KMLOptions.prototype.projection;


/**
 * Text.
 * @type {string|undefined}
 */
olx.source.KMLOptions.prototype.text;


/**
 * URL.
 * @type {string|undefined}
 */
olx.source.KMLOptions.prototype.url;


/**
 * URLs.
 * @type {Array.<string>|undefined}
 */
olx.source.KMLOptions.prototype.urls;


/**
 * @typedef {{layer: string,
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined)}}
 * @todo api
 */
olx.source.MapQuestOptions;


/**
 * Layer. Possible values are `osm`, `sat`, and `hyb`.
 * @type {string}
 */
olx.source.MapQuestOptions.prototype.layer;


/**
 * Optional function to load a tile given a URL.
 * @type {ol.TileLoadFunctionType|undefined}
 */
olx.source.MapQuestOptions.prototype.tileLoadFunction;


/**
 * @typedef {{extent: (ol.Extent|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     tileGrid: (ol.tilegrid.TileGrid|undefined)}}
 * @todo api
 */
olx.source.TileDebugOptions;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.TileDebugOptions.prototype.extent;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.TileDebugOptions.prototype.projection;


/**
 * Tile grid.
 * @type {ol.tilegrid.TileGrid|undefined}
 */
olx.source.TileDebugOptions.prototype.tileGrid;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     crossOrigin: (null|string|undefined),
 *     maxZoom: (number|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: (string|undefined)}}
 * @todo api
 */
olx.source.OSMOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.OSMOptions.prototype.attributions;


/**
 * crossOrigin setting for image requests. Default is `anonymous`.
 * @type {null|string|undefined}
 */
olx.source.OSMOptions.prototype.crossOrigin;


/**
 * Max zoom.
 * @type {number|undefined}
 */
olx.source.OSMOptions.prototype.maxZoom;


/**
 * Optional function to load a tile given a URL.
 * @type {ol.TileLoadFunctionType|undefined}
 */
olx.source.OSMOptions.prototype.tileLoadFunction;


/**
 * URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * Default is `//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
 * @type {string|undefined}
 */
olx.source.OSMOptions.prototype.url;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     defaultStyle: (Array.<ol.style.Style>|undefined),
 *     doc: (Document|undefined),
 *     extent: (ol.Extent|undefined),
 *     logo: (string|undefined),
 *     node: (Node|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     reprojectTo: ol.proj.ProjectionLike,
 *     text: (string|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined)}}
 * @todo api
 */
olx.source.OSMXMLOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.OSMXMLOptions.prototype.attributions;


/**
 * Default style.
 * @type {Array.<ol.style.Style>|undefined}
 */
olx.source.OSMXMLOptions.prototype.defaultStyle;


/**
 * Document.
 * @type {Document|undefined}
 */
olx.source.OSMXMLOptions.prototype.doc;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.OSMXMLOptions.prototype.extent;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.OSMXMLOptions.prototype.logo;


/**
 * Node.
 * @type {Node|undefined}
 */
olx.source.OSMXMLOptions.prototype.node;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.OSMXMLOptions.prototype.projection;


/**
 * Re-project to.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.OSMXMLOptions.prototype.reprojectTo;


/**
 * Text.
 * @type {string|undefined}
 */
olx.source.OSMXMLOptions.prototype.text;


/**
 * URL.
 * @type {string|undefined}
 */
olx.source.OSMXMLOptions.prototype.url;


/**
 * URLs.
 * @type {Array.<string>|undefined}
 */
olx.source.OSMXMLOptions.prototype.urls;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     canvasFunction: ol.CanvasFunctionType,
 *     extent: (ol.Extent|undefined),
 *     logo: (string|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     ratio: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     state: (ol.source.State|string|undefined)}}
 * @todo api
 */
olx.source.ImageCanvasOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.ImageCanvasOptions.prototype.attributions;


/**
 * Canvas function. The function returning the canvas element used by the source
 * as an image. The arguments passed to the function are: `{ol.Extent}` the
 * image extent, `{number}` the image resolution, `{number}` the device pixel
 * ratio, `{ol.Size}` the image size, and `{ol.proj.Projection}` the image
 * projection. The canvas returned by this function is cached by the source. If
 * the value returned by the function is later changed then
 * `dispatchChangeEvent` should be called on the source for the source to
 * invalidate the current cached image.
 * @type {ol.CanvasFunctionType}
 */
olx.source.ImageCanvasOptions.prototype.canvasFunction;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.ImageCanvasOptions.prototype.extent;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.ImageCanvasOptions.prototype.logo;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.ImageCanvasOptions.prototype.projection;


/**
 * Ratio. 1 means canvases are the size of the map viewport, 2 means twice the
 * size of the map viewport, and so on. Default is `1.5`.
 * @type {number|undefined}
 */
olx.source.ImageCanvasOptions.prototype.ratio;


/**
 * Resolutions. If specified, new canvases will be created for these resolutions
 * only.
 * @type {Array.<number>|undefined}
 */
olx.source.ImageCanvasOptions.prototype.resolutions;


/**
 * Source state.
 * @type {ol.source.State|string|undefined}
 */
olx.source.ImageCanvasOptions.prototype.state;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     extent: (ol.Extent|undefined),
 *     logo: (string|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     ratio: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     source: ol.source.Vector,
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction|undefined)}}
 * @todo api
 */
olx.source.ImageVectorOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.ImageVectorOptions.prototype.attributions;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.ImageVectorOptions.prototype.extent;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.ImageVectorOptions.prototype.logo;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.ImageVectorOptions.prototype.projection;


/**
 * Ratio. 1 means canvases are the size of the map viewport, 2 means twice the
 * size of the map viewport, and so on. Default is `1.5`.
 * @type {number|undefined}
 */
olx.source.ImageVectorOptions.prototype.ratio;


/**
 * Resolutions. If specified, new canvases will be created for these resolutions
 * only.
 * @type {Array.<number>|undefined}
 */
olx.source.ImageVectorOptions.prototype.resolutions;


/**
 * The vector source from which the vector features drawn in canvas elements are
 * read.
 * @type {ol.source.Vector}
 */
olx.source.ImageVectorOptions.prototype.source;


/**
 * Style to use when rendering features to the canvas.
 * @type {ol.style.Style|Array.<ol.style.Style>|ol.feature.StyleFunction|undefined}
 */
olx.source.ImageVectorOptions.prototype.style;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     crossOrigin: (null|string|undefined),
 *     extent: (ol.Extent|undefined),
 *     hidpi: (boolean|undefined),
 *     serverType: (ol.source.wms.ServerType|string|undefined),
 *     logo: (string|undefined),
 *     params: Object.<string,*>,
 *     projection: ol.proj.ProjectionLike,
 *     ratio: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     url: (string|undefined)}}
 * @todo api
 */
olx.source.ImageWMSOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.ImageWMSOptions.prototype.attributions;


/**
 * crossOrigin setting for image requests.
 * @type {null|string|undefined}
 */
olx.source.ImageWMSOptions.prototype.crossOrigin;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.ImageWMSOptions.prototype.extent;


/**
 * Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * @type {boolean|undefined}
 */
olx.source.ImageWMSOptions.prototype.hidpi;


/**
 * The type of the remote WMS server: `mapserver`, `geoserver` or `qgis`. Only
 * needed if `hidpi` is `true`. Default is `undefined`.
 * @type {ol.source.wms.ServerType|string|undefined}
 */
olx.source.ImageWMSOptions.prototype.serverType;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.ImageWMSOptions.prototype.logo;


/**
 * WMS request parameters. At least a `LAYERS` param is required. `STYLES` is ``
 * by default. `VERSION` is `1.3.0` by default. `WIDTH`, `HEIGHT`, `BBOX` and
 * `CRS` (`SRS` for WMS version < 1.3.0) will be set dynamically.
 * @type {Object.<string,*>}
 */
olx.source.ImageWMSOptions.prototype.params;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.ImageWMSOptions.prototype.projection;


/**
 * Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the size of the map viewport, and so on. Default is `1.5`.
 * @type {number|undefined}
 */
olx.source.ImageWMSOptions.prototype.ratio;


/**
 * Resolutions. If specified, requests will be made for these resolutions only.
 * @type {Array.<number>|undefined}
 */
olx.source.ImageWMSOptions.prototype.resolutions;


/**
 * WMS service URL.
 * @type {string|undefined}
 */
olx.source.ImageWMSOptions.prototype.url;


/**
 * @typedef {{layer: string,
 *     minZoom: (number|undefined),
 *     maxZoom: (number|undefined),
 *     opaque: (boolean|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: (string|undefined)}}
 * @todo api
 */
olx.source.StamenOptions;


/**
 * Layer.
 * @type {string}
 */
olx.source.StamenOptions.prototype.layer;


/**
 * Minimum zoom.
 * @type {number|undefined}
 */
olx.source.StamenOptions.prototype.minZoom;


/**
 * Maximum zoom.
 * @type {number|undefined}
 */
olx.source.StamenOptions.prototype.maxZoom;


/**
 * Whether the layer is opaque.
 * @type {boolean|undefined}
 */
olx.source.StamenOptions.prototype.opaque;


/**
 * Optional function to load a tile given a URL.
 * @type {ol.TileLoadFunctionType|undefined}
 */
olx.source.StamenOptions.prototype.tileLoadFunction;


/**
 * URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * @type {string|undefined}
 */
olx.source.StamenOptions.prototype.url;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     crossOrigin: (null|string|undefined),
 *     extent: (ol.Extent|undefined),
 *     imageExtent: (ol.Extent|undefined),
 *     imageSize: (ol.Size|undefined),
 *     logo: (string|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     url: string}}
 * @todo api
 */
olx.source.ImageStaticOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.ImageStaticOptions.prototype.attributions;


/**
 * crossOrigin setting for image requests.
 * @type {null|string|undefined}
 */
olx.source.ImageStaticOptions.prototype.crossOrigin;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.ImageStaticOptions.prototype.extent;


/**
 * Extent of the image.
 * @type {ol.Extent|undefined}
 */
olx.source.ImageStaticOptions.prototype.imageExtent;


/**
 * Size of the image.
 * @type {ol.Size|undefined}
 */
olx.source.ImageStaticOptions.prototype.imageSize;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.ImageStaticOptions.prototype.logo;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.ImageStaticOptions.prototype.projection;


/**
 * Url.
 * @type {string}
 */
olx.source.ImageStaticOptions.prototype.url;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     extent: (ol.Extent|undefined),
 *     format: ol.format.Feature,
 *     loader: function(this: ol.source.ServerVector, ol.Extent, number, ol.proj.Projection),
 *     strategy: (function(ol.Extent, number): Array.<ol.Extent>|undefined),
 *     logo: (string|undefined),
 *     projection: ol.proj.ProjectionLike}}
 * @todo api
 */
olx.source.ServerVectorOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.ServerVectorOptions.prototype.attributions;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.ServerVectorOptions.prototype.extent;


/**
 * Format.
 * @type {ol.format.Feature}
 */
olx.source.ServerVectorOptions.prototype.format;


/**
 * Loading function.
 * @type {function(this: ol.source.ServerVector, ol.Extent, number, ol.proj.Projection)}
 */
olx.source.ServerVectorOptions.prototype.loader;


/**
 * Loading strategy. Default is `ol.loadingstrategy.bbox`.
 * @type {function(ol.Extent, number): Array.<ol.Extent>|undefined}
 */
olx.source.ServerVectorOptions.prototype.strategy;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.ServerVectorOptions.prototype.logo;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.ServerVectorOptions.prototype.projection;


/**
 * @typedef {{crossOrigin: (null|string|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: string}}
 * @todo api
 */
olx.source.TileJSONOptions;


/**
 * crossOrigin setting for image requests.
 * @type {null|string|undefined}
 */
olx.source.TileJSONOptions.prototype.crossOrigin;


/**
 * Optional function to load a tile given a URL.
 * @type {ol.TileLoadFunctionType|undefined}
 */
olx.source.TileJSONOptions.prototype.tileLoadFunction;


/**
 * URL to the TileJSON file.
 * @type {string}
 */
olx.source.TileJSONOptions.prototype.url;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     params: Object.<string,*>,
 *     crossOrigin: (null|string|undefined),
 *     extent: (ol.Extent|undefined),
 *     gutter: (number|undefined),
 *     hidpi: (boolean|undefined),
 *     logo: (string|undefined),
 *     tileGrid: (ol.tilegrid.TileGrid|undefined),
 *     maxZoom: (number|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     serverType: (ol.source.wms.ServerType|string|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined)}}
 * @todo api
 */
olx.source.TileWMSOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.TileWMSOptions.prototype.attributions;


/**
 * WMS request parameters. At least a `LAYERS` param is required. `STYLES` is ``
 * by default. `VERSION` is `1.3.0` by default. `WIDTH`, `HEIGHT`, `BBOX` and
 * `CRS` (`SRS` for WMS version < 1.3.0) will be set dynamically.
 * @type {Object.<string,*>}
 */
olx.source.TileWMSOptions.prototype.params;


/**
 * crossOrigin setting for image requests.
 * @type {null|string|undefined}
 */
olx.source.TileWMSOptions.prototype.crossOrigin;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.TileWMSOptions.prototype.extent;


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
 */
olx.source.TileWMSOptions.prototype.gutter;


/**
 * Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * @type {boolean|undefined}
 */
olx.source.TileWMSOptions.prototype.hidpi;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.TileWMSOptions.prototype.logo;


/**
 * Tile grid.
 * @type {ol.tilegrid.TileGrid|undefined}
 */
olx.source.TileWMSOptions.prototype.tileGrid;


/**
 * Maximum zoom.
 * @type {number|undefined}
 */
olx.source.TileWMSOptions.prototype.maxZoom;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.TileWMSOptions.prototype.projection;


/**
 * The type of the remote WMS server: `mapserver`, `geoserver` or `qgis`. Only
 * needed if `hidpi` is `true`. Default is `undefined`.
 * @type {ol.source.wms.ServerType|string|undefined}
 */
olx.source.TileWMSOptions.prototype.serverType;


/**
 * Optional function to load a tile given a URL.
 * @type {ol.TileLoadFunctionType|undefined}
 */
olx.source.TileWMSOptions.prototype.tileLoadFunction;


/**
 * WMS service URL.
 * @type {string|undefined}
 */
olx.source.TileWMSOptions.prototype.url;


/**
 * WMS service urls. Use this instead of `url` when the WMS supports multiple
 * urls for GetMap requests.
 * @type {Array.<string>|undefined}
 */
olx.source.TileWMSOptions.prototype.urls;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     extent: (ol.Extent|undefined),
 *     features: (Array.<ol.Feature>|undefined),
 *     logo: (string|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     state: (ol.source.State|string|undefined)}}
 * @todo api
 */
olx.source.VectorOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.VectorOptions.prototype.attributions;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.VectorOptions.prototype.extent;


/**
 * Features.
 * @type {Array.<ol.Feature>|undefined}
 */
olx.source.VectorOptions.prototype.features;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.VectorOptions.prototype.logo;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.VectorOptions.prototype.projection;


/**
 * State.
 * @type {ol.source.State|string|undefined}
 */
olx.source.VectorOptions.prototype.state;


/**
 * @typedef {{arrayBuffer: (ArrayBuffer|undefined),
 *     attributions: (Array.<ol.Attribution>|undefined),
 *     doc: (Document|undefined),
 *     extent: (ol.Extent|undefined),
 *     format: ol.format.Feature,
 *     logo: (string|undefined),
 *     node: (Node|undefined),
 *     object: (Object|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     text: (string|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined)}}
 * @todo api
 */
olx.source.StaticVectorOptions;


/**
 * Array buffer.
 * @type {ArrayBuffer|undefined}
 */
olx.source.StaticVectorOptions.prototype.arrayBuffer;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.StaticVectorOptions.prototype.attributions;


/**
 * Document.
 * @type {Document|undefined}
 */
olx.source.StaticVectorOptions.prototype.doc;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.StaticVectorOptions.prototype.extent;


/**
 * Format.
 * @type {ol.format.Feature}
 */
olx.source.StaticVectorOptions.prototype.format;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.StaticVectorOptions.prototype.logo;


/**
 * Node.
 * @type {Node|undefined}
 */
olx.source.StaticVectorOptions.prototype.node;


/**
 * Object.
 * @type {Object|undefined}
 */
olx.source.StaticVectorOptions.prototype.object;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.StaticVectorOptions.prototype.projection;


/**
 * Text.
 * @type {string|undefined}
 */
olx.source.StaticVectorOptions.prototype.text;


/**
 * URL.
 * @type {string|undefined}
 */
olx.source.StaticVectorOptions.prototype.url;


/**
 * URLs.
 * @type {Array.<string>|undefined}
 */
olx.source.StaticVectorOptions.prototype.urls;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     crossOrigin: (string|null|undefined),
 *     extent: (ol.Extent|undefined),
 *     logo: (string|undefined),
 *     tileGrid: ol.tilegrid.WMTS,
 *     projection: ol.proj.ProjectionLike,
 *     requestEncoding: (ol.source.WMTSRequestEncoding|undefined),
 *     layer: string,
 *     style: string,
 *     version: (string|undefined),
 *     format: (string|undefined),
 *     matrixSet: string,
 *     dimensions: (Object|undefined),
 *     url: (string|undefined),
 *     maxZoom: (number|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     urls: (Array.<string>|undefined)}}
 * @todo api
 */
olx.source.WMTSOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.WMTSOptions.prototype.attributions;


/**
 * crossOrigin setting for image requests.
 * @type {string|null|undefined}
 */
olx.source.WMTSOptions.prototype.crossOrigin;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.WMTSOptions.prototype.extent;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.WMTSOptions.prototype.logo;


/**
 * Tile grid.
 * @type {ol.tilegrid.WMTS}
 */
olx.source.WMTSOptions.prototype.tileGrid;


/**
 * Projection.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.WMTSOptions.prototype.projection;


/**
 * Request encoding.
 * @type {ol.source.WMTSRequestEncoding|undefined}
 */
olx.source.WMTSOptions.prototype.requestEncoding;


/**
 * Layer.
 * @type {string}
 */
olx.source.WMTSOptions.prototype.layer;


/**
 * Style.
 * @type {string}
 */
olx.source.WMTSOptions.prototype.style;


/**
 * WMTS version. Default to `1.0.0`.
 * @type {string|undefined}
 */
olx.source.WMTSOptions.prototype.version;


/**
 * Format.
 * @type {string|undefined}
 */
olx.source.WMTSOptions.prototype.format;


/**
 * Matrix set.
 * @type {string}
 */
olx.source.WMTSOptions.prototype.matrixSet;


/**
 * Dimensions.
 * @type {Object|undefined}
 */
olx.source.WMTSOptions.prototype.dimensions;


/**
 * URL.
 * @type {string|undefined}
 */
olx.source.WMTSOptions.prototype.url;


/**
 * Maximum zoom.
 * @type {number|undefined}
 */
olx.source.WMTSOptions.prototype.maxZoom;


/**
 * Optional function to load a tile given a URL.
 * @type {ol.TileLoadFunctionType|undefined}
 */
olx.source.WMTSOptions.prototype.tileLoadFunction;


/**
 * Urls.
 * @type {Array.<string>|undefined}
 */
olx.source.WMTSOptions.prototype.urls;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     crossOrigin: (null|string|undefined),
 *     extent: (ol.Extent|undefined),
 *     logo: (string|undefined),
 *     projection: ol.proj.ProjectionLike,
 *     maxZoom: (number|undefined),
 *     minZoom: (number|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     tileUrlFunction: (ol.TileUrlFunctionType|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined),
 *     wrapX: (boolean|undefined)}}
 * @todo api
 */
olx.source.XYZOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.XYZOptions.prototype.attributions;


/**
 * Cross origin setting for image requests.
 * @type {null|string|undefined}
 */
olx.source.XYZOptions.prototype.crossOrigin;


/**
 * Extent.
 * @type {ol.Extent|undefined}
 */
olx.source.XYZOptions.prototype.extent;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.XYZOptions.prototype.logo;


/**
 * Projection. Default is `EPSG:3857`.
 * @type {ol.proj.ProjectionLike}
 */
olx.source.XYZOptions.prototype.projection;


/**
 * Optional max zoom level. Default is `18`.
 * @type {number|undefined}
 */
olx.source.XYZOptions.prototype.maxZoom;


/**
 * Unsupported (TODO: remove this).
 * @type {number|undefined}
 */
olx.source.XYZOptions.prototype.minZoom;


/**
 * Optional function to load a tile given a URL.
 * @type {ol.TileLoadFunctionType|undefined}
 */
olx.source.XYZOptions.prototype.tileLoadFunction;


/**
 * Optional function to get tile URL given a tile coordinate and the projection.
 * Required if url or urls are not provided.
 * @type {ol.TileUrlFunctionType|undefined}
 */
olx.source.XYZOptions.prototype.tileUrlFunction;


/**
 * URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * @type {string|undefined}
 */
olx.source.XYZOptions.prototype.url;


/**
 * An array of URL templates.
 * @type {Array.<string>|undefined}
 */
olx.source.XYZOptions.prototype.urls;


/**
 * Whether to wrap the world horizontally. Default is `true`.
 * @type {boolean|undefined}
 */
olx.source.XYZOptions.prototype.wrapX;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     crossOrigin: (null|string|undefined),
 *     logo: (string|undefined),
 *     url: !string,
 *     tierSizeCalculation: (string|undefined),
 *     size: ol.Size}}
 * @todo api
 */
olx.source.ZoomifyOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 */
olx.source.ZoomifyOptions.prototype.attributions;


/**
 * Cross origin setting for image requests.
 * @type {null|string|undefined}
 */
olx.source.ZoomifyOptions.prototype.crossOrigin;


/**
 * Logo.
 * @type {string|undefined}
 */
olx.source.ZoomifyOptions.prototype.logo;


/**
 * Prefix of URL template.
 * @type {!string}
 */
olx.source.ZoomifyOptions.prototype.url;


/**
 * Tier size calculation method: `default` or `truncated`.
 * @type {string|undefined}
 */
olx.source.ZoomifyOptions.prototype.tierSizeCalculation;


/**
 * Size of the image.
 * @type {ol.Size}
 */
olx.source.ZoomifyOptions.prototype.size;


/**
 * @typedef {{fill: (ol.style.Fill|undefined),
 *     radius: number,
 *     stroke: (ol.style.Stroke|undefined)}}
 * @todo api
 */
olx.style.CircleOptions;


/**
 * Fill style.
 * @type {ol.style.Fill|undefined}
 */
olx.style.CircleOptions.prototype.fill;


/**
 * Circle radius.
 * @type {number}
 */
olx.style.CircleOptions.prototype.radius;


/**
 * Stroke style.
 * @type {ol.style.Stroke|undefined}
 */
olx.style.CircleOptions.prototype.stroke;


/**
 * @typedef {{color: (ol.Color|string|undefined)}}
 * @todo api
 */
olx.style.FillOptions;


/**
 * Color.
 * @type {ol.Color|string|undefined}
 */
olx.style.FillOptions.prototype.color;


/**
 * @typedef {{anchor: (Array.<number>|undefined),
 *     anchorOrigin: (ol.style.IconAnchorOrigin|undefined),
 *     anchorXUnits: (ol.style.IconAnchorUnits|undefined),
 *     anchorYUnits: (ol.style.IconAnchorUnits|undefined),
 *     crossOrigin: (null|string|undefined),
 *     scale: (number|undefined),
 *     rotateWithView: (boolean|undefined),
 *     rotation: (number|undefined),
 *     size: (ol.Size|undefined),
 *     src: string}}
 * @todo api
 */
olx.style.IconOptions;


/**
 * Anchor. Default value is `[0.5, 0.5]` (icon center).
 * @type {Array.<number>|undefined}
 */
olx.style.IconOptions.prototype.anchor;


/**
 * Origin of the anchor: `bottom-left`, `bottom-right`, `top-left` or
 * `top-right`. Default is `top-left`.
 * @type {ol.style.IconAnchorOrigin|undefined}
 */
olx.style.IconOptions.prototype.anchorOrigin;


/**
 * Units in which the anchor x value is specified. A value of `'fraction'`
 * indicates the x value is a fraction of the icon. A value of `'pixels'`
 * indicates the x value in pixels. Default is `'fraction'`.
 * @type {ol.style.IconAnchorUnits|undefined}
 */
olx.style.IconOptions.prototype.anchorXUnits;


/**
 * Units in which the anchor y value is specified. A value of `'fraction'`
 * indicates the y value is a fraction of the icon. A value of `'pixels'`
 * indicates the y value in pixels. Default is `'fraction'`.
 * @type {ol.style.IconAnchorUnits|undefined}
 */
olx.style.IconOptions.prototype.anchorYUnits;


/**
 * crossOrigin setting for image.
 * @type {null|string|undefined}
 */
olx.style.IconOptions.prototype.crossOrigin;


/**
 * Scale.
 * @type {number|undefined}
 */
olx.style.IconOptions.prototype.scale;


/**
 * Whether to rotate the icon with the view. Default is `false`.
 * @type {boolean|undefined}
 */
olx.style.IconOptions.prototype.rotateWithView;


/**
 * Rotation.
 * @type {number|undefined}
 */
olx.style.IconOptions.prototype.rotation;


/**
 * Icon size in pixel.
 * @type {ol.Size|undefined}
 */
olx.style.IconOptions.prototype.size;


/**
 * Image source URI.
 * @type {string}
 */
olx.style.IconOptions.prototype.src;


/**
 * @typedef {{color: (ol.Color|string|undefined),
 *     lineCap: (string|undefined),
 *     lineJoin: (string|undefined),
 *     lineDash: (Array.<number>|undefined),
 *     miterLimit: (number|undefined),
 *     width: (number|undefined)}}
 * @todo api
 */
olx.style.StrokeOptions;


/**
 * Color.
 * @type {ol.Color|string|undefined}
 */
olx.style.StrokeOptions.prototype.color;


/**
 * Line cap style: `butt`, `round`, or `square`. Default is `round`.
 * @type {string|undefined}
 */
olx.style.StrokeOptions.prototype.lineCap;


/**
 * Line join style: `bevel`, `round`, or `miter`. Default is `round`.
 * @type {string|undefined}
 */
olx.style.StrokeOptions.prototype.lineJoin;


/**
 * Line dash pattern. Default is `undefined` (no dash).
 * @type {Array.<number>|undefined}
 */
olx.style.StrokeOptions.prototype.lineDash;


/**
 * Miter limit. Default is `10`.
 * @type {number|undefined}
 */
olx.style.StrokeOptions.prototype.miterLimit;


/**
 * Width.
 * @type {number|undefined}
 */
olx.style.StrokeOptions.prototype.width;


/**
 * @typedef {{font: (string|undefined),
 *     offsetX: (number|undefined),
 *     offsetY: (number|undefined),
 *     scale: (number|undefined),
 *     rotation: (number|undefined),
 *     text: (string|undefined),
 *     textAlign: (string|undefined),
 *     textBaseline: (string|undefined),
 *     fill: (ol.style.Fill|undefined),
 *     stroke: (ol.style.Stroke|undefined)}}
 * @todo api
 */
olx.style.TextOptions;


/**
 * Font.
 * @type {string|undefined}
 */
olx.style.TextOptions.prototype.font;


/**
 * Horizontal text offset in pixels. A positive will shift the text right.
 * Default is `0`.
 * @type {number|undefined}
 */
olx.style.TextOptions.prototype.offsetX;


/**
 * Vertical text offset in pixels. A positive will shift the text down. Default
 * is `0`.
 * @type {number|undefined}
 */
olx.style.TextOptions.prototype.offsetY;


/**
 * Scale.
 * @type {number|undefined}
 */
olx.style.TextOptions.prototype.scale;


/**
 * Rotation.
 * @type {number|undefined}
 */
olx.style.TextOptions.prototype.rotation;


/**
 * Text.
 * @type {string|undefined}
 */
olx.style.TextOptions.prototype.text;


/**
 * Text alignment.
 * @type {string|undefined}
 */
olx.style.TextOptions.prototype.textAlign;


/**
 * Text base line.
 * @type {string|undefined}
 */
olx.style.TextOptions.prototype.textBaseline;


/**
 * Fill style.
 * @type {ol.style.Fill|undefined}
 */
olx.style.TextOptions.prototype.fill;


/**
 * Stroke style.
 * @type {ol.style.Stroke|undefined}
 */
olx.style.TextOptions.prototype.stroke;


/**
 * @typedef {{fill: (ol.style.Fill|undefined),
 *     image: (ol.style.Image|undefined),
 *     stroke: (ol.style.Stroke|undefined),
 *     text: (ol.style.Text|undefined),
 *     zIndex: (number|undefined)}}
 * @todo api
 */
olx.style.StyleOptions;


/**
 * Fill style.
 * @type {ol.style.Fill|undefined}
 */
olx.style.StyleOptions.prototype.fill;


/**
 * Image style.
 * @type {ol.style.Image|undefined}
 */
olx.style.StyleOptions.prototype.image;


/**
 * Stroke style.
 * @type {ol.style.Stroke|undefined}
 */
olx.style.StyleOptions.prototype.stroke;


/**
 * Text style.
 * @type {ol.style.Text|undefined}
 */
olx.style.StyleOptions.prototype.text;


/**
 * Z index.
 * @type {number|undefined}
 */
olx.style.StyleOptions.prototype.zIndex;


/**
 * @typedef {{minZoom: (number|undefined),
 *     origin: (ol.Coordinate|undefined),
 *     origins: (Array.<ol.Coordinate>|undefined),
 *     resolutions: !Array.<number>,
 *     tileSize: (number|undefined),
 *     tileSizes: (Array.<number>|undefined)}}
 * @todo api
 */
olx.tilegrid.TileGridOptions;


/**
 * Minimum zoom.
 * @type {number|undefined}
 */
olx.tilegrid.TileGridOptions.prototype.minZoom;


/**
 * Origin.
 * @type {ol.Coordinate|undefined}
 */
olx.tilegrid.TileGridOptions.prototype.origin;


/**
 * Origins.
 * @type {Array.<ol.Coordinate>|undefined}
 */
olx.tilegrid.TileGridOptions.prototype.origins;


/**
 * Resolutions.
 * @type {!Array.<number>}
 */
olx.tilegrid.TileGridOptions.prototype.resolutions;


/**
 * Tile size.
 * @type {number|undefined}
 */
olx.tilegrid.TileGridOptions.prototype.tileSize;


/**
 * Tile sizes.
 * @type {Array.<number>|undefined}
 */
olx.tilegrid.TileGridOptions.prototype.tileSizes;


/**
 * @typedef {{origin: (ol.Coordinate|undefined),
 *     origins: (Array.<ol.Coordinate>|undefined),
 *     resolutions: !Array.<number>,
 *     matrixIds: !Array.<string>,
 *     tileSize: (number|undefined),
 *     tileSizes: (Array.<number>|undefined)}}
 * @todo api
 */
olx.tilegrid.WMTSOptions;


/**
 * Origin.
 * @type {ol.Coordinate|undefined}
 */
olx.tilegrid.WMTSOptions.prototype.origin;


/**
 * Origins.
 * @type {Array.<ol.Coordinate>|undefined}
 */
olx.tilegrid.WMTSOptions.prototype.origins;


/**
 * Resolutions.
 * @type {!Array.<number>}
 */
olx.tilegrid.WMTSOptions.prototype.resolutions;


/**
 * matrix IDs.
 * @type {!Array.<string>}
 */
olx.tilegrid.WMTSOptions.prototype.matrixIds;


/**
 * Tile size.
 * @type {number|undefined}
 */
olx.tilegrid.WMTSOptions.prototype.tileSize;


/**
 * Tile sizes.
 * @type {Array.<number>|undefined}
 */
olx.tilegrid.WMTSOptions.prototype.tileSizes;


/**
 * @typedef {{maxZoom: number}}
 * @todo api
 */
olx.tilegrid.XYZOptions;


/**
 * Maximum zoom.
 * @type {number}
 */
olx.tilegrid.XYZOptions.prototype.maxZoom;


/**
 * @typedef {{resolutions: !Array.<number>}}
 * @todo api
 */
olx.tilegrid.ZoomifyOptions;


/**
 * Resolutions.
 * @type {!Array.<number>}
 */
olx.tilegrid.ZoomifyOptions.prototype.resolutions;


/**
 * @typedef {{padding: !Array.<number>,
 *     constrainResolution: (boolean|undefined),
 *     nearest: (boolean|undefined),
 *     minResolution: (number|undefined)}}
 * @todo api
 */
olx.View2D.fitGeometryOptions;


/**
 * Padding (in pixels) to be cleared inside the view. Values in the array are
 * top, right, bottom and left padding. Default is `[0, 0, 0, 0]`.
 * @type {!Array.<number>}
 */
olx.View2D.fitGeometryOptions.prototype.padding;


/**
 * Constrain the resolution. Default is `true`.
 * @type {boolean|undefined}
 */
olx.View2D.fitGeometryOptions.prototype.constrainResolution;


/**
 * Get the nearest extent. Default is `false`.
 * @type {boolean|undefined}
 */
olx.View2D.fitGeometryOptions.prototype.nearest;


/**
 * Minimum resolution that we zoom to. Default is `0`.
 * @type {number|undefined}
 */
olx.View2D.fitGeometryOptions.prototype.minResolution;
