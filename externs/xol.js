
/**
 * @typedef {{unique: (boolean|undefined)}}
 */
export let CollectionOptions;

/**
 * @param {CollectionOptions} options TODO: repace this
 *
 * @param {boolean|undefined} options.unique Disallow the same item from being added to the collection twice.  Default is
 * false.
 * 
 */


/**
 * @typedef {{tracking: (boolean|undefined),
 *     trackingOptions: (GeolocationPositionOptions|undefined),
 *     projection: ol.ProjectionLike}}
 */
export let GeolocationOptions;

/**
 * @param {GeolocationOptions} options TODO: repace this
 *
 * @param {boolean|undefined} options.tracking Start Tracking. Default is `false`.
 * 
 * @param {GeolocationPositionOptions|undefined} options.trackingOptions Tracking options. See
 * {@link http://www.w3.org/TR/geolocation-API/#position_options_interface}.
 * 
 * @param {ol.ProjectionLike} options.projection The projection the position is reported in.
 * 
 */


/**
 * Object literal with config options for the map logo.
 * @typedef {{href: (string), src: (string)}}
 */
export let LogoOptions;

/**
 * @param {LogoOptions} options TODO: repace this
 *
 * @param {string} options.href Link url for the logo. Will be followed when the logo is clicked.
 * 
 * @param {string} options.src Image src for the logo.
 * 
 */


/**
 * @typedef {{map: (ol.PluggableMap|undefined),
 *     maxLines: (number|undefined),
 *     strokeStyle: (ol.style.Stroke|undefined),
 *     targetSize: (number|undefined),
 *     showLabels: (boolean|undefined),
 *     lonLabelFormatter: (undefined|function(number):string),
 *     latLabelFormatter: (undefined|function(number):string),
 *     lonLabelPosition: (number|undefined),
 *     latLabelPosition: (number|undefined),
 *     lonLabelStyle: (ol.style.Text|undefined),
 *     latLabelStyle: (ol.style.Text|undefined)}}
 */
export let GraticuleOptions;

/**
 * @param {GraticuleOptions} options TODO: repace this
 *
 * @param {ol.PluggableMap|undefined} options.map Reference to an `ol.Map` object.
 * 
 * @param {number|undefined} options.maxLines The maximum number of meridians and parallels from the center of the
 * map. The default value is 100, which means that at most 200 meridians
 * and 200 parallels will be displayed. The default value is appropriate
 * for conformal projections like Spherical Mercator. If you increase
 * the value more lines will be drawn and the drawing performance will
 * decrease.
 * 
 * @param {ol.style.Stroke|undefined} options.strokeStyle The stroke style to use for drawing the graticule. If not provided, the
 * lines will be drawn with `rgba(0,0,0,0.2)`, a not fully opaque black.
 * 
 * 
 * @param {number|undefined} options.targetSize The target size of the graticule cells, in pixels. Default
 * value is 100 pixels.
 * 
 * @param {boolean|undefined} options.showLabels Render a label with the respective latitude/longitude for each graticule
 * line. Default is false.
 * 
 * 
 * @param {undefined|function(number):string} options.lonLabelFormatter Label formatter for longitudes. This function is called with the longitude as
 * argument, and should return a formatted string representing the longitude.
 * By default, labels are formatted as degrees, minutes, seconds and hemisphere.
 * 
 * 
 * @param {undefined|function(number):string} options.latLabelFormatter Label formatter for latitudes. This function is called with the latitude as
 * argument, and should return a formatted string representing the latitude.
 * By default, labels are formatted as degrees, minutes, seconds and hemisphere.
 * 
 * 
 * @param {number|undefined} options.lonLabelPosition Longitude label position in fractions (0..1) of view extent. 0 means at the
 * bottom of the viewport, 1 means at the top. Default is 0.
 * 
 * @param {number|undefined} options.latLabelPosition Latitude label position in fractions (0..1) of view extent. 0 means at the
 * left of the viewport, 1 means at the right. Default is 1.
 * 
 * @param {ol.style.Text|undefined} options.lonLabelStyle Longitude label text style. The default is
 * ```js
 * new ol.style.Text({
 *   font: '12px Calibri,sans-serif',
 *   textBaseline: 'bottom',
 *   fill: new ol.style.Fill({
 *     color: 'rgba(0,0,0,1)'
 *   }),
 *   stroke: new ol.style.Stroke({
 *     color: 'rgba(255,255,255,1)',
 *     width: 3
 *   })
 * });
 * ```
 * Note that the default's `textBaseline` configuration will not work well for
 * `lonLabelPosition` configurations that position labels close to the top of
 * the viewport.
 * 
 * 
 * @param {ol.style.Text|undefined} options.latLabelStyle Latitude label text style. The default is
 * ```js
 * new ol.style.Text({
 *   font: '12px Calibri,sans-serif',
 *   textAlign: 'end',
 *   fill: new ol.style.Fill({
 *     color: 'rgba(0,0,0,1)'
 *   }),
 *   stroke: new ol.style.Stroke({
 *     color: 'rgba(255,255,255,1)',
 *     width: 3
 *   })
 * });
 * ```
 * Note that the default's `textAlign` configuration will not work well for
 * `latLabelPosition` configurations that position labels close to the left of
 * the viewport.
 * 
 * 
 */


/**
 * Object literal with config options for interactions.
 * @typedef {{handleEvent: function(ol.MapBrowserEvent):boolean}}
 */
export let interaction_InteractionOptions;

/**
 * @param {interaction_InteractionOptions} options TODO: repace this
 *
 * @param {function(ol.MapBrowserEvent):boolean} options.handleEvent Method called by the map to notify the interaction that a browser event was
 * dispatched to the map. If the function returns a falsy value,
 * propagation of the event to other interactions in the map's interactions
 * chain will be prevented (this includes functions with no explicit return). See
 * {@link https://developer.mozilla.org/en-US/docs/Glossary/Falsy}
 * 
 */


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
 *     moveTolerance: (number|undefined),
 *     overlays: (ol.Collection.<ol.Overlay>|Array.<ol.Overlay>|undefined),
 *     renderer: (ol.renderer.Type|Array.<ol.renderer.Type>|undefined),
 *     target: (Element|string|undefined),
 *     view: (ol.View|undefined)}}
 */
export let MapOptions;

/**
 * @param {MapOptions} options TODO: repace this
 *
 * @param {ol.Collection.<ol.control.Control>|Array.<ol.control.Control>|undefined} options.controls Controls initially added to the map. If not specified,
 * {@link ol.control.defaults ol.control.defaults()} is used.
 * 
 * @param {number|undefined} options.pixelRatio The ratio between physical pixels and device-independent pixels (dips) on the
 * device. If `undefined` then it gets set by using `window.devicePixelRatio`.
 * 
 * @param {ol.Collection.<ol.interaction.Interaction>|Array.<ol.interaction.Interaction>|undefined} options.interactions Interactions that are initially added to the map. If not specified,
 * {@link ol.interaction.defaults ol.interaction.defaults()} is used.
 * 
 * @param {Element|Document|string|undefined} options.keyboardEventTarget The element to listen to keyboard events on. This determines when the
 * `KeyboardPan` and `KeyboardZoom` interactions trigger. For example, if this
 * option is set to `document` the keyboard interactions will always trigger. If
 * this option is not specified, the element the library listens to keyboard
 * events on is the map target (i.e. the user-provided div for the map). If this
 * is not `document` the target element needs to be focused for key events to be
 * emitted, requiring that the target element has a `tabindex` attribute.
 * 
 * @param {Array.<ol.layer.Base>|ol.Collection.<ol.layer.Base>|undefined} options.layers Layers. If this is not defined, a map with no layers will be rendered. Note
 * that layers are rendered in the order supplied, so if you want, for example,
 * a vector layer to appear on top of a tile layer, it must come after the tile
 * layer.
 * 
 * @param {boolean|undefined} options.loadTilesWhileAnimating When set to true, tiles will be loaded during animations. This may improve
 * the user experience, but can also make animations stutter on devices with
 * slow memory. Default is `false`.
 * 
 * @param {boolean|undefined} options.loadTilesWhileInteracting When set to true, tiles will be loaded while interacting with the map. This
 * may improve the user experience, but can also make map panning and zooming
 * choppy on devices with slow memory. Default is `false`.
 * 
 * @param {boolean|string|olx.LogoOptions|Element|undefined} options.logo The map logo. A logo to be displayed on the map at all times. If a string is
 * provided, it will be set as the image source of the logo. If an object is
 * provided, the `src` property should be the URL for an image and the `href`
 * property should be a URL for creating a link. If an element is provided,
 * the element will be used. To disable the map logo, set the option to
 * `false`. By default, the OpenLayers logo is shown.
 * 
 * @param {number|undefined} options.moveTolerance The minimum distance in pixels the cursor must move to be detected
 * as a map move event instead of a click. Increasing this value can make it
 * easier to click on the map.
 * Default is `1`.
 * 
 * @param {ol.Collection.<ol.Overlay>|Array.<ol.Overlay>|undefined} options.overlays Overlays initially added to the map. By default, no overlays are added.
 * 
 * @param {ol.renderer.Type|Array.<ol.renderer.Type>|undefined} options.renderer Renderer. By default, Canvas and WebGL renderers are tested for support
 * in that order, and the first supported used. Specify a
 * {@link ol.renderer.Type} here to use a specific renderer.
 * Note that the Canvas renderer fully supports vector data, but WebGL can only
 * render Point geometries.
 * 
 * @param {Element|string|undefined} options.target The container for the map, either the element itself or the `id` of the
 * element. If not specified at construction time, {@link ol.Map#setTarget}
 * must be called for the map to be rendered.
 * 
 * @param {ol.View|undefined} options.view The map's view.  No layer sources will be fetched unless this is specified at
 * construction time or through {@link ol.Map#setView}.
 * 
 */


/**
 * Object literal with options for the {@link ol.Sphere.getLength} or
 * {@link ol.Sphere.getArea} functions.
 * @typedef {{projection: (ol.ProjectionLike|undefined),
 *    radius: (number|undefined)}}
 */
export let SphereMetricOptions;

/**
 * @param {SphereMetricOptions} options TODO: repace this
 *
 * @param {(ol.ProjectionLike|undefined)} options.projection Projection of the geometry.  By default, the geometry is assumed to be in
 * EPSG:3857 (Web Mercator).
 * 
 * @param {(number|undefined)} options.radius Sphere radius.  By default, the radius of the earth is used (Clarke 1866
 * Authalic Sphere).
 * 
 */


/**
 * Options for tile constructors.
 * @typedef {{transition: (number|undefined)}}
 */
export let TileOptions;

/**
 * @param {TileOptions} options TODO: repace this
 *
 * @param {number|undefined} options.transition A duration for tile opacity transitions.  By default, tiles will render with
 * an opacity transition that lasts 250 ms.  To change the duration, pass a
 * number in milliseconds.  A duration of 0 disables the opacity transition.
 * 
 */


/**
 * Object literal with options for the {@link ol.Map#forEachFeatureAtPixel} and
 * {@link ol.Map#hasFeatureAtPixel} methods.
 * @typedef {{layerFilter: ((function(ol.layer.Layer): boolean)|undefined),
 *    hitTolerance: (number|undefined)}}
 */
export let AtPixelOptions;

/**
 * @param {AtPixelOptions} options TODO: repace this
 *
 * @param {((function(ol.layer.Layer): boolean)|undefined)} options.layerFilter Layer filter function. The filter function will receive one argument, the
 * {@link ol.layer.Layer layer-candidate} and it should return a boolean value.
 * Only layers which are visible and for which this function returns `true`
 * will be tested for features. By default, all visible layers will be tested.
 * 
 * @param {number|undefined} options.hitTolerance Hit-detection tolerance in pixels. Pixels inside the radius around the given position
 * will be checked for features. This only works for the canvas renderer and
 * not for WebGL. Default is `0`.
 * 
 */


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
 *     autoPanAnimation: (olx.OverlayPanOptions|undefined),
 *     autoPanMargin: (number|undefined),
 *     className: (string|undefined)}}
 */
export let OverlayOptions;

/**
 * @param {OverlayOptions} options TODO: repace this
 *
 * @param {number|string|undefined} options.id Set the overlay id. The overlay id can be used with the
 * {@link ol.Map#getOverlayById} method.
 * 
 * @param {Element|undefined} options.element The overlay element.
 * 
 * @param {Array.<number>|undefined} options.offset Offsets in pixels used when positioning the overlay. The first element in the
 * array is the horizontal offset. A positive value shifts the overlay right.
 * The second element in the array is the vertical offset. A positive value
 * shifts the overlay down. Default is `[0, 0]`.
 * 
 * @param {ol.Coordinate|undefined} options.position The overlay position in map projection.
 * 
 * @param {ol.OverlayPositioning|string|undefined} options.positioning Defines how the overlay is actually positioned with respect to its `position`
 * property. Possible values are `'bottom-left'`, `'bottom-center'`,
 * `'bottom-right'`, `'center-left'`, `'center-center'`, `'center-right'`,
 * `'top-left'`, `'top-center'`, and `'top-right'`. Default is `'top-left'`.
 * 
 * @param {boolean|undefined} options.stopEvent Whether event propagation to the map viewport should be stopped. Default is
 * `true`. If `true` the overlay is placed in the same container as that of the
 * controls (CSS class name `ol-overlaycontainer-stopevent`); if `false` it is
 * placed in the container with CSS class name `ol-overlaycontainer`.
 * 
 * @param {boolean|undefined} options.insertFirst Whether the overlay is inserted first in the overlay container, or appended.
 * Default is `true`. If the overlay is placed in the same container as that of
 * the controls (see the `stopEvent` option) you will probably set `insertFirst`
 * to `true` so the overlay is displayed below the controls.
 * 
 * @param {boolean|undefined} options.autoPan If set to `true` the map is panned when calling `setPosition`, so that the
 * overlay is entirely visible in the current viewport.
 * The default is `false`.
 * 
 * @param {olx.OverlayPanOptions|undefined} options.autoPanAnimation The animation options used to pan the overlay into view. This animation
 * is only used when `autoPan` is enabled. A `duration` and `easing` may be
 * provided to customize the animation.
 * 
 * @param {number|undefined} options.autoPanMargin The margin (in pixels) between the overlay and the borders of the map when
 * autopanning. The default is `20`.
 * 
 * @param {string|undefined} options.className CSS class name. Default is `ol-overlay-container ol-selectable`.
 * 
 */


/**
 * @typedef {{
 *   duration: (number|undefined),
 *   easing: (undefined|function(number):number)
 * }}
 */
export let OverlayPanOptions;

/**
 * @param {OverlayPanOptions} options TODO: repace this
 *
 * @param {number|undefined} options.duration The duration of the animation in milliseconds. Default is `1000`.
 * 
 * @param {undefined|function(number):number} options.easing The easing function to use. Can be an {@link ol.easing} or a custom function.
 * Default is {@link ol.easing.inAndOut}.
 * 
 */


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
export let ProjectionOptions;

/**
 * @param {ProjectionOptions} options TODO: repace this
 *
 * @param {string} options.code The SRS identifier code, e.g. `EPSG:4326`.
 * 
 * @param {ol.proj.Units|string|undefined} options.units Units. Required unless a proj4 projection is defined for `code`.
 * 
 * @param {ol.Extent|undefined} options.extent The validity extent for the SRS.
 * 
 * @param {string|undefined} options.axisOrientation The axis orientation as specified in Proj4. The default is `enu`.
 * 
 * @param {boolean|undefined} options.global Whether the projection is valid for the whole globe. Default is `false`.
 * 
 * @param {number|undefined} options.metersPerUnit The meters per unit for the SRS. If not provided, the `units` are used to get
 * the meters per unit from the {@link ol.proj.METERS_PER_UNIT} lookup table.
 * 
 * @param {ol.Extent|undefined} options.worldExtent The world extent for the SRS.
 * 
 * @param {(function(number, ol.Coordinate):number|undefined)} options.getPointResolution Function to determine resolution at a point. The function is called with a
 * `{number}` view resolution and an `{ol.Coordinate}` as arguments, and returns
 * the `{number}` resolution at the passed coordinate. If this is `undefined`,
 * the default {@link ol.proj#getPointResolution} function will be used.
 * 
 */


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
export let ViewOptions;

/**
 * @param {ViewOptions} options TODO: repace this
 *
 * @param {ol.Coordinate|undefined} options.center The initial center for the view. The coordinate system for the center is
 * specified with the `projection` option. Default is `undefined`, and layer
 * sources will not be fetched if this is not set.
 * 
 * @param {boolean|number|undefined} options.constrainRotation Rotation constraint. `false` means no constraint. `true` means no constraint,
 * but snap to zero near zero. A number constrains the rotation to that number
 * of values. For example, `4` will constrain the rotation to 0, 90, 180, and
 * 270 degrees. The default is `true`.
 * 
 * @param {boolean|undefined} options.enableRotation Enable rotation. Default is `true`. If `false` a rotation constraint that
 * always sets the rotation to zero is used. The `constrainRotation` option
 * has no effect if `enableRotation` is `false`.
 * 
 * @param {ol.Extent|undefined} options.extent The extent that constrains the center, in other words, center cannot be set
 * outside this extent. Default is `undefined`.
 * 
 * @param {number|undefined} options.maxResolution The maximum resolution used to determine the resolution constraint. It is
 * used together with `minResolution` (or `maxZoom`) and `zoomFactor`. If
 * unspecified it is calculated in such a way that the projection's validity
 * extent fits in a 256x256 px tile. If the projection is Spherical Mercator
 * (the default) then `maxResolution` defaults to `40075016.68557849 / 256 =
 * 156543.03392804097`.
 * 
 * @param {number|undefined} options.minResolution The minimum resolution used to determine the resolution constraint.  It is
 * used together with `maxResolution` (or `minZoom`) and `zoomFactor`.  If
 * unspecified it is calculated assuming 29 zoom levels (with a factor of 2).
 * If the projection is Spherical Mercator (the default) then `minResolution`
 * defaults to `40075016.68557849 / 256 / Math.pow(2, 28) =
 * 0.0005831682455839253`.
 * 
 * @param {number|undefined} options.maxZoom The maximum zoom level used to determine the resolution constraint. It is
 * used together with `minZoom` (or `maxResolution`) and `zoomFactor`. Default
 * is `28`.  Note that if `minResolution` is also provided, it is given
 * precedence over `maxZoom`.
 * 
 * @param {number|undefined} options.minZoom The minimum zoom level used to determine the resolution constraint. It is
 * used together with `maxZoom` (or `minResolution`) and `zoomFactor`. Default
 * is `0`. Note that if `maxResolution` is also provided, it is given
 * precedence over `minZoom`.
 * 
 * @param {ol.ProjectionLike} options.projection The projection. Default is `EPSG:3857` (Spherical Mercator).
 * 
 * @param {number|undefined} options.resolution The initial resolution for the view. The units are `projection` units per
 * pixel (e.g. meters per pixel). An alternative to setting this is to set
 * `zoom`. Default is `undefined`, and layer sources will not be fetched if
 * neither this nor `zoom` are defined.
 * 
 * @param {Array.<number>|undefined} options.resolutions Resolutions to determine the resolution constraint. If set the
 * `maxResolution`, `minResolution`, `minZoom`, `maxZoom`, and `zoomFactor`
 * options are ignored.
 * 
 * @param {number|undefined} options.rotation The initial rotation for the view in radians (positive rotation clockwise).
 * Default is `0`.
 * 
 * @param {number|undefined} options.zoom Only used if `resolution` is not defined. Zoom level used to calculate the
 * initial resolution for the view. The initial resolution is determined using
 * the `ol.View#constrainResolution` method.
 * 
 * @param {number|undefined} options.zoomFactor The zoom factor used to determine the resolution constraint.  Default is `2`.
 * 
 */


/**
 * @typedef {{
 *   center: (ol.Coordinate|undefined),
 *   zoom: (number|undefined),
 *   resolution: (number|undefined),
 *   rotation: (number|undefined),
 *   anchor: (ol.Coordinate|undefined),
 *   duration: (number|undefined),
 *   easing: (undefined|function(number):number)
 * }}
 */
export let AnimationOptions;

/**
 * @param {AnimationOptions} options TODO: repace this
 *
 * @param {ol.Coordinate|undefined} options.center The center of the view at the end of the animation.
 * 
 * @param {number|undefined} options.zoom The zoom level of the view at the end of the animation.  This takes
 * precedence over `resolution`.
 * 
 * @param {number|undefined} options.resolution The resolution of the view at the end of the animation.  If `zoom` is also
 * provided, this option will be ignored.
 * 
 * @param {number|undefined} options.rotation The rotation of the view at the end of the animation.
 * 
 * @param {ol.Coordinate|undefined} options.anchor Optional anchor to remained fixed during a rotation or resolution animation.
 * 
 * @param {number|undefined} options.duration The duration of the animation in milliseconds (defaults to `1000`).
 * 
 * @param {undefined|function(number):number} options.easing The easing function used during the animation (defaults to {@link ol.easing.inAndOut}).
 * The function will be called for each frame with a number representing a
 * fraction of the animation's duration.  The function should return a number
 * between 0 and 1 representing the progress toward the destination state.
 * 
 */


/**
 * @typedef {{className: (string|undefined),
 *     collapsible: (boolean|undefined),
 *     collapsed: (boolean|undefined),
 *     tipLabel: (string|undefined),
 *     label: (string|Node|undefined),
 *     collapseLabel: (string|Node|undefined),
 *     render: (function(ol.MapEvent)|undefined),
 *     target: (Element|string|undefined)}}
 */
export let control_AttributionOptions;

/**
 * @param {control_AttributionOptions} options TODO: repace this
 *
 * @param {string|undefined} options.className CSS class name. Default is `ol-attribution`.
 * 
 * @param {Element|string|undefined} options.target Specify a target if you want the control to be rendered outside of the map's
 * viewport.
 * 
 * @param {boolean|undefined} options.collapsible Specify if attributions can be collapsed. If you use an OSM source,
 * should be set to `false` — see
 * {@link https://www.openstreetmap.org/copyright OSM Copyright} —
 * Default is `true`.
 * 
 * @param {boolean|undefined} options.collapsed Specify if attributions should be collapsed at startup. Default is `true`.
 * 
 * @param {string|undefined} options.tipLabel Text label to use for the button tip. Default is `Attributions`
 * 
 * @param {string|Node|undefined} options.label Text label to use for the collapsed attributions button. Default is `i`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * 
 * @param {string|Node|undefined} options.collapseLabel Text label to use for the expanded attributions button. Default is `»`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * 
 * @param {function(ol.MapEvent)|undefined} options.render Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * 
 */


/**
 * @typedef {{element: (Element|undefined),
 *     render: (function(ol.MapEvent)|undefined),
 *     target: (Element|string|undefined)}}
 */
export let control_ControlOptions;

/**
 * @param {control_ControlOptions} options TODO: repace this
 *
 * @param {Element|undefined} options.element The element is the control's container element. This only needs to be
 * specified if you're developing a custom control.
 * 
 * @param {function(ol.MapEvent)|undefined} options.render Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * 
 * @param {Element|string|undefined} options.target Specify a target if you want the control to be rendered outside of the map's
 * viewport.
 * 
 */


/**
 * @typedef {{attribution: (boolean|undefined),
 *     attributionOptions: (olx.control.AttributionOptions|undefined),
 *     rotate: (boolean|undefined),
 *     rotateOptions: (olx.control.RotateOptions|undefined),
 *     zoom: (boolean|undefined),
 *     zoomOptions: (olx.control.ZoomOptions|undefined)}}
 */
export let control_DefaultsOptions;

/**
 * @param {control_DefaultsOptions} options TODO: repace this
 *
 * @param {boolean|undefined} options.attribution Attribution. Default is `true`.
 * 
 * @param {olx.control.AttributionOptions|undefined} options.attributionOptions Attribution options.
 * 
 * @param {boolean|undefined} options.rotate Rotate. Default is `true`.
 * 
 * @param {olx.control.RotateOptions|undefined} options.rotateOptions Rotate options.
 * 
 * @param {boolean|undefined} options.zoom Zoom. Default is `true`.
 * 
 * @param {olx.control.ZoomOptions|undefined} options.zoomOptions Zoom options.
 * 
 */


/**
 * @typedef {{className: (string|undefined),
 *     label: (string|Node|undefined),
 *     labelActive: (string|Node|undefined),
 *     tipLabel: (string|undefined),
 *     keys: (boolean|undefined),
 *     target: (Element|string|undefined),
 *     source: (Element|string|undefined)}}
 */
export let control_FullScreenOptions;

/**
 * @param {control_FullScreenOptions} options TODO: repace this
 *
 * @param {string|undefined} options.className CSS class name. Default is `ol-full-screen`.
 * 
 * @param {string|Node|undefined} options.label Text label to use for the button. Default is `\u2922` (NORTH EAST AND SOUTH WEST ARROW).
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * 
 * @param {string|Node|undefined} options.labelActive Text label to use for the button when full-screen is active.
 * Default is `\u00d7` (a cross).
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * 
 * @param {string|undefined} options.tipLabel Text label to use for the button tip. Default is `Toggle full-screen`
 * 
 * @param {boolean|undefined} options.keys Full keyboard access.
 * 
 * @param {Element|string|undefined} options.target Specify a target if you want the control to be rendered outside of the map's
 * viewport.
 * 
 * @param {Element|string|undefined} options.source The element to be displayed fullscreen. When not provided, the element containing the map viewport will be displayed fullscreen.
 * 
 */


/**
 * @typedef {{className: (string|undefined),
 *     coordinateFormat: (ol.CoordinateFormatType|undefined),
 *     projection: ol.ProjectionLike,
 *     render: (function(ol.MapEvent)|undefined),
 *     target: (Element|string|undefined),
 *     undefinedHTML: (string|undefined)}}
 */
export let control_MousePositionOptions;

/**
 * @param {control_MousePositionOptions} options TODO: repace this
 *
 * @param {string|undefined} options.className CSS class name. Default is `ol-mouse-position`.
 * 
 * @param {ol.CoordinateFormatType|undefined} options.coordinateFormat Coordinate format.
 * 
 * @param {ol.ProjectionLike} options.projection Projection.
 * 
 * @param {function(ol.MapEvent)|undefined} options.render Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * 
 * @param {Element|string|undefined} options.target Specify a target if you want the control to be rendered outside of the map's
 * viewport.
 * 
 * @param {string|undefined} options.undefinedHTML Markup for undefined coordinates. Default is `` (empty string).
 * 
 */


/**
 * @typedef {{collapsed: (boolean|undefined),
 *     collapseLabel: (string|Node|undefined),
 *     collapsible: (boolean|undefined),
 *     label: (string|Node|undefined),
 *     layers: (Array.<ol.layer.Layer>|ol.Collection.<ol.layer.Layer>|undefined),
 *     render: (function(ol.MapEvent)|undefined),
 *     target: (Element|string|undefined),
 *     tipLabel: (string|undefined),
 *     view: (ol.View|undefined)}}
 */
export let control_OverviewMapOptions;

/**
 * @param {control_OverviewMapOptions} options TODO: repace this
 *
 * @param {boolean|undefined} options.collapsed Whether the control should start collapsed or not (expanded).
 * Default to `true`.
 * 
 * @param {string|Node|undefined} options.collapseLabel Text label to use for the expanded overviewmap button. Default is `«`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * 
 * @param {boolean|undefined} options.collapsible Whether the control can be collapsed or not. Default to `true`.
 * 
 * @param {string|Node|undefined} options.label Text label to use for the collapsed overviewmap button. Default is `»`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * 
 * @param {Array.<ol.layer.Layer>|ol.Collection.<ol.layer.Layer>|undefined} options.layers Layers for the overview map. If not set, then all main map layers are used
 * instead.
 * 
 * @param {function(ol.MapEvent)|undefined} options.render Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * 
 * @param {Element|string|undefined} options.target Specify a target if you want the control to be rendered outside of the map's
 * viewport.
 * 
 * @param {string|undefined} options.tipLabel Text label to use for the button tip. Default is `Overview map`
 * 
 * @param {ol.View|undefined} options.view Custom view for the overview map. If not provided, a default view with
 * an EPSG:3857 projection will be used.
 * 
 */


/**
 * @typedef {{className: (string|undefined),
 *     minWidth: (number|undefined),
 *     render: (function(ol.MapEvent)|undefined),
 *     target: (Element|string|undefined),
 *     units: (ol.control.ScaleLineUnits|string|undefined)}}
 */
export let control_ScaleLineOptions;

/**
 * @param {control_ScaleLineOptions} options TODO: repace this
 *
 * @param {string|undefined} options.className CSS Class name. Default is `ol-scale-line`.
 * 
 * @param {number|undefined} options.minWidth Minimum width in pixels. Default is `64`.
 * 
 * @param {function(ol.MapEvent)|undefined} options.render Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * 
 * @param {Element|string|undefined} options.target Specify a target if you want the control to be rendered outside of the map's
 * viewport.
 * 
 * @param {ol.control.ScaleLineUnits|string|undefined} options.units Units. Default is `metric`.
 * 
 */


/**
 * @typedef {{duration: (number|undefined),
 *     className: (string|undefined),
 *     label: (string|Element|undefined),
 *     tipLabel: (string|undefined),
 *     target: (Element|string|undefined),
 *     render: (function(ol.MapEvent)|undefined),
 *     resetNorth: (function()|undefined),
 *     autoHide: (boolean|undefined)}}
 */
export let control_RotateOptions;

/**
 * @param {control_RotateOptions} options TODO: repace this
 *
 * @param {string|undefined} options.className CSS class name. Default is `ol-rotate`.
 * 
 * @param {string|Element|undefined} options.label Text label to use for the rotate button. Default is `⇧`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * 
 * @param {string|undefined} options.tipLabel Text label to use for the rotate tip. Default is `Reset rotation`
 * 
 * @param {number|undefined} options.duration Animation duration in milliseconds. Default is `250`.
 * 
 * @param {boolean|undefined} options.autoHide Hide the control when rotation is 0. Default is `true`.
 * 
 * @param {function(ol.MapEvent)|undefined} options.render Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * 
 * @param {function()|undefined} options.resetNorth Function called when the control is clicked. This will override the
 * default resetNorth.
 * 
 * @param {Element|string|undefined} options.target Specify a target if you want the control to be rendered outside of the map's
 * viewport.
 * 
 */


/**
 * @typedef {{duration: (number|undefined),
 *     className: (string|undefined),
 *     zoomInLabel: (string|Node|undefined),
 *     zoomOutLabel: (string|Node|undefined),
 *     zoomInTipLabel: (string|undefined),
 *     zoomOutTipLabel: (string|undefined),
 *     delta: (number|undefined),
 *     target: (Element|string|undefined)}}
 */
export let control_ZoomOptions;

/**
 * @param {control_ZoomOptions} options TODO: repace this
 *
 * @param {number|undefined} options.duration Animation duration in milliseconds. Default is `250`.
 * 
 * @param {string|undefined} options.className CSS class name. Default is `ol-zoom`.
 * 
 * @param {string|Node|undefined} options.zoomInLabel Text label to use for the zoom-in button. Default is `+`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * 
 * @param {string|Node|undefined} options.zoomOutLabel Text label to use for the zoom-out button. Default is `-`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * 
 * @param {string|undefined} options.zoomInTipLabel Text label to use for the button tip. Default is `Zoom in`
 * 
 * @param {string|undefined} options.zoomOutTipLabel Text label to use for the button tip. Default is `Zoom out`
 * 
 * @param {number|undefined} options.delta The zoom delta applied on each click.
 * 
 * @param {Element|string|undefined} options.target Specify a target if you want the control to be rendered outside of the map's
 * viewport.
 * 
 */


/**
 * @typedef {{className: (string|undefined),
 *     duration: (number|undefined),
 *     maxResolution: (number|undefined),
 *     minResolution: (number|undefined),
 *     render: (function(ol.MapEvent)|undefined)}}
 */
export let control_ZoomSliderOptions;

/**
 * @param {control_ZoomSliderOptions} options TODO: repace this
 *
 * @param {string|undefined} options.className CSS class name.
 * 
 * @param {number|undefined} options.duration Animation duration in milliseconds. Default is `200`.
 * 
 * @param {number|undefined} options.maxResolution Maximum resolution.
 * 
 * @param {number|undefined} options.minResolution Minimum resolution.
 * 
 * @param {function(ol.MapEvent)|undefined} options.render Function called when the control should be re-rendered. This is called
 * in a requestAnimationFrame callback.
 * 
 */


/**
 * @typedef {{className: (string|undefined),
 *     target: (Element|string|undefined),
 *     label: (string|Node|undefined),
 *     tipLabel: (string|undefined),
 *     extent: (ol.Extent|undefined)}}
 */
export let control_ZoomToExtentOptions;

/**
 * @param {control_ZoomToExtentOptions} options TODO: repace this
 *
 * @param {string|undefined} options.className Class name. Default is `ol-zoom-extent`.
 * 
 * @param {Element|string|undefined} options.target Specify a target if you want the control to be rendered outside of the map's
 * viewport.
 * 
 * @param {string|Node|undefined} options.label Text label to use for the button. Default is `E`.
 * Instead of text, also a Node (e.g. a `span` element) can be used.
 * 
 * @param {string|undefined} options.tipLabel Text label to use for the button tip. Default is `Zoom to extent`
 * 
 * @param {ol.Extent|undefined} options.extent The extent to zoom to. If undefined the validity extent of the view
 * projection is used.
 * 
 */


/**
 * @typedef {{dataProjection: ol.ProjectionLike,
 *     extent: (ol.Extent|undefined),
 *     featureProjection: ol.ProjectionLike,
 *     rightHanded: (boolean|undefined)}}
 */
export let format_ReadOptions;

/**
 * @param {format_ReadOptions} options TODO: repace this
 *
 * @param {ol.ProjectionLike} options.dataProjection Projection of the data we are reading. If not provided, the projection will
 * be derived from the data (where possible) or the `defaultDataProjection` of
 * the format is assigned (where set). If the projection can not be derived from
 * the data and if no `defaultDataProjection` is set for a format, the features
 * will not be reprojected.
 * 
 * @param {ol.Extent} options.extent Tile extent of the tile being read. This is only used and required for
 * {@link ol.format.MVT}.
 * 
 * @param {ol.ProjectionLike} options.featureProjection Projection of the feature geometries created by the format reader. If not
 * provided, features will be returned in the `dataProjection`.
 * 
 */


/**
 * @typedef {{dataProjection: ol.ProjectionLike,
 *     featureProjection: ol.ProjectionLike,
 *     rightHanded: (boolean|undefined),
 *     decimals: (number|undefined)}}
 */
export let format_WriteOptions;

/**
 * @param {format_WriteOptions} options TODO: repace this
 *
 * @param {ol.ProjectionLike} options.dataProjection Projection of the data we are writing. If not provided, the
 * `defaultDataProjection` of the format is assigned (where set). If no
 * `defaultDataProjection` is set for a format, the features will be returned
 * in the `featureProjection`.
 * 
 * @param {ol.ProjectionLike} options.featureProjection Projection of the feature geometries that will be serialized by the format
 * writer. If not provided, geometries are assumed to be in the
 * `dataProjection` if that is set; in other words, they are not transformed.
 * 
 * @param {boolean|undefined} options.rightHanded When writing geometries, follow the right-hand rule for linear ring
 * orientation.  This means that polygons will have counter-clockwise exterior
 * rings and clockwise interior rings.  By default, coordinates are serialized
 * as they are provided at construction.  If `true`, the right-hand rule will
 * be applied.  If `false`, the left-hand rule will be applied (clockwise for
 * exterior and counter-clockwise for interior rings).  Note that not all
 * formats support this.  The GeoJSON format does use this property when writing
 * geometries.
 * 
 * 
 * @param {number|undefined} options.decimals Maximum number of decimal places for coordinates. Coordinates are stored
 * internally as floats, but floating-point arithmetic can create coordinates
 * with a large number of decimal places, not generally wanted on output.
 * Set a number here to round coordinates. Can also be used to ensure that
 * coordinates read in can be written back out with the same number of decimals.
 * Default is no rounding.
 * 
 * 
 */


/**
 * @typedef {{defaultDataProjection: ol.ProjectionLike,
 *     geometryName: (string|undefined),
 *     extractGeometryName: (boolean|undefined),
 *     featureProjection: ol.ProjectionLike}}
 */
export let format_GeoJSONOptions;

/**
 * @param {format_GeoJSONOptions} options TODO: repace this
 *
 * @param {ol.ProjectionLike} options.defaultDataProjection Default data projection. Default is `EPSG:4326`.
 * 
 * @param {ol.ProjectionLike} options.featureProjection Projection for features read or written by the format.  Options passed to
 * read or write methods will take precedence.
 * 
 * @param {string|undefined} options.geometryName Geometry name to use when creating features.
 * 
 * @param {boolean|undefined} options.extractGeometryName Certain GeoJSON providers include the geometry_name field in the feature
 * geoJSON. If set to `true` the geoJSON reader will look for that field to
 * set the geometry name. If both this field is set to `true` and a
 * `geometryName` is provided, the `geometryName` will take precedence.
 * Default is `false`.
 * 
 */


/**
 * @typedef {{geometryName: (string|undefined)}}
 */
export let format_EsriJSONOptions;

/**
 * @param {format_EsriJSONOptions} options TODO: repace this
 *
 * @param {string|undefined} options.geometryName Geometry name to use when creating features.
 * 
 */


/**
 * @typedef {{featureClass: (function((ol.geom.Geometry|Object.<string, *>)=)|
 *         function(ol.geom.GeometryType,Array.<number>,
 *             (Array.<number>|Array.<Array.<number>>),Object.<string, *>)|
 *         undefined),
 *     geometryName: (string|undefined),
 *     layers: (Array.<string>|undefined),
 *     layerName: (string|undefined)}}
 */
export let format_MVTOptions;

/**
 * @param {format_MVTOptions} options TODO: repace this
 *
 * @param {undefined|function((ol.geom.Geometry|Object.<string,*>)=)|    function(ol.geom.GeometryType,Array.<number>,
        (Array.<number>|Array.<Array.<number>>),Object.<string,*>,number)}
 options.featureClass Class for features returned by {@link ol.format.MVT#readFeatures}. Set to
 * {@link ol.Feature} to get full editing and geometry support at the cost of
 * decreased rendering performance. The default is {@link ol.render.Feature},
 * which is optimized for rendering and hit detection.
 * 
 * @param {string|undefined} options.geometryName Geometry name to use when creating features. Default is 'geometry'.
 * 
 * @param {string|undefined} options.layerName Name of the feature attribute that holds the layer name. Default is 'layer'.
 * 
 * @param {Array.<string>|undefined} options.layers Layers to read features from. If not provided, features will be read from all
 * layers.
 * 
 */


/**
 * @typedef {{factor: (number|undefined),
 *     geometryLayout: (ol.geom.GeometryLayout|undefined)}}
 */
export let format_PolylineOptions;

/**
 * @param {format_PolylineOptions} options TODO: repace this
 *
 * @param {number|undefined} options.factor The factor by which the coordinates values will be scaled.
 * Default is `1e5`.
 * 
 * @param {ol.geom.GeometryLayout|undefined} options.geometryLayout Layout of the feature geometries created by the format reader.
 * Default is `ol.geom.GeometryLayout.XY`.
 * 
 */


/**
 * @typedef {{
 *     defaultDataProjection: ol.ProjectionLike,
 *     layerName: (string|undefined),
 *     layers: (Array.<string>|undefined)
 * }}
 */
export let format_TopoJSONOptions;

/**
 * @param {format_TopoJSONOptions} options TODO: repace this
 *
 * @param {ol.ProjectionLike} options.defaultDataProjection Default data projection. Default is `EPSG:4326`.
 * 
 * @param {string|undefined} options.layerName Set the name of the TopoJSON topology `objects`'s children as feature
 * property with the specified name. This means that when set to `'layer'`, a
 * topology like
 * ```
 * {
 *   "type": "Topology",
 *   "objects": {
 *     "example": {
 *       "type": "GeometryCollection",
 *       "geometries": []
 *     }
 *   }
 * }
 * ```
 * will result in features that have a property `'layer'` set to `'example'`.
 * When not set, no property will be added to features.
 * 
 * @param {Array.<string>|undefined} options.layers Names of the TopoJSON topology's `objects`'s children to read features from.
 * If not provided, features will be read from all children.
 * 
 */


/**
 * @typedef {{altitudeMode: (ol.format.IGCZ|undefined)}}
 */
export let format_IGCOptions;

/**
 * @param {format_IGCOptions} options TODO: repace this
 *
 * @param {ol.format.IGCZ|undefined} options.altitudeMode Altitude mode. Possible values are `barometric`, `gps`, and `none`. Default
 * is `none`.
 * 
 */


/**
 * @typedef {{extractStyles: (boolean|undefined),
 *     defaultStyle: (Array.<ol.style.Style>|undefined),
 *     showPointNames: (boolean|undefined),
 *     writeStyles: (boolean|undefined)}}
 */
export let format_KMLOptions;

/**
 * @param {format_KMLOptions} options TODO: repace this
 *
 * @param {boolean|undefined} options.extractStyles Extract styles from the KML. Default is `true`.
 * 
 * @param {boolean|undefined} options.showPointNames Show names as labels for placemarks which contain points. Default is `true`.
 * 
 * @param {Array.<ol.style.Style>|undefined} options.defaultStyle Default style. The default default style is the same as Google Earth.
 * 
 * @param {boolean|undefined} options.writeStyles Write styles into KML. Default is `true`.
 * 
 */


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
export let format_GMLOptions;

/**
 * @param {format_GMLOptions} options TODO: repace this
 *
 * @param {Object.<string, string>|string|undefined} options.featureNS Feature namespace. If not defined will be derived from GML. If multiple
 * feature types have been configured which come from different feature
 * namespaces, this will be an object with the keys being the prefixes used
 * in the entries of featureType array. The values of the object will be the
 * feature namespaces themselves. So for instance there might be a featureType
 * item `topp:states` in the `featureType` array and then there will be a key
 * `topp` in the featureNS object with value `http://www.openplans.org/topp`.
 * 
 * @param {Array.<string>|string|undefined} options.featureType Feature type(s) to parse. If multiple feature types need to be configured
 * which come from different feature namespaces, `featureNS` will be an object
 * with the keys being the prefixes used in the entries of featureType array.
 * The values of the object will be the feature namespaces themselves.
 * So for instance there might be a featureType item `topp:states` and then
 * there will be a key named `topp` in the featureNS object with value
 * `http://www.openplans.org/topp`.
 * 
 * @param {string} options.srsName srsName to use when writing geometries.
 * 
 * @param {boolean|undefined} options.surface Write gml:Surface instead of gml:Polygon elements. This also affects the
 * elements in multi-part geometries. Default is `false`.
 * 
 * @param {boolean|undefined} options.curve Write gml:Curve instead of gml:LineString elements. This also affects the
 * elements in multi-part geometries. Default is `false`.
 * 
 * @param {boolean|undefined} options.multiCurve Write gml:MultiCurve instead of gml:MultiLineString. Since the latter is
 * deprecated in GML 3, the default is `true`.
 * 
 * @param {boolean|undefined} options.multiSurface Write gml:multiSurface instead of gml:MultiPolygon. Since the latter is
 * deprecated in GML 3, the default is `true`.
 * 
 * @param {string|undefined} options.schemaLocation Optional schemaLocation to use when writing out the GML, this will override
 * the default provided.
 * 
 */


/**
 * @typedef {{readExtensions: (function(ol.Feature, Node)|undefined)}}
 */
export let format_GPXOptions;

/**
 * @param {format_GPXOptions} options TODO: repace this
 *
 * @param {function(ol.Feature, Node)|undefined} options.readExtensions Callback function to process `extensions` nodes.
 * To prevent memory leaks, this callback function must
 * not store any references to the node. Note that the `extensions`
 * node is not allowed in GPX 1.0. Moreover, only `extensions`
 * nodes from `wpt`, `rte` and `trk` can be processed, as those are
 * directly mapped to a feature.
 * 
 */


/**
 * @typedef {{featureNS: (Object.<string, string>|string|undefined),
 *     featureType: (Array.<string>|string|undefined),
 *     gmlFormat: (ol.format.GMLBase|undefined),
 *     schemaLocation: (string|undefined)}}
 */
export let format_WFSOptions;

/**
 * @param {format_WFSOptions} options TODO: repace this
 *
 * @param {Object.<string, string>|string|undefined} options.featureNS The namespace URI used for features.
 * 
 * @param {Array.<string>|string|undefined} options.featureType The feature type to parse. Only used for read operations.
 * 
 * @param {ol.format.GMLBase|undefined} options.gmlFormat The GML format to use to parse the response. Default is `ol.format.GML3`.
 * 
 * @param {string|undefined} options.schemaLocation Optional schemaLocation to use for serialization, this will override the
 * default.
 * 
 */


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
 *     filter: (ol.format.filter.Filter|undefined),
 *     resultType: (string|undefined)}}
 */
export let format_WFSWriteGetFeatureOptions;

/**
 * @param {format_WFSWriteGetFeatureOptions} options TODO: repace this
 *
 * @param {string} options.featureNS The namespace URI used for features.
 * 
 * @param {string} options.featurePrefix The prefix for the feature namespace.
 * 
 * @param {Array.<string>} options.featureTypes The feature type names.
 * 
 * @param {string|undefined} options.srsName SRS name. No srsName attribute will be set on geometries when this is not
 * provided.
 * 
 * @param {string|undefined} options.handle Handle.
 * 
 * @param {string|undefined} options.outputFormat Output format.
 * 
 * @param {number|undefined} options.maxFeatures Maximum number of features to fetch.
 * 
 * @param {string|undefined} options.geometryName Geometry name to use in a BBOX filter.
 * 
 * @param {Array.<string>|undefined} options.propertyNames Optional list of property names to serialize.
 * 
 * @param {number|undefined} options.startIndex Start index to use for WFS paging. This is a WFS 2.0 feature backported to
 * WFS 1.1.0 by some Web Feature Services.
 * 
 * @param {number|undefined} options.count Number of features to retrieve when paging. This is a WFS 2.0 feature
 * backported to WFS 1.1.0 by some Web Feature Services. Please note that some
 * Web Feature Services have repurposed `maxfeatures` instead.
 * 
 * @param {ol.Extent|undefined} options.bbox Extent to use for the BBOX filter.
 * 
 * @param {ol.format.filter.Filter|undefined} options.filter Filter condition. See {@link ol.format.filter} for more information.
 * 
 * @param {string|undefined} options.resultType Indicates what response should be returned, E.g. `hits` only includes the
 * `numberOfFeatures` attribute in the response and no features.
 * 
 */


/**
 * @typedef {{featureNS: string,
 *     featurePrefix: string,
 *     featureType: string,
 *     srsName: (string|undefined),
 *     handle: (string|undefined),
 *     hasZ: (boolean|undefined),
 *     nativeElements: Array.<Object>,
 *     gmlOptions: (olx.format.GMLOptions|undefined),
 *     version: (string|undefined)}}
 */
export let format_WFSWriteTransactionOptions;

/**
 * @param {format_WFSWriteTransactionOptions} options TODO: repace this
 *
 * @param {string} options.featureNS The namespace URI used for features.
 * 
 * @param {string} options.featurePrefix The prefix for the feature namespace.
 * 
 * @param {string} options.featureType The feature type name.
 * 
 * @param {string|undefined} options.srsName SRS name. No srsName attribute will be set on geometries when this is not
 * provided.
 * 
 * @param {string|undefined} options.handle Handle.
 * 
 * @param {boolean|undefined} options.hasZ Must be set to true if the transaction is for a 3D layer. This will allow
 * the Z coordinate to be included in the transaction.
 * 
 * @param {Array.<Object>} options.nativeElements Native elements. Currently not supported.
 * 
 * @param {olx.format.GMLOptions|undefined} options.gmlOptions GML options for the WFS transaction writer.
 * 
 * @param {string|undefined} options.version WFS version to use for the transaction. Can be either `1.0.0` or `1.1.0`.
 * Default is `1.1.0`.
 * 
 */


/**
 * @typedef {{splitCollection: (boolean|undefined)}}
 */
export let format_WKTOptions;

/**
 * @param {format_WKTOptions} options TODO: repace this
 *
 * @param {boolean|undefined} options.splitCollection Whether to split GeometryCollections into
 * multiple features on reading. Default is `false`.
 * 
 */


/**
 * @typedef {{
 *     layers: (Array.<string>|undefined)
 * }}
 */
export let format_WMSGetFeatureInfoOptions;

/**
 * @param {format_WMSGetFeatureInfoOptions} options TODO: repace this
 *
 * @param {Array.<string>|undefined} options.layers If set, only features of the given layers will be returned by the format
 * when read.
 * 
 */


/**
 * Interactions for the map. Default is `true` for all options.
 * @typedef {{
 *     altShiftDragRotate: (boolean|undefined),
 *     constrainResolution: (boolean|undefined),
 *     doubleClickZoom: (boolean|undefined),
 *     keyboard: (boolean|undefined),
 *     mouseWheelZoom: (boolean|undefined),
 *     shiftDragZoom: (boolean|undefined),
 *     dragPan: (boolean|undefined),
 *     pinchRotate: (boolean|undefined),
 *     pinchZoom: (boolean|undefined),
 *     zoomDelta: (number|undefined),
 *     zoomDuration: (number|undefined)
 * }}
 */
export let interaction_DefaultsOptions;

/**
 * @param {interaction_DefaultsOptions} options TODO: repace this
 *
 * @param {boolean|undefined} options.altShiftDragRotate Whether Alt-Shift-drag rotate is desired. Default is `true`.
 * 
 * @param {boolean|undefined} options.constrainResolution Zoom to the closest integer zoom level after the wheel/trackpad or
 * pinch gesture ends. Default is `false`.
 * 
 * @param {boolean|undefined} options.doubleClickZoom Whether double click zoom is desired. Default is `true`.
 * 
 * @param {boolean|undefined} options.keyboard Whether keyboard interaction is desired. Default is `true`.
 * 
 * @param {boolean|undefined} options.mouseWheelZoom Whether mousewheel zoom is desired. Default is `true`.
 * 
 * @param {boolean|undefined} options.shiftDragZoom Whether Shift-drag zoom is desired. Default is `true`.
 * 
 * @param {boolean|undefined} options.dragPan Whether drag pan is desired. Default is `true`.
 * 
 * @param {boolean|undefined} options.pinchRotate Whether pinch rotate is desired. Default is `true`.
 * 
 * @param {boolean|undefined} options.pinchZoom Whether pinch zoom is desired. Default is `true`.
 * 
 * @param {number|undefined} options.zoomDelta Zoom delta.
 * 
 * @param {number|undefined} options.zoomDuration Zoom duration.
 * 
 */


/**
 * @typedef {{duration: (number|undefined),
 *     delta: (number|undefined)}}
 */
export let interaction_DoubleClickZoomOptions;

/**
 * @param {interaction_DoubleClickZoomOptions} options TODO: repace this
 *
 * @param {number|undefined} options.duration Animation duration in milliseconds. Default is `250`.
 * 
 * @param {number|undefined} options.delta The zoom delta applied on each double click, default is `1`.
 * 
 */


/**
 * @typedef {{formatConstructors: (Array.<function(new: ol.format.Feature)>|undefined),
 *     source: (ol.source.Vector|undefined),
 *     projection: ol.ProjectionLike,
 *     target: (Element|undefined)}}
 */
export let interaction_DragAndDropOptions;

/**
 * @param {interaction_DragAndDropOptions} options TODO: repace this
 *
 * @param {Array.<function(new: ol.format.Feature)>|undefined} options.formatConstructors Format constructors.
 * 
 * @param {ol.source.Vector|undefined} options.source Optional vector source where features will be added.  If a source is provided
 * all existing features will be removed and new features will be added when
 * they are dropped on the target.  If you want to add features to a vector
 * source without removing the existing features (append only), instead of
 * providing the source option listen for the "addfeatures" event.
 * 
 * @param {ol.ProjectionLike} options.projection Target projection. By default, the map's view's projection is used.
 * 
 * @param {Element|undefined} options.target The element that is used as the drop target, default is the viewport element.
 * 
 */


/**
 * @typedef {{className: (string|undefined),
 *     condition: (ol.EventsConditionType|undefined),
 *     minArea: (number|undefined),
 *     boxEndCondition: (ol.DragBoxEndConditionType|undefined)}}
 */
export let interaction_DragBoxOptions;

/**
 * @param {interaction_DragBoxOptions} options TODO: repace this
 *
 * @param {string|undefined} options.className CSS class name for styling the box. The default is `ol-dragbox`.
 * 
 * @param {ol.EventsConditionType|undefined} options.condition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.always}.
 * 
 * @param {number|undefined} options.minArea The minimum area of the box in pixel, this value is used by the default
 * `boxEndCondition` function. Default is `64`.
 * 
 * @param {ol.DragBoxEndConditionType|undefined} options.boxEndCondition A function that takes a {@link ol.MapBrowserEvent} and two
 * {@link ol.Pixel}s to indicate whether a `boxend` event should be fired.
 * Default is `true` if the area of the box is bigger than the `minArea` option.
 * 
 */


/**
 * @typedef {{condition: (ol.EventsConditionType|undefined),
 *     kinetic: (ol.Kinetic|undefined)}}
 */
export let interaction_DragPanOptions;

/**
 * @param {interaction_DragPanOptions} options TODO: repace this
 *
 * @param {ol.EventsConditionType|undefined} options.condition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.noModifierKeys}.
 * 
 * @param {ol.Kinetic|undefined} options.kinetic Kinetic inertia to apply to the pan.
 * 
 */


/**
 * @typedef {{condition: (ol.EventsConditionType|undefined),
 *     duration: (number|undefined)}}
 */
export let interaction_DragRotateAndZoomOptions;

/**
 * @param {interaction_DragRotateAndZoomOptions} options TODO: repace this
 *
 * @param {ol.EventsConditionType|undefined} options.condition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.shiftKeyOnly}.
 * 
 * @param {number|undefined} options.duration Animation duration in milliseconds. Default is `400`.
 * 
 */


/**
 * @typedef {{condition: (ol.EventsConditionType|undefined),
 *     duration: (number|undefined)}}
 */
export let interaction_DragRotateOptions;

/**
 * @param {interaction_DragRotateOptions} options TODO: repace this
 *
 * @param {ol.EventsConditionType|undefined} options.condition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.altShiftKeysOnly}.
 * 
 * @param {number|undefined} options.duration Animation duration in milliseconds. Default is `250`.
 * 
 */


/**
 * @typedef {{className: (string|undefined),
 *     condition: (ol.EventsConditionType|undefined),
 *     duration: (number|undefined),
 *     out: (boolean|undefined)}}
 */
export let interaction_DragZoomOptions;

/**
 * @param {interaction_DragZoomOptions} options TODO: repace this
 *
 * @param {string|undefined} options.className CSS class name for styling the box. The default is `ol-dragzoom`.
 * 
 * @param {ol.EventsConditionType|undefined} options.condition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.shiftKeyOnly}.
 * 
 * @param {number|undefined} options.duration Animation duration in milliseconds. Default is `200`.
 * 
 * @param {boolean|undefined} options.out Use interaction for zooming out. Default is `false`.
 * 
 */


/**
 * @typedef {{clickTolerance: (number|undefined),
 *     features: (ol.Collection.<ol.Feature>|undefined),
 *     source: (ol.source.Vector|undefined),
 *     snapTolerance: (number|undefined),
 *     type: (ol.geom.GeometryType|string),
 *     stopClick: (boolean|undefined),
 *     maxPoints: (number|undefined),
 *     minPoints: (number|undefined),
 *     finishCondition: (ol.EventsConditionType|undefined),
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined),
 *     geometryFunction: (ol.DrawGeometryFunctionType|undefined),
 *     geometryName: (string|undefined),
 *     condition: (ol.EventsConditionType|undefined),
 *     freehand: (boolean|undefined),
 *     freehandCondition: (ol.EventsConditionType|undefined),
 *     wrapX: (boolean|undefined)}}
 */
export let interaction_DrawOptions;

/**
 * @param {interaction_DrawOptions} options TODO: repace this
 *
 * @param {number|undefined} options.clickTolerance The maximum distance in pixels between "down" and "up" for a "up" event
 * to be considered a "click" event and actually add a point/vertex to the
 * geometry being drawn.  Default is 6 pixels.  That value was chosen for
 * the draw interaction to behave correctly on mouse as well as on touch
 * devices.
 * 
 * @param {ol.Collection.<ol.Feature>|undefined} options.features Destination collection for the drawn features.
 * 
 * @param {ol.source.Vector|undefined} options.source Destination source for the drawn features.
 * 
 * @param {number|undefined} options.snapTolerance Pixel distance for snapping to the drawing finish. Default is `12`.
 * 
 * @param {ol.geom.GeometryType|string} options.type Drawing type ('Point', 'LineString', 'Polygon', 'MultiPoint',
 * 'MultiLineString', 'MultiPolygon' or 'Circle').
 * 
 * @param {boolean|undefined} options.stopClick Stop click, singleclick, and doubleclick events from firing during drawing.
 * Default is `false`.
 * 
 * @param {number|undefined} options.maxPoints The number of points that can be drawn before a polygon ring or line string
 * is finished. The default is no restriction.
 * 
 * @param {number|undefined} options.minPoints The number of points that must be drawn before a polygon ring or line string
 * can be finished. Default is `3` for polygon rings and `2` for line strings.
 * 
 * @param {ol.EventsConditionType|undefined} options.finishCondition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether the drawing can be finished.
 * 
 * @param {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined} options.style Style for sketch features.
 * 
 * @param {ol.DrawGeometryFunctionType|undefined} options.geometryFunction Function that is called when a geometry's coordinates are updated.
 * 
 * @param {string|undefined} options.geometryName Geometry name to use for features created by the draw interaction.
 * 
 * @param {ol.EventsConditionType|undefined} options.condition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * By default {@link ol.events.condition.noModifierKeys}, i.e. a click, adds a
 * vertex or deactivates freehand drawing.
 * 
 * @param {boolean|undefined} options.freehand Operate in freehand mode for lines, polygons, and circles.  This makes the
 * interaction always operate in freehand mode and takes precedence over any
 * `freehandCondition` option.
 * 
 * @param {ol.EventsConditionType|undefined} options.freehandCondition Condition that activates freehand drawing for lines and polygons. This
 * function takes an {@link ol.MapBrowserEvent} and returns a boolean to
 * indicate whether that event should be handled. The default is
 * {@link ol.events.condition.shiftKeyOnly}, meaning that the Shift key
 * activates freehand drawing.
 * 
 * @param {boolean|undefined} options.wrapX Wrap the world horizontally on the sketch overlay. Default is `false`.
 * 
 */


/**
 * @typedef {{extent: (ol.Extent|undefined),
 *     boxStyle: (ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined),
 *     pixelTolerance: (number|undefined),
 *     pointerStyle: (ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined),
 *     wrapX: (boolean|undefined)}}
 * @api
 */
export let interaction_ExtentOptions;

/**
 * @param {interaction_ExtentOptions} options TODO: repace this
 *
 * @param {ol.Extent|undefined} options.extent Initial extent. Defaults to no initial extent
 * 
 * @param {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined} options.boxStyle Style for the drawn extent box.
 * Defaults to ol.style.Style.createDefaultEditing()[ol.geom.GeometryType.POLYGON]
 * 
 * @param {number|undefined} options.pixelTolerance Pixel tolerance for considering the pointer close enough to a segment or
 * vertex for editing. Default is `10`.
 * 
 * @param {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined} options.pointerStyle Style for the cursor used to draw the extent.
 * Defaults to ol.style.Style.createDefaultEditing()[ol.geom.GeometryType.POINT]
 * 
 * @param {boolean|undefined} options.wrapX Wrap the drawn extent across multiple maps in the X direction?
 * Only affects visuals, not functionality. Defaults to false.
 * 
 */


/**
 * @typedef {{
 *     features: (ol.Collection.<ol.Feature>|undefined),
 *     layers: (undefined|Array.<ol.layer.Layer>|function(ol.layer.Layer): boolean),
 *     hitTolerance: (number|undefined)
 * }}
 */
export let interaction_TranslateOptions;

/**
 * @param {interaction_TranslateOptions} options TODO: repace this
 *
 * @param {ol.Collection.<ol.Feature>|undefined} options.features Only features contained in this collection will be able to be translated. If
 * not specified, all features on the map will be able to be translated.
 * 
 * @param {undefined|Array.<ol.layer.Layer>|function(ol.layer.Layer): boolean} options.layers A list of layers from which features should be
 * translated. Alternatively, a filter function can be provided. The
 * function will be called for each layer in the map and should return
 * `true` for layers that you want to be translatable. If the option is
 * absent, all visible layers will be considered translatable.
 * 
 * @param {number|undefined} options.hitTolerance Hit-detection tolerance. Pixels inside the radius around the given position
 * will be checked for features. This only works for the canvas renderer and
 * not for WebGL. Default is `0`.
 * 
 */


/**
 * @typedef {{condition: (ol.EventsConditionType|undefined),
 *     duration: (number|undefined),
 *     pixelDelta: (number|undefined)}}
 */
export let interaction_KeyboardPanOptions;

/**
 * @param {interaction_KeyboardPanOptions} options TODO: repace this
 *
 * @param {ol.EventsConditionType|undefined} options.condition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.noModifierKeys} and
 * {@link ol.events.condition.targetNotEditable}.
 * 
 * @param {number|undefined} options.duration Animation duration in milliseconds. Default is `100`.
 * 
 * @param {number|undefined} options.pixelDelta Pixel The amount to pan on each key press. Default is `128` pixels.
 * 
 */


/**
 * @typedef {{duration: (number|undefined),
 *     condition: (ol.EventsConditionType|undefined),
 *     delta: (number|undefined)}}
 */
export let interaction_KeyboardZoomOptions;

/**
 * @param {interaction_KeyboardZoomOptions} options TODO: repace this
 *
 * @param {number|undefined} options.duration Animation duration in milliseconds. Default is `100`.
 * 
 * @param {ol.EventsConditionType|undefined} options.condition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * Default is {@link ol.events.condition.targetNotEditable}.
 * 
 * @param {number|undefined} options.delta The amount to zoom on each key press. Default is `1`.
 * 
 */


/**
 * @typedef {{
 *     condition: (ol.EventsConditionType|undefined),
 *     deleteCondition: (ol.EventsConditionType|undefined),
 *     insertVertexCondition: (ol.EventsConditionType|undefined),
 *     pixelTolerance: (number|undefined),
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined),
 *     source: (ol.source.Vector|undefined),
 *     features: (ol.Collection.<ol.Feature>|undefined),
 *     wrapX: (boolean|undefined)
 * }}
 */
export let interaction_ModifyOptions;

/**
 * @param {interaction_ModifyOptions} options TODO: repace this
 *
 * @param {ol.EventsConditionType|undefined} options.condition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event will be considered to add or move a vertex
 * to the sketch.
 * Default is {@link ol.events.condition.primaryAction}.
 * 
 * @param {ol.EventsConditionType|undefined} options.deleteCondition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * By default, {@link ol.events.condition.singleClick} with
 * {@link ol.events.condition.altKeyOnly} results in a vertex deletion.
 * 
 * @param {ol.EventsConditionType|undefined} options.insertVertexCondition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether a new vertex can be added to the sketch features.
 * Default is {@link ol.events.condition.always}
 * 
 * @param {number|undefined} options.pixelTolerance Pixel tolerance for considering the pointer close enough to a segment or
 * vertex for editing. Default is `10`.
 * 
 * @param {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined} options.style Style used for the features being modified. By default the default edit
 * style is used (see {@link ol.style}).
 * 
 * @param {ol.source.Vector|undefined} options.source The vector source with features to modify.  If a vector source is not
 * provided, a feature collection must be provided with the features option.
 * 
 * @param {ol.Collection.<ol.Feature>|undefined} options.features The features the interaction works on.  If a feature collection is not
 * provided, a vector source must be provided with the source option.
 * 
 * @param {boolean|undefined} options.wrapX Wrap the world horizontally on the sketch overlay. Default is `false`.
 * 
 */


/**
 * @typedef {{constrainResolution: (boolean|undefined),
 *     duration: (number|undefined),
 *     timeout: (number|undefined),
 *     useAnchor: (boolean|undefined)}}
 */
export let interaction_MouseWheelZoomOptions;

/**
 * @param {interaction_MouseWheelZoomOptions} options TODO: repace this
 *
 * @param {number|undefined} options.duration Animation duration in milliseconds. Default is `250`.
 * 
 * @param {number|undefined} options.timeout Mouse wheel timeout duration in milliseconds. Default is `80`.
 * 
 * @param {boolean|undefined} options.constrainResolution When using a trackpad or magic mouse, zoom to the closest integer zoom level
 * after the scroll gesture ends.
 * Default is `false`.
 * 
 * @param {boolean|undefined} options.useAnchor Enable zooming using the mouse's location as the anchor. Default is `true`.
 * When set to false, zooming in and out will zoom to the center of the screen
 * instead of zooming on the mouse's location.
 * 
 */


/**
 * @typedef {{threshold: (number|undefined),
 *     duration: (number|undefined)}}
 */
export let interaction_PinchRotateOptions;

/**
 * @param {interaction_PinchRotateOptions} options TODO: repace this
 *
 * @param {number|undefined} options.duration The duration of the animation in milliseconds. Default is `250`.
 * 
 * @param {number|undefined} options.threshold Minimal angle in radians to start a rotation. Default is `0.3`.
 * 
 */


/**
 * @typedef {{
 *     duration: (number|undefined),
 *     constrainResolution: (boolean|undefined)
 * }}
 */
export let interaction_PinchZoomOptions;

/**
 * @param {interaction_PinchZoomOptions} options TODO: repace this
 *
 * @param {number|undefined} options.duration Animation duration in milliseconds. Default is `400`.
 * 
 * @param {boolean|undefined} options.constrainResolution Zoom to the closest integer zoom level after the pinch gesture ends. Default is `false`.
 * 
 */


/**
 * @typedef {{handleDownEvent: (function(ol.MapBrowserPointerEvent):boolean|undefined),
 *     handleDragEvent: (function(ol.MapBrowserPointerEvent)|undefined),
 *     handleEvent: (function(ol.MapBrowserEvent):boolean|undefined),
 *     handleMoveEvent: (function(ol.MapBrowserPointerEvent)|undefined),
 *     handleUpEvent: (function(ol.MapBrowserPointerEvent):boolean|undefined)}}
 */
export let interaction_PointerOptions;

/**
 * @param {interaction_PointerOptions} options TODO: repace this
 *
 * @param {(function(ol.MapBrowserPointerEvent):boolean|undefined)} options.handleDownEvent Function handling "down" events. If the function returns `true` then a drag
 * sequence is started.
 * 
 * @param {(function(ol.MapBrowserPointerEvent)|undefined)} options.handleDragEvent Function handling "drag" events. This function is called on "move" events
 * during a drag sequence.
 * 
 * @param {(function(ol.MapBrowserEvent):boolean|undefined)} options.handleEvent Method called by the map to notify the interaction that a browser event was
 * dispatched to the map. The function may return `false` to prevent the
 * propagation of the event to other interactions in the map's interactions
 * chain.
 * 
 * @param {(function(ol.MapBrowserPointerEvent)|undefined)} options.handleMoveEvent Function handling "move" events. This function is called on "move" events,
 * also during a drag sequence (so during a drag sequence both the
 * `handleDragEvent` function and this function are called).
 * 
 * @param {(function(ol.MapBrowserPointerEvent):boolean|undefined)} options.handleUpEvent Function handling "up" events. If the function returns `false` then the
 * current drag sequence is stopped.
 * 
 */


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
 *     wrapX: (boolean|undefined),
 *     hitTolerance: (number|undefined)}}
 */
export let interaction_SelectOptions;

/**
 * @param {interaction_SelectOptions} options TODO: repace this
 *
 * @param {ol.EventsConditionType|undefined} options.addCondition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * By default, this is {@link ol.events.condition.never}. Use this if you want
 * to use different events for add and remove instead of `toggle`.
 * 
 * @param {ol.EventsConditionType|undefined} options.condition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * This is the event for the selected features as a whole. By default, this is
 * {@link ol.events.condition.singleClick}. Clicking on a feature selects that
 * feature and removes any that were in the selection. Clicking outside any
 * feature removes all from the selection.
 * See `toggle`, `add`, `remove` options for adding/removing extra features to/
 * from the selection.
 * 
 * @param {undefined|Array.<ol.layer.Layer>|function(ol.layer.Layer): boolean} options.layers A list of layers from which features should be
 * selected. Alternatively, a filter function can be provided. The
 * function will be called for each layer in the map and should return
 * `true` for layers that you want to be selectable. If the option is
 * absent, all visible layers will be considered selectable.
 * 
 * @param {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined} options.style Style for the selected features. By default the default edit style is used
 * (see {@link ol.style}).
 * 
 * @param {ol.EventsConditionType|undefined} options.removeCondition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * By default, this is {@link ol.events.condition.never}. Use this if you want
 * to use different events for add and remove instead of `toggle`.
 * 
 * @param {ol.EventsConditionType|undefined} options.toggleCondition A function that takes an {@link ol.MapBrowserEvent} and returns a boolean
 * to indicate whether that event should be handled.
 * This is in addition to the `condition` event. By default,
 * {@link ol.events.condition.shiftKeyOnly}, i.e. pressing `shift` as well as
 * the `condition` event, adds that feature to the current selection if it is
 * not currently selected, and removes it if it is.
 * See `add` and `remove` if you want to use different events instead of a
 * toggle.
 * 
 * @param {boolean|undefined} options.multi A boolean that determines if the default behaviour should select only
 * single features or all (overlapping) features at the clicked map
 * position. Default is false i.e single select
 * 
 * @param {ol.Collection.<ol.Feature>|undefined} options.features Collection where the interaction will place selected features. Optional. If
 * not set the interaction will create a collection. In any case the collection
 * used by the interaction is returned by
 * {@link ol.interaction.Select#getFeatures}.
 * 
 * @param {ol.SelectFilterFunction|undefined} options.filter A function that takes an {@link ol.Feature} and an {@link ol.layer.Layer} and
 * returns `true` if the feature may be selected or `false` otherwise.
 * 
 * @param {boolean|undefined} options.wrapX Wrap the world horizontally on the selection overlay. Default is `true`.
 * 
 * @param {number|undefined} options.hitTolerance Hit-detection tolerance. Pixels inside the radius around the given position
 * will be checked for features. This only works for the canvas renderer and
 * not for WebGL. Default is `0`.
 * 
 */


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
export let interaction_SnapOptions;

/**
 * @param {interaction_SnapOptions} options TODO: repace this
 *
 * @param {ol.Collection.<ol.Feature>|undefined} options.features Snap to these features. Either this option or source should be provided.
 * 
 * @param {boolean|undefined} options.edge Snap to edges. Default is `true`.
 * 
 * @param {boolean|undefined} options.vertex Snap to vertices. Default is `true`.
 * 
 * @param {number|undefined} options.pixelTolerance Pixel tolerance for considering the pointer close enough to a segment or
 * vertex for snapping. Default is `10` pixels.
 * 
 * @param {ol.source.Vector|undefined} options.source Snap to features from this source. Either this option or features should be provided
 * 
 */


/**
 * @typedef {{opacity: (number|undefined),
 *     visible: (boolean|undefined),
 *     extent: (ol.Extent|undefined),
 *     zIndex: (number|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined)}}
 */
export let layer_BaseOptions;

/**
 * @param {layer_BaseOptions} options TODO: repace this
 *
 * @param {number|undefined} options.opacity Opacity (0, 1). Default is `1`.
 * 
 * @param {boolean|undefined} options.visible Visibility. Default is `true`.
 * 
 * @param {ol.Extent|undefined} options.extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * 
 * @param {number|undefined} options.zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * 
 * @param {number|undefined} options.minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * 
 * @param {number|undefined} options.maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * 
 */


/**
 * @typedef {{opacity: (number|undefined),
 *     source: (ol.source.Source|undefined),
 *     visible: (boolean|undefined),
 *     extent: (ol.Extent|undefined),
 *     zIndex: (number|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined)}}
 */
export let layer_LayerOptions;

/**
 * @param {layer_LayerOptions} options TODO: repace this
 *
 * @param {number|undefined} options.opacity Opacity (0, 1). Default is `1`.
 * 
 * @param {ol.source.Source|undefined} options.source Source for this layer.  If not provided to the constructor, the source can
 * be set by calling {@link ol.layer.Layer#setSource layer.setSource(source)}
 * after construction.
 * 
 * @param {boolean|undefined} options.visible Visibility. Default is `true` (visible).
 * 
 * @param {ol.Extent|undefined} options.extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * 
 * @param {number|undefined} options.zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * 
 * @param {number|undefined} options.minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * 
 * @param {number|undefined} options.maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * 
 */


/**
 * @typedef {{opacity: (number|undefined),
 *     visible: (boolean|undefined),
 *     extent: (ol.Extent|undefined),
 *     zIndex: (number|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     layers: (Array.<ol.layer.Base>|ol.Collection.<ol.layer.Base>|undefined)}}
 */
export let layer_GroupOptions;

/**
 * @param {layer_GroupOptions} options TODO: repace this
 *
 * @param {number|undefined} options.opacity Opacity (0, 1). Default is `1`.
 * 
 * @param {boolean|undefined} options.visible Visibility. Default is `true`.
 * 
 * @param {ol.Extent|undefined} options.extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * 
 * @param {number|undefined} options.zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * 
 * @param {number|undefined} options.minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * 
 * @param {number|undefined} options.maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * 
 * @param {Array.<ol.layer.Base>|ol.Collection.<ol.layer.Base>|undefined} options.layers Child layers.
 * 
 */


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
 *     visible: (boolean|undefined),
 *     zIndex: (number|undefined)}}
 */
export let layer_HeatmapOptions;

/**
 * @param {layer_HeatmapOptions} options TODO: repace this
 *
 * @param {Array.<string>|undefined} options.gradient The color gradient of the heatmap, specified as an array of CSS color
 * strings. Default is `['#00f', '#0ff', '#0f0', '#ff0', '#f00']`.
 * 
 * @param {number|undefined} options.radius Radius size in pixels. Default is `8`.
 * 
 * @param {number|undefined} options.blur Blur size in pixels. Default is `15`.
 * 
 * @param {number|undefined} options.shadow Shadow size in pixels. Default is `250`.
 * 
 * @param {string|function(ol.Feature):number|undefined} options.weight The feature attribute to use for the weight or a function that returns a
 * weight from a feature. Weight values should range from 0 to 1 (and values
 * outside will be clamped to that range). Default is `weight`.
 * 
 * @param {ol.Extent|undefined} options.extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * 
 * @param {number|undefined} options.minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * 
 * @param {number|undefined} options.maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * 
 * @param {number|undefined} options.opacity Opacity. 0-1. Default is `1`.
 * 
 * @param {ol.source.Vector} options.source Source.
 * 
 * @param {boolean|undefined} options.visible Visibility. Default is `true` (visible).
 * 
 * @param {number|undefined} options.zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * 
 */


/**
 * @typedef {{opacity: (number|undefined),
 *     map: (ol.PluggableMap|undefined),
 *     source: (ol.source.Image|undefined),
 *     visible: (boolean|undefined),
 *     extent: (ol.Extent|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     zIndex: (number|undefined)}}
 */
export let layer_ImageOptions;

/**
 * @param {layer_ImageOptions} options TODO: repace this
 *
 * @param {number|undefined} options.opacity Opacity (0, 1). Default is `1`.
 * 
 * @param {ol.source.Image} options.source Source for this layer.
 * 
 * @param {ol.PluggableMap|undefined} options.map Sets the layer as overlay on a map. The map will not manage this layer in its
 * layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it
 * managed by the map is to use {@link ol.Map#addLayer}.
 * 
 * @param {boolean|undefined} options.visible Visibility. Default is `true` (visible).
 * 
 * @param {ol.Extent|undefined} options.extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * 
 * @param {number|undefined} options.minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * 
 * @param {number|undefined} options.maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * 
 * @param {number|undefined} options.zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * 
 */


/**
 * @typedef {{opacity: (number|undefined),
 *     preload: (number|undefined),
 *     source: (ol.source.Tile|undefined),
 *     map: (ol.PluggableMap|undefined),
 *     visible: (boolean|undefined),
 *     extent: (ol.Extent|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     useInterimTilesOnError: (boolean|undefined),
 *     zIndex: (number|undefined)}}
 */
export let layer_TileOptions;

/**
 * @param {layer_TileOptions} options TODO: repace this
 *
 * @param {number|undefined} options.opacity Opacity (0, 1). Default is `1`.
 * 
 * @param {number|undefined} options.preload Preload. Load low-resolution tiles up to `preload` levels. By default
 * `preload` is `0`, which means no preloading.
 * 
 * @param {ol.source.Tile} options.source Source for this layer.
 * 
 * @param {ol.PluggableMap|undefined} options.map Sets the layer as overlay on a map. The map will not manage this layer in its
 * layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it
 * managed by the map is to use {@link ol.Map#addLayer}.
 * 
 * @param {boolean|undefined} options.visible Visibility. Default is `true` (visible).
 * 
 * @param {ol.Extent|undefined} options.extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * 
 * @param {number|undefined} options.minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * 
 * @param {number|undefined} options.maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * 
 * @param {boolean|undefined} options.useInterimTilesOnError Use interim tiles on error. Default is `true`.
 * 
 * @param {number|undefined} options.zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * 
 */


/**
 * @typedef {{renderOrder: (ol.RenderOrderFunction|null|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     opacity: (number|undefined),
 *     renderBuffer: (number|undefined),
 *     renderMode: (ol.layer.VectorRenderType|string|undefined),
 *     source: (ol.source.Vector|undefined),
 *     map: (ol.PluggableMap|undefined),
 *     declutter: (boolean|undefined),
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined),
 *     updateWhileAnimating: (boolean|undefined),
 *     updateWhileInteracting: (boolean|undefined),
 *     visible: (boolean|undefined),
 *     zIndex: (number|undefined)}}
 */
export let layer_VectorOptions;

/**
 * @param {layer_VectorOptions} options TODO: repace this
 *
 * @param {ol.layer.VectorRenderType|string|undefined} options.renderMode Render mode for vector layers:
 *  * `'image'`: Vector layers are rendered as images. Great performance, but
 *    point symbols and texts are always rotated with the view and pixels are
 *    scaled during zoom animations.
 *  * `'vector'`: Vector layers are rendered as vectors. Most accurate rendering
 *    even during animations, but slower performance.
 * Default is `vector`.
 * 
 * @param {ol.RenderOrderFunction|null|undefined} options.renderOrder Render order. Function to be used when sorting features before rendering. By
 * default features are drawn in the order that they are created. Use `null` to
 * avoid the sort, but get an undefined draw order.
 * 
 * @param {ol.PluggableMap|undefined} options.map Sets the layer as overlay on a map. The map will not manage this layer in its
 * layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it
 * managed by the map is to use {@link ol.Map#addLayer}.
 * 
 * @param {ol.Extent|undefined} options.extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * 
 * @param {number|undefined} options.minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * 
 * @param {number|undefined} options.maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * 
 * @param {number|undefined} options.opacity Opacity. 0-1. Default is `1`.
 * 
 * @param {number|undefined} options.renderBuffer The buffer around the viewport extent used by the renderer when getting
 * features from the vector source for the rendering or hit-detection.
 * Recommended value: the size of the largest symbol, line width or label.
 * Default is 100 pixels.
 * 
 * @param {ol.source.Vector} options.source Source.
 * 
 * @param {boolean|undefined} options.declutter Declutter images and text. Decluttering is applied to all image and text
 * styles, and the priority is defined by the z-index of the style. Lower
 * z-index means higher priority. Default is `false`.
 * 
 * @param {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined} options.style Layer style. See {@link ol.style} for default style which will be used if
 * this is not defined.
 * 
 * @param {boolean|undefined} options.updateWhileAnimating When set to `true`, feature batches will be recreated during animations.
 * This means that no vectors will be shown clipped, but the setting will have a
 * performance impact for large amounts of vector data. When set to `false`,
 * batches will be recreated when no animation is active.  Default is `false`.
 * 
 * @param {boolean|undefined} options.updateWhileInteracting When set to `true`, feature batches will be recreated during interactions.
 * See also `updateWhileAnimating`. Default is `false`.
 * 
 * @param {boolean|undefined} options.visible Visibility. Default is `true` (visible).
 * 
 * @param {number|undefined} options.zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * 
 */


/**
 * @typedef {{extent: (ol.Extent|undefined),
 *     map: (ol.PluggableMap|undefined),
 *     minResolution: (number|undefined),
 *     maxResolution: (number|undefined),
 *     opacity: (number|undefined),
 *     preload: (number|undefined),
 *     renderBuffer: (number|undefined),
 *     renderMode: (ol.layer.VectorTileRenderType|string|undefined),
 *     renderOrder: (ol.RenderOrderFunction|undefined),
 *     source: (ol.source.VectorTile|undefined),
 *     declutter: (boolean|undefined),
 *     style: (ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined),
 *     updateWhileAnimating: (boolean|undefined),
 *     updateWhileInteracting: (boolean|undefined),
 *     visible: (boolean|undefined),
 *     zIndex: (number|undefined)}}
 */
export let layer_VectorTileOptions;

/**
 * @param {layer_VectorTileOptions} options TODO: repace this
 *
 * @param {number|undefined} options.renderBuffer The buffer around the tile extent used by the renderer when getting features
 * from the vector tile for the rendering or hit-detection.
 * Recommended value: Vector tiles are usually generated with a buffer, so this
 * value should match the largest possible buffer of the used tiles. It should
 * be at least the size of the largest point symbol or line width.
 * Default is 100 pixels.
 * 
 * @param {ol.layer.VectorTileRenderType|string|undefined} options.renderMode Render mode for vector tiles:
 *  * `'image'`: Vector tiles are rendered as images. Great performance, but
 *    point symbols and texts are always rotated with the view and pixels are
 *    scaled during zoom animations.
 *  * `'hybrid'`: Polygon and line elements are rendered as images, so pixels
 *    are scaled during zoom animations. Point symbols and texts are accurately
 *    rendered as vectors and can stay upright on rotated views.
 *  * `'vector'`: Vector tiles are rendered as vectors. Most accurate rendering
 *    even during animations, but slower performance than the other options.
 * 
 * When `declutter` is set to `true`, `'hybrid'` will be used instead of
 * `'image'`. The default is `'hybrid'`.
 * 
 * @param {ol.RenderOrderFunction|undefined} options.renderOrder Render order. Function to be used when sorting features before rendering. By
 * default features are drawn in the order that they are created.
 * 
 * @param {ol.PluggableMap|undefined} options.map Sets the layer as overlay on a map. The map will not manage this layer in its
 * layers collection, and the layer will be rendered on top. This is useful for
 * temporary layers. The standard way to add a layer to a map and have it
 * managed by the map is to use {@link ol.Map#addLayer}.
 * 
 * @param {ol.Extent|undefined} options.extent The bounding extent for layer rendering.  The layer will not be rendered
 * outside of this extent.
 * 
 * @param {number|undefined} options.minResolution The minimum resolution (inclusive) at which this layer will be visible.
 * 
 * @param {number|undefined} options.maxResolution The maximum resolution (exclusive) below which this layer will be visible.
 * 
 * @param {number|undefined} options.opacity Opacity. 0-1. Default is `1`.
 * 
 * @param {number|undefined} options.preload Preload. Load low-resolution tiles up to `preload` levels. By default
 * `preload` is `0`, which means no preloading.
 * 
 * @param {ol.source.VectorTile|undefined} options.source Source.
 * 
 * @param {boolean|undefined} options.declutter Declutter images and text. Decluttering is applied to all image and text
 * styles, and the priority is defined by the z-index of the style. Lower
 * z-index means higher priority. When set to `true`, a `renderMode` of
 * `'image'` will be overridden with `'hybrid'`. Default is `false`.
 * 
 * @param {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction|undefined} options.style Layer style. See {@link ol.style} for default style which will be used if
 * this is not defined.
 * 
 * @param {boolean|undefined} options.updateWhileAnimating When set to `true`, feature batches will be recreated during animations.
 * This means that no vectors will be shown clipped, but the setting will have a
 * performance impact for large amounts of vector data. When set to `false`,
 * batches will be recreated when no animation is active.  Default is `false`.
 * 
 * @param {boolean|undefined} options.updateWhileInteracting When set to `true`, feature batches will be recreated during interactions.
 * See also `updateWhileAnimating`. Default is `false`.
 * 
 * @param {boolean|undefined} options.visible Visibility. Default is `true` (visible).
 * 
 * @param {number|undefined} options.zIndex The z-index for layer rendering.  At rendering time, the layers will be
 * ordered, first by Z-index and then by position. The default Z-index is 0.
 * 
 */


/**
 * @typedef {{context: CanvasRenderingContext2D,
 *     feature: (ol.Feature|ol.render.Feature),
 *     geometry: ol.geom.SimpleGeometry,
 *     pixelRatio: number,
 *     resolution: number,
 *     rotation: number}}
 */
export let render_State;

/**
 * @param {render_State} options TODO: repace this
 *
 * @param {CanvasRenderingContext2D} options.context Canvas context that the layer is being rendered to.
 * 
 * @param {number} options.pixelRatio Pixel ratio used by the layer renderer.
 * 
 * @param {number} options.resolution Resolution that the render batch was created and optimized for. This is
 * not the view's resolution that is being rendered.
 * 
 * @param {number} options.rotation Rotation of the rendered layer in radians.
 * 
 */


/**
 * @typedef {{size: (ol.Size|undefined),
 *     pixelRatio: (number|undefined)}}
 */
export let render_ToContextOptions;

/**
 * @param {render_ToContextOptions} options TODO: repace this
 *
 * @param {ol.Size|undefined} options.size Desired size of the canvas in css pixels. When provided, both canvas and css
 * size will be set according to the `pixelRatio`. If not provided, the current
 * canvas and css sizes will not be altered.
 * 
 * @param {number|undefined} options.pixelRatio Pixel ratio (canvas pixel to css pixel ratio) for the canvas. Default
 * is the detected device pixel ratio.
 * 
 */


/**
 * @typedef {{cacheSize: (number|undefined),
 *     culture: (string|undefined),
 *     hidpi: (boolean|undefined),
 *     key: string,
 *     imagerySet: string,
 *     maxZoom: (number|undefined),
 *     reprojectionErrorThreshold: (number|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     wrapX: (boolean|undefined),
 *     transition: (number|undefined)}}
 */
export let source_BingMapsOptions;

/**
 * @param {source_BingMapsOptions} options TODO: repace this
 *
 * @param {number|undefined} options.cacheSize Cache size. Default is `2048`.
 * 
 * @param {boolean|undefined} options.hidpi If `true` hidpi tiles will be requested. Default is `false`.
 * 
 * @param {string|undefined} options.culture Culture code. Default is `en-us`.
 * 
 * @param {string} options.key Bing Maps API key. Get yours at http://www.bingmapsportal.com/.
 * 
 * @param {string} options.imagerySet Type of imagery.
 * 
 * @param {number|undefined} options.maxZoom Max zoom. Default is what's advertized by the BingMaps service (`21`
 * currently).
 * 
 * @param {number|undefined} options.reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * 
 * @param {ol.TileLoadFunctionType|undefined} options.tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * 
 * @param {boolean|undefined} options.wrapX Whether to wrap the world horizontally. Default is `true`.
 * 
 * @param {number|undefined} options.transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * 
 */


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
export let source_ClusterOptions;

/**
 * @param {source_ClusterOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {number|undefined} options.distance Minimum distance in pixels between clusters. Default is `20`.
 * 
 * @param {ol.Extent|undefined} options.extent Extent.
 * 
 * @param {undefined|function(ol.Feature):ol.geom.Point} options.geometryFunction Function that takes an {@link ol.Feature} as argument and returns an
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
 * 
 * @param {ol.format.Feature|undefined} options.format Format.
 * 
 * @param {string|undefined} options.logo Logo.
 * 
 * @param {ol.ProjectionLike} options.projection Projection.
 * 
 * @param {ol.source.Vector} options.source Source.
 * 
 * @param {boolean|undefined} options.wrapX WrapX. Default is true
 * 
 */


/**
 * @typedef {{preemptive: (boolean|undefined),
 *     jsonp: (boolean|undefined),
 *     tileJSON: (TileJSON|undefined),
 *     url: (string|undefined)}}
 */
export let source_TileUTFGridOptions;

/**
 * @param {source_TileUTFGridOptions} options TODO: repace this
 *
 * @param {boolean|undefined} options.jsonp Use JSONP with callback to load the TileJSON. Useful when the server
 * does not support CORS. Default is `false`.
 * 
 * @param {boolean|undefined} options.preemptive If `true` the TileUTFGrid source loads the tiles based on their "visibility".
 * This improves the speed of response, but increases traffic.
 * Note that if set to `false`, you need to pass `true` as `opt_request`
 * to the `forDataAtCoordinateAndResolution` method otherwise no data
 * will ever be loaded.
 * Default is `true`.
 * 
 * @param {TileJSON|undefined} options.tileJSON TileJSON configuration for this source. If not provided, `url` must be
 * configured.
 * 
 * @param {string|undefined} options.url TileJSON endpoint that provides the configuration for this source. Request
 * will be made through JSONP. If not provided, `tileJSON` must be configured.
 * 
 */


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
export let source_TileImageOptions;

/**
 * @param {source_TileImageOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {number|undefined} options.cacheSize Cache size. Default is `2048`.
 * 
 * @param {null|string|undefined} options.crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * 
 * @param {string|olx.LogoOptions|undefined} options.logo Logo.
 * 
 * @param {boolean|undefined} options.opaque Whether the layer is opaque.
 * 
 * @param {ol.ProjectionLike} options.projection Projection.
 * 
 * @param {number|undefined} options.reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * 
 * @param {ol.source.State|undefined} options.state Source state.
 * 
 * @param {function(new: ol.ImageTile, ol.TileCoord,                ol.TileState, string, ?string,
                ol.TileLoadFunctionType)|undefined}
 options.tileClass Class used to instantiate image tiles. Default is {@link ol.ImageTile}.
 * 
 * @param {ol.tilegrid.TileGrid|undefined} options.tileGrid Tile grid.
 * 
 * @param {ol.TileLoadFunctionType|undefined} options.tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * 
 * @param {number|undefined} options.tilePixelRatio The pixel ratio used by the tile service. For example, if the tile
 * service advertizes 256px by 256px tiles but actually sends 512px
 * by 512px images (for retina/hidpi devices) then `tilePixelRatio`
 * should be set to `2`. Default is `1`.
 * 
 * @param {ol.TileUrlFunctionType|undefined} options.tileUrlFunction Optional function to get tile URL given a tile coordinate and the projection.
 * 
 * @param {string|undefined} options.url URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * 
 * @param {Array.<string>|undefined} options.urls An array of URL templates.
 * 
 * @param {boolean|undefined} options.wrapX Whether to wrap the world horizontally. The default, `undefined`, is to
 * request out-of-bounds tiles from the server. When set to `false`, only one
 * world will be rendered. When set to `true`, tiles will be requested for one
 * world only, but they will be wrapped horizontally to render multiple worlds.
 * 
 * @param {number|undefined} options.transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * 
 */


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *            cacheSize: (number|undefined),
 *            format: (ol.format.Feature|undefined),
 *            logo: (string|olx.LogoOptions|undefined),
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
export let source_VectorTileOptions;

/**
 * @param {source_VectorTileOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {number|undefined} options.cacheSize Cache size. Default is `128`.
 * 
 * @param {ol.format.Feature|undefined} options.format Feature format for tiles. Used and required by the default
 * `tileLoadFunction`.
 * 
 * @param {string|olx.LogoOptions|undefined} options.logo Logo.
 * 
 * @param {boolean|undefined} options.overlaps This source may have overlapping geometries. Default is `true`. Setting this
 * to `false` (e.g. for sources with polygons that represent administrative
 * boundaries or TopoJSON sources) allows the renderer to optimise fill and
 * stroke operations.
 * 
 * @param {ol.ProjectionLike} options.projection Projection.
 * 
 * @param {ol.source.State|undefined} options.state Source state.
 * 
 * @param {function(new: ol.VectorTile, ol.TileCoord,                ol.TileState, string, ol.format.Feature,
                ol.TileLoadFunctionType)|undefined}
 options.tileClass Class used to instantiate vector tiles. Default is {@link ol.VectorTile}.
 * 
 * @param {ol.tilegrid.TileGrid|undefined} options.tileGrid Tile grid.
 * 
 * @param {ol.TileLoadFunctionType|undefined} options.tileLoadFunction Optional function to load a tile given a URL. Could look like this:
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
 * 
 * @param {ol.TileUrlFunctionType|undefined} options.tileUrlFunction Optional function to get tile URL given a tile coordinate and the projection.
 * 
 * @param {string|undefined} options.url URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * 
 * @param {Array.<string>|undefined} options.urls An array of URL templates.
 * 
 * @param {boolean|undefined} options.wrapX Whether to wrap the world horizontally. When set to `false`, only one world
 * will be rendered. When set to `true`, tiles will be wrapped horizontally to
 * render multiple worlds. Default is `true`.
 * 
 * @param {number|undefined} options.transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * 
 */


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
export let source_ImageMapGuideOptions;

/**
 * @param {source_ImageMapGuideOptions} options TODO: repace this
 *
 * @param {string|undefined} options.url The mapagent url.
 * 
 * @param {number|undefined} options.displayDpi The display resolution. Default is `96`.
 * 
 * @param {number|undefined} options.metersPerUnit The meters-per-unit value. Default is `1`.
 * 
 * @param {boolean|undefined} options.hidpi Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * 
 * @param {boolean|undefined} options.useOverlay If `true`, will use `GETDYNAMICMAPOVERLAYIMAGE`.
 * 
 * @param {ol.ProjectionLike} options.projection Projection.
 * 
 * @param {number|undefined} options.ratio Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the width and height of the map viewport, and so on. Must be `1` or
 * higher. Default is `1`.
 * 
 * @param {Array.<number>|undefined} options.resolutions Resolutions. If specified, requests will be made for these resolutions only.
 * 
 * @param {ol.ImageLoadFunctionType|undefined} options.imageLoadFunction Optional function to load an image given a URL.
 * 
 * @param {Object|undefined} options.params Additional parameters.
 * 
 */


/**
 * @typedef {{cacheSize: (number|undefined),
 *     layer: string,
 *     reprojectionErrorThreshold: (number|undefined),
 *     tileLoadFunction: (ol.TileLoadFunctionType|undefined),
 *     url: (string|undefined)}}
 */
export let source_MapQuestOptions;

/**
 * @param {source_MapQuestOptions} options TODO: repace this
 *
 * @param {number|undefined} options.cacheSize Cache size. Default is `2048`.
 * 
 * @param {string} options.layer Layer. Possible values are `osm`, `sat`, and `hyb`.
 * 
 * @param {number|undefined} options.reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * 
 * @param {ol.TileLoadFunctionType|undefined} options.tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * 
 * @param {string|undefined} options.url URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * 
 */


/**
 * @typedef {{projection: ol.ProjectionLike,
 *     tileGrid: (ol.tilegrid.TileGrid|undefined),
 *     wrapX: (boolean|undefined)}}
 */
export let source_TileDebugOptions;

/**
 * @param {source_TileDebugOptions} options TODO: repace this
 *
 * @param {ol.ProjectionLike} options.projection Projection.
 * 
 * @param {ol.tilegrid.TileGrid|undefined} options.tileGrid Tile grid.
 * 
 * @param {boolean|undefined} options.wrapX Whether to wrap the world horizontally. Default is `true`.
 * 
 */


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
export let source_OSMOptions;

/**
 * @param {source_OSMOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {number|undefined} options.cacheSize Cache size. Default is `2048`.
 * 
 * @param {null|string|undefined} options.crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * 
 * Default is `anonymous`.
 * 
 * @param {number|undefined} options.maxZoom Max zoom. Default is `19`.
 * 
 * @param {boolean|undefined} options.opaque Whether the layer is opaque. Default is `true`.
 * 
 * @param {number|undefined} options.reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * 
 * @param {ol.TileLoadFunctionType|undefined} options.tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * 
 * @param {string|undefined} options.url URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * Default is `https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
 * 
 * @param {boolean|undefined} options.wrapX Whether to wrap the world horizontally. Default is `true`.
 * 
 */


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     crossOrigin: (null|string|undefined),
 *     hidpi: (boolean|undefined),
 *     logo: (string|olx.LogoOptions|undefined),
 *     imageLoadFunction: (ol.ImageLoadFunctionType|undefined),
 *     params: Object.<string,*>,
 *     projection: ol.ProjectionLike,
 *     ratio: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     url: (string|undefined)}}
 */
export let source_ImageArcGISRestOptions;

/**
 * @param {source_ImageArcGISRestOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {null|string|undefined} options.crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * 
 * @param {boolean|undefined} options.hidpi Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * 
 * @param {string|olx.LogoOptions|undefined} options.logo Logo.
 * 
 * @param {ol.ImageLoadFunctionType|undefined} options.imageLoadFunction Optional function to load an image given a URL.
 * 
 * @param {Object.<string,*>|undefined} options.params ArcGIS Rest parameters. This field is optional. Service defaults will be
 * used for any fields not specified. `FORMAT` is `PNG32` by default. `F` is `IMAGE` by
 * default. `TRANSPARENT` is `true` by default.  `BBOX, `SIZE`, `BBOXSR`,
 * and `IMAGESR` will be set dynamically. Set `LAYERS` to
 * override the default service layer visibility. See
 * {@link http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Export_Map/02r3000000v7000000/}
 * for further reference.
 * 
 * @param {ol.ProjectionLike} options.projection Projection.
 * 
 * @param {number|undefined} options.ratio Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the size of the map viewport, and so on. Default is `1.5`.
 * 
 * @param {Array.<number>|undefined} options.resolutions Resolutions. If specified, requests will be made for these resolutions only.
 * 
 * @param {string|undefined} options.url ArcGIS Rest service URL for a Map Service or Image Service. The
 * url should include /MapServer or /ImageServer.
 * 
 */


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     canvasFunction: ol.CanvasFunctionType,
 *     logo: (string|olx.LogoOptions|undefined),
 *     projection: ol.ProjectionLike,
 *     ratio: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     state: (ol.source.State|undefined)}}
 */
export let source_ImageCanvasOptions;

/**
 * @param {source_ImageCanvasOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {ol.CanvasFunctionType} options.canvasFunction Canvas function. The function returning the canvas element used by the source
 * as an image. The arguments passed to the function are: `{ol.Extent}` the
 * image extent, `{number}` the image resolution, `{number}` the device pixel
 * ratio, `{ol.Size}` the image size, and `{ol.proj.Projection}` the image
 * projection. The canvas returned by this function is cached by the source. If
 * the value returned by the function is later changed then
 * `dispatchChangeEvent` should be called on the source for the source to
 * invalidate the current cached image.
 * 
 * @param {string|olx.LogoOptions|undefined} options.logo Logo.
 * 
 * @param {ol.ProjectionLike} options.projection Projection.
 * 
 * @param {number|undefined} options.ratio Ratio. 1 means canvases are the size of the map viewport, 2 means twice the
 * width and height of the map viewport, and so on. Must be `1` or higher.
 * Default is `1.5`.
 * 
 * @param {Array.<number>|undefined} options.resolutions Resolutions. If specified, new canvases will be created for these resolutions
 * only.
 * 
 * @param {ol.source.State|undefined} options.state Source state.
 * 
 */


/**
 * @typedef {{sources: Array.<ol.source.Source>,
 *     operation: (ol.RasterOperation|undefined),
 *     lib: (Object|undefined),
 *     threads: (number|undefined),
 *     operationType: (ol.source.RasterOperationType|undefined)}}
 * @api
 */
export let source_RasterOptions;

/**
 * @param {source_RasterOptions} options TODO: repace this
 *
 * @param {Array.<ol.source.Source>} options.sources Input sources.
 * 
 * @param {ol.RasterOperation|undefined} options.operation Raster operation.  The operation will be called with data from input sources
 * and the output will be assigned to the raster source.
 * 
 * @param {Object|undefined} options.lib Functions that will be made available to operations run in a worker.
 * 
 * @param {number|undefined} options.threads By default, operations will be run in a single worker thread.  To avoid using
 * workers altogether, set `threads: 0`.  For pixel operations, operations can
 * be run in multiple worker threads.  Note that there is additional overhead in
 * transferring data to multiple workers, and that depending on the user's
 * system, it may not be possible to parallelize the work.
 * 
 * @param {ol.source.RasterOperationType|undefined} options.operationType Operation type.  Supported values are `'pixel'` and `'image'`.  By default,
 * `'pixel'` operations are assumed, and operations will be called with an
 * array of pixels from input sources.  If set to `'image'`, operations will
 * be called with an array of ImageData objects from input sources.
 * 
 */


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     crossOrigin: (null|string|undefined),
 *     hidpi: (boolean|undefined),
 *     serverType: (ol.source.WMSServerType|string|undefined),
 *     logo: (string|olx.LogoOptions|undefined),
 *     imageLoadFunction: (ol.ImageLoadFunctionType|undefined),
 *     params: Object.<string,*>,
 *     projection: ol.ProjectionLike,
 *     ratio: (number|undefined),
 *     resolutions: (Array.<number>|undefined),
 *     url: (string|undefined)}}
 */
export let source_ImageWMSOptions;

/**
 * @param {source_ImageWMSOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {null|string|undefined} options.crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * 
 * @param {boolean|undefined} options.hidpi Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * 
 * @param {ol.source.WMSServerType|string|undefined} options.serverType The type of the remote WMS server: `mapserver`, `geoserver` or `qgis`. Only
 * needed if `hidpi` is `true`. Default is `undefined`.
 * 
 * @param {ol.ImageLoadFunctionType|undefined} options.imageLoadFunction Optional function to load an image given a URL.
 * 
 * @param {string|olx.LogoOptions|undefined} options.logo Logo.
 * 
 * @param {Object.<string,*>} options.params WMS request parameters. At least a `LAYERS` param is required. `STYLES` is
 * `''` by default. `VERSION` is `1.3.0` by default. `WIDTH`, `HEIGHT`, `BBOX`
 * and `CRS` (`SRS` for WMS version < 1.3.0) will be set dynamically.
 * 
 * @param {ol.ProjectionLike} options.projection Projection.
 * 
 * @param {number|undefined} options.ratio Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the width and height of the map viewport, and so on. Must be `1` or
 * higher. Default is `1.5`.
 * 
 * @param {Array.<number>|undefined} options.resolutions Resolutions. If specified, requests will be made for these resolutions only.
 * 
 * @param {string|undefined} options.url WMS service URL.
 * 
 */


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
export let source_StamenOptions;

/**
 * @param {source_StamenOptions} options TODO: repace this
 *
 * @param {number|undefined} options.cacheSize Cache size. Default is `2048`.
 * 
 * @param {string} options.layer Layer.
 * 
 * @param {number|undefined} options.minZoom Minimum zoom.
 * 
 * @param {number|undefined} options.maxZoom Maximum zoom.
 * 
 * @param {boolean|undefined} options.opaque Whether the layer is opaque.
 * 
 * @param {number|undefined} options.reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * 
 * @param {ol.TileLoadFunctionType|undefined} options.tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * 
 * @param {string|undefined} options.url URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * 
 * @param {boolean|undefined} options.wrapX Whether to wrap the world horizontally. Default is `true`.
 * 
 */


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
export let source_ImageStaticOptions;

/**
 * @param {source_ImageStaticOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {null|string|undefined} options.crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * 
 * @param {ol.Extent} options.imageExtent Extent of the image in map coordinates.  This is the [left, bottom, right,
 * top] map coordinates of your image.
 * 
 * @param {ol.ImageLoadFunctionType|undefined} options.imageLoadFunction Optional function to load an image given a URL.
 * 
 * @param {string|olx.LogoOptions|undefined} options.logo Optional logo.
 * 
 * @param {ol.ProjectionLike} options.projection Projection.
 * 
 * @param {ol.Size|undefined} options.imageSize Size of the image in pixels. Usually the image size is auto-detected, so this
 * only needs to be set if auto-detection fails for some reason.
 * 
 * @param {string} options.url Image URL.
 * 
 */


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
 *     wrapX: (boolean|undefined),
 *     transition: (number|undefined)}}
 */
export let source_TileArcGISRestOptions;

/**
 * @param {source_TileArcGISRestOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {number|undefined} options.cacheSize Cache size. Default is `2048`.
 * 
 * @param {null|string|undefined} options.crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * 
 * @param {Object.<string,*>|undefined} options.params ArcGIS Rest parameters. This field is optional. Service defaults will be
 * used for any fields not specified. `FORMAT` is `PNG32` by default. `F` is `IMAGE` by
 * default. `TRANSPARENT` is `true` by default.  `BBOX, `SIZE`, `BBOXSR`,
 * and `IMAGESR` will be set dynamically. Set `LAYERS` to
 * override the default service layer visibility. See
 * {@link http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Export_Map/02r3000000v7000000/}
 * for further reference.
 * 
 * @param {string|olx.LogoOptions|undefined} options.logo Logo.
 * 
 * @param {ol.tilegrid.TileGrid|undefined} options.tileGrid Tile grid. Base this on the resolutions, tilesize and extent supported by the
 * server.
 * If this is not defined, a default grid will be used: if there is a projection
 * extent, the grid will be based on that; if not, a grid based on a global
 * extent with origin at 0,0 will be used.
 * 
 * @param {ol.ProjectionLike} options.projection Projection.
 * 
 * @param {number|undefined} options.reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * 
 * @param {ol.TileLoadFunctionType|undefined} options.tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * 
 * @param {string|undefined} options.url ArcGIS Rest service URL for a Map Service or Image Service. The
 * url should include /MapServer or /ImageServer.
 * 
 * @param {boolean|undefined} options.wrapX Whether to wrap the world horizontally. Default is `true`.
 * 
 * @param {number|undefined} options.transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * 
 * @param {Array.<string>|undefined} options.urls ArcGIS Rest service urls. Use this instead of `url` when the ArcGIS Service supports multiple
 * urls for export requests.
 * 
 */


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
export let source_TileJSONOptions;

/**
 * @param {source_TileJSONOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Optional attributions for the source.  If provided, these will be used
 * instead of any attribution data advertised by the server.  If not provided,
 * any attributions advertised by the server will be used.
 * 
 * @param {number|undefined} options.cacheSize Cache size. Default is `2048`.
 * 
 * @param {null|string|undefined} options.crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * 
 * @param {boolean|undefined} options.jsonp Use JSONP with callback to load the TileJSON. Useful when the server
 * does not support CORS. Default is `false`.
 * 
 * @param {number|undefined} options.reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * 
 * @param {TileJSON|undefined} options.tileJSON TileJSON configuration for this source. If not provided, `url` must be
 * configured.
 * 
 * @param {ol.TileLoadFunctionType|undefined} options.tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * 
 * @param {string|undefined} options.url URL to the TileJSON file. If not provided, `tileJSON` must be configured.
 * 
 * @param {boolean|undefined} options.wrapX Whether to wrap the world horizontally. Default is `true`.
 * 
 * @param {number|undefined} options.transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * 
 */


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     params: Object.<string,*>,
 *     crossOrigin: (null|string|undefined),
 *     gutter: (number|undefined),
 *     hidpi: (boolean|undefined),
 *     logo: (string|olx.LogoOptions|undefined),
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
export let source_TileWMSOptions;

/**
 * @param {source_TileWMSOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {number|undefined} options.cacheSize Cache size. Default is `2048`.
 * 
 * @param {Object.<string,*>} options.params WMS request parameters. At least a `LAYERS` param is required. `STYLES` is
 * `''` by default. `VERSION` is `1.3.0` by default. `WIDTH`, `HEIGHT`, `BBOX`
 * and `CRS` (`SRS` for WMS version < 1.3.0) will be set dynamically.
 * 
 * @param {null|string|undefined} options.crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * 
 * @param {number|undefined} options.gutter The size in pixels of the gutter around image tiles to ignore. By setting
 * this property to a non-zero value, images will be requested that are wider
 * and taller than the tile size by a value of `2 x gutter`. Defaults to zero.
 * Using a non-zero value allows artifacts of rendering at tile edges to be
 * ignored. If you control the WMS service it is recommended to address
 * "artifacts at tile edges" issues by properly configuring the WMS service. For
 * example, MapServer has a `tile_map_edge_buffer` configuration parameter for
 * this. See http://mapserver.org/output/tile_mode.html.
 * 
 * @param {boolean|undefined} options.hidpi Use the `ol.Map#pixelRatio` value when requesting the image from the remote
 * server. Default is `true`.
 * 
 * @param {string|olx.LogoOptions|undefined} options.logo Logo.
 * 
 * @param {function(new: ol.ImageTile, ol.TileCoord,                ol.TileState, string, ?string,
                ol.TileLoadFunctionType)|undefined}
 options.tileClass Class used to instantiate image tiles. Default is {@link ol.ImageTile}.
 * 
 * @param {ol.tilegrid.TileGrid|undefined} options.tileGrid Tile grid. Base this on the resolutions, tilesize and extent supported by the
 * server.
 * If this is not defined, a default grid will be used: if there is a projection
 * extent, the grid will be based on that; if not, a grid based on a global
 * extent with origin at 0,0 will be used.
 * 
 * @param {ol.ProjectionLike} options.projection Projection.
 * 
 * @param {number|undefined} options.reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * 
 * @param {ol.source.WMSServerType|string|undefined} options.serverType The type of the remote WMS server. Currently only used when `hidpi` is
 * `true`. Default is `undefined`.
 * 
 * @param {ol.TileLoadFunctionType|undefined} options.tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * 
 * @param {string|undefined} options.url WMS service URL.
 * 
 * @param {Array.<string>|undefined} options.urls WMS service urls. Use this instead of `url` when the WMS supports multiple
 * urls for GetMap requests.
 * 
 * @param {boolean|undefined} options.wrapX Whether to wrap the world horizontally. When set to `false`, only one world
 * will be rendered. When `true`, tiles will be requested for one world only,
 * but they will be wrapped horizontally to render multiple worlds. The default
 * is `true`.
 * 
 * @param {number|undefined} options.transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * 
 */


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
export let source_VectorOptions;

/**
 * @param {source_VectorOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {Array.<ol.Feature>|ol.Collection.<ol.Feature>|undefined} options.features Features. If provided as {@link ol.Collection}, the features in the source
 * and the collection will stay in sync.
 * 
 * @param {ol.format.Feature|undefined} options.format The feature format used by the XHR feature loader when `url` is set.
 * Required if `url` is set, otherwise ignored. Default is `undefined`.
 * 
 * @param {ol.FeatureLoader|undefined} options.loader The loader function used to load features, from a remote source for example.
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
 * 
 * @param {string|olx.LogoOptions|undefined} options.logo Logo.
 * 
 * @param {boolean|undefined} options.overlaps This source may have overlapping geometries. Default is `true`. Setting this
 * to `false` (e.g. for sources with polygons that represent administrative
 * boundaries or TopoJSON sources) allows the renderer to optimise fill and
 * stroke operations.
 * 
 * @param {ol.LoadingStrategy|undefined} options.strategy The loading strategy to use. By default an {@link ol.loadingstrategy.all}
 * strategy is used, a one-off strategy which loads all features at once.
 * 
 * @param {string|ol.FeatureUrlFunction|undefined} options.url Setting this option instructs the source to load features using an XHR loader
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
 * 
 * @param {boolean|undefined} options.useSpatialIndex By default, an RTree is used as spatial index. When features are removed and
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
 * 
 * @param {boolean|undefined} options.wrapX Wrap the world horizontally. Default is `true`. For vector editing across the
 * -180° and 180° meridians to work properly, this should be set to `false`. The
 * resulting geometry coordinates will then exceed the world bounds.
 * 
 */


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
 *                          ol.TileState, string, ?string,
 *                          ol.TileLoadFunctionType)|undefined),
 *     wrapX: (boolean|undefined),
 *     transition: (number|undefined)}}
 */
export let source_WMTSOptions;

/**
 * @param {source_WMTSOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {number|undefined} options.cacheSize Cache size. Default is `2048`.
 * 
 * @param {string|null|undefined} options.crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * 
 * @param {string|olx.LogoOptions|undefined} options.logo Logo.
 * 
 * @param {ol.tilegrid.WMTS} options.tileGrid Tile grid.
 * 
 * @param {ol.ProjectionLike} options.projection Projection.
 * 
 * @param {number|undefined} options.reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * 
 * @param {ol.source.WMTSRequestEncoding|string|undefined} options.requestEncoding Request encoding. Default is `KVP`.
 * 
 * @param {string} options.layer Layer name as advertised in the WMTS capabilities.
 * 
 * @param {string} options.style Style name as advertised in the WMTS capabilities.
 * 
 * @param {function(new: ol.ImageTile, ol.TileCoord,                ol.TileState, string, ?string,
                ol.TileLoadFunctionType)|undefined}
 options.tileClass Class used to instantiate image tiles. Default is {@link ol.ImageTile}.
 * 
 * @param {number|undefined} options.tilePixelRatio The pixel ratio used by the tile service. For example, if the tile
 * service advertizes 256px by 256px tiles but actually sends 512px
 * by 512px images (for retina/hidpi devices) then `tilePixelRatio`
 * should be set to `2`. Default is `1`.
 * 
 * @param {string|undefined} options.version WMTS version. Default is `1.0.0`.
 * 
 * @param {string|undefined} options.format Image format. Default is `image/jpeg`.
 * 
 * @param {string} options.matrixSet Matrix set.
 * 
 * @param {!Object|undefined} options.dimensions Additional "dimensions" for tile requests.  This is an object with properties
 * named like the advertised WMTS dimensions.
 * 
 * @param {string|undefined} options.url A URL for the service.  For the RESTful request encoding, this is a URL
 * template.  For KVP encoding, it is normal URL. A `{?-?}` template pattern,
 * for example `subdomain{a-f}.domain.com`, may be used instead of defining
 * each one separately in the `urls` option.
 * 
 * @param {ol.TileLoadFunctionType|undefined} options.tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * 
 * @param {Array.<string>|undefined} options.urls An array of URLs.  Requests will be distributed among the URLs in this array.
 * 
 * @param {boolean|undefined} options.wrapX Whether to wrap the world horizontally. Default is `false`.
 * 
 * @param {number|undefined} options.transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * 
 */


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
 *     wrapX: (boolean|undefined),
 *     transition: (number|undefined)}}
 */
export let source_XYZOptions;

/**
 * @param {source_XYZOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {number|undefined} options.cacheSize Cache size. Default is `2048`.
 * 
 * @param {null|string|undefined} options.crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * 
 * @param {string|olx.LogoOptions|undefined} options.logo Logo.
 * 
 * @param {boolean|undefined} options.opaque Whether the layer is opaque.
 * 
 * @param {ol.ProjectionLike} options.projection Projection. Default is `EPSG:3857`.
 * 
 * @param {number|undefined} options.reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * 
 * @param {number|undefined} options.maxZoom Optional max zoom level. Default is `18`.
 * 
 * @param {number|undefined} options.minZoom Optional min zoom level. Default is `0`.
 * 
 * @param {ol.tilegrid.TileGrid|undefined} options.tileGrid Tile grid.
 * 
 * @param {ol.TileLoadFunctionType|undefined} options.tileLoadFunction Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * 
 * @param {number|undefined} options.tilePixelRatio The pixel ratio used by the tile service. For example, if the tile
 * service advertizes 256px by 256px tiles but actually sends 512px
 * by 512px images (for retina/hidpi devices) then `tilePixelRatio`
 * should be set to `2`. Default is `1`.
 * 
 * @param {number|ol.Size|undefined} options.tileSize The tile size used by the tile service. Default is `[256, 256]` pixels.
 * 
 * @param {ol.TileUrlFunctionType|undefined} options.tileUrlFunction Optional function to get tile URL given a tile coordinate and the projection.
 * Required if url or urls are not provided.
 * 
 * @param {string|undefined} options.url URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * 
 * @param {Array.<string>|undefined} options.urls An array of URL templates.
 * 
 * @param {boolean|undefined} options.wrapX Whether to wrap the world horizontally. Default is `true`.
 * 
 * @param {number|undefined} options.transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * 
 */


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
export let source_CartoDBOptions;

/**
 * @param {source_CartoDBOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {number|undefined} options.cacheSize Cache size. Default is `2048`.
 * 
 * @param {null|string|undefined} options.crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * 
 * @param {string|olx.LogoOptions|undefined} options.logo Logo.
 * 
 * @param {ol.ProjectionLike} options.projection Projection. Default is `EPSG:3857`.
 * 
 * @param {number|undefined} options.maxZoom Optional max zoom level. Default is `18`.
 * 
 * @param {number|undefined} options.minZoom Minimum zoom.
 * 
 * @param {boolean|undefined} options.wrapX Whether to wrap the world horizontally. Default is `true`.
 * 
 * @param {Object|undefined} options.config If using anonymous maps, the CartoDB config to use. See
 * {@link http://docs.cartodb.com/cartodb-platform/maps-api/anonymous-maps/}
 * for more detail.
 * If using named maps, a key-value lookup with the template parameters.
 * See {@link http://docs.cartodb.com/cartodb-platform/maps-api/named-maps/}
 * for more detail.
 * 
 * @param {string|undefined} options.map If using named maps, this will be the name of the template to load.
 * See {@link http://docs.cartodb.com/cartodb-platform/maps-api/named-maps/}
 * for more detail.
 * 
 * @param {string} options.account CartoDB account name
 * 
 */


/**
 * @typedef {{attributions: (ol.AttributionLike|undefined),
 *     cacheSize: (number|undefined),
 *     crossOrigin: (null|string|undefined),
 *     logo: (string|olx.LogoOptions|undefined),
 *     projection: (ol.ProjectionLike|undefined),
 *     reprojectionErrorThreshold: (number|undefined),
 *     url: !string,
 *     tierSizeCalculation: (string|undefined),
 *     size: ol.Size,
 *     extent: (ol.Extent|undefined),
 *     transition: (number|undefined),
 *     tileSize: (number|undefined)}}
 */
export let source_ZoomifyOptions;

/**
 * @param {source_ZoomifyOptions} options TODO: repace this
 *
 * @param {ol.AttributionLike|undefined} options.attributions Attributions.
 * 
 * @param {number|undefined} options.cacheSize Cache size. Default is `2048`.
 * 
 * @param {null|string|undefined} options.crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * 
 * @param {string|olx.LogoOptions|undefined} options.logo Logo.
 * 
 * @param {ol.ProjectionLike|undefined} options.projection Projection.
 * 
 * @param {number|undefined} options.reprojectionErrorThreshold Maximum allowed reprojection error (in pixels). Default is `0.5`.
 * Higher values can increase reprojection performance, but decrease precision.
 * 
 * @param {!string} options.url URL template or base URL of the Zoomify service. A base URL is the fixed part
 * of the URL, excluding the tile group, z, x, and y folder structure, e.g.
 * `http://my.zoomify.info/IMAGE.TIF/`. A URL template must include
 * `{TileGroup}`, `{x}`, `{y}`, and `{z}` placeholders, e.g.
 * `http://my.zoomify.info/IMAGE.TIF/{TileGroup}/{z}-{x}-{y}.jpg`.
 * Internet Imaging Protocol (IIP) with JTL extension can be also used with
 * `{tileIndex}` and `{z}` placeholders, e.g.
 * `http://my.zoomify.info?FIF=IMAGE.TIF&JTL={z},{tileIndex}`.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * 
 * @param {string|undefined} options.tierSizeCalculation Tier size calculation method: `default` or `truncated`.
 * 
 * @param {ol.Size} options.size Size of the image.
 * 
 * @param {ol.Extent|undefined} options.extent Extent for the TileGrid that is created. Default sets the TileGrid in the
 * fourth quadrant, meaning extent is `[0, -height, width, 0]`. To change the
 * extent to the first quadrant (the default for OpenLayers 2) set the extent
 * as `[0, 0, width, height]`.
 * 
 * @param {number|undefined} options.transition Duration of the opacity transition for rendering.  To disable the opacity
 * transition, pass `transition: 0`.
 * 
 * @param {number|undefined} options.tileSize Tile size. Same tile size is used for all zoom levels. Default value is
 * `256`.
 * 
 */


/**
 * @typedef {{fill: (ol.style.Fill|undefined),
 *     radius: number,
 *     snapToPixel: (boolean|undefined),
 *     stroke: (ol.style.Stroke|undefined),
 *     atlasManager: (ol.style.AtlasManager|undefined)}}
 */
export let style_CircleOptions;

/**
 * @param {style_CircleOptions} options TODO: repace this
 *
 * @param {ol.style.Fill|undefined} options.fill Fill style.
 * 
 * @param {number} options.radius Circle radius.
 * 
 * @param {boolean|undefined} options.snapToPixel If `true` integral numbers of pixels are used as the X and Y pixel
 * coordinate when drawing the circle in the output canvas. If `false`
 * fractional numbers may be used. Using `true` allows for "sharp"
 * rendering (no blur), while using `false` allows for "accurate"
 * rendering. Note that accuracy is important if the circle's
 * position is animated. Without it, the circle may jitter noticeably.
 * Default value is `true`.
 * 
 * @param {ol.style.Stroke|undefined} options.stroke Stroke style.
 * 
 * @param {ol.style.AtlasManager|undefined} options.atlasManager The atlas manager to use for this circle. When using WebGL it is
 * recommended to use an atlas manager to avoid texture switching.
 * If an atlas manager is given, the circle is added to an atlas.
 * By default no atlas manager is used.
 * 
 */


/**
 * @typedef {{color: (ol.Color|ol.ColorLike|undefined)}}
 */
export let style_FillOptions;

/**
 * @param {style_FillOptions} options TODO: repace this
 *
 * @param {ol.Color|ol.ColorLike|undefined} options.color A color, gradient or pattern. See {@link ol.color}
 * and {@link ol.colorlike} for possible formats. Default null;
 * if null, the Canvas/renderer default black will be used.
 * 
 */


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
export let style_IconOptions;

/**
 * @param {style_IconOptions} options TODO: repace this
 *
 * @param {Array.<number>|undefined} options.anchor Anchor. Default value is `[0.5, 0.5]` (icon center).
 * 
 * @param {ol.style.IconOrigin|undefined} options.anchorOrigin Origin of the anchor: `bottom-left`, `bottom-right`, `top-left` or
 * `top-right`. Default is `top-left`.
 * 
 * @param {ol.style.IconAnchorUnits|undefined} options.anchorXUnits Units in which the anchor x value is specified. A value of `'fraction'`
 * indicates the x value is a fraction of the icon. A value of `'pixels'`
 * indicates the x value in pixels. Default is `'fraction'`.
 * 
 * @param {ol.style.IconAnchorUnits|undefined} options.anchorYUnits Units in which the anchor y value is specified. A value of `'fraction'`
 * indicates the y value is a fraction of the icon. A value of `'pixels'`
 * indicates the y value in pixels. Default is `'fraction'`.
 * 
 * @param {ol.Color|string|undefined} options.color Color to tint the icon. If not specified, the icon will be left as is.
 * 
 * @param {null|string|undefined} options.crossOrigin The `crossOrigin` attribute for loaded images.  Note that you must provide a
 * `crossOrigin` value if you are using the WebGL renderer or if you want to
 * access pixel data with the Canvas renderer.  See
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image}
 * for more detail.
 * 
 * @param {Image|HTMLCanvasElement|undefined} options.img Image object for the icon. If the `src` option is not provided then the
 * provided image must already be loaded. And in that case, it is required
 * to provide the size of the image, with the `imgSize` option.
 * 
 * @param {Array.<number>|undefined} options.offset Offset, which, together with the size and the offset origin,
 * define the sub-rectangle to use from the original icon image. Default value
 * is `[0, 0]`.
 * 
 * @param {ol.style.IconOrigin|undefined} options.offsetOrigin Origin of the offset: `bottom-left`, `bottom-right`, `top-left` or
 * `top-right`. Default is `top-left`.
 * 
 * @param {number|undefined} options.opacity Opacity of the icon. Default is `1`.
 * 
 * @param {number|undefined} options.scale Scale. Default is `1`.
 * 
 * @param {boolean|undefined} options.snapToPixel If `true` integral numbers of pixels are used as the X and Y pixel
 * coordinate when drawing the icon in the output canvas. If `false`
 * fractional numbers may be used. Using `true` allows for "sharp"
 * rendering (no blur), while using `false` allows for "accurate"
 * rendering. Note that accuracy is important if the icon's position
 * is animated. Without it, the icon may jitter noticeably. Default
 * value is `true`.
 * 
 * @param {boolean|undefined} options.rotateWithView Whether to rotate the icon with the view. Default is `false`.
 * 
 * @param {number|undefined} options.rotation Rotation in radians (positive rotation clockwise). Default is `0`.
 * 
 * @param {ol.Size|undefined} options.size Icon size in pixel. Can be used together with `offset` to define the
 * sub-rectangle to use from the origin (sprite) icon image.
 * 
 * @param {ol.Size|undefined} options.imgSize Image size in pixels. Only required if `img` is set and `src` is not, and for
 * SVG images in Internet Explorer 11. The provided `imgSize` needs to match
 * the actual size of the image.
 * 
 * @param {string|undefined} options.src Image source URI.
 * 
 */


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
export let style_RegularShapeOptions;

/**
 * @param {style_RegularShapeOptions} options TODO: repace this
 *
 * @param {ol.style.Fill|undefined} options.fill Fill style.
 * 
 * @param {number} options.points Number of points for stars and regular polygons. In case of a polygon, the
 * number of points is the number of sides.
 * 
 * @param {number|undefined} options.radius Radius of a regular polygon.
 * 
 * @param {number|undefined} options.radius1 Outer radius of a star.
 * 
 * @param {number|undefined} options.radius2 Inner radius of a star.
 * 
 * @param {number|undefined} options.angle Shape's angle in radians. A value of 0 will have one of the shape's point
 * facing up.
 * Default value is 0.
 * 
 * @param {boolean|undefined} options.snapToPixel If `true` integral numbers of pixels are used as the X and Y pixel
 * coordinate when drawing the shape in the output canvas. If `false`
 * fractional numbers may be used. Using `true` allows for "sharp"
 * rendering (no blur), while using `false` allows for "accurate"
 * rendering. Note that accuracy is important if the shape's
 * position is animated. Without it, the shape may jitter noticeably.
 * Default value is `true`.
 * 
 * @param {ol.style.Stroke|undefined} options.stroke Stroke style.
 * 
 * @param {number|undefined} options.rotation Rotation in radians (positive rotation clockwise). Default is `0`.
 * 
 * @param {boolean|undefined} options.rotateWithView Whether to rotate the shape with the view. Default is `false`.
 * 
 * @param {ol.style.AtlasManager|undefined} options.atlasManager The atlas manager to use for this symbol. When using WebGL it is
 * recommended to use an atlas manager to avoid texture switching.
 * If an atlas manager is given, the symbol is added to an atlas.
 * By default no atlas manager is used.
 * 
 */


/**
 * @typedef {{color: (ol.Color|ol.ColorLike|undefined),
 *     lineCap: (string|undefined),
 *     lineJoin: (string|undefined),
 *     lineDash: (Array.<number>|undefined),
 *     lineDashOffset: (number|undefined),
 *     miterLimit: (number|undefined),
 *     width: (number|undefined)}}
 */
export let style_StrokeOptions;

/**
 * @param {style_StrokeOptions} options TODO: repace this
 *
 * @param {ol.Color|ol.ColorLike|undefined} options.color A color, gradient or pattern. See {@link ol.color}
 * and {@link ol.colorlike} for possible formats. Default null;
 * if null, the Canvas/renderer default black will be used.
 * 
 * @param {string|undefined} options.lineCap Line cap style: `butt`, `round`, or `square`. Default is `round`.
 * 
 * @param {string|undefined} options.lineJoin Line join style: `bevel`, `round`, or `miter`. Default is `round`.
 * 
 * @param {Array.<number>|undefined} options.lineDash Line dash pattern. Default is `undefined` (no dash). Please note that
 * Internet Explorer 10 and lower [do not support][mdn] the `setLineDash`
 * method on the `CanvasRenderingContext2D` and therefore this option will
 * have no visual effect in these browsers.
 * 
 * [mdn]: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility
 * 
 * 
 * @param {number|undefined} options.lineDashOffset Line dash offset. Default is '0'.
 * 
 * @param {number|undefined} options.miterLimit Miter limit. Default is `10`.
 * 
 * @param {number|undefined} options.width Width.
 * 
 */


/**
 * @typedef {{font: (string|undefined),
 *     maxAngle: (number|undefined),
 *     offsetX: (number|undefined),
 *     offsetY: (number|undefined),
 *     overflow: (boolean|undefined),
 *     placement: (ol.style.TextPlacement|string|undefined),
 *     scale: (number|undefined),
 *     rotateWithView: (boolean|undefined),
 *     rotation: (number|undefined),
 *     text: (string|undefined),
 *     textAlign: (string|undefined),
 *     textBaseline: (string|undefined),
 *     fill: (ol.style.Fill|undefined),
 *     stroke: (ol.style.Stroke|undefined),
 *     backgroundFill: (ol.style.Fill|undefined),
 *     backgroundStroke: (ol.style.Stroke|undefined),
 *     padding: (Array.<number>|undefined)}}
 */
export let style_TextOptions;

/**
 * @param {style_TextOptions} options TODO: repace this
 *
 * @param {string|undefined} options.font Font style as CSS 'font' value, see:
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font}.
 * Default is '10px sans-serif'
 * 
 * @param {number|undefined} options.maxAngle When `placement` is set to `'line'`, allow a maximum angle between adjacent
 * characters. The expected value is in radians, and the default is 45°
 * (`Math.PI / 4`).
 * 
 * @param {number|undefined} options.offsetX Horizontal text offset in pixels. A positive will shift the text right.
 * Default is `0`.
 * 
 * @param {number|undefined} options.offsetY Vertical text offset in pixels. A positive will shift the text down. Default
 * is `0`.
 * 
 * @param {boolean|undefined} options.overflow For polygon labels or when `placement` is set to `'line'`, allow text to
 * exceed the width of the polygon at the label position or the length of
 * the path that it follows. Default is `false`.
 * 
 * @param {ol.style.TextPlacement|undefined} options.placement Text placement.
 * 
 * @param {number|undefined} options.scale Scale.
 * 
 * @param {boolean|undefined} options.rotateWithView Whether to rotate the text with the view. Default is `false`.
 * 
 * @param {number|undefined} options.rotation Rotation in radians (positive rotation clockwise). Default is `0`.
 * 
 * @param {string|undefined} options.text Text content.
 * 
 * @param {string|undefined} options.textAlign Text alignment. Possible values: 'left', 'right', 'center', 'end' or 'start'.
 * Default is 'center' for `placement: 'point'`. For `placement: 'line'`, the
 * default is to let the renderer choose a placement where `maxAngle` is not
 * exceeded.
 * 
 * @param {string|undefined} options.textBaseline Text base line. Possible values: 'bottom', 'top', 'middle', 'alphabetic',
 * 'hanging', 'ideographic'. Default is 'middle'.
 * 
 * @param {ol.style.Fill|undefined} options.fill Fill style. If none is provided, we'll use a dark fill-style (#333).
 * 
 * @param {ol.style.Stroke|undefined} options.stroke Stroke style.
 * 
 * @param {ol.style.Fill|undefined} options.backgroundFill Fill style for the text background when `placement` is `'point'`. Default is
 * no fill.
 * 
 * @param {ol.style.Stroke|undefined} options.backgroundStroke Stroke style for the text background  when `placement` is `'point'`. Default
 * is no stroke.
 * 
 * @param {Array.<number>|undefined} options.padding Padding in pixels around the text for decluttering and background. The order
 * of values in the array is `[top, right, bottom, left]`. Default is
 * `[0, 0, 0, 0]`.
 * 
 */


/**
 * @typedef {{geometry: (undefined|string|ol.geom.Geometry|ol.StyleGeometryFunction),
 *     fill: (ol.style.Fill|undefined),
 *     image: (ol.style.Image|undefined),
 *     renderer: (ol.StyleRenderFunction|undefined),
 *     stroke: (ol.style.Stroke|undefined),
 *     text: (ol.style.Text|undefined),
 *     zIndex: (number|undefined)}}
 */
export let style_StyleOptions;

/**
 * @param {style_StyleOptions} options TODO: repace this
 *
 * @param {undefined|string|ol.geom.Geometry|ol.StyleGeometryFunction} options.geometry Feature property or geometry or function returning a geometry to render for
 * this style.
 * 
 * @param {ol.style.Fill|undefined} options.fill Fill style.
 * 
 * @param {ol.style.Image|undefined} options.image Image style.
 * 
 * @param {ol.StyleRenderFunction|undefined} options.renderer Custom renderer. When configured, `fill`, `stroke` and `image` will be
 * ignored, and the provided function will be called with each render frame for
 * each geometry.
 * 
 * 
 * @param {ol.style.Stroke|undefined} options.stroke Stroke style.
 * 
 * @param {ol.style.Text|undefined} options.text Text style.
 * 
 * @param {number|undefined} options.zIndex Z index.
 * 
 */


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
export let tilegrid_TileGridOptions;

/**
 * @param {tilegrid_TileGridOptions} options TODO: repace this
 *
 * @param {ol.Extent|undefined} options.extent Extent for the tile grid. No tiles outside this extent will be requested by
 * {@link ol.source.Tile} sources. When no `origin` or `origins` are
 * configured, the `origin` will be set to the top-left corner of the extent.
 * 
 * @param {number|undefined} options.minZoom Minimum zoom. Default is 0.
 * 
 * @param {ol.Coordinate|undefined} options.origin The tile grid origin, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`).
 * Tile coordinates increase left to right and upwards. If not specified,
 * `extent` or `origins` must be provided.
 * 
 * @param {Array.<ol.Coordinate>|undefined} options.origins Tile grid origins, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`), for
 * each zoom level. If given, the array length should match the length of the
 * `resolutions` array, i.e. each resolution can have a different origin. Tile
 * coordinates increase left to right and upwards. If not specified, `extent`
 * or `origin` must be provided.
 * 
 * @param {!Array.<number>} options.resolutions Resolutions. The array index of each resolution needs to match the zoom
 * level. This means that even if a `minZoom` is configured, the resolutions
 * array will have a length of `maxZoom + 1`.
 * 
 * @param {number|ol.Size|undefined} options.tileSize Tile size. Default is `[256, 256]`.
 * 
 * @param {Array.<number|ol.Size>|undefined} options.tileSizes Tile sizes. If given, the array length should match the length of the
 * `resolutions` array, i.e. each resolution can have a different tile size.
 * 
 */


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
export let tilegrid_WMTSOptions;

/**
 * @param {tilegrid_WMTSOptions} options TODO: repace this
 *
 * @param {ol.Extent|undefined} options.extent Extent for the tile grid. No tiles outside this extent will be requested by
 * {@link ol.source.Tile} sources. When no `origin` or `origins` are
 * configured, the `origin` will be set to the top-left corner of the extent.
 * 
 * @param {ol.Coordinate|undefined} options.origin The tile grid origin, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`).
 * Tile coordinates increase left to right and upwards. If not specified,
 * `extent` or `origins` must be provided.
 * 
 * @param {Array.<ol.Coordinate>|undefined} options.origins Tile grid origins, i.e. where the `x` and `y` axes meet (`[z, 0, 0]`), for
 * each zoom level. If given, the array length should match the length of the
 * `resolutions` array, i.e. each resolution can have a different origin. Tile
 * coordinates increase left to right and upwards. If not specified, `extent` or
 * `origin` must be provided.
 * 
 * @param {!Array.<number>} options.resolutions Resolutions. The array index of each resolution needs to match the zoom
 * level. This means that even if a `minZoom` is configured, the resolutions
 * array will have a length of `maxZoom + 1`
 * 
 * @param {!Array.<string>} options.matrixIds matrix IDs. The length of this array needs to match the length of the
 * `resolutions` array.
 * 
 * @param {Array.<ol.Size>|undefined} options.sizes Number of tile rows and columns of the grid for each zoom level. The values
 * here are the `TileMatrixWidth` and `TileMatrixHeight` advertised in the
 * GetCapabilities response of the WMTS, and define the grid's extent together
 * with the `origin`. An `extent` can be configured in addition, and will
 * further limit the extent for which tile requests are made by sources. Note
 * that when the top-left corner of the `extent` is used as `origin` or
 * `origins`, then the `y` value must be negative because OpenLayers tile
 * coordinates increase upwards.
 * 
 * @param {number|ol.Size|undefined} options.tileSize Tile size.
 * 
 * @param {Array.<number|ol.Size>|undefined} options.tileSizes Tile sizes. The length of this array needs to match the length of the
 * `resolutions` array.
 * 
 * @param {Array.<number>|undefined} options.widths Number of tile columns that cover the grid's extent for each zoom level. Only
 * required when used with a source that has `wrapX` set to `true`, and only
 * when the grid's origin differs from the one of the projection's extent. The
 * array length has to match the length of the `resolutions` array, i.e. each
 * resolution will have a matching entry here.
 * 
 */


/**
 * @typedef {{extent: (ol.Extent|undefined),
 *     maxZoom: (number|undefined),
 *     minZoom: (number|undefined),
 *     tileSize: (number|ol.Size|undefined)}}
 */
export let tilegrid_XYZOptions;

/**
 * @param {tilegrid_XYZOptions} options TODO: repace this
 *
 * @param {ol.Extent|undefined} options.extent Extent for the tile grid.  The origin for an XYZ tile grid is the top-left
 * corner of the extent.  The zero level of the grid is defined by the
 * resolution at which one tile fits in the provided extent.  If not provided,
 * the extent of the EPSG:3857 projection is used.
 * 
 * @param {number|undefined} options.maxZoom Maximum zoom.  The default is `ol.DEFAULT_MAX_ZOOM`.  This determines the
 * number of levels in the grid set.  For example, a `maxZoom` of 21 means there
 * are 22 levels in the grid set.
 * 
 * @param {number|undefined} options.minZoom Minimum zoom. Default is 0.
 * 
 * @param {number|ol.Size|undefined} options.tileSize Tile size in pixels. Default is `[256, 256]`.
 * 
 */


/**
 * @typedef {{
 *     size: (ol.Size|undefined),
 *     padding: (!Array.<number>|undefined),
 *     constrainResolution: (boolean|undefined),
 *     nearest: (boolean|undefined),
 *     maxZoom: (number|undefined),
 *     minResolution: (number|undefined),
 *     duration: (number|undefined),
 *     easing: (undefined|function(number):number),
 *     callback: (undefined|function(boolean))
 * }}
 */
export let view_FitOptions;

/**
 * @param {view_FitOptions} options TODO: repace this
 *
 * @param {ol.Size|undefined} options.size The size in pixels of the box to fit the extent into. Default is
 * the current size of the first map in the DOM that uses this view, or
 * `[100, 100]` if no such map is found.
 * 
 * @param {!Array.<number>|undefined} options.padding Padding (in pixels) to be cleared inside the view. Values in the array are
 * top, right, bottom and left padding. Default is `[0, 0, 0, 0]`.
 * 
 * @param {boolean|undefined} options.constrainResolution Constrain the resolution. Default is `true`.
 * 
 * @param {boolean|undefined} options.nearest Get the nearest extent. Default is `false`.
 * 
 * @param {number|undefined} options.minResolution Minimum resolution that we zoom to. Default is `0`.
 * 
 * @param {number|undefined} options.maxZoom Maximum zoom level that we zoom to. If `minResolution` is given,
 * this property is ignored.
 * 
 * @param {number|undefined} options.duration The duration of the animation in milliseconds. By default, there is no
 * animations.
 * 
 * @param {undefined|function(number):number} options.easing The easing function used during the animation (defaults to {@link ol.easing.inAndOut}).
 * The function will be called for each frame with a number representing a
 * fraction of the animation's duration.  The function should return a number
 * between 0 and 1 representing the progress toward the destination state.
 * 
 * @param {undefined|function(boolean)} options.callback Optional function called when the view is in it's final position. The callback will be
 * called with `true` if the animation series completed on its own or `false`
 * if it was cancelled.
 * 
 */


/**
 * @typedef {{animate: boolean,
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
 *     skippedFeatureUids: !Object.<string, boolean>,
 *     tileQueue: ol.TileQueue,
 *     time: number,
 *     usedTiles: Object.<string, Object.<string, ol.TileRange>>,
 *     viewState: olx.ViewState,
 *     viewHints: Array.<number>,
 *     wantedTiles: !Object.<string, Object.<string, boolean>>}}
 */
export let FrameState;

/**
 * @param {FrameState} options TODO: repace this
 *
 * @param {number} options.pixelRatio 
 * @param {number} options.time 
 * @param {olx.ViewState} options.viewState 
 */


/**
 * @typedef {{center: ol.Coordinate,
 *     projection: ol.proj.Projection,
 *     resolution: number,
 *     rotation: number,
 *     zoom: number}}
 */
export let ViewState;

/**
 * @param {ViewState} options TODO: repace this
 *
 * @param {ol.Coordinate} options.center 
 * @param {ol.proj.Projection} options.projection 
 * @param {number} options.resolution 
 * @param {number} options.rotation 
 * @param {number} options.zoom The current zoom level.
 * 
 */


/**
 * @typedef {{initialSize: (number|undefined),
 *     maxSize: (number|undefined),
 *     space: (number|undefined)}}
 */
export let style_AtlasManagerOptions;

/**
 * @param {style_AtlasManagerOptions} options TODO: repace this
 *
 * @param {number|undefined} options.initialSize The size in pixels of the first atlas image. Default is `256`.
 * 
 * @param {number|undefined} options.maxSize The maximum size in pixels of atlas images. Default is
 * `WEBGL_MAX_TEXTURE_SIZE` or 2048 if WebGL is not supported.
 * 
 * @param {number|undefined} options.space The space in pixels between images (default: 1).
 * 
 */


/**
 * @typedef {{handles: function(ol.renderer.Type):boolean,
 *     create: function(Element, ol.PluggableMap):ol.renderer.Map}}
 */
export let MapRendererPlugin;

/**
 * @param {MapRendererPlugin} options TODO: repace this
 *
 * @param {function(ol.renderer.Type):boolean} options.handles Determine if this renderer handles the provided layer.
 * 
 * @param {function(Element, ol.PluggableMap):ol.renderer.Map} options.create Create the map renderer.
 * 
 */


/**
 * @typedef {{handles: function(ol.renderer.Type, ol.layer.Layer):boolean,
 *     create: function(ol.renderer.Map, ol.layer.Layer):ol.renderer.Layer}}
 */
export let LayerRendererPlugin;

/**
 * @param {LayerRendererPlugin} options TODO: repace this
 *
 * @param {function(ol.renderer.Type, ol.layer.Layer):boolean} options.handles Determine if this renderer handles the provided layer.
 * 
 * @param {function(ol.renderer.Map, ol.layer.Layer):ol.renderer.Layer} options.create Create a layer renderer.
 * 
 */

