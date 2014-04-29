goog.provide('ol.control.Logo');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.object');
goog.require('goog.style');
goog.require('ol.control.Control');
goog.require('ol.css');



/**
 * Shows a logo for all the layer sources in the map that have a logo
 * associated with them, such as Bing. This control is part of a default map.
 * By default it will show in the bottom-left portion of the map, but it can
 * be styled by using a css selector for `.ol-logo`.
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.LogoOptions=} opt_options Logo options.
 * @todo api
 */
ol.control.Logo = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {Element}
   */
  this.ulElement_ = goog.dom.createElement(goog.dom.TagName.UL);

  var className = goog.isDef(options.className) ? options.className : 'ol-logo';

  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className + ' ' + ol.css.CLASS_UNSELECTABLE
  }, this.ulElement_);

  goog.base(this, {
    element: element,
    target: options.target
  });

  /**
   * @private
   * @type {boolean}
   */
  this.renderedVisible_ = true;

  /**
   * @private
   * @type {Object.<string, Element>}
   */
  this.logoElements_ = {};

};
goog.inherits(ol.control.Logo, ol.control.Control);


/**
 * @param {ol.MapEvent} mapEvent Map event.
 */
ol.control.Logo.prototype.handleMapPostrender = function(mapEvent) {
  this.updateElement_(mapEvent.frameState);
};


/**
 * @param {?oli.FrameState} frameState Frame state.
 * @private
 */
ol.control.Logo.prototype.updateElement_ = function(frameState) {

  if (goog.isNull(frameState)) {
    if (this.renderedVisible_) {
      goog.style.setElementShown(this.element, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  var logo;
  var logos = frameState.logos;
  var logoElements = this.logoElements_;

  for (logo in logoElements) {
    if (!(logo in logos)) {
      goog.dom.removeNode(logoElements[logo]);
      delete logoElements[logo];
    }
  }

  var image, logoElement, logoKey;
  for (logoKey in logos) {
    if (!(logoKey in logoElements)) {
      image = new Image();
      image.src = logoKey;
      var logoValue = logos[logoKey];
      var child;
      if (logoValue === '') {
        child = image;
      } else {
        child = goog.dom.createDom(goog.dom.TagName.A, {
          'href': logoValue,
          'target': '_blank'
        });
        child.appendChild(image);
      }
      logoElement = goog.dom.createDom(goog.dom.TagName.LI, undefined, child);
      goog.dom.appendChild(this.ulElement_, logoElement);
      logoElements[logoKey] = logoElement;
    }
  }

  var renderVisible = !goog.object.isEmpty(logos);
  if (this.renderedVisible_ != renderVisible) {
    goog.style.setElementShown(this.element, renderVisible);
    this.renderedVisible_ = renderVisible;
  }

};
