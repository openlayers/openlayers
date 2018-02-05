/**
 * @module ol/PluggableMap
 */
import {getUid, inherits} from './index.js';
import Collection from './Collection.js';
import CollectionEventType from './CollectionEventType.js';
import MapBrowserEvent from './MapBrowserEvent.js';
import MapBrowserEventHandler from './MapBrowserEventHandler.js';
import MapBrowserEventType from './MapBrowserEventType.js';
import MapEvent from './MapEvent.js';
import MapEventType from './MapEventType.js';
import MapProperty from './MapProperty.js';
import BaseObject from './Object.js';
import ObjectEventType from './ObjectEventType.js';
import TileQueue from './TileQueue.js';
import View from './View.js';
import ViewHint from './ViewHint.js';
import {assert} from './asserts.js';
import {removeNode} from './dom.js';
import {listen, unlistenByKey, unlisten} from './events.js';
import Event from './events/Event.js';
import EventType from './events/EventType.js';
import {createEmpty, clone, createOrUpdateEmpty, equals, getForViewAndSize, isEmpty} from './extent.js';
import {TRUE} from './functions.js';
import {DEVICE_PIXEL_RATIO, TOUCH} from './has.js';
import LayerGroup from './layer/Group.js';
import {getMapRendererPlugins} from './plugins.js';
import RendererType from './renderer/Type.js';
import _ol_size_ from './size.js';
import PriorityQueue from './structs/PriorityQueue.js';
import _ol_transform_ from './transform.js';


/**
 * Object literal with config options for the map.
 * @typedef {{controls: (ol.Collection.<ol.control.Control>|Array.<ol.control.Control>|undefined),
 *     pixelRatio: (number|undefined),
 *     interactions: (ol.Collection.<ol.interaction.Interaction>|Array.<ol.interaction.Interaction>|undefined),
 *     keyboardEventTarget: (Element|Document|string|undefined),
 *     layers: (Array.<ol.layer.Base>|ol.Collection.<ol.layer.Base>|undefined),
 *     loadTilesWhileAnimating: (boolean|undefined),
 *     loadTilesWhileInteracting: (boolean|undefined),
 *     moveTolerance: (number|undefined),
 *     overlays: (ol.Collection.<ol.Overlay>|Array.<ol.Overlay>|undefined),
 *     renderer: (ol.renderer.Type|Array.<ol.renderer.Type>|undefined),
 *     target: (Element|string|undefined),
 *     view: (ol.View|undefined)}}
 */
export let MapOptions;


/**
 * @constructor
 * @extends {ol.Object}
 * @param {MapOptions} options Map options.
 * @param {ol.Collection.<ol.control.Control>|Array.<ol.control.Control>|undefined} options.controls
 *     Controls initially added to the map. If not specified,
 *     {@link ol.control.defaults ol.control.defaults()} is used.
 * @param {number|undefined} options.pixelRatio The ratio between physical
 *     pixels and device-independent pixels (dips) on the device. If
 *     `undefined` then it gets set by using `window.devicePixelRatio`.
 * @param {ol.Collection.<ol.interaction.Interaction>|Array.<ol.interaction.Interaction>|undefined} options.interactions
 *     Interactions that are initially added to the map. If not specified,
 *     {@link ol.interaction.defaults ol.interaction.defaults()} is used.
 * @param {Element|Document|string|undefined} options.keyboardEventTarget The
 *     element to listen to keyboard events on. This determines when the
 *     `KeyboardPan` and `KeyboardZoom` interactions trigger. For example, if
 *     this option is set to `document` the keyboard interactions will always
 *     trigger. If this option is not specified, the element the library listens
 *     to keyboard events on is the map target (i.e. the user-provided div for
 *     the map). If this is not `document` the target element needs to be
 *     focused for key events to be emitted, requiring that the target element
 *     has a `tabindex` attribute.
 * @param {Array.<ol.layer.Base>|ol.Collection.<ol.layer.Base>|undefined} options.layers
 *     Layers. If this is not defined, a map with no layers will be rendered.
 *     Note that layers are rendered in the order supplied, so if you want, for
 *     example, a vector layer to appear on top of a tile layer, it must come
 *     after the tile layer.
 * @param {boolean|undefined} options.loadTilesWhileAnimating When set to true,
 *     tiles will be loaded during animations. This may improve the user
 *     experience, but can also make animations stutter on devices with slow
 *     memory. Default is `false`.
 * @param {boolean|undefined} options.loadTilesWhileInteracting When set to
 *     true, tiles will be loaded while interacting with the map. This may
 *     improve the user experience, but can also make map panning and zooming
 *     choppy on devices with slow memory. Default is `false`.
 * @param {number|undefined} options.moveTolerance The minimum distance in
 *     pixels the cursor must move to be detected as a map move event instead
 *     of a click. Increasing this value can make it easier to click on the map.
 *     Default is `1`.
 * @param {ol.Collection.<ol.Overlay>|Array.<ol.Overlay>|undefined} options.overlays
 *     Overlays initially added to the map. By default, no overlays are added.
 * @param {ol.renderer.Type|Array.<ol.renderer.Type>|undefined} options.renderer
 *     Renderer. By default, Canvas and WebGL renderers are tested for support
 *     in that order, and the first supported used. Specify a
 *     {@link ol.renderer.Type} here to use a specific renderer. Note that the
 *     Canvas renderer fully supports vector data, but WebGL can only render
 *     Point geometries.
 * @param {Element|string|undefined} options.target The container for the map,
 *     either the element itself or the `id` of the element. If not specified at
 *     construction time, {@link ol.Map#setTarget} must be called for the map to
 *     be rendered.
 * @param {ol.View|undefined} options.view The map's view.  No layer sources
 *     will be fetched unless this is specified at construction time or through
 *     {@link ol.Map#setView}.
 * @fires ol.MapBrowserEvent
 * @fires ol.MapEvent
 * @fires ol.render.Event#postcompose
 * @fires ol.render.Event#precompose
 * @api
 */
const PluggableMap = function(options) {

  BaseObject.call(this);

  const optionsInternal = createOptionsInternal(options);

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
    options.pixelRatio : DEVICE_PIXEL_RATIO;

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
  this.coordinateToPixelTransform_ = _ol_transform_.create();

  /**
   * @private
   * @type {ol.Transform}
   */
  this.pixelToCoordinateTransform_ = _ol_transform_.create();

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
   * @type {?ol.EventsKey}
   */
  this.viewPropertyListenerKey_ = null;

  /**
   * @private
   * @type {?ol.EventsKey}
   */
  this.viewChangeListenerKey_ = null;

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
  this.viewport_.className = 'ol-viewport' + (TOUCH ? ' ol-touch' : '');
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
  const overlayEvents = [
    EventType.CLICK,
    EventType.DBLCLICK,
    EventType.MOUSEDOWN,
    EventType.TOUCHSTART,
    EventType.MSPOINTERDOWN,
    MapBrowserEventType.POINTERDOWN,
    EventType.MOUSEWHEEL,
    EventType.WHEEL
  ];
  for (let i = 0, ii = overlayEvents.length; i < ii; ++i) {
    listen(this.overlayContainerStopEvent_, overlayEvents[i],
      Event.stopPropagation);
  }
  this.viewport_.appendChild(this.overlayContainerStopEvent_);

  /**
   * @private
   * @type {ol.MapBrowserEventHandler}
   */
  this.mapBrowserEventHandler_ = new MapBrowserEventHandler(this, options.moveTolerance);
  for (const key in MapBrowserEventType) {
    listen(this.mapBrowserEventHandler_, MapBrowserEventType[key],
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

  listen(this.viewport_, EventType.CONTEXTMENU,
    this.handleBrowserEvent, this);
  listen(this.viewport_, EventType.WHEEL,
    this.handleBrowserEvent, this);
  listen(this.viewport_, EventType.MOUSEWHEEL,
    this.handleBrowserEvent, this);

  /**
   * @type {ol.Collection.<ol.control.Control>}
   * @protected
   */
  this.controls = optionsInternal.controls || new Collection();

  /**
   * @type {ol.Collection.<ol.interaction.Interaction>}
   * @protected
   */
  this.interactions = optionsInternal.interactions || new Collection();

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
  this.renderer_ = optionsInternal.mapRendererPlugin['create'](this.viewport_, this);

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
   * @type {Array.<ol.PostRenderFunction>}
   */
  this.postRenderFunctions_ = [];

  /**
   * @private
   * @type {ol.TileQueue}
   */
  this.tileQueue_ = new TileQueue(
    this.getTilePriority.bind(this),
    this.handleTileChange_.bind(this));

  /**
   * Uids of features to skip at rendering time.
   * @type {Object.<string, boolean>}
   * @private
   */
  this.skippedFeatureUids_ = {};

  listen(
    this, BaseObject.getChangeEventType(MapProperty.LAYERGROUP),
    this.handleLayerGroupChanged_, this);
  listen(this, BaseObject.getChangeEventType(MapProperty.VIEW),
    this.handleViewChanged_, this);
  listen(this, BaseObject.getChangeEventType(MapProperty.SIZE),
    this.handleSizeChanged_, this);
  listen(this, BaseObject.getChangeEventType(MapProperty.TARGET),
    this.handleTargetChanged_, this);

  // setProperties will trigger the rendering of the map if the map
  // is "defined" already.
  this.setProperties(optionsInternal.values);

  this.controls.forEach(
    /**
       * @param {ol.control.Control} control Control.
       * @this {ol.PluggableMap}
       */
    function(control) {
      control.setMap(this);
    }.bind(this));

  listen(this.controls, CollectionEventType.ADD,
    /**
       * @param {ol.Collection.Event} event Collection event.
       */
    function(event) {
      event.element.setMap(this);
    }, this);

  listen(this.controls, CollectionEventType.REMOVE,
    /**
       * @param {ol.Collection.Event} event Collection event.
       */
    function(event) {
      event.element.setMap(null);
    }, this);

  this.interactions.forEach(
    /**
       * @param {ol.interaction.Interaction} interaction Interaction.
       * @this {ol.PluggableMap}
       */
    function(interaction) {
      interaction.setMap(this);
    }.bind(this));

  listen(this.interactions, CollectionEventType.ADD,
    /**
       * @param {ol.Collection.Event} event Collection event.
       */
    function(event) {
      event.element.setMap(this);
    }, this);

  listen(this.interactions, CollectionEventType.REMOVE,
    /**
       * @param {ol.Collection.Event} event Collection event.
       */
    function(event) {
      event.element.setMap(null);
    }, this);

  this.overlays_.forEach(this.addOverlayInternal_.bind(this));

  listen(this.overlays_, CollectionEventType.ADD,
    /**
       * @param {ol.Collection.Event} event Collection event.
       */
    function(event) {
      this.addOverlayInternal_(/** @type {ol.Overlay} */ (event.element));
    }, this);

  listen(this.overlays_, CollectionEventType.REMOVE,
    /**
       * @param {ol.Collection.Event} event Collection event.
       */
    function(event) {
      const overlay = /** @type {ol.Overlay} */ (event.element);
      const id = overlay.getId();
      if (id !== undefined) {
        delete this.overlayIdIndex_[id.toString()];
      }
      event.element.setMap(null);
    }, this);

};

inherits(PluggableMap, BaseObject);


/**
 * Add the given control to the map.
 * @param {ol.control.Control} control Control.
 * @api
 */
PluggableMap.prototype.addControl = function(control) {
  this.getControls().push(control);
};


/**
 * Add the given interaction to the map.
 * @param {ol.interaction.Interaction} interaction Interaction to add.
 * @api
 */
PluggableMap.prototype.addInteraction = function(interaction) {
  this.getInteractions().push(interaction);
};


/**
 * Adds the given layer to the top of this map. If you want to add a layer
 * elsewhere in the stack, use `getLayers()` and the methods available on
 * {@link ol.Collection}.
 * @param {ol.layer.Base} layer Layer.
 * @api
 */
PluggableMap.prototype.addLayer = function(layer) {
  const layers = this.getLayerGroup().getLayers();
  layers.push(layer);
};


/**
 * Add the given overlay to the map.
 * @param {ol.Overlay} overlay Overlay.
 * @api
 */
PluggableMap.prototype.addOverlay = function(overlay) {
  this.getOverlays().push(overlay);
};


/**
 * This deals with map's overlay collection changes.
 * @param {ol.Overlay} overlay Overlay.
 * @private
 */
PluggableMap.prototype.addOverlayInternal_ = function(overlay) {
  const id = overlay.getId();
  if (id !== undefined) {
    this.overlayIdIndex_[id.toString()] = overlay;
  }
  overlay.setMap(this);
};


/**
 *
 * @inheritDoc
 */
PluggableMap.prototype.disposeInternal = function() {
  this.mapBrowserEventHandler_.dispose();
  unlisten(this.viewport_, EventType.CONTEXTMENU,
    this.handleBrowserEvent, this);
  unlisten(this.viewport_, EventType.WHEEL,
    this.handleBrowserEvent, this);
  unlisten(this.viewport_, EventType.MOUSEWHEEL,
    this.handleBrowserEvent, this);
  if (this.handleResize_ !== undefined) {
    window.removeEventListener(EventType.RESIZE,
      this.handleResize_, false);
    this.handleResize_ = undefined;
  }
  if (this.animationDelayKey_) {
    cancelAnimationFrame(this.animationDelayKey_);
    this.animationDelayKey_ = undefined;
  }
  this.setTarget(null);
  BaseObject.prototype.disposeInternal.call(this);
};


/**
 * Detect features that intersect a pixel on the viewport, and execute a
 * callback with each intersecting feature. Layers included in the detection can
 * be configured through the `layerFilter` option in `opt_options`.
 * @param {ol.Pixel} pixel Pixel.
 * @param {function(this: S, (ol.Feature|ol.render.Feature),
 *     ol.layer.Layer): T} callback Feature callback. The callback will be
 *     called with two arguments. The first argument is one
 *     {@link ol.Feature feature} or
 *     {@link ol.render.Feature render feature} at the pixel, the second is
 *     the {@link ol.layer.Layer layer} of the feature and will be null for
 *     unmanaged layers. To stop detection, callback functions can return a
 *     truthy value.
 * @param {olx.AtPixelOptions=} opt_options Optional options.
 * @return {T|undefined} Callback result, i.e. the return value of last
 * callback execution, or the first truthy callback return value.
 * @template S,T
 * @api
 */
PluggableMap.prototype.forEachFeatureAtPixel = function(pixel, callback, opt_options) {
  if (!this.frameState_) {
    return;
  }
  const coordinate = this.getCoordinateFromPixel(pixel);
  opt_options = opt_options !== undefined ? opt_options : {};
  const hitTolerance = opt_options.hitTolerance !== undefined ?
    opt_options.hitTolerance * this.frameState_.pixelRatio : 0;
  const layerFilter = opt_options.layerFilter !== undefined ?
    opt_options.layerFilter : TRUE;
  return this.renderer_.forEachFeatureAtCoordinate(
    coordinate, this.frameState_, hitTolerance, callback, null,
    layerFilter, null);
};


/**
 * Get all features that intersect a pixel on the viewport.
 * @param {ol.Pixel} pixel Pixel.
 * @param {olx.AtPixelOptions=} opt_options Optional options.
 * @return {Array.<ol.Feature|ol.render.Feature>} The detected features or
 * `null` if none were found.
 * @api
 */
PluggableMap.prototype.getFeaturesAtPixel = function(pixel, opt_options) {
  let features = null;
  this.forEachFeatureAtPixel(pixel, function(feature) {
    if (!features) {
      features = [];
    }
    features.push(feature);
  }, opt_options);
  return features;
};

/**
 * Detect layers that have a color value at a pixel on the viewport, and
 * execute a callback with each matching layer. Layers included in the
 * detection can be configured through `opt_layerFilter`.
 * @param {ol.Pixel} pixel Pixel.
 * @param {function(this: S, ol.layer.Layer, (Uint8ClampedArray|Uint8Array)): T} callback
 *     Layer callback. This callback will receive two arguments: first is the
 *     {@link ol.layer.Layer layer}, second argument is an array representing
 *     [R, G, B, A] pixel values (0 - 255) and will be `null` for layer types
 *     that do not currently support this argument. To stop detection, callback
 *     functions can return a truthy value.
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
 * @api
 */
PluggableMap.prototype.forEachLayerAtPixel = function(pixel, callback, opt_this, opt_layerFilter, opt_this2) {
  if (!this.frameState_) {
    return;
  }
  const thisArg = opt_this !== undefined ? opt_this : null;
  const layerFilter = opt_layerFilter !== undefined ? opt_layerFilter : TRUE;
  const thisArg2 = opt_this2 !== undefined ? opt_this2 : null;
  return this.renderer_.forEachLayerAtPixel(
    pixel, this.frameState_, callback, thisArg,
    layerFilter, thisArg2);
};


/**
 * Detect if features intersect a pixel on the viewport. Layers included in the
 * detection can be configured through `opt_layerFilter`.
 * @param {ol.Pixel} pixel Pixel.
 * @param {olx.AtPixelOptions=} opt_options Optional options.
 * @return {boolean} Is there a feature at the given pixel?
 * @template U
 * @api
 */
PluggableMap.prototype.hasFeatureAtPixel = function(pixel, opt_options) {
  if (!this.frameState_) {
    return false;
  }
  const coordinate = this.getCoordinateFromPixel(pixel);
  opt_options = opt_options !== undefined ? opt_options : {};
  const layerFilter = opt_options.layerFilter !== undefined ? opt_options.layerFilter : TRUE;
  const hitTolerance = opt_options.hitTolerance !== undefined ?
    opt_options.hitTolerance * this.frameState_.pixelRatio : 0;
  return this.renderer_.hasFeatureAtCoordinate(
    coordinate, this.frameState_, hitTolerance, layerFilter, null);
};


/**
 * Returns the coordinate in view projection for a browser event.
 * @param {Event} event Event.
 * @return {ol.Coordinate} Coordinate.
 * @api
 */
PluggableMap.prototype.getEventCoordinate = function(event) {
  return this.getCoordinateFromPixel(this.getEventPixel(event));
};


/**
 * Returns the map pixel position for a browser event relative to the viewport.
 * @param {Event} event Event.
 * @return {ol.Pixel} Pixel.
 * @api
 */
PluggableMap.prototype.getEventPixel = function(event) {
  const viewportPosition = this.viewport_.getBoundingClientRect();
  const eventPosition = event.changedTouches ? event.changedTouches[0] : event;
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
 * @api
 */
PluggableMap.prototype.getTarget = function() {
  return (
    /** @type {Element|string|undefined} */ this.get(MapProperty.TARGET)
  );
};


/**
 * Get the DOM element into which this map is rendered. In contrast to
 * `getTarget` this method always return an `Element`, or `null` if the
 * map has no target.
 * @return {Element} The element that the map is rendered in.
 * @api
 */
PluggableMap.prototype.getTargetElement = function() {
  const target = this.getTarget();
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
 * @api
 */
PluggableMap.prototype.getCoordinateFromPixel = function(pixel) {
  const frameState = this.frameState_;
  if (!frameState) {
    return null;
  } else {
    return _ol_transform_.apply(frameState.pixelToCoordinateTransform, pixel.slice());
  }
};


/**
 * Get the map controls. Modifying this collection changes the controls
 * associated with the map.
 * @return {ol.Collection.<ol.control.Control>} Controls.
 * @api
 */
PluggableMap.prototype.getControls = function() {
  return this.controls;
};


/**
 * Get the map overlays. Modifying this collection changes the overlays
 * associated with the map.
 * @return {ol.Collection.<ol.Overlay>} Overlays.
 * @api
 */
PluggableMap.prototype.getOverlays = function() {
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
PluggableMap.prototype.getOverlayById = function(id) {
  const overlay = this.overlayIdIndex_[id.toString()];
  return overlay !== undefined ? overlay : null;
};


/**
 * Get the map interactions. Modifying this collection changes the interactions
 * associated with the map.
 *
 * Interactions are used for e.g. pan, zoom and rotate.
 * @return {ol.Collection.<ol.interaction.Interaction>} Interactions.
 * @api
 */
PluggableMap.prototype.getInteractions = function() {
  return this.interactions;
};


/**
 * Get the layergroup associated with this map.
 * @return {ol.layer.Group} A layer group containing the layers in this map.
 * @observable
 * @api
 */
PluggableMap.prototype.getLayerGroup = function() {
  return (
    /** @type {ol.layer.Group} */ this.get(MapProperty.LAYERGROUP)
  );
};


/**
 * Get the collection of layers associated with this map.
 * @return {!ol.Collection.<ol.layer.Base>} Layers.
 * @api
 */
PluggableMap.prototype.getLayers = function() {
  const layers = this.getLayerGroup().getLayers();
  return layers;
};


/**
 * Get the pixel for a coordinate.  This takes a coordinate in the map view
 * projection and returns the corresponding pixel.
 * @param {ol.Coordinate} coordinate A map coordinate.
 * @return {ol.Pixel} A pixel position in the map viewport.
 * @api
 */
PluggableMap.prototype.getPixelFromCoordinate = function(coordinate) {
  const frameState = this.frameState_;
  if (!frameState) {
    return null;
  } else {
    return _ol_transform_.apply(frameState.coordinateToPixelTransform,
      coordinate.slice(0, 2));
  }
};


/**
 * Get the map renderer.
 * @return {ol.renderer.Map} Renderer
 */
PluggableMap.prototype.getRenderer = function() {
  return this.renderer_;
};


/**
 * Get the size of this map.
 * @return {ol.Size|undefined} The size in pixels of the map in the DOM.
 * @observable
 * @api
 */
PluggableMap.prototype.getSize = function() {
  return (
    /** @type {ol.Size|undefined} */ this.get(MapProperty.SIZE)
  );
};


/**
 * Get the view associated with this map. A view manages properties such as
 * center and resolution.
 * @return {ol.View} The view that controls this map.
 * @observable
 * @api
 */
PluggableMap.prototype.getView = function() {
  return (
    /** @type {ol.View} */ this.get(MapProperty.VIEW)
  );
};


/**
 * Get the element that serves as the map viewport.
 * @return {Element} Viewport.
 * @api
 */
PluggableMap.prototype.getViewport = function() {
  return this.viewport_;
};


/**
 * Get the element that serves as the container for overlays.  Elements added to
 * this container will let mousedown and touchstart events through to the map,
 * so clicks and gestures on an overlay will trigger {@link ol.MapBrowserEvent}
 * events.
 * @return {!Element} The map's overlay container.
 */
PluggableMap.prototype.getOverlayContainer = function() {
  return this.overlayContainer_;
};


/**
 * Get the element that serves as a container for overlays that don't allow
 * event propagation. Elements added to this container won't let mousedown and
 * touchstart events through to the map, so clicks and gestures on an overlay
 * don't trigger any {@link ol.MapBrowserEvent}.
 * @return {!Element} The map's overlay container that stops events.
 */
PluggableMap.prototype.getOverlayContainerStopEvent = function() {
  return this.overlayContainerStopEvent_;
};


/**
 * @param {ol.Tile} tile Tile.
 * @param {string} tileSourceKey Tile source key.
 * @param {ol.Coordinate} tileCenter Tile center.
 * @param {number} tileResolution Tile resolution.
 * @return {number} Tile priority.
 */
PluggableMap.prototype.getTilePriority = function(tile, tileSourceKey, tileCenter, tileResolution) {
  // Filter out tiles at higher zoom levels than the current zoom level, or that
  // are outside the visible extent.
  const frameState = this.frameState_;
  if (!frameState || !(tileSourceKey in frameState.wantedTiles)) {
    return PriorityQueue.DROP;
  }
  if (!frameState.wantedTiles[tileSourceKey][tile.getKey()]) {
    return PriorityQueue.DROP;
  }
  // Prioritize the highest zoom level tiles closest to the focus.
  // Tiles at higher zoom levels are prioritized using Math.log(tileResolution).
  // Within a zoom level, tiles are prioritized by the distance in pixels
  // between the center of the tile and the focus.  The factor of 65536 means
  // that the prioritization should behave as desired for tiles up to
  // 65536 * Math.log(2) = 45426 pixels from the focus.
  const deltaX = tileCenter[0] - frameState.focus[0];
  const deltaY = tileCenter[1] - frameState.focus[1];
  return 65536 * Math.log(tileResolution) +
      Math.sqrt(deltaX * deltaX + deltaY * deltaY) / tileResolution;
};


/**
 * @param {Event} browserEvent Browser event.
 * @param {string=} opt_type Type.
 */
PluggableMap.prototype.handleBrowserEvent = function(browserEvent, opt_type) {
  const type = opt_type || browserEvent.type;
  const mapBrowserEvent = new MapBrowserEvent(type, this, browserEvent);
  this.handleMapBrowserEvent(mapBrowserEvent);
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent The event to handle.
 */
PluggableMap.prototype.handleMapBrowserEvent = function(mapBrowserEvent) {
  if (!this.frameState_) {
    // With no view defined, we cannot translate pixels into geographical
    // coordinates so interactions cannot be used.
    return;
  }
  this.focus_ = mapBrowserEvent.coordinate;
  mapBrowserEvent.frameState = this.frameState_;
  const interactionsArray = this.getInteractions().getArray();
  if (this.dispatchEvent(mapBrowserEvent) !== false) {
    for (let i = interactionsArray.length - 1; i >= 0; i--) {
      const interaction = interactionsArray[i];
      if (!interaction.getActive()) {
        continue;
      }
      const cont = interaction.handleEvent(mapBrowserEvent);
      if (!cont) {
        break;
      }
    }
  }
};


/**
 * @protected
 */
PluggableMap.prototype.handlePostRender = function() {

  const frameState = this.frameState_;

  // Manage the tile queue
  // Image loads are expensive and a limited resource, so try to use them
  // efficiently:
  // * When the view is static we allow a large number of parallel tile loads
  //   to complete the frame as quickly as possible.
  // * When animating or interacting, image loads can cause janks, so we reduce
  //   the maximum number of loads per frame and limit the number of parallel
  //   tile loads to remain reactive to view changes and to reduce the chance of
  //   loading tiles that will quickly disappear from view.
  const tileQueue = this.tileQueue_;
  if (!tileQueue.isEmpty()) {
    let maxTotalLoading = 16;
    let maxNewLoads = maxTotalLoading;
    if (frameState) {
      const hints = frameState.viewHints;
      if (hints[ViewHint.ANIMATING]) {
        maxTotalLoading = this.loadTilesWhileAnimating_ ? 8 : 0;
        maxNewLoads = 2;
      }
      if (hints[ViewHint.INTERACTING]) {
        maxTotalLoading = this.loadTilesWhileInteracting_ ? 8 : 0;
        maxNewLoads = 2;
      }
    }
    if (tileQueue.getTilesLoading() < maxTotalLoading) {
      tileQueue.reprioritize(); // FIXME only call if view has changed
      tileQueue.loadMoreTiles(maxTotalLoading, maxNewLoads);
    }
  }

  const postRenderFunctions = this.postRenderFunctions_;
  for (let i = 0, ii = postRenderFunctions.length; i < ii; ++i) {
    postRenderFunctions[i](this, frameState);
  }
  postRenderFunctions.length = 0;
};


/**
 * @private
 */
PluggableMap.prototype.handleSizeChanged_ = function() {
  this.render();
};


/**
 * @private
 */
PluggableMap.prototype.handleTargetChanged_ = function() {
  // target may be undefined, null, a string or an Element.
  // If it's a string we convert it to an Element before proceeding.
  // If it's not now an Element we remove the viewport from the DOM.
  // If it's an Element we append the viewport element to it.

  let targetElement;
  if (this.getTarget()) {
    targetElement = this.getTargetElement();
  }

  if (this.keyHandlerKeys_) {
    for (let i = 0, ii = this.keyHandlerKeys_.length; i < ii; ++i) {
      unlistenByKey(this.keyHandlerKeys_[i]);
    }
    this.keyHandlerKeys_ = null;
  }

  if (!targetElement) {
    this.renderer_.removeLayerRenderers();
    removeNode(this.viewport_);
    if (this.handleResize_ !== undefined) {
      window.removeEventListener(EventType.RESIZE,
        this.handleResize_, false);
      this.handleResize_ = undefined;
    }
  } else {
    targetElement.appendChild(this.viewport_);

    const keyboardEventTarget = !this.keyboardEventTarget_ ?
      targetElement : this.keyboardEventTarget_;
    this.keyHandlerKeys_ = [
      listen(keyboardEventTarget, EventType.KEYDOWN,
        this.handleBrowserEvent, this),
      listen(keyboardEventTarget, EventType.KEYPRESS,
        this.handleBrowserEvent, this)
    ];

    if (!this.handleResize_) {
      this.handleResize_ = this.updateSize.bind(this);
      window.addEventListener(EventType.RESIZE,
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
PluggableMap.prototype.handleTileChange_ = function() {
  this.render();
};


/**
 * @private
 */
PluggableMap.prototype.handleViewPropertyChanged_ = function() {
  this.render();
};


/**
 * @private
 */
PluggableMap.prototype.handleViewChanged_ = function() {
  if (this.viewPropertyListenerKey_) {
    unlistenByKey(this.viewPropertyListenerKey_);
    this.viewPropertyListenerKey_ = null;
  }
  if (this.viewChangeListenerKey_) {
    unlistenByKey(this.viewChangeListenerKey_);
    this.viewChangeListenerKey_ = null;
  }
  const view = this.getView();
  if (view) {
    this.viewport_.setAttribute('data-view', getUid(view));
    this.viewPropertyListenerKey_ = listen(
      view, ObjectEventType.PROPERTYCHANGE,
      this.handleViewPropertyChanged_, this);
    this.viewChangeListenerKey_ = listen(
      view, EventType.CHANGE,
      this.handleViewPropertyChanged_, this);
  }
  this.render();
};


/**
 * @private
 */
PluggableMap.prototype.handleLayerGroupChanged_ = function() {
  if (this.layerGroupPropertyListenerKeys_) {
    this.layerGroupPropertyListenerKeys_.forEach(unlistenByKey);
    this.layerGroupPropertyListenerKeys_ = null;
  }
  const layerGroup = this.getLayerGroup();
  if (layerGroup) {
    this.layerGroupPropertyListenerKeys_ = [
      listen(
        layerGroup, ObjectEventType.PROPERTYCHANGE,
        this.render, this),
      listen(
        layerGroup, EventType.CHANGE,
        this.render, this)
    ];
  }
  this.render();
};


/**
 * @return {boolean} Is rendered.
 */
PluggableMap.prototype.isRendered = function() {
  return !!this.frameState_;
};


/**
 * Requests an immediate render in a synchronous manner.
 * @api
 */
PluggableMap.prototype.renderSync = function() {
  if (this.animationDelayKey_) {
    cancelAnimationFrame(this.animationDelayKey_);
  }
  this.animationDelay_();
};


/**
 * Request a map rendering (at the next animation frame).
 * @api
 */
PluggableMap.prototype.render = function() {
  if (this.animationDelayKey_ === undefined) {
    this.animationDelayKey_ = requestAnimationFrame(
      this.animationDelay_);
  }
};


/**
 * Remove the given control from the map.
 * @param {ol.control.Control} control Control.
 * @return {ol.control.Control|undefined} The removed control (or undefined
 *     if the control was not found).
 * @api
 */
PluggableMap.prototype.removeControl = function(control) {
  return this.getControls().remove(control);
};


/**
 * Remove the given interaction from the map.
 * @param {ol.interaction.Interaction} interaction Interaction to remove.
 * @return {ol.interaction.Interaction|undefined} The removed interaction (or
 *     undefined if the interaction was not found).
 * @api
 */
PluggableMap.prototype.removeInteraction = function(interaction) {
  return this.getInteractions().remove(interaction);
};


/**
 * Removes the given layer from the map.
 * @param {ol.layer.Base} layer Layer.
 * @return {ol.layer.Base|undefined} The removed layer (or undefined if the
 *     layer was not found).
 * @api
 */
PluggableMap.prototype.removeLayer = function(layer) {
  const layers = this.getLayerGroup().getLayers();
  return layers.remove(layer);
};


/**
 * Remove the given overlay from the map.
 * @param {ol.Overlay} overlay Overlay.
 * @return {ol.Overlay|undefined} The removed overlay (or undefined
 *     if the overlay was not found).
 * @api
 */
PluggableMap.prototype.removeOverlay = function(overlay) {
  return this.getOverlays().remove(overlay);
};


/**
 * @param {number} time Time.
 * @private
 */
PluggableMap.prototype.renderFrame_ = function(time) {
  let viewState;

  const size = this.getSize();
  const view = this.getView();
  const extent = createEmpty();
  const previousFrameState = this.frameState_;
  /** @type {?olx.FrameState} */
  let frameState = null;
  if (size !== undefined && _ol_size_.hasArea(size) && view && view.isDef()) {
    const viewHints = view.getHints(this.frameState_ ? this.frameState_.viewHints : undefined);
    const layerStatesArray = this.getLayerGroup().getLayerStatesArray();
    const layerStates = {};
    for (let i = 0, ii = layerStatesArray.length; i < ii; ++i) {
      layerStates[getUid(layerStatesArray[i].layer)] = layerStatesArray[i];
    }
    viewState = view.getState();
    const center = viewState.center;
    const pixelResolution = viewState.resolution / this.pixelRatio_;
    center[0] = Math.round(center[0] / pixelResolution) * pixelResolution;
    center[1] = Math.round(center[1] / pixelResolution) * pixelResolution;
    frameState = /** @type {olx.FrameState} */ ({
      animate: false,
      coordinateToPixelTransform: this.coordinateToPixelTransform_,
      extent: extent,
      focus: !this.focus_ ? center : this.focus_,
      index: this.frameIndex_++,
      layerStates: layerStates,
      layerStatesArray: layerStatesArray,
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
    frameState.extent = getForViewAndSize(viewState.center,
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

    if (previousFrameState) {
      const moveStart = !this.previousExtent_ ||
                  (!isEmpty(this.previousExtent_) &&
                  !equals(frameState.extent, this.previousExtent_));
      if (moveStart) {
        this.dispatchEvent(
          new MapEvent(MapEventType.MOVESTART, this, previousFrameState));
        this.previousExtent_ = createOrUpdateEmpty(this.previousExtent_);
      }
    }

    const idle = this.previousExtent_ &&
        !frameState.viewHints[ViewHint.ANIMATING] &&
        !frameState.viewHints[ViewHint.INTERACTING] &&
        !equals(frameState.extent, this.previousExtent_);

    if (idle) {
      this.dispatchEvent(
        new MapEvent(MapEventType.MOVEEND, this, frameState));
      clone(frameState.extent, this.previousExtent_);
    }
  }

  this.dispatchEvent(
    new MapEvent(MapEventType.POSTRENDER, this, frameState));

  setTimeout(this.handlePostRender.bind(this), 0);

};


/**
 * Sets the layergroup of this map.
 * @param {ol.layer.Group} layerGroup A layer group containing the layers in
 *     this map.
 * @observable
 * @api
 */
PluggableMap.prototype.setLayerGroup = function(layerGroup) {
  this.set(MapProperty.LAYERGROUP, layerGroup);
};


/**
 * Set the size of this map.
 * @param {ol.Size|undefined} size The size in pixels of the map in the DOM.
 * @observable
 * @api
 */
PluggableMap.prototype.setSize = function(size) {
  this.set(MapProperty.SIZE, size);
};


/**
 * Set the target element to render this map into.
 * @param {Element|string|undefined} target The Element or id of the Element
 *     that the map is rendered in.
 * @observable
 * @api
 */
PluggableMap.prototype.setTarget = function(target) {
  this.set(MapProperty.TARGET, target);
};


/**
 * Set the view for this map.
 * @param {ol.View} view The view that controls this map.
 * @observable
 * @api
 */
PluggableMap.prototype.setView = function(view) {
  this.set(MapProperty.VIEW, view);
};


/**
 * @param {ol.Feature} feature Feature.
 */
PluggableMap.prototype.skipFeature = function(feature) {
  const featureUid = getUid(feature).toString();
  this.skippedFeatureUids_[featureUid] = true;
  this.render();
};


/**
 * Force a recalculation of the map viewport size.  This should be called when
 * third-party code changes the size of the map viewport.
 * @api
 */
PluggableMap.prototype.updateSize = function() {
  const targetElement = this.getTargetElement();

  if (!targetElement) {
    this.setSize(undefined);
  } else {
    const computedStyle = getComputedStyle(targetElement);
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
PluggableMap.prototype.unskipFeature = function(feature) {
  const featureUid = getUid(feature).toString();
  delete this.skippedFeatureUids_[featureUid];
  this.render();
};


/**
 * @type {Array.<ol.renderer.Type>}
 * @const
 */
const DEFAULT_RENDERER_TYPES = [
  RendererType.CANVAS,
  RendererType.WEBGL
];


/**
 * @param {MapOptions} options Map options.
 * @return {ol.MapOptionsInternal} Internal map options.
 */
function createOptionsInternal(options) {

  /**
   * @type {Element|Document}
   */
  let keyboardEventTarget = null;
  if (options.keyboardEventTarget !== undefined) {
    keyboardEventTarget = typeof options.keyboardEventTarget === 'string' ?
      document.getElementById(options.keyboardEventTarget) :
      options.keyboardEventTarget;
  }

  /**
   * @type {Object.<string, *>}
   */
  const values = {};

  const layerGroup = (options.layers instanceof LayerGroup) ?
    options.layers : new LayerGroup({layers: options.layers});
  values[MapProperty.LAYERGROUP] = layerGroup;

  values[MapProperty.TARGET] = options.target;

  values[MapProperty.VIEW] = options.view !== undefined ?
    options.view : new View();

  /**
   * @type {Array.<ol.renderer.Type>}
   */
  let rendererTypes;

  if (options.renderer !== undefined) {
    if (Array.isArray(options.renderer)) {
      rendererTypes = options.renderer;
    } else if (typeof options.renderer === 'string') {
      rendererTypes = [options.renderer];
    } else {
      assert(false, 46); // Incorrect format for `renderer` option
    }
    if (rendererTypes.indexOf(/** @type {ol.renderer.Type} */ ('dom')) >= 0) {
      rendererTypes = rendererTypes.concat(DEFAULT_RENDERER_TYPES);
    }
  } else {
    rendererTypes = DEFAULT_RENDERER_TYPES;
  }

  /**
   * @type {olx.MapRendererPlugin}
   */
  let mapRendererPlugin;

  const mapRendererPlugins = getMapRendererPlugins();
  outer: for (let i = 0, ii = rendererTypes.length; i < ii; ++i) {
    const rendererType = rendererTypes[i];
    for (let j = 0, jj = mapRendererPlugins.length; j < jj; ++j) {
      const candidate = mapRendererPlugins[j];
      if (candidate['handles'](rendererType)) {
        mapRendererPlugin = candidate;
        break outer;
      }
    }
  }

  if (!mapRendererPlugin) {
    throw new Error('Unable to create a map renderer for types: ' +  rendererTypes.join(', '));
  }

  let controls;
  if (options.controls !== undefined) {
    if (Array.isArray(options.controls)) {
      controls = new Collection(options.controls.slice());
    } else {
      assert(options.controls instanceof Collection,
        47); // Expected `controls` to be an array or an `ol.Collection`
      controls = options.controls;
    }
  }

  let interactions;
  if (options.interactions !== undefined) {
    if (Array.isArray(options.interactions)) {
      interactions = new Collection(options.interactions.slice());
    } else {
      assert(options.interactions instanceof Collection,
        48); // Expected `interactions` to be an array or an `ol.Collection`
      interactions = options.interactions;
    }
  }

  let overlays;
  if (options.overlays !== undefined) {
    if (Array.isArray(options.overlays)) {
      overlays = new Collection(options.overlays.slice());
    } else {
      assert(options.overlays instanceof Collection,
        49); // Expected `overlays` to be an array or an `ol.Collection`
      overlays = options.overlays;
    }
  } else {
    overlays = new Collection();
  }

  return {
    controls: controls,
    interactions: interactions,
    keyboardEventTarget: keyboardEventTarget,
    overlays: overlays,
    mapRendererPlugin: mapRendererPlugin,
    values: values
  };

}
export default PluggableMap;
