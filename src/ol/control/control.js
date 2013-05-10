goog.provide('ol.control.Control');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('ol.MapEventType');



/**
 * A thing which is painted over the map to provide a means for interaction
 * (buttons) of show annotations (status bars).
 *
 * @constructor
 * @extends {goog.Disposable}
 * @implements {oli.control.Control}
 * @param {ol.control.ControlOptions} options Control options.
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
   * @type {Element|undefined}
   */
  this.target_ = options.target;

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

  if (goog.isDef(options.map)) {
    this.setMap(options.map);
  }

};
goog.inherits(ol.control.Control, goog.Disposable);


/**
 * @inheritDoc
 */
ol.control.Control.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.element);
  goog.base(this, 'disposeInternal');
};


/**
 * @return {ol.Map} Map.
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
ol.control.Control.prototype.handleMapPostrender = function(mapEvent) {};


/**
 * Remove the control from its current map and attach it to the new map.
 * Subclasses may set up event handlers to get notified about changes to
 * the map here.
 * @param {ol.Map} map Map.
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
    var target = goog.isDef(this.target_) ?
        this.target_ : map.getOverlayContainer();
    goog.dom.appendChild(target, this.element);
    if (this.handleMapPostrender !==
        ol.control.Control.prototype.handleMapPostrender) {
      this.listenerKeys.push(goog.events.listen(map,
          ol.MapEventType.POSTRENDER, this.handleMapPostrender, false, this));
    }
  }
};
