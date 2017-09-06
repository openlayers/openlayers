import _ol_ from '../index';
import _ol_MapEventType_ from '../mapeventtype';
import _ol_Object_ from '../object';
import _ol_dom_ from '../dom';
import _ol_events_ from '../events';

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
 * @api
 */
var _ol_control_Control_ = function(options) {

  _ol_Object_.call(this);

  /**
   * @protected
   * @type {Element}
   */
  this.element = options.element ? options.element : null;

  /**
   * @private
   * @type {Element}
   */
  this.target_ = null;

  /**
   * @private
   * @type {ol.PluggableMap}
   */
  this.map_ = null;

  /**
   * @protected
   * @type {!Array.<ol.EventsKey>}
   */
  this.listenerKeys = [];

  /**
   * @type {function(ol.MapEvent)}
   */
  this.render = options.render ? options.render : _ol_.nullFunction;

  if (options.target) {
    this.setTarget(options.target);
  }

};

_ol_.inherits(_ol_control_Control_, _ol_Object_);


/**
 * @inheritDoc
 */
_ol_control_Control_.prototype.disposeInternal = function() {
  _ol_dom_.removeNode(this.element);
  _ol_Object_.prototype.disposeInternal.call(this);
};


/**
 * Get the map associated with this control.
 * @return {ol.PluggableMap} Map.
 * @api
 */
_ol_control_Control_.prototype.getMap = function() {
  return this.map_;
};


/**
 * Remove the control from its current map and attach it to the new map.
 * Subclasses may set up event handlers to get notified about changes to
 * the map here.
 * @param {ol.PluggableMap} map Map.
 * @override
 * @api
 */
_ol_control_Control_.prototype.setMap = function(map) {
  if (this.map_) {
    _ol_dom_.removeNode(this.element);
  }
  for (var i = 0, ii = this.listenerKeys.length; i < ii; ++i) {
    _ol_events_.unlistenByKey(this.listenerKeys[i]);
  }
  this.listenerKeys.length = 0;
  this.map_ = map;
  if (this.map_) {
    var target = this.target_ ?
      this.target_ : map.getOverlayContainerStopEvent();
    target.appendChild(this.element);
    if (this.render !== _ol_.nullFunction) {
      this.listenerKeys.push(_ol_events_.listen(map,
          _ol_MapEventType_.POSTRENDER, this.render, this));
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
_ol_control_Control_.prototype.setTarget = function(target) {
  this.target_ = typeof target === 'string' ?
    document.getElementById(target) :
    target;
};
export default _ol_control_Control_;
