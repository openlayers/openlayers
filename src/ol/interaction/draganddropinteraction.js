// FIXME should handle all geo-referenced data, not just vector data

goog.provide('ol.interaction.DragAndDrop');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.FileDropHandler');
goog.require('goog.events.FileDropHandler.EventType');
goog.require('goog.fs.FileReader');
goog.require('goog.functions');
goog.require('ol.interaction.Interaction');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.Vector');



/**
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {olx.interaction.DragAndDropOptions=} opt_options Options.
 */
ol.interaction.DragAndDrop = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /**
   * @private
   * @type {boolean}
   */
  this.fitView_ = goog.isDef(options.fitView) ? options.fitView : true;

  /**
   * @private
   * @type {Array.<function(new: ol.format.Format)>}
   */
  this.formatConstructors_ = goog.isDef(options.formatConstructors) ?
      options.formatConstructors : [];

  /**
   * @private
   * @type {ol.source.Vector}
   */
  this.source_ = goog.isDef(options.source) ? options.source : null;

  /**
   * @private
   * @type {ol.layer.Vector}
   */
  this.layer_ = goog.isDef(options.layer) ? options.layer : null;

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
  var i, ii;
  for (i = 0, ii = files.length; i < ii; ++i) {
    var reader = goog.fs.FileReader.readAsText(files[i]);
    reader.addCallback(this.handleResult_, this);
  }
};


/**
 * @param {string} result Result.
 * @private
 */
ol.interaction.DragAndDrop.prototype.handleResult_ = function(result) {
  var map = this.getMap();
  goog.asserts.assert(!goog.isNull(map));
  var view = map.getView();
  goog.asserts.assert(goog.isDef(view));
  var view2D = view.getView2D();
  var targetProjection;
  if (!goog.isNull(this.source_)) {
    targetProjection = this.source_.getProjection();
  } else if (!goog.isNull(this.layer_)) {
    targetProjection = this.layer_.getSource().getProjection();
  } else {
    targetProjection = view2D.getProjection();
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
      var transform = ol.proj.getTransform(featureProjection, targetProjection);
      var j, jj;
      for (j = 0, jj = readFeatures.length; j < jj; ++j) {
        var feature = readFeatures[j];
        var geometry = feature.getGeometry();
        if (!goog.isNull(geometry)) {
          geometry.transform(transform);
        }
        features.push(feature);
      }
    }
  }
  if (features.length > 0) {
    var source;
    if (!goog.isNull(this.source_)) {
      source = this.source_;
    } else if (!goog.isNull(this.layer_)) {
      source = this.layer_.getSource();
      goog.asserts.assertInstanceof(source, ol.source.Vector);
    } else {
      source = new ol.source.Vector();
    }
    for (i = 0, ii = features.length; i < ii; ++i) {
      source.addFeature(features[i]);
    }
    if (goog.isNull(this.layer_)) {
      map.getLayers().push(new ol.layer.Vector({
        source: source
      }));
    }
    if (this.fitView_) {
      view2D.fitExtent(source.getExtent(), map.getSize());
    }
  }
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
 * @param {ol.format.Format} format Format.
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
