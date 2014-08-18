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

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /**
   * @private
   * @type {Array.<function(new: ol.format.Feature)>}
   */
  this.formatConstructors_ = goog.isDef(options.formatConstructors) ?
      options.formatConstructors : [];

  /**
   * @private
   * @type {ol.proj.Projection}
   */
  this.reprojectTo_ = goog.isDef(options.reprojectTo) ?
      ol.proj.get(options.reprojectTo) : null;

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
  if (goog.isDef(this.dropListenKey_)) {
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
  goog.asserts.assert(!goog.isNull(map));
  var projection = this.reprojectTo_;
  if (goog.isNull(projection)) {
    var view = map.getView();
    goog.asserts.assert(goog.isDef(view));
    projection = view.getProjection();
    goog.asserts.assert(goog.isDef(projection));
  }
  var formatConstructors = this.formatConstructors_;
  var features = [];
  var i, ii;
  for (i = 0, ii = formatConstructors.length; i < ii; ++i) {
    var formatConstructor = formatConstructors[i];
    var format = new formatConstructor();
    var readFeatures = this.tryReadFeatures_(format, result);
    if (!goog.isNull(readFeatures)) {
      var featureProjection = format.readProjection(result);
      var transform = ol.proj.getTransform(featureProjection, projection);
      var j, jj;
      for (j = 0, jj = readFeatures.length; j < jj; ++j) {
        var feature = readFeatures[j];
        var geometry = feature.getGeometry();
        if (goog.isDefAndNotNull(geometry)) {
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
 * @inheritDoc
 */
ol.interaction.DragAndDrop.prototype.handleMapBrowserEvent =
    goog.functions.TRUE;


/**
 * @inheritDoc
 */
ol.interaction.DragAndDrop.prototype.setMap = function(map) {
  if (goog.isDef(this.dropListenKey_)) {
    goog.events.unlistenByKey(this.dropListenKey_);
    this.dropListenKey_ = undefined;
  }
  if (!goog.isNull(this.fileDropHandler_)) {
    goog.dispose(this.fileDropHandler_);
    this.fileDropHandler_ = null;
  }
  goog.asserts.assert(!goog.isDef(this.dropListenKey_));
  goog.base(this, 'setMap', map);
  if (!goog.isNull(map)) {
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
   * @type {Array.<ol.Feature>|undefined}
   * @api stable
   */
  this.features = opt_features;

  /**
   * @type {File}
   * @api stable
   */
  this.file = file;

  /**
   * @type {ol.proj.Projection|undefined}
   * @api
   */
  this.projection = opt_projection;

};
goog.inherits(ol.interaction.DragAndDropEvent, goog.events.Event);
