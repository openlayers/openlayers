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
 * @classdesc
 * Handles input of vector data by drag and drop.
 *
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @fires ol.interaction.DragAndDrop.Event
 * @param {olx.interaction.DragAndDropOptions=} opt_options Options.
 * @api
 */
const DragAndDrop = function(opt_options) {

  const options = opt_options ? opt_options : {};

  Interaction.call(this, {
    handleEvent: DragAndDrop.handleEvent
  });

  /**
   * @private
   * @type {Array.<function(new: ol.format.Feature)>}
   */
  this.formatConstructors_ = options.formatConstructors ?
    options.formatConstructors : [];

  /**
   * @private
   * @type {ol.proj.Projection}
   */
  this.projection_ = options.projection ?
    getProjection(options.projection) : null;

  /**
   * @private
   * @type {Array.<ol.EventsKey>}
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
 * @private
 */
DragAndDrop.handleDrop_ = function(event) {
  const files = event.dataTransfer.files;
  let i, ii, file;
  for (i = 0, ii = files.length; i < ii; ++i) {
    file = files.item(i);
    const reader = new FileReader();
    reader.addEventListener(EventType.LOAD,
      this.handleResult_.bind(this, file));
    reader.readAsText(file);
  }
};


/**
 * @param {Event} event Event.
 * @private
 */
DragAndDrop.handleStop_ = function(event) {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
};


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
  let i, ii;
  for (i = 0, ii = formatConstructors.length; i < ii; ++i) {
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
    new DragAndDrop.Event(
      DragAndDrop.EventType_.ADD_FEATURES, file,
      features, projection));
};


/**
 * Handles the {@link ol.MapBrowserEvent map browser event} unconditionally and
 * neither prevents the browser default nor stops event propagation.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {ol.interaction.DragAndDrop}
 * @api
 */
DragAndDrop.handleEvent = TRUE;


/**
 * @private
 */
DragAndDrop.prototype.registerListeners_ = function() {
  const map = this.getMap();
  if (map) {
    const dropArea = this.target ? this.target : map.getViewport();
    this.dropListenKeys_ = [
      listen(dropArea, EventType.DROP,
        DragAndDrop.handleDrop_, this),
      listen(dropArea, EventType.DRAGENTER,
        DragAndDrop.handleStop_, this),
      listen(dropArea, EventType.DRAGOVER,
        DragAndDrop.handleStop_, this),
      listen(dropArea, EventType.DROP,
        DragAndDrop.handleStop_, this)
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
 * @param {olx.format.ReadOptions} options Read options.
 * @private
 * @return {Array.<ol.Feature>} Features.
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


/**
 * @enum {string}
 * @private
 */
DragAndDrop.EventType_ = {
  /**
   * Triggered when features are added
   * @event ol.interaction.DragAndDrop.Event#addfeatures
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
 * @param {ol.interaction.DragAndDrop.EventType_} type Type.
 * @param {File} file File.
 * @param {Array.<ol.Feature>=} opt_features Features.
 * @param {ol.proj.Projection=} opt_projection Projection.
 */
DragAndDrop.Event = function(type, file, opt_features, opt_projection) {

  Event.call(this, type);

  /**
   * The features parsed from dropped data.
   * @type {Array.<ol.Feature>|undefined}
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
   * @type {ol.proj.Projection|undefined}
   * @api
   */
  this.projection = opt_projection;

};
inherits(DragAndDrop.Event, Event);

export default DragAndDrop;
