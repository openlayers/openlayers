/**
 * @module ol/interaction/Select
 */
import Collection from '../Collection.js';
import CollectionEventType from '../CollectionEventType.js';
import Feature from '../Feature.js';
import {extend} from '../array.js';
import Event from '../events/Event.js';
import {never, shiftKeyOnly, singleClick} from '../events/condition.js';
import {TRUE} from '../functions.js';
import VectorLayer from '../layer/Vector.js';
import {clear} from '../obj.js';
import {createEditingStyle} from '../style/Style.js';
import {getUid} from '../util.js';
import Interaction from './Interaction.js';

/**
 * @enum {string}
 */
const SelectEventType = {
  /**
   * Triggered when feature(s) has been (de)selected.
   * @event SelectEvent#select
   * @api
   */
  SELECT: 'select',
};

/**
 * A function that takes a {@link module:ol/Feature~Feature} and returns `true` if the feature may be
 * selected or `false` otherwise.
 * @typedef {function(import("../Feature.js").default, import("../layer/Layer.js").default<import("../source/Source").default>):boolean} FilterFunction
 */

/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [addCondition] A function
 * that takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled.
 * By default, this is {@link module:ol/events/condition.never}. Use this if you
 * want to use different events for add and remove instead of `toggle`.
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled. This is the event
 * for the selected features as a whole. By default, this is
 * {@link module:ol/events/condition.singleClick}. Clicking on a feature selects that
 * feature and removes any that were in the selection. Clicking outside any
 * feature removes all from the selection.
 * See `toggle`, `add`, `remove` options for adding/removing extra features to/
 * from the selection.
 * @property {Array<import("../layer/Layer.js").default>|function(import("../layer/Layer.js").default<import("../source/Source").default>): boolean} [layers]
 * A list of layers from which features should be selected. Alternatively, a
 * filter function can be provided. The function will be called for each layer
 * in the map and should return `true` for layers that you want to be
 * selectable. If the option is absent, all visible layers will be considered
 * selectable.
 * @property {import("../style/Style.js").StyleLike|null} [style]
 * Style for the selected features. By default the default edit style is used
 * (see {@link module:ol/style/Style~Style}). Set to `null` if this interaction should not apply
 * any style changes for selected features.
 * If set to a falsey value, the selected feature's style will not change.
 * @property {import("../events/condition.js").Condition} [removeCondition] A function
 * that takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled.
 * By default, this is {@link module:ol/events/condition.never}. Use this if you
 * want to use different events for add and remove instead of `toggle`.
 * @property {import("../events/condition.js").Condition} [toggleCondition] A function
 * that takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled. This is in addition
 * to the `condition` event. By default,
 * {@link module:ol/events/condition.shiftKeyOnly}, i.e. pressing `shift` as
 * well as the `condition` event, adds that feature to the current selection if
 * it is not currently selected, and removes it if it is. See `add` and `remove`
 * if you want to use different events instead of a toggle.
 * @property {boolean} [multi=false] A boolean that determines if the default
 * behaviour should select only single features or all (overlapping) features at
 * the clicked map position. The default of `false` means single select.
 * @property {Collection<Feature>} [features]
 * Collection where the interaction will place selected features. Optional. If
 * not set the interaction will create a collection. In any case the collection
 * used by the interaction is returned by
 * {@link module:ol/interaction/Select~Select#getFeatures}.
 * @property {FilterFunction} [filter] A function
 * that takes a {@link module:ol/Feature~Feature} and a
 * {@link module:ol/layer/Layer~Layer} and returns `true` if the feature may be
 * selected or `false` otherwise.
 * @property {number} [hitTolerance=0] Hit-detection tolerance. Pixels inside
 * the radius around the given position will be checked for features.
 */

/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/Select~Select} instances are instances of
 * this type.
 */
export class SelectEvent extends Event {
  /**
   * @param {SelectEventType} type The event type.
   * @param {Array<import("../Feature.js").default>} selected Selected features.
   * @param {Array<import("../Feature.js").default>} deselected Deselected features.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Associated
   *     {@link module:ol/MapBrowserEvent~MapBrowserEvent}.
   */
  constructor(type, selected, deselected, mapBrowserEvent) {
    super(type);

    /**
     * Selected features array.
     * @type {Array<import("../Feature.js").default>}
     * @api
     */
    this.selected = selected;

    /**
     * Deselected features array.
     * @type {Array<import("../Feature.js").default>}
     * @api
     */
    this.deselected = deselected;

    /**
     * Associated {@link module:ol/MapBrowserEvent~MapBrowserEvent}.
     * @type {import("../MapBrowserEvent.js").default}
     * @api
     */
    this.mapBrowserEvent = mapBrowserEvent;
  }
}

/**
 * Original feature styles to reset to when features are no longer selected.
 * @type {Object<number, import("../style/Style.js").default|Array<import("../style/Style.js").default>|import("../style/Style.js").StyleFunction>}
 */
const originalFeatureStyles = {};

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types|
 *     'change:active', import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<'select', SelectEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
 *     'change:active'|'select', Return>} SelectOnSignature
 */

/**
 * @classdesc
 * Interaction for selecting vector features. By default, selected features are
 * styled differently, so this interaction can be used for visual highlighting,
 * as well as selecting features for other actions, such as modification or
 * output. There are three ways of controlling which features are selected:
 * using the browser event as defined by the `condition` and optionally the
 * `toggle`, `add`/`remove`, and `multi` options; a `layers` filter; and a
 * further feature filter using the `filter` option. Cluster sources are not
 * supported by this interaction, which means that selection must be done using
 * map events directly.
 *
 * @fires SelectEvent
 * @api
 */
class Select extends Interaction {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    super();

    /***
     * @type {SelectOnSignature<import("../events").EventsKey>}
     */
    this.on;

    /***
     * @type {SelectOnSignature<import("../events").EventsKey>}
     */
    this.once;

    /***
     * @type {SelectOnSignature<void>}
     */
    this.un;

    options = options ? options : {};

    /**
     * @private
     */
    this.boundAddFeature_ = this.addFeature_.bind(this);

    /**
     * @private
     */
    this.boundRemoveFeature_ = this.removeFeature_.bind(this);

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.condition_ = options.condition ? options.condition : singleClick;

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.addCondition_ = options.addCondition ? options.addCondition : never;

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.removeCondition_ = options.removeCondition
      ? options.removeCondition
      : never;

    /**
     * @private
     * @type {import("../events/condition.js").Condition}
     */
    this.toggleCondition_ = options.toggleCondition
      ? options.toggleCondition
      : shiftKeyOnly;

    /**
     * @private
     * @type {boolean}
     */
    this.multi_ = options.multi ? options.multi : false;

    /**
     * @private
     * @type {FilterFunction}
     */
    this.filter_ = options.filter ? options.filter : TRUE;

    /**
     * @private
     * @type {number}
     */
    this.hitTolerance_ = options.hitTolerance ? options.hitTolerance : 0;

    /**
     * @private
     * @type {import("../style/Style.js").default|Array<import("../style/Style.js").default>|import("../style/Style.js").StyleFunction|null}
     */
    this.style_ =
      options.style !== undefined ? options.style : getDefaultStyleFunction();

    /**
     * @private
     * @type {Collection<Feature>}
     */
    this.features_ = options.features || new Collection();

    /** @type {function(import("../layer/Layer.js").default<import("../source/Source").default>): boolean} */
    let layerFilter;
    if (options.layers) {
      if (typeof options.layers === 'function') {
        layerFilter = options.layers;
      } else {
        const layers = options.layers;
        layerFilter = function (layer) {
          return layers.includes(layer);
        };
      }
    } else {
      layerFilter = TRUE;
    }

    /**
     * @private
     * @type {function(import("../layer/Layer.js").default<import("../source/Source").default>): boolean}
     */
    this.layerFilter_ = layerFilter;

    /**
     * An association between selected feature (key)
     * and layer (value)
     * @private
     * @type {Object<string, import("../layer/Layer.js").default>}
     */
    this.featureLayerAssociation_ = {};
  }

  /**
   * @param {import("../Feature.js").default} feature Feature.
   * @param {import("../layer/Layer.js").default} layer Layer.
   * @private
   */
  addFeatureLayerAssociation_(feature, layer) {
    this.featureLayerAssociation_[getUid(feature)] = layer;
  }

  /**
   * Get the selected features.
   * @return {Collection<Feature>} Features collection.
   * @api
   */
  getFeatures() {
    return this.features_;
  }

  /**
   * Returns the Hit-detection tolerance.
   * @return {number} Hit tolerance in pixels.
   * @api
   */
  getHitTolerance() {
    return this.hitTolerance_;
  }

  /**
   * Returns the associated {@link module:ol/layer/Vector~VectorLayer vector layer} of
   * a selected feature.
   * @param {import("../Feature.js").default} feature Feature
   * @return {import('../layer/Vector.js').default} Layer.
   * @api
   */
  getLayer(feature) {
    return /** @type {import('../layer/Vector.js').default} */ (
      this.featureLayerAssociation_[getUid(feature)]
    );
  }

  /**
   * Hit-detection tolerance. Pixels inside the radius around the given position
   * will be checked for features.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @api
   */
  setHitTolerance(hitTolerance) {
    this.hitTolerance_ = hitTolerance;
  }

  /**
   * Remove the interaction from its current map, if any,  and attach it to a new
   * map, if any. Pass `null` to just remove the interaction from the current map.
   * @param {import("../Map.js").default|null} map Map.
   * @api
   * @override
   */
  setMap(map) {
    const currentMap = this.getMap();
    if (currentMap && this.style_) {
      this.features_.forEach(this.restorePreviousStyle_.bind(this));
    }
    super.setMap(map);
    if (map) {
      this.features_.addEventListener(
        CollectionEventType.ADD,
        this.boundAddFeature_,
      );
      this.features_.addEventListener(
        CollectionEventType.REMOVE,
        this.boundRemoveFeature_,
      );

      if (this.style_) {
        this.features_.forEach(this.applySelectedStyle_.bind(this));
      }
    } else {
      this.features_.removeEventListener(
        CollectionEventType.ADD,
        this.boundAddFeature_,
      );
      this.features_.removeEventListener(
        CollectionEventType.REMOVE,
        this.boundRemoveFeature_,
      );
    }
  }

  /**
   * @param {import("../Collection.js").CollectionEvent<Feature>} evt Event.
   * @private
   */
  addFeature_(evt) {
    const feature = evt.element;
    if (this.style_) {
      this.applySelectedStyle_(feature);
    }
    if (!this.getLayer(feature)) {
      const layer = this.findLayerOfFeature_(feature);
      if (layer) {
        this.addFeatureLayerAssociation_(feature, layer);
      }
    }
  }

  /**
   * @param {import("../Collection.js").CollectionEvent<Feature>} evt Event.
   * @private
   */
  removeFeature_(evt) {
    if (this.style_) {
      this.restorePreviousStyle_(evt.element);
    }
  }

  /**
   * @param {Feature} feature Feature of which to get the layer
   * @return {VectorLayer} layer, if one was found.
   * @private
   */
  findLayerOfFeature_(feature) {
    const layer = /** @type {VectorLayer} */ (
      this.getMap()
        .getAllLayers()
        .find(function (layer) {
          if (
            layer instanceof VectorLayer &&
            layer.getSource() &&
            layer.getSource().hasFeature(feature)
          ) {
            return layer;
          }
        })
    );
    return layer;
  }

  /**
   * @return {import("../style/Style.js").StyleLike|null} Select style.
   */
  getStyle() {
    return this.style_;
  }

  /**
   * @param {Feature} feature Feature
   * @private
   */
  applySelectedStyle_(feature) {
    const key = getUid(feature);
    if (!(key in originalFeatureStyles)) {
      originalFeatureStyles[key] = feature.getStyle();
    }
    feature.setStyle(this.style_);
  }

  /**
   * @param {Feature} feature Feature
   * @private
   */
  restorePreviousStyle_(feature) {
    const interactions = this.getMap().getInteractions().getArray();
    for (let i = interactions.length - 1; i >= 0; --i) {
      const interaction = interactions[i];
      if (
        interaction !== this &&
        interaction instanceof Select &&
        interaction.getStyle() &&
        interaction.getFeatures().getArray().lastIndexOf(feature) !== -1
      ) {
        feature.setStyle(interaction.getStyle());
        return;
      }
    }

    const key = getUid(feature);
    feature.setStyle(originalFeatureStyles[key]);
    delete originalFeatureStyles[key];
  }

  /**
   * @param {Feature} feature Feature.
   * @private
   */
  removeFeatureLayerAssociation_(feature) {
    delete this.featureLayerAssociation_[getUid(feature)];
  }

  /**
   * @param {import("../Feature.js").FeatureLike} feature The feature to select
   * @param {import("../layer/Layer.js").default} layer Optional layer containing this feature
   * @param {Array<Feature>} [selected] optional array to which selected features will be added
   * @return {Feature|undefined} The feature, if it got selected.
   * @private
   */
  selectFeatureInternal_(feature, layer, selected) {
    if (!(feature instanceof Feature)) {
      return;
    }
    if (!this.filter_(feature, layer)) {
      return;
    }
    const features = this.getFeatures();
    if (!features.getArray().includes(feature)) {
      this.addFeatureLayerAssociation_(feature, layer);
      features.push(feature);
      selected?.push(feature);
    }
    return feature;
  }

  /**
   * Try to select a feature as if it was clicked and `addCondition` evaluated to True.
   * Unlike modifying `select.getFeatures()` directly, this respects the `filter` and `layers` options (except `multi`, which is ignored).
   * The {@link module:ol/interaction/Select~SelectEvent} fired by this won't have a mapBrowserEvent property
   * @param {Feature} feature The feature to select
   * @return {boolean} True if the feature was selected
   */
  selectFeature(feature) {
    const layer = this.findLayerOfFeature_(feature);
    if (!this.layerFilter_(layer)) {
      return false;
    }
    const selected = this.selectFeatureInternal_(feature, layer);
    if (selected) {
      this.dispatchEvent(
        new SelectEvent(SelectEventType.SELECT, [selected], [], undefined),
      );
    }
    return !!selected;
  }

  /**
   * Deselects a feature if it was previously selected. Also removes layer association.
   * @param {import("../Feature.js").FeatureLike} feature The feature to deselect
   * @param {Array<Feature>} [deselected] optional array to which deselected features will be added
   * @return {Feature|undefined} The feature, if it was previously selected.
   * @private
   */
  removeFeatureInternal_(feature, deselected) {
    const features = this.getFeatures();
    if (
      !(feature instanceof Feature) ||
      !features.getArray().includes(feature)
    ) {
      return;
    }
    features.remove(feature);
    this.removeFeatureLayerAssociation_(feature);
    deselected?.push(feature);
    return feature;
  }

  /**
   * Try to deselect a feature as if it was clicked.
   * Compared to `select.getFeatures().remove(feature)` this causes a SelectEvent.
   * The {@link module:ol/interaction/Select~SelectEvent} fired by this won't have a mapBrowserEvent property
   * @param {Feature} feature The feature to deselect
   * @return {boolean} True if the feature was deselected
   */
  deselectFeature(feature) {
    const deselected = this.removeFeatureInternal_(feature);
    if (deselected) {
      this.dispatchEvent(
        new SelectEvent(SelectEventType.SELECT, [], [deselected], undefined),
      );
    }
    return !!deselected;
  }

  /**
   * Try to toggle a feature as if it was clicked and `toggleCondition` was True.
   * Unlike modifying `select.getFeatures()` directly, this respects the `filter` and `layers` options (except `multi`, which is ignored).
   * The {@link module:ol/interaction/Select~SelectEvent} fired by this won't have a mapBrowserEvent property
   * @param {Feature} feature The feature to deselect
   */
  toggleFeature(feature) {
    if (!this.deselectFeature(feature)) {
      this.selectFeature(feature);
    }
  }
  /**
   * Deselect all features as if a user deselected them.
   * Compared to `select.getFeatures().clear()` this causes a SelectEvent.
   * The {@link module:ol/interaction/Select~SelectEvent} fired by this won't have a mapBrowserEvent property
   */
  clearSelection() {
    clear(this.featureLayerAssociation_);
    const features = this.getFeatures();
    const deselected = features.getArray().slice(); // shallow copy
    features.clear();
    if (deselected.length !== 0) {
      this.dispatchEvent(
        new SelectEvent(SelectEventType.SELECT, [], deselected, undefined),
      );
    }
  }

  /**
   * Handles the {@link module:ol/MapBrowserEvent~MapBrowserEvent map browser event} and may change the
   * selected state of features.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @override
   */
  handleEvent(mapBrowserEvent) {
    if (!this.condition_(mapBrowserEvent)) {
      return true;
    }
    const add = this.addCondition_(mapBrowserEvent);
    const remove = this.removeCondition_(mapBrowserEvent);
    const toggle = this.toggleCondition_(mapBrowserEvent);
    const set = !add && !remove && !toggle;
    const map = mapBrowserEvent.map;
    const features = this.getFeatures();

    /**
     * @type {Array<Feature>}
     */
    const deselected = [];

    /**
     * @type {Array<Feature>}
     */
    const selected = [];

    // TODO: technically the way i've restructured this logic means that
    //       instead of first emptying the features list of all extra features and then adding the selected ones back,
    //       the selected features get added and then the old ones get removed.
    //       a grow then shrink, instead of a shrink then grow. I can't imagine anyone relying on this, but alas, its worth a mention.
    if (set) {
      // Replace the currently selected feature(s) with the feature(s) at the
      // pixel, or clear the selected feature(s) if there is no feature at
      // the pixel.
      let foundAtCursor = false;
      map.forEachFeatureAtPixel(
        mapBrowserEvent.pixel,
        (feature, layer) => {
          foundAtCursor = true;
          if (!this.selectFeatureInternal_(feature, layer, selected)) {
            return; // keep going, this one wasn't selected
          }
          return !this.multi_; // stop if not multi
        },
        {
          layerFilter: this.layerFilter_,
          hitTolerance: this.hitTolerance_,
        },
      );

      for (let i = features.getLength() - 1; i >= 0; --i) {
        const feature = features.item(i);
        if (
          // remove all but selected, if there were any selected
          (selected.length > 0 && !selected.includes(feature)) ||
          // remove all, if click outside of layer
          !foundAtCursor
        ) {
          this.removeFeatureInternal_(feature, deselected);
        }
      }
    } else {
      // Modify the currently selected feature(s).
      map.forEachFeatureAtPixel(
        mapBrowserEvent.pixel,
        (feature, layer) => {
          let modifiedFeature;
          if (remove || toggle) {
            modifiedFeature = this.removeFeatureInternal_(feature, deselected);
          }
          if ((add || toggle) && !modifiedFeature) {
            modifiedFeature = this.selectFeatureInternal_(
              feature,
              layer,
              selected,
            );
          }
          if (!modifiedFeature) {
            return; // keep going, this one wasn't removed/selected
          }
          return !this.multi_; // stop if not multi
        },
        {
          layerFilter: this.layerFilter_,
          hitTolerance: this.hitTolerance_,
        },
      );
    }
    if (selected.length > 0 || deselected.length > 0) {
      this.dispatchEvent(
        new SelectEvent(
          SelectEventType.SELECT,
          selected,
          deselected,
          mapBrowserEvent,
        ),
      );
    }
    return true;
  }
}

/**
 * @return {import("../style/Style.js").StyleFunction} Styles.
 */
function getDefaultStyleFunction() {
  const styles = createEditingStyle();
  extend(styles['Polygon'], styles['LineString']);
  extend(styles['GeometryCollection'], styles['LineString']);

  return function (feature) {
    if (!feature.getGeometry()) {
      return null;
    }
    return styles[feature.getGeometry().getType()];
  };
}

export default Select;
