goog.provide('ol.control.Control');
goog.provide('ol.control.ControlOptions');

goog.require('goog.Disposable');


/**
 * @typedef {{element: (Element|undefined),
 *            map: (ol.Map|undefined),
 *            target: (Element|undefined)}}
 */
ol.control.ControlOptions;



/**
 * A thing which is painted over the map to provide a means for interaction
 * (buttons) of show annotations (status bars).
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.control.ControlOptions} controlOptions Control options.
 */
ol.control.Control = function(controlOptions) {

  goog.base(this);

  /**
   * @protected
   * @type {Element}
   */
  this.element = goog.isDef(controlOptions.element) ?
      controlOptions.element : null;

  /**
   * @private
   * @type {Element|undefined}
   */
  this.target_ = controlOptions.target;

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = null;

  if (goog.isDef(controlOptions.map)) {
    this.setMap(controlOptions.map);
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
 * Removes the control from its current map and attaches it to the new map.
 * Subtypes might also wish set up event handlers to get notified about changes
 * to the map here.
 *
 * @param {ol.Map} map Map.
 */
ol.control.Control.prototype.setMap = function(map) {
  if (!goog.isNull(this.map_)) {
    goog.dom.removeNode(this.element);
  }
  this.map_ = map;
  if (!goog.isNull(this.map_)) {
    var target = goog.isDef(this.target_) ?
        this.target_ : map.getOverlayContainer();
    goog.dom.appendChild(target, this.element);
  }
};
