/**
 * @module ol/PluggableMap
 */
import BaseObject from './Object.js';
import Collection from './Collection.js';
import CollectionEventType from './CollectionEventType.js';
import EventType from './events/EventType.js';
import Layer from './layer/Layer.js';
import LayerGroup, {GroupEvent} from './layer/Group.js';
import MapBrowserEvent from './MapBrowserEvent.js';
import MapBrowserEventHandler from './MapBrowserEventHandler.js';
import MapBrowserEventType from './MapBrowserEventType.js';
import MapEvent from './MapEvent.js';
import MapEventType from './MapEventType.js';
import MapProperty from './MapProperty.js';
import ObjectEventType from './ObjectEventType.js';
import PointerEventType from './pointer/EventType.js';
import RenderEventType from './render/EventType.js';
import TileQueue, {getTilePriority} from './TileQueue.js';
import View from './View.js';
import ViewHint from './ViewHint.js';
import {DEVICE_PIXEL_RATIO, PASSIVE_EVENT_LISTENERS} from './has.js';
import {TRUE} from './functions.js';
import {
  apply as applyTransform,
  create as createTransform,
} from './transform.js';
import {assert} from './asserts.js';
import {
  clone,
  createOrUpdateEmpty,
  equals,
  getForViewAndSize,
  isEmpty,
} from './extent.js';
import {fromUserCoordinate, toUserCoordinate} from './proj.js';
import {getUid} from './util.js';
import {hasArea} from './size.js';
import {listen, unlistenByKey} from './events.js';
import {removeNode} from './dom.js';

/**
 * State of the current frame. Only `pixelRatio`, `time` and `viewState` should
 * be used in applications.
 * @typedef {Object} FrameState
 * @property {number} pixelRatio The pixel ratio of the frame.
 * @property {number} time The time when rendering of the frame was requested.
 * @property {import("./View.js").State} viewState The state of the current view.
 * @property {boolean} animate Animate.
 * @property {import("./transform.js").Transform} coordinateToPixelTransform CoordinateToPixelTransform.
 * @property {import("rbush").default} declutterTree DeclutterTree.
 * @property {null|import("./extent.js").Extent} extent Extent.
 * @property {import("./extent.js").Extent} [nextExtent] Next extent during an animation series.
 * @property {number} index Index.
 * @property {Array<import("./layer/Layer.js").State>} layerStatesArray LayerStatesArray.
 * @property {number} layerIndex LayerIndex.
 * @property {import("./transform.js").Transform} pixelToCoordinateTransform PixelToCoordinateTransform.
 * @property {Array<PostRenderFunction>} postRenderFunctions PostRenderFunctions.
 * @property {import("./size.js").Size} size Size.
 * @property {TileQueue} tileQueue TileQueue.
 * @property {!Object<string, Object<string, boolean>>} usedTiles UsedTiles.
 * @property {Array<number>} viewHints ViewHints.
 * @property {!Object<string, Object<string, boolean>>} wantedTiles WantedTiles.
 * @property {string} mapId The id of the map.
 * @property {Object<string, boolean>} renderTargets Identifiers of previously rendered elements.
 */

/**
 * @typedef {function(PluggableMap, ?FrameState): any} PostRenderFunction
 */

/**
 * @typedef {Object} AtPixelOptions
 * @property {undefined|function(import("./layer/Layer.js").default<import("./source/Source").default>): boolean} [layerFilter] Layer filter
 * function. The filter function will receive one argument, the
 * {@link module:ol/layer/Layer layer-candidate} and it should return a boolean value.
 * Only layers which are visible and for which this function returns `true`
 * will be tested for features. By default, all visible layers will be tested.
 * @property {number} [hitTolerance=0] Hit-detection tolerance in css pixels. Pixels
 * inside the radius around the given position will be checked for features.
 * @property {boolean} [checkWrapped=true] Check-Wrapped Will check for for wrapped geometries inside the range of
 *   +/- 1 world width. Works only if a projection is used that can be wrapped.
 */

/**
 * @typedef {Object} MapOptionsInternal
 * @property {Collection<import("./control/Control.js").default>} [controls] Controls.
 * @property {Collection<import("./interaction/Interaction.js").default>} [interactions] Interactions.
 * @property {HTMLElement|Document} keyboardEventTarget KeyboardEventTarget.
 * @property {Collection<import("./Overlay.js").default>} overlays Overlays.
 * @property {Object<string, *>} values Values.
 */

/**
 * @typedef {import("./ObjectEventType").Types|'change:layergroup'|'change:size'|'change:target'|'change:view'} MapObjectEventTypes
 */

/***
 * @template Return
 * @typedef {import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return> &
 *    import("./Observable").OnSignature<MapObjectEventTypes, import("./Object").ObjectEvent, Return> &
 *    import("./Observable").OnSignature<import("./MapBrowserEventType").Types, import("./MapBrowserEvent").default, Return> &
 *    import("./Observable").OnSignature<import("./MapEventType").Types, import("./MapEvent").default, Return> &
 *    import("./Observable").OnSignature<import("./render/EventType").MapRenderEventTypes, import("./render/Event").default, Return> &
 *    import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|MapObjectEventTypes|
 *      import("./MapBrowserEventType").Types|import("./MapEventType").Types|
 *      import("./render/EventType").MapRenderEventTypes, Return>} PluggableMapOnSignature
 */

/**
 * Object literal with config options for the map.
 * @typedef {Object} MapOptions
 * @property {Collection<import("./control/Control.js").default>|Array<import("./control/Control.js").default>} [controls]
 * Controls initially added to the map. If not specified,
 * {@link module:ol/control.defaults} is used.
 * @property {number} [pixelRatio=window.devicePixelRatio] The ratio between
 * physical pixels and device-independent pixels (dips) on the device.
 * @property {Collection<import("./interaction/Interaction.js").default>|Array<import("./interaction/Interaction.js").default>} [interactions]
 * Interactions that are initially added to the map. If not specified,
 * {@link module:ol/interaction.defaults} is used.
 * @property {HTMLElement|Document|string} [keyboardEventTarget] The element to
 * listen to keyboard events on. This determines when the `KeyboardPan` and
 * `KeyboardZoom` interactions trigger. For example, if this option is set to
 * `document` the keyboard interactions will always trigger. If this option is
 * not specified, the element the library listens to keyboard events on is the
 * map target (i.e. the user-provided div for the map). If this is not
 * `document`, the target element needs to be focused for key events to be
 * emitted, requiring that the target element has a `tabindex` attribute.
 * @property {Array<import("./layer/Base.js").default>|Collection<import("./layer/Base.js").default>|LayerGroup} [layers]
 * Layers. If this is not defined, a map with no layers will be rendered. Note
 * that layers are rendered in the order supplied, so if you want, for example,
 * a vector layer to appear on top of a tile layer, it must come after the tile
 * layer.
 * @property {number} [maxTilesLoading=16] Maximum number tiles to load
 * simultaneously.
 * @property {number} [moveTolerance=1] The minimum distance in pixels the
 * cursor must move to be detected as a map move event instead of a click.
 * Increasing this value can make it easier to click on the map.
 * @property {Collection<import("./Overlay.js").default>|Array<import("./Overlay.js").default>} [overlays]
 * Overlays initially added to the map. By default, no overlays are added.
 * @property {HTMLElement|string} [target] The container for the map, either the
 * element itself or the `id` of the element. If not specified at construction
 * time, {@link module:ol/Map~Map#setTarget} must be called for the map to be
 * rendered. If passed by element, the container can be in a secondary document.
 * @property {View|Promise<import("./View.js").ViewOptions>} [view] The map's view.  No layer sources will be
 * fetched unless this is specified at construction time or through
 * {@link module:ol/Map~Map#setView}.
 */

/**
 * @param {import("./layer/Base.js").default} layer Layer.
 */
function removeLayerMapProperty(layer) {
  if (layer instanceof Layer) {
    layer.setMapInternal(null);
    return;
  }
  if (layer instanceof LayerGroup) {
    layer.getLayers().forEach(removeLayerMapProperty);
  }
}

/**
 * @param {import("./layer/Base.js").default} layer Layer.
 * @param {PluggableMap} map Map.
 */
function setLayerMapProperty(layer, map) {
  if (layer instanceof Layer) {
    layer.setMapInternal(map);
    return;
  }
  if (layer instanceof LayerGroup) {
    const layers = layer.getLayers().getArray();
    for (let i = 0, ii = layers.length; i < ii; ++i) {
      setLayerMapProperty(layers[i], map);
    }
  }
}

/**
 * @fires import("./MapBrowserEvent.js").MapBrowserEvent
 * @fires import("./MapEvent.js").MapEvent
 * @fires import("./render/Event.js").default#precompose
 * @fires import("./render/Event.js").default#postcompose
 * @fires import("./render/Event.js").default#rendercomplete
 * @api
 */
class PluggableMap extends BaseObject {
  /**
   * @param {MapOptions} options Map options.
   */
  constructor(options) {
    super();

    /***
     * @type {PluggableMapOnSignature<import("./events").EventsKey>}
     */
    this.on;

    /***
     * @type {PluggableMapOnSignature<import("./events").EventsKey>}
     */
    this.once;

    /***
     * @type {PluggableMapOnSignature<void>}
     */
    this.un;

    const optionsInternal = createOptionsInternal(options);

    /**
     * @private
     * @type {boolean}
     */
    this.renderComplete_;

    /** @private */
    this.boundHandleBrowserEvent_ = this.handleBrowserEvent.bind(this);

    /**
     * @type {number}
     * @private
     */
    this.maxTilesLoading_ =
      options.maxTilesLoading !== undefined ? options.maxTilesLoading : 16;

    /**
     * @private
     * @type {number}
     */
    this.pixelRatio_ =
      options.pixelRatio !== undefined
        ? options.pixelRatio
        : DEVICE_PIXEL_RATIO;

    /**
     * @private
     * @type {*}
     */
    this.postRenderTimeoutHandle_;

    /**
     * @private
     * @type {number|undefined}
     */
    this.animationDelayKey_;

    /**
     * @private
     */
    this.animationDelay_ = /** @this {PluggableMap} */ function () {
      this.animationDelayKey_ = undefined;
      this.renderFrame_(Date.now());
    }.bind(this);

    /**
     * @private
     * @type {import("./transform.js").Transform}
     */
    this.coordinateToPixelTransform_ = createTransform();

    /**
     * @private
     * @type {import("./transform.js").Transform}
     */
    this.pixelToCoordinateTransform_ = createTransform();

    /**
     * @private
     * @type {number}
     */
    this.frameIndex_ = 0;

    /**
     * @private
     * @type {?FrameState}
     */
    this.frameState_ = null;

    /**
     * The extent at the previous 'moveend' event.
     * @private
     * @type {import("./extent.js").Extent}
     */
    this.previousExtent_ = null;

    /**
     * @private
     * @type {?import("./events.js").EventsKey}
     */
    this.viewPropertyListenerKey_ = null;

    /**
     * @private
     * @type {?import("./events.js").EventsKey}
     */
    this.viewChangeListenerKey_ = null;

    /**
     * @private
     * @type {?Array<import("./events.js").EventsKey>}
     */
    this.layerGroupPropertyListenerKeys_ = null;

    /**
     * @private
     * @type {!HTMLElement}
     */
    this.viewport_ = document.createElement('div');
    this.viewport_.className =
      'ol-viewport' + ('ontouchstart' in window ? ' ol-touch' : '');
    this.viewport_.style.position = 'relative';
    this.viewport_.style.overflow = 'hidden';
    this.viewport_.style.width = '100%';
    this.viewport_.style.height = '100%';

    /**
     * @private
     * @type {!HTMLElement}
     */
    this.overlayContainer_ = document.createElement('div');
    this.overlayContainer_.style.position = 'absolute';
    this.overlayContainer_.style.zIndex = '0';
    this.overlayContainer_.style.width = '100%';
    this.overlayContainer_.style.height = '100%';
    this.overlayContainer_.style.pointerEvents = 'none';
    this.overlayContainer_.className = 'ol-overlaycontainer';
    this.viewport_.appendChild(this.overlayContainer_);

    /**
     * @private
     * @type {!HTMLElement}
     */
    this.overlayContainerStopEvent_ = document.createElement('div');
    this.overlayContainerStopEvent_.style.position = 'absolute';
    this.overlayContainerStopEvent_.style.zIndex = '0';
    this.overlayContainerStopEvent_.style.width = '100%';
    this.overlayContainerStopEvent_.style.height = '100%';
    this.overlayContainerStopEvent_.style.pointerEvents = 'none';
    this.overlayContainerStopEvent_.className = 'ol-overlaycontainer-stopevent';
    this.viewport_.appendChild(this.overlayContainerStopEvent_);

    /**
     * @private
     * @type {MapBrowserEventHandler}
     */
    this.mapBrowserEventHandler_ = null;

    /**
     * @private
     * @type {number}
     */
    this.moveTolerance_ = options.moveTolerance;

    /**
     * @private
     * @type {HTMLElement|Document}
     */
    this.keyboardEventTarget_ = optionsInternal.keyboardEventTarget;

    /**
     * @private
     * @type {?Array<import("./events.js").EventsKey>}
     */
    this.targetChangeHandlerKeys_ = null;

    /**
     * @type {Collection<import("./control/Control.js").default>}
     * @protected
     */
    this.controls = optionsInternal.controls || new Collection();

    /**
     * @type {Collection<import("./interaction/Interaction.js").default>}
     * @protected
     */
    this.interactions = optionsInternal.interactions || new Collection();

    /**
     * @type {Collection<import("./Overlay.js").default>}
     * @private
     */
    this.overlays_ = optionsInternal.overlays;

    /**
     * A lookup of overlays by id.
     * @private
     * @type {Object<string, import("./Overlay.js").default>}
     */
    this.overlayIdIndex_ = {};

    /**
     * @type {import("./renderer/Map.js").default}
     * @private
     */
    this.renderer_ = null;

    /**
     * @private
     * @type {!Array<PostRenderFunction>}
     */
    this.postRenderFunctions_ = [];

    /**
     * @private
     * @type {TileQueue}
     */
    this.tileQueue_ = new TileQueue(
      this.getTilePriority.bind(this),
      this.handleTileChange_.bind(this)
    );

    this.addChangeListener(
      MapProperty.LAYERGROUP,
      this.handleLayerGroupChanged_
    );
    this.addChangeListener(MapProperty.VIEW, this.handleViewChanged_);
    this.addChangeListener(MapProperty.SIZE, this.handleSizeChanged_);
    this.addChangeListener(MapProperty.TARGET, this.handleTargetChanged_);

    // setProperties will trigger the rendering of the map if the map
    // is "defined" already.
    this.setProperties(optionsInternal.values);

    const map = this;
    if (options.view && !(options.view instanceof View)) {
      options.view.then(function (viewOptions) {
        map.setView(new View(viewOptions));
      });
    }

    this.controls.addEventListener(
      CollectionEventType.ADD,
      /**
       * @param {import("./Collection.js").CollectionEvent} event CollectionEvent.
       */
      function (event) {
        event.element.setMap(this);
      }.bind(this)
    );

    this.controls.addEventListener(
      CollectionEventType.REMOVE,
      /**
       * @param {import("./Collection.js").CollectionEvent} event CollectionEvent.
       */
      function (event) {
        event.element.setMap(null);
      }.bind(this)
    );

    this.interactions.addEventListener(
      CollectionEventType.ADD,
      /**
       * @param {import("./Collection.js").CollectionEvent} event CollectionEvent.
       */
      function (event) {
        event.element.setMap(this);
      }.bind(this)
    );

    this.interactions.addEventListener(
      CollectionEventType.REMOVE,
      /**
       * @param {import("./Collection.js").CollectionEvent} event CollectionEvent.
       */
      function (event) {
        event.element.setMap(null);
      }.bind(this)
    );

    this.overlays_.addEventListener(
      CollectionEventType.ADD,
      /**
       * @param {import("./Collection.js").CollectionEvent} event CollectionEvent.
       */
      function (event) {
        this.addOverlayInternal_(
          /** @type {import("./Overlay.js").default} */ (event.element)
        );
      }.bind(this)
    );

    this.overlays_.addEventListener(
      CollectionEventType.REMOVE,
      /**
       * @param {import("./Collection.js").CollectionEvent} event CollectionEvent.
       */
      function (event) {
        const overlay = /** @type {import("./Overlay.js").default} */ (
          event.element
        );
        const id = overlay.getId();
        if (id !== undefined) {
          delete this.overlayIdIndex_[id.toString()];
        }
        event.element.setMap(null);
      }.bind(this)
    );

    this.controls.forEach(
      /**
       * @param {import("./control/Control.js").default} control Control.
       * @this {PluggableMap}
       */
      function (control) {
        control.setMap(this);
      }.bind(this)
    );

    this.interactions.forEach(
      /**
       * @param {import("./interaction/Interaction.js").default} interaction Interaction.
       * @this {PluggableMap}
       */
      function (interaction) {
        interaction.setMap(this);
      }.bind(this)
    );

    this.overlays_.forEach(this.addOverlayInternal_.bind(this));
  }

  /**
   * @abstract
   * @return {import("./renderer/Map.js").default} The map renderer
   */
  createRenderer() {
    throw new Error('Use a map type that has a createRenderer method');
  }

  /**
   * Add the given control to the map.
   * @param {import("./control/Control.js").default} control Control.
   * @api
   */
  addControl(control) {
    this.getControls().push(control);
  }

  /**
   * Add the given interaction to the map. If you want to add an interaction
   * at another point of the collection use `getInteraction()` and the methods
   * available on {@link module:ol/Collection~Collection}. This can be used to
   * stop the event propagation from the handleEvent function. The interactions
   * get to handle the events in the reverse order of this collection.
   * @param {import("./interaction/Interaction.js").default} interaction Interaction to add.
   * @api
   */
  addInteraction(interaction) {
    this.getInteractions().push(interaction);
  }

  /**
   * Adds the given layer to the top of this map. If you want to add a layer
   * elsewhere in the stack, use `getLayers()` and the methods available on
   * {@link module:ol/Collection~Collection}.
   * @param {import("./layer/Base.js").default} layer Layer.
   * @api
   */
  addLayer(layer) {
    const layers = this.getLayerGroup().getLayers();
    layers.push(layer);
  }

  /**
   * @param {import("./layer/Group.js").GroupEvent} event The layer add event.
   * @private
   */
  handleLayerAdd_(event) {
    setLayerMapProperty(event.layer, this);
  }

  /**
   * Add the given overlay to the map.
   * @param {import("./Overlay.js").default} overlay Overlay.
   * @api
   */
  addOverlay(overlay) {
    this.getOverlays().push(overlay);
  }

  /**
   * This deals with map's overlay collection changes.
   * @param {import("./Overlay.js").default} overlay Overlay.
   * @private
   */
  addOverlayInternal_(overlay) {
    const id = overlay.getId();
    if (id !== undefined) {
      this.overlayIdIndex_[id.toString()] = overlay;
    }
    overlay.setMap(this);
  }

  /**
   *
   * Clean up.
   */
  disposeInternal() {
    this.setTarget(null);
    super.disposeInternal();
  }

  /**
   * Detect features that intersect a pixel on the viewport, and execute a
   * callback with each intersecting feature. Layers included in the detection can
   * be configured through the `layerFilter` option in `opt_options`.
   * @param {import("./pixel.js").Pixel} pixel Pixel.
   * @param {function(import("./Feature.js").FeatureLike, import("./layer/Layer.js").default<import("./source/Source").default>, import("./geom/SimpleGeometry.js").default): T} callback Feature callback. The callback will be
   *     called with two arguments. The first argument is one
   *     {@link module:ol/Feature feature} or
   *     {@link module:ol/render/Feature render feature} at the pixel, the second is
   *     the {@link module:ol/layer/Layer layer} of the feature and will be null for
   *     unmanaged layers. To stop detection, callback functions can return a
   *     truthy value.
   * @param {AtPixelOptions} [opt_options] Optional options.
   * @return {T|undefined} Callback result, i.e. the return value of last
   * callback execution, or the first truthy callback return value.
   * @template T
   * @api
   */
  forEachFeatureAtPixel(pixel, callback, opt_options) {
    if (!this.frameState_) {
      return;
    }
    const coordinate = this.getCoordinateFromPixelInternal(pixel);
    opt_options = opt_options !== undefined ? opt_options : {};
    const hitTolerance =
      opt_options.hitTolerance !== undefined ? opt_options.hitTolerance : 0;
    const layerFilter =
      opt_options.layerFilter !== undefined ? opt_options.layerFilter : TRUE;
    const checkWrapped = opt_options.checkWrapped !== false;
    return this.renderer_.forEachFeatureAtCoordinate(
      coordinate,
      this.frameState_,
      hitTolerance,
      checkWrapped,
      callback,
      null,
      layerFilter,
      null
    );
  }

  /**
   * Get all features that intersect a pixel on the viewport.
   * @param {import("./pixel.js").Pixel} pixel Pixel.
   * @param {AtPixelOptions} [opt_options] Optional options.
   * @return {Array<import("./Feature.js").FeatureLike>} The detected features or
   * an empty array if none were found.
   * @api
   */
  getFeaturesAtPixel(pixel, opt_options) {
    const features = [];
    this.forEachFeatureAtPixel(
      pixel,
      function (feature) {
        features.push(feature);
      },
      opt_options
    );
    return features;
  }

  /**
   * Get all layers from all layer groups.
   * @return {Array<import("./layer/Layer.js").default>} Layers.
   */
  getAllLayers() {
    const layers = [];
    function addLayersFrom(layerGroup) {
      layerGroup.forEach(function (layer) {
        if (layer instanceof LayerGroup) {
          addLayersFrom(layer.getLayers());
        } else {
          layers.push(layer);
        }
      });
    }
    addLayersFrom(this.getLayers());
    return layers;
  }

  /**
   * Detect layers that have a color value at a pixel on the viewport, and
   * execute a callback with each matching layer. Layers included in the
   * detection can be configured through `opt_layerFilter`.
   *
   * Note: In maps with more than one layer, this method will typically return pixel data
   * representing the composed image of all layers visible at the given pixel – because layers
   * will generally share the same rendering context.  To force layers to render separately, and
   * to get pixel data representing only one layer at a time, you can assign each layer a unique
   * `className` in its constructor.
   *
   * @param {import("./pixel.js").Pixel} pixel Pixel.
   * @param {function(this: S, import("./layer/Layer.js").default, (Uint8ClampedArray|Uint8Array)): T} callback
   *     Layer callback. This callback will receive two arguments: first is the
   *     {@link module:ol/layer/Layer layer}, second argument is an array representing
   *     [R, G, B, A] pixel values (0 - 255) and will be `null` for layer types
   *     that do not currently support this argument. To stop detection, callback
   *     functions can return a truthy value.
   * @param {AtPixelOptions} [opt_options] Configuration options.
   * @return {T|undefined} Callback result, i.e. the return value of last
   * callback execution, or the first truthy callback return value.
   * @template S,T
   * @api
   */
  forEachLayerAtPixel(pixel, callback, opt_options) {
    if (!this.frameState_) {
      return;
    }
    const options = opt_options || {};
    const hitTolerance =
      options.hitTolerance !== undefined ? options.hitTolerance : 0;
    const layerFilter = options.layerFilter || TRUE;
    return this.renderer_.forEachLayerAtPixel(
      pixel,
      this.frameState_,
      hitTolerance,
      callback,
      layerFilter
    );
  }

  /**
   * Detect if features intersect a pixel on the viewport. Layers included in the
   * detection can be configured through `opt_layerFilter`.
   * @param {import("./pixel.js").Pixel} pixel Pixel.
   * @param {AtPixelOptions} [opt_options] Optional options.
   * @return {boolean} Is there a feature at the given pixel?
   * @api
   */
  hasFeatureAtPixel(pixel, opt_options) {
    if (!this.frameState_) {
      return false;
    }
    const coordinate = this.getCoordinateFromPixelInternal(pixel);
    opt_options = opt_options !== undefined ? opt_options : {};
    const layerFilter =
      opt_options.layerFilter !== undefined ? opt_options.layerFilter : TRUE;
    const hitTolerance =
      opt_options.hitTolerance !== undefined ? opt_options.hitTolerance : 0;
    const checkWrapped = opt_options.checkWrapped !== false;
    return this.renderer_.hasFeatureAtCoordinate(
      coordinate,
      this.frameState_,
      hitTolerance,
      checkWrapped,
      layerFilter,
      null
    );
  }

  /**
   * Returns the coordinate in user projection for a browser event.
   * @param {MouseEvent} event Event.
   * @return {import("./coordinate.js").Coordinate} Coordinate.
   * @api
   */
  getEventCoordinate(event) {
    return this.getCoordinateFromPixel(this.getEventPixel(event));
  }

  /**
   * Returns the coordinate in view projection for a browser event.
   * @param {MouseEvent} event Event.
   * @return {import("./coordinate.js").Coordinate} Coordinate.
   */
  getEventCoordinateInternal(event) {
    return this.getCoordinateFromPixelInternal(this.getEventPixel(event));
  }

  /**
   * Returns the map pixel position for a browser event relative to the viewport.
   * @param {UIEvent} event Event.
   * @return {import("./pixel.js").Pixel} Pixel.
   * @api
   */
  getEventPixel(event) {
    const viewportPosition = this.viewport_.getBoundingClientRect();
    const eventPosition =
      //FIXME Are we really calling this with a TouchEvent anywhere?
      'changedTouches' in event
        ? /** @type {TouchEvent} */ (event).changedTouches[0]
        : /** @type {MouseEvent} */ (event);

    return [
      eventPosition.clientX - viewportPosition.left,
      eventPosition.clientY - viewportPosition.top,
    ];
  }

  /**
   * Get the target in which this map is rendered.
   * Note that this returns what is entered as an option or in setTarget:
   * if that was an element, it returns an element; if a string, it returns that.
   * @return {HTMLElement|string|undefined} The Element or id of the Element that the
   *     map is rendered in.
   * @observable
   * @api
   */
  getTarget() {
    return /** @type {HTMLElement|string|undefined} */ (
      this.get(MapProperty.TARGET)
    );
  }

  /**
   * Get the DOM element into which this map is rendered. In contrast to
   * `getTarget` this method always return an `Element`, or `null` if the
   * map has no target.
   * @return {HTMLElement} The element that the map is rendered in.
   * @api
   */
  getTargetElement() {
    const target = this.getTarget();
    if (target !== undefined) {
      return typeof target === 'string'
        ? document.getElementById(target)
        : target;
    } else {
      return null;
    }
  }

  /**
   * Get the coordinate for a given pixel.  This returns a coordinate in the
   * user projection.
   * @param {import("./pixel.js").Pixel} pixel Pixel position in the map viewport.
   * @return {import("./coordinate.js").Coordinate} The coordinate for the pixel position.
   * @api
   */
  getCoordinateFromPixel(pixel) {
    return toUserCoordinate(
      this.getCoordinateFromPixelInternal(pixel),
      this.getView().getProjection()
    );
  }

  /**
   * Get the coordinate for a given pixel.  This returns a coordinate in the
   * map view projection.
   * @param {import("./pixel.js").Pixel} pixel Pixel position in the map viewport.
   * @return {import("./coordinate.js").Coordinate} The coordinate for the pixel position.
   */
  getCoordinateFromPixelInternal(pixel) {
    const frameState = this.frameState_;
    if (!frameState) {
      return null;
    } else {
      return applyTransform(
        frameState.pixelToCoordinateTransform,
        pixel.slice()
      );
    }
  }

  /**
   * Get the map controls. Modifying this collection changes the controls
   * associated with the map.
   * @return {Collection<import("./control/Control.js").default>} Controls.
   * @api
   */
  getControls() {
    return this.controls;
  }

  /**
   * Get the map overlays. Modifying this collection changes the overlays
   * associated with the map.
   * @return {Collection<import("./Overlay.js").default>} Overlays.
   * @api
   */
  getOverlays() {
    return this.overlays_;
  }

  /**
   * Get an overlay by its identifier (the value returned by overlay.getId()).
   * Note that the index treats string and numeric identifiers as the same. So
   * `map.getOverlayById(2)` will return an overlay with id `'2'` or `2`.
   * @param {string|number} id Overlay identifier.
   * @return {import("./Overlay.js").default} Overlay.
   * @api
   */
  getOverlayById(id) {
    const overlay = this.overlayIdIndex_[id.toString()];
    return overlay !== undefined ? overlay : null;
  }

  /**
   * Get the map interactions. Modifying this collection changes the interactions
   * associated with the map.
   *
   * Interactions are used for e.g. pan, zoom and rotate.
   * @return {Collection<import("./interaction/Interaction.js").default>} Interactions.
   * @api
   */
  getInteractions() {
    return this.interactions;
  }

  /**
   * Get the layergroup associated with this map.
   * @return {LayerGroup} A layer group containing the layers in this map.
   * @observable
   * @api
   */
  getLayerGroup() {
    return /** @type {LayerGroup} */ (this.get(MapProperty.LAYERGROUP));
  }

  /**
   * Clear any existing layers and add layers to the map.
   * @param {Array<import("./layer/Base.js").default>|Collection<import("./layer/Base.js").default>} layers The layers to be added to the map.
   * @api
   */
  setLayers(layers) {
    const group = this.getLayerGroup();
    if (layers instanceof Collection) {
      group.setLayers(layers);
      return;
    }

    const collection = group.getLayers();
    collection.clear();
    collection.extend(layers);
  }

  /**
   * Get the collection of layers associated with this map.
   * @return {!Collection<import("./layer/Base.js").default>} Layers.
   * @api
   */
  getLayers() {
    const layers = this.getLayerGroup().getLayers();
    return layers;
  }

  /**
   * @return {boolean} Layers have sources that are still loading.
   */
  getLoading() {
    const layerStatesArray = this.getLayerGroup().getLayerStatesArray();
    for (let i = 0, ii = layerStatesArray.length; i < ii; ++i) {
      const layer = layerStatesArray[i].layer;
      const source = /** @type {import("./layer/Layer.js").default} */ (
        layer
      ).getSource();
      if (source && source.loading) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the pixel for a coordinate.  This takes a coordinate in the user
   * projection and returns the corresponding pixel.
   * @param {import("./coordinate.js").Coordinate} coordinate A map coordinate.
   * @return {import("./pixel.js").Pixel} A pixel position in the map viewport.
   * @api
   */
  getPixelFromCoordinate(coordinate) {
    const viewCoordinate = fromUserCoordinate(
      coordinate,
      this.getView().getProjection()
    );
    return this.getPixelFromCoordinateInternal(viewCoordinate);
  }

  /**
   * Get the pixel for a coordinate.  This takes a coordinate in the map view
   * projection and returns the corresponding pixel.
   * @param {import("./coordinate.js").Coordinate} coordinate A map coordinate.
   * @return {import("./pixel.js").Pixel} A pixel position in the map viewport.
   */
  getPixelFromCoordinateInternal(coordinate) {
    const frameState = this.frameState_;
    if (!frameState) {
      return null;
    } else {
      return applyTransform(
        frameState.coordinateToPixelTransform,
        coordinate.slice(0, 2)
      );
    }
  }

  /**
   * Get the map renderer.
   * @return {import("./renderer/Map.js").default} Renderer
   */
  getRenderer() {
    return this.renderer_;
  }

  /**
   * Get the size of this map.
   * @return {import("./size.js").Size|undefined} The size in pixels of the map in the DOM.
   * @observable
   * @api
   */
  getSize() {
    return /** @type {import("./size.js").Size|undefined} */ (
      this.get(MapProperty.SIZE)
    );
  }

  /**
   * Get the view associated with this map. A view manages properties such as
   * center and resolution.
   * @return {View} The view that controls this map.
   * @observable
   * @api
   */
  getView() {
    return /** @type {View} */ (this.get(MapProperty.VIEW));
  }

  /**
   * Get the element that serves as the map viewport.
   * @return {HTMLElement} Viewport.
   * @api
   */
  getViewport() {
    return this.viewport_;
  }

  /**
   * Get the element that serves as the container for overlays.  Elements added to
   * this container will let mousedown and touchstart events through to the map,
   * so clicks and gestures on an overlay will trigger {@link module:ol/MapBrowserEvent~MapBrowserEvent}
   * events.
   * @return {!HTMLElement} The map's overlay container.
   */
  getOverlayContainer() {
    return this.overlayContainer_;
  }

  /**
   * Get the element that serves as a container for overlays that don't allow
   * event propagation. Elements added to this container won't let mousedown and
   * touchstart events through to the map, so clicks and gestures on an overlay
   * don't trigger any {@link module:ol/MapBrowserEvent~MapBrowserEvent}.
   * @return {!HTMLElement} The map's overlay container that stops events.
   */
  getOverlayContainerStopEvent() {
    return this.overlayContainerStopEvent_;
  }

  /**
   * @return {!Document} The document where the map is displayed.
   */
  getOwnerDocument() {
    const targetElement = this.getTargetElement();
    return targetElement ? targetElement.ownerDocument : document;
  }

  /**
   * @param {import("./Tile.js").default} tile Tile.
   * @param {string} tileSourceKey Tile source key.
   * @param {import("./coordinate.js").Coordinate} tileCenter Tile center.
   * @param {number} tileResolution Tile resolution.
   * @return {number} Tile priority.
   */
  getTilePriority(tile, tileSourceKey, tileCenter, tileResolution) {
    return getTilePriority(
      this.frameState_,
      tile,
      tileSourceKey,
      tileCenter,
      tileResolution
    );
  }

  /**
   * @param {UIEvent} browserEvent Browser event.
   * @param {string} [opt_type] Type.
   */
  handleBrowserEvent(browserEvent, opt_type) {
    const type = opt_type || browserEvent.type;
    const mapBrowserEvent = new MapBrowserEvent(type, this, browserEvent);
    this.handleMapBrowserEvent(mapBrowserEvent);
  }

  /**
   * @param {MapBrowserEvent} mapBrowserEvent The event to handle.
   */
  handleMapBrowserEvent(mapBrowserEvent) {
    if (!this.frameState_) {
      // With no view defined, we cannot translate pixels into geographical
      // coordinates so interactions cannot be used.
      return;
    }
    const originalEvent = /** @type {PointerEvent} */ (
      mapBrowserEvent.originalEvent
    );
    const eventType = originalEvent.type;
    if (
      eventType === PointerEventType.POINTERDOWN ||
      eventType === EventType.WHEEL ||
      eventType === EventType.KEYDOWN
    ) {
      const doc = this.getOwnerDocument();
      const rootNode = this.viewport_.getRootNode
        ? this.viewport_.getRootNode()
        : doc;
      const target = /** @type {Node} */ (originalEvent.target);
      if (
        // Abort if the target is a child of the container for elements whose events are not meant
        // to be handled by map interactions.
        this.overlayContainerStopEvent_.contains(target) ||
        // Abort if the event target is a child of the container that is no longer in the page.
        // It's possible for the target to no longer be in the page if it has been removed in an
        // event listener, this might happen in a Control that recreates it's content based on
        // user interaction either manually or via a render in something like https://reactjs.org/
        !(rootNode === doc ? doc.documentElement : rootNode).contains(target)
      ) {
        return;
      }
    }
    mapBrowserEvent.frameState = this.frameState_;
    if (this.dispatchEvent(mapBrowserEvent) !== false) {
      const interactionsArray = this.getInteractions().getArray().slice();
      for (let i = interactionsArray.length - 1; i >= 0; i--) {
        const interaction = interactionsArray[i];
        if (
          interaction.getMap() !== this ||
          !interaction.getActive() ||
          !this.getTargetElement()
        ) {
          continue;
        }
        const cont = interaction.handleEvent(mapBrowserEvent);
        if (!cont || mapBrowserEvent.propagationStopped) {
          break;
        }
      }
    }
  }

  /**
   * @protected
   */
  handlePostRender() {
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
      let maxTotalLoading = this.maxTilesLoading_;
      let maxNewLoads = maxTotalLoading;
      if (frameState) {
        const hints = frameState.viewHints;
        if (hints[ViewHint.ANIMATING] || hints[ViewHint.INTERACTING]) {
          const lowOnFrameBudget = Date.now() - frameState.time > 8;
          maxTotalLoading = lowOnFrameBudget ? 0 : 8;
          maxNewLoads = lowOnFrameBudget ? 0 : 2;
        }
      }
      if (tileQueue.getTilesLoading() < maxTotalLoading) {
        tileQueue.reprioritize(); // FIXME only call if view has changed
        tileQueue.loadMoreTiles(maxTotalLoading, maxNewLoads);
      }
    }

    if (
      frameState &&
      this.hasListener(RenderEventType.RENDERCOMPLETE) &&
      !frameState.animate &&
      this.renderComplete_
    ) {
      this.renderer_.dispatchRenderEvent(
        RenderEventType.RENDERCOMPLETE,
        frameState
      );
    }

    const postRenderFunctions = this.postRenderFunctions_;
    for (let i = 0, ii = postRenderFunctions.length; i < ii; ++i) {
      postRenderFunctions[i](this, frameState);
    }
    postRenderFunctions.length = 0;
  }

  /**
   * @private
   */
  handleSizeChanged_() {
    if (this.getView() && !this.getView().getAnimating()) {
      this.getView().resolveConstraints(0);
    }

    this.render();
  }

  /**
   * @private
   */
  handleTargetChanged_() {
    if (this.mapBrowserEventHandler_) {
      for (let i = 0, ii = this.targetChangeHandlerKeys_.length; i < ii; ++i) {
        unlistenByKey(this.targetChangeHandlerKeys_[i]);
      }
      this.targetChangeHandlerKeys_ = null;
      this.viewport_.removeEventListener(
        EventType.CONTEXTMENU,
        this.boundHandleBrowserEvent_
      );
      this.viewport_.removeEventListener(
        EventType.WHEEL,
        this.boundHandleBrowserEvent_
      );
      this.mapBrowserEventHandler_.dispose();
      this.mapBrowserEventHandler_ = null;
      removeNode(this.viewport_);
    }

    // target may be undefined, null, a string or an Element.
    // If it's a string we convert it to an Element before proceeding.
    // If it's not now an Element we remove the viewport from the DOM.
    // If it's an Element we append the viewport element to it.

    const targetElement = this.getTargetElement();
    if (!targetElement) {
      if (this.renderer_) {
        clearTimeout(this.postRenderTimeoutHandle_);
        this.postRenderTimeoutHandle_ = undefined;
        this.postRenderFunctions_.length = 0;
        this.renderer_.dispose();
        this.renderer_ = null;
      }
      if (this.animationDelayKey_) {
        cancelAnimationFrame(this.animationDelayKey_);
        this.animationDelayKey_ = undefined;
      }
    } else {
      targetElement.appendChild(this.viewport_);
      if (!this.renderer_) {
        this.renderer_ = this.createRenderer();
      }

      this.mapBrowserEventHandler_ = new MapBrowserEventHandler(
        this,
        this.moveTolerance_
      );
      for (const key in MapBrowserEventType) {
        this.mapBrowserEventHandler_.addEventListener(
          MapBrowserEventType[key],
          this.handleMapBrowserEvent.bind(this)
        );
      }
      this.viewport_.addEventListener(
        EventType.CONTEXTMENU,
        this.boundHandleBrowserEvent_,
        false
      );
      this.viewport_.addEventListener(
        EventType.WHEEL,
        this.boundHandleBrowserEvent_,
        PASSIVE_EVENT_LISTENERS ? {passive: false} : false
      );

      const defaultView = this.getOwnerDocument().defaultView;
      const keyboardEventTarget = !this.keyboardEventTarget_
        ? targetElement
        : this.keyboardEventTarget_;
      this.targetChangeHandlerKeys_ = [
        listen(
          keyboardEventTarget,
          EventType.KEYDOWN,
          this.handleBrowserEvent,
          this
        ),
        listen(
          keyboardEventTarget,
          EventType.KEYPRESS,
          this.handleBrowserEvent,
          this
        ),
        listen(defaultView, EventType.RESIZE, this.updateSize, this),
      ];
    }

    this.updateSize();
    // updateSize calls setSize, so no need to call this.render
    // ourselves here.
  }

  /**
   * @private
   */
  handleTileChange_() {
    this.render();
  }

  /**
   * @private
   */
  handleViewPropertyChanged_() {
    this.render();
  }

  /**
   * @private
   */
  handleViewChanged_() {
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
      this.updateViewportSize_();

      this.viewPropertyListenerKey_ = listen(
        view,
        ObjectEventType.PROPERTYCHANGE,
        this.handleViewPropertyChanged_,
        this
      );
      this.viewChangeListenerKey_ = listen(
        view,
        EventType.CHANGE,
        this.handleViewPropertyChanged_,
        this
      );

      view.resolveConstraints(0);
    }
    this.render();
  }

  /**
   * @private
   */
  handleLayerGroupChanged_() {
    if (this.layerGroupPropertyListenerKeys_) {
      this.layerGroupPropertyListenerKeys_.forEach(unlistenByKey);
      this.layerGroupPropertyListenerKeys_ = null;
    }
    const layerGroup = this.getLayerGroup();
    if (layerGroup) {
      this.handleLayerAdd_(new GroupEvent('addlayer', layerGroup));
      this.layerGroupPropertyListenerKeys_ = [
        listen(layerGroup, ObjectEventType.PROPERTYCHANGE, this.render, this),
        listen(layerGroup, EventType.CHANGE, this.render, this),
        listen(layerGroup, 'addlayer', this.handleLayerAdd_, this),
        listen(layerGroup, 'removelayer', this.handleLayerRemove_, this),
      ];
    }
    this.render();
  }

  /**
   * @return {boolean} Is rendered.
   */
  isRendered() {
    return !!this.frameState_;
  }

  /**
   * Requests an immediate render in a synchronous manner.
   * @api
   */
  renderSync() {
    if (this.animationDelayKey_) {
      cancelAnimationFrame(this.animationDelayKey_);
    }
    this.animationDelay_();
  }

  /**
   * Redraws all text after new fonts have loaded
   */
  redrawText() {
    const layerStates = this.getLayerGroup().getLayerStatesArray();
    for (let i = 0, ii = layerStates.length; i < ii; ++i) {
      const layer = layerStates[i].layer;
      if (layer.hasRenderer()) {
        layer.getRenderer().handleFontsChanged();
      }
    }
  }

  /**
   * Request a map rendering (at the next animation frame).
   * @api
   */
  render() {
    if (this.renderer_ && this.animationDelayKey_ === undefined) {
      this.animationDelayKey_ = requestAnimationFrame(this.animationDelay_);
    }
  }

  /**
   * Remove the given control from the map.
   * @param {import("./control/Control.js").default} control Control.
   * @return {import("./control/Control.js").default|undefined} The removed control (or undefined
   *     if the control was not found).
   * @api
   */
  removeControl(control) {
    return this.getControls().remove(control);
  }

  /**
   * Remove the given interaction from the map.
   * @param {import("./interaction/Interaction.js").default} interaction Interaction to remove.
   * @return {import("./interaction/Interaction.js").default|undefined} The removed interaction (or
   *     undefined if the interaction was not found).
   * @api
   */
  removeInteraction(interaction) {
    return this.getInteractions().remove(interaction);
  }

  /**
   * Removes the given layer from the map.
   * @param {import("./layer/Base.js").default} layer Layer.
   * @return {import("./layer/Base.js").default|undefined} The removed layer (or undefined if the
   *     layer was not found).
   * @api
   */
  removeLayer(layer) {
    const layers = this.getLayerGroup().getLayers();
    return layers.remove(layer);
  }

  /**
   * @param {import("./layer/Group.js").GroupEvent} event The layer remove event.
   * @private
   */
  handleLayerRemove_(event) {
    removeLayerMapProperty(event.layer);
  }

  /**
   * Remove the given overlay from the map.
   * @param {import("./Overlay.js").default} overlay Overlay.
   * @return {import("./Overlay.js").default|undefined} The removed overlay (or undefined
   *     if the overlay was not found).
   * @api
   */
  removeOverlay(overlay) {
    return this.getOverlays().remove(overlay);
  }

  /**
   * @param {number} time Time.
   * @private
   */
  renderFrame_(time) {
    const size = this.getSize();
    const view = this.getView();
    const previousFrameState = this.frameState_;
    /** @type {?FrameState} */
    let frameState = null;
    if (size !== undefined && hasArea(size) && view && view.isDef()) {
      const viewHints = view.getHints(
        this.frameState_ ? this.frameState_.viewHints : undefined
      );
      const viewState = view.getState();
      frameState = {
        animate: false,
        coordinateToPixelTransform: this.coordinateToPixelTransform_,
        declutterTree: null,
        extent: getForViewAndSize(
          viewState.center,
          viewState.resolution,
          viewState.rotation,
          size
        ),
        index: this.frameIndex_++,
        layerIndex: 0,
        layerStatesArray: this.getLayerGroup().getLayerStatesArray(),
        pixelRatio: this.pixelRatio_,
        pixelToCoordinateTransform: this.pixelToCoordinateTransform_,
        postRenderFunctions: [],
        size: size,
        tileQueue: this.tileQueue_,
        time: time,
        usedTiles: {},
        viewState: viewState,
        viewHints: viewHints,
        wantedTiles: {},
        mapId: getUid(this),
        renderTargets: {},
      };
      if (viewState.nextCenter && viewState.nextResolution) {
        const rotation = isNaN(viewState.nextRotation)
          ? viewState.rotation
          : viewState.nextRotation;

        frameState.nextExtent = getForViewAndSize(
          viewState.nextCenter,
          viewState.nextResolution,
          rotation,
          size
        );
      }
    }

    this.frameState_ = frameState;
    this.renderer_.renderFrame(frameState);

    if (frameState) {
      if (frameState.animate) {
        this.render();
      }
      Array.prototype.push.apply(
        this.postRenderFunctions_,
        frameState.postRenderFunctions
      );

      if (previousFrameState) {
        const moveStart =
          !this.previousExtent_ ||
          (!isEmpty(this.previousExtent_) &&
            !equals(frameState.extent, this.previousExtent_));
        if (moveStart) {
          this.dispatchEvent(
            new MapEvent(MapEventType.MOVESTART, this, previousFrameState)
          );
          this.previousExtent_ = createOrUpdateEmpty(this.previousExtent_);
        }
      }

      const idle =
        this.previousExtent_ &&
        !frameState.viewHints[ViewHint.ANIMATING] &&
        !frameState.viewHints[ViewHint.INTERACTING] &&
        !equals(frameState.extent, this.previousExtent_);

      if (idle) {
        this.dispatchEvent(
          new MapEvent(MapEventType.MOVEEND, this, frameState)
        );
        clone(frameState.extent, this.previousExtent_);
      }
    }

    this.dispatchEvent(new MapEvent(MapEventType.POSTRENDER, this, frameState));

    this.renderComplete_ =
      !this.tileQueue_.getTilesLoading() &&
      !this.tileQueue_.getCount() &&
      !this.getLoading();

    if (!this.postRenderTimeoutHandle_) {
      this.postRenderTimeoutHandle_ = setTimeout(() => {
        this.postRenderTimeoutHandle_ = undefined;
        this.handlePostRender();
      }, 0);
    }
  }

  /**
   * Sets the layergroup of this map.
   * @param {LayerGroup} layerGroup A layer group containing the layers in this map.
   * @observable
   * @api
   */
  setLayerGroup(layerGroup) {
    const oldLayerGroup = this.getLayerGroup();
    if (oldLayerGroup) {
      this.handleLayerRemove_(new GroupEvent('removelayer', oldLayerGroup));
    }
    this.set(MapProperty.LAYERGROUP, layerGroup);
  }

  /**
   * Set the size of this map.
   * @param {import("./size.js").Size|undefined} size The size in pixels of the map in the DOM.
   * @observable
   * @api
   */
  setSize(size) {
    this.set(MapProperty.SIZE, size);
  }

  /**
   * Set the target element to render this map into.
   * @param {HTMLElement|string} [target] The Element or id of the Element
   *     that the map is rendered in.
   * @observable
   * @api
   */
  setTarget(target) {
    this.set(MapProperty.TARGET, target);
  }

  /**
   * Set the view for this map.
   * @param {View|Promise<import("./View.js").ViewOptions>} view The view that controls this map.
   * It is also possible to pass a promise that resolves to options for constructing a view.  This
   * alternative allows view properties to be resolved by sources or other components that load
   * view-related metadata.
   * @observable
   * @api
   */
  setView(view) {
    if (!view || view instanceof View) {
      this.set(MapProperty.VIEW, view);
      return;
    }
    this.set(MapProperty.VIEW, new View());

    const map = this;
    view.then(function (viewOptions) {
      map.setView(new View(viewOptions));
    });
  }

  /**
   * Force a recalculation of the map viewport size.  This should be called when
   * third-party code changes the size of the map viewport.
   * @api
   */
  updateSize() {
    const targetElement = this.getTargetElement();

    let size = undefined;
    if (targetElement) {
      const computedStyle = getComputedStyle(targetElement);
      const width =
        targetElement.offsetWidth -
        parseFloat(computedStyle['borderLeftWidth']) -
        parseFloat(computedStyle['paddingLeft']) -
        parseFloat(computedStyle['paddingRight']) -
        parseFloat(computedStyle['borderRightWidth']);
      const height =
        targetElement.offsetHeight -
        parseFloat(computedStyle['borderTopWidth']) -
        parseFloat(computedStyle['paddingTop']) -
        parseFloat(computedStyle['paddingBottom']) -
        parseFloat(computedStyle['borderBottomWidth']);
      if (!isNaN(width) && !isNaN(height)) {
        size = [width, height];
        if (
          !hasArea(size) &&
          !!(
            targetElement.offsetWidth ||
            targetElement.offsetHeight ||
            targetElement.getClientRects().length
          )
        ) {
          // eslint-disable-next-line
          console.warn(
            "No map visible because the map container's width or height are 0."
          );
        }
      }
    }

    this.setSize(size);
    this.updateViewportSize_();
  }

  /**
   * Recomputes the viewport size and save it on the view object (if any)
   * @private
   */
  updateViewportSize_() {
    const view = this.getView();
    if (view) {
      let size = undefined;
      const computedStyle = getComputedStyle(this.viewport_);
      if (computedStyle.width && computedStyle.height) {
        size = [
          parseInt(computedStyle.width, 10),
          parseInt(computedStyle.height, 10),
        ];
      }
      view.setViewportSize(size);
    }
  }
}

/**
 * @param {MapOptions} options Map options.
 * @return {MapOptionsInternal} Internal map options.
 */
function createOptionsInternal(options) {
  /**
   * @type {HTMLElement|Document}
   */
  let keyboardEventTarget = null;
  if (options.keyboardEventTarget !== undefined) {
    keyboardEventTarget =
      typeof options.keyboardEventTarget === 'string'
        ? document.getElementById(options.keyboardEventTarget)
        : options.keyboardEventTarget;
  }

  /**
   * @type {Object<string, *>}
   */
  const values = {};

  const layerGroup =
    options.layers &&
    typeof (/** @type {?} */ (options.layers).getLayers) === 'function'
      ? /** @type {LayerGroup} */ (options.layers)
      : new LayerGroup({layers: /** @type {Collection} */ (options.layers)});
  values[MapProperty.LAYERGROUP] = layerGroup;

  values[MapProperty.TARGET] = options.target;

  values[MapProperty.VIEW] =
    options.view instanceof View ? options.view : new View();

  let controls;
  if (options.controls !== undefined) {
    if (Array.isArray(options.controls)) {
      controls = new Collection(options.controls.slice());
    } else {
      assert(
        typeof (/** @type {?} */ (options.controls).getArray) === 'function',
        47
      ); // Expected `controls` to be an array or an `import("./Collection.js").Collection`
      controls = /** @type {Collection} */ (options.controls);
    }
  }

  let interactions;
  if (options.interactions !== undefined) {
    if (Array.isArray(options.interactions)) {
      interactions = new Collection(options.interactions.slice());
    } else {
      assert(
        typeof (/** @type {?} */ (options.interactions).getArray) ===
          'function',
        48
      ); // Expected `interactions` to be an array or an `import("./Collection.js").Collection`
      interactions = /** @type {Collection} */ (options.interactions);
    }
  }

  let overlays;
  if (options.overlays !== undefined) {
    if (Array.isArray(options.overlays)) {
      overlays = new Collection(options.overlays.slice());
    } else {
      assert(
        typeof (/** @type {?} */ (options.overlays).getArray) === 'function',
        49
      ); // Expected `overlays` to be an array or an `import("./Collection.js").Collection`
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
    values: values,
  };
}
export default PluggableMap;
