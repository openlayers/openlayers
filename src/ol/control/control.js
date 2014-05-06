goog.provide('ol.control.Control');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('ol.MapEventType');
goog.require('ol.Object');



/**
 * Something to be painted over the map to provide a means for interaction
 * (buttons) or to show annotations (status bars).
 *
 * @constructor
 * @extends {ol.Object}
 * @implements {oli.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 * @todo api stable
 */
ol.control.Control = function(options) {

  goog.base(this);

  /**
   * @protected
   * @type {Element}
   */
  this.element = goog.isDef(options.element) ? options.element : null;

  /**
   * @private
   * @type {Element}
   */
  this.target_ = goog.isDef(options.target) ?
      goog.dom.getElement(options.target) : null;

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = null;

  /**
   * @protected
   * @type {!Array.<?number>}
   */
  this.listenerKeys = [];

};
goog.inherits(ol.control.Control, ol.Object);


/**
 * @inheritDoc
 */
ol.control.Control.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.element);
  goog.base(this, 'disposeInternal');
};


/**
 * Get the map associated with this control.
 * @return {ol.Map} Map.
 * @todo api
 */
ol.control.Control.prototype.getMap = function() {
  return this.map_;
};


/**
 * Function called on each map render. Executes in a requestAnimationFrame
 * callback. Can be implemented in sub-classes to re-render the control's
 * UI.
 * @param {ol.MapEvent} mapEvent Map event.
 */
ol.control.Control.prototype.handleMapPostrender = goog.nullFunction;


/**
 * Remove the control from its current map and attach it to the new map.
 * Subclasses may set up event handlers to get notified about changes to
 * the map here.
 * @param {ol.Map} map Map.
 * @todo api stable
 */
ol.control.Control.prototype.setMap = function(map) {
  if (!goog.isNull(this.map_)) {
    goog.dom.removeNode(this.element);
  }
  if (!goog.array.isEmpty(this.listenerKeys)) {
    goog.array.forEach(this.listenerKeys, goog.events.unlistenByKey);
    this.listenerKeys.length = 0;
  }
  this.map_ = map;
  if (!goog.isNull(this.map_)) {
    var target = !goog.isNull(this.target_) ?
        this.target_ : map.getOverlayContainerStopEvent();
    goog.dom.appendChild(target, this.element);
    if (this.handleMapPostrender !== goog.nullFunction) {
      this.listenerKeys.push(goog.events.listen(map,
          ol.MapEventType.POSTRENDER, this.handleMapPostrender, false, this));
    }
    map.render();
  }
};
