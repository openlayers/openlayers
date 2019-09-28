/**
 * @module ol/interaction/DragAndDrop
 */
// FIXME should handle all geo-referenced data, not just vector data

import {TRUE} from '../functions.js';
import {listen, unlistenByKey} from '../events.js';
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import Interaction from './Interaction.js';
import {get as getProjection} from '../proj.js';


/**
 * @typedef {Object} Options
 * @property {Array<typeof import("../format/Feature.js").default>} [formatConstructors] Format constructors.
 * @property {import("../source/Vector.js").default} [source] Optional vector source where features will be added.  If a source is provided
 * all existing features will be removed and new features will be added when
 * they are dropped on the target.  If you want to add features to a vector
 * source without removing the existing features (append only), instead of
 * providing the source option listen for the "addfeatures" event.
 * @property {import("../proj.js").ProjectionLike} [projection] Target projection. By default, the map's view's projection is used.
 * @property {HTMLElement} [target] The element that is used as the drop target, default is the viewport element.
 */


/**
 * @enum {string}
 */
const DragAndDropEventType = {
  /**
   * Triggered when features are added
   * @event DragAndDropEvent#addfeatures
   * @api
   */
  ADD_FEATURES: 'addfeatures'
};


/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/DragAndDrop~DragAndDrop} instances are instances
 * of this type.
 */
class DragAndDropEvent extends Event {

  /**
   * @param {DragAndDropEventType} type Type.
   * @param {File} file File.
   * @param {Array<import("../Feature.js").default>=} opt_features Features.
   * @param {import("../proj/Projection.js").default=} opt_projection Projection.
   */
  constructor(type, file, opt_features, opt_projection) {

    super(type);

    /**
     * The features parsed from dropped data.
     * @type {Array<import("../Feature.js").FeatureLike>|undefined}
     * @api
     */
    this.features = opt_features;

    /**
     * The dropped file.
     * @type {File}
     * @api
     */
    this.file = file;

    /**
     * The feature projection.
     * @type {import("../proj/Projection.js").default|undefined}
     * @api
     */
    this.projection = opt_projection;

  }

}


/**
 * @classdesc
 * Handles input of vector data by drag and drop.
 * @api
 *
 * @fires DragAndDropEvent
 */
class DragAndDrop extends Interaction {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {

    const options = opt_options ? opt_options : {};

    super({
      handleEvent: TRUE
    });

    /**
     * @private
     * @type {Array<typeof import("../format/Feature.js").default>}
     */
    this.formatConstructors_ = options.formatConstructors ?
      options.formatConstructors : [];

    /**
     * @private
     * @type {import("../proj/Projection.js").default}
     */
    this.projection_ = options.projection ?
      getProjection(options.projection) : null;

    /**
     * @private
     * @type {?Array<import("../events.js").EventsKey>}
     */
    this.dropListenKeys_ = null;

    /**
     * @private
     * @type {import("../source/Vector.js").default}
     */
    this.source_ = options.source || null;

    /**
     * @private
     * @type {HTMLElement}
     */
    this.target = options.target ? options.target : null;

  }

  /**
   * @param {File} file File.
   * @param {Event} event Load event.
   * @private
   */
  handleResult_(file, event) {
    const result = event.target.result;
    const map = this.getMap();
    let projection = this.projection_;
    if (!projection) {
      const view = map.getView();
      projection = view.getProjection();
    }

    const formatConstructors = this.formatConstructors_;
    let features = [];
    for (let i = 0, ii = formatConstructors.length; i < ii; ++i) {
      const format = new formatConstructors[i]();
      features = this.tryReadFeatures_(format, result, {
        featureProjection: projection
      });
      if (features && features.length > 0) {
        break;
      }
    }
    if (this.source_) {
      this.source_.clear();
      this.source_.addFeatures(features);
    }
    this.dispatchEvent(
      new DragAndDropEvent(
        DragAndDropEventType.ADD_FEATURES, file,
        features, projection));
  }

  /**
   * @private
   */
  registerListeners_() {
    const map = this.getMap();
    if (map) {
      const dropArea = this.target ? this.target : map.getViewport();
      this.dropListenKeys_ = [
        listen(dropArea, EventType.DROP, handleDrop, this),
        listen(dropArea, EventType.DRAGENTER, handleStop, this),
        listen(dropArea, EventType.DRAGOVER, handleStop, this),
        listen(dropArea, EventType.DROP, handleStop, this)
      ];
    }
  }

  /**
   * @inheritDoc
   */
  setActive(active) {
    if (!this.getActive() && active) {
      this.registerListeners_();
    }
    if (this.getActive() && !active) {
      this.unregisterListeners_();
    }
    super.setActive(active);
  }

  /**
   * @inheritDoc
   */
  setMap(map) {
    this.unregisterListeners_();
    super.setMap(map);
    if (this.getActive()) {
      this.registerListeners_();
    }
  }

  /**
   * @param {import("../format/Feature.js").default} format Format.
   * @param {string} text Text.
   * @param {import("../format/Feature.js").ReadOptions} options Read options.
   * @private
   * @return {Array<import("../Feature.js").FeatureLike>} Features.
   */
  tryReadFeatures_(format, text, options) {
    try {
      return format.readFeatures(text, options);
    } catch (e) {
      return null;
    }
  }

  /**
   * @private
   */
  unregisterListeners_() {
    if (this.dropListenKeys_) {
      this.dropListenKeys_.forEach(unlistenByKey);
      this.dropListenKeys_ = null;
    }
  }
}


/**
 * @param {DragEvent} event Event.
 * @this {DragAndDrop}
 */
function handleDrop(event) {
  const files = event.dataTransfer.files;
  for (let i = 0, ii = files.length; i < ii; ++i) {
    const file = files.item(i);
    const reader = new FileReader();
    reader.addEventListener(EventType.LOAD, this.handleResult_.bind(this, file));
    reader.readAsText(file);
  }
}


/**
 * @param {DragEvent} event Event.
 */
function handleStop(event) {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
}


export default DragAndDrop;
