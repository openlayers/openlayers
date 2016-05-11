goog.provide('ga.Tooltip');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.net.Jsonp');
goog.require('goog.Uri');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.style');
goog.require('goog.Disposable');
goog.require('goog.events.MouseWheelEvent');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.events.MouseWheelHandler.EventType');

goog.require('ol.Overlay');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.Overlay');
goog.require('ol.layer.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Style');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Circle');
goog.require('ol.source.Vector');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.GeometryCollection');

/**
 * @constructor
 * @extends {goog.Disposable}
 */
ga.Tooltip = function() {

  goog.base(this);

  /**
   * To enable and disable the gaTooltip programmatically.
   * @type {boolean}
   */
  this.enabled_ = true;

  /**
   * @type {ol.Map}
   */
  this.map_ = null;

  /**
   * @type {goog.events.Key}
   * @private
   */
  this.mapClickListenerKey_ = null;

  /**
   * @type {Element}
   */
  this.tooltipContentElement_ = null;

  /**
   * @type {Element}
   */
  this.tooltipElement_ = null;

  /**
   * @type {ol.Overlay}
   * @private
   */
  this.overlay_ = null;

  this.vector_ = null;

  this.source_ = null;
  
  this.createOverlay_();

};
goog.inherits(ga.Tooltip, goog.Disposable);

ga.Tooltip.prototype.createOverlay_ = function() {
  var className = 'ga-tooltip';
  var setPositionStyle = function(element) {
    if (document.body.clientWidth <=  480) {
      element.style.position = 'static';
    } else {
      element.style.position = 'absolute';
    }
  };
  this.tooltipContentElement_ = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className + '-content'
  });
  goog.events.listen(this.tooltipContentElement_ , 'mousewheel',
      this.handleWheel_, false, this);
  var closeAnchor = goog.dom.createDom(goog.dom.TagName.A, {
    'class': className + '-closer'
  });
  goog.events.listen(closeAnchor, 'click',
      this.handleClose_, false, this);
  this.tooltipElement_ = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className
  }, closeAnchor, this.tooltipContentElement_);
  this.overlay_ = new ol.Overlay({
    element: this.tooltipElement_
  });
  var parentEl = this.overlay_.getElement().parentNode;
  setPositionStyle(parentEl);
  window.onresize = function() {
    setPositionStyle(parentEl);
  }
};


/**
 * @inheritDoc
 */
ga.Tooltip.prototype.disposeInternal = function() {
  this.setMap(null);
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 */
ga.Tooltip.prototype.handleClick_ = function(mapBrowserEvent) {
  this.hidePopup();
  var coordinate = mapBrowserEvent.coordinate;
  this.overlay_.setPosition(coordinate);
  var size = this.map_.getSize();
  var extent = this.map_.getView().calculateExtent(/** @type {ol.Size} */ (size));
  var jsonp = new goog.net.Jsonp(
    new goog.Uri( window['GeoAdmin']['serviceUrl'] + '/rest/services/api/MapServer/identify'),
      'callback');
  var layerList = new Array();
  var layer;
  for (var i = 0, ii = this.map_.getLayers().getArray().length; i < ii; i++) {
    layer = this.map_.getLayers().getArray()[i];
    if (layer.internal_tooltip && layer.getVisible() && layer.internal_id) {
      layerList.push(layer.internal_id);
    }
  }
  if (layerList.length > 0 && this.enabled_) {
  
    var payload = {
      'geometryType': 'esriGeometryPoint',
      'geometry': coordinate[0] + ',' + coordinate[1],
      'geometryFormat': 'geojson',
      'imageDisplay': size[0] + ',' + size[1] + ',96',
      'mapExtent': extent.join(','),
      'tolerance': 10,
      'layers': 'all:' + layerList.join(','),
      'lang': window['GeoAdmin'] && window['GeoAdmin']['lang'] ?
        window['GeoAdmin']['lang'] : "de"
    };
    jsonp.send(payload,
      goog.bind(this.handleIdentifyResponse_, this),
      goog.bind(this.handleIdentifyError_, this));

  }
};

ga.Tooltip.prototype.handleIdentifyResponse_ = function(response) {
  // Highlight feature
  if (this.vector_) {
    this.source_.clear();
    this.map_.removeLayer(this.vector_);
  }
  this.source_ = new ol.source.Vector();
  this.vector_ = new ol.layer.Vector({
    style: function(feature, resolution) {
      return [new ol.style.Style({
        fill: new ol.style.Fill({
          color: '#ffff00'
        }),
        stroke: new ol.style.Stroke({
          color: '#ff8000',
          width: 3
        }),
        image: new ol.style.Circle({
          radius: 9,
          fill: new ol.style.Fill({
            color: [255, 255, 0, 0.5]
          }),
          stroke: new ol.style.Stroke({
            color: '#ff8000',
            width: 3
          })
        })
      })]
    },
    source: this.source_
  });
  this.map_.addLayer(this.vector_);
  if (response['results'].length > 0) {
    this.source_.addFeatures(this.createFeatures_(response));
  }

  // Show popup
  for (var i = 0, ii = response['results'].length; i < ii; i++) {
    var lang = window['GeoAdmin'] && window['GeoAdmin']['lang'] ?
                window['GeoAdmin']['lang'] : "de";
    var jsonp = new goog.net.Jsonp(
      new goog.Uri( window['GeoAdmin']['serviceUrl'] + '/rest/services/api/MapServer/' +
        response['results'][i]['layerBodId'] + '/' +
        response['results'][i]['featureId'] + '/' +
        'htmlPopup?lang=' + lang),
      'callback');
    jsonp.send({},
      goog.bind(this.handleHtmlpopupResponse_, this),
      goog.bind(this.handleHtmlpopupError_, this));
  }
};

ga.Tooltip.prototype.handleHtmlpopupResponse_ = function(response) {
  this.tooltipContentElement_.innerHTML =
    this.tooltipContentElement_.innerHTML + response;
  this.tooltipElement_.style.display = 'block';
};

ga.Tooltip.prototype.handleIdentifyError_ = function(payload) {
  alert("Unfortunately an error occured in tooltip identify. " +
    "Sorry for inconvenience.");
};

ga.Tooltip.prototype.handleHtmlpopupError_ = function(payload) {
  alert("Unfortunately an error occured in tooltip html popup. " +
    "Sorry for inconvenience.");
};

ga.Tooltip.prototype.createFeatures_ = function(response) {
  var features = [];
  var results = response['results'] || [];
  for (var i = 0, ii = results.length; i < ii; i++) {
    var result = results[i];
    var coords = result.geometry.coordinates;
    if (coords) {
      var geom;

      switch(result.geometry.type) {
        case 'Point': geom = new ol.geom.Point(coords);break;
        case 'LineString': geom = new ol.geom.LineString(coords);break;
        case 'Polygon': geom = new ol.geom.Polygon(coords);break;
        case 'MultiPoint': geom = new ol.geom.MultiPoint(coords);break;
        case 'MultiLineString': geom = new ol.geom.MultiLineString(coords);break;
        case 'MultiPolygon': geom = new ol.geom.MultiPolygon(coords);break;
        case 'GeometryCollection': geom = new ol.geom.GeometryCollection(coords);break;
        default: break;
      }
      
      if (geom) {
        features.push(new ol.Feature({
          geometry: geom
        }));
      }
    }
  }
  return features;
};


/**
 * @param {goog.events.BrowserEvent} event Browser event.
 */
ga.Tooltip.prototype.handleClose_ = function(event) {
  this.hidePopup();
};

ga.Tooltip.prototype.handleWheel_ = function(event) {
  event.stopPropagation();
};

ga.Tooltip.prototype.hidePopup = function() {
  this.tooltipContentElement_.innerHTML = '';
  this.tooltipElement_.style.display = 'none';
  if (this.vector_) {
    this.map_.removeLayer(this.vector_);
  }
}; 


/**
 * @param {ol.Map} map Map.
 */
ga.Tooltip.prototype.setMap = function(map) {
  if (!goog.isNull(this.mapClickListenerKey_)) {
    goog.events.unlistenByKey(this.mapClickListenerKey_);
    this.mapClickListenerKey_ = null;
  }
  if (!goog.isNull(this.map_)) {
    this.map_.removeOverlay(this.overlay_);
  }
  if (!goog.isNull(map)) {
    this.mapClickListenerKey_ = goog.events.listen(map, 'singleclick',
        this.handleClick_, false, this);
    map.addOverlay(this.overlay_);
  }
  this.map_ = map;
};

/**
 * Enable the Tooltip and Highlighting
 */
ga.Tooltip.prototype.enable = function() {
  this.enabled_ = true;
};

/**
 * Disable the Tooltip and Highlighting
 */
ga.Tooltip.prototype.disable = function() {
  this.enabled_ = false;
  this.hidePopup();
};
