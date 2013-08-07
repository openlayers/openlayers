goog.provide('ol.control.Select');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.control.Control');
goog.require('ol.css');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.SelectOptions=} opt_options Options.
 */
ol.control.Select = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  this.layers_ = options.layers;

  var className = goog.isDef(options.className) ? options.className :
      'ol-select';

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className + ' ' + ol.css.CLASS_UNSELECTABLE
  });
  var button = goog.dom.createDom(goog.dom.TagName.A, {
    'href': '#Select'
  });
  goog.dom.appendChild(element, button);

  goog.events.listen(element, [
    goog.events.EventType.TOUCHEND,
    goog.events.EventType.CLICK
  ], this.toggleActive_, false, this);

  goog.base(this, {
    element: element,
    map: options.map,
    target: options.target
  });
};
goog.inherits(ol.control.Select, ol.control.Control);


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.control.Select.prototype.toggleActive_ = function(browserEvent) {
  // prevent #Select anchor from getting appended to the url
  browserEvent.preventDefault();
  if (this.active_) {
    this.deactivate();
  } else {
    this.activate();
  }
};


/**
 * Activate the control.
 */
ol.control.Select.prototype.activate = function() {
  goog.dom.classes.add(this.element, 'active');
  // TODO: Add box selection
  this.listenerKeys.push(
      goog.events.listen(this.getMap(), ol.MapBrowserEvent.EventType.CLICK,
          this.handleClick, true, this));
};


/**
 * Dectivate the control.
 */
ol.control.Select.prototype.deactivate = function() {
  if (!goog.array.isEmpty(this.listenerKeys)) {
    goog.array.forEach(this.listenerKeys, goog.events.unlistenByKey);
    this.listenerKeys.length = 0;
  }
  goog.dom.classes.remove(this.element, 'active');
};


/**
 * @param {ol.MapBrowserEvent} evt Event.
 */
ol.control.Select.prototype.handleClick = function(evt) {
  this.getMap().getFeatures({
    layers: this.layers_,
    pixel: evt.getPixel(),
    success: this.select
  });
};


/**
 * @param {Array.<Array.<ol.Feature>>} featuresByLayer Features by layer.
 */
ol.control.Select.prototype.select = function(featuresByLayer) {
  // TODO: Do something with the features.
};
