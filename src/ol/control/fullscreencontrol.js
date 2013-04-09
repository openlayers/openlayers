goog.provide('ol.control.FullScreen');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.dom.fullscreen');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.control.Control');
goog.require('ol.css');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.FullScreenOptions=} opt_options Options.
 */
ol.control.FullScreen = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {string}
   */
  this.cssClassName_ = 'ol-full-screen';

  var aElement = goog.dom.createDom(goog.dom.TagName.A, {
    'href': '#fullScreen',
    'class': this.cssClassName_ + '-' + goog.dom.fullscreen.isFullScreen()
  });
  goog.events.listen(aElement, [
    goog.events.EventType.CLICK,
    goog.events.EventType.TOUCHEND
  ], this.handleClick_, false, this);

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': this.cssClassName_ + ' ' + ol.css.CLASS_UNSELECTABLE
  }, aElement);

  goog.base(this, {
    element: element,
    map: options.map,
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
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @private
 */
ol.control.FullScreen.prototype.handleClick_ = function(browserEvent) {
  browserEvent.preventDefault();
  var map = this.getMap();
  if (goog.isNull(map)) {
    return;
  }
  if (!goog.dom.fullscreen.isSupported()) {
    return;
  }
  var opened = this.cssClassName_ + '-true';
  var closed = this.cssClassName_ + '-false';
  var anchor = goog.dom.getFirstElementChild(this.element);
  if (goog.dom.fullscreen.isFullScreen()) {
    goog.dom.classes.swap(anchor, opened, closed);
    goog.dom.fullscreen.exitFullScreen();
  } else {
    var element = map.getTarget();
    goog.asserts.assert(!goog.isNull(element));
    goog.dom.classes.swap(anchor, closed, opened);
    if (this.keys_) {
      goog.dom.fullscreen.requestFullScreenWithKeys(element);
    } else {
      goog.dom.fullscreen.requestFullScreen(element);
    }
  }
};
