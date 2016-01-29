goog.provide('ol.control.FullScreen');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.dom.fullscreen');
goog.require('goog.dom.fullscreen.EventType');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol');
goog.require('ol.control.Control');
goog.require('ol.css');


/**
 * @classdesc
 * Provides a button that when clicked fills up the full screen with the map.
 * The full screen source element is by default the element containing the map viewport unless
 * overriden by providing the `source` option. In which case, the dom
 * element introduced using this parameter will be displayed in full screen.
 *
 * When in full screen mode, a close button is shown to exit full screen mode.
 * The [Fullscreen API](http://www.w3.org/TR/fullscreen/) is used to
 * toggle the map in full screen mode.
 *
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.FullScreenOptions=} opt_options Options.
 * @api stable
 */
ol.control.FullScreen = function(opt_options) {

  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {string}
   */
  this.cssClassName_ = options.className ? options.className : 'ol-full-screen';

  var label = options.label ? options.label : '\u2922';

  /**
   * @private
   * @type {Node}
   */
  this.labelNode_ = goog.isString(label) ?
      document.createTextNode(label) : label;

  var labelActive = options.labelActive ? options.labelActive : '\u00d7';

  /**
   * @private
   * @type {Node}
   */
  this.labelActiveNode_ = goog.isString(labelActive) ?
      document.createTextNode(labelActive) : labelActive;

  var tipLabel = options.tipLabel ? options.tipLabel : 'Toggle full-screen';
  var button = goog.dom.createDom('BUTTON', {
    'class': this.cssClassName_ + '-' + goog.dom.fullscreen.isFullScreen(),
    'type': 'button',
    'title': tipLabel
  }, this.labelNode_);

  ol.events.listen(button, ol.events.EventType.CLICK,
      this.handleClick_, false, this);

  ol.events.listen(goog.global.document,
      goog.dom.fullscreen.EventType.CHANGE,
      this.handleFullScreenChange_, false, this);

  var cssClasses = this.cssClassName_ + ' ' + ol.css.CLASS_UNSELECTABLE +
      ' ' + ol.css.CLASS_CONTROL + ' ' +
      (!goog.dom.fullscreen.isSupported() ? ol.css.CLASS_UNSUPPORTED : '');
  var element = goog.dom.createDom('DIV', cssClasses, button);

  goog.base(this, {
    element: element,
    target: options.target
  });

  /**
   * @private
   * @type {boolean}
   */
  this.keys_ = options.keys !== undefined ? options.keys : false;

  /**
   * @private
   * @type {Element|string|undefined}
   */
  this.source_ = options.source;

};
goog.inherits(ol.control.FullScreen, ol.control.Control);


/**
 * @param {Event} event The event to handle
 * @private
 */
ol.control.FullScreen.prototype.handleClick_ = function(event) {
  event.preventDefault();
  this.handleFullScreen_();
};


/**
 * @private
 */
ol.control.FullScreen.prototype.handleFullScreen_ = function() {
  if (!goog.dom.fullscreen.isSupported()) {
    return;
  }
  var map = this.getMap();
  if (!map) {
    return;
  }
  if (goog.dom.fullscreen.isFullScreen()) {
    goog.dom.fullscreen.exitFullScreen();
  } else {
    var element = this.source_ ?
        goog.dom.getElement(this.source_) : map.getTargetElement();
    goog.asserts.assert(element, 'element should be defined');
    if (this.keys_) {
      goog.dom.fullscreen.requestFullScreenWithKeys(element);
    } else {
      goog.dom.fullscreen.requestFullScreen(element);
    }
  }
};


/**
 * @private
 */
ol.control.FullScreen.prototype.handleFullScreenChange_ = function() {
  var opened = this.cssClassName_ + '-true';
  var closed = this.cssClassName_ + '-false';
  var button = goog.dom.getFirstElementChild(this.element);
  var map = this.getMap();
  if (goog.dom.fullscreen.isFullScreen()) {
    goog.dom.classlist.swap(button, closed, opened);
    goog.dom.replaceNode(this.labelActiveNode_, this.labelNode_);
  } else {
    goog.dom.classlist.swap(button, opened, closed);
    goog.dom.replaceNode(this.labelNode_, this.labelActiveNode_);
  }
  if (map) {
    map.updateSize();
  }
};
