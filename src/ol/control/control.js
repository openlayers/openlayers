goog.provide('ol.control.Control');
goog.provide('ol.control.ControlProperty');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('ol.MapEventType');
goog.require('ol.Object');


/**
 * @enum {string}
 */
ol.control.ControlProperty = {
  MAP: 'map'
};



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
 * @param {olx.control.ControlOptions} options Control options.
 * @api stable
 */
ol.control.Control = function(options) {

  /**
   * @type {Object.<string, *>}
   */
  var values = {};
  values[ol.control.ControlProperty.MAP] = null;

  goog.base(this, values);

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
   * @protected
   * @type {!Array.<?number>}
   */
  this.listenerKeys = [];

  goog.events.listen(this,
      ol.Object.getChangeEventType(ol.control.ControlProperty.MAP),
      this.handleMapChangedBase_, false, this);

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
 * @observable
 * @api stable
 */
ol.control.Control.prototype.getMap = function() {
  return /** @type {ol.Map} */ (
      this.get(ol.control.ControlProperty.MAP));
};
goog.exportProperty(
    ol.control.Control.prototype,
    'getMap',
    ol.control.Control.prototype.getMap);


/**
 * Function called on each map render. Executes in a requestAnimationFrame
 * callback. Can be implemented in sub-classes to re-render the control's
 * UI.
 * @param {ol.MapEvent} mapEvent Map event.
 */
ol.control.Control.prototype.handleMapPostrender = goog.nullFunction;


/**
 * @param {ol.Map} map Map.
 * @observable
 */
ol.control.Control.prototype.setMap = function(map) {
  this.set(ol.control.ControlProperty.MAP, map);
};
goog.exportProperty(
    ol.control.Control.prototype,
    'setMap',
    ol.control.Control.prototype.setMap);


/**
 * Remove the control from its current map and attach it to the new
 * map.  "Base" is appended to the function name so that subclasses
 * can use "handleMapChanged_" as their change:map listener.
 * @param {ol.ObjectEvent} e Object event.
 * @private
 */
ol.control.Control.prototype.handleMapChangedBase_ = function(e) {
  var oldMap = /** @type {ol.Map} */ (e.oldValue);
  if (!goog.isNull(oldMap)) {
    goog.dom.removeNode(this.element);
  }
  if (!goog.array.isEmpty(this.listenerKeys)) {
    goog.array.forEach(this.listenerKeys, goog.events.unlistenByKey);
    this.listenerKeys.length = 0;
  }
  var newMap = this.getMap();
  if (!goog.isNull(newMap)) {
    var target = !goog.isNull(this.target_) ?
        this.target_ : newMap.getOverlayContainerStopEvent();
    goog.dom.appendChild(target, this.element);
    if (this.handleMapPostrender !== goog.nullFunction) {
      this.listenerKeys.push(goog.events.listen(newMap,
          ol.MapEventType.POSTRENDER, this.handleMapPostrender, false, this));
    }
    newMap.render();
  }
};
