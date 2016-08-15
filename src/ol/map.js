// FIXME recheck layer/map projection compatibility when projection changes
// FIXME layer renderers should skip when they can't reproject
// FIXME add tilt and height?

goog.provide('ol.Map');
goog.provide('ol.MapProperty');

goog.require('goog.async.nextTick');
goog.require('ol');
goog.require('ol.Collection');
goog.require('ol.MapBrowserEvent');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.MapBrowserEventHandler');
goog.require('ol.MapEvent');
goog.require('ol.MapEventType');
goog.require('ol.Object');
goog.require('ol.ObjectEventType');
goog.require('ol.RendererType');
goog.require('ol.TileQueue');
goog.require('ol.View');
goog.require('ol.array');
goog.require('ol.asserts');
goog.require('ol.control');
goog.require('ol.dom');
goog.require('ol.events');
goog.require('ol.events.Event');
goog.require('ol.events.EventType');
goog.require('ol.extent');
goog.require('ol.functions');
goog.require('ol.has');
goog.require('ol.interaction');
goog.require('ol.layer.Group');
goog.require('ol.obj');
goog.require('ol.proj.common');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.canvas.Map');
goog.require('ol.renderer.dom.Map');
goog.require('ol.renderer.webgl.Map');
goog.require('ol.size');
goog.require('ol.structs.PriorityQueue');
goog.require('ol.transform');


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
 * @const
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
 *           source: new ol.source.OSM()
 *         })
 *       ],
 *       target: 'map'
 *     });
 *
 * The above snippet creates a map using a {@link ol.layer.Tile} to display
 * {@link ol.source.OSM} OSM data and render it to a DOM element with the
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
 * Layers are stored as a `ol.Collection` in layerGroups. A top-level group is
 * provided by the library. This is what is accessed by `getLayerGroup` and
 * `setLayerGroup`. Layers entered in the options are added to this group, and
 * `addLayer` and `removeLayer` change the layer collection in the group.
 * `getLayers` is a convenience function for `getLayerGroup().getLayers()`.
 * Note that `ol.layer.Group` is a subclass of `ol.layer.Base`, so layers
 * entered in the options or added with `addLayer` can be groups, which can
 * contain further groups, and so on.
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

  ol.Object.call(this);

  var optionsInternal = ol.Map.createOptionsInternal(options);

  /**
   * @type {boolean}
   * @private
   */
  this.loadTilesWhileAnimating_ =
      options.loadTilesWhileAnimating !== undefined ?
          options.loadTilesWhileAnimating : false;

  /**
   * @type {boolean}
   * @private
   */
  this.loadTilesWhileInteracting_ =
      options.loadTilesWhileInteracting !== undefined ?
          options.loadTilesWhileInteracting : false;

  /**
   * @private
   * @type {number}
   */
  this.pixelRatio_ = options.pixelRatio !== undefined ?
      options.pixelRatio : ol.has.DEVICE_PIXEL_RATIO;

  /**
   * @private
   * @type {Object.<string, string>}
   */
  this.logos_ = optionsInternal.logos;

  /**
   * @private
   * @type {number|undefined}
   */
  this.animationDelayKey_;

  /**
   * @private
   */
  this.animationDelay_ = function() {
    this.animationDelayKey_ = undefined;
    this.renderFrame_.call(this, Date.now());
  }.bind(this);

  /**
   * @private
   * @type {ol.Transform}
   */
  this.coordinateToPixelTransform_ = ol.transform.create();

  /**
   * @private
   * @type {ol.Transform}
   */
  this.pixelToCoordinateTransform_ = ol.transform.create();

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
  this.previousExtent_ = ol.extent.createEmpty();

  /**
   * @private
   * @type {?ol.EventsKey}
   */
  this.viewPropertyListenerKey_ = null;

  /**
   * @private
   * @type {Array.<ol.EventsKey>}
   */
  this.layerGroupPropertyListenerKeys_ = null;

  /**
   * @private
   * @type {Element}
   */
  this.viewport_ = document.createElement('DIV');
  this.viewport_.className = 'ol-viewport' + (ol.has.TOUCH ? ' ol-touch' : '');
  this.viewport_.style.position = 'relative';
  this.viewport_.style.overflow = 'hidden';
  this.viewport_.style.width = '100%';
  this.viewport_.style.height = '100%';
  // prevent page zoom on IE >= 10 browsers
  this.viewport_.style.msTouchAction = 'none';
  this.viewport_.style.touchAction = 'none';

  /**
   * @private
   * @type {!Element}
   */
  this.overlayContainer_ = document.createElement('DIV');
  this.overlayContainer_.className = 'ol-overlaycontainer';
  this.viewport_.appendChild(this.overlayContainer_);

  /**
   * @private
   * @type {!Element}
   */
  this.overlayContainerStopEvent_ = document.createElement('DIV');
  this.overlayContainerStopEvent_.className = 'ol-overlaycontainer-stopevent';
  var overlayEvents = [
    ol.events.EventType.CLICK,
    ol.events.EventType.DBLCLICK,
    ol.events.EventType.MOUSEDOWN,
    ol.events.EventType.TOUCHSTART,
    ol.events.EventType.MSPOINTERDOWN,
    ol.MapBrowserEvent.EventType.POINTERDOWN,
    ol.events.EventType.MOUSEWHEEL,
    ol.events.EventType.WHEEL
  ];
  for (var i = 0, ii = overlayEvents.length; i < ii; ++i) {
    ol.events.listen(this.overlayContainerStopEvent_, overlayEvents[i],
        ol.events.Event.stopPropagation);
  }
  this.viewport_.appendChild(this.overlayContainerStopEvent_);

  /**
   * @private
   * @type {ol.MapBrowserEventHandler}
   */
  this.mapBrowserEventHandler_ = new ol.MapBrowserEventHandler(this);
  for (var key in ol.MapBrowserEvent.EventType) {
    ol.events.listen(this.mapBrowserEventHandler_, ol.MapBrowserEvent.EventType[key],
        this.handleMapBrowserEvent, this);
  }

  /**
   * @private
   * @type {Element|Document}
   */
  this.keyboardEventTarget_ = optionsInternal.keyboardEventTarget;

  /**
   * @private
   * @type {Array.<ol.EventsKey>}
   */
  this.keyHandlerKeys_ = null;

  ol.events.listen(this.viewport_, ol.events.EventType.WHEEL,
      this.handleBrowserEvent, this);
  ol.events.listen(this.viewport_, ol.events.EventType.MOUSEWHEEL,
      this.handleBrowserEvent, this);

  /**
   * @type {ol.Collection.<ol.control.Control>}
   * @private
   */
  this.controls_ = optionsInternal.controls;

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
   * A lookup of overlays by id.
   * @private
   * @type {Object.<string, ol.Overlay>}
   */
  this.overlayIdIndex_ = {};

  /**
   * @type {ol.renderer.Map}
   * @private
   */
  this.renderer_ = new optionsInternal.rendererConstructor(this.viewport_, this);

  /**
   * @type {function(Event)|undefined}
   * @private
   */
  this.handleResize_;

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
      this.getTilePriority.bind(this),
      this.handleTileChange_.bind(this));

  /**
   * Uids of features to skip at rendering time.
   * @type {Object.<string, boolean>}
   * @private
   */
  this.skippedFeatureUids_ = {};

  ol.events.listen(
      this, ol.Object.getChangeEventType(ol.MapProperty.LAYERGROUP),
      this.handleLayerGroupChanged_, this);
  ol.events.listen(this, ol.Object.getChangeEventType(ol.MapProperty.VIEW),
      this.handleViewChanged_, this);
  ol.events.listen(this, ol.Object.getChangeEventType(ol.MapProperty.SIZE),
      this.handleSizeChanged_, this);
  ol.events.listen(this, ol.Object.getChangeEventType(ol.MapProperty.TARGET),
      this.handleTargetChanged_, this);

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

  ol.events.listen(this.controls_, ol.Collection.EventType.ADD,
      /**
       * @param {ol.Collection.Event} event Collection event.
       */
      function(event) {
        event.element.setMap(this);
      }, this);

  ol.events.listen(this.controls_, ol.Collection.EventType.REMOVE,
      /**
       * @param {ol.Collection.Event} event Collection event.
       */
      function(event) {
        event.element.setMap(null);
      }, this);

  this.interactions_.forEach(
      /**
       * @param {ol.interaction.Interaction} interaction Interaction.
       * @this {ol.Map}
       */
      function(interaction) {
        interaction.setMap(this);
      }, this);

  ol.events.listen(this.interactions_, ol.Collection.EventType.ADD,
      /**
       * @param {ol.Collection.Event} event Collection event.
       */
      function(event) {
        event.element.setMap(this);
      }, this);

  ol.events.listen(this.interactions_, ol.Collection.EventType.REMOVE,
      /**
       * @param {ol.Collection.Event} event Collection event.
       */
      function(event) {
        event.element.setMap(null);
      }, this);

  this.overlays_.forEach(this.addOverlayInternal_, this);

  ol.events.listen(this.overlays_, ol.Collection.EventType.ADD,
      /**
       * @param {ol.Collection.Event} event Collection event.
       */
      function(event) {
        this.addOverlayInternal_(/** @type {ol.Overlay} */ (event.element));
      }, this);

  ol.events.listen(this.overlays_, ol.Collection.EventType.REMOVE,
      /**
       * @param {ol.Collection.Event} event Collection event.
       */
      function(event) {
        var id = event.element.getId();
        if (id !== undefined) {
          delete this.overlayIdIndex_[id.toString()];
        }
        event.element.setMap(null);
      }, this);

};
ol.inherits(ol.Map, ol.Object);


/**
 * Add the given control to the map.
 * @param {ol.control.Control} control Control.
 * @api stable
 */
ol.Map.prototype.addControl = function(control) {
  this.getControls().push(control);
};


/**
 * Add the given interaction to the map.
 * @param {ol.interaction.Interaction} interaction Interaction to add.
 * @api stable
 */
ol.Map.prototype.addInteraction = function(interaction) {
  this.getInteractions().push(interaction);
};


/**
 * Adds the given layer to the top of this map. If you want to add a layer
 * elsewhere in the stack, use `getLayers()` and the methods available on
 * {@link ol.Collection}.
 * @param {ol.layer.Base} layer Layer.
 * @api stable
 */
ol.Map.prototype.addLayer = function(layer) {
  var layers = this.getLayerGroup().getLayers();
  layers.push(layer);
};


/**
 * Add the given overlay to the map.
 * @param {ol.Overlay} overlay Overlay.
 * @api stable
 */
ol.Map.prototype.addOverlay = function(overlay) {
  this.getOverlays().push(overlay);
};


/**
 * This deals with map's overlay collection changes.
 * @param {ol.Overlay} overlay Overlay.
 * @private
 */
ol.Map.prototype.addOverlayInternal_ = function(overlay) {
  var id = overlay.getId();
  if (id !== undefined) {
    this.overlayIdIndex_[id.toString()] = overlay;
  }
  overlay.setMap(this);
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
  return ol.array.remove(this.preRenderFunctions_, preRenderFunction);
};


/**
 *
 * @inheritDoc
 */
ol.Map.prototype.disposeInternal = function() {
  this.mapBrowserEventHandler_.dispose();
  this.renderer_.dispose();
  ol.events.unlisten(this.viewport_, ol.events.EventType.WHEEL,
      this.handleBrowserEvent, this);
  ol.events.unlisten(this.viewport_, ol.events.EventType.MOUSEWHEEL,
      this.handleBrowserEvent, this);
  if (this.handleResize_ !== undefined) {
    ol.global.removeEventListener(ol.events.EventType.RESIZE,
        this.handleResize_, false);
    this.handleResize_ = undefined;
  }
  if (this.animationDelayKey_) {
    ol.global.cancelAnimationFrame(this.animationDelayKey_);
    this.animationDelayKey_ = undefined;
  }
  this.setTarget(null);
  ol.Object.prototype.disposeInternal.call(this);
};


/**
 * Detect features that intersect a pixel on the viewport, and execute a
 * callback with each intersecting feature. Layers included in the detection can
 * be configured through `opt_layerFilter`.
 * @param {ol.Pixel} pixel Pixel.
 * @param {function(this: S, (ol.Feature|ol.render.Feature),
 *     ol.layer.Layer): T} callback Feature callback. The callback will be
 *     called with two arguments. The first argument is one
 *     {@link ol.Feature feature} or
 *     {@link ol.render.Feature render feature} at the pixel, the second is
 *     the {@link ol.layer.Layer layer} of the feature and will be null for
 *     unmanaged layers. To stop detection, callback functions can return a
 *     truthy value.
 * @param {S=} opt_this Value to use as `this` when executing `callback`.
 * @param {(function(this: U, ol.layer.Layer): boolean)=} opt_layerFilter Layer
 *     filter function. The filter function will receive one argument, the
 *     {@link ol.layer.Layer layer-candidate} and it should return a boolean
 *     value. Only layers which are visible and for which this function returns
 *     `true` will be tested for features. By default, all visible layers will
 *     be tested.
 * @param {U=} opt_this2 Value to use as `this` when executing `layerFilter`.
 * @return {T|undefined} Callback result, i.e. the return value of last
 * callback execution, or the first truthy callback return value.
 * @template S,T,U
 * @api stable
 */
ol.Map.prototype.forEachFeatureAtPixel = function(pixel, callback, opt_this, opt_layerFilter, opt_this2) {
  if (!this.frameState_) {
    return;
  }
  var coordinate = this.getCoordinateFromPixel(pixel);
  var thisArg = opt_this !== undefined ? opt_this : null;
  var layerFilter = opt_layerFilter !== undefined ?
      opt_layerFilter : ol.functions.TRUE;
  var thisArg2 = opt_this2 !== undefined ? opt_this2 : null;
  return this.renderer_.forEachFeatureAtCoordinate(
      coordinate, this.frameState_, callback, thisArg,
      layerFilter, thisArg2);
};


/**
 * Detect layers that have a color value at a pixel on the viewport, and
 * execute a callback with each matching layer. Layers included in the
 * detection can be configured through `opt_layerFilter`.
 * @param {ol.Pixel} pixel Pixel.
 * @param {function(this: S, ol.layer.Layer, ol.Color): T} callback Layer
 *     callback. This callback will recieve two arguments: first is the
 *     {@link ol.layer.Layer layer}, second argument is {@link ol.Color}
 *     and will be null for layer types that do not currently support this
 *     argument. To stop detection callback functions can return a truthy value.
 * @param {S=} opt_this Value to use as `this` when executing `callback`.
 * @param {(function(this: U, ol.layer.Layer): boolean)=} opt_layerFilter Layer
 *     filter function. The filter function will receive one argument, the
 *     {@link ol.layer.Layer layer-candidate} and it should return a boolean
 *     value. Only layers which are visible and for which this function returns
 *     `true` will be tested for features. By default, all visible layers will
 *     be tested.
 * @param {U=} opt_this2 Value to use as `this` when executing `layerFilter`.
 * @return {T|undefined} Callback result, i.e. the return value of last
 * callback execution, or the first truthy callback return value.
 * @template S,T,U
 * @api stable
 */
ol.Map.prototype.forEachLayerAtPixel = function(pixel, callback, opt_this, opt_layerFilter, opt_this2) {
  if (!this.frameState_) {
    return;
  }
  var thisArg = opt_this !== undefined ? opt_this : null;
  var layerFilter = opt_layerFilter !== undefined ?
      opt_layerFilter : ol.functions.TRUE;
  var thisArg2 = opt_this2 !== undefined ? opt_this2 : null;
  return this.renderer_.forEachLayerAtPixel(
      pixel, this.frameState_, callback, thisArg,
      layerFilter, thisArg2);
};


/**
 * Detect if features intersect a pixel on the viewport. Layers included in the
 * detection can be configured through `opt_layerFilter`.
 * @param {ol.Pixel} pixel Pixel.
 * @param {(function(this: U, ol.layer.Layer): boolean)=} opt_layerFilter Layer
 *     filter function. The filter function will receive one argument, the
 *     {@link ol.layer.Layer layer-candidate} and it should return a boolean
 *     value. Only layers which are visible and for which this function returns
 *     `true` will be tested for features. By default, all visible layers will
 *     be tested.
 * @param {U=} opt_this Value to use as `this` when executing `layerFilter`.
 * @return {boolean} Is there a feature at the given pixel?
 * @template U
 * @api
 */
ol.Map.prototype.hasFeatureAtPixel = function(pixel, opt_layerFilter, opt_this) {
  if (!this.frameState_) {
    return false;
  }
  var coordinate = this.getCoordinateFromPixel(pixel);
  var layerFilter = opt_layerFilter !== undefined ?
      opt_layerFilter : ol.functions.TRUE;
  var thisArg = opt_this !== undefined ? opt_this : null;
  return this.renderer_.hasFeatureAtCoordinate(
      coordinate, this.frameState_, layerFilter, thisArg);
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
 * Returns the map pixel position for a browser event relative to the viewport.
 * @param {Event} event Event.
 * @return {ol.Pixel} Pixel.
 * @api stable
 */
ol.Map.prototype.getEventPixel = function(event) {
  var viewportPosition = this.viewport_.getBoundingClientRect();
  var eventPosition = event.changedTouches ? event.changedTouches[0] : event;
  return [
    eventPosition.clientX - viewportPosition.left,
    eventPosition.clientY - viewportPosition.top
  ];
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


/**
 * Get the DOM element into which this map is rendered. In contrast to
 * `getTarget` this method always return an `Element`, or `null` if the
 * map has no target.
 * @return {Element} The element that the map is rendered in.
 * @api
 */
ol.Map.prototype.getTargetElement = function() {
  var target = this.getTarget();
  if (target !== undefined) {
    return typeof target === 'string' ?
      document.getElementById(target) :
      target;
  } else {
    return null;
  }
};


/**
 * Get the coordinate for a given pixel.  This returns a coordinate in the
 * map view projection.
 * @param {ol.Pixel} pixel Pixel position in the map viewport.
 * @return {ol.Coordinate} The coordinate for the pixel position.
 * @api stable
 */
ol.Map.prototype.getCoordinateFromPixel = function(pixel) {
  var frameState = this.frameState_;
  if (!frameState) {
    return null;
  } else {
    return ol.transform.apply(frameState.pixelToCoordinateTransform, pixel.slice());
  }
};


/**
 * Get the map controls. Modifying this collection changes the controls
 * associated with the map.
 * @return {ol.Collection.<ol.control.Control>} Controls.
 * @api stable
 */
ol.Map.prototype.getControls = function() {
  return this.controls_;
};


/**
 * Get the map overlays. Modifying this collection changes the overlays
 * associated with the map.
 * @return {ol.Collection.<ol.Overlay>} Overlays.
 * @api stable
 */
ol.Map.prototype.getOverlays = function() {
  return this.overlays_;
};


/**
 * Get an overlay by its identifier (the value returned by overlay.getId()).
 * Note that the index treats string and numeric identifiers as the same. So
 * `map.getOverlayById(2)` will return an overlay with id `'2'` or `2`.
 * @param {string|number} id Overlay identifier.
 * @return {ol.Overlay} Overlay.
 * @api
 */
ol.Map.prototype.getOverlayById = function(id) {
  var overlay = this.overlayIdIndex_[id.toString()];
  return overlay !== undefined ? overlay : null;
};


/**
 * Get the map interactions. Modifying this collection changes the interactions
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


/**
 * Get the collection of layers associated with this map.
 * @return {!ol.Collection.<ol.layer.Base>} Layers.
 * @api stable
 */
ol.Map.prototype.getLayers = function() {
  var layers = this.getLayerGroup().getLayers();
  return layers;
};


/**
 * Get the pixel for a coordinate.  This takes a coordinate in the map view
 * projection and returns the corresponding pixel.
 * @param {ol.Coordinate} coordinate A map coordinate.
 * @return {ol.Pixel} A pixel position in the map viewport.
 * @api stable
 */
ol.Map.prototype.getPixelFromCoordinate = function(coordinate) {
  var frameState = this.frameState_;
  if (!frameState) {
    return null;
  } else {
    return ol.transform.apply(frameState.coordinateToPixelTransform,
        coordinate.slice(0, 2));
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


/**
 * Get the view associated with this map. A view manages properties such as
 * center and resolution.
 * @return {ol.View} The view that controls this map.
 * @observable
 * @api stable
 */
ol.Map.prototype.getView = function() {
  return /** @type {ol.View} */ (this.get(ol.MapProperty.VIEW));
};


/**
 * Get the element that serves as the map viewport.
 * @return {Element} Viewport.
 * @api stable
 */
ol.Map.prototype.getViewport = function() {
  return this.viewport_;
};


/**
 * Get the element that serves as the container for overlays.  Elements added to
 * this container will let mousedown and touchstart events through to the map,
 * so clicks and gestures on an overlay will trigger {@link ol.MapBrowserEvent}
 * events.
 * @return {!Element} The map's overlay container.
 */
ol.Map.prototype.getOverlayContainer = function() {
  return this.overlayContainer_;
};


/**
 * Get the element that serves as a container for overlays that don't allow
 * event propagation. Elements added to this container won't let mousedown and
 * touchstart events through to the map, so clicks and gestures on an overlay
 * don't trigger any {@link ol.MapBrowserEvent}.
 * @return {!Element} The map's overlay container that stops events.
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
ol.Map.prototype.getTilePriority = function(tile, tileSourceKey, tileCenter, tileResolution) {
  // Filter out tiles at higher zoom levels than the current zoom level, or that
  // are outside the visible extent.
  var frameState = this.frameState_;
  if (!frameState || !(tileSourceKey in frameState.wantedTiles)) {
    return ol.structs.PriorityQueue.DROP;
  }
  if (!frameState.wantedTiles[tileSourceKey][tile.getKey()]) {
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
 * @param {Event} browserEvent Browser event.
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
  if (!this.frameState_) {
    // With no view defined, we cannot translate pixels into geographical
    // coordinates so interactions cannot be used.
    return;
  }
  this.focus_ = mapBrowserEvent.coordinate;
  mapBrowserEvent.frameState = this.frameState_;
  var interactionsArray = this.getInteractions().getArray();
  var i;
  if (this.dispatchEvent(mapBrowserEvent) !== false) {
    for (i = interactionsArray.length - 1; i >= 0; i--) {
      var interaction = interactionsArray[i];
      if (!interaction.getActive()) {
        continue;
      }
      var cont = interaction.handleEvent(mapBrowserEvent);
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
    if (frameState) {
      var hints = frameState.viewHints;
      if (hints[ol.View.Hint.ANIMATING]) {
        maxTotalLoading = this.loadTilesWhileAnimating_ ? 8 : 0;
        maxNewLoads = 2;
      }
      if (hints[ol.View.Hint.INTERACTING]) {
        maxTotalLoading = this.loadTilesWhileInteracting_ ? 8 : 0;
        maxNewLoads = 2;
      }
    }
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

  var targetElement;
  if (this.getTarget()) {
    targetElement = this.getTargetElement();
    goog.DEBUG && console.assert(targetElement !== null,
        'expects a non-null value for targetElement');
  }

  if (this.keyHandlerKeys_) {
    for (var i = 0, ii = this.keyHandlerKeys_.length; i < ii; ++i) {
      ol.events.unlistenByKey(this.keyHandlerKeys_[i]);
    }
    this.keyHandlerKeys_ = null;
  }

  if (!targetElement) {
    ol.dom.removeNode(this.viewport_);
    if (this.handleResize_ !== undefined) {
      ol.global.removeEventListener(ol.events.EventType.RESIZE,
          this.handleResize_, false);
      this.handleResize_ = undefined;
    }
  } else {
    targetElement.appendChild(this.viewport_);

    var keyboardEventTarget = !this.keyboardEventTarget_ ?
        targetElement : this.keyboardEventTarget_;
    this.keyHandlerKeys_ = [
      ol.events.listen(keyboardEventTarget, ol.events.EventType.KEYDOWN,
          this.handleBrowserEvent, this),
      ol.events.listen(keyboardEventTarget, ol.events.EventType.KEYPRESS,
          this.handleBrowserEvent, this)
    ];

    if (!this.handleResize_) {
      this.handleResize_ = this.updateSize.bind(this);
      ol.global.addEventListener(ol.events.EventType.RESIZE,
          this.handleResize_, false);
    }
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
  if (this.viewPropertyListenerKey_) {
    ol.events.unlistenByKey(this.viewPropertyListenerKey_);
    this.viewPropertyListenerKey_ = null;
  }
  var view = this.getView();
  if (view) {
    this.viewPropertyListenerKey_ = ol.events.listen(
        view, ol.ObjectEventType.PROPERTYCHANGE,
        this.handleViewPropertyChanged_, this);
  }
  this.render();
};


/**
 * @private
 */
ol.Map.prototype.handleLayerGroupChanged_ = function() {
  if (this.layerGroupPropertyListenerKeys_) {
    this.layerGroupPropertyListenerKeys_.forEach(ol.events.unlistenByKey);
    this.layerGroupPropertyListenerKeys_ = null;
  }
  var layerGroup = this.getLayerGroup();
  if (layerGroup) {
    this.layerGroupPropertyListenerKeys_ = [
      ol.events.listen(
          layerGroup, ol.ObjectEventType.PROPERTYCHANGE,
          this.render, this),
      ol.events.listen(
          layerGroup, ol.events.EventType.CHANGE,
          this.render, this)
    ];
  }
  this.render();
};


/**
 * @return {boolean} Is rendered.
 */
ol.Map.prototype.isRendered = function() {
  return !!this.frameState_;
};


/**
 * Requests an immediate render in a synchronous manner.
 * @api stable
 */
ol.Map.prototype.renderSync = function() {
  if (this.animationDelayKey_) {
    ol.global.cancelAnimationFrame(this.animationDelayKey_);
  }
  this.animationDelay_();
};


/**
 * Request a map rendering (at the next animation frame).
 * @api stable
 */
ol.Map.prototype.render = function() {
  if (this.animationDelayKey_ === undefined) {
    this.animationDelayKey_ = ol.global.requestAnimationFrame(
        this.animationDelay_);
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
  return this.getControls().remove(control);
};


/**
 * Remove the given interaction from the map.
 * @param {ol.interaction.Interaction} interaction Interaction to remove.
 * @return {ol.interaction.Interaction|undefined} The removed interaction (or
 *     undefined if the interaction was not found).
 * @api stable
 */
ol.Map.prototype.removeInteraction = function(interaction) {
  return this.getInteractions().remove(interaction);
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
  return this.getOverlays().remove(overlay);
};


/**
 * @param {number} time Time.
 * @private
 */
ol.Map.prototype.renderFrame_ = function(time) {

  var i, ii, viewState;

  var size = this.getSize();
  var view = this.getView();
  var extent = ol.extent.createEmpty();
  /** @type {?olx.FrameState} */
  var frameState = null;
  if (size !== undefined && ol.size.hasArea(size) && view && view.isDef()) {
    var viewHints = view.getHints(this.frameState_ ? this.frameState_.viewHints : undefined);
    var layerStatesArray = this.getLayerGroup().getLayerStatesArray();
    var layerStates = {};
    for (i = 0, ii = layerStatesArray.length; i < ii; ++i) {
      layerStates[ol.getUid(layerStatesArray[i].layer)] = layerStatesArray[i];
    }
    viewState = view.getState();
    frameState = /** @type {olx.FrameState} */ ({
      animate: false,
      attributions: {},
      coordinateToPixelTransform: this.coordinateToPixelTransform_,
      extent: extent,
      focus: !this.focus_ ? viewState.center : this.focus_,
      index: this.frameIndex_++,
      layerStates: layerStates,
      layerStatesArray: layerStatesArray,
      logos: ol.obj.assign({}, this.logos_),
      pixelRatio: this.pixelRatio_,
      pixelToCoordinateTransform: this.pixelToCoordinateTransform_,
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

  if (frameState) {
    var preRenderFunctions = this.preRenderFunctions_;
    var n = 0, preRenderFunction;
    for (i = 0, ii = preRenderFunctions.length; i < ii; ++i) {
      preRenderFunction = preRenderFunctions[i];
      if (preRenderFunction(this, frameState)) {
        preRenderFunctions[n++] = preRenderFunction;
      }
    }
    preRenderFunctions.length = n;

    frameState.extent = ol.extent.getForViewAndSize(viewState.center,
        viewState.resolution, viewState.rotation, frameState.size, extent);
  }

  this.frameState_ = frameState;
  this.renderer_.renderFrame(frameState);

  if (frameState) {
    if (frameState.animate) {
      this.render();
    }
    Array.prototype.push.apply(
        this.postRenderFunctions_, frameState.postRenderFunctions);

    var idle = this.preRenderFunctions_.length === 0 &&
        !frameState.viewHints[ol.View.Hint.ANIMATING] &&
        !frameState.viewHints[ol.View.Hint.INTERACTING] &&
        !ol.extent.equals(frameState.extent, this.previousExtent_);

    if (idle) {
      this.dispatchEvent(
          new ol.MapEvent(ol.MapEventType.MOVEEND, this, frameState));
      ol.extent.clone(frameState.extent, this.previousExtent_);
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


/**
 * Set the size of this map.
 * @param {ol.Size|undefined} size The size in pixels of the map in the DOM.
 * @observable
 * @api
 */
ol.Map.prototype.setSize = function(size) {
  this.set(ol.MapProperty.SIZE, size);
};


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


/**
 * Set the view for this map.
 * @param {ol.View} view The view that controls this map.
 * @observable
 * @api stable
 */
ol.Map.prototype.setView = function(view) {
  this.set(ol.MapProperty.VIEW, view);
};


/**
 * @param {ol.Feature} feature Feature.
 */
ol.Map.prototype.skipFeature = function(feature) {
  var featureUid = ol.getUid(feature).toString();
  this.skippedFeatureUids_[featureUid] = true;
  this.render();
};


/**
 * Force a recalculation of the map viewport size.  This should be called when
 * third-party code changes the size of the map viewport.
 * @api stable
 */
ol.Map.prototype.updateSize = function() {
  var targetElement = this.getTargetElement();

  if (!targetElement) {
    this.setSize(undefined);
  } else {
    var computedStyle = ol.global.getComputedStyle(targetElement);
    this.setSize([
      targetElement.offsetWidth -
          parseFloat(computedStyle['borderLeftWidth']) -
          parseFloat(computedStyle['paddingLeft']) -
          parseFloat(computedStyle['paddingRight']) -
          parseFloat(computedStyle['borderRightWidth']),
      targetElement.offsetHeight -
          parseFloat(computedStyle['borderTopWidth']) -
          parseFloat(computedStyle['paddingTop']) -
          parseFloat(computedStyle['paddingBottom']) -
          parseFloat(computedStyle['borderBottomWidth'])
    ]);
  }
};


/**
 * @param {ol.Feature} feature Feature.
 */
ol.Map.prototype.unskipFeature = function(feature) {
  var featureUid = ol.getUid(feature).toString();
  delete this.skippedFeatureUids_[featureUid];
  this.render();
};


/**
 * @param {olx.MapOptions} options Map options.
 * @return {ol.MapOptionsInternal} Internal map options.
 */
ol.Map.createOptionsInternal = function(options) {

  /**
   * @type {Element|Document}
   */
  var keyboardEventTarget = null;
  if (options.keyboardEventTarget !== undefined) {
    keyboardEventTarget = typeof options.keyboardEventTarget === 'string' ?
        document.getElementById(options.keyboardEventTarget) :
        options.keyboardEventTarget;
  }

  /**
   * @type {Object.<string, *>}
   */
  var values = {};

  var logos = {};
  if (options.logo === undefined ||
      (typeof options.logo === 'boolean' && options.logo)) {
    logos[ol.OL3_LOGO_URL] = ol.OL3_URL;
  } else {
    var logo = options.logo;
    if (typeof logo === 'string') {
      logos[logo] = '';
    } else if (logo instanceof HTMLElement) {
      logos[ol.getUid(logo).toString()] = logo;
    } else if (logo) {
      ol.asserts.assert(typeof logo.href == 'string', 44); // `logo.href` should be a string.
      ol.asserts.assert(typeof logo.src == 'string', 45); // `logo.src` should be a string.
      logos[logo.src] = logo.href;
    }
  }

  var layerGroup = (options.layers instanceof ol.layer.Group) ?
      options.layers : new ol.layer.Group({layers: options.layers});
  values[ol.MapProperty.LAYERGROUP] = layerGroup;

  values[ol.MapProperty.TARGET] = options.target;

  values[ol.MapProperty.VIEW] = options.view !== undefined ?
      options.view : new ol.View();

  /**
   * @type {function(new: ol.renderer.Map, Element, ol.Map)}
   */
  var rendererConstructor = ol.renderer.Map;

  /**
   * @type {Array.<ol.RendererType>}
   */
  var rendererTypes;
  if (options.renderer !== undefined) {
    if (Array.isArray(options.renderer)) {
      rendererTypes = options.renderer;
    } else if (typeof options.renderer === 'string') {
      rendererTypes = [options.renderer];
    } else {
      ol.asserts.assert(false, 46); // Incorrect format for `renderer` option
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
  if (options.controls !== undefined) {
    if (Array.isArray(options.controls)) {
      controls = new ol.Collection(options.controls.slice());
    } else {
      ol.asserts.assert(options.controls instanceof ol.Collection,
          47); // Expected `controls` to be an array or an `ol.Collection`
      controls = options.controls;
    }
  } else {
    controls = ol.control.defaults();
  }

  var interactions;
  if (options.interactions !== undefined) {
    if (Array.isArray(options.interactions)) {
      interactions = new ol.Collection(options.interactions.slice());
    } else {
      ol.asserts.assert(options.interactions instanceof ol.Collection,
          48); // Expected `interactions` to be an array or an `ol.Collection`
      interactions = options.interactions;
    }
  } else {
    interactions = ol.interaction.defaults();
  }

  var overlays;
  if (options.overlays !== undefined) {
    if (Array.isArray(options.overlays)) {
      overlays = new ol.Collection(options.overlays.slice());
    } else {
      ol.asserts.assert(options.overlays instanceof ol.Collection,
          49); // Expected `overlays` to be an array or an `ol.Collection`
      overlays = options.overlays;
    }
  } else {
    overlays = new ol.Collection();
  }

  return {
    controls: controls,
    interactions: interactions,
    keyboardEventTarget: keyboardEventTarget,
    logos: logos,
    overlays: overlays,
    rendererConstructor: rendererConstructor,
    values: values
  };

};


ol.proj.common.add();
