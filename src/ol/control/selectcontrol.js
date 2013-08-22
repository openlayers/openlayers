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
goog.require('ol.layer.VectorLayerRenderIntent');
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
   * Mapping between original features and cloned features on selection layers.
   * @type {Object.<*,Object.<string,ol.Feature>>}
   * @private
   */
  this.featureMap_ = {};

  /**
   * Mapping between original layers and selection layers.
   * @type {Object.<*,ol.layer.Vector>}
   * @protected
   */
  this.selectionLayers = {};

  /**
   * @type {null|function(ol.layer.Layer):boolean}
   * @private
   */
  this.layerFilter_ = goog.isDef(options.layerFilter) ?
      options.layerFilter : null;

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
    var map = this.getMap();
    for (var i in this.selectionLayers) {
      map.addLayer(this.selectionLayers[i]);
    }

    // TODO: Implement box selection
    this.listenerKeys.push(
        goog.events.listen(map, ol.MapBrowserEvent.EventType.CLICK,
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
    var map = this.getMap();
    for (var i in this.selectionLayers) {
      map.removeLayer(this.selectionLayers[i]);
    }
    goog.dom.classes.remove(this.element, 'active');
    this.active_ = false;
  }
};


/**
 * @param {ol.MapBrowserEvent} evt Event.
 */
ol.control.Select.prototype.handleClick = function(evt) {
  var map = this.getMap();
  var layers = map.getLayerGroup().getLayersArray();
  if (!goog.isNull(this.layerFilter_)) {
    layers = goog.array.filter(layers, this.layerFilter_);
  }
  var clear = !ol.interaction.condition.shiftKeyOnly(evt.browserEvent);

  function select(featuresByLayer) {
    this.select(featuresByLayer, layers, clear);
  }

  map.getFeatures({
    layers: layers,
    pixel: evt.getPixel(),
    success: goog.bind(select, this)
  });
};


/**
 * @param {Array.<Array.<ol.Feature>>} featuresByLayer Features by layer.
 * @param {Array.<ol.layer.Layer>} layers The queried layers.
 * @param {boolean} clear Whether the current layer content should be cleared.
 */
ol.control.Select.prototype.select = function(featuresByLayer, layers, clear) {
  for (var i = 0, ii = featuresByLayer.length; i < ii; ++i) {
    var layer = layers[i];
    var layerId = goog.getUid(layer);
    var selectionLayer = this.selectionLayers[layerId];
    if (!goog.isDef(selectionLayer)) {
      selectionLayer = new ol.layer.Vector({
        source: new ol.source.Vector({parser: null}),
        style: layer.getStyle()
      });
      selectionLayer.setTemporary(true);
      this.getMap().addLayer(selectionLayer);
      this.selectionLayers[layerId] = selectionLayer;
      this.featureMap_[layerId] = {};
    }

    var features = featuresByLayer[i];
    var numFeatures = features.length;
    var selectedFeatures = [];
    var featuresToAdd = [];
    var unselectedFeatures = [];
    var featuresToRemove = [];
    var featureMap = this.featureMap_[layerId];
    for (var j = 0; j < numFeatures; ++j) {
      var feature = features[j];
      var featureId = goog.getUid(feature);
      var clone = featureMap[featureId];
      if (clone) {
        // TODO: make toggle configurable
        unselectedFeatures.push(feature);
        featuresToRemove.push(clone);
        delete featureMap[featureId];
      }
      if (clear) {
        for (var f in featureMap) {
          unselectedFeatures.push(layer.getFeatureWithUid(f));
          featuresToRemove.push(featureMap[f]);
        }
        featureMap = {};
        this.featureMap_[layerId] = featureMap;
      }
      if (!clone) {
        clone = feature.clone();
        featureMap[featureId] = clone;
        clone.renderIntent = ol.layer.VectorLayerRenderIntent.SELECTED;
        selectedFeatures.push(feature);
        featuresToAdd.push(clone);
      }
    }
    if (goog.isFunction(layer.setRenderIntent)) {
      layer.setRenderIntent(ol.layer.VectorLayerRenderIntent.HIDDEN,
          selectedFeatures);
      layer.setRenderIntent(ol.layer.VectorLayerRenderIntent.DEFAULT,
          unselectedFeatures);
    }
    selectionLayer.removeFeatures(featuresToRemove);
    selectionLayer.addFeatures(featuresToAdd);
    this.dispatchEvent(/** @type {ol.control.SelectEventObject} */ ({
      layer: layer,
      selected: selectedFeatures,
      type: goog.events.EventType.CHANGE,
      unselected: unselectedFeatures
    }));
  }
};
