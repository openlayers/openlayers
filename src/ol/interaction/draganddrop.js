// FIXME should handle all geo-referenced data, not just vector data

import _ol_ from '../index';
import _ol_functions_ from '../functions';
import _ol_events_ from '../events';
import _ol_events_Event_ from '../events/event';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_interaction_Interaction_ from '../interaction/interaction';
import _ol_proj_ from '../proj';

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
var _ol_interaction_DragAndDrop_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  _ol_interaction_Interaction_.call(this, {
    handleEvent: _ol_interaction_DragAndDrop_.handleEvent
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
    _ol_proj_.get(options.projection) : null;

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

_ol_.inherits(_ol_interaction_DragAndDrop_, _ol_interaction_Interaction_);


/**
 * @param {Event} event Event.
 * @this {ol.interaction.DragAndDrop}
 * @private
 */
_ol_interaction_DragAndDrop_.handleDrop_ = function(event) {
  var files = event.dataTransfer.files;
  var i, ii, file;
  for (i = 0, ii = files.length; i < ii; ++i) {
    file = files.item(i);
    var reader = new FileReader();
    reader.addEventListener(_ol_events_EventType_.LOAD,
        this.handleResult_.bind(this, file));
    reader.readAsText(file);
  }
};


/**
 * @param {Event} event Event.
 * @private
 */
_ol_interaction_DragAndDrop_.handleStop_ = function(event) {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
};


/**
 * @param {File} file File.
 * @param {Event} event Load event.
 * @private
 */
_ol_interaction_DragAndDrop_.prototype.handleResult_ = function(file, event) {
  var result = event.target.result;
  var map = this.getMap();
  var projection = this.projection_;
  if (!projection) {
    var view = map.getView();
    projection = view.getProjection();
  }

  var formatConstructors = this.formatConstructors_;
  var features = [];
  var i, ii;
  for (i = 0, ii = formatConstructors.length; i < ii; ++i) {
    /**
     * Avoid "cannot instantiate abstract class" error.
     * @type {Function}
     */
    var formatConstructor = formatConstructors[i];
    /**
     * @type {ol.format.Feature}
     */
    var format = new formatConstructor();
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
      new _ol_interaction_DragAndDrop_.Event(
          _ol_interaction_DragAndDrop_.EventType_.ADD_FEATURES, file,
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
_ol_interaction_DragAndDrop_.handleEvent = _ol_functions_.TRUE;


/**
 * @private
 */
_ol_interaction_DragAndDrop_.prototype.registerListeners_ = function() {
  var map = this.getMap();
  if (map) {
    var dropArea = this.target ? this.target : map.getViewport();
    this.dropListenKeys_ = [
      _ol_events_.listen(dropArea, _ol_events_EventType_.DROP,
          _ol_interaction_DragAndDrop_.handleDrop_, this),
      _ol_events_.listen(dropArea, _ol_events_EventType_.DRAGENTER,
          _ol_interaction_DragAndDrop_.handleStop_, this),
      _ol_events_.listen(dropArea, _ol_events_EventType_.DRAGOVER,
          _ol_interaction_DragAndDrop_.handleStop_, this),
      _ol_events_.listen(dropArea, _ol_events_EventType_.DROP,
          _ol_interaction_DragAndDrop_.handleStop_, this)
    ];
  }
};


/**
 * @inheritDoc
 */
_ol_interaction_DragAndDrop_.prototype.setActive = function(active) {
  _ol_interaction_Interaction_.prototype.setActive.call(this, active);
  if (active) {
    this.registerListeners_();
  } else {
    this.unregisterListeners_();
  }
};


/**
 * @inheritDoc
 */
_ol_interaction_DragAndDrop_.prototype.setMap = function(map) {
  this.unregisterListeners_();
  _ol_interaction_Interaction_.prototype.setMap.call(this, map);
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
_ol_interaction_DragAndDrop_.prototype.tryReadFeatures_ = function(format, text, options) {
  try {
    return format.readFeatures(text, options);
  } catch (e) {
    return null;
  }
};


/**
 * @private
 */
_ol_interaction_DragAndDrop_.prototype.unregisterListeners_ = function() {
  if (this.dropListenKeys_) {
    this.dropListenKeys_.forEach(_ol_events_.unlistenByKey);
    this.dropListenKeys_ = null;
  }
};


/**
 * @enum {string}
 * @private
 */
_ol_interaction_DragAndDrop_.EventType_ = {
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
_ol_interaction_DragAndDrop_.Event = function(type, file, opt_features, opt_projection) {

  _ol_events_Event_.call(this, type);

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
_ol_.inherits(_ol_interaction_DragAndDrop_.Event, _ol_events_Event_);
export default _ol_interaction_DragAndDrop_;
