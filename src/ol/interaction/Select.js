/**
 * @module ol/interaction/Select
 */
import Collection from '../Collection.js';
import CollectionEventType from '../CollectionEventType.js';
import Event from '../events/Event.js';
import GeometryType from '../geom/GeometryType.js';
import Interaction from './Interaction.js';
import {TRUE} from '../functions.js';
import {clear} from '../obj.js';
import {createEditingStyle} from '../style/Style.js';
import {extend, includes} from '../array.js';
import {getUid} from '../util.js';
import {never, shiftKeyOnly, singleClick} from '../events/condition.js';

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
 * A function that takes an {@link module:ol/Feature} or
 * {@link module:ol/render/Feature} and an
 * {@link module:ol/layer/Layer} and returns `true` if the feature may be
 * selected or `false` otherwise.
 * @typedef {function(import("../Feature.js").FeatureLike, import("../layer/Layer.js").default):boolean} FilterFunction
 */

/**
 * @typedef {Object} Options
 * @property {import("../events/condition.js").Condition} [addCondition] A function
 * that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled.
 * By default, this is {@link module:ol/events/condition.never}. Use this if you
 * want to use different events for add and remove instead of `toggle`.
 * @property {import("../events/condition.js").Condition} [condition] A function that
 * takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled. This is the event
 * for the selected features as a whole. By default, this is
 * {@link module:ol/events/condition.singleClick}. Clicking on a feature selects that
 * feature and removes any that were in the selection. Clicking outside any
 * feature removes all from the selection.
 * See `toggle`, `add`, `remove` options for adding/removing extra features to/
 * from the selection.
 * @property {Array<import("../layer/Layer.js").default>|function(import("../layer/Layer.js").default): boolean} [layers]
 * A list of layers from which features should be selected. Alternatively, a
 * filter function can be provided. The function will be called for each layer
 * in the map and should return `true` for layers that you want to be
 * selectable. If the option is absent, all visible layers will be considered
 * selectable.
 * @property {import("../style/Style.js").StyleLike|null} [style]
 * Style for the selected features. By default the default edit style is used
 * (see {@link module:ol/style}). Set to `null` if this interaction should not apply
 * any style changes for selected features.
 * If set to a falsey value, the selected feature's style will not change.
 * @property {import("../events/condition.js").Condition} [removeCondition] A function
 * that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled.
 * By default, this is {@link module:ol/events/condition.never}. Use this if you
 * want to use different events for add and remove instead of `toggle`.
 * @property {import("../events/condition.js").Condition} [toggleCondition] A function
 * that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * boolean to indicate whether that event should be handled. This is in addition
 * to the `condition` event. By default,
 * {@link module:ol/events/condition.shiftKeyOnly}, i.e. pressing `shift` as
 * well as the `condition` event, adds that feature to the current selection if
 * it is not currently selected, and removes it if it is. See `add` and `remove`
 * if you want to use different events instead of a toggle.
 * @property {boolean} [multi=false] A boolean that determines if the default
 * behaviour should select only single features or all (overlapping) features at
 * the clicked map position. The default of `false` means single select.
 * @property {import("../Collection.js").default<import("../Feature.js").default>} [features]
 * Collection where the interaction will place selected features. Optional. If
 * not set the interaction will create a collection. In any case the collection
 * used by the interaction is returned by
 * {@link module:ol/interaction/Select~Select#getFeatures}.
 * @property {FilterFunction} [filter] A function
 * that takes an {@link module:ol/Feature} and an
 * {@link module:ol/layer/Layer} and returns `true` if the feature may be
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
   *     {@link module:ol/MapBrowserEvent}.
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
     * Associated {@link module:ol/MapBrowserEvent}.
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

/**
 * @classdesc
 * Interaction for selecting vector features. By default, selected features are
 * styled differently, so this interaction can be used for visual highlighting,
 * as well as selecting features for other actions, such as modification or
 * output. There are three ways of controlling which features are selected:
 * using the browser event as defined by the `condition` and optionally the
 * `toggle`, `add`/`remove`, and `multi` options; a `layers` filter; and a
 * further feature filter using the `filter` option.
 *
 * Selected features are added to an internal unmanaged layer.
 *
 * @fires SelectEvent
 * @api
 */
class Select extends Interaction {
  /**
   * @param {Options} [opt_options] Options.
   */
  constructor(opt_options) {
    super();

    const options = opt_options ? opt_options : {};

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
     * @type {import("../Collection.js").default}
     */
    this.features_ = options.features || new Collection();

    /** @type {function(import("../layer/Layer.js").default): boolean} */
    let layerFilter;
    if (options.layers) {
      if (typeof options.layers === 'function') {
        layerFilter = options.layers;
      } else {
        const layers = options.layers;
        layerFilter = function (layer) {
          return includes(layers, layer);
        };
      }
    } else {
      layerFilter = TRUE;
    }

    /**
     * @private
     * @type {function(import("../layer/Layer.js").default): boolean}
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
   * @param {import("../Feature.js").FeatureLike} feature Feature.
   * @param {import("../layer/Layer.js").default} layer Layer.
   * @private
   */
  addFeatureLayerAssociation_(feature, layer) {
    this.featureLayerAssociation_[getUid(feature)] = layer;
  }

  /**
   * Get the selected features.
   * @return {import("../Collection.js").default<import("../Feature.js").default>} Features collection.
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
   * Returns the associated {@link module:ol/layer/Vector~Vector vectorlayer} of
   * the (last) selected feature. Note that this will not work with any
   * programmatic method like pushing features to
   * {@link module:ol/interaction/Select~Select#getFeatures collection}.
   * @param {import("../Feature.js").FeatureLike} feature Feature
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
   * @param {import("../PluggableMap.js").default} map Map.
   * @api
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
        this.boundAddFeature_
      );
      this.features_.addEventListener(
        CollectionEventType.REMOVE,
        this.boundRemoveFeature_
      );

      if (this.style_) {
        this.features_.forEach(this.applySelectedStyle_.bind(this));
      }
    } else {
      this.features_.removeEventListener(
        CollectionEventType.ADD,
        this.boundAddFeature_
      );
      this.features_.removeEventListener(
        CollectionEventType.REMOVE,
        this.boundRemoveFeature_
      );
    }
  }

  /**
   * @param {import("../Collection.js").CollectionEvent} evt Event.
   * @private
   */
  addFeature_(evt) {
    const feature = evt.element;
    if (this.style_) {
      this.applySelectedStyle_(feature);
    }
  }

  /**
   * @param {import("../Collection.js").CollectionEvent} evt Event.
   * @private
   */
  removeFeature_(evt) {
    const feature = evt.element;
    if (this.style_) {
      this.restorePreviousStyle_(feature);
    }
  }

  /**
   * @return {import("../style/Style.js").StyleLike|null} Select style.
   */
  getStyle() {
    return this.style_;
  }

  /**
   * @param {import("../Feature.js").default} feature Feature
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
   * @param {import("../Feature.js").default} feature Feature
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
   * @param {import("../Feature.js").FeatureLike} feature Feature.
   * @private
   */
  removeFeatureLayerAssociation_(feature) {
    delete this.featureLayerAssociation_[getUid(feature)];
  }

  /**
   * Handles the {@link module:ol/MapBrowserEvent map browser event} and may change the
   * selected state of features.
   * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @this {Select}
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
    const deselected = [];
    const selected = [];
    if (set) {
      // Replace the currently selected feature(s) with the feature(s) at the
      // pixel, or clear the selected feature(s) if there is no feature at
      // the pixel.
      clear(this.featureLayerAssociation_);
      map.forEachFeatureAtPixel(
        mapBrowserEvent.pixel,
        /**
         * @param {import("../Feature.js").FeatureLike} feature Feature.
         * @param {import("../layer/Layer.js").default} layer Layer.
         * @return {boolean|undefined} Continue to iterate over the features.
         */
        function (feature, layer) {
          if (this.filter_(feature, layer)) {
            selected.push(feature);
            this.addFeatureLayerAssociation_(feature, layer);
            return !this.multi_;
          }
        }.bind(this),
        {
          layerFilter: this.layerFilter_,
          hitTolerance: this.hitTolerance_,
        }
      );
      for (let i = features.getLength() - 1; i >= 0; --i) {
        const feature = features.item(i);
        const index = selected.indexOf(feature);
        if (index > -1) {
          // feature is already selected
          selected.splice(index, 1);
        } else {
          features.remove(feature);
          deselected.push(feature);
        }
      }
      if (selected.length !== 0) {
        features.extend(selected);
      }
    } else {
      // Modify the currently selected feature(s).
      map.forEachFeatureAtPixel(
        mapBrowserEvent.pixel,
        /**
         * @param {import("../Feature.js").FeatureLike} feature Feature.
         * @param {import("../layer/Layer.js").default} layer Layer.
         * @return {boolean|undefined} Continue to iterate over the features.
         */
        function (feature, layer) {
          if (this.filter_(feature, layer)) {
            if ((add || toggle) && !includes(features.getArray(), feature)) {
              selected.push(feature);
              this.addFeatureLayerAssociation_(feature, layer);
            } else if (
              (remove || toggle) &&
              includes(features.getArray(), feature)
            ) {
              deselected.push(feature);
              this.removeFeatureLayerAssociation_(feature);
            }
            return !this.multi_;
          }
        }.bind(this),
        {
          layerFilter: this.layerFilter_,
          hitTolerance: this.hitTolerance_,
        }
      );
      for (let j = deselected.length - 1; j >= 0; --j) {
        features.remove(deselected[j]);
      }
      features.extend(selected);
    }
    if (selected.length > 0 || deselected.length > 0) {
      this.dispatchEvent(
        new SelectEvent(
          SelectEventType.SELECT,
          selected,
          deselected,
          mapBrowserEvent
        )
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
  extend(styles[GeometryType.POLYGON], styles[GeometryType.LINE_STRING]);
  extend(
    styles[GeometryType.GEOMETRY_COLLECTION],
    styles[GeometryType.LINE_STRING]
  );

  return function (feature) {
    if (!feature.getGeometry()) {
      return null;
    }
    return styles[feature.getGeometry().getType()];
  };
}

export default Select;
