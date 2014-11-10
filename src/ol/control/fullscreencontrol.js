goog.provide('ol.control.FullScreen');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classlist');
goog.require('goog.dom.fullscreen');
goog.require('goog.dom.fullscreen.EventType');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.control.Control');
goog.require('ol.css');



/**
 * @classdesc
 * Provides a button that when clicked fills up the full screen with the map.
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

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {string}
   */
  this.cssClassName_ = goog.isDef(options.className) ?
      options.className : 'ol-full-screen';

  var tipLabel = goog.isDef(options.tipLabel) ?
      options.tipLabel : 'Toggle full-screen';
  var button = goog.dom.createDom(goog.dom.TagName.BUTTON, {
    'class': this.cssClassName_ + '-' + goog.dom.fullscreen.isFullScreen(),
    'type': 'button',
    'title': tipLabel
  });

  goog.events.listen(button, goog.events.EventType.CLICK,
      this.handleClick_, false, this);

  goog.events.listen(button, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  goog.events.listen(goog.global.document,
      goog.dom.fullscreen.EventType.CHANGE,
      this.handleFullScreenChange_, false, this);

  var cssClasses = this.cssClassName_ + ' ' + ol.css.CLASS_UNSELECTABLE +
      ' ' + ol.css.CLASS_CONTROL + ' ' +
      (!goog.dom.fullscreen.isSupported() ? ol.css.CLASS_UNSUPPORTED : '');
  var element = goog.dom.createDom(goog.dom.TagName.DIV, cssClasses, button);

  goog.base(this, {
    element: element,
    target: options.target
  });

  /**
   * @private
   * @type {boolean}
   */
  this.keys_ = goog.isDef(options.keys) ? options.keys : false;

};
goog.inherits(ol.control.FullScreen, ol.control.Control);


/**
 * @param {goog.events.BrowserEvent} event The event to handle
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
  if (goog.isNull(map)) {
    return;
  }
  if (goog.dom.fullscreen.isFullScreen()) {
    goog.dom.fullscreen.exitFullScreen();
  } else {
    var target = map.getTarget();
    goog.asserts.assert(goog.isDefAndNotNull(target));
    var element = goog.dom.getElement(target);
    goog.asserts.assert(goog.isDefAndNotNull(element));
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
  var anchor = goog.dom.getFirstElementChild(this.element);
  var map = this.getMap();
  if (goog.dom.fullscreen.isFullScreen()) {
    goog.dom.classlist.swap(anchor, closed, opened);
  } else {
    goog.dom.classlist.swap(anchor, opened, closed);
  }
  if (!goog.isNull(map)) {
    map.updateSize();
  }
};
