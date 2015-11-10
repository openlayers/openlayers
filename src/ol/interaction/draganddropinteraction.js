// FIXME should handle all geo-referenced data, not just vector data

goog.provide('ol.interaction.DragAndDrop');
goog.provide('ol.interaction.DragAndDropEvent');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.FileDropHandler');
goog.require('goog.events.FileDropHandler.EventType');
goog.require('goog.fs.FileReader');
goog.require('goog.functions');
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

  goog.base(this, {
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
   * @type {goog.events.FileDropHandler}
   */
  this.fileDropHandler_ = null;

  /**
   * @private
   * @type {goog.events.Key|undefined}
   */
  this.dropListenKey_ = undefined;

};
goog.inherits(ol.interaction.DragAndDrop, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
ol.interaction.DragAndDrop.prototype.disposeInternal = function() {
  if (this.dropListenKey_) {
    goog.events.unlistenByKey(this.dropListenKey_);
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @param {goog.events.BrowserEvent} event Event.
 * @private
 */
ol.interaction.DragAndDrop.prototype.handleDrop_ = function(event) {
  var files = event.getBrowserEvent().dataTransfer.files;
  var i, ii, file;
  for (i = 0, ii = files.length; i < ii; ++i) {
    file = files[i];
    // The empty string param is a workaround for
    // https://code.google.com/p/closure-library/issues/detail?id=524
    var reader = goog.fs.FileReader.readAsText(file, '');
    reader.addCallback(goog.partial(this.handleResult_, file), this);
  }
};


/**
 * @param {File} file File.
 * @param {string} result Result.
 * @private
 */
ol.interaction.DragAndDrop.prototype.handleResult_ = function(file, result) {
  var map = this.getMap();
  goog.asserts.assert(map, 'map must be set');
  var projection = this.projection_;
  if (!projection) {
    var view = map.getView();
    goog.asserts.assert(view, 'map must have view');
    projection = view.getProjection();
    goog.asserts.assert(projection !== undefined,
        'projection should be defined');
  }
  var formatConstructors = this.formatConstructors_;
  var features = [];
  var i, ii;
  for (i = 0, ii = formatConstructors.length; i < ii; ++i) {
    var formatConstructor = formatConstructors[i];
    var format = new formatConstructor();
    var readFeatures = this.tryReadFeatures_(format, result);
    if (readFeatures) {
      var featureProjection = format.readProjection(result);
      var transform = ol.proj.getTransform(featureProjection, projection);
      var j, jj;
      for (j = 0, jj = readFeatures.length; j < jj; ++j) {
        var feature = readFeatures[j];
        var geometry = feature.getGeometry();
        if (geometry) {
          geometry.applyTransform(transform);
        }
        features.push(feature);
      }
    }
  }
  this.dispatchEvent(
      new ol.interaction.DragAndDropEvent(
          ol.interaction.DragAndDropEventType.ADD_FEATURES, this, file,
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
ol.interaction.DragAndDrop.handleEvent = goog.functions.TRUE;


/**
 * @inheritDoc
 */
ol.interaction.DragAndDrop.prototype.setMap = function(map) {
  if (this.dropListenKey_) {
    goog.events.unlistenByKey(this.dropListenKey_);
    this.dropListenKey_ = undefined;
  }
  if (this.fileDropHandler_) {
    goog.dispose(this.fileDropHandler_);
    this.fileDropHandler_ = null;
  }
  goog.asserts.assert(this.dropListenKey_ === undefined,
      'this.dropListenKey_ should be undefined');
  goog.base(this, 'setMap', map);
  if (map) {
    this.fileDropHandler_ = new goog.events.FileDropHandler(map.getViewport());
    this.dropListenKey_ = goog.events.listen(
        this.fileDropHandler_, goog.events.FileDropHandler.EventType.DROP,
        this.handleDrop_, false, this);
  }
};


/**
 * @param {ol.format.Feature} format Format.
 * @param {string} text Text.
 * @private
 * @return {Array.<ol.Feature>} Features.
 */
ol.interaction.DragAndDrop.prototype.tryReadFeatures_ = function(format, text) {
  try {
    return format.readFeatures(text);
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
 * @extends {goog.events.Event}
 * @implements {oli.interaction.DragAndDropEvent}
 * @param {ol.interaction.DragAndDropEventType} type Type.
 * @param {Object} target Target.
 * @param {File} file File.
 * @param {Array.<ol.Feature>=} opt_features Features.
 * @param {ol.proj.Projection=} opt_projection Projection.
 */
ol.interaction.DragAndDropEvent =
    function(type, target, file, opt_features, opt_projection) {

  goog.base(this, type, target);

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
goog.inherits(ol.interaction.DragAndDropEvent, goog.events.Event);
