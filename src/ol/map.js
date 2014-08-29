// FIXME recheck layer/map projection compatability when projection changes
// FIXME layer renderers should skip when they can't reproject
// FIXME add tilt and height?

goog.provide('ol.Map');
goog.provide('ol.MapProperty');

goog.require('goog.Uri.QueryData');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.AnimationDelay');
goog.require('goog.async.nextTick');
goog.require('goog.debug.Console');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyHandler');
goog.require('goog.events.KeyHandler.EventType');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.events.MouseWheelHandler.EventType');
goog.require('goog.log');
goog.require('goog.log.Level');
goog.require('goog.object');
goog.require('goog.style');
goog.require('goog.vec.Mat4');
goog.require('ol.Collection');
goog.require('ol.CollectionEventType');
goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.MapBrowserEventHandler');
goog.require('ol.MapEvent');
goog.require('ol.MapEventType');
goog.require('ol.Object');
goog.require('ol.ObjectEvent');
goog.require('ol.ObjectEventType');
goog.require('ol.Pixel');
goog.require('ol.PostRenderFunction');
goog.require('ol.PreRenderFunction');
goog.require('ol.RendererType');
goog.require('ol.Size');
goog.require('ol.TileQueue');
goog.require('ol.View');
goog.require('ol.ViewHint');
goog.require('ol.control');
goog.require('ol.extent');
goog.require('ol.has');
goog.require('ol.interaction');
goog.require('ol.layer.Base');
goog.require('ol.layer.Group');
goog.require('ol.proj');
goog.require('ol.proj.common');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.canvas.Map');
goog.require('ol.renderer.dom.Map');
goog.require('ol.renderer.webgl.Map');
goog.require('ol.structs.PriorityQueue');
goog.require('ol.tilecoord');
goog.require('ol.vec.Mat4');


/**
 * @const
 * @type {string}
 */
ol.OL3_URL = 'http://openlayers.org/';


/**
 * @const
 * @type {string}
 */
ol.OL3_LOGO_URL = 'data:image/png;base64,' +
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAA3NCSVQICAjb4U/gAAAACXBI' +
    'WXMAAAHGAAABxgEXwfpGAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAA' +
    'AhNQTFRF////AP//AICAgP//AFVVQECA////K1VVSbbbYL/fJ05idsTYJFtbbcjbJllmZszW' +
    'WMTOIFhoHlNiZszTa9DdUcHNHlNlV8XRIVdiasrUHlZjIVZjaMnVH1RlIFRkH1RkH1ZlasvY' +
    'asvXVsPQH1VkacnVa8vWIVZjIFRjVMPQa8rXIVVkXsXRsNveIFVkIFZlIVVj3eDeh6GmbMvX' +
    'H1ZkIFRka8rWbMvXIFVkIFVjIFVkbMvWH1VjbMvWIFVlbcvWIFVla8vVIFVkbMvWbMvVH1Vk' +
    'bMvWIFVlbcvWIFVkbcvVbMvWjNPbIFVkU8LPwMzNIFVkbczWIFVkbsvWbMvXIFVkRnB8bcvW' +
    '2+TkW8XRIFVkIlZlJVloJlpoKlxrLl9tMmJwOWd0Omh1RXF8TneCT3iDUHiDU8LPVMLPVcLP' +
    'VcPQVsPPVsPQV8PQWMTQWsTQW8TQXMXSXsXRX4SNX8bSYMfTYcfTYsfTY8jUZcfSZsnUaIqT' +
    'acrVasrVa8jTa8rWbI2VbMvWbcvWdJObdcvUdszUd8vVeJaee87Yfc3WgJyjhqGnitDYjaar' +
    'ldPZnrK2oNbborW5o9bbo9fbpLa6q9ndrL3ArtndscDDutzfu8fJwN7gwt7gxc/QyuHhy+Hi' +
    'zeHi0NfX0+Pj19zb1+Tj2uXk29/e3uLg3+Lh3+bl4uXj4ufl4+fl5Ofl5ufl5ujm5+jmySDn' +
    'BAAAAFp0Uk5TAAECAgMEBAYHCA0NDg4UGRogIiMmKSssLzU7PkJJT1JTVFliY2hrdHZ3foSF' +
    'hYeJjY2QkpugqbG1tre5w8zQ09XY3uXn6+zx8vT09vf4+Pj5+fr6/P39/f3+gz7SsAAAAVVJ' +
    'REFUOMtjYKA7EBDnwCPLrObS1BRiLoJLnte6CQy8FLHLCzs2QUG4FjZ5GbcmBDDjxJBXDWxC' +
    'Brb8aM4zbkIDzpLYnAcE9VXlJSWlZRU13koIeW57mGx5XjoMZEUqwxWYQaQbSzLSkYGfKFSe' +
    '0QMsX5WbjgY0YS4MBplemI4BdGBW+DQ11eZiymfqQuXZIjqwyadPNoSZ4L+0FVM6e+oGI6g8' +
    'a9iKNT3o8kVzNkzRg5lgl7p4wyRUL9Yt2jAxVh6mQCogae6GmflI8p0r13VFWTHBQ0rWPW7a' +
    'hgWVcPm+9cuLoyy4kCJDzCm6d8PSFoh0zvQNC5OjDJhQopPPJqph1doJBUD5tnkbZiUEqaCn' +
    'B3bTqLTFG1bPn71kw4b+GFdpLElKIzRxxgYgWNYc5SCENVHKeUaltHdXx0dZ8uBI1hJ2UUDg' +
    'q82CM2MwKeibqAvSO7MCABq0wXEPiqWEAAAAAElFTkSuQmCC';


/**
 * @type {Array.<ol.RendererType>}
 */
ol.DEFAULT_RENDERER_TYPES = [
  ol.RendererType.CANVAS,
  ol.RendererType.WEBGL,
  ol.RendererType.DOM
];


/**
 * @enum {string}
 */
ol.MapProperty = {
  LAYERGROUP: 'layergroup',
  SIZE: 'size',
  TARGET: 'target',
  VIEW: 'view'
};



/**
 * @classdesc
 * The map is the core component of OpenLayers. For a map to render, a view,
 * one or more layers, and a target container are needed:
 *
 *     var map = new ol.Map({
 *       view: new ol.View({
 *         center: [0, 0],
 *         zoom: 1
 *       }),
 *       layers: [
 *         new ol.layer.Tile({
 *           source: new ol.source.MapQuest({layer: 'osm'})
 *         })
 *       ],
 *       target: 'map'
 *     });
 *
 * The above snippet creates a map using a {@link ol.layer.Tile} to display
 * {@link ol.source.MapQuest} OSM data and render it to a DOM element with the
 * id `map`.
 *
 * The constructor places a viewport container (with CSS class name
 * `ol-viewport`) in the target element (see `getViewport()`), and then two
 * further elements within the viewport: one with CSS class name
 * `ol-overlaycontainer-stopevent` for controls and some overlays, and one with
 * CSS class name `ol-overlaycontainer` for other overlays (see the `stopEvent`
 * option of {@link ol.Overlay} for the difference). The map itself is placed in
 * a further element within the viewport, either DOM or Canvas, depending on the
 * renderer.
 *
 * @constructor
 * @extends {ol.Object}
 * @param {olx.MapOptions} options Map options.
 * @fires ol.MapBrowserEvent
 * @fires ol.MapEvent
 * @fires ol.render.Event#postcompose
 * @fires ol.render.Event#precompose
 * @api stable
 */
ol.Map = function(options) {

  goog.base(this);

  var optionsInternal = ol.Map.createOptionsInternal(options);

  /**
   * @private
   * @type {number}
   */
  this.pixelRatio_ = goog.isDef(options.pixelRatio) ?
      options.pixelRatio : ol.has.DEVICE_PIXEL_RATIO;

  /**
   * @private
   * @type {Object}
   */
  this.logos_ = optionsInternal.logos;

  /**
   * @private
   * @type {goog.async.AnimationDelay}
   */
  this.animationDelay_ =
      new goog.async.AnimationDelay(this.renderFrame_, undefined, this);
  this.registerDisposable(this.animationDelay_);

  /**
   * @private
   * @type {goog.vec.Mat4.Number}
   */
  this.coordinateToPixelMatrix_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {goog.vec.Mat4.Number}
   */
  this.pixelToCoordinateMatrix_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {number}
   */
  this.frameIndex_ = 0;

  /**
   * @private
   * @type {?olx.FrameState}
   */
  this.frameState_ = null;

  /**
   * The extent at the previous 'moveend' event.
   * @private
   * @type {ol.Extent}
   */
  this.previousExtent_ = null;

  /**
   * @private
   * @type {goog.events.Key}
   */
  this.viewPropertyListenerKey_ = null;

  /**
   * @private
   * @type {Array.<goog.events.Key>}
   */
  this.layerGroupPropertyListenerKeys_ = null;

  /**
   * @private
   * @type {Element}
   */
  this.viewport_ = goog.dom.createDom(goog.dom.TagName.DIV, 'ol-viewport');
  this.viewport_.style.position = 'relative';
  this.viewport_.style.overflow = 'hidden';
  this.viewport_.style.width = '100%';
  this.viewport_.style.height = '100%';
  // prevent page zoom on IE >= 10 browsers
  this.viewport_.style.msTouchAction = 'none';
  if (ol.has.TOUCH) {
    this.viewport_.className = 'ol-touch';
  }

  /**
   * @private
   * @type {Element}
   */
  this.overlayContainer_ = goog.dom.createDom(goog.dom.TagName.DIV,
      'ol-overlaycontainer');
  goog.dom.appendChild(this.viewport_, this.overlayContainer_);

  /**
   * @private
   * @type {Element}
   */
  this.overlayContainerStopEvent_ = goog.dom.createDom(goog.dom.TagName.DIV,
      'ol-overlaycontainer-stopevent');
  goog.events.listen(this.overlayContainerStopEvent_, [
    goog.events.EventType.CLICK,
    goog.events.EventType.DBLCLICK,
    goog.events.EventType.MOUSEDOWN,
    goog.events.EventType.TOUCHSTART,
    goog.events.EventType.MSPOINTERDOWN,
    ol.MapBrowserEvent.EventType.POINTERDOWN,
    // see https://github.com/google/closure-library/pull/308
    goog.userAgent.GECKO ? 'DOMMouseScroll' : 'mousewheel'
  ], goog.events.Event.stopPropagation);
  goog.dom.appendChild(this.viewport_, this.overlayContainerStopEvent_);

  var mapBrowserEventHandler = new ol.MapBrowserEventHandler(this);
  goog.events.listen(mapBrowserEventHandler,
      goog.object.getValues(ol.MapBrowserEvent.EventType),
      this.handleMapBrowserEvent, false, this);
  this.registerDisposable(mapBrowserEventHandler);

  /**
   * @private
   * @type {Element|Document}
   */
  this.keyboardEventTarget_ = optionsInternal.keyboardEventTarget;

  /**
   * @private
   * @type {goog.events.KeyHandler}
   */
  this.keyHandler_ = new goog.events.KeyHandler();
  goog.events.listen(this.keyHandler_, goog.events.KeyHandler.EventType.KEY,
      this.handleBrowserEvent, false, this);
  this.registerDisposable(this.keyHandler_);

  var mouseWheelHandler = new goog.events.MouseWheelHandler(this.viewport_);
  goog.events.listen(mouseWheelHandler,
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
      this.handleBrowserEvent, false, this);
  this.registerDisposable(mouseWheelHandler);

  /**
   * @type {ol.Collection.<ol.control.Control>}
   * @private
   */
  this.controls_ = optionsInternal.controls;

  /**
   * @type {olx.DeviceOptions}
   * @private
   */
  this.deviceOptions_ = optionsInternal.deviceOptions;

  /**
   * @type {ol.Collection.<ol.interaction.Interaction>}
   * @private
   */
  this.interactions_ = optionsInternal.interactions;

  /**
   * @type {ol.Collection.<ol.Overlay>}
   * @private
   */
  this.overlays_ = optionsInternal.overlays;

  /**
   * @type {ol.renderer.Map}
   * @private
   */
  this.renderer_ =
      new optionsInternal.rendererConstructor(this.viewport_, this);
  this.registerDisposable(this.renderer_);

  /**
   * @private
   */
  this.viewportSizeMonitor_ = new goog.dom.ViewportSizeMonitor();
  this.registerDisposable(this.viewportSizeMonitor_);

  goog.events.listen(this.viewportSizeMonitor_, goog.events.EventType.RESIZE,
      this.updateSize, false, this);

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.focus_ = null;

  /**
   * @private
   * @type {Array.<ol.PreRenderFunction>}
   */
  this.preRenderFunctions_ = [];

  /**
   * @private
   * @type {Array.<ol.PostRenderFunction>}
   */
  this.postRenderFunctions_ = [];

  /**
   * @private
   * @type {ol.TileQueue}
   */
  this.tileQueue_ = new ol.TileQueue(
      goog.bind(this.getTilePriority, this),
      goog.bind(this.handleTileChange_, this));

  /**
   * Uids of features to skip at rendering time.
   * @type {Object.<string, boolean>}
   * @private
   */
  this.skippedFeatureUids_ = {};

  goog.events.listen(
      this, ol.Object.getChangeEventType(ol.MapProperty.LAYERGROUP),
      this.handleLayerGroupChanged_, false, this);
  goog.events.listen(this, ol.Object.getChangeEventType(ol.MapProperty.VIEW),
      this.handleViewChanged_, false, this);
  goog.events.listen(this, ol.Object.getChangeEventType(ol.MapProperty.SIZE),
      this.handleSizeChanged_, false, this);
  goog.events.listen(this, ol.Object.getChangeEventType(ol.MapProperty.TARGET),
      this.handleTargetChanged_, false, this);

  // setProperties will trigger the rendering of the map if the map
  // is "defined" already.
  this.setProperties(optionsInternal.values);

  this.controls_.forEach(
      /**
       * @param {ol.control.Control} control Control.
       * @this {ol.Map}
       */
      function(control) {
        control.setMap(this);
      }, this);

  goog.events.listen(this.controls_, ol.CollectionEventType.ADD,
      /**
       * @param {ol.CollectionEvent} event Collection event.
       */
      function(event) {
        event.element.setMap(this);
      }, false, this);

  goog.events.listen(this.controls_, ol.CollectionEventType.REMOVE,
      /**
       * @param {ol.CollectionEvent} event Collection event.
       */
      function(event) {
        event.element.setMap(null);
      }, false, this);

  this.interactions_.forEach(
      /**
       * @param {ol.interaction.Interaction} interaction Interaction.
       * @this {ol.Map}
       */
      function(interaction) {
        interaction.setMap(this);
      }, this);

  goog.events.listen(this.interactions_, ol.CollectionEventType.ADD,
      /**
       * @param {ol.CollectionEvent} event Collection event.
       */
      function(event) {
        event.element.setMap(this);
      }, false, this);

  goog.events.listen(this.interactions_, ol.CollectionEventType.REMOVE,
      /**
       * @param {ol.CollectionEvent} event Collection event.
       */
      function(event) {
        event.element.setMap(null);
      }, false, this);

  this.overlays_.forEach(
      /**
       * @param {ol.Overlay} overlay Overlay.
       * @this {ol.Map}
       */
      function(overlay) {
        overlay.setMap(this);
      }, this);

  goog.events.listen(this.overlays_, ol.CollectionEventType.ADD,
      /**
       * @param {ol.CollectionEvent} event Collection event.
       */
      function(event) {
        event.element.setMap(this);
      }, false, this);

  goog.events.listen(this.overlays_, ol.CollectionEventType.REMOVE,
      /**
       * @param {ol.CollectionEvent} event Collection event.
       */
      function(event) {
        event.element.setMap(null);
      }, false, this);

};
goog.inherits(ol.Map, ol.Object);


/**
 * Add the given control to the map.
 * @param {ol.control.Control} control Control.
 * @api stable
 */
ol.Map.prototype.addControl = function(control) {
  var controls = this.getControls();
  goog.asserts.assert(goog.isDef(controls));
  controls.push(control);
};


/**
 * Add the given interaction to the map.
 * @param {ol.interaction.Interaction} interaction Interaction to add.
 * @api stable
 */
ol.Map.prototype.addInteraction = function(interaction) {
  var interactions = this.getInteractions();
  goog.asserts.assert(goog.isDef(interactions));
  interactions.push(interaction);
};


/**
 * Adds the given layer to the top of this map.
 * @param {ol.layer.Base} layer Layer.
 * @api stable
 */
ol.Map.prototype.addLayer = function(layer) {
  var layers = this.getLayerGroup().getLayers();
  goog.asserts.assert(goog.isDef(layers));
  layers.push(layer);
};


/**
 * Add the given overlay to the map.
 * @param {ol.Overlay} overlay Overlay.
 * @api stable
 */
ol.Map.prototype.addOverlay = function(overlay) {
  var overlays = this.getOverlays();
  goog.asserts.assert(goog.isDef(overlays));
  overlays.push(overlay);
};


/**
 * Add functions to be called before rendering. This can be used for attaching
 * animations before updating the map's view.  The {@link ol.animation}
 * namespace provides several static methods for creating prerender functions.
 * @param {...ol.PreRenderFunction} var_args Any number of pre-render functions.
 * @api
 */
ol.Map.prototype.beforeRender = function(var_args) {
  this.render();
  Array.prototype.push.apply(this.preRenderFunctions_, arguments);
};


/**
 * @param {ol.PreRenderFunction} preRenderFunction Pre-render function.
 * @return {boolean} Whether the preRenderFunction has been found and removed.
 */
ol.Map.prototype.removePreRenderFunction = function(preRenderFunction) {
  return goog.array.remove(this.preRenderFunctions_, preRenderFunction);
};


/**
 *
 * @inheritDoc
 */
ol.Map.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.viewport_);
  goog.base(this, 'disposeInternal');
};


/**
 * Detect features that intersect a pixel on the viewport, and execute a
 * callback with each intersecting feature. Layers included in the detection can
 * be configured through `opt_layerFilter`. Feature overlays will always be
 * included in the detection.
 * @param {ol.Pixel} pixel Pixel.
 * @param {function(this: S, ol.Feature, ol.layer.Layer): T} callback Feature
 *     callback. If the detected feature is not on a layer, but on a
 *     {@link ol.FeatureOverlay}, then the 2nd argument to this function will
 *     be `null`. To stop detection, callback functions can return a truthy
 *     value.
 * @param {S=} opt_this Value to use as `this` when executing `callback`.
 * @param {(function(this: U, ol.layer.Layer): boolean)=} opt_layerFilter Layer
 *     filter function, only layers which are visible and for which this
 *     function returns `true` will be tested for features. By default, all
 *     visible layers will be tested. Feature overlays will always be tested.
 * @param {U=} opt_this2 Value to use as `this` when executing `layerFilter`.
 * @return {T|undefined} Callback result, i.e. the return value of last
 * callback execution, or the first truthy callback return value.
 * @template S,T,U
 * @api stable
 */
ol.Map.prototype.forEachFeatureAtPixel =
    function(pixel, callback, opt_this, opt_layerFilter, opt_this2) {
  if (goog.isNull(this.frameState_)) {
    return;
  }
  var coordinate = this.getCoordinateFromPixel(pixel);
  var thisArg = goog.isDef(opt_this) ? opt_this : null;
  var layerFilter = goog.isDef(opt_layerFilter) ?
      opt_layerFilter : goog.functions.TRUE;
  var thisArg2 = goog.isDef(opt_this2) ? opt_this2 : null;
  return this.renderer_.forEachFeatureAtPixel(
      coordinate, this.frameState_, callback, thisArg,
      layerFilter, thisArg2);
};


/**
 * Returns the geographical coordinate for a browser event.
 * @param {Event} event Event.
 * @return {ol.Coordinate} Coordinate.
 * @api stable
 */
ol.Map.prototype.getEventCoordinate = function(event) {
  return this.getCoordinateFromPixel(this.getEventPixel(event));
};


/**
 * Returns the map pixel position for a browser event.
 * @param {Event} event Event.
 * @return {ol.Pixel} Pixel.
 * @api stable
 */
ol.Map.prototype.getEventPixel = function(event) {
  // goog.style.getRelativePosition is based on event.targetTouches,
  // but touchend and touchcancel events have no targetTouches when
  // the last finger is removed from the screen.
  // So we ourselves compute the position of touch events.
  // See https://github.com/google/closure-library/pull/323
  if (goog.isDef(event.changedTouches)) {
    var touch = event.changedTouches[0];
    var viewportPosition = goog.style.getClientPosition(this.viewport_);
    return [
      touch.clientX - viewportPosition.x,
      touch.clientY - viewportPosition.y
    ];
  } else {
    var eventPosition = goog.style.getRelativePosition(event, this.viewport_);
    return [eventPosition.x, eventPosition.y];
  }
};


/**
 * Get the target in which this map is rendered.
 * Note that this returns what is entered as an option or in setTarget:
 * if that was an element, it returns an element; if a string, it returns that.
 * @return {Element|string|undefined} The Element or id of the Element that the
 *     map is rendered in.
 * @observable
 * @api stable
 */
ol.Map.prototype.getTarget = function() {
  return /** @type {Element|string|undefined} */ (
      this.get(ol.MapProperty.TARGET));
};
goog.exportProperty(
    ol.Map.prototype,
    'getTarget',
    ol.Map.prototype.getTarget);


/**
 * @param {ol.Pixel} pixel Pixel.
 * @return {ol.Coordinate} Coordinate.
 * @api stable
 */
ol.Map.prototype.getCoordinateFromPixel = function(pixel) {
  var frameState = this.frameState_;
  if (goog.isNull(frameState)) {
    return null;
  } else {
    var vec2 = pixel.slice();
    return ol.vec.Mat4.multVec2(frameState.pixelToCoordinateMatrix, vec2, vec2);
  }
};


/**
 * @return {ol.Collection.<ol.control.Control>} Controls.
 * @api stable
 */
ol.Map.prototype.getControls = function() {
  return this.controls_;
};


/**
 * @return {ol.Collection.<ol.Overlay>} Overlays.
 * @api stable
 */
ol.Map.prototype.getOverlays = function() {
  return this.overlays_;
};


/**
 * Gets the collection of {@link ol.interaction.Interaction} instances
 * associated with this map. Modifying this collection changes the interactions
 * associated with the map.
 *
 * Interactions are used for e.g. pan, zoom and rotate.
 * @return {ol.Collection.<ol.interaction.Interaction>} Interactions.
 * @api stable
 */
ol.Map.prototype.getInteractions = function() {
  return this.interactions_;
};


/**
 * Get the layergroup associated with this map.
 * @return {ol.layer.Group} A layer group containing the layers in this map.
 * @observable
 * @api stable
 */
ol.Map.prototype.getLayerGroup = function() {
  return /** @type {ol.layer.Group} */ (this.get(ol.MapProperty.LAYERGROUP));
};
goog.exportProperty(
    ol.Map.prototype,
    'getLayerGroup',
    ol.Map.prototype.getLayerGroup);


/**
 * Get the collection of layers associated with this map.
 * @return {ol.Collection.<ol.layer.Base>|undefined} Layers.
 * @api stable
 */
ol.Map.prototype.getLayers = function() {
  var layerGroup = this.getLayerGroup();
  if (goog.isDef(layerGroup)) {
    return layerGroup.getLayers();
  } else {
    return undefined;
  }
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {ol.Pixel} Pixel.
 * @api stable
 */
ol.Map.prototype.getPixelFromCoordinate = function(coordinate) {
  var frameState = this.frameState_;
  if (goog.isNull(frameState)) {
    return null;
  } else {
    var vec2 = coordinate.slice(0, 2);
    return ol.vec.Mat4.multVec2(frameState.coordinateToPixelMatrix, vec2, vec2);
  }
};


/**
 * Get the map renderer.
 * @return {ol.renderer.Map} Renderer
 */
ol.Map.prototype.getRenderer = function() {
  return this.renderer_;
};


/**
 * Get the size of this map.
 * @return {ol.Size|undefined} The size in pixels of the map in the DOM.
 * @observable
 * @api stable
 */
ol.Map.prototype.getSize = function() {
  return /** @type {ol.Size|undefined} */ (this.get(ol.MapProperty.SIZE));
};
goog.exportProperty(
    ol.Map.prototype,
    'getSize',
    ol.Map.prototype.getSize);


/**
 * Get the view associated with this map. A view manages properties such as
 * center and resolution.
 * @return {ol.View|undefined} The view that controls this map.
 * @observable
 * @api stable
 */
ol.Map.prototype.getView = function() {
  return /** @type {ol.View} */ (this.get(ol.MapProperty.VIEW));
};
goog.exportProperty(
    ol.Map.prototype,
    'getView',
    ol.Map.prototype.getView);


/**
 * @return {Element} Viewport.
 * @api stable
 */
ol.Map.prototype.getViewport = function() {
  return this.viewport_;
};


/**
 * @return {Element} The map's overlay container. Elements added to this
 * container will let mousedown and touchstart events through to the map, so
 * clicks and gestures on an overlay will trigger {@link ol.MapBrowserEvent}
 * events.
 */
ol.Map.prototype.getOverlayContainer = function() {
  return this.overlayContainer_;
};


/**
 * @return {Element} The map's overlay container. Elements added to this
 * container won't let mousedown and touchstart events through to the map, so
 * clicks and gestures on an overlay don't trigger any
 * {@link ol.MapBrowserEvent}.
 */
ol.Map.prototype.getOverlayContainerStopEvent = function() {
  return this.overlayContainerStopEvent_;
};


/**
 * @param {ol.Tile} tile Tile.
 * @param {string} tileSourceKey Tile source key.
 * @param {ol.Coordinate} tileCenter Tile center.
 * @param {number} tileResolution Tile resolution.
 * @return {number} Tile priority.
 */
ol.Map.prototype.getTilePriority =
    function(tile, tileSourceKey, tileCenter, tileResolution) {
  // Filter out tiles at higher zoom levels than the current zoom level, or that
  // are outside the visible extent.
  var frameState = this.frameState_;
  if (goog.isNull(frameState) || !(tileSourceKey in frameState.wantedTiles)) {
    return ol.structs.PriorityQueue.DROP;
  }
  var coordKey = ol.tilecoord.toString(tile.tileCoord);
  if (!frameState.wantedTiles[tileSourceKey][coordKey]) {
    return ol.structs.PriorityQueue.DROP;
  }
  // Prioritize the highest zoom level tiles closest to the focus.
  // Tiles at higher zoom levels are prioritized using Math.log(tileResolution).
  // Within a zoom level, tiles are prioritized by the distance in pixels
  // between the center of the tile and the focus.  The factor of 65536 means
  // that the prioritization should behave as desired for tiles up to
  // 65536 * Math.log(2) = 45426 pixels from the focus.
  var deltaX = tileCenter[0] - frameState.focus[0];
  var deltaY = tileCenter[1] - frameState.focus[1];
  return 65536 * Math.log(tileResolution) +
      Math.sqrt(deltaX * deltaX + deltaY * deltaY) / tileResolution;
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @param {string=} opt_type Type.
 */
ol.Map.prototype.handleBrowserEvent = function(browserEvent, opt_type) {
  var type = opt_type || browserEvent.type;
  var mapBrowserEvent = new ol.MapBrowserEvent(type, this, browserEvent);
  this.handleMapBrowserEvent(mapBrowserEvent);
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent The event to handle.
 */
ol.Map.prototype.handleMapBrowserEvent = function(mapBrowserEvent) {
  if (goog.isNull(this.frameState_)) {
    // With no view defined, we cannot translate pixels into geographical
    // coordinates so interactions cannot be used.
    return;
  }
  this.focus_ = mapBrowserEvent.coordinate;
  mapBrowserEvent.frameState = this.frameState_;
  var interactions = this.getInteractions();
  goog.asserts.assert(goog.isDef(interactions));
  var interactionsArray = interactions.getArray();
  var i;
  if (this.dispatchEvent(mapBrowserEvent) !== false) {
    for (i = interactionsArray.length - 1; i >= 0; i--) {
      var interaction = interactionsArray[i];
      var cont = interaction.handleMapBrowserEvent(mapBrowserEvent);
      if (!cont) {
        break;
      }
    }
  }
};


/**
 * @protected
 */
ol.Map.prototype.handlePostRender = function() {

  var frameState = this.frameState_;

  // Manage the tile queue
  // Image loads are expensive and a limited resource, so try to use them
  // efficiently:
  // * When the view is static we allow a large number of parallel tile loads
  //   to complete the frame as quickly as possible.
  // * When animating or interacting, image loads can cause janks, so we reduce
  //   the maximum number of loads per frame and limit the number of parallel
  //   tile loads to remain reactive to view changes and to reduce the chance of
  //   loading tiles that will quickly disappear from view.
  var tileQueue = this.tileQueue_;
  if (!tileQueue.isEmpty()) {
    var maxTotalLoading = 16;
    var maxNewLoads = maxTotalLoading;
    var tileSourceCount = 0;
    if (!goog.isNull(frameState)) {
      var hints = frameState.viewHints;
      var deviceOptions = this.deviceOptions_;
      if (hints[ol.ViewHint.ANIMATING]) {
        maxTotalLoading = deviceOptions.loadTilesWhileAnimating === false ?
            0 : 8;
        maxNewLoads = 2;
      }
      if (hints[ol.ViewHint.INTERACTING]) {
        maxTotalLoading = deviceOptions.loadTilesWhileInteracting === false ?
            0 : 8;
        maxNewLoads = 2;
      }
      tileSourceCount = goog.object.getCount(frameState.wantedTiles);
    }
    maxTotalLoading *= tileSourceCount;
    maxNewLoads *= tileSourceCount;
    if (tileQueue.getTilesLoading() < maxTotalLoading) {
      tileQueue.reprioritize(); // FIXME only call if view has changed
      tileQueue.loadMoreTiles(maxTotalLoading, maxNewLoads);
    }
  }

  var postRenderFunctions = this.postRenderFunctions_;
  var i, ii;
  for (i = 0, ii = postRenderFunctions.length; i < ii; ++i) {
    postRenderFunctions[i](this, frameState);
  }
  postRenderFunctions.length = 0;
};


/**
 * @private
 */
ol.Map.prototype.handleSizeChanged_ = function() {
  this.render();
};


/**
 * @private
 */
ol.Map.prototype.handleTargetChanged_ = function() {
  // target may be undefined, null, a string or an Element.
  // If it's a string we convert it to an Element before proceeding.
  // If it's not now an Element we remove the viewport from the DOM.
  // If it's an Element we append the viewport element to it.

  var target = this.getTarget();

  /**
   * @type {Element}
   */
  var targetElement = goog.isDef(target) ?
      goog.dom.getElement(target) : null;

  this.keyHandler_.detach();

  if (goog.isNull(targetElement)) {
    goog.dom.removeNode(this.viewport_);
  } else {
    goog.dom.appendChild(targetElement, this.viewport_);

    var keyboardEventTarget = goog.isNull(this.keyboardEventTarget_) ?
        targetElement : this.keyboardEventTarget_;
    this.keyHandler_.attach(keyboardEventTarget);
  }

  this.updateSize();
  // updateSize calls setSize, so no need to call this.render
  // ourselves here.
};


/**
 * @private
 */
ol.Map.prototype.handleTileChange_ = function() {
  this.render();
};


/**
 * @private
 */
ol.Map.prototype.handleViewPropertyChanged_ = function() {
  this.render();
};


/**
 * @private
 */
ol.Map.prototype.handleViewChanged_ = function() {
  if (!goog.isNull(this.viewPropertyListenerKey_)) {
    goog.events.unlistenByKey(this.viewPropertyListenerKey_);
    this.viewPropertyListenerKey_ = null;
  }
  var view = this.getView();
  if (goog.isDefAndNotNull(view)) {
    this.viewPropertyListenerKey_ = goog.events.listen(
        view, ol.ObjectEventType.PROPERTYCHANGE,
        this.handleViewPropertyChanged_, false, this);
  }
  this.render();
};


/**
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.Map.prototype.handleLayerGroupMemberChanged_ = function(event) {
  goog.asserts.assertInstanceof(event, goog.events.Event);
  this.render();
};


/**
 * @param {ol.ObjectEvent} event Event.
 * @private
 */
ol.Map.prototype.handleLayerGroupPropertyChanged_ = function(event) {
  goog.asserts.assertInstanceof(event, ol.ObjectEvent);
  this.render();
};


/**
 * @private
 */
ol.Map.prototype.handleLayerGroupChanged_ = function() {
  if (!goog.isNull(this.layerGroupPropertyListenerKeys_)) {
    var length = this.layerGroupPropertyListenerKeys_.length;
    for (var i = 0; i < length; ++i) {
      goog.events.unlistenByKey(this.layerGroupPropertyListenerKeys_[i]);
    }
    this.layerGroupPropertyListenerKeys_ = null;
  }
  var layerGroup = this.getLayerGroup();
  if (goog.isDefAndNotNull(layerGroup)) {
    this.layerGroupPropertyListenerKeys_ = [
      goog.events.listen(
          layerGroup, ol.ObjectEventType.PROPERTYCHANGE,
          this.handleLayerGroupPropertyChanged_, false, this),
      goog.events.listen(
          layerGroup, goog.events.EventType.CHANGE,
          this.handleLayerGroupMemberChanged_, false, this)
    ];
  }
  this.render();
};


/**
 * Returns `true` if the map is defined, `false` otherwise. The map is defined
 * if it is contained in `document`, visible, has non-zero height and width, and
 * has a defined view.
 * @return {boolean} Is defined.
 */
ol.Map.prototype.isDef = function() {
  if (!goog.dom.contains(document, this.viewport_)) {
    return false;
  }
  if (!goog.style.isElementShown(this.viewport_)) {
    return false;
  }
  var size = this.getSize();
  if (!goog.isDefAndNotNull(size) || size[0] <= 0 || size[1] <= 0) {
    return false;
  }
  var view = this.getView();
  if (!goog.isDef(view) || !view.isDef()) {
    return false;
  }
  return true;
};


/**
 * @return {boolean} Is rendered.
 */
ol.Map.prototype.isRendered = function() {
  return !goog.isNull(this.frameState_);
};


/**
 * Requests an immediate render in a synchronous manner.
 * @api stable
 */
ol.Map.prototype.renderSync = function() {
  this.animationDelay_.fire();
};


/**
 * Requests a render frame; rendering will effectively occur at the next browser
 * animation frame.
 * @api stable
 */
ol.Map.prototype.render = function() {
  if (!this.animationDelay_.isActive()) {
    this.animationDelay_.start();
  }
};


/**
 * Remove the given control from the map.
 * @param {ol.control.Control} control Control.
 * @return {ol.control.Control|undefined} The removed control (or undefined
 *     if the control was not found).
 * @api stable
 */
ol.Map.prototype.removeControl = function(control) {
  var controls = this.getControls();
  goog.asserts.assert(goog.isDef(controls));
  if (goog.isDef(controls.remove(control))) {
    return control;
  }
  return undefined;
};


/**
 * Remove the given interaction from the map.
 * @param {ol.interaction.Interaction} interaction Interaction to remove.
 * @return {ol.interaction.Interaction|undefined} The removed interaction (or
 *     undefined if the interaction was not found).
 * @api stable
 */
ol.Map.prototype.removeInteraction = function(interaction) {
  var removed;
  var interactions = this.getInteractions();
  goog.asserts.assert(goog.isDef(interactions));
  if (goog.isDef(interactions.remove(interaction))) {
    removed = interaction;
  }
  return removed;
};


/**
 * Removes the given layer from the map.
 * @param {ol.layer.Base} layer Layer.
 * @return {ol.layer.Base|undefined} The removed layer (or undefined if the
 *     layer was not found).
 * @api stable
 */
ol.Map.prototype.removeLayer = function(layer) {
  var layers = this.getLayerGroup().getLayers();
  goog.asserts.assert(goog.isDef(layers));
  return layers.remove(layer);
};


/**
 * Remove the given overlay from the map.
 * @param {ol.Overlay} overlay Overlay.
 * @return {ol.Overlay|undefined} The removed overlay (or undefined
 *     if the overlay was not found).
 * @api stable
 */
ol.Map.prototype.removeOverlay = function(overlay) {
  var overlays = this.getOverlays();
  goog.asserts.assert(goog.isDef(overlays));
  if (goog.isDef(overlays.remove(overlay))) {
    return overlay;
  }
  return undefined;
};


/**
 * @param {number} time Time.
 * @private
 */
ol.Map.prototype.renderFrame_ = function(time) {

  var i, ii, viewState;

  /**
   * Check whether a size has non-zero width and height.  Note that this
   * function is here because the compiler doesn't recognize that size is
   * defined in the frameState assignment below when the same code is inline in
   * the condition below.  The compiler inlines this function itself, so the
   * resulting code is the same.
   *
   * @param {ol.Size} size The size to test.
   * @return {boolean} Has non-zero width and height.
   */
  function hasArea(size) {
    return size[0] > 0 && size[1] > 0;
  }

  var size = this.getSize();
  var view = this.getView();
  /** @type {?olx.FrameState} */
  var frameState = null;
  if (goog.isDef(size) && hasArea(size) &&
      goog.isDef(view) && view.isDef()) {
    var viewHints = view.getHints();
    var layerStatesArray = this.getLayerGroup().getLayerStatesArray();
    var layerStates = {};
    for (i = 0, ii = layerStatesArray.length; i < ii; ++i) {
      layerStates[goog.getUid(layerStatesArray[i].layer)] = layerStatesArray[i];
    }
    viewState = view.getState();
    frameState = /** @type {olx.FrameState} */ ({
      animate: false,
      attributions: {},
      coordinateToPixelMatrix: this.coordinateToPixelMatrix_,
      extent: null,
      focus: goog.isNull(this.focus_) ? viewState.center : this.focus_,
      index: this.frameIndex_++,
      layerStates: layerStates,
      layerStatesArray: layerStatesArray,
      logos: this.logos_,
      pixelRatio: this.pixelRatio_,
      pixelToCoordinateMatrix: this.pixelToCoordinateMatrix_,
      postRenderFunctions: [],
      size: size,
      skippedFeatureUids: this.skippedFeatureUids_,
      tileQueue: this.tileQueue_,
      time: time,
      usedTiles: {},
      viewState: viewState,
      viewHints: viewHints,
      wantedTiles: {}
    });
  }

  var preRenderFunctions = this.preRenderFunctions_;
  var n = 0, preRenderFunction;
  for (i = 0, ii = preRenderFunctions.length; i < ii; ++i) {
    preRenderFunction = preRenderFunctions[i];
    if (preRenderFunction(this, frameState)) {
      preRenderFunctions[n++] = preRenderFunction;
    }
  }
  preRenderFunctions.length = n;

  if (!goog.isNull(frameState)) {
    frameState.extent = ol.extent.getForViewAndSize(viewState.center,
        viewState.resolution, viewState.rotation, frameState.size);
  }

  this.frameState_ = frameState;
  this.renderer_.renderFrame(frameState);

  if (!goog.isNull(frameState)) {
    if (frameState.animate) {
      this.render();
    }
    Array.prototype.push.apply(
        this.postRenderFunctions_, frameState.postRenderFunctions);

    var idle = this.preRenderFunctions_.length === 0 &&
        !frameState.viewHints[ol.ViewHint.ANIMATING] &&
        !frameState.viewHints[ol.ViewHint.INTERACTING] &&
        (!this.previousExtent_ ||
            !ol.extent.equals(frameState.extent, this.previousExtent_));

    if (idle) {
      this.dispatchEvent(
          new ol.MapEvent(ol.MapEventType.MOVEEND, this, frameState));
      this.previousExtent_ = ol.extent.clone(frameState.extent);
    }
  }

  this.dispatchEvent(
      new ol.MapEvent(ol.MapEventType.POSTRENDER, this, frameState));

  goog.async.nextTick(this.handlePostRender, this);

};


/**
 * Sets the layergroup of this map.
 * @param {ol.layer.Group} layerGroup A layer group containing the layers in
 *     this map.
 * @observable
 * @api stable
 */
ol.Map.prototype.setLayerGroup = function(layerGroup) {
  this.set(ol.MapProperty.LAYERGROUP, layerGroup);
};
goog.exportProperty(
    ol.Map.prototype,
    'setLayerGroup',
    ol.Map.prototype.setLayerGroup);


/**
 * Set the size of this map.
 * @param {ol.Size|undefined} size The size in pixels of the map in the DOM.
 * @observable
 * @api
 */
ol.Map.prototype.setSize = function(size) {
  this.set(ol.MapProperty.SIZE, size);
};
goog.exportProperty(
    ol.Map.prototype,
    'setSize',
    ol.Map.prototype.setSize);


/**
 * Set the target element to render this map into.
 * @param {Element|string|undefined} target The Element or id of the Element
 *     that the map is rendered in.
 * @observable
 * @api stable
 */
ol.Map.prototype.setTarget = function(target) {
  this.set(ol.MapProperty.TARGET, target);
};
goog.exportProperty(
    ol.Map.prototype,
    'setTarget',
    ol.Map.prototype.setTarget);


/**
 * Set the view for this map.
 * @param {ol.View} view The view that controls this map.
 * @observable
 * @api stable
 */
ol.Map.prototype.setView = function(view) {
  this.set(ol.MapProperty.VIEW, view);
};
goog.exportProperty(
    ol.Map.prototype,
    'setView',
    ol.Map.prototype.setView);


/**
 * @param {ol.Feature} feature Feature.
 */
ol.Map.prototype.skipFeature = function(feature) {
  var featureUid = goog.getUid(feature).toString();
  this.skippedFeatureUids_[featureUid] = true;
  this.render();
};


/**
 * Force a recalculation of the map viewport size.  This should be called when
 * third-party code changes the size of the map viewport.
 * @api stable
 */
ol.Map.prototype.updateSize = function() {
  var target = this.getTarget();

  /**
   * @type {Element}
   */
  var targetElement = goog.isDef(target) ? goog.dom.getElement(target) : null;

  if (goog.isNull(targetElement)) {
    this.setSize(undefined);
  } else {
    var size = goog.style.getContentBoxSize(targetElement);
    this.setSize([size.width, size.height]);
  }
};


/**
 * @param {ol.Feature} feature Feature.
 */
ol.Map.prototype.unskipFeature = function(feature) {
  var featureUid = goog.getUid(feature).toString();
  delete this.skippedFeatureUids_[featureUid];
  this.render();
};


/**
 * @typedef {{controls: ol.Collection.<ol.control.Control>,
 *            deviceOptions: olx.DeviceOptions,
 *            interactions: ol.Collection.<ol.interaction.Interaction>,
 *            keyboardEventTarget: (Element|Document),
 *            logos: Object,
 *            overlays: ol.Collection.<ol.Overlay>,
 *            rendererConstructor:
 *                function(new: ol.renderer.Map, Element, ol.Map),
 *            values: Object.<string, *>}}
 */
ol.MapOptionsInternal;


/**
 * @param {olx.MapOptions} options Map options.
 * @return {ol.MapOptionsInternal} Internal map options.
 */
ol.Map.createOptionsInternal = function(options) {

  /**
   * @type {Element|Document}
   */
  var keyboardEventTarget = null;
  if (goog.isDef(options.keyboardEventTarget)) {
    // cannot use goog.dom.getElement because its argument cannot be
    // of type Document
    keyboardEventTarget = goog.isString(options.keyboardEventTarget) ?
        document.getElementById(options.keyboardEventTarget) :
        options.keyboardEventTarget;
  }

  /**
   * @type {Object.<string, *>}
   */
  var values = {};

  var logos = {};
  if (!goog.isDef(options.logo) ||
      (goog.isBoolean(options.logo) && options.logo)) {
    logos[ol.OL3_LOGO_URL] = ol.OL3_URL;
  } else {
    var logo = options.logo;
    if (goog.isString(logo)) {
      logos[logo] = '';
    } else if (goog.isObject(logo)) {
      goog.asserts.assertString(logo.href);
      goog.asserts.assertString(logo.src);
      logos[logo.src] = logo.href;
    }
  }

  var layerGroup = (options.layers instanceof ol.layer.Group) ?
      options.layers : new ol.layer.Group({layers: options.layers});
  values[ol.MapProperty.LAYERGROUP] = layerGroup;

  values[ol.MapProperty.TARGET] = options.target;

  values[ol.MapProperty.VIEW] = goog.isDef(options.view) ?
      options.view : new ol.View();

  /**
   * @type {function(new: ol.renderer.Map, Element, ol.Map)}
   */
  var rendererConstructor = ol.renderer.Map;

  /**
   * @type {Array.<ol.RendererType>}
   */
  var rendererTypes;
  if (goog.isDef(options.renderer)) {
    if (goog.isArray(options.renderer)) {
      rendererTypes = options.renderer;
    } else if (goog.isString(options.renderer)) {
      rendererTypes = [options.renderer];
    } else {
      goog.asserts.fail('Incorrect format for renderer option');
    }
  } else {
    rendererTypes = ol.DEFAULT_RENDERER_TYPES;
  }

  var i, ii;
  for (i = 0, ii = rendererTypes.length; i < ii; ++i) {
    /** @type {ol.RendererType} */
    var rendererType = rendererTypes[i];
    if (ol.ENABLE_CANVAS && rendererType == ol.RendererType.CANVAS) {
      if (ol.has.CANVAS) {
        rendererConstructor = ol.renderer.canvas.Map;
        break;
      }
    } else if (ol.ENABLE_DOM && rendererType == ol.RendererType.DOM) {
      if (ol.has.DOM) {
        rendererConstructor = ol.renderer.dom.Map;
        break;
      }
    } else if (ol.ENABLE_WEBGL && rendererType == ol.RendererType.WEBGL) {
      if (ol.has.WEBGL) {
        rendererConstructor = ol.renderer.webgl.Map;
        break;
      }
    }
  }

  var controls;
  if (goog.isDef(options.controls)) {
    if (goog.isArray(options.controls)) {
      controls = new ol.Collection(goog.array.clone(options.controls));
    } else {
      goog.asserts.assertInstanceof(options.controls, ol.Collection);
      controls = options.controls;
    }
  } else {
    controls = ol.control.defaults();
  }

  var deviceOptions = goog.isDef(options.deviceOptions) ?
      options.deviceOptions : /** @type {olx.DeviceOptions} */ ({});

  var interactions;
  if (goog.isDef(options.interactions)) {
    if (goog.isArray(options.interactions)) {
      interactions = new ol.Collection(goog.array.clone(options.interactions));
    } else {
      goog.asserts.assertInstanceof(options.interactions, ol.Collection);
      interactions = options.interactions;
    }
  } else {
    interactions = ol.interaction.defaults();
  }

  var overlays;
  if (goog.isDef(options.overlays)) {
    if (goog.isArray(options.overlays)) {
      overlays = new ol.Collection(goog.array.clone(options.overlays));
    } else {
      goog.asserts.assertInstanceof(options.overlays, ol.Collection);
      overlays = options.overlays;
    }
  } else {
    overlays = new ol.Collection();
  }

  return {
    controls: controls,
    deviceOptions: deviceOptions,
    interactions: interactions,
    keyboardEventTarget: keyboardEventTarget,
    logos: logos,
    overlays: overlays,
    rendererConstructor: rendererConstructor,
    values: values
  };

};


ol.proj.common.add();


if (goog.DEBUG) {
  (function() {
    goog.debug.Console.autoInstall();
    var logger = goog.log.getLogger('ol');
    logger.setLevel(goog.log.Level.FINEST);
  })();
}
