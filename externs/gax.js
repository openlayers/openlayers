/**
 * @type {Object}
 */
var gax;


/* typedefs for object literals provided by applications */


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
 *     renderer: (ol.RendererType|Array.<ol.RendererType|string>|string|undefined),
 *     target: (Element|string|undefined),
 *     tooltip: (boolean|undefined),
 *     view: (ol.IView|undefined)}}
 * @todo api
 */
gax.MapOptions;


/**
 * Controls initially added to the map.
 * @type {ol.Collection|Array.<ol.control.Control>|undefined}
 */
gax.MapOptions.prototype.controls;


/**
 * Device options for the map.
 * @type {olx.DeviceOptions|undefined}
 */
gax.MapOptions.prototype.deviceOptions;


/**
 * The ratio between physical pixels and device-independent pixels (dips) on the
 * device. If `undefined` then it gets set by using `window.devicePixelRatio`.
 * @type {number|undefined}
 */
gax.MapOptions.prototype.pixelRatio;


/**
 * Interactions that are initially added to the map.
 * @type {ol.Collection|Array.<ol.interaction.Interaction>|undefined}
 */
gax.MapOptions.prototype.interactions;


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
gax.MapOptions.prototype.keyboardEventTarget;


/**
 * Layers.
 * @type {Array.<ol.layer.Base>|ol.Collection|undefined}
 */
gax.MapOptions.prototype.layers;


/**
 * Show ol3 logo. It is set to false.
 * @type {boolean|undefined}
 */
gax.MapOptions.prototype.ol3Logo;


/**
 * Overlays initially added to the map.
 * @type {ol.Collection|Array.<ol.Overlay>|undefined}
 */
gax.MapOptions.prototype.overlays;


/**
 * Renderer. Default to 'canvas'.
 * @type (ol.RendererType|Array.<ol.RendererType|string>|string|undefined) 
 */
gax.MapOptions.prototype.renderer;


/**
 * The container for the map.
 * @type {Element|string|undefined}
 */
gax.MapOptions.prototype.target;

/**
 * Active the tooltip feature for the map.
 * @type {boolean|undefined}
 */
gax.MapOptions.prototype.tooltip;

/**
 * The map's view. Currently {@link ol.View2D} is available as view. Center, resolution and rotation can be passed to the map through a custom view. Resolutions are set: [650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5, 0.25, 0.1]. Extent is set: [420000, 30000, 900000, 350000]. Coordinate system is set: EPSG 21781.
 * @type {ol.IView|undefined}
 */
gax.MapOptions.prototype.view;
