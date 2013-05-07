// FIXME handle date line wrap

goog.provide('ol.control.Attribution');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.object');
goog.require('goog.style');
goog.require('ol.Attribution');
goog.require('ol.FrameState');
goog.require('ol.TileRange');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.source.Source');



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.AttributionOptions=} opt_options Attribution options.
 */
ol.control.Attribution = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {Element}
   */
  this.ulElement_ = goog.dom.createElement(goog.dom.TagName.UL);

  var className = goog.isDef(options.className) ?
      options.className : 'ol-attribution';
  var element = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className + ' ' + ol.css.CLASS_UNSELECTABLE
  }, this.ulElement_);

  goog.base(this, {
    element: element,
    map: options.map,
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
  this.attributionElements_ = {};

  /**
   * @private
   * @type {Object.<string, boolean>}
   */
  this.attributionElementRenderedVisible_ = {};

};
goog.inherits(ol.control.Attribution, ol.control.Control);


/**
 * @param {?Object.<string, Object.<string, ol.TileRange>>} usedTiles Used
 *     tiles.
 * @param {Object.<string, ol.source.Source>} sources Sources.
 * @return {Object.<string, ol.Attribution>} Attributions.
 */
ol.control.Attribution.prototype.getTileSourceAttributions =
    function(usedTiles, sources) {
  /** @type {Object.<string, ol.Attribution>} */
  var attributions = {};
  var i, ii, tileRanges, tileSource, tileSourceAttribution,
      tileSourceAttributionKey, tileSourceAttributions, tileSourceKey, z;
  for (tileSourceKey in usedTiles) {
    goog.asserts.assert(tileSourceKey in sources);
    tileSource = sources[tileSourceKey];
    tileSourceAttributions = tileSource.getAttributions();
    if (goog.isNull(tileSourceAttributions)) {
      continue;
    }
    tileRanges = usedTiles[tileSourceKey];
    for (i = 0, ii = tileSourceAttributions.length; i < ii; ++i) {
      tileSourceAttribution = tileSourceAttributions[i];
      tileSourceAttributionKey = goog.getUid(tileSourceAttribution).toString();
      if (tileSourceAttributionKey in attributions) {
        continue;
      }
      if (tileSourceAttribution.intersectsAnyTileRange(tileRanges)) {
        attributions[tileSourceAttributionKey] = tileSourceAttribution;
      }
    }
  }
  return attributions;
};


/**
 * @inheritDoc
 */
ol.control.Attribution.prototype.handleMapPostrender = function(mapEvent) {
  this.updateElement_(mapEvent.frameState);
};


/**
 * @private
 * @param {?ol.FrameState} frameState Frame state.
 */
ol.control.Attribution.prototype.updateElement_ = function(frameState) {

  if (goog.isNull(frameState)) {
    if (this.renderedVisible_) {
      goog.style.showElement(this.element, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  var map = this.getMap();

  /** @type {Object.<string, boolean>} */
  var attributionsToRemove = {};
  /** @type {Object.<string, ol.source.Source>} */
  var sources = {};
  var layers = map.getLayers();
  if (goog.isDef(layers)) {
    layers.forEach(function(layer) {
      var source = layer.getSource();
      sources[goog.getUid(source).toString()] = source;
      var attributions = source.getAttributions();
      if (!goog.isNull(attributions)) {
        var attribution, i, ii;
        for (i = 0, ii = attributions.length; i < ii; ++i) {
          attribution = attributions[i];
          attributionKey = goog.getUid(attribution).toString();
          attributionsToRemove[attributionKey] = true;
        }
      }
    });
  }

  /** @type {Object.<string, ol.Attribution>} */
  var attributions = goog.object.clone(frameState.attributions);
  var tileSourceAttributions = this.getTileSourceAttributions(
      frameState.usedTiles, sources);
  goog.object.extend(attributions, tileSourceAttributions);

  /** @type {Array.<number>} */
  var attributionKeys =
      goog.array.map(goog.object.getKeys(attributions), Number);
  goog.array.sort(attributionKeys);
  var i, ii, attributionElement, attributionKey;
  for (i = 0, ii = attributionKeys.length; i < ii; ++i) {
    attributionKey = attributionKeys[i].toString();
    if (attributionKey in this.attributionElements_) {
      if (!this.attributionElementRenderedVisible_[attributionKey]) {
        goog.style.showElement(this.attributionElements_[attributionKey], true);
        this.attributionElementRenderedVisible_[attributionKey] = true;
      }
    } else {
      attributionElement = goog.dom.createElement(goog.dom.TagName.LI);
      attributionElement.innerHTML = attributions[attributionKey].getHTML();
      goog.dom.appendChild(this.ulElement_, attributionElement);
      this.attributionElements_[attributionKey] = attributionElement;
      this.attributionElementRenderedVisible_[attributionKey] = true;
    }
    delete attributionsToRemove[attributionKey];
  }

  for (attributionKey in attributionsToRemove) {
    goog.dom.removeNode(this.attributionElements_[attributionKey]);
    delete this.attributionElements_[attributionKey];
    delete this.attributionElementRenderedVisible_[attributionKey];
  }

  var renderVisible = !goog.array.isEmpty(attributionKeys);
  if (this.renderedVisible_ != renderVisible) {
    goog.style.showElement(this.element, renderVisible);
    this.renderedVisible_ = renderVisible;
  }

};
