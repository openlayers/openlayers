/**
 * @module ol/interaction/DragAndDrop
 */
// FIXME should handle all geo-referenced data, not just vector data

import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import FormatType from '../format/FormatType.js';
import Interaction from './Interaction.js';
import {TRUE} from '../functions.js';
import {get as getProjection} from '../proj.js';
import {listen, unlistenByKey} from '../events.js';

/**
 * @typedef {Object} Options
 * @property {Array<typeof import("../format/Feature.js").default|import("../format/Feature.js").default>} [formatConstructors] Format constructors
 * (and/or formats pre-constructed with options).
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
  ADD_FEATURES: 'addfeatures',
};

/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/DragAndDrop~DragAndDrop} instances are instances
 * of this type.
 */
export class DragAndDropEvent extends Event {
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
 *
 * Note that the DragAndDrop interaction uses the TextDecoder() constructor if the supplied
 * combinnation of formats read both text string and ArrayBuffer sources. Older browsers such
 * as IE which do not support this will need a TextDecoder polyfill to be loaded before use.
 *
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
      handleEvent: TRUE,
    });

    /**
     * @private
     * @type {boolean}
     */
    this.readAsBuffer_ = false;

    /**
     * @private
     * @type {Array<import("../format/Feature.js").default>}
     */
    this.formats_ = [];
    const formatConstructors = options.formatConstructors
      ? options.formatConstructors
      : [];
    for (let i = 0, ii = formatConstructors.length; i < ii; ++i) {
      let format = formatConstructors[i];
      if (typeof format === 'function') {
        format = new format();
      }
      this.formats_.push(format);
      this.readAsBuffer_ =
        this.readAsBuffer_ || format.getType() === FormatType.ARRAY_BUFFER;
    }

    /**
     * @private
     * @type {import("../proj/Projection.js").default}
     */
    this.projection_ = options.projection
      ? getProjection(options.projection)
      : null;

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

    let text;
    const formats = this.formats_;
    for (let i = 0, ii = formats.length; i < ii; ++i) {
      const format = formats[i];
      let input = result;
      if (this.readAsBuffer_ && format.getType() !== FormatType.ARRAY_BUFFER) {
        if (text === undefined) {
          text = new TextDecoder().decode(result);
        }
        input = text;
      }
      const features = this.tryReadFeatures_(format, input, {
        featureProjection: projection,
      });
      if (features && features.length > 0) {
        if (this.source_) {
          this.source_.clear();
          this.source_.addFeatures(features);
        }
        this.dispatchEvent(
          new DragAndDropEvent(
            DragAndDropEventType.ADD_FEATURES,
            file,
            features,
            projection
          )
        );
        break;
      }
    }
  }

  /**
   * @private
   */
  registerListeners_() {
    const map = this.getMap();
    if (map) {
      const dropArea = this.target ? this.target : map.getViewport();
      this.dropListenKeys_ = [
        listen(dropArea, EventType.DROP, this.handleDrop, this),
        listen(dropArea, EventType.DRAGENTER, this.handleStop, this),
        listen(dropArea, EventType.DRAGOVER, this.handleStop, this),
        listen(dropArea, EventType.DROP, this.handleStop, this),
      ];
    }
  }

  /**
   * Activate or deactivate the interaction.
   * @param {boolean} active Active.
   * @observable
   * @api
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
   * Remove the interaction from its current map and attach it to the new map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../PluggableMap.js").default} map Map.
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
   * @return {Array<import("../Feature.js").default>} Features.
   */
  tryReadFeatures_(format, text, options) {
    try {
      return (
        /** @type {Array<import("../Feature.js").default>} */
        (format.readFeatures(text, options))
      );
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

  /**
   * @param {DragEvent} event Event.
   */
  handleDrop(event) {
    const files = event.dataTransfer.files;
    for (let i = 0, ii = files.length; i < ii; ++i) {
      const file = files.item(i);
      const reader = new FileReader();
      reader.addEventListener(
        EventType.LOAD,
        this.handleResult_.bind(this, file)
      );
      if (this.readAsBuffer_) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    }
  }

  /**
   * @param {DragEvent} event Event.
   */
  handleStop(event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }
}

export default DragAndDrop;
