goog.provide('ol.layer.Layer');

goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol');
goog.require('ol.Object');
goog.require('ol.layer.Base');
goog.require('ol.obj');
goog.require('ol.render.Event');
goog.require('ol.source.State');


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * A visual representation of raster or vector map data.
 * Layers group together those properties that pertain to how the data is to be
 * displayed, irrespective of the source of that data.
 *
 * Layers are usually added to a map with {@link ol.Map#addLayer}. Components
 * like {@link ol.interaction.Select} use unmanaged layers internally. These
 * unmanaged layers are associated with the map using
 * {@link ol.layer.Layer#setMap} instead.
 *
 * A generic `change` event is fired when the state of the source changes.
 *
 * @constructor
 * @extends {ol.layer.Base}
 * @fires ol.render.Event
 * @param {olx.layer.LayerOptions} options Layer options.
 * @api stable
 */
ol.layer.Layer = function(options) {

  var baseOptions = ol.obj.assign({}, options);
  delete baseOptions.source;

  ol.layer.Base.call(this, /** @type {olx.layer.BaseOptions} */ (baseOptions));

  /**
   * @private
   * @type {?ol.EventsKey}
   */
  this.mapPrecomposeKey_ = null;

  /**
   * @private
   * @type {?ol.EventsKey}
   */
  this.mapRenderKey_ = null;

  /**
   * @private
   * @type {?ol.EventsKey}
   */
  this.sourceChangeKey_ = null;

  if (options.map) {
    this.setMap(options.map);
  }

  ol.events.listen(this,
      ol.Object.getChangeEventType(ol.layer.Base.Property.SOURCE),
      this.handleSourcePropertyChange_, this);

  var source = options.source ? options.source : null;
  this.setSource(source);
};
ol.inherits(ol.layer.Layer, ol.layer.Base);


/**
 * Return `true` if the layer is visible, and if the passed resolution is
 * between the layer's minResolution and maxResolution. The comparison is
 * inclusive for `minResolution` and exclusive for `maxResolution`.
 * @param {ol.LayerState} layerState Layer state.
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
  var array = opt_array ? opt_array : [];
  array.push(this);
  return array;
};


/**
 * @inheritDoc
 */
ol.layer.Layer.prototype.getLayerStatesArray = function(opt_states) {
  var states = opt_states ? opt_states : [];
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
  var source = this.get(ol.layer.Base.Property.SOURCE);
  return /** @type {ol.source.Source} */ (source) || null;
};


/**
  * @inheritDoc
  */
ol.layer.Layer.prototype.getSourceState = function() {
  var source = this.getSource();
  return !source ? ol.source.State.UNDEFINED : source.getState();
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
  if (this.sourceChangeKey_) {
    ol.events.unlistenByKey(this.sourceChangeKey_);
    this.sourceChangeKey_ = null;
  }
  var source = this.getSource();
  if (source) {
    this.sourceChangeKey_ = ol.events.listen(source,
        ol.events.EventType.CHANGE, this.handleSourceChange_, this);
  }
  this.changed();
};


/**
 * Sets the layer to be rendered on top of other layers on a map. The map will
 * not manage this layer in its layers collection, and the callback in
 * {@link ol.Map#forEachLayerAtPixel} will receive `null` as layer. This
 * is useful for temporary layers. To remove an unmanaged layer from the map,
 * use `#setMap(null)`.
 *
 * To add the layer to a map and have it managed by the map, use
 * {@link ol.Map#addLayer} instead.
 * @param {ol.Map} map Map.
 * @api
 */
ol.layer.Layer.prototype.setMap = function(map) {
  if (this.mapPrecomposeKey_) {
    ol.events.unlistenByKey(this.mapPrecomposeKey_);
    this.mapPrecomposeKey_ = null;
  }
  if (!map) {
    this.changed();
  }
  if (this.mapRenderKey_) {
    ol.events.unlistenByKey(this.mapRenderKey_);
    this.mapRenderKey_ = null;
  }
  if (map) {
    this.mapPrecomposeKey_ = ol.events.listen(
        map, ol.render.Event.Type.PRECOMPOSE, function(evt) {
          var layerState = this.getLayerState();
          layerState.managed = false;
          layerState.zIndex = Infinity;
          evt.frameState.layerStatesArray.push(layerState);
          evt.frameState.layerStates[ol.getUid(this)] = layerState;
        }, this);
    this.mapRenderKey_ = ol.events.listen(
        this, ol.events.EventType.CHANGE, map.render, map);
    this.changed();
  }
};


/**
 * Set the layer source.
 * @param {ol.source.Source} source The layer source.
 * @observable
 * @api stable
 */
ol.layer.Layer.prototype.setSource = function(source) {
  this.set(ol.layer.Base.Property.SOURCE, source);
};
