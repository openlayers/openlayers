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
goog.require('ol.interaction.condition');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');


/**
 * @typedef {{layer: ol.layer.Layer,
 *            selected: (Array.<ol.Feature>|undefined),
 *            type: goog.events.EventType,
 *            unselected: (Array.<ol.Feature>|undefined)}}
 */
ol.control.SelectEventObject;



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.SelectOptions=} opt_options Options.
 */
ol.control.Select = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @type {boolean}
   * @private
   */
  this.active_ = false;

  /**
   * @type {ol.layer.Vector}
   * @protected
   */
  this.layer = new ol.layer.Vector({
    source: new ol.source.Vector({parser: null}),
    temp: true
  });

  /**
   * @type {Array.<ol.layer.Layer>}
   * @private
   */
  this.layers_ = options.layers;

  // TODO: css/button refactoring
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
  if (!this.active_) {
    this.active_ = true;
    goog.dom.classes.add(this.element, 'active');
    this.getMap().addLayer(this.layer);
    // TODO: Implement box selection
    this.listenerKeys.push(
        goog.events.listen(this.getMap(), ol.MapBrowserEvent.EventType.CLICK,
            this.handleClick, true, this));
  }
};


/**
 * Dectivate the control.
 */
ol.control.Select.prototype.deactivate = function() {
  if (this.active_) {
    if (!goog.array.isEmpty(this.listenerKeys)) {
      goog.array.forEach(this.listenerKeys, goog.events.unlistenByKey);
      this.listenerKeys.length = 0;
    }
    this.getMap().removeLayer(this.layer);
    goog.dom.classes.remove(this.element, 'active');
    this.active_ = false;
  }
};


/**
 * @param {ol.MapBrowserEvent} evt Event.
 */
ol.control.Select.prototype.handleClick = function(evt) {
  var clear = true;
  if (ol.interaction.condition.shiftKeyOnly(evt.browserEvent)) {
    clear = false;
  }

  function select(featuresByLayer) {
    this.select(featuresByLayer, clear);
  }

  this.getMap().getFeatures({
    layers: this.layers_,
    pixel: evt.getPixel(),
    success: goog.bind(select, this)
  });
};


/**
 * @param {Array.<Array.<ol.Feature>>} featuresByLayer Features by layer.
 * @param {boolean} clear Whether the current layer content should be cleared.
 */
ol.control.Select.prototype.select = function(featuresByLayer, clear) {
  for (var i = 0, ii = featuresByLayer.length; i < ii; ++i) {
    var features = featuresByLayer[i];
    var numFeatures = features.length;
    var selectedFeatures = [];
    var unselectedFeatures = [];
    for (var j = 0; j < numFeatures; ++j) {
      var feature = features[j];
      var selectedFeature = this.layer.getFeatureWithUid(goog.getUid(feature));
      if (selectedFeature) {
        // TODO: make toggle configurable
        unselectedFeatures.push(selectedFeature);
      } else {
        selectedFeatures.push(feature);
      }
    }
    var layer = this.layers_[i];
    if (goog.isFunction(layer.setRenderIntent)) {
      // TODO: Implement setRenderIntent for ol.layer.Vector
      layer.setRenderIntent('hidden', selectedFeatures);
      layer.setRenderIntent('default', unselectedFeatures);
    }
    if (clear) {
      this.layer.clear();
    }
    this.layer.removeFeatures(unselectedFeatures);
    this.layer.addFeatures(selectedFeatures);
    this.dispatchEvent(/** @type {ol.control.SelectEventObject} */ ({
      layer: layer,
      selected: selectedFeatures,
      type: goog.events.EventType.CHANGE,
      unselected: unselectedFeatures
    }));
  }
};
