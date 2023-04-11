/**
 * @module ol/interaction/Link
 */
import EventType from '../events/EventType.js';
import Interaction from './Interaction.js';
import MapEventType from '../MapEventType.js';
import {listen, unlistenByKey} from '../events.js';
import {toFixed} from '../math.js';

/**
 * @param {number} number A number.
 * @return {number} A number with at most 5 decimal places.
 */
function to5(number) {
  return toFixed(number, 5);
}

/**
 * @param {string} string A string.
 * @return {number} A number representing the string.
 */
function readNumber(string) {
  return parseFloat(string);
}

/**
 * @param {number} number A number.
 * @return {string} A string representing the number.
 */
function writeNumber(number) {
  return to5(number).toString();
}

/**
 * @param {number} a A number.
 * @param {number} b A number.
 * @return {boolean} The numbers are different.
 */
function differentNumber(a, b) {
  if (isNaN(a)) {
    return false;
  }
  return a !== readNumber(writeNumber(b));
}

/**
 * @param {Array<number>} a An array of two numbers.
 * @param {Array<number>} b An array of two numbers.
 * @return {boolean} The arrays are different.
 */
function differentArray(a, b) {
  return differentNumber(a[0], b[0]) || differentNumber(a[1], b[1]);
}

/** @typedef {'x'|'y'|'z'|'r'|'l'} Params */

/**
 * @typedef {Object} Options
 * @property {boolean|import('../View.js').AnimationOptions} [animate=true] Animate view transitions.
 * @property {Array<Params>} [params=['x', 'y', 'z', 'r', 'l']] Properties to track. Default is to track
 * `x` (center x), `y` (center y), `z` (zoom), `r` (rotation) and `l` (layers).
 * @property {boolean} [replace=false] Replace the current URL without creating the new entry in browser history.
 * By default, changes in the map state result in a new entry being added to the browser history.
 * @property {string} [prefix=''] By default, the URL will be updated with search parameters x, y, z, and r.  To
 * avoid collisions with existing search parameters that your application uses, you can supply a custom prefix for
 * the ones used by this interaction (e.g. 'ol:').
 */

/**
 * @classdesc
 * An interaction that synchronizes the map state with the URL.
 *
 * @api
 */
class Link extends Interaction {
  /**
   * @param {Options} [options] Link options.
   */
  constructor(options) {
    super();

    options = Object.assign(
      {
        animate: true,
        params: ['x', 'y', 'z', 'r', 'l'],
        replace: false,
        prefix: '',
      },
      options || {}
    );

    let animationOptions;
    if (options.animate === true) {
      animationOptions = {duration: 250};
    } else if (!options.animate) {
      animationOptions = null;
    } else {
      animationOptions = options.animate;
    }

    /**
     * @type {import('../View.js').AnimationOptions|null}
     * @private
     */
    this.animationOptions_ = animationOptions;

    /**
     * @type {Object<Params, boolean>}
     * @private
     */
    this.params_ = options.params.reduce((acc, value) => {
      acc[value] = true;
      return acc;
    }, {});

    /**
     * @private
     * @type {boolean}
     */
    this.replace_ = options.replace;

    /**
     * @private
     * @type {string}
     */
    this.prefix_ = options.prefix;

    /**
     * @private
     * @type {!Array<import("../events.js").EventsKey>}
     */
    this.listenerKeys_ = [];

    /**
     * @private
     * @type {boolean}
     */
    this.initial_ = true;

    this.updateState_ = this.updateState_.bind(this);
  }

  /**
   * @private
   * @param {string} name A parameter name.
   * @return {string} A name with the prefix applied.
   */
  getParamName_(name) {
    if (!this.prefix_) {
      return name;
    }
    return this.prefix_ + name;
  }

  /**
   * @private
   * @param {URLSearchParams} params The search params.
   * @param {string} name The unprefixed parameter name.
   * @return {string|null} The parameter value.
   */
  get_(params, name) {
    return params.get(this.getParamName_(name));
  }

  /**
   * @private
   * @param {URLSearchParams} params The search params.
   * @param {string} name The unprefixed parameter name.
   * @param {string} value The param value.
   */
  set_(params, name, value) {
    if (!(name in this.params_)) {
      return;
    }
    params.set(this.getParamName_(name), value);
  }

  /**
   * @private
   * @param {URLSearchParams} params The search params.
   * @param {string} name The unprefixed parameter name.
   */
  delete_(params, name) {
    if (!(name in this.params_)) {
      return;
    }
    params.delete(this.getParamName_(name));
  }

  /**
   * @param {import("../Map.js").default|null} map Map.
   */
  setMap(map) {
    const oldMap = this.getMap();
    super.setMap(map);
    if (map === oldMap) {
      return;
    }
    if (oldMap) {
      this.unregisterListeners_(oldMap);
    }
    if (map) {
      this.initial_ = true;
      this.updateState_();
      this.registerListeners_(map);
    }
  }

  /**
   * @param {import("../Map.js").default} map Map.
   * @private
   */
  registerListeners_(map) {
    this.listenerKeys_.push(
      listen(map, MapEventType.MOVEEND, this.updateUrl_, this),
      listen(map.getLayerGroup(), EventType.CHANGE, this.updateUrl_, this),
      listen(map, 'change:layergroup', this.handleChangeLayerGroup_, this)
    );

    if (!this.replace_) {
      addEventListener('popstate', this.updateState_);
    }
  }

  /**
   * @param {import("../Map.js").default} map Map.
   * @private
   */
  unregisterListeners_(map) {
    for (let i = 0, ii = this.listenerKeys_.length; i < ii; ++i) {
      unlistenByKey(this.listenerKeys_[i]);
    }
    this.listenerKeys_.length = 0;

    if (!this.replace_) {
      removeEventListener('popstate', this.updateState_);
    }

    const url = new URL(window.location.href);
    const params = url.searchParams;
    this.delete_(params, 'x');
    this.delete_(params, 'y');
    this.delete_(params, 'z');
    this.delete_(params, 'r');
    this.delete_(params, 'l');
    window.history.replaceState(null, '', url);
  }

  /**
   * @private
   */
  handleChangeLayerGroup_() {
    const map = this.getMap();
    if (!map) {
      return;
    }
    this.unregisterListeners_(map);
    this.registerListeners_(map);
    this.initial_ = true;
    this.updateUrl_();
  }

  /**
   * @private
   */
  updateState_() {
    const map = this.getMap();
    if (!map) {
      return;
    }
    const view = map.getView();
    if (!view) {
      return;
    }
    const url = new URL(window.location.href);
    const params = url.searchParams;

    let updateView = false;

    /**
     * @type {import('../View.js').AnimationOptions}
     */
    const viewProperties = {};

    const zoom = readNumber(this.get_(params, 'z'));
    if ('z' in this.params_ && differentNumber(zoom, view.getZoom())) {
      updateView = true;
      viewProperties.zoom = zoom;
    }

    const rotation = readNumber(this.get_(params, 'r'));
    if ('r' in this.params_ && differentNumber(rotation, view.getRotation())) {
      updateView = true;
      viewProperties.rotation = rotation;
    }

    const center = [
      readNumber(this.get_(params, 'x')),
      readNumber(this.get_(params, 'y')),
    ];
    if (
      ('x' in this.params_ || 'y' in this.params_) &&
      differentArray(center, view.getCenter())
    ) {
      updateView = true;
      viewProperties.center = center;
    }

    if (updateView) {
      if (!this.initial_ && this.animationOptions_) {
        view.animate(Object.assign(viewProperties, this.animationOptions_));
      } else {
        if (viewProperties.center) {
          view.setCenter(viewProperties.center);
        }
        if ('zoom' in viewProperties) {
          view.setZoom(viewProperties.zoom);
        }
        if ('rotation' in viewProperties) {
          view.setRotation(viewProperties.rotation);
        }
      }
    }

    const layers = map.getAllLayers();
    const layersParam = this.get_(params, 'l');
    if (
      'l' in this.params_ &&
      layersParam &&
      layersParam.length === layers.length
    ) {
      for (let i = 0, ii = layers.length; i < ii; ++i) {
        const value = parseInt(layersParam[i]);
        if (!isNaN(value)) {
          const visible = Boolean(value);
          const layer = layers[i];
          if (layer.getVisible() !== visible) {
            layer.setVisible(visible);
          }
        }
      }
    }
  }

  /**
   * @private
   */
  updateUrl_() {
    const map = this.getMap();
    if (!map) {
      return;
    }
    const view = map.getView();
    if (!view) {
      return;
    }
    const initial = this.initial_;
    this.initial_ = false;

    const center = view.getCenter();
    const zoom = view.getZoom();
    const rotation = view.getRotation();

    const layers = map.getAllLayers();
    const visibilities = new Array(layers.length);
    for (let i = 0, ii = layers.length; i < ii; ++i) {
      visibilities[i] = layers[i].getVisible() ? '1' : '0';
    }

    const url = new URL(window.location.href);
    const params = url.searchParams;

    this.set_(params, 'x', writeNumber(center[0]));
    this.set_(params, 'y', writeNumber(center[1]));
    this.set_(params, 'z', writeNumber(zoom));
    this.set_(params, 'r', writeNumber(rotation));
    this.set_(params, 'l', visibilities.join(''));

    if (url.href !== window.location.href) {
      if (initial || this.replace_) {
        window.history.replaceState(history.state, '', url);
      } else {
        window.history.pushState(null, '', url);
      }
    }
  }
}

export default Link;
