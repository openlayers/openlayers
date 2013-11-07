goog.provide('ol.parser.GeoRSS');

goog.require('goog.array');
goog.require('goog.dom.xml');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.DomFeatureParser');
goog.require('ol.parser.ObjectFeatureParser');
goog.require('ol.parser.StringFeatureParser');
goog.require('ol.parser.XML');
goog.require('ol.parser.ogc.GML_v3');



/**
 * Read and write [GeoRSS](http://www.georss.org)
 *
 * @constructor
 * @implements {ol.parser.DomFeatureParser}
 * @implements {ol.parser.StringFeatureParser}
 * @implements {ol.parser.ObjectFeatureParser}
 * @extends {ol.parser.XML}
 * @todo stability experimental
 */
ol.parser.GeoRSS = function() {
  this.defaultNamespaceURI = 'http://www.georss.org/georss';
  this.readers = {};
  this.readers['http://www.w3.org/2003/01/geo/wgs84_pos#'] = {
    'long': function(node, obj) {
      obj.lon = parseFloat(this.getChildValue(node));
    },
    'lat': function(node, obj) {
      obj.lat = parseFloat(this.getChildValue(node));
    }
  };
  this.readers['http://www.w3.org/2005/Atom'] = {
    'feed': function(node, obj) {
      obj.features = [];
      this.readChildNodes(node, obj);
    },
    'entry': function(node, obj) {
      var entry = {};
      entry.properties = {};
      this.readChildNodes(node, entry);
      var feature = new ol.Feature(entry.properties);
      obj.features.push(feature);
      if (goog.isDef(entry.geometry)) {
        feature.setGeometry(entry.geometry);
      }
    },
    '*': function(node, obj) {
      if (goog.isDef(obj.properties)) {
        var local = node.localName || node.nodeName.split(':').pop();
        var value = this.getChildValue(node);
        obj.properties[local] = value;
      }
    }
  };
  // since the rss xmlns is not very clear, i.e.
  // some use http://backend.userland.com/rss2 but it's also often omitted, we
  // are better off putting the rss, item and * readers here.
  this.readers[this.defaultNamespaceURI] = {
    'point': function(node, obj) {
      var str = this.getChildValue(node).replace(
          this.regExes.trimSpace, '');
      // reverse to get correct axis order
      var coordinates = goog.array.map(str.split(' '), parseFloat).reverse();
      obj.geometry = new ol.geom.Point(coordinates);
    },
    'box': function(node, obj) {
      var str = this.getChildValue(node).replace(
          this.regExes.trimSpace, '');
      var extent = goog.array.map(str.split(' '), parseFloat);
      obj.geometry = new ol.geom.Polygon([[
        [extent[1], extent[0]],
        [extent[1], extent[2]],
        [extent[3], extent[2]],
        [extent[3], extent[0]],
        [extent[1], extent[0]]
      ]]);
    },
    'rss': function(node, obj) {
      obj.features = [];
      this.readChildNodes(node, obj);
    },
    'channel': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'item': function(node, obj) {
      var item = {};
      item.properties = {};
      this.readChildNodes(node, item);
      var feature = new ol.Feature(item.properties);
      obj.features.push(feature);
      if (goog.isDef(item.geometry) || (goog.isDef(item.lon) &&
          goog.isDef(item.lat))) {
        var geometry = goog.isDef(item.geometry) ? item.geometry :
            new ol.geom.Point([item.lon, item.lat]);
        feature.setGeometry(geometry);
      }
    },
    'where': function(node, obj) {
      var gml = {};
      this.readChildNodes(node, gml);
      obj.geometry = this.gml_.createGeometry(gml);
    },
    '*': function(node, obj) {
      if (goog.isDef(obj.properties)) {
        var local = node.localName || node.nodeName.split(':').pop();
        var value = this.getChildValue(node);
        obj.properties[local] = value;
      }
    }
  };
  this.gml_ = new ol.parser.ogc.GML_v3();
  for (var uri in this.gml_.readers) {
    for (var key in this.gml_.readers[uri]) {
      if (!goog.isDef(this.readers[uri])) {
        this.readers[uri] = {};
      }
      this.readers[uri][key] = goog.bind(this.gml_.readers[uri][key],
          this.gml_);
    }
  }
  goog.base(this);
};
goog.inherits(ol.parser.GeoRSS, ol.parser.XML);


/**
 * @param {string|Document|Element|Object} data Data to read.
 * @return {ol.parser.ReadFeaturesResult} An object representing the document.
 */
ol.parser.GeoRSS.prototype.read = function(data) {
  if (goog.isString(data)) {
    data = goog.dom.xml.loadXml(data);
  }
  if (data && data.nodeType == 9) {
    data = data.documentElement;
  }
  var obj = /** @type {ol.parser.ReadFeaturesResult} */
      ({metadata: {projection: 'EPSG:4326'}});
  this.readNode(data, obj);
  return obj;
};


/**
 * Parse a GeoRSS document provided as a string.
 * @param {string} str GeoRSS document.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.GeoRSS.prototype.readFeaturesFromString = function(str) {
  return this.read(str);
};


/**
 * Parse a GeoRSS document provided as a DOM structure.
 * @param {Element|Document} node Document or element node.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.GeoRSS.prototype.readFeaturesFromNode = function(node) {
  return this.read(node);
};


/**
 * @param {Object} obj Object representing features.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.GeoRSS.prototype.readFeaturesFromObject = function(obj) {
  return this.read(obj);
};
