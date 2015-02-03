goog.provide('ol.layer.Layer');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.Object');
goog.require('ol.layer.Base');
goog.require('ol.layer.LayerProperty');
goog.require('ol.source.State');



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * A visual representation of raster or vector map data.
 * Layers group together those properties that pertain to how the data is to be
 * displayed, irrespective of the source of that data.
 *
 * @constructor
 * @extends {ol.layer.Base}
 * @fires ol.render.Event
 * @fires change Triggered when the state of the source changes.
 * @param {olx.layer.LayerOptions} options Layer options.
 * @api stable
 */
ol.layer.Layer = function(options) {

  var baseOptions = goog.object.clone(options);
  delete baseOptions.source;

  goog.base(this, /** @type {olx.layer.LayerOptions} */ (baseOptions));

  /**
   * @private
   * @type {goog.events.Key}
   */
  this.sourceChangeKey_ = null;

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.layer.LayerProperty.SOURCE),
      this.handleSourcePropertyChange_, false, this);

  var source = goog.isDef(options.source) ? options.source : null;
  this.setSource(source);
};
goog.inherits(ol.layer.Layer, ol.layer.Base);


/**
 * Return `true` if the layer is visible, and if the passed resolution is
 * between the layer's minResolution and maxResolution. The comparison is
 * inclusive for `minResolution` and exclusive for `maxResolution`.
 * @param {ol.layer.LayerState} layerState Layer state.
 * @param {number} resolution Resolution.
 * @return {boolean} The layer is visible at the given resolution.
 */
ol.layer.Layer.visibleAtResolution = function(layerState, resolution) {
  return layerState.visible && resolution >= layerState.minResolution &&
      resolution < layerState.maxResolution;
};


/**
 * @inheritDoc
 */
ol.layer.Layer.prototype.getLayersArray = function(opt_array) {
  var array = goog.isDef(opt_array) ? opt_array : [];
  array.push(this);
  return array;
};


/**
 * @inheritDoc
 */
ol.layer.Layer.prototype.getLayerStatesArray = function(opt_states) {
  var states = goog.isDef(opt_states) ? opt_states : [];
  states.push(this.getLayerState());
  return states;
};


/**
 * Get the layer source.
 * @return {ol.source.Source} The layer source (or `null` if not yet set).
 * @observable
 * @api stable
 */
ol.layer.Layer.prototype.getSource = function() {
  var source = this.get(ol.layer.LayerProperty.SOURCE);
  return goog.isDef(source) ?
      /** @type {ol.source.Source} */ (source) : null;
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'getSource',
    ol.layer.Layer.prototype.getSource);


/**
  * @inheritDoc
  */
ol.layer.Layer.prototype.getSourceState = function() {
  var source = this.getSource();
  return goog.isNull(source) ? ol.source.State.UNDEFINED : source.getState();
};


/**
 * @private
 */
ol.layer.Layer.prototype.handleSourceChange_ = function() {
  this.changed();
};


/**
 * @private
 */
ol.layer.Layer.prototype.handleSourcePropertyChange_ = function() {
  if (!goog.isNull(this.sourceChangeKey_)) {
    goog.events.unlistenByKey(this.sourceChangeKey_);
    this.sourceChangeKey_ = null;
  }
  var source = this.getSource();
  if (!goog.isNull(source)) {
    this.sourceChangeKey_ = goog.events.listen(source,
        goog.events.EventType.CHANGE, this.handleSourceChange_, false, this);
  }
  this.changed();
};


/**
 * Set the layer source.
 * @param {ol.source.Source} source The layer source.
 * @observable
 * @api stable
 */
ol.layer.Layer.prototype.setSource = function(source) {
  this.set(ol.layer.LayerProperty.SOURCE, source);
};
goog.exportProperty(
    ol.layer.Layer.prototype,
    'setSource',
    ol.layer.Layer.prototype.setSource);
