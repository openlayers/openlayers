goog.provide('ol.control.Control');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('ol.MapEventType');
goog.require('ol.Object');



/**
 * @classdesc
 * A control is a visible widget with a DOM element in a fixed position on the
 * screen. They can involve user input (buttons), or be informational only;
 * the position is determined using CSS. By default these are placed in the
 * container with CSS class name `ol-overlaycontainer-stopevent`, but can use
 * any outside DOM element.
 *
 * This is the base class for controls. You can use it for simple custom
 * controls by creating the element with listeners, creating an instance:
 * ```js
 * var myControl = new ol.control.Control({element: myElement});
 * ```
 * and then adding this to the map.
 *
 * The main advantage of having this as a control rather than a simple separate
 * DOM element is that preventing propagation is handled for you. Controls
 * will also be `ol.Object`s in a `ol.Collection`, so you can use their
 * methods.
 *
 * You can also extend this base for your own control class. See
 * examples/custom-controls for an example of how to do this.
 *
 * @constructor
 * @extends {ol.Object}
 * @implements {oli.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 * @api stable
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
  this.target_ = null;

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

  /**
   * @type {function(ol.MapEvent)}
   */
  this.render = goog.isDef(options.render) ? options.render : goog.nullFunction;

  if (goog.isDef(options.target)) {
    this.setTarget(options.target);
  }

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
 * @api stable
 */
ol.control.Control.prototype.getMap = function() {
  return this.map_;
};


/**
 * Remove the control from its current map and attach it to the new map.
 * Subclasses may set up event handlers to get notified about changes to
 * the map here.
 * @param {ol.Map} map Map.
 * @api stable
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
    if (this.render !== goog.nullFunction) {
      this.listenerKeys.push(goog.events.listen(map,
          ol.MapEventType.POSTRENDER, this.render, false, this));
    }
    map.render();
  }
};


/**
 * This function is used to set a target element for the control. It has no
 * effect if it is called after the control has been added to the map (i.e.
 * after `setMap` is called on the control). If no `target` is set in the
 * options passed to the control constructor and if `setTarget` is not called
 * then the control is added to the map's overlay container.
 * @param {Element|string} target Target.
 * @api
 */
ol.control.Control.prototype.setTarget = function(target) {
  this.target_ = goog.dom.getElement(target);
};
