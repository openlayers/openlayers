/**
 * @module ol/Feature
 */
import BaseObject from './Object.js';
import EventType from './events/EventType.js';
import {assert} from './asserts.js';
import {listen, unlistenByKey} from './events.js';

/**
 * @typedef {typeof Feature|typeof import("./render/Feature.js").default} FeatureClass
 */

/**
 * @typedef {Feature|import("./render/Feature.js").default} FeatureLike
 */

/***
 * @template Return
 * @typedef {import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return> &
 *   import("./Observable").OnSignature<import("./ObjectEventType").Types|'change:geometry', import("./Object").ObjectEvent, Return> &
 *   import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|import("./ObjectEventType").Types
 *     |'change:geometry', Return>} FeatureOnSignature
 */

/***
 * @template Geometry
 * @typedef {Object<string, *> & { geometry?: Geometry }} ObjectWithGeometry
 */

/**
 * @classdesc
 * A vector object for geographic features with a geometry and other
 * attribute properties, similar to the features in vector file formats like
 * GeoJSON.
 *
 * Features can be styled individually with `setStyle`; otherwise they use the
 * style of their vector layer.
 *
 * Note that attribute properties are set as {@link module:ol/Object~BaseObject} properties on
 * the feature object, so they are observable, and have get/set accessors.
 *
 * Typically, a feature has a single geometry property. You can set the
 * geometry using the `setGeometry` method and get it with `getGeometry`.
 * It is possible to store more than one geometry on a feature using attribute
 * properties. By default, the geometry used for rendering is identified by
 * the property name `geometry`. If you want to use another geometry property
 * for rendering, use the `setGeometryName` method to change the attribute
 * property associated with the geometry for the feature.  For example:
 *
 * ```js
 *
 * import Feature from 'ol/Feature';
 * import Polygon from 'ol/geom/Polygon';
 * import Point from 'ol/geom/Point';
 *
 * var feature = new Feature({
 *   geometry: new Polygon(polyCoords),
 *   labelPoint: new Point(labelCoords),
 *   name: 'My Polygon'
 * });
 *
 * // get the polygon geometry
 * var poly = feature.getGeometry();
 *
 * // Render the feature as a point using the coordinates from labelPoint
 * feature.setGeometryName('labelPoint');
 *
 * // get the point geometry
 * var point = feature.getGeometry();
 * ```
 *
 * @api
 * @template {import("./geom/Geometry.js").default} [Geometry=import("./geom/Geometry.js").default]
 */
class Feature extends BaseObject {
  /**
   * @param {Geometry|ObjectWithGeometry<Geometry>} [opt_geometryOrProperties]
   *     You may pass a Geometry object directly, or an object literal containing
   *     properties. If you pass an object literal, you may include a Geometry
   *     associated with a `geometry` key.
   */
  constructor(opt_geometryOrProperties) {
    super();

    /***
     * @type {FeatureOnSignature<import("./events").EventsKey>}
     */
    this.on;

    /***
     * @type {FeatureOnSignature<import("./events").EventsKey>}
     */
    this.once;

    /***
     * @type {FeatureOnSignature<void>}
     */
    this.un;

    /**
     * @private
     * @type {number|string|undefined}
     */
    this.id_ = undefined;

    /**
     * @type {string}
     * @private
     */
    this.geometryName_ = 'geometry';

    /**
     * User provided style.
     * @private
     * @type {import("./style/Style.js").StyleLike}
     */
    this.style_ = null;

    /**
     * @private
     * @type {import("./style/Style.js").StyleFunction|undefined}
     */
    this.styleFunction_ = undefined;

    /**
     * @private
     * @type {?import("./events.js").EventsKey}
     */
    this.geometryChangeKey_ = null;

    this.addChangeListener(this.geometryName_, this.handleGeometryChanged_);

    if (opt_geometryOrProperties) {
      if (
        typeof (
          /** @type {?} */ (opt_geometryOrProperties).getSimplifiedGeometry
        ) === 'function'
      ) {
        const geometry = /** @type {Geometry} */ (opt_geometryOrProperties);
        this.setGeometry(geometry);
      } else {
        /** @type {Object<string, *>} */
        const properties = opt_geometryOrProperties;
        this.setProperties(properties);
      }
    }
  }

  /**
   * Clone this feature. If the original feature has a geometry it
   * is also cloned. The feature id is not set in the clone.
   * @return {Feature<Geometry>} The clone.
   * @api
   */
  clone() {
    const clone = /** @type {Feature<Geometry>} */ (
      new Feature(this.hasProperties() ? this.getProperties() : null)
    );
    clone.setGeometryName(this.getGeometryName());
    const geometry = this.getGeometry();
    if (geometry) {
      clone.setGeometry(/** @type {Geometry} */ (geometry.clone()));
    }
    const style = this.getStyle();
    if (style) {
      clone.setStyle(style);
    }
    return clone;
  }

  /**
   * Get the feature's default geometry.  A feature may have any number of named
   * geometries.  The "default" geometry (the one that is rendered by default) is
   * set when calling {@link module:ol/Feature~Feature#setGeometry}.
   * @return {Geometry|undefined} The default geometry for the feature.
   * @api
   * @observable
   */
  getGeometry() {
    return /** @type {Geometry|undefined} */ (this.get(this.geometryName_));
  }

  /**
   * Get the feature identifier.  This is a stable identifier for the feature and
   * is either set when reading data from a remote source or set explicitly by
   * calling {@link module:ol/Feature~Feature#setId}.
   * @return {number|string|undefined} Id.
   * @api
   */
  getId() {
    return this.id_;
  }

  /**
   * Get the name of the feature's default geometry.  By default, the default
   * geometry is named `geometry`.
   * @return {string} Get the property name associated with the default geometry
   *     for this feature.
   * @api
   */
  getGeometryName() {
    return this.geometryName_;
  }

  /**
   * Get the feature's style. Will return what was provided to the
   * {@link module:ol/Feature~Feature#setStyle} method.
   * @return {import("./style/Style.js").StyleLike|undefined} The feature style.
   * @api
   */
  getStyle() {
    return this.style_;
  }

  /**
   * Get the feature's style function.
   * @return {import("./style/Style.js").StyleFunction|undefined} Return a function
   * representing the current style of this feature.
   * @api
   */
  getStyleFunction() {
    return this.styleFunction_;
  }

  /**
   * @private
   */
  handleGeometryChange_() {
    this.changed();
  }

  /**
   * @private
   */
  handleGeometryChanged_() {
    if (this.geometryChangeKey_) {
      unlistenByKey(this.geometryChangeKey_);
      this.geometryChangeKey_ = null;
    }
    const geometry = this.getGeometry();
    if (geometry) {
      this.geometryChangeKey_ = listen(
        geometry,
        EventType.CHANGE,
        this.handleGeometryChange_,
        this
      );
    }
    this.changed();
  }

  /**
   * Set the default geometry for the feature.  This will update the property
   * with the name returned by {@link module:ol/Feature~Feature#getGeometryName}.
   * @param {Geometry|undefined} geometry The new geometry.
   * @api
   * @observable
   */
  setGeometry(geometry) {
    this.set(this.geometryName_, geometry);
  }

  /**
   * Set the style for the feature to override the layer style.  This can be a
   * single style object, an array of styles, or a function that takes a
   * resolution and returns an array of styles. To unset the feature style, call
   * `setStyle()` without arguments or a falsey value.
   * @param {import("./style/Style.js").StyleLike} [opt_style] Style for this feature.
   * @api
   * @fires module:ol/events/Event~BaseEvent#event:change
   */
  setStyle(opt_style) {
    this.style_ = opt_style;
    this.styleFunction_ = !opt_style
      ? undefined
      : createStyleFunction(opt_style);
    this.changed();
  }

  /**
   * Set the feature id.  The feature id is considered stable and may be used when
   * requesting features or comparing identifiers returned from a remote source.
   * The feature id can be used with the
   * {@link module:ol/source/Vector~VectorSource#getFeatureById} method.
   * @param {number|string|undefined} id The feature id.
   * @api
   * @fires module:ol/events/Event~BaseEvent#event:change
   */
  setId(id) {
    this.id_ = id;
    this.changed();
  }

  /**
   * Set the property name to be used when getting the feature's default geometry.
   * When calling {@link module:ol/Feature~Feature#getGeometry}, the value of the property with
   * this name will be returned.
   * @param {string} name The property name of the default geometry.
   * @api
   */
  setGeometryName(name) {
    this.removeChangeListener(this.geometryName_, this.handleGeometryChanged_);
    this.geometryName_ = name;
    this.addChangeListener(this.geometryName_, this.handleGeometryChanged_);
    this.handleGeometryChanged_();
  }
}

/**
 * Convert the provided object into a feature style function.  Functions passed
 * through unchanged.  Arrays of Style or single style objects wrapped
 * in a new feature style function.
 * @param {!import("./style/Style.js").StyleFunction|!Array<import("./style/Style.js").default>|!import("./style/Style.js").default} obj
 *     A feature style function, a single style, or an array of styles.
 * @return {import("./style/Style.js").StyleFunction} A style function.
 */
export function createStyleFunction(obj) {
  if (typeof obj === 'function') {
    return obj;
  } else {
    /**
     * @type {Array<import("./style/Style.js").default>}
     */
    let styles;
    if (Array.isArray(obj)) {
      styles = obj;
    } else {
      assert(typeof (/** @type {?} */ (obj).getZIndex) === 'function', 41); // Expected an `import("./style/Style.js").Style` or an array of `import("./style/Style.js").Style`
      const style = /** @type {import("./style/Style.js").default} */ (obj);
      styles = [style];
    }
    return function () {
      return styles;
    };
  }
}
export default Feature;
