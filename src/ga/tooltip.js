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
goog.require('ol.style.Style');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Shape');
goog.require('ol.source.Vector');
goog.require('ol.parser.GeoJSON');
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
  this.tooltipContentElement_ = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className + '-content'
  });
  goog.events.listen(this.tooltipContentElement_ , 'mousewheel',
      this.handleWheel_, false, this);
  var closeAnchor = goog.dom.createDom(goog.dom.TagName.A, {
    'href': '#',
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
  var coordinate = mapBrowserEvent.getCoordinate();
  this.overlay_.setPosition(coordinate);
  var size = this.map_.getSize();
  var extent = this.map_.getView().calculateExtent(size);
  var jsonp = new goog.net.Jsonp(
    new goog.Uri('//api3.geo.admin.ch/rest/services/api/MapServer/identify'),
      'callback');
  var layerList = new Array();
  var layer;
  for (var i in this.map_.getLayers().getArray()) {
    layer = this.map_.getLayers().getArray()[i];
    if (layer['queryable'] && layer.getVisible()) {
      layerList.push(layer.id);
    }
  }
  
  var payload = {
    'geometryType': 'esriGeometryPoint',
    'geometry': coordinate[0] + ',' + coordinate[1],
    'geometryFormat': 'geojson',
    'imageDisplay': size[0] + ',' + size[1] + ',96',
    'mapExtent': extent.join(','),
    'tolerance': 10,
    'layers': 'all:' + layerList.join(','),
    'lang': window.GeoAdmibn && window.GeoAdmin.lang ? window.GeoAdmin.lang : "de"
  };
  jsonp.send(payload,
    goog.bind(this.handleIdentifyResponse_, this),
    goog.bind(this.handleIdentifyError_, this));
};

ga.Tooltip.prototype.handleIdentifyResponse_ = function(response) {
  // Highlight feature
  if (this.vector_) {
    this.source_.removeFeatures(this.source_.getFeatures());
    this.map_.removeLayer(this.vector_);
  }
  this.source_ = new ol.source.Vector({
    projection: this.map_.getView().getProjection(),
    parser: new ol.parser.GeoJSON()
  });
  this.vector_ = new ol.layer.Vector({
    style: new ol.style.Style({
      symbolizers: [
        new ol.style.Fill({
          color: '#ffff00'
        }),
        new ol.style.Stroke({
          color: '#ff8000',
          width: 3
        }),
        new ol.style.Shape({
          size: 15,
          fill: new ol.style.Fill({
            color: '#ffff00'
          }),
          stroke: new ol.style.Stroke({
            color: '#ff8000',
            width: 3
          })
        })
      ]
    }),
    source: this.source_
  });
  this.map_.addLayer(this.vector_);
  if (response['results'].length > 0) {
    this.source_.addFeatures(this.createFeatures_(response));
  }

  // Show popup
  for (var i in response['results']) {
    var lang = window.GeoAdmin && window.GeoAdmin.lang ? window.GeoAdmin.lang : "de";
    var jsonp = new goog.net.Jsonp(
      new goog.Uri('//api3.geo.admin.ch/rest/services/api/MapServer/' +
        response['results'][i]['layerBodId'] + '/' +
        response['results'][i]['featureId'] + '/' +
        '/htmlpopup?lang=' + lang),
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
  if (response['results'].length > 0) {
    var features = new Array();
    for (var i in response['results']) {
      var feature;
      if (response['results'][i].geometry.type === 'Point') {
        feature = new ol.Feature({
          geometry: new ol.geom.Point(
            response['results'][i].geometry.coordinates
          )
        });
      }
      if (response['results'][i].geometry.type === 'LineString') {
        feature = new ol.Feature({
          geometry: new ol.geom.LineString(
            response['results'][i].geometry.coordinates
          )
        });
      }
      if (response['results'][i].geometry.type === 'Polygon') {
        feature = new ol.Feature({
          geometry: new ol.geom.Polygon(
            response['results'][i].geometry.coordinates
          )
        });
      }
      if (response['results'][i].geometry.type === 'MultiPoint') {
        feature = new ol.Feature({
          geometry: new ol.geom.MultiPoint(
            response['results'][i].geometry.coordinates
          )
        });
      }
      if (response['results'][i].geometry.type === 'MultiLineString') {
        feature = new ol.Feature({
          geometry: new ol.geom.MultiLineString(
            response['results'][i].geometry.coordinates
          )
        });
      }
      if (response['results'][i].geometry.type === 'MultiPolygon') {
        feature = new ol.Feature({
          geometry: new ol.geom.MultiPolygon(
            response['results'][i].geometry.coordinates
          )
        });
      }
      if (response['results'][i].geometry.type === 'GeometryCollection') {
        feature = new ol.Feature({
          geometry: new ol.geom.GeometryCollection(
            response['results'][i].geometry.coordinates
          )
        });
      }
      features.push(feature);
    }
    return features;
  } else {
    return null;
  }
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
