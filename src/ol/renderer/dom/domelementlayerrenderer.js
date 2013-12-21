goog.provide('ol.renderer.dom.ElementLayer');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('ol.layer.Element');
goog.require('ol.renderer.dom.Layer');
goog.require('ol.source.Element');



/**
 * @constructor
 * @extends {ol.renderer.dom.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Element} elementLayer Element layer.
 */
ol.renderer.dom.ElementLayer = function(mapRenderer, elementLayer) {

  var target = goog.dom.createElement(goog.dom.TagName.DIV);
  target.style.position = 'absolute';
  target.style.width = '100%';
  target.style.height = '100%';

  goog.base(this, mapRenderer, elementLayer, target);

  /**
   * @private
   * @type {Element}
   */
  this.renderedElement_ = null;

};
goog.inherits(ol.renderer.dom.ElementLayer, ol.renderer.dom.Layer);


/**
 * @inheritDoc
 */
ol.renderer.dom.ElementLayer.prototype.prepareFrame =
    function(frameState, layerState) {
  var layer = this.getLayer();
  goog.asserts.assertInstanceof(layer, ol.layer.Element);
  var elementSource = layer.getSource();
  goog.asserts.assertInstanceof(elementSource, ol.source.Element);
  var view2DState = frameState.view2DState;
  var element = elementSource.getElement(frameState.size, view2DState.center,
      view2DState.resolution, view2DState.rotation, view2DState.projection);
  if (element !== this.renderedElement_) {
    goog.dom.removeNode(this.renderedElement_);
    this.target.appendChild(element);
    this.renderedElement_ = element;
  }
};
