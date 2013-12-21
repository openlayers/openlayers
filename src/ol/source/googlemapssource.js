goog.provide('ol.source.GoogleMaps');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('ol.proj');
goog.require('ol.proj.EPSG3857');
goog.require('ol.source.Element');



/**
 * @constructor
 * @extends {ol.source.Element}
 * @param {olx.source.GoogleMapsOptions=} opt_options Options.
 */
ol.source.GoogleMaps = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    projection: ol.proj.get('EPSG:3857')
  });

  var mapDiv = goog.dom.createElement(goog.dom.TagName.DIV);
  mapDiv.style.pointerEvents = 'none';

  /**
   * @type {Element}
   * @private
   */
  this.mapDiv_ = mapDiv;

  /**
   * @private
   * @type {ol.Size}
   */
  this.size_ = [0, 0];

  var mapTypeId = goog.isDef(options.mapTypeId) ?
      options.mapTypeId : google.maps.MapTypeId.ROADMAP;

  /**
   * @type {google.maps.Map}
   * @private
   */
  this.map_ = new google.maps.Map(mapDiv, {
    disableDefaultUI: true,
    disableDoubleClickZoom: true,
    draggable: false,
    keyboardShortcuts: false,
    mapTypeControl: false,
    mapTypeId: mapTypeId,
    overviewMapControl: false,
    panControl: false,
    rotateControl: false,
    scaleControl: false,
    scrollwheel: false,
    streetViewControl: false,
    zoomControl: false
  });

};
goog.inherits(ol.source.GoogleMaps, ol.source.Element);


/**
 * @inheritDoc
 */
ol.source.GoogleMaps.prototype.getElement =
    function(size, center, resolution, rotation, projection) {
  var mapDiv = this.mapDiv_;
  if (size[0] != this.size_[0] || size[1] != this.size_[1]) {
    mapDiv.style.width = size[0] + 'px';
    mapDiv.style.height = size[1] + 'px';
    this.size_[0] = size[0];
    this.size_[1] = size[1];
  }
  var map = this.map_;
  var epsg4326Center =
      ol.proj.transform(center.slice(), projection, 'EPSG:4326');
  var zoom =
      Math.log(ol.proj.EPSG3857.HALF_SIZE / resolution) / Math.log(2) - 7;
  map.setCenter(new google.maps.LatLng(epsg4326Center[1], epsg4326Center[0]));
  map.setZoom(zoom);
  return this.mapDiv_;
};
