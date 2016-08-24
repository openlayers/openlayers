
/**
 * @type {Object}
 */
var olx;


/* typedefs for object literals provided by applications */


/**
 * @typedef {{html: string,
 *     tileRanges: (Object.<string, Array.<ol.TileRange>>|undefined)}}
 */
olx.AttributionOptions;


/**
 * HTML markup for this attribution.
 * @type {string}
 * @api stable
 */
olx.AttributionOptions.prototype.html;


/**
 * @typedef {{tracking: (boolean|undefined)}}
 */
olx.DeviceOrientationOptions;


/**
 * Start tracking. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.DeviceOrientationOptions.prototype.tracking;


/**
 * @typedef {{tracking: (boolean|undefined),
 *     trackingOptions: (GeolocationPositionOptions|undefined),
 *     projection: ol.ProjectionLike}}
 */
olx.GeolocationOptions;


/**
 * Start Tracking. Default is `false`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.GeolocationOptions.prototype.tracking;


/**
 * Tracking options. See
 * {@link http://www.w3.org/TR/geolocation-API/#position_options_interface}.
 * @type {GeolocationPositionOptions|undefined}
 * @api stable
 */
olx.GeolocationOptions.prototype.trackingOptions;


/**
 * The projection the position is reported in.
 * @type {ol.ProjectionLike}
 * @api stable
 */
olx.GeolocationOptions.prototype.projection;


/**
 * Object literal with config options for the map logo.
 * @typedef {{href: (string), src: (string)}}
 */
olx.LogoOptions;


/**
 * Link url for the logo. Will be followed when the logo is clicked.
 * @type {string}
 * @api
 */
olx.LogoOptions.prototype.href;


/**
 * Image src for the logo.
 * @type {string}
 * @api
 */
olx.LogoOptions.prototype.src;


/**
 * @typedef {{map: (ol.Map|undefined),
 *     maxLines: (number|undefined),
 *     strokeStyle: (ol.style.Stroke|undefined),
 *     targetSize: (number|undefined)}}
 */
olx.GraticuleOptions;


/**
 * Reference to an `ol.Map` object.
 * @type {ol.Map|undefined}
 * @api
 */
olx.GraticuleOptions.prototype.map;


/**
 * The maximum number of meridians and parallels from the center of the
 * map. The default value is 100, which means that at most 200 meridians
 * and 200 parallels will be displayed. The default value is appropriate
 * for conformal projections like Spherical Mercator. If you increase
 * the value more lines will be drawn and the drawing performance will
 * decrease.
 * @type {number|undefined}
 * @api
 */
olx.GraticuleOptions.prototype.maxLines;


/**
 * The stroke style to use for drawing the graticule. If not provided, the
 * lines will be drawn with `rgba(0,0,0,0.2)`, a not fully opaque black.
 *
 * @type {ol.style.Stroke|undefined}
 * @api
 */
olx.GraticuleOptions.prototype.strokeStyle;


/**
 * The target size of the graticule cells, in pixels. Default
 * value is 100 pixels.
 * @type {number|undefined}
 * @api
 */
olx.GraticuleOptions.prototype.targetSize;


/**
 * Object literal with config options for interactions.
 * @typedef {{handleEvent: function(ol.MapBrowserEvent):boolean}}
 */
olx.interaction.InteractionOptions;


/**
 * Method called by the map to notify the interaction that a browser event was
 * dispatched to the map. The function may return `false` to prevent the
 * propagation of the event to other interactions in the map's interactions
 * chain.
 * @type {function(ol.MapBrowserEvent):boolean}
 * @api
 */
olx.interaction.InteractionOptions.prototype.handleEvent;


/**
 * Object literal with config options for the map.
 * @typedef {{controls: (ol.Collection.<ol.control.Control>|Array.<ol.control.Control>|undefined),
 *     pixelRatio: (number|undefined),
 *     interactions: (ol.Collection.<ol.interaction.Interaction>|Array.<ol.interaction.Interaction>|undefined),
 *     keyboardEventTarget: (Element|Document|string|undefined),
 *     layers: (Array.<ol.layer.Base>|ol.Collection.<ol.layer.Base>|undefined),
 *     loadTilesWhileAnimating: (boolean|undefined),
 *     loadTilesWhileInteracting: (boolean|undefined),
 *     logo: (boolean|string|olx.LogoOptions|Element|undefined),
 *     overlays: (ol.Collection.<ol.Overlay>|Array.<ol.Overlay>|undefined),
 *     renderer: (ol.RendererType|Array.<ol.RendererType|string>|string|undefined),
 *     target: (Element|string|undefined),
 *     view: (ol.View|undefined)}}
 */
olx.MapOptions;


/**
 * Controls initially added to the map. If not specified,
 * {@link ol.control.defaults ol.control.defaults()} is used.
 * @type {ol.Collection.<ol.control.Control>|Array.<ol.control.Control>|undefined}
 * @api stable
 */
olx.MapOptions.prototype.controls;


/**
 * The ratio between physical pixels and device-independent pixels (dips) on the
 * device. If `undefined` then it gets set by using `window.devicePixelRatio`.
 * @type {number|undefined}
 * @api
 */
olx.MapOptions.prototype.pixelRatio;


/**
 * Interactions that are initially added to the map. If not specified,
 * {@link ol.interaction.defaults ol.interaction.defaults()} is used.
 * @type {ol.Collection.<ol.interaction.Interaction>|Array.<ol.interaction.Interaction>|undefined}
 * @api stable
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
 * @api
 */
olx.MapOptions.prototype.keyboardEventTarget;


/**
 * Layers. If this is not defined, a map with no layers will be rendered. Note
 * that layers are rendered in the order supplied, so if you want, for example,
 * a vector layer to appear on top of a tile layer, it must come after the tile
 * layer.
 * @type {Array.<ol.layer.Base>|ol.Collection.<ol.layer.Base>|undefined}
 * @api stable
 */
olx.MapOptions.prototype.layers;


/**
 * When set to true, tiles will be loaded during animations. This may improve
 * the user experience, but can also make animations stutter on devices with
 * slow memory. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.MapOptions.prototype.loadTilesWhileAnimating;


/**
 * When set to true, tiles will be loaded while interacting with the map. This
 * may improve the user experience, but can also make map panning and zooming
 * choppy on devices with slow memory. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.MapOptions.prototype.loadTilesWhileInteracting;


/**
 * The map logo. A logo to be displayed on the map at all times. If a string is
 * provided, it will be set as the image source of the logo. If an object is
 * provided, the `src` property should be the URL for an image and the `href`
 * property should be a URL for creating a link. If an element is provided,
 * the element will be used. To disable the map logo, set the option to
 * `false`. By default, the OpenLayers 3 logo is shown.
 * @type {boolean|string|olx.LogoOptions|Element|undefined}
 * @api stable
 */
olx.MapOptions.prototype.logo;


/**
 * Overlays initially added to the map. By default, no overlays are added.
 * @type {ol.Collection.<ol.Overlay>|Array.<ol.Overlay>|undefined}
 * @api stable
 */
olx.MapOptions.prototype.overlays;


/**
 * Renderer. By default, Canvas, DOM and WebGL renderers are tested for support
 * in that order, and the first supported used. Specify a
 * {@link ol.RendererType} here to use a specific renderer.
 * Note that at present the Canvas and DOM renderers fully support vector data,
 * but WebGL can only render Point geometries.
 * @type {ol.RendererType|Array.<ol.RendererType|string>|string|undefined}
 * @api stable
 */
olx.MapOptions.prototype.renderer;


/**
 * The container for the map, either the element itself or the `id` of the
 * element. If not specified at construction time, {@link ol.Map#setTarget}
 * must be called for the map to be rendered.
 * @type {Element|string|undefined}
 * @api stable
 */
olx.MapOptions.prototype.target;


/**
 * The map's view.  No layer sources will be fetched unless this is specified at
 * construction time or through {@link ol.Map#setView}.
 * @type {ol.View|undefined}
 * @api stable
 */
olx.MapOptions.prototype.view;


/**
 * Object literal with config options for the overlay.
 * @typedef {{id: (number|string|undefined),
 *     element: (Element|undefined),
 *     offset: (Array.<number>|undefined),
 *     position: (ol.Coordinate|undefined),
 *     positioning: (ol.OverlayPositioning|string|undefined),
 *     stopEvent: (boolean|undefined),
 *     insertFirst: (boolean|undefined),
 *     autoPan: (boolean|undefined),
 *     autoPanAnimation: (olx.animation.PanOptions|undefined),
 *     autoPanMargin: (number|undefined)}}
 */
olx.OverlayOptions;


/**
 * Set the overlay id. The overlay id can be used with the
 * {@link ol.Map#getOverlayById} method.
 * @type {number|string|undefined}
 * @api
 */
olx.OverlayOptions.prototype.id;


/**
 * The overlay element.
 * @type {Element|undefined}
 * @api stable
 */
olx.OverlayOptions.prototype.element;


/**
 * Offsets in pixels used when positioning the overlay. The first element in the
 * array is the horizontal offset. A positive value shifts the overlay right.
 * The second element in the array is the vertical offset. A positive value
 * shifts the overlay down. Default is `[0, 0]`.
 * @type {Array.<number>|undefined}
 * @api stable
 */
olx.OverlayOptions.prototype.offset;


/**
 * The overlay position in map projection.
 * @type {ol.Coordinate|undefined}
 * @api stable
 */
olx.OverlayOptions.prototype.position;


/**
 * Defines how the overlay is actually positioned with respect to its `position`
 * property. Possible values are `'bottom-left'`, `'bottom-center'`,
 * `'bottom-right'`, `'center-left'`, `'center-center'`, `'center-right'`,
 * `'top-left'`, `'top-center'`, and `'top-right'`. Default is `'top-left'`.
 * @type {ol.OverlayPositioning|string|undefined}
 * @api stable
 */
olx.OverlayOptions.prototype.positioning;


/**
 * Whether event propagation to the map viewport should be stopped. Default is
 * `true`. If `true` the overlay is placed in the same container as that of the
 * controls (CSS class name `ol-overlaycontainer-stopevent`); if `false` it is
 * placed in the container with CSS class name `ol-overlaycontainer`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.OverlayOptions.prototype.stopEvent;


/**
 * Whether the overlay is inserted first in the overlay container, or appended.
 * Default is `true`. If the overlay is placed in the same container as that of
 * the controls (see the `stopEvent` option) you will probably set `insertFirst`
 * to `true` so the overlay is displayed below the controls.
 * @type {boolean|undefined}
 * @api stable
 */
olx.OverlayOptions.prototype.insertFirst;


/**
 * If set to `true` the map is panned when calling `setPosition`, so that the
 * overlay is entirely visible in the current viewport.
 * The default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.OverlayOptions.prototype.autoPan;


/**
 * The options used to create a `ol.animation.pan` animation. This animation
 * is only used when `autoPan` is enabled. By default the default options for
 * `ol.animation.pan` are used. If set to `null` the panning is not animated.
 * @type {olx.animation.PanOptions|undefined}
 * @api
 */
olx.OverlayOptions.prototype.autoPanAnimation;


/**
 * The margin (in pixels) between the overlay and the borders of the map when
 * autopanning. The default is `20`.
 * @type {number|undefined}
 * @api
 */
olx.OverlayOptions.prototype.autoPanMargin;


/**
 * Object literal with config options for the projection.
 * @typedef {{code: string,
 *     units: (ol.proj.Units|string|undefined),
 *     extent: (ol.Extent|undefined),
 *     axisOrientation: (string|undefined),
 *     global: (boolean|undefined),
 *     metersPerUnit: (number|undefined),
 *     worldExtent: (ol.Extent|undefined),
 *     getPointResolution: (function(number, ol.Coordinate):number|undefined) }}
 */
olx.ProjectionOptions;


/**
 * The SRS identifier code, e.g. `EPSG:4326`.
 * @type {string}
 * @api stable
 */
olx.ProjectionOptions.prototype.code;


/**
 * Units. Required unless a proj4 projection is defined for `code`.
 * @type {ol.proj.Units|string|undefined}
 * @api stable
 */
olx.ProjectionOptions.prototype.units;


/**
 * The validity extent for the SRS.
 * @type {ol.Extent|undefined}
 * @api stable
 */
olx.ProjectionOptions.prototype.extent;


/**
 * The axis orientation as specified in Proj4. The default is `enu`.
 * @type {string|undefined}
 * @api stable
 */
olx.ProjectionOptions.prototype.axisOrientation;


/**
 * Whether the projection is valid for the whole globe. Default is `false`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.ProjectionOptions.prototype.global;


/**
 * The meters per unit for the SRS. If not provided, the `units` are used to get
 * the meters per unit from the {@link ol.proj.METERS_PER_UNIT} lookup table.
 * @type {number|undefined}
 * @api
 */
olx.ProjectionOptions.prototype.metersPerUnit;


/**
 * The world extent for the SRS.
 * @type {ol.Extent|undefined}
 * @api
 */
olx.ProjectionOptions.prototype.worldExtent;


/**
 * Function to determine resolution at a point. The function is called with a
 * `{number}` view resolution and an `{ol.Coordinate}` as arguments, and returns
 * the `{number}` resolution at the passed coordinate.
 * @type {(function(number, ol.Coordinate):number|undefined)}
 * @api
 */
olx.ProjectionOptions.prototype.getPointResolution;


/**
 * Object literal with config options for the view.
 * @typedef {{center: (ol.Coordinate|undefined),
 *     constrainRotation: (boolean|number|undefined),
 *     enableRotation: (boolean|undefined),
 *     extent: (ol.Extent|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     minZoom: (number|undefined),
 *     maxZoom: (number|undefined),
 *     projection: ol.ProjectionLike,
 *     resolution: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     rotation: (number|undefined),
 *     zoom: (number|undefined),
 *     zoomFactor: (number|undefined)}}
 */
olx.ViewOptions;


/**
 * The initial center for the view. The coordinate system for the center is
 * specified with the `projection` option. Default is `undefined`, and layer
 * sources will not be fetched if this is not set.
 * @type {ol.Coordinate|undefined}
 * @api stable
 */
olx.ViewOptions.prototype.center;


/**
 * Rotation constraint. `false` means no constraint. `true` means no constraint,
 * but snap to zero near zero. A number constrains the rotation to that number
 * of values. For example, `4` will constrain the rotation to 0, 90, 180, and
 * 270 degrees. The default is `true`.
 * @type {boolean|number|undefined}
 * @api
 */
olx.ViewOptions.prototype.constrainRotation;


/**
 * Enable rotation. Default is `true`. If `false` a rotation constraint that
 * always sets the rotation to zero is used. The `constrainRotation` option
 * has no effect if `enableRotation` is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.ViewOptions.prototype.enableRotation;


/**
 * The extent that constrains the center, in other words, center cannot be set
 * outside this extent. Default is `undefined`.
 * @type {ol.Extent|undefined}
 * @api
 */
olx.ViewOptions.prototype.extent;


/**
 * The maximum resolution used to determine the resolution constraint. It is
 * used together with `minResolution` (or `maxZoom`) and `zoomFactor`. If
 * unspecified it is calculated in such a way that the projection's validity
 * extent fits in a 256x256 px tile. If the projection is Spherical Mercator
 * (the default) then `maxResolution` defaults to `40075016.68557849 / 256 =
 * 156543.03392804097`.
 * @type {number|undefined}
 * @api stable
 */
olx.ViewOptions.prototype.maxResolution;


/**
 * The minimum resolution used to determine the resolution constraint.  It is
 * used together with `maxResolution` (or `minZoom`) and `zoomFactor`.  If
 * unspecified it is calculated assuming 29 zoom levels (with a factor of 2).
 * If the projection is Spherical Mercator (the default) then `minResolution`
 * defaults to `40075016.68557849 / 256 / Math.pow(2, 28) =
 * 0.0005831682455839253`.
 * @type {number|undefined}
 * @api stable
 */
olx.ViewOptions.prototype.minResolution;


/**
 * The maximum zoom level used to determine the resolution constraint. It is
 * used together with `minZoom` (or `maxResolution`) and `zoomFactor`. Default
 * is `28`.  Note that if `minResolution` is also provided, it is given
 * precedence over `maxZoom`.
 * @type {number|undefined}
 * @api stable
 */
olx.ViewOptions.prototype.maxZoom;


/**
 * The minimum zoom level used to determine the resolution constraint. It is
 * used together with `maxZoom` (or `minResolution`) and `zoomFactor`. Default
 * is `0`. Note that if `maxResolution` is also provided, it is given
 * precedence over `minZoom`.
 * @type {number|undefined}
 * @api stable
 */
olx.ViewOptions.prototype.minZoom;


/**
 * The projection. Default is `EPSG:3857` (Spherical Mercator).
 * @type {ol.ProjectionLike}
 * @api stable
 */
olx.ViewOptions.prototype.projection;


/**
 * The initial resolution for the view. The units are `projection` units per
 * pixel (e.g. meters per pixel). An alternative to setting this is to set
 * `zoom`. Default is `undefined`, and layer sources will not be fetched if
 * neither this nor `zoom` are defined.
 * @type {number|undefined}
 * @api stable
 */
olx.ViewOptions.prototype.resolution;


/**
 * Resolutions to determine the resolution constraint. If set the
 * `maxResolution`, `minResolution`, `minZoom`, `maxZoom`, and `zoomFactor`
 * options are ignored.
 * @type {Array.<number>|undefined}
 * @api stable
 */
olx.ViewOptions.prototype.resolutions;


/**
 * The initial rotation for the view in radians (positive rotation clockwise).
 * Default is `0`.
 * @type {number|undefined}
 * @api stable
 */
olx.ViewOptions.prototype.rotation;


/**
 * Only used if `resolution` is not defined. Zoom level used to calculate the
 * initial resolution for the view. The initial resolution is determined using
 * the `ol.View#constrainResolution` method.
 * @type {number|undefined}
 * @api stable
 */
olx.ViewOptions.prototype.zoom;


/**
 * The zoom factor used to determine the resolution constraint.  Default is `2`.
 * @type {number|undefined}
 * @api stable
 */
olx.ViewOptions.prototype.zoomFactor;


/**
 * Namespace.
 * @type {Object}
 */
olx.animation;


/**
 * @typedef {{resolution: number,
 *     start: (number|undefined),
 *     duration: (number|undefined),
 *     easing: (function(number):number|undefined)}}
 */
olx.animation.BounceOptions;


/**
 * The resolution to start the bounce from, typically
 * `map.getView().getResolution()`.
 * @type {number}
 * @api
 */
olx.animation.BounceOptions.prototype.resolution;


/**
 * The start time of the animation. Default is immediately.
 * @type {number|undefined}
 * @api
 */
olx.animation.BounceOptions.prototype.start;


/**
 * The duration of the animation in milliseconds. Default is `1000`.
 * @type {number|undefined}
 * @api
 */
olx.animation.BounceOptions.prototype.duration;


/**
 * The easing function to use. Can be an {@link ol.easing} or a custom function.
 * Default is {@link ol.easing.upAndDown}.
 * @type {function(number):number|undefined}
 * @api
 */
olx.animation.BounceOptions.prototype.easing;


/**
 * @typedef {{source: ol.Coordinate,
 *     start: (number|undefined),
 *     duration: (number|undefined),
 *     easing: (function(number):number|undefined)}}
 */
olx.animation.PanOptions;


/**
 * The location to start panning from, typically `map.getView().getCenter()`.
 * @type {ol.Coordinate}
 * @api
 */
olx.animation.PanOptions.prototype.source;


/**
 * The start time of the animation. Default is immediately.
 * @type {number|undefined}
 * @api
 */
olx.animation.PanOptions.prototype.start;


/**
 * The duration of the animation in milliseconds. Default is `1000`.
 * @type {number|undefined}
 * @api
 */
olx.animation.PanOptions.prototype.duration;


/**
 * The easing function to use. Can be an {@link ol.easing} or a custom function.
 * Default is {@link ol.easing.inAndOut}.
 * @type {function(number):number|undefined}
 * @api
 */
olx.animation.PanOptions.prototype.easing;


/**
 * @typedef {{rotation: (number|undefined),
 *     anchor: (ol.Coordinate|undefined),
 *     start: (number|undefined),
 *     duration: (number|undefined),
 *     easing: (function(number):number|undefined)}}
 */
olx.animation.RotateOptions;


/**
 * The rotation value (in radians) to begin rotating from, typically
 * `map.getView().getRotation()`. If `undefined` then `0` is assumed.
 * @type {number|undefined}
 * @api
 */
olx.animation.RotateOptions.prototype.rotation;


/**
 * The rotation center/anchor. The map rotates around the center of the view
 * if unspecified.
 * @type {ol.Coordinate|undefined}
 * @api
 */
olx.animation.RotateOptions.prototype.anchor;


/**
 * The start time of the animation. Default is immediately.
 * @type {number|undefined}
 * @api
 */
olx.animation.RotateOptions.prototype.start;


/**
 * The duration of the animation in milliseconds. Default is `1000`.
 * @type {number|undefined}
 * @api
 */
olx.animation.RotateOptions.prototype.duration;


/**
 * The easing function to use. Can be an {@link ol.easing} or a custom function.
 * Default is {@link ol.easing.inAndOut}.
 * @type {function(number):number|undefined}
 * @api
 */
olx.animation.RotateOptions.prototype.easing;


/**
 * @typedef {{resolution: number,
 *     start: (number|undefined),
 *     duration: (number|undefined),
 *     easing: (function(number):number|undefined)}}
 */
olx.animation.ZoomOptions;


/**
 * number The resolution to begin zooming from, typically
 * `map.getView().getResolution()`.
 * @type {number}
 * @api
 */
olx.animation.ZoomOptions.prototype.resolution;


/**
 * The start time of the animation. Default is immediately.
 * @type {number|undefined}
 * @api
 */
olx.animation.ZoomOptions.prototype.start;


/**
 * The duration of the animation in milliseconds. Default is `1000`.
 * @type {number|undefined}
 * @api
 */
olx.animation.ZoomOptions.prototype.duration;


/**
 * The easing function to use. Can be an {@link ol.easing} or a custom function.
 * Default is {@link ol.easing.inAndOut}.
 * @type {function(number):number|undefined}
 * @api
 */
olx.animation.ZoomOptions.prototype.easing;


/**
 * Namespace.
 * @type {Object}
 */
olx.control;


/**
 * @typedef {{className: (string|undefined),
 *     collapsible: (boolean|undefined),
 *     collapsed: (boolean|undefined),
 *     tipLabel: (string|undefined),
 *     label: (string|Node|undefined),
 *     collapseLabel: (string|Node|undefined),
 *     render: (function(ol.MapEvent)|undefined),
 *     target: (Element|undefined)}}
 */
olx.control.AttributionOptions;


/**
 * CSS class name. Default is `ol-attribution`.
 * @type {string|undefined}
 * @api
 */
olx.control.AttributionOptions.prototype.className;


/**
 * Target.
 * @type {Element|undefined}
 * @api
 */
olx.control.AttributionOptions.prototype.target;


/**
 * Specify if attributions can be collapsed. If you use an OSM source,
 * should be set to `false` — see
 * {@link http://www.openstreetmap.org/copyright OSM Copyright} —
 * Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.control.AttributionOptions.prototype.collapsible;


/**
 * Specify if attributions should be collapsed at startup. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.control.AttributionOptions.prototype.collapsed;


/**
 * Text label to use for the button tip. Default is `Attributions`
 * @type {string|undefined}
 * @api
 */
olx.control.AttributionOptions.prototype.tipLabel;


/**
 * Text label to use for the collapsed attributions button. Default is `i`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * @type {string|Node|undefined}
 * @api
 */
olx.control.AttributionOptions.prototype.label;


/**
 * Text label to use for the expanded attributions button. Default is `»`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * @type {string|Node|undefined}
 * @api
 */
olx.control.AttributionOptions.prototype.collapseLabel;


/**
 * Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * @type {function(ol.MapEvent)|undefined}
 * @api
 */
olx.control.AttributionOptions.prototype.render;


/**
 * @typedef {{element: (Element|undefined),
 *     render: (function(ol.MapEvent)|undefined),
 *     target: (Element|string|undefined)}}
 */
olx.control.ControlOptions;


/**
 * The element is the control's container element. This only needs to be
 * specified if you're developing a custom control.
 * @type {Element|undefined}
 * @api stable
 */
olx.control.ControlOptions.prototype.element;


/**
 * Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * @type {function(ol.MapEvent)|undefined}
 * @api
 */
olx.control.ControlOptions.prototype.render;


/**
 * Specify a target if you want the control to be rendered outside of the map's
 * viewport.
 * @type {Element|string|undefined}
 * @api stable
 */
olx.control.ControlOptions.prototype.target;


/**
 * @typedef {{attribution: (boolean|undefined),
 *     attributionOptions: (olx.control.AttributionOptions|undefined),
 *     rotate: (boolean|undefined),
 *     rotateOptions: (olx.control.RotateOptions|undefined),
 *     zoom: (boolean|undefined),
 *     zoomOptions: (olx.control.ZoomOptions|undefined)}}
 */
olx.control.DefaultsOptions;


/**
 * Attribution. Default is `true`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.control.DefaultsOptions.prototype.attribution;


/**
 * Attribution options.
 * @type {olx.control.AttributionOptions|undefined}
 * @api
 */
olx.control.DefaultsOptions.prototype.attributionOptions;


/**
 * Rotate. Default is `true`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.control.DefaultsOptions.prototype.rotate;


/**
 * Rotate options.
 * @type {olx.control.RotateOptions|undefined}
 * @api
 */
olx.control.DefaultsOptions.prototype.rotateOptions;


/**
 * Zoom. Default is `true`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.control.DefaultsOptions.prototype.zoom;


/**
 * Zoom options.
 * @type {olx.control.ZoomOptions|undefined}
 * @api
 */
olx.control.DefaultsOptions.prototype.zoomOptions;


/**
 * @typedef {{className: (string|undefined),
 *     label: (string|Node|undefined),
 *     labelActive: (string|Node|undefined),
 *     tipLabel: (string|undefined),
 *     keys: (boolean|undefined),
 *     target: (Element|undefined),
 *     source: (Element|string|undefined)}}
 */
olx.control.FullScreenOptions;


/**
 * CSS class name. Default is `ol-full-screen`.
 * @type {string|undefined}
 * @api
 */
olx.control.FullScreenOptions.prototype.className;


/**
 * Text label to use for the button. Default is `\u2922` (NORTH EAST AND SOUTH WEST ARROW).
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * @type {string|Node|undefined}
 * @api
 */
olx.control.FullScreenOptions.prototype.label;


/**
 * Text label to use for the button when full-screen is active.
 * Default is `\u00d7` (a cross).
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * @type {string|Node|undefined}
 * @api
 */
olx.control.FullScreenOptions.prototype.labelActive;


/**
 * Text label to use for the button tip. Default is `Toggle full-screen`
 * @type {string|undefined}
 * @api
 */
olx.control.FullScreenOptions.prototype.tipLabel;


/**
 * Full keyboard access.
 * @type {boolean|undefined}
 * @api
 */
olx.control.FullScreenOptions.prototype.keys;


/**
 * Target.
 * @type {Element|undefined}
 * @api
 */
olx.control.FullScreenOptions.prototype.target;

/**
 * The element to be displayed fullscreen. When not provided, the element containing the map viewport will be displayed fullscreen.
 * @type {Element|string|undefined}
 * @api
 */
olx.control.FullScreenOptions.prototype.source;

/**
 * @typedef {{className: (string|undefined),
 *     coordinateFormat: (ol.CoordinateFormatType|undefined),
 *     projection: ol.ProjectionLike,
 *     render: (function(ol.MapEvent)|undefined),
 *     target: (Element|undefined),
 *     undefinedHTML: (string|undefined)}}
 */
olx.control.MousePositionOptions;


/**
 * CSS class name. Default is `ol-mouse-position`.
 * @type {string|undefined}
 * @api stable
 */
olx.control.MousePositionOptions.prototype.className;


/**
 * Coordinate format.
 * @type {ol.CoordinateFormatType|undefined}
 * @api stable
 */
olx.control.MousePositionOptions.prototype.coordinateFormat;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api stable
 */
olx.control.MousePositionOptions.prototype.projection;


/**
 * Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * @type {function(ol.MapEvent)|undefined}
 * @api
 */
olx.control.MousePositionOptions.prototype.render;


/**
 * Target.
 * @type {Element|undefined}
 * @api stable
 */
olx.control.MousePositionOptions.prototype.target;


/**
 * Markup for undefined coordinates. Default is `` (empty string).
 * @type {string|undefined}
 * @api stable
 */
olx.control.MousePositionOptions.prototype.undefinedHTML;


/**
 * @typedef {{collapsed: (boolean|undefined),
 *     collapseLabel: (string|Node|undefined),
 *     collapsible: (boolean|undefined),
 *     label: (string|Node|undefined),
 *     layers: (Array.<ol.layer.Layer>|ol.Collection.<ol.layer.Layer>|undefined),
 *     render: (function(ol.MapEvent)|undefined),
 *     target: (Element|undefined),
 *     tipLabel: (string|undefined),
 *     view: (ol.View|undefined)}}
 */
olx.control.OverviewMapOptions;


/**
 * Whether the control should start collapsed or not (expanded).
 * Default to `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.control.OverviewMapOptions.prototype.collapsed;


/**
 * Text label to use for the expanded overviewmap button. Default is `«`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * @type {string|Node|undefined}
 * @api
 */
olx.control.OverviewMapOptions.prototype.collapseLabel;


/**
 * Whether the control can be collapsed or not. Default to `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.control.OverviewMapOptions.prototype.collapsible;


/**
 * Text label to use for the collapsed overviewmap button. Default is `»`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * @type {string|Node|undefined}
 * @api
 */
olx.control.OverviewMapOptions.prototype.label;


/**
 * Layers for the overview map. If not set, then all main map layers are used
 * instead.
 * @type {Array.<ol.layer.Layer>|ol.Collection.<ol.layer.Layer>|undefined}
 * @api
 */
olx.control.OverviewMapOptions.prototype.layers;


/**
 * Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * @type {function(ol.MapEvent)|undefined}
 * @api
 */
olx.control.OverviewMapOptions.prototype.render;


/**
 * Specify a target if you want the control to be rendered outside of the map's
 * viewport.
 * @type {Element|undefined}
 * @api
 */
olx.control.OverviewMapOptions.prototype.target;


/**
 * Text label to use for the button tip. Default is `Overview map`
 * @type {string|undefined}
 * @api
 */
olx.control.OverviewMapOptions.prototype.tipLabel;


/**
 * Custom view for the overview map. If not provided, a default view with
 * an EPSG:3857 projection will be used.
 * @type {ol.View|undefined}
 * @api
 */
olx.control.OverviewMapOptions.prototype.view;


/**
 * @typedef {{className: (string|undefined),
 *     minWidth: (number|undefined),
 *     render: (function(ol.MapEvent)|undefined),
 *     target: (Element|undefined),
 *     units: (ol.control.ScaleLine.Units|string|undefined)}}
 */
olx.control.ScaleLineOptions;


/**
 * CSS Class name. Default is `ol-scale-line`.
 * @type {string|undefined}
 * @api stable
 */
olx.control.ScaleLineOptions.prototype.className;


/**
 * Minimum width in pixels. Default is `64`.
 * @type {number|undefined}
 * @api stable
 */
olx.control.ScaleLineOptions.prototype.minWidth;


/**
 * Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * @type {function(ol.MapEvent)|undefined}
 * @api
 */
olx.control.ScaleLineOptions.prototype.render;


/**
 * Target.
 * @type {Element|undefined}
 * @api stable
 */
olx.control.ScaleLineOptions.prototype.target;


/**
 * Units. Default is `metric`.
 * @type {ol.control.ScaleLine.Units|string|undefined}
 * @api stable
 */
olx.control.ScaleLineOptions.prototype.units;


/**
 * @typedef {{duration: (number|undefined),
 *     className: (string|undefined),
 *     label: (string|Element|undefined),
 *     tipLabel: (string|undefined),
 *     target: (Element|undefined),
 *     render: (function(ol.MapEvent)|undefined),
 *     resetNorth: (function()|undefined),
 *     autoHide: (boolean|undefined)}}
 */
olx.control.RotateOptions;


/**
 * CSS class name. Default is `ol-rotate`.
 * @type {string|undefined}
 * @api stable
 */
olx.control.RotateOptions.prototype.className;


/**
 * Text label to use for the rotate button. Default is `⇧`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * @type {string|Element|undefined}
 * @api stable
 */
olx.control.RotateOptions.prototype.label;


/**
 * Text label to use for the rotate tip. Default is `Reset rotation`
 * @type {string|undefined}
 * @api stable
 */
olx.control.RotateOptions.prototype.tipLabel;


/**
 * Animation duration in milliseconds. Default is `250`.
 * @type {number|undefined}
 * @api stable
 */
olx.control.RotateOptions.prototype.duration;


/**
 * Hide the control when rotation is 0. Default is `true`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.control.RotateOptions.prototype.autoHide;


/**
 * Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * @type {function(ol.MapEvent)|undefined}
 * @api
 */
olx.control.RotateOptions.prototype.render;


/**
 * Function called when the control is clicked. This will override the
 * default resetNorth.
 * @type {function()|undefined}
 * @api
 */
olx.control.RotateOptions.prototype.resetNorth;


/**
 * Target.
 * @type {Element|undefined}
 * @api stable
 */
olx.control.RotateOptions.prototype.target;


/**
 * @typedef {{duration: (number|undefined),
 *     className: (string|undefined),
 *     zoomInLabel: (string|Node|undefined),
 *     zoomOutLabel: (string|Node|undefined),
 *     zoomInTipLabel: (string|undefined),
 *     zoomOutTipLabel: (string|undefined),
 *     delta: (number|undefined),
 *     target: (Element|undefined)}}
 */
olx.control.ZoomOptions;


/**
 * Animation duration in milliseconds. Default is `250`.
 * @type {number|undefined}
 * @api stable
 */
olx.control.ZoomOptions.prototype.duration;


/**
 * CSS class name. Default is `ol-zoom`.
 * @type {string|undefined}
 * @api stable
 */
olx.control.ZoomOptions.prototype.className;


/**
 * Text label to use for the zoom-in button. Default is `+`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * @type {string|Node|undefined}
 * @api stable
 */
olx.control.ZoomOptions.prototype.zoomInLabel;


/**
 * Text label to use for the zoom-out button. Default is `-`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * @type {string|Node|undefined}
 * @api stable
 */
olx.control.ZoomOptions.prototype.zoomOutLabel;


/**
 * Text label to use for the button tip. Default is `Zoom in`
 * @type {string|undefined}
 * @api stable
 */
olx.control.ZoomOptions.prototype.zoomInTipLabel;


/**
 * Text label to use for the button tip. Default is `Zoom out`
 * @type {string|undefined}
 * @api stable
 */
olx.control.ZoomOptions.prototype.zoomOutTipLabel;


/**
 * The zoom delta applied on each click.
 * @type {number|undefined}
 * @api stable
 */
olx.control.ZoomOptions.prototype.delta;


/**
 * Target.
 * @type {Element|undefined}
 * @api stable
 */
olx.control.ZoomOptions.prototype.target;


/**
 * @typedef {{className: (string|undefined),
 *     duration: (number|undefined),
 *     maxResolution: (number|undefined),
 *     minResolution: (number|undefined),
 *     render: (function(ol.MapEvent)|undefined)}}
 */
olx.control.ZoomSliderOptions;


/**
 * CSS class name.
 * @type {string|undefined}
 * @api stable
 */
olx.control.ZoomSliderOptions.prototype.className;


/**
 * Animation duration in milliseconds. Default is `200`.
 * @type {number|undefined}
 * @api
 */
olx.control.ZoomSliderOptions.prototype.duration;


/**
 * Maximum resolution.
 * @type {number|undefined}
 * @api stable
 */
olx.control.ZoomSliderOptions.prototype.maxResolution;


/**
 * Minimum resolution.
 * @type {number|undefined}
 * @api stable
 */
olx.control.ZoomSliderOptions.prototype.minResolution;


/**
 * Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * @type {function(ol.MapEvent)|undefined}
 * @api
 */
olx.control.ZoomSliderOptions.prototype.render;


/**
 * @typedef {{className: (string|undefined),
 *     target: (Element|undefined),
 *     label: (string|Node|undefined),
 *     tipLabel: (string|undefined),
 *     extent: (ol.Extent|undefined)}}
 */
olx.control.ZoomToExtentOptions;


/**
 * Class name. Default is `ol-zoom-extent`.
 * @type {string|undefined}
 * @api stable
 */
olx.control.ZoomToExtentOptions.prototype.className;


/**
 * Target.
 * @type {Element|undefined}
 * @api stable
 */
olx.control.ZoomToExtentOptions.prototype.target;


/**
 * Text label to use for the button. Default is `E`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * @type {string|Node|undefined}
 * @api stable
 */
olx.control.ZoomToExtentOptions.prototype.label;


/**
 * Text label to use for the button tip. Default is `Zoom to extent`
 * @type {string|undefined}
 * @api stable
 */
olx.control.ZoomToExtentOptions.prototype.tipLabel;


/**
 * The extent to zoom to. If undefined the validity extent of the view
 * projection is used.
 * @type {ol.Extent|undefined}
 * @api stable
 */
olx.control.ZoomToExtentOptions.prototype.extent;


/**
 * Namespace.
 * @type {Object}
 */
olx.format;


/**
 * @typedef {{dataProjection: ol.ProjectionLike,
 *     featureProjection: ol.ProjectionLike,
 *     rightHanded: (boolean|undefined)}}
 */
olx.format.ReadOptions;


/**
 * Projection of the data we are reading. If not provided, the projection will
 * be derived from the data (where possible) or the `defaultDataProjection` of
 * the format is assigned (where set). If the projection can not be derived from
 * the data and if no `defaultDataProjection` is set for a format, the features
 * will not be reprojected.
 * @type {ol.ProjectionLike}
 * @api stable
 */
olx.format.ReadOptions.prototype.dataProjection;


/**
 * Projection of the feature geometries created by the format reader. If not
 * provided, features will be returned in the `dataProjection`.
 * @type {ol.ProjectionLike}
 * @api stable
 */
olx.format.ReadOptions.prototype.featureProjection;


/**
 * @typedef {{dataProjection: ol.ProjectionLike,
 *     featureProjection: ol.ProjectionLike,
 *     rightHanded: (boolean|undefined),
 *     decimals: (number|undefined)}}
 */
olx.format.WriteOptions;


/**
 * Projection of the data we are writing. If not provided, the
 * `defaultDataProjection` of the format is assigned (where set). If no
 * `defaultDataProjection` is set for a format, the features will be returned
 * in the `featureProjection`.
 * @type {ol.ProjectionLike}
 * @api stable
 */
olx.format.WriteOptions.prototype.dataProjection;


/**
 * Projection of the feature geometries that will be serialized by the format
 * writer. If not provided, geometries are assumed to be in the
 * `dataProjection` if that is set; in other words, they are not transformed.
 * @type {ol.ProjectionLike}
 * @api stable
 */
olx.format.WriteOptions.prototype.featureProjection;


/**
 * When writing geometries, follow the right-hand rule for linear ring
 * orientation.  This means that polygons will have counter-clockwise exterior
 * rings and clockwise interior rings.  By default, coordinates are serialized
 * as they are provided at construction.  If `true`, the right-hand rule will
 * be applied.  If `false`, the left-hand rule will be applied (clockwise for
 * exterior and counter-clockwise for interior rings).  Note that not all
 * formats support this.  The GeoJSON format does use this property when writing
 * geometries.
 *
 * @type {boolean|undefined}
 * @api stable
 */
olx.format.WriteOptions.prototype.rightHanded;


/**
 * Maximum number of decimal places for coordinates. Coordinates are stored
 * internally as floats, but floating-point arithmetic can create coordinates
 * with a large number of decimal places, not generally wanted on output.
 * Set a number here to round coordinates. Can also be used to ensure that
 * coordinates read in can be written back out with the same number of decimals.
 * Default is no rounding.
 *
 * @type {number|undefined}
 * @api
 */
olx.format.WriteOptions.prototype.decimals;


/**
 * @typedef {{defaultDataProjection: ol.ProjectionLike,
 *     geometryName: (string|undefined)}}
 */
olx.format.GeoJSONOptions;


/**
 * Default data projection. Default is `EPSG:4326`.
 * @type {ol.ProjectionLike}
 * @api stable
 */
olx.format.GeoJSONOptions.prototype.defaultDataProjection;


/**
 * Geometry name to use when creating features.
 * @type {string|undefined}
 * @api stable
 */
olx.format.GeoJSONOptions.prototype.geometryName;


/**
 * @typedef {{geometryName: (string|undefined)}}
 */
olx.format.EsriJSONOptions;


/**
 * Geometry name to use when creating features.
 * @type {string|undefined}
 * @api
 */
olx.format.EsriJSONOptions.prototype.geometryName;


/**
 * @typedef {{featureClass: (function((ol.geom.Geometry|Object.<string, *>)=)|
 *         function(ol.geom.GeometryType,Array.<number>,
 *             (Array.<number>|Array.<Array.<number>>),Object.<string, *>)|
 *         undefined),
 *     geometryName: (string|undefined),
 *     layers: (Array.<string>|undefined),
 *     layerName: (string|undefined)}}
 */
olx.format.MVTOptions;


/**
 * Class for features returned by {@link ol.format.MVT#readFeatures}. Set to
 * {@link ol.Feature} to get full editing and geometry support at the cost of
 * decreased rendering performance. The default is {@link ol.render.Feature},
 * which is optimized for rendering and hit detection.
 * @type {undefined|function((ol.geom.Geometry|Object.<string, *>)=)|
 *     function(ol.geom.GeometryType,Array.<number>,
 *         (Array.<number>|Array.<Array.<number>>),Object.<string, *>)}
 * @api
 */
olx.format.MVTOptions.prototype.featureClass;


/**
 * Geometry name to use when creating features. Default is 'geometry'.
 * @type {string|undefined}
 * @api
 */
olx.format.MVTOptions.prototype.geometryName;


/**
 * Name of the feature attribute that holds the layer name. Default is 'layer'.
 * @type {string|undefined}
 * @api
 */
olx.format.MVTOptions.prototype.layerName;


/**
 * Layers to read features from. If not provided, features will be read from all
 * layers.
 * @type {Array.<string>|undefined}
 * @api
 */
olx.format.MVTOptions.prototype.layers;


/**
 * @typedef {{factor: (number|undefined),
 *     geometryLayout: (ol.geom.GeometryLayout|undefined)}}
 */
olx.format.PolylineOptions;


/**
 * The factor by which the coordinates values will be scaled.
 * Default is `1e5`.
 * @type {number|undefined}
 * @api stable
 */
olx.format.PolylineOptions.prototype.factor;


/**
 * Layout of the feature geometries created by the format reader.
 * Default is `ol.geom.GeometryLayout.XY`.
 * @type {ol.geom.GeometryLayout|undefined}
 * @api
 */
olx.format.PolylineOptions.prototype.geometryLayout;


/**
 * @typedef {{defaultDataProjection: ol.ProjectionLike}}
 */
olx.format.TopoJSONOptions;


/**
 * Default data projection. Default is `EPSG:4326`.
 * @type {ol.ProjectionLike}
 * @api stable
 */
olx.format.TopoJSONOptions.prototype.defaultDataProjection;


/**
 * @typedef {{altitudeMode: (ol.format.IGCZ|undefined)}}
 */
olx.format.IGCOptions;


/**
 * Altitude mode. Possible values are `barometric`, `gps`, and `none`. Default
 * is `none`.
 * @type {ol.format.IGCZ|undefined}
 * @api
 */
olx.format.IGCOptions.prototype.altitudeMode;


/**
 * @typedef {{extractStyles: (boolean|undefined),
 *     defaultStyle: (Array.<ol.style.Style>|undefined),
 *     showPointNames: (boolean|undefined),
 *     writeStyles: (boolean|undefined)}}
 */
olx.format.KMLOptions;


/**
 * Extract styles from the KML. Default is `true`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.format.KMLOptions.prototype.extractStyles;


/**
 * Show names as labels for placemarks which contain points. Default is `true`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.format.KMLOptions.prototype.showPointNames;


/**
 * Default style. The default default style is the same as Google Earth.
 * @type {Array.<ol.style.Style>|undefined}
 * @api stable
 */
olx.format.KMLOptions.prototype.defaultStyle;


/**
 * Write styles into KML. Default is `true`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.format.KMLOptions.prototype.writeStyles;


/**
 * @typedef {{featureNS: (Object.<string, string>|string|undefined),
 *     featureType: (Array.<string>|string|undefined),
 *     srsName: string,
 *     surface: (boolean|undefined),
 *     curve: (boolean|undefined),
 *     multiCurve: (boolean|undefined),
 *     multiSurface: (boolean|undefined),
 *     schemaLocation: (string|undefined)}}
 */
olx.format.GMLOptions;


/**
 * Feature namespace. If not defined will be derived from GML. If multiple
 * feature types have been configured which come from different feature
 * namespaces, this will be an object with the keys being the prefixes used
 * in the entries of featureType array. The values of the object will be the
 * feature namespaces themselves. So for instance there might be a featureType
 * item `topp:states` in the `featureType` array and then there will be a key
 * `topp` in the featureNS object with value `http://www.openplans.org/topp`.
 * @type {Object.<string, string>|string|undefined}
 * @api stable
 */
olx.format.GMLOptions.prototype.featureNS;


/**
 * Feature type(s) to parse. If multiple feature types need to be configured
 * which come from different feature namespaces, `featureNS` will be an object
 * with the keys being the prefixes used in the entries of featureType array.
 * The values of the object will be the feature namespaces themselves.
 * So for instance there might be a featureType item `topp:states` and then
 * there will be a key named `topp` in the featureNS object with value
 * `http://www.openplans.org/topp`.
 * @type {Array.<string>|string|undefined}
 * @api stable
 */
olx.format.GMLOptions.prototype.featureType;


/**
 * srsName to use when writing geometries.
 * @type {string}
 * @api
 */
olx.format.GMLOptions.prototype.srsName;


/**
 * Write gml:Surface instead of gml:Polygon elements. This also affects the
 * elements in multi-part geometries. Default is `false`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.format.GMLOptions.prototype.surface;


/**
 * Write gml:Curve instead of gml:LineString elements. This also affects the
 * elements in multi-part geometries. Default is `false`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.format.GMLOptions.prototype.curve;


/**
 * Write gml:MultiCurve instead of gml:MultiLineString. Since the latter is
 * deprecated in GML 3, the default is `true`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.format.GMLOptions.prototype.multiCurve;


/**
 * Write gml:multiSurface instead of gml:MultiPolygon. Since the latter is
 * deprecated in GML 3, the default is `true`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.format.GMLOptions.prototype.multiSurface;


/**
 * Optional schemaLocation to use when writing out the GML, this will override
 * the default provided.
 * @type {string|undefined}
 * @api stable
 */
olx.format.GMLOptions.prototype.schemaLocation;


/**
 * @typedef {{readExtensions: (function(ol.Feature, Node)|undefined)}}
 */
olx.format.GPXOptions;


/**
 * Callback function to process `extensions` nodes.
 * To prevent memory leaks, this callback function must
 * not store any references to the node. Note that the `extensions`
 * node is not allowed in GPX 1.0. Moreover, only `extensions`
 * nodes from `wpt`, `rte` and `trk` can be processed, as those are
 * directly mapped to a feature.
 * @type {function(ol.Feature, Node)|undefined}
 * @api stable
 */
olx.format.GPXOptions.prototype.readExtensions;


/**
 * @typedef {{featureNS: (Object.<string, string>|string|undefined),
 *     featureType: (Array.<string>|string|undefined),
 *     gmlFormat: (ol.format.GMLBase|undefined),
 *     schemaLocation: (string|undefined)}}
 */
olx.format.WFSOptions;


/**
 * The namespace URI used for features.
 * @type {Object.<string, string>|string|undefined}
 * @api stable
 */
olx.format.WFSOptions.prototype.featureNS;


/**
 * The feature type to parse. Only used for read operations.
 * @type {Array.<string>|string|undefined}
 * @api stable
 */
olx.format.WFSOptions.prototype.featureType;


/**
 * The GML format to use to parse the response. Default is `ol.format.GML3`.
 * @type {ol.format.GMLBase|undefined}
 * @api
 */
olx.format.WFSOptions.prototype.gmlFormat;


/**
 * Optional schemaLocation to use for serialization, this will override the
 * default.
 * @type {string|undefined}
 * @api stable
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
 *     propertyNames: (Array.<string>|undefined),
 *     startIndex: (number|undefined),
 *     count: (number|undefined),
 *     bbox: (ol.Extent|undefined),
 *     filter: (ol.format.ogc.filter.Filter|undefined),
 *     resultType: (string|undefined)}}
 */
olx.format.WFSWriteGetFeatureOptions;


/**
 * The namespace URI used for features.
 * @type {string}
 * @api stable
 */
olx.format.WFSWriteGetFeatureOptions.prototype.featureNS;


/**
 * The prefix for the feature namespace.
 * @type {string}
 * @api stable
 */
olx.format.WFSWriteGetFeatureOptions.prototype.featurePrefix;


/**
 * The feature type names.
 * @type {Array.<string>}
 * @api stable
 */
olx.format.WFSWriteGetFeatureOptions.prototype.featureTypes;


/**
 * SRS name. No srsName attribute will be set on geometries when this is not
 * provided.
 * @type {string|undefined}
 * @api
 */
olx.format.WFSWriteGetFeatureOptions.prototype.srsName;


/**
 * Handle.
 * @type {string|undefined}
 * @api stable
 */
olx.format.WFSWriteGetFeatureOptions.prototype.handle;


/**
 * Output format.
 * @type {string|undefined}
 * @api stable
 */
olx.format.WFSWriteGetFeatureOptions.prototype.outputFormat;


/**
 * Maximum number of features to fetch.
 * @type {number|undefined}
 * @api stable
 */
olx.format.WFSWriteGetFeatureOptions.prototype.maxFeatures;


/**
 * Geometry name to use in a BBOX filter.
 * @type {string|undefined}
 * @api
 */
olx.format.WFSWriteGetFeatureOptions.prototype.geometryName;


/**
 * Optional list of property names to serialize.
 * @type {Array.<string>|undefined}
 * @api
 */
olx.format.WFSWriteGetFeatureOptions.prototype.propertyNames;


/**
 * Start index to use for WFS paging. This is a WFS 2.0 feature backported to
 * WFS 1.1.0 by some Web Feature Services.
 * @type {number|undefined}
 * @api
 */
olx.format.WFSWriteGetFeatureOptions.prototype.startIndex;


/**
 * Number of features to retrieve when paging. This is a WFS 2.0 feature
 * backported to WFS 1.1.0 by some Web Feature Services. Please note that some
 * Web Feature Services have repurposed `maxfeatures` instead.
 * @type {number|undefined}
 * @api
 */
olx.format.WFSWriteGetFeatureOptions.prototype.count;


/**
 * Extent to use for the BBOX filter.
 * @type {ol.Extent|undefined}
 * @api
 */
olx.format.WFSWriteGetFeatureOptions.prototype.bbox;


/**
 * OGC filter condition. See {@link ol.format.ogc.filter} for more information.
 * @type {ol.format.ogc.filter.Filter|undefined}
 * @api
 */
olx.format.WFSWriteGetFeatureOptions.prototype.filter;


/**
 * Indicates what response should be returned, E.g. `hits` only includes the
 * `numberOfFeatures` attribute in the response and no features.
 * @type {string|undefined}
 * @api
 */
olx.format.WFSWriteGetFeatureOptions.prototype.resultType;


/**
 * @typedef {{featureNS: string,
 *     featurePrefix: string,
 *     featureType: string,
 *     srsName: (string|undefined),
 *     handle: (string|undefined),
 *     nativeElements: Array.<Object>,
 *     gmlOptions: (olx.format.GMLOptions|undefined)}}
 */
olx.format.WFSWriteTransactionOptions;


/**
 * The namespace URI used for features.
 * @type {string}
 * @api stable
 */
olx.format.WFSWriteTransactionOptions.prototype.featureNS;


/**
 * The prefix for the feature namespace.
 * @type {string}
 * @api stable
 */
olx.format.WFSWriteTransactionOptions.prototype.featurePrefix;


/**
 * The feature type name.
 * @type {string}
 * @api stable
 */
olx.format.WFSWriteTransactionOptions.prototype.featureType;


/**
 * SRS name. No srsName attribute will be set on geometries when this is not
 * provided.
 * @type {string|undefined}
 * @api
 */
olx.format.WFSWriteTransactionOptions.prototype.srsName;


/**
 * Handle.
 * @type {string|undefined}
 * @api stable
 */
olx.format.WFSWriteTransactionOptions.prototype.handle;


/**
 * Native elements. Currently not supported.
 * @type {Array.<Object>}
 * @api
 */
olx.format.WFSWriteTransactionOptions.prototype.nativeElements;


/**
 * GML options for the WFS transaction writer.
 * @type {olx.format.GMLOptions|undefined}
 * @api stable
 */
olx.format.WFSWriteTransactionOptions.prototype.gmlOptions;


/**
 * @typedef {{splitCollection: (boolean|undefined)}}
 */
olx.format.WKTOptions;


/**
 * Whether to split GeometryCollections into
 * multiple features on reading. Default is `false`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.format.WKTOptions.prototype.splitCollection;


/**
 * @typedef {{
 *     layers: (Array.<string>|undefined)
 * }}
 */
olx.format.WMSGetFeatureInfoOptions;


/**
 * If set, only features of the given layers will be returned by the format
 * when read.
 * @type {Array.<string>|undefined}
 * @api
 */
olx.format.WMSGetFeatureInfoOptions.prototype.layers;


/**
 * Namespace.
 * @type {Object}
 */
olx.interaction;


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
 */
olx.interaction.DefaultsOptions;


/**
 * Whether Alt-Shift-drag rotate is desired. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.DefaultsOptions.prototype.altShiftDragRotate;


/**
 * Whether double click zoom is desired. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.DefaultsOptions.prototype.doubleClickZoom;


/**
 * Whether keyboard interaction is desired. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.DefaultsOptions.prototype.keyboard;


/**
 * Whether mousewheel zoom is desired. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.DefaultsOptions.prototype.mouseWheelZoom;


/**
 * Whether Shift-drag zoom is desired. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.DefaultsOptions.prototype.shiftDragZoom;


/**
 * Whether drag pan is desired. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.DefaultsOptions.prototype.dragPan;


/**
 * Whether pinch rotate is desired. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.DefaultsOptions.prototype.pinchRotate;


/**
 * Whether pinch zoom is desired. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.DefaultsOptions.prototype.pinchZoom;


/**
 * Zoom delta.
 * @type {number|undefined}
 * @api
 */
olx.interaction.DefaultsOptions.prototype.zoomDelta;


/**
 * Zoom duration.
 * @type {number|undefined}
 * @api
 */
olx.interaction.DefaultsOptions.prototype.zoomDuration;


/**
 * @typedef {{duration: (number|undefined),
 *     delta: (number|undefined)}}
 */
olx.interaction.DoubleClickZoomOptions;


/**
 * Animation duration in milliseconds. Default is `250`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.DoubleClickZoomOptions.prototype.duration;


/**
 * The zoom delta applied on each double click, default is `1`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.DoubleClickZoomOptions.prototype.delta;


/**
 * @typedef {{formatConstructors: (Array.<function(new: ol.format.Feature)>|undefined),
 *     projection: ol.ProjectionLike,
 *     target: (Element|undefined)}}
 */
olx.interaction.DragAndDropOptions;


/**
 * Format constructors.
 * @type {Array.<function(new: ol.format.Feature)>|undefined}
 * @api
 */
olx.interaction.DragAndDropOptions.prototype.formatConstructors;


/**
 * Target projection. By default, the map's view's projection is used.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.interaction.DragAndDropOptions.prototype.projection;


/**
 * The element that is used as the drop target, default is the viewport element.
 * @type {Element|undefined}
 * @api
 */
olx.interaction.DragAndDropOptions.prototype.target;


/**
 * @typedef {{className: (string|undefined),
 *     condition: (ol.EventsConditionType|undefined),
 *     boxEndCondition: (ol.DragBoxEndConditionType|undefined)}}
 */
olx.interaction.DragBoxOptions;


/**
 * CSS class name for styling the box. The default is `ol-dragbox`.
 * @type {string|undefined}
 * @api
 */
olx.interaction.DragBoxOptions.prototype.className;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.always}.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.DragBoxOptions.prototype.condition;


/**
 * A function that takes a {@link ol.MapBrowserEvent} and two
 * {@link ol.Pixel}s to indicate whether a boxend event should be fired.
 * Default is:
 * ```js
 * function(mapBrowserEvent,
 *     startPixel, endPixel) {
 *   var width = endPixel[0] - startPixel[0];
 *   var height = endPixel[1] - startPixel[1];
 *   return width * width + height * height >=
 *     ol.DRAG_BOX_HYSTERESIS_PIXELS_SQUARED;
 * }
 * ```
 * @type {ol.DragBoxEndConditionType|undefined}
 * @api
 */
olx.interaction.DragBoxOptions.prototype.boxEndCondition;


/**
 * @typedef {{condition: (ol.EventsConditionType|undefined),
 *     kinetic: (ol.Kinetic|undefined)}}
 */
olx.interaction.DragPanOptions;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.noModifierKeys}.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.DragPanOptions.prototype.condition;


/**
 * Kinetic inertia to apply to the pan.
 * @type {ol.Kinetic|undefined}
 * @api
 */
olx.interaction.DragPanOptions.prototype.kinetic;


/**
 * @typedef {{condition: (ol.EventsConditionType|undefined),
 *     duration: (number|undefined)}}
 */
olx.interaction.DragRotateAndZoomOptions;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.shiftKeyOnly}.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.DragRotateAndZoomOptions.prototype.condition;


/**
 * Animation duration in milliseconds. Default is `400`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.DragRotateAndZoomOptions.prototype.duration;


/**
 * @typedef {{condition: (ol.EventsConditionType|undefined),
 *     duration: (number|undefined)}}
 */
olx.interaction.DragRotateOptions;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.altShiftKeysOnly}.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.DragRotateOptions.prototype.condition;


/**
 * Animation duration in milliseconds. Default is `250`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.DragRotateOptions.prototype.duration;


/**
 * @typedef {{className: (string|undefined),
 *     condition: (ol.EventsConditionType|undefined),
 *     duration: (number|undefined),
 *     out: (boolean|undefined)}}
 */
olx.interaction.DragZoomOptions;


/**
 * CSS class name for styling the box. The default is `ol-dragzoom`.
 * @type {string|undefined}
 * @api
 */
olx.interaction.DragZoomOptions.prototype.className;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.shiftKeyOnly}.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.DragZoomOptions.prototype.condition;


/**
 * Animation duration in milliseconds. Default is `200`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.DragZoomOptions.prototype.duration;


/**
 * Use interaction for zooming out. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.DragZoomOptions.prototype.out;


/**
 * @typedef {{clickTolerance: (number|undefined),
 *     features: (ol.Collection.<ol.Feature>|undefined),
 *     source: (ol.source.Vector|undefined),
 *     snapTolerance: (number|undefined),
 *     type: ol.geom.GeometryType,
 *     maxPoints: (number|undefined),
 *     minPoints: (number|undefined),
 *     finishCondition: (ol.EventsConditionType|undefined),
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined),
 *     geometryFunction: (ol.DrawGeometryFunctionType|undefined),
 *     geometryName: (string|undefined),
 *     condition: (ol.EventsConditionType|undefined),
 *     freehandCondition: (ol.EventsConditionType|undefined),
 *     wrapX: (boolean|undefined)}}
 */
olx.interaction.DrawOptions;


/**
 * The maximum distance in pixels between "down" and "up" for a "up" event
 * to be considered a "click" event and actually add a point/vertex to the
 * geometry being drawn.  Default is 6 pixels.  That value was chosen for
 * the draw interaction to behave correctly on mouse as well as on touch
 * devices.
 * @type {number|undefined}
 * @api
 */
olx.interaction.DrawOptions.prototype.clickTolerance;


/**
 * Destination collection for the drawn features.
 * @type {ol.Collection.<ol.Feature>|undefined}
 * @api
 */
olx.interaction.DrawOptions.prototype.features;


/**
 * Destination source for the drawn features.
 * @type {ol.source.Vector|undefined}
 * @api
 */
olx.interaction.DrawOptions.prototype.source;


/**
 * Pixel distance for snapping to the drawing finish. Default is `12`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.DrawOptions.prototype.snapTolerance;


/**
 * Drawing type ('Point', 'LineString', 'Polygon', 'MultiPoint',
 * 'MultiLineString', 'MultiPolygon' or 'Circle').
 * @type {ol.geom.GeometryType}
 * @api
 */
olx.interaction.DrawOptions.prototype.type;


/**
 * The number of points that can be drawn before a polygon ring or line string
 * is finished. The default is no restriction.
 * @type {number|undefined}
 * @api
 */
olx.interaction.DrawOptions.prototype.maxPoints;


/**
 * The number of points that must be drawn before a polygon ring or line string
 * can be finished. Default is `3` for polygon rings and `2` for line strings.
 * @type {number|undefined}
 * @api
 */
olx.interaction.DrawOptions.prototype.minPoints;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether the drawing can be finished.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.DrawOptions.prototype.finishCondition;


/**
 * Style for sketch features.
 * @type {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined}
 * @api
 */
olx.interaction.DrawOptions.prototype.style;


/**
 * Function that is called when a geometry's coordinates are updated.
 * @type {ol.DrawGeometryFunctionType|undefined}
 * @api
 */
olx.interaction.DrawOptions.prototype.geometryFunction;


/**
 * Geometry name to use for features created by the draw interaction.
 * @type {string|undefined}
 * @api
 */
olx.interaction.DrawOptions.prototype.geometryName;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * By default {@link ol.events.condition.noModifierKeys}, i.e. a click, adds a
 * vertex or deactivates freehand drawing.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.DrawOptions.prototype.condition;


/**
 * Condition that activates freehand drawing for lines and polygons. This
 * function takes an {@link ol.MapBrowserEvent} and returns a boolean to
 * indicate whether that event should be handled. The default is
 * {@link ol.events.condition.shiftKeyOnly}, meaning that the Shift key
 * activates freehand drawing.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.DrawOptions.prototype.freehandCondition;


/**
 * Wrap the world horizontally on the sketch overlay. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.DrawOptions.prototype.wrapX;


/**
 * @typedef {{
 *     features: (ol.Collection.<ol.Feature>|undefined),
 *     layers: (undefined|Array.<ol.layer.Layer>|function(ol.layer.Layer): boolean)
 * }}
 */
olx.interaction.TranslateOptions;


/**
 * Only features contained in this collection will be able to be translated. If
 * not specified, all features on the map will be able to be translated.
 * @type {ol.Collection.<ol.Feature>|undefined}
 * @api
 */
olx.interaction.TranslateOptions.prototype.features;


/**
 * A list of layers from which features should be
 * translated. Alternatively, a filter function can be provided. The
 * function will be called for each layer in the map and should return
 * `true` for layers that you want to be translatable. If the option is
 * absent, all visible layers will be considered translatable.
 * @type {undefined|Array.<ol.layer.Layer>|function(ol.layer.Layer): boolean}
 * @api
 */
olx.interaction.TranslateOptions.prototype.layers;


/**
 * @typedef {{condition: (ol.EventsConditionType|undefined),
 *     duration: (number|undefined),
 *     pixelDelta: (number|undefined)}}
 */
olx.interaction.KeyboardPanOptions;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.noModifierKeys} and
 * {@link ol.events.condition.targetNotEditable}.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.KeyboardPanOptions.prototype.condition;


/**
 * Animation duration in milliseconds. Default is `100`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.KeyboardPanOptions.prototype.duration;


/**
 * Pixel The amount to pan on each key press. Default is `128` pixels.
 * @type {number|undefined}
 * @api
 */
olx.interaction.KeyboardPanOptions.prototype.pixelDelta;


/**
 * @typedef {{duration: (number|undefined),
 *     condition: (ol.EventsConditionType|undefined),
 *     delta: (number|undefined)}}
 */
olx.interaction.KeyboardZoomOptions;


/**
 * Animation duration in milliseconds. Default is `100`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.KeyboardZoomOptions.prototype.duration;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.targetNotEditable}.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.KeyboardZoomOptions.prototype.condition;


/**
 * The amount to zoom on each key press. Default is `1`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.KeyboardZoomOptions.prototype.delta;


/**
 * @typedef {{condition: (ol.EventsConditionType|undefined),
 *     deleteCondition: (ol.EventsConditionType|undefined),
 *     pixelTolerance: (number|undefined),
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined),
 *     features: ol.Collection.<ol.Feature>,
 *     wrapX: (boolean|undefined)}}
 */
olx.interaction.ModifyOptions;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event will be considered to add or move a vertex
 * to the sketch.
 * Default is {@link ol.events.condition.primaryAction}.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.ModifyOptions.prototype.condition;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * By default, {@link ol.events.condition.singleClick} with
 * {@link ol.events.condition.noModifierKeys} results in a vertex deletion.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.ModifyOptions.prototype.deleteCondition;


/**
 * Pixel tolerance for considering the pointer close enough to a segment or
 * vertex for editing. Default is `10`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.ModifyOptions.prototype.pixelTolerance;


/**
 * Style used for the features being modified. By default the default edit
 * style is used (see {@link ol.style}).
 * @type {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined}
 * @api
 */
olx.interaction.ModifyOptions.prototype.style;


/**
 * The features the interaction works on.
 * @type {ol.Collection.<ol.Feature>}
 * @api
 */
olx.interaction.ModifyOptions.prototype.features;


/**
 * Wrap the world horizontally on the sketch overlay. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.ModifyOptions.prototype.wrapX;


/**
 * @typedef {{duration: (number|undefined),
 *     useAnchor: (boolean|undefined)}}
 */
olx.interaction.MouseWheelZoomOptions;


/**
 * Animation duration in milliseconds. Default is `250`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.MouseWheelZoomOptions.prototype.duration;


/**
 * Enable zooming using the mouse's location as the anchor. Default is `true`.
 * When set to false, zooming in and out will zoom to the center of the screen
 * instead of zooming on the mouse's location.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.MouseWheelZoomOptions.prototype.useAnchor;


/**
 * @typedef {{threshold: (number|undefined),
 *     duration: (number|undefined)}}
 */
olx.interaction.PinchRotateOptions;


/**
 * The duration of the animation in milliseconds. Default is `250`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.PinchRotateOptions.prototype.duration;


/**
 * Minimal angle in radians to start a rotation. Default is `0.3`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.PinchRotateOptions.prototype.threshold;


/**
 * @typedef {{duration: (number|undefined)}}
 */
olx.interaction.PinchZoomOptions;


/**
 * Animation duration in milliseconds. Default is `400`.
 * @type {number|undefined}
 * @api
 */
olx.interaction.PinchZoomOptions.prototype.duration;


/**
 * @typedef {{handleDownEvent: (function(ol.MapBrowserPointerEvent):boolean|undefined),
 *     handleDragEvent: (function(ol.MapBrowserPointerEvent)|undefined),
 *     handleEvent: (function(ol.MapBrowserEvent):boolean|undefined),
 *     handleMoveEvent: (function(ol.MapBrowserPointerEvent)|undefined),
 *     handleUpEvent: (function(ol.MapBrowserPointerEvent):boolean|undefined)}}
 */
olx.interaction.PointerOptions;


/**
 * Function handling "down" events. If the function returns `true` then a drag
 * sequence is started.
 * @type {(function(ol.MapBrowserPointerEvent):boolean|undefined)}
 * @api
 */
olx.interaction.PointerOptions.prototype.handleDownEvent;


/**
 * Function handling "drag" events. This function is called on "move" events
 * during a drag sequence.
 * @type {(function(ol.MapBrowserPointerEvent)|undefined)}
 * @api
 */
olx.interaction.PointerOptions.prototype.handleDragEvent;


/**
 * Method called by the map to notify the interaction that a browser event was
 * dispatched to the map. The function may return `false` to prevent the
 * propagation of the event to other interactions in the map's interactions
 * chain.
 * @type {(function(ol.MapBrowserEvent):boolean|undefined)}
 * @api
 */
olx.interaction.PointerOptions.prototype.handleEvent;


/**
 * Function handling "move" events. This function is called on "move" events,
 * also during a drag sequence (so during a drag sequence both the
 * `handleDragEvent` function and this function are called).
 * @type {(function(ol.MapBrowserPointerEvent)|undefined)}
 * @api
 */
olx.interaction.PointerOptions.prototype.handleMoveEvent;


/**
 * Function handling "up" events. If the function returns `false` then the
 * current drag sequence is stopped.
 * @type {(function(ol.MapBrowserPointerEvent):boolean|undefined)}
 * @api
 */
olx.interaction.PointerOptions.prototype.handleUpEvent;


/**
 * @typedef {{addCondition: (ol.EventsConditionType|undefined),
 *     condition: (ol.EventsConditionType|undefined),
 *     layers: (undefined|Array.<ol.layer.Layer>|function(ol.layer.Layer): boolean),
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined),
 *     removeCondition: (ol.EventsConditionType|undefined),
 *     toggleCondition: (ol.EventsConditionType|undefined),
 *     multi: (boolean|undefined),
 *     features: (ol.Collection.<ol.Feature>|undefined),
 *     filter: (ol.SelectFilterFunction|undefined),
 *     wrapX: (boolean|undefined)}}
 */
olx.interaction.SelectOptions;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * By default, this is {@link ol.events.condition.never}. Use this if you want
 * to use different events for add and remove instead of `toggle`.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.SelectOptions.prototype.addCondition;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * This is the event for the selected features as a whole. By default, this is
 * {@link ol.events.condition.singleClick}. Clicking on a feature selects that
 * feature and removes any that were in the selection. Clicking outside any
 * feature removes all from the selection.
 * See `toggle`, `add`, `remove` options for adding/removing extra features to/
 * from the selection.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.SelectOptions.prototype.condition;


/**
 * A list of layers from which features should be
 * selected. Alternatively, a filter function can be provided. The
 * function will be called for each layer in the map and should return
 * `true` for layers that you want to be selectable. If the option is
 * absent, all visible layers will be considered selectable.
 * @type {undefined|Array.<ol.layer.Layer>|function(ol.layer.Layer): boolean}
 * @api
 */
olx.interaction.SelectOptions.prototype.layers;


/**
 * Style for the selected features. By default the default edit style is used
 * (see {@link ol.style}).
 * @type {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined}
 * @api
 */
olx.interaction.SelectOptions.prototype.style;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * By default, this is {@link ol.events.condition.never}. Use this if you want
 * to use different events for add and remove instead of `toggle`.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.SelectOptions.prototype.removeCondition;


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * This is in addition to the `condition` event. By default,
 * {@link ol.events.condition.shiftKeyOnly}, i.e. pressing `shift` as well as
 * the `condition` event, adds that feature to the current selection if it is
 * not currently selected, and removes it if it is.
 * See `add` and `remove` if you want to use different events instead of a
 * toggle.
 * @type {ol.EventsConditionType|undefined}
 * @api
 */
olx.interaction.SelectOptions.prototype.toggleCondition;


/**
 * A boolean that determines if the default behaviour should select only
 * single features or all (overlapping) features at the clicked map
 * position. Default is false i.e single select
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.SelectOptions.prototype.multi;

/**
 * Collection where the interaction will place selected features. Optional. If
 * not set the interaction will create a collection. In any case the collection
 * used by the interaction is returned by
 * {@link ol.interaction.Select#getFeatures}.
 * @type {ol.Collection.<ol.Feature>|undefined}
 * @api
 */
olx.interaction.SelectOptions.prototype.features;

/**
 * A function that takes an {@link ol.Feature} and an {@link ol.layer.Layer} and
 * returns `true` if the feature may be selected or `false` otherwise.
 * @type {ol.SelectFilterFunction|undefined}
 * @api
 */
olx.interaction.SelectOptions.prototype.filter;


/**
 * Wrap the world horizontally on the selection overlay. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.SelectOptions.prototype.wrapX;


/**
 * Options for snap
 * @typedef {{
 *     features: (ol.Collection.<ol.Feature>|undefined),
 *     pixelTolerance: (number|undefined),
 *     source: (ol.source.Vector|undefined),
 *     edge: (boolean|undefined),
 *     vertex: (boolean|undefined)
 * }}
 */
olx.interaction.SnapOptions;


/**
 * Snap to these features. Either this option or source should be provided.
 * @type {ol.Collection.<ol.Feature>|undefined}
 * @api
 */
olx.interaction.SnapOptions.prototype.features;

/**
 * Snap to edges. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.SnapOptions.prototype.edge;


/**
 * Snap to vertices. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.interaction.SnapOptions.prototype.vertex;


/**
 * Pixel tolerance for considering the pointer close enough to a segment or
 * vertex for snapping. Default is `10` pixels.
 * @type {number|undefined}
 * @api
 */
olx.interaction.SnapOptions.prototype.pixelTolerance;


/**
 * Snap to features from this source. Either this option or features should be provided
 * @type {ol.source.Vector|undefined}
 * @api
 */
olx.interaction.SnapOptions.prototype.source;


/**
 * Namespace.
 * @type {Object}
 */
olx.layer;


/**
 * @typedef {{opacity: (number|undefined),
 *     visible: (boolean|undefined),
 *     extent: (ol.Extent|undefined),
 *     zIndex: (number|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined)}}
 */
olx.layer.BaseOptions;


/**
 * Opacity (0, 1). Default is `1`.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.BaseOptions.prototype.opacity;


/**
 * Visibility. Default is `true`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.layer.BaseOptions.prototype.visible;


/**
 * The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @type {ol.Extent|undefined}
 * @api stable
 */
olx.layer.BaseOptions.prototype.extent;


/**
 * The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * @type {number|undefined}
 * @api
 */
olx.layer.BaseOptions.prototype.zIndex;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.BaseOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.BaseOptions.prototype.maxResolution;


/**
 * @typedef {{opacity: (number|undefined),
 *     source: (ol.source.Source|undefined),
 *     visible: (boolean|undefined),
 *     extent: (ol.Extent|undefined),
 *     zIndex: (number|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined)}}
 */
olx.layer.LayerOptions;


/**
 * Opacity (0, 1). Default is `1`.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.LayerOptions.prototype.opacity;


/**
 * Source for this layer.  If not provided to the constructor, the source can
 * be set by calling {@link ol.layer.Layer#setSource layer.setSource(source)}
 * after construction.
 * @type {ol.source.Source|undefined}
 * @api stable
 */
olx.layer.LayerOptions.prototype.source;


/**
 * Visibility. Default is `true` (visible).
 * @type {boolean|undefined}
 * @api stable
 */
olx.layer.LayerOptions.prototype.visible;


/**
 * The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @type {ol.Extent|undefined}
 * @api stable
 */
olx.layer.LayerOptions.prototype.extent;


/**
 * The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * @type {number|undefined}
 * @api
 */
olx.layer.LayerOptions.prototype.zIndex;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.LayerOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.LayerOptions.prototype.maxResolution;


/**
 * @typedef {{opacity: (number|undefined),
 *     visible: (boolean|undefined),
 *     extent: (ol.Extent|undefined),
 *     zIndex: (number|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     layers: (Array.<ol.layer.Base>|ol.Collection.<ol.layer.Base>|undefined)}}
 */
olx.layer.GroupOptions;


/**
 * Opacity (0, 1). Default is `1`.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.GroupOptions.prototype.opacity;


/**
 * Visibility. Default is `true`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.layer.GroupOptions.prototype.visible;


/**
 * The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @type {ol.Extent|undefined}
 * @api stable
 */
olx.layer.GroupOptions.prototype.extent;


/**
 * The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * @type {number|undefined}
 * @api
 */
olx.layer.GroupOptions.prototype.zIndex;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.GroupOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.GroupOptions.prototype.maxResolution;


/**
 * Child layers.
 * @type {Array.<ol.layer.Base>|ol.Collection.<ol.layer.Base>|undefined}
 * @api stable
 */
olx.layer.GroupOptions.prototype.layers;


/**
 * @typedef {{gradient: (Array.<string>|undefined),
 *     radius: (number|undefined),
 *     blur: (number|undefined),
 *     shadow: (number|undefined),
 *     weight: (string|function(ol.Feature):number|undefined),
 *     extent: (ol.Extent|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     opacity: (number|undefined),
 *     source: (ol.source.Vector|undefined),
 *     visible: (boolean|undefined)}}
 */
olx.layer.HeatmapOptions;


/**
 * The color gradient of the heatmap, specified as an array of CSS color
 * strings. Default is `['#00f', '#0ff', '#0f0', '#ff0', '#f00']`.
 * @type {Array.<string>|undefined}
 * @api
 */
olx.layer.HeatmapOptions.prototype.gradient;


/**
 * Radius size in pixels. Default is `8`.
 * @type {number|undefined}
 * @api
 */
olx.layer.HeatmapOptions.prototype.radius;


/**
 * Blur size in pixels. Default is `15`.
 * @type {number|undefined}
 * @api
 */
olx.layer.HeatmapOptions.prototype.blur;


/**
 * Shadow size in pixels. Default is `250`.
 * @type {number|undefined}
 * @api
 */
olx.layer.HeatmapOptions.prototype.shadow;


/**
 * The feature attribute to use for the weight or a function that returns a
 * weight from a feature. Weight values should range from 0 to 1 (and values
 * outside will be clamped to that range). Default is `weight`.
 * @type {string|function(ol.Feature):number|undefined}
 * @api
 */
olx.layer.HeatmapOptions.prototype.weight;


/**
 * The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @type {ol.Extent|undefined}
 * @api
 */
olx.layer.HeatmapOptions.prototype.extent;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 * @api
 */
olx.layer.HeatmapOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 * @api
 */
olx.layer.HeatmapOptions.prototype.maxResolution;


/**
 * Opacity. 0-1. Default is `1`.
 * @type {number|undefined}
 * @api
 */
olx.layer.HeatmapOptions.prototype.opacity;


/**
 * Source.
 * @type {ol.source.Vector}
 * @api
 */
olx.layer.HeatmapOptions.prototype.source;


/**
 * Visibility. Default is `true` (visible).
 * @type {boolean|undefined}
 * @api
 */
olx.layer.HeatmapOptions.prototype.visible;


/**
 * @typedef {{opacity: (number|undefined),
 *     map: (ol.Map|undefined),
 *     source: (ol.source.Image|undefined),
 *     visible: (boolean|undefined),
 *     extent: (ol.Extent|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined)}}
 */
olx.layer.ImageOptions;


/**
 * Opacity (0, 1). Default is `1`.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.ImageOptions.prototype.opacity;


/**
 * Source for this layer.
 * @type {ol.source.Image}
 * @api stable
 */
olx.layer.ImageOptions.prototype.source;


/**
 * Sets the layer as overlay on a map. The map will not manage this layer in its
 * layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it
 * managed by the map is to use {@link ol.Map#addLayer}.
 * @type {ol.Map|undefined}
 * @api
 */
olx.layer.ImageOptions.prototype.map;


/**
 * Visibility. Default is `true` (visible).
 * @type {boolean|undefined}
 * @api stable
 */
olx.layer.ImageOptions.prototype.visible;


/**
 * The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @type {ol.Extent|undefined}
 * @api stable
 */
olx.layer.ImageOptions.prototype.extent;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.ImageOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.ImageOptions.prototype.maxResolution;


/**
 * @typedef {{opacity: (number|undefined),
 *     preload: (number|undefined),
 *     source: (ol.source.Tile|undefined),
 *     map: (ol.Map|undefined),
 *     visible: (boolean|undefined),
 *     extent: (ol.Extent|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     useInterimTilesOnError: (boolean|undefined)}}
 */
olx.layer.TileOptions;


/**
 * Opacity (0, 1). Default is `1`.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.TileOptions.prototype.opacity;


/**
 * Preload. Load low-resolution tiles up to `preload` levels. By default
 * `preload` is `0`, which means no preloading.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.TileOptions.prototype.preload;


/**
 * Source for this layer.
 * @type {ol.source.Tile}
 * @api stable
 */
olx.layer.TileOptions.prototype.source;


/**
 * Sets the layer as overlay on a map. The map will not manage this layer in its
 * layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it
 * managed by the map is to use {@link ol.Map#addLayer}.
 * @type {ol.Map|undefined}
 * @api
 */
olx.layer.TileOptions.prototype.map;


/**
 * Visibility. Default is `true` (visible).
 * @type {boolean|undefined}
 * @api stable
 */
olx.layer.TileOptions.prototype.visible;


/**
 * The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @type {ol.Extent|undefined}
 * @api stable
 */
olx.layer.TileOptions.prototype.extent;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.TileOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.TileOptions.prototype.maxResolution;


/**
 * Use interim tiles on error. Default is `true`.
 * @type {boolean|undefined}
 * @api stable
 */
olx.layer.TileOptions.prototype.useInterimTilesOnError;


/**
 * @typedef {{renderOrder: (function(ol.Feature, ol.Feature):number|null|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     opacity: (number|undefined),
 *     renderBuffer: (number|undefined),
 *     source: (ol.source.Vector|undefined),
 *     map: (ol.Map|undefined),
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined),
 *     updateWhileAnimating: (boolean|undefined),
 *     updateWhileInteracting: (boolean|undefined),
 *     visible: (boolean|undefined)}}
 */
olx.layer.VectorOptions;


/**
 * Render order. Function to be used when sorting features before rendering. By
 * default features are drawn in the order that they are created. Use `null` to
 * avoid the sort, but get an undefined draw order.
 * @type {function(ol.Feature, ol.Feature):number|null|undefined}
 * @api
 */
olx.layer.VectorOptions.prototype.renderOrder;


/**
 * Sets the layer as overlay on a map. The map will not manage this layer in its
 * layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it
 * managed by the map is to use {@link ol.Map#addLayer}.
 * @type {ol.Map|undefined}
 * @api
 */
olx.layer.VectorOptions.prototype.map;


/**
 * The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @type {ol.Extent|undefined}
 * @api stable
 */
olx.layer.VectorOptions.prototype.extent;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.VectorOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.VectorOptions.prototype.maxResolution;


/**
 * Opacity. 0-1. Default is `1`.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.VectorOptions.prototype.opacity;


/**
 * The buffer around the viewport extent used by the renderer when getting
 * features from the vector source for the rendering or hit-detection.
 * Recommended value: the size of the largest symbol, line width or label.
 * Default is 100 pixels.
 * @type {number|undefined}
 * @api
 */
olx.layer.VectorOptions.prototype.renderBuffer;


/**
 * Source.
 * @type {ol.source.Vector}
 * @api stable
 */
olx.layer.VectorOptions.prototype.source;


/**
 * Layer style. See {@link ol.style} for default style which will be used if
 * this is not defined.
 * @type {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined}
 * @api stable
 */
olx.layer.VectorOptions.prototype.style;


/**
 * When set to `true`, feature batches will be recreated during animations.
 * This means that no vectors will be shown clipped, but the setting will have a
 * performance impact for large amounts of vector data. When set to `false`,
 * batches will be recreated when no animation is active.  Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.layer.VectorOptions.prototype.updateWhileAnimating;


/**
 * When set to `true`, feature batches will be recreated during interactions.
 * See also `updateWhileAnimating`. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.layer.VectorOptions.prototype.updateWhileInteracting;


/**
 * Visibility. Default is `true` (visible).
 * @type {boolean|undefined}
 * @api stable
 */
olx.layer.VectorOptions.prototype.visible;


/**
 * @typedef {{extent: (ol.Extent|undefined),
 *     map: (ol.Map|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     opacity: (number|undefined),
 *     renderBuffer: (number|undefined),
 *     renderMode: (ol.layer.VectorTileRenderType|string|undefined),
 *     renderOrder: (function(ol.Feature, ol.Feature):number|undefined),
 *     source: (ol.source.VectorTile|undefined),
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined),
 *     updateWhileAnimating: (boolean|undefined),
 *     updateWhileInteracting: (boolean|undefined),
 *     visible: (boolean|undefined)}}
 */
olx.layer.VectorTileOptions;


/**
 * The buffer around the tile extent used by the renderer when getting features
 * from the vector tile for the rendering or hit-detection.
 * Recommended value: Vector tiles are usually generated with a buffer, so this
 * value should match the largest possible buffer of the used tiles. It should
 * be at least the size of the largest point symbol or line width.
 * Default is 100 pixels.
 * @type {number|undefined}
 * @api
 */
olx.layer.VectorTileOptions.prototype.renderBuffer;


/**
 * Render mode for vector tiles:
 *  * `'image'`: Vector tiles are rendered as images. Great performance, but
 *    point symbols and texts are always rotated with the view and pixels are
 *    scaled during zoom animations.
 *  * `'hybrid'`: Polygon and line elements are rendered as images, so pixels
 *    are scaled during zoom animations. Point symbols and texts are accurately
 *    rendered as vectors and can stay upright on rotated views.
 *  * `'vector'`: Vector tiles are rendered as vectors. Most accurate rendering
 *    even during animations, but slower performance than the other options.
 *  The default is `'hybrid'`.
 * @type {ol.layer.VectorTileRenderType|string|undefined}
 * @api
 */
olx.layer.VectorTileOptions.prototype.renderMode;

/**
 * Render order. Function to be used when sorting features before rendering. By
 * default features are drawn in the order that they are created.
 * @type {function(ol.Feature, ol.Feature):number|undefined}
 * @api
 */
olx.layer.VectorTileOptions.prototype.renderOrder;


/**
 * Sets the layer as overlay on a map. The map will not manage this layer in its
 * layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it
 * managed by the map is to use {@link ol.Map#addLayer}.
 * @type {ol.Map|undefined}
 * @api
 */
olx.layer.VectorTileOptions.prototype.map;


/**
 * The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * @type {ol.Extent|undefined}
 * @api stable
 */
olx.layer.VectorTileOptions.prototype.extent;


/**
 * The minimum resolution (inclusive) at which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.VectorTileOptions.prototype.minResolution;


/**
 * The maximum resolution (exclusive) below which this layer will be visible.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.VectorTileOptions.prototype.maxResolution;


/**
 * Opacity. 0-1. Default is `1`.
 * @type {number|undefined}
 * @api stable
 */
olx.layer.VectorTileOptions.prototype.opacity;


/**
 * Source.
 * @type {ol.source.VectorTile|undefined}
 * @api stable
 */
olx.layer.VectorTileOptions.prototype.source;


/**
 * Layer style. See {@link ol.style} for default style which will be used if
 * this is not defined.
 * @type {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined}
 * @api stable
 */
olx.layer.VectorTileOptions.prototype.style;


/**
 * When set to `true`, feature batches will be recreated during animations.
 * This means that no vectors will be shown clipped, but the setting will have a
 * performance impact for large amounts of vector data. When set to `false`,
 * batches will be recreated when no animation is active.  Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.layer.VectorTileOptions.prototype.updateWhileAnimating;


/**
 * When set to `true`, feature batches will be recreated during interactions.
 * See also `updateWhileAnimating`. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.layer.VectorTileOptions.prototype.updateWhileInteracting;


/**
 * Visibility. Default is `true` (visible).
 * @type {boolean|undefined}
 * @api stable
 */
olx.layer.VectorTileOptions.prototype.visible;


/**
 * Namespace.
 * @type {Object}
 */
olx.render;


/**
 * @typedef {{size: (ol.Size|undefined),
 *     pixelRatio: (number|undefined)}}
 */
olx.render.ToContextOptions;


/**
 * Desired size of the canvas in css pixels. When provided, both canvas and css
 * size will be set according to the `pixelRatio`. If not provided, the current
 * canvas and css sizes will not be altered.
 * @type {ol.Size|undefined}
 * @api
 */
olx.render.ToContextOptions.prototype.size;


/**
 * Pixel ratio (canvas pixel to css pixel ratio) for the canvas. Default
 * is the detected device pixel ratio.
 * @type {number|undefined}
 * @api
 */
olx.render.ToContextOptions.prototype.pixelRatio;


/**
 * Namespace.
 * @type {Object}
 */
olx.source;


/**
 * @typedef {{cacheSize: (number|undefined),
 *     culture: (string|undefined),
 *     key: string,
 *     imagerySet: string,
 *     maxZoom: (number|undefined),
 *     reprojectionErrorThreshold: (number|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     wrapX: (boolean|undefined)}}
 */
olx.source.BingMapsOptions;


/**
 * Cache size. Default is `2048`.
 * @type {number|undefined}
 * @api
 */
olx.source.BingMapsOptions.prototype.cacheSize;


/**
 * Culture code. Default is `en-us`.
 * @type {string|undefined}
 * @api stable
 */
olx.source.BingMapsOptions.prototype.culture;


/**
 * Bing Maps API key. Get yours at http://www.bingmapsportal.com/.
 * @type {string}
 * @api stable
 */
olx.source.BingMapsOptions.prototype.key;


/**
 * Type of imagery.
 * @type {string}
 * @api stable
 */
olx.source.BingMapsOptions.prototype.imagerySet;


/**
 * Max zoom. Default is what's advertized by the BingMaps service (`21`
 * currently).
 * @type {number|undefined}
 * @api
 */
olx.source.BingMapsOptions.prototype.maxZoom;


/**
 * Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @type {number|undefined}
 * @api
 */
olx.source.BingMapsOptions.prototype.reprojectionErrorThreshold;


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
olx.source.BingMapsOptions.prototype.tileLoadFunction;


/**
 * Whether to wrap the world horizontally. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.BingMapsOptions.prototype.wrapX;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     distance: (number|undefined),
 *     extent: (ol.Extent|undefined),
 *     format: (ol.format.Feature|undefined),
 *     geometryFunction: (undefined|function(ol.Feature):ol.geom.Point),
 *     logo: (string|undefined),
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
 * Function that takes an {@link ol.Feature} as argument and returns an
 * {@link ol.geom.Point} as cluster calculation point for the feature. When a
 * feature should not be considered for clustering, the function should return
 * `null`. The default, which works when the underyling source contains point
 * features only, is
 * ```js
 * function(feature) {
 *   return feature.getGeometry();
 * }
 * ```
 * See {@link ol.geom.Polygon#getInteriorPoint} for a way to get a cluster
 * calculation point for polygons.
 * @type {undefined|function(ol.Feature):ol.geom.Point}
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
 * Logo.
 * @type {string|undefined}
 * @api
 */
olx.source.ClusterOptions.prototype.logo;


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
 *            logo: (string|olx.LogoOptions|undefined),
 *            opaque: (boolean|undefined),
 *            projection: ol.ProjectionLike,
 *            reprojectionErrorThreshold: (number|undefined),
 *            state: (ol.source.State|undefined),
 *            tileClass: (function(new: ol.ImageTile, ol.TileCoord,
 *                                 ol.Tile.State, string, ?string,
 *                                 ol.TileLoadFunctionType)|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *            tilePixelRatio: (number|undefined),
 *            tileUrlFunction: (ol.TileUrlFunctionType|undefined),
 *            url: (string|undefined),
 *            urls: (Array.<string>|undefined),
 *            wrapX: (boolean|undefined)}}
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
 * Logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api
 */
olx.source.TileImageOptions.prototype.logo;


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
 *                 ol.Tile.State, string, ?string,
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
 * @api stable
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
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *            cacheSize: (number|undefined),
 *            format: (ol.format.Feature|undefined),
 *            logo: (string|olx.LogoOptions|undefined),
 *            overlaps: (boolean|undefined),
 *            projection: ol.ProjectionLike,
 *            state: (ol.source.State|undefined),
 *            tileClass: (function(new: ol.VectorTile, ol.TileCoord,
 *                 ol.Tile.State, string, ol.format.Feature,
 *                 ol.TileLoadFunctionType)|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *            tilePixelRatio: (number|undefined),
 *            tileUrlFunction: (ol.TileUrlFunctionType|undefined),
 *            url: (string|undefined),
 *            urls: (Array.<string>|undefined),
 *            wrapX: (boolean|undefined)}}
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
 * Logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.logo;


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
 * Class used to instantiate image tiles. Default is {@link ol.VectorTile}.
 * @type {function(new: ol.VectorTile, ol.TileCoord,
 *                 ol.Tile.State, string, ol.format.Feature,
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
 *     tile.setFeatures(format.readFeatures(data));
 *     tile.setProjection(format.readProjection(data));
 *   };
 * });
 * ```
 * @type {ol.TileLoadFunctionType|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.tileLoadFunction;


/**
 * The pixel ratio used by the tile service. For example, if the tile
 * service advertizes 256px by 256px tiles but actually sends 512px
 * by 512px tiles (for retina/hidpi devices) then `tilePixelRatio`
 * should be set to `2`. Default is `1`.
 * @type {number|undefined}
 * @api
 */
olx.source.VectorTileOptions.prototype.tilePixelRatio;


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
 * @api stable
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
 * @api stable
 */
olx.source.ImageMapGuideOptions.prototype.url;


/**
 * The display resolution. Default is `96`.
 * @type {number|undefined}
 * @api stable
 */
olx.source.ImageMapGuideOptions.prototype.displayDpi;


/**
 * The meters-per-unit value. Default is `1`.
 * @type {number|undefined}
 * @api stable
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
 * @api stable
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
 * @api stable
 */
olx.source.ImageMapGuideOptions.prototype.ratio;


/**
 * Resolutions. If specified, requests will be made for these resolutions only.
 * @type {Array.<number>|undefined}
 * @api stable
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
 * @api stable
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
 * @api stable
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
 * @api stable
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
 * @api stable
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
 * @api stable
 */
olx.source.OSMOptions.prototype.url;


/**
 * Whether to wrap the world horizontally. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.OSMOptions.prototype.wrapX;


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *     crossOrigin: (null|string|undefined),
 *     logo: (string|olx.LogoOptions|undefined),
 *     imageLoadFunction: (ol.ImageLoadFunctionType|undefined),
 *     params: Object.<string,*>,
 *     projection: ol.ProjectionLike,
 *     ratio: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     url: (string|undefined)}}
 */
olx.source.ImageArcGISRestOptions;


/**
 * Attributions.
 * @type {Array.<ol.Attribution>|undefined}
 * @api
 */
olx.source.ImageArcGISRestOptions.prototype.attributions;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api
 */
olx.source.ImageArcGISRestOptions.prototype.crossOrigin;


/**
 * Logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api
 */
olx.source.ImageArcGISRestOptions.prototype.logo;


/**
 * Optional function to load an image given a URL.
 * @type {ol.ImageLoadFunctionType|undefined}
 * @api
 */
olx.source.ImageArcGISRestOptions.prototype.imageLoadFunction;


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
olx.source.ImageArcGISRestOptions.prototype.params;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.ImageArcGISRestOptions.prototype.projection;


/**
 * Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the size of the map viewport, and so on. Default is `1.5`.
 * @type {number|undefined}
 * @api
 */
olx.source.ImageArcGISRestOptions.prototype.ratio;


/**
 * Resolutions. If specified, requests will be made for these resolutions only.
 * @type {Array.<number>|undefined}
 * @api
 */
olx.source.ImageArcGISRestOptions.prototype.resolutions;


/**
 * ArcGIS Rest service URL for a Map Service or Image Service. The
 * url should include /MapServer or /ImageServer.
 * @type {string|undefined}
 * @api
 */
olx.source.ImageArcGISRestOptions.prototype.url;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     canvasFunction: ol.CanvasFunctionType,
 *     logo: (string|olx.LogoOptions|undefined),
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
 * ratio, `{ol.Size}` the image size, and `{ol.proj.Projection}` the image
 * projection. The canvas returned by this function is cached by the source. If
 * the value returned by the function is later changed then
 * `dispatchChangeEvent` should be called on the source for the source to
 * invalidate the current cached image.
 * @type {ol.CanvasFunctionType}
 * @api
 */
olx.source.ImageCanvasOptions.prototype.canvasFunction;


/**
 * Logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api
 */
olx.source.ImageCanvasOptions.prototype.logo;


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
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     logo: (string|olx.LogoOptions|undefined),
 *     projection: ol.ProjectionLike,
 *     ratio: (number|undefined),
 *     renderBuffer: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     source: ol.source.Vector,
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined)}}
 */
olx.source.ImageVectorOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api
 */
olx.source.ImageVectorOptions.prototype.attributions;


/**
 * Logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api
 */
olx.source.ImageVectorOptions.prototype.logo;


/**
 * Projection.
 * @type {ol.ProjectionLike}
 * @api
 */
olx.source.ImageVectorOptions.prototype.projection;


/**
 * Ratio. 1 means canvases are the size of the map viewport, 2 means twice the
 * width and height of the map viewport, and so on. Must be `1` or higher.
 * Default is `1.5`.
 * @type {number|undefined}
 * @api
 */
olx.source.ImageVectorOptions.prototype.ratio;


/**
 * The buffer around the viewport extent used by the renderer when getting
 * features from the vector source for the rendering or hit-detection.
 * Recommended value: the size of the largest symbol, line width or label.
 * Default is 100 pixels.
 * @type {number|undefined}
 * @api
 */
olx.source.ImageVectorOptions.prototype.renderBuffer;


/**
 * Resolutions. If specified, new canvases will be created for these resolutions
 * only.
 * @type {Array.<number>|undefined}
 * @api
 */
olx.source.ImageVectorOptions.prototype.resolutions;


/**
 * The vector source from which the vector features drawn in canvas elements are
 * read.
 * @type {ol.source.Vector}
 * @api
 */
olx.source.ImageVectorOptions.prototype.source;


/**
 * Style to use when rendering features to the canvas.
 * @type {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined}
 * @api
 */
olx.source.ImageVectorOptions.prototype.style;


/**
 * @typedef {{sources: Array.<ol.source.Source>,
 *     operation: (ol.RasterOperation|undefined),
 *     lib: (Object|undefined),
 *     threads: (number|undefined),
 *     operationType: (ol.RasterOperationType|undefined)}}
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
 * @type {ol.RasterOperationType|undefined}
 * @api
 */
olx.source.RasterOptions.prototype.operationType;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     crossOrigin: (null|string|undefined),
 *     hidpi: (boolean|undefined),
 *     serverType: (ol.source.wms.ServerType|string|undefined),
 *     logo: (string|olx.LogoOptions|undefined),
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
 * @api stable
 */
olx.source.ImageWMSOptions.prototype.attributions;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api stable
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
 * @type {ol.source.wms.ServerType|string|undefined}
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
 * Logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api stable
 */
olx.source.ImageWMSOptions.prototype.logo;


/**
 * WMS request parameters. At least a `LAYERS` param is required. `STYLES` is
 * `''` by default. `VERSION` is `1.3.0` by default. `WIDTH`, `HEIGHT`, `BBOX`
 * and `CRS` (`SRS` for WMS version < 1.3.0) will be set dynamically.
 * @type {Object.<string,*>}
 * @api stable
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
 * @api stable
 */
olx.source.ImageWMSOptions.prototype.ratio;


/**
 * Resolutions. If specified, requests will be made for these resolutions only.
 * @type {Array.<number>|undefined}
 * @api stable
 */
olx.source.ImageWMSOptions.prototype.resolutions;


/**
 * WMS service URL.
 * @type {string|undefined}
 * @api stable
 */
olx.source.ImageWMSOptions.prototype.url;


/**
 * @typedef {{cacheSize: (number|undefined),
 *     layer: string,
 *     minZoom: (number|undefined),
 *     maxZoom: (number|undefined),
 *     opaque: (boolean|undefined),
 *     reprojectionErrorThreshold: (number|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: (string|undefined)}}
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
 * @api stable
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
 * @api stable
 */
olx.source.StamenOptions.prototype.url;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     crossOrigin: (null|string|undefined),
 *     imageExtent: (ol.Extent),
 *     imageLoadFunction: (ol.ImageLoadFunctionType|undefined),
 *     imageSize: (ol.Size|undefined),
 *     logo: (string|olx.LogoOptions|undefined),
 *     projection: ol.ProjectionLike,
 *     url: string}}
 */
olx.source.ImageStaticOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api stable
 */
olx.source.ImageStaticOptions.prototype.attributions;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api stable
 */
olx.source.ImageStaticOptions.prototype.crossOrigin;


/**
 * Extent of the image in map coordinates.  This is the [left, bottom, right,
 * top] map coordinates of your image.
 * @type {ol.Extent}
 * @api stable
 */
olx.source.ImageStaticOptions.prototype.imageExtent;


/**
 * Optional function to load an image given a URL.
 * @type {ol.ImageLoadFunctionType|undefined}
 * @api
 */
olx.source.ImageStaticOptions.prototype.imageLoadFunction;


/**
 * Optional logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api stable
 */
olx.source.ImageStaticOptions.prototype.logo;


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
 * @api stable
 */
olx.source.ImageStaticOptions.prototype.imageSize;


/**
 * Image URL.
 * @type {string}
 * @api stable
 */
olx.source.ImageStaticOptions.prototype.url;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     crossOrigin: (null|string|undefined),
 *     params: (Object.<string, *>|undefined),
 *     logo: (string|olx.LogoOptions|undefined),
 *     tileGrid: (ol.tilegrid.TileGrid|undefined),
 *     projection: ol.ProjectionLike,
 *     reprojectionErrorThreshold: (number|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined),
 *     wrapX: (boolean|undefined)}}
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
 * Logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api
 */
olx.source.TileArcGISRestOptions.prototype.logo;


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
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: string,
 *     wrapX: (boolean|undefined)}}
 */
olx.source.TileJSONOptions;


/**
 * Optional attributions for the source.  If provided, these will be used
 * instead of any attribution data advertised by the server.  If not provided,
 * any attributions advertised by the server will be used.
 * @type {ol.AttributionLike|undefined}
 * @api stable
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
 * @api stable
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
 * URL to the TileJSON file.
 * @type {string}
 * @api stable
 */
olx.source.TileJSONOptions.prototype.url;


/**
 * Whether to wrap the world horizontally. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.TileJSONOptions.prototype.wrapX;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     params: Object.<string,*>,
 *     crossOrigin: (null|string|undefined),
 *     gutter: (number|undefined),
 *     hidpi: (boolean|undefined),
 *     logo: (string|olx.LogoOptions|undefined),
 *     tileGrid: (ol.tilegrid.TileGrid|undefined),
 *     projection: ol.ProjectionLike,
 *     reprojectionErrorThreshold: (number|undefined),
 *     serverType: (ol.source.wms.ServerType|string|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: (string|undefined),
 *     urls: (Array.<string>|undefined),
 *     wrapX: (boolean|undefined)}}
 */
olx.source.TileWMSOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api stable
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
 * @api stable
 */
olx.source.TileWMSOptions.prototype.params;


/**
 * The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * @type {null|string|undefined}
 * @api stable
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
 * @api stable
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
 * Logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api stable
 */
olx.source.TileWMSOptions.prototype.logo;


/**
 * Tile grid. Base this on the resolutions, tilesize and extent supported by the
 * server.
 * If this is not defined, a default grid will be used: if there is a projection
 * extent, the grid will be based on that; if not, a grid based on a global
 * extent with origin at 0,0 will be used.
 * @type {ol.tilegrid.TileGrid|undefined}
 * @api stable
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
 * @type {ol.source.wms.ServerType|string|undefined}
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
 * @api stable
 */
olx.source.TileWMSOptions.prototype.url;


/**
 * WMS service urls. Use this instead of `url` when the WMS supports multiple
 * urls for GetMap requests.
 * @type {Array.<string>|undefined}
 * @api stable
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
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     features: (Array.<ol.Feature>|ol.Collection.<ol.Feature>|undefined),
 *     format: (ol.format.Feature|undefined),
 *     loader: (ol.FeatureLoader|undefined),
 *     logo: (string|olx.LogoOptions|undefined),
 *     overlaps: (boolean|undefined),
 *     strategy: (ol.LoadingStrategy|undefined),
 *     url: (string|ol.FeatureUrlFunction|undefined),
 *     useSpatialIndex: (boolean|undefined),
 *     wrapX: (boolean|undefined)}}
 */
olx.source.VectorOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api stable
 */
olx.source.VectorOptions.prototype.attributions;


/**
 * Features. If provided as {@link ol.Collection}, the features in the source
 * and the collection will stay in sync.
 * @type {Array.<ol.Feature>|ol.Collection.<ol.Feature>|undefined}
 * @api stable
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
 * @type {ol.FeatureLoader|undefined}
 * @api
 */
olx.source.VectorOptions.prototype.loader;


/**
 * Logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api stable
 */
olx.source.VectorOptions.prototype.logo;


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
 * the given URL. Use a {@link ol.FeatureUrlFunction} to generate the url with
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
 * @type {string|ol.FeatureUrlFunction|undefined}
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
 *     logo: (string|olx.LogoOptions|undefined),
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
 *                          ol.Tile.State, string, ?string,
 *                          ol.TileLoadFunctionType)|undefined),
 *     wrapX: (boolean|undefined)}}
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
 * Logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.logo;


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
 * @api stable
 */
olx.source.WMTSOptions.prototype.requestEncoding;


/**
 * Layer name as advertised in the WMTS capabilities.
 * @type {string}
 * @api stable
 */
olx.source.WMTSOptions.prototype.layer;


/**
 * Style name as advertised in the WMTS capabilities.
 * @type {string}
 * @api stable
 */
olx.source.WMTSOptions.prototype.style;


/**
 * Class used to instantiate image tiles. Default is {@link ol.ImageTile}.
 * @type {function(new: ol.ImageTile, ol.TileCoord,
 *                 ol.Tile.State, string, ?string,
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
 * @api stable
 */
olx.source.WMTSOptions.prototype.version;


/**
 * Image format. Default is `image/jpeg`.
 * @type {string|undefined}
 * @api stable
 */
olx.source.WMTSOptions.prototype.format;


/**
 * Matrix set.
 * @type {string}
 * @api stable
 */
olx.source.WMTSOptions.prototype.matrixSet;


/**
 * Additional "dimensions" for tile requests.  This is an object with properties
 * named like the advertised WMTS dimensions.
 * @type {!Object|undefined}
 * @api stable
 */
olx.source.WMTSOptions.prototype.dimensions;


/**
 * A URL for the service.  For the RESTful request encoding, this is a URL
 * template.  For KVP encoding, it is normal URL. A `{?-?}` template pattern,
 * for example `subdomain{a-f}.domain.com`, may be used instead of defining
 * each one separately in the `urls` option.
 * @type {string|undefined}
 * @api stable
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
 * @api stable
 */
olx.source.WMTSOptions.prototype.urls;


/**
 * Whether to wrap the world horizontally. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.WMTSOptions.prototype.wrapX;


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     crossOrigin: (null|string|undefined),
 *     logo: (string|olx.LogoOptions|undefined),
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
 *     wrapX: (boolean|undefined)}}
 */
olx.source.XYZOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api stable
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
 * @api stable
 */
olx.source.XYZOptions.prototype.crossOrigin;


/**
 * Logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api stable
 */
olx.source.XYZOptions.prototype.logo;


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
 * @api stable
 */
olx.source.XYZOptions.prototype.url;


/**
 * An array of URL templates.
 * @type {Array.<string>|undefined}
 * @api stable
 */
olx.source.XYZOptions.prototype.urls;


/**
 * Whether to wrap the world horizontally. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.source.XYZOptions.prototype.wrapX;

/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     crossOrigin: (null|string|undefined),
 *     logo: (string|olx.LogoOptions|undefined),
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
 * @api stable
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
 * @api stable
 */
olx.source.CartoDBOptions.prototype.crossOrigin;


/**
 * Logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api stable
 */
olx.source.CartoDBOptions.prototype.logo;


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
 *     logo: (string|olx.LogoOptions|undefined),
 *     reprojectionErrorThreshold: (number|undefined),
 *     url: !string,
 *     tierSizeCalculation: (string|undefined),
 *     size: ol.Size}}
 */
olx.source.ZoomifyOptions;


/**
 * Attributions.
 * @type {ol.AttributionLike|undefined}
 * @api stable
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
 * @api stable
 */
olx.source.ZoomifyOptions.prototype.crossOrigin;


/**
 * Logo.
 * @type {string|olx.LogoOptions|undefined}
 * @api stable
 */
olx.source.ZoomifyOptions.prototype.logo;


/**
 * Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * @type {number|undefined}
 * @api
 */
olx.source.ZoomifyOptions.prototype.reprojectionErrorThreshold;


/**
 * Prefix of URL template.
 * @type {!string}
 * @api stable
 */
olx.source.ZoomifyOptions.prototype.url;


/**
 * Tier size calculation method: `default` or `truncated`.
 * @type {string|undefined}
 * @api stable
 */
olx.source.ZoomifyOptions.prototype.tierSizeCalculation;


/**
 * Size of the image.
 * @type {ol.Size}
 * @api stable
 */
olx.source.ZoomifyOptions.prototype.size;


/**
 * Namespace.
 * @type {Object}
 */
olx.style;


/**
 * @typedef {{fill: (ol.style.Fill|undefined),
 *     radius: number,
 *     snapToPixel: (boolean|undefined),
 *     stroke: (ol.style.Stroke|undefined),
 *     atlasManager: (ol.style.AtlasManager|undefined)}}
 */
olx.style.CircleOptions;


/**
 * Fill style.
 * @type {ol.style.Fill|undefined}
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
 * @type {ol.style.Stroke|undefined}
 * @api
 */
olx.style.CircleOptions.prototype.stroke;


/**
 * The atlas manager to use for this circle. When using WebGL it is
 * recommended to use an atlas manager to avoid texture switching.
 * If an atlas manager is given, the circle is added to an atlas.
 * By default no atlas manager is used.
 * @type {ol.style.AtlasManager|undefined}
 */
olx.style.CircleOptions.prototype.atlasManager;


/**
 * @typedef {{color: (ol.Color|ol.ColorLike|undefined)}}
 */
olx.style.FillOptions;


/**
 * A color, gradient or pattern. See {@link ol.color}
 * and {@link ol.colorlike} for possible formats. Default null;
 * if null, the Canvas/renderer default black will be used.
 * @type {ol.Color|ol.ColorLike|undefined}
 * @api
 */
olx.style.FillOptions.prototype.color;


/**
 * @typedef {{anchor: (Array.<number>|undefined),
 *     anchorOrigin: (ol.style.IconOrigin|undefined),
 *     anchorXUnits: (ol.style.IconAnchorUnits|undefined),
 *     anchorYUnits: (ol.style.IconAnchorUnits|undefined),
 *     color: (ol.Color|string|undefined),
 *     crossOrigin: (null|string|undefined),
 *     img: (Image|HTMLCanvasElement|undefined),
 *     offset: (Array.<number>|undefined),
 *     offsetOrigin: (ol.style.IconOrigin|undefined),
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
 * @type {ol.style.IconOrigin|undefined}
 * @api
 */
olx.style.IconOptions.prototype.anchorOrigin;


/**
 * Units in which the anchor x value is specified. A value of `'fraction'`
 * indicates the x value is a fraction of the icon. A value of `'pixels'`
 * indicates the x value in pixels. Default is `'fraction'`.
 * @type {ol.style.IconAnchorUnits|undefined}
 * @api
 */
olx.style.IconOptions.prototype.anchorXUnits;


/**
 * Units in which the anchor y value is specified. A value of `'fraction'`
 * indicates the y value is a fraction of the icon. A value of `'pixels'`
 * indicates the y value in pixels. Default is `'fraction'`.
 * @type {ol.style.IconAnchorUnits|undefined}
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
 * @type {ol.style.IconOrigin|undefined}
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
 * Scale.
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
 * @type {string}
 * @api
 */
olx.style.IconOptions.prototype.src;


/**
 * Specify radius for regular polygons, or radius1 and radius2 for stars.
 * @typedef {{fill: (ol.style.Fill|undefined),
 *     points: number,
 *     radius: (number|undefined),
 *     radius1: (number|undefined),
 *     radius2: (number|undefined),
 *     angle: (number|undefined),
 *     snapToPixel: (boolean|undefined),
 *     stroke: (ol.style.Stroke|undefined),
 *     rotation: (number|undefined),
 *     rotateWithView: (boolean|undefined),
 *     atlasManager: (ol.style.AtlasManager|undefined)}}
 */
olx.style.RegularShapeOptions;


/**
 * Fill style.
 * @type {ol.style.Fill|undefined}
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
 * Inner radius of a star.
 * @type {number|undefined}
 * @api
 */
olx.style.RegularShapeOptions.prototype.radius1;


/**
 * Outer radius of a star.
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
 * @type {ol.style.Stroke|undefined}
 * @api
 */
olx.style.RegularShapeOptions.prototype.stroke;


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
 * @type {ol.style.AtlasManager|undefined}
 */
olx.style.RegularShapeOptions.prototype.atlasManager;


/**
 * @typedef {{color: (ol.Color|string|undefined),
 *     lineCap: (string|undefined),
 *     lineJoin: (string|undefined),
 *     lineDash: (Array.<number>|undefined),
 *     miterLimit: (number|undefined),
 *     width: (number|undefined)}}
 */
olx.style.StrokeOptions;


/**
 * Color. See {@link ol.color} for possible formats. Default null; if null,
 * the Canvas/renderer default black will be used.
 * @type {ol.Color|string|undefined}
 * @api
 */
olx.style.StrokeOptions.prototype.color;


/**
 * Line cap style: `butt`, `round`, or `square`. Default is `round`.
 * @type {string|undefined}
 * @api
 */
olx.style.StrokeOptions.prototype.lineCap;


/**
 * Line join style: `bevel`, `round`, or `miter`. Default is `round`.
 * @type {string|undefined}
 * @api
 */
olx.style.StrokeOptions.prototype.lineJoin;


/**
 * Line dash pattern. Default is `undefined` (no dash). Please note that
 * Internet Explorer 10 and lower [do not support][mdn] the `setLineDash`
 * method on the `CanvasRenderingContext2D` and therefore this option will
 * have no visual effect in these browsers.
 *
 * [mdn]: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility
 *
 * @type {Array.<number>|undefined}
 * @api
 */
olx.style.StrokeOptions.prototype.lineDash;


/**
 * Miter limit. Default is `10`.
 * @type {number|undefined}
 * @api
 */
olx.style.StrokeOptions.prototype.miterLimit;


/**
 * Width.
 * @type {number|undefined}
 * @api
 */
olx.style.StrokeOptions.prototype.width;


/**
 * @typedef {{font: (string|undefined),
 *     offsetX: (number|undefined),
 *     offsetY: (number|undefined),
 *     scale: (number|undefined),
 *     rotateWithView: (boolean|undefined),
 *     rotation: (number|undefined),
 *     text: (string|undefined),
 *     textAlign: (string|undefined),
 *     textBaseline: (string|undefined),
 *     fill: (ol.style.Fill|undefined),
 *     stroke: (ol.style.Stroke|undefined)}}
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
 * Scale.
 * @type {number|undefined}
 * @api
 */
olx.style.TextOptions.prototype.scale;


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
 * Default is 'start'.
 * @type {string|undefined}
 * @api
 */
olx.style.TextOptions.prototype.textAlign;


/**
 * Text base line. Possible values: 'bottom', 'top', 'middle', 'alphabetic',
 * 'hanging', 'ideographic'. Default is 'alphabetic'.
 * @type {string|undefined}
 * @api
 */
olx.style.TextOptions.prototype.textBaseline;


/**
 * Fill style. If none is provided, we'll use a dark fill-style (#333).
 * @type {ol.style.Fill|undefined}
 * @api
 */
olx.style.TextOptions.prototype.fill;


/**
 * Stroke style.
 * @type {ol.style.Stroke|undefined}
 * @api
 */
olx.style.TextOptions.prototype.stroke;


/**
 * @typedef {{geometry: (undefined|string|ol.geom.Geometry|ol.StyleGeometryFunction),
 *     fill: (ol.style.Fill|undefined),
 *     image: (ol.style.Image|undefined),
 *     stroke: (ol.style.Stroke|undefined),
 *     text: (ol.style.Text|undefined),
 *     zIndex: (number|undefined)}}
 */
olx.style.StyleOptions;


/**
 * Feature property or geometry or function returning a geometry to render for
 * this style.
 * @type {undefined|string|ol.geom.Geometry|ol.StyleGeometryFunction}
 * @api
 */
olx.style.StyleOptions.prototype.geometry;


/**
 * Fill style.
 * @type {ol.style.Fill|undefined}
 * @api
 */
olx.style.StyleOptions.prototype.fill;


/**
 * Image style.
 * @type {ol.style.Image|undefined}
 * @api
 */
olx.style.StyleOptions.prototype.image;


/**
 * Stroke style.
 * @type {ol.style.Stroke|undefined}
 * @api
 */
olx.style.StyleOptions.prototype.stroke;


/**
 * Text style.
 * @type {ol.style.Text|undefined}
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
 * Namespace.
 * @type {Object}
 */
olx.tilegrid;


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
 * @api stable
 */
olx.tilegrid.TileGridOptions.prototype.origin;


/**
 * Tile grid origins, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`), for
 * each zoom level. If given, the array length should match the length of the
 * `resolutions` array, i.e. each resolution can have a different origin. Tile
 * coordinates increase left to right and upwards. If not specified, `extent`
 * or `origin` must be provided.
 * @type {Array.<ol.Coordinate>|undefined}
 * @api stable
 */
olx.tilegrid.TileGridOptions.prototype.origins;


/**
 * Resolutions. The array index of each resolution needs to match the zoom
 * level. This means that even if a `minZoom` is configured, the resolutions
 * array will have a length of `maxZoom + 1`.
 * @type {!Array.<number>}
 * @api stable
 */
olx.tilegrid.TileGridOptions.prototype.resolutions;


/**
 * Tile size. Default is `[256, 256]`.
 * @type {number|ol.Size|undefined}
 * @api stable
 */
olx.tilegrid.TileGridOptions.prototype.tileSize;


/**
 * Tile sizes. If given, the array length should match the length of the
 * `resolutions` array, i.e. each resolution can have a different tile size.
 * @type {Array.<number|ol.Size>|undefined}
 * @api stable
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
 * @api stable
 */
olx.tilegrid.WMTSOptions.prototype.origin;


/**
 * Tile grid origins, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`), for
 * each zoom level. If given, the array length should match the length of the
 * `resolutions` array, i.e. each resolution can have a different origin. Tile
 * coordinates increase left to right and upwards. If not specified, `extent` or
 * `origin` must be provided.
 * @type {Array.<ol.Coordinate>|undefined}
 * @api stable
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


/**
 * Namespace.
 * @type {Object}
 */
olx.view;


/**
 * @typedef {{
 *     padding: (!Array.<number>|undefined),
 *     constrainResolution: (boolean|undefined),
 *     nearest: (boolean|undefined),
 *     maxZoom: (number|undefined),
 *     minResolution: (number|undefined)}}
 */
olx.view.FitOptions;


/**
 * Padding (in pixels) to be cleared inside the view. Values in the array are
 * top, right, bottom and left padding. Default is `[0, 0, 0, 0]`.
 * @type {!Array.<number>|undefined}
 * @api
 */
olx.view.FitOptions.prototype.padding;


/**
 * Constrain the resolution. Default is `true`.
 * @type {boolean|undefined}
 * @api
 */
olx.view.FitOptions.prototype.constrainResolution;


/**
 * Get the nearest extent. Default is `false`.
 * @type {boolean|undefined}
 * @api
 */
olx.view.FitOptions.prototype.nearest;


/**
 * Minimum resolution that we zoom to. Default is `0`.
 * @type {number|undefined}
 * @api
 */
olx.view.FitOptions.prototype.minResolution;


/**
 * Maximum zoom level that we zoom to. If `minResolution` is given,
 * this property is ignored.
 * @type {number|undefined}
 * @api
 */
olx.view.FitOptions.prototype.maxZoom;


/* typedefs for object literals exposed by the library */


/**
 * @typedef {{animate: boolean,
 *     attributions: Object.<string, ol.Attribution>,
 *     coordinateToPixelTransform: ol.Transform,
 *     extent: (null|ol.Extent),
 *     focus: ol.Coordinate,
 *     index: number,
 *     layerStates: Object.<number, ol.LayerState>,
 *     layerStatesArray: Array.<ol.LayerState>,
 *     logos: Object.<string, (string|Element)>,
 *     pixelRatio: number,
 *     pixelToCoordinateTransform: ol.Transform,
 *     postRenderFunctions: Array.<ol.PostRenderFunction>,
 *     size: ol.Size,
 *     skippedFeatureUids: Object.<string, boolean>,
 *     tileQueue: ol.TileQueue,
 *     time: number,
 *     usedTiles: Object.<string, Object.<string, ol.TileRange>>,
 *     viewState: olx.ViewState,
 *     viewHints: Array.<number>,
 *     wantedTiles: !Object.<string, Object.<string, boolean>>}}
 */
olx.FrameState;


/**
 * @type {number}
 * @api
 */
olx.FrameState.prototype.pixelRatio;


/**
 * @type {number}
 * @api
 */
olx.FrameState.prototype.time;


/**
 * @type {olx.ViewState}
 * @api
 */
olx.FrameState.prototype.viewState;


/**
 * @typedef {{center: ol.Coordinate,
 *     projection: ol.proj.Projection,
 *     resolution: number,
 *     rotation: number}}
 */
olx.ViewState;


/**
 * @type {ol.Coordinate}
 * @api
 */
olx.ViewState.prototype.center;


/**
 * @type {ol.proj.Projection}
 * @api
 */
olx.ViewState.prototype.projection;


/**
 * @type {number}
 * @api
 */
olx.ViewState.prototype.resolution;


/**
 * @type {number}
 * @api
 */
olx.ViewState.prototype.rotation;


/**
 * @typedef {{initialSize: (number|undefined),
 *     maxSize: (number|undefined),
 *     space: (number|undefined)}}
 */
olx.style.AtlasManagerOptions;


/**
 * The size in pixels of the first atlas image. If no value is given the
 * `ol.INITIAL_ATLAS_SIZE` compile-time constant will be used.
 * @type {number|undefined}
 * @api
 */
olx.style.AtlasManagerOptions.prototype.initialSize;


/**
 * The maximum size in pixels of atlas images. If no value is given then
 * the `ol.MAX_ATLAS_SIZE` compile-time constant will be used. And if
 * `ol.MAX_ATLAS_SIZE` is set to `-1` (the default) then
 * `ol.WEBGL_MAX_TEXTURE_SIZE` will used if WebGL is supported. Otherwise
 * 2048 is used.
 * @type {number|undefined}
 * @api
 */
olx.style.AtlasManagerOptions.prototype.maxSize;


/**
 * The space in pixels between images (default: 1).
 * @type {number|undefined}
 * @api
 */
olx.style.AtlasManagerOptions.prototype.space;
