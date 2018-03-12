/**
 * @module ol/interaction/DragAndDrop
 */
// FIXME should handle all geo-referenced data, not just vector data

import {inherits} from '../index.js';
import {TRUE} from '../functions.js';
import {listen, unlistenByKey} from '../events.js';
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import Interaction from '../interaction/Interaction.js';
import {get as getProjection} from '../proj.js';


/**
 * @enum {string}
 */
const DragAndDropEventType = {
  /**
   * Triggered when features are added
   * @event ol.interaction.DragAndDropEvent#addfeatures
   * @api
   */
  ADD_FEATURES: 'addfeatures'
};


/**
 * @classdesc
 * Events emitted by {@link ol.interaction.DragAndDrop} instances are instances
 * of this type.
 *
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.interaction.DragAndDropEvent}
 * @param {ol.interaction.DragAndDropEventType} type Type.
 * @param {File} file File.
 * @param {Array.<module:ol/Feature~Feature>=} opt_features Features.
 * @param {module:ol/proj/Projection~Projection=} opt_projection Projection.
 */
const DragAndDropEvent = function(type, file, opt_features, opt_projection) {

  Event.call(this, type);

  /**
   * The features parsed from dropped data.
   * @type {Array.<module:ol/Feature~Feature>|undefined}
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
   * @type {module:ol/proj/Projection~Projection|undefined}
   * @api
   */
  this.projection = opt_projection;

};
inherits(DragAndDropEvent, Event);


/**
 * @classdesc
 * Handles input of vector data by drag and drop.
 *
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @fires ol.interaction.DragAndDropEvent
 * @param {olx.interaction.DragAndDropOptions=} opt_options Options.
 * @api
 */
const DragAndDrop = function(opt_options) {

  const options = opt_options ? opt_options : {};

  Interaction.call(this, {
    handleEvent: TRUE
  });

  /**
   * @private
   * @type {Array.<function(new: ol.format.Feature)>}
   */
  this.formatConstructors_ = options.formatConstructors ?
    options.formatConstructors : [];

  /**
   * @private
   * @type {module:ol/proj/Projection~Projection}
   */
  this.projection_ = options.projection ?
    getProjection(options.projection) : null;

  /**
   * @private
   * @type {Array.<module:ol/events~EventsKey>}
   */
  this.dropListenKeys_ = null;

  /**
   * @private
   * @type {ol.source.Vector}
   */
  this.source_ = options.source || null;

  /**
   * @private
   * @type {Element}
   */
  this.target = options.target ? options.target : null;

};

inherits(DragAndDrop, Interaction);


/**
 * @param {Event} event Event.
 * @this {ol.interaction.DragAndDrop}
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
 * @param {Event} event Event.
 */
function handleStop(event) {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
}


/**
 * @param {File} file File.
 * @param {Event} event Load event.
 * @private
 */
DragAndDrop.prototype.handleResult_ = function(file, event) {
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
    /**
     * Avoid "cannot instantiate abstract class" error.
     * @type {Function}
     */
    const formatConstructor = formatConstructors[i];
    /**
     * @type {ol.format.Feature}
     */
    const format = new formatConstructor();
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
};


/**
 * @private
 */
DragAndDrop.prototype.registerListeners_ = function() {
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
};


/**
 * @inheritDoc
 */
DragAndDrop.prototype.setActive = function(active) {
  Interaction.prototype.setActive.call(this, active);
  if (active) {
    this.registerListeners_();
  } else {
    this.unregisterListeners_();
  }
};


/**
 * @inheritDoc
 */
DragAndDrop.prototype.setMap = function(map) {
  this.unregisterListeners_();
  Interaction.prototype.setMap.call(this, map);
  if (this.getActive()) {
    this.registerListeners_();
  }
};


/**
 * @param {ol.format.Feature} format Format.
 * @param {string} text Text.
 * @param {module:ol/format/Feature~ReadOptions} options Read options.
 * @private
 * @return {Array.<module:ol/Feature~Feature>} Features.
 */
DragAndDrop.prototype.tryReadFeatures_ = function(format, text, options) {
  try {
    return format.readFeatures(text, options);
  } catch (e) {
    return null;
  }
};


/**
 * @private
 */
DragAndDrop.prototype.unregisterListeners_ = function() {
  if (this.dropListenKeys_) {
    this.dropListenKeys_.forEach(unlistenByKey);
    this.dropListenKeys_ = null;
  }
};


export default DragAndDrop;
