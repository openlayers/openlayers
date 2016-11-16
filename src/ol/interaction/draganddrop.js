// FIXME should handle all geo-referenced data, not just vector data

goog.provide('ol.interaction.DragAndDrop');
goog.provide('ol.interaction.DragAndDropEvent');

goog.require('ol');
goog.require('ol.functions');
goog.require('ol.events');
goog.require('ol.events.Event');
goog.require('ol.events.EventType');
goog.require('ol.interaction.Interaction');
goog.require('ol.proj');


/**
 * @classdesc
 * Handles input of vector data by drag and drop.
 *
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @fires ol.interaction.DragAndDropEvent
 * @param {olx.interaction.DragAndDropOptions=} opt_options Options.
 * @api stable
 */
ol.interaction.DragAndDrop = function(opt_options) {

  var options = opt_options ? opt_options : {};

  ol.interaction.Interaction.call(this, {
    handleEvent: ol.interaction.DragAndDrop.handleEvent
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
      ol.proj.get(options.projection) : null;

  /**
   * @private
   * @type {Array.<ol.EventsKey>}
   */
  this.dropListenKeys_ = null;

  /**
   * @private
   * @type {Element}
   */
  this.target = options.target ? options.target : null;

};
ol.inherits(ol.interaction.DragAndDrop, ol.interaction.Interaction);


/**
 * @param {Event} event Event.
 * @this {ol.interaction.DragAndDrop}
 * @private
 */
ol.interaction.DragAndDrop.handleDrop_ = function(event) {
  var files = event.dataTransfer.files;
  var i, ii, file;
  for (i = 0, ii = files.length; i < ii; ++i) {
    file = files.item(i);
    var reader = new FileReader();
    reader.addEventListener(ol.events.EventType.LOAD,
        this.handleResult_.bind(this, file));
    reader.readAsText(file);
  }
};


/**
 * @param {Event} event Event.
 * @private
 */
ol.interaction.DragAndDrop.handleStop_ = function(event) {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
};


/**
 * @param {File} file File.
 * @param {Event} event Load event.
 * @private
 */
ol.interaction.DragAndDrop.prototype.handleResult_ = function(file, event) {
  var result = event.target.result;
  var map = this.getMap();
  var projection = this.projection_;
  if (!projection) {
    var view = map.getView();
    projection = view.getProjection();
    goog.DEBUG && console.assert(projection !== undefined,
        'projection should be defined');
  }
  var formatConstructors = this.formatConstructors_;
  var features = [];
  var i, ii;
  for (i = 0, ii = formatConstructors.length; i < ii; ++i) {
    var formatConstructor = formatConstructors[i];
    var format = new formatConstructor();
    features = this.tryReadFeatures_(format, result, {
      featureProjection: projection
    });
    if (features && features.length > 0) {
      break;
    }
  }
  this.dispatchEvent(
      new ol.interaction.DragAndDropEvent(
          ol.interaction.DragAndDropEventType.ADD_FEATURES, file,
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
ol.interaction.DragAndDrop.handleEvent = ol.functions.TRUE;


/**
 * @inheritDoc
 */
ol.interaction.DragAndDrop.prototype.setMap = function(map) {
  if (this.dropListenKeys_) {
    this.dropListenKeys_.forEach(ol.events.unlistenByKey);
    this.dropListenKeys_ = null;
  }
  ol.interaction.Interaction.prototype.setMap.call(this, map);
  if (map) {
    var dropArea = this.target ? this.target : map.getViewport();
    this.dropListenKeys_ = [
      ol.events.listen(dropArea, ol.events.EventType.DROP,
          ol.interaction.DragAndDrop.handleDrop_, this),
      ol.events.listen(dropArea, ol.events.EventType.DRAGENTER,
          ol.interaction.DragAndDrop.handleStop_, this),
      ol.events.listen(dropArea, ol.events.EventType.DRAGOVER,
          ol.interaction.DragAndDrop.handleStop_, this),
      ol.events.listen(dropArea, ol.events.EventType.DROP,
          ol.interaction.DragAndDrop.handleStop_, this)
    ];
  }
};


/**
 * @param {ol.format.Feature} format Format.
 * @param {string} text Text.
 * @param {olx.format.ReadOptions} options Read options.
 * @private
 * @return {Array.<ol.Feature>} Features.
 */
ol.interaction.DragAndDrop.prototype.tryReadFeatures_ = function(format, text, options) {
  try {
    return format.readFeatures(text, options);
  } catch (e) {
    return null;
  }
};


/**
 * @enum {string}
 */
ol.interaction.DragAndDropEventType = {
  /**
   * Triggered when features are added
   * @event ol.interaction.DragAndDropEvent#addfeatures
   * @api stable
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
 * @param {Array.<ol.Feature>=} opt_features Features.
 * @param {ol.proj.Projection=} opt_projection Projection.
 */
ol.interaction.DragAndDropEvent = function(type, file, opt_features, opt_projection) {

  ol.events.Event.call(this, type);

  /**
   * The features parsed from dropped data.
   * @type {Array.<ol.Feature>|undefined}
   * @api stable
   */
  this.features = opt_features;

  /**
   * The dropped file.
   * @type {File}
   * @api stable
   */
  this.file = file;

  /**
   * The feature projection.
   * @type {ol.proj.Projection|undefined}
   * @api
   */
  this.projection = opt_projection;

};
ol.inherits(ol.interaction.DragAndDropEvent, ol.events.Event);
