goog.provide('ol.parser.GeoRSS');

goog.require('goog.array');
goog.require('goog.dom.xml');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');
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
    'line': function(node, obj) {
      var str = this.getChildValue(node).replace(
          this.regExes.trimSpace, '');
      var coord = goog.array.map(str.split(' '), parseFloat);
      var coordinates = [];
      for (var i = 0, ii = coord.length; i < ii; ++i) {
        coordinates.push(coord[i + 1], coord[i]);
        i += 1;
      }
      obj.geometry = new ol.geom.LineString([coordinates]);
    },
    'polygon': function(node, obj) {
      var str = this.getChildValue(node).replace(
          this.regExes.trimSpace, '');
      var coord = goog.array.map(str.split(' '), parseFloat);
      var coordinates = [];
      for (var i = 0, ii = coord.length; i < ii; ++i) {
        coordinates.push(coord[i + 1], coord[i]);
        i += 1;
      }
      obj.geometry = new ol.geom.Polygon([[coordinates]]);
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
  this.writers = {};
  this.writers[this.defaultNamespaceURI] = {
    '_feature': function(feature) {
      var node = this.createElementNS('item',
          'http://backend.userland.com/rss2');
      var geometry = feature.getGeometry();
      var title = feature.get('title'),
          description = feature.get('description');
      if (goog.isDef(title)) {
        this.writeNode('_attribute', {name: 'title', value: title}, null, node);
      }
      if (goog.isDef(description)) {
        this.writeNode('_attribute', {name: 'description', value: description},
            null, node);
      }
      if (geometry instanceof ol.geom.Point) {
        this.writeNode('point', geometry, null, node);
      }
      else if (geometry instanceof ol.geom.LineString) {
        this.writeNode('line', geometry, null, node);
      }
      else if (geometry instanceof ol.geom.Polygon) {
        this.writeNode('polygon', geometry, null, node);
      }
      return node;
    },
    '_attribute': function(obj) {
      var node = this.createElementNS(obj.name,
          'http://backend.userland.com/rss2');
      node.appendChild(this.createTextNode(obj.value));
      return node;
    },
    'point': function(geometry) {
      var node = this.createElementNS('georss:point');
      var coordinates = geometry.getCoordinates();
      node.appendChild(this.createTextNode(coordinates.reverse().join(' ')));
      return node;
    },
    'line': function(geometry) {
      var node = this.createElementNS('georss:line');
      var coordinates = geometry.getCoordinates();
      var parts = new Array(coordinates.length);
      for (var i = 0, ii = coordinates.length; i < ii; ++i) {
        parts[i] = coordinates[i].reverse().join(' ');
      }
      node.appendChild(this.createTextNode(parts.join(' ')));
      return node;
    },
    'polygon': function(geometry) {
      var node = this.createElementNS('georss:polygon');
      var coordinates = geometry.getCoordinates()[0];
      var parts = new Array(coordinates.length);
      for (var i = 0, ii = coordinates.length; i < ii; ++i) {
        parts[i] = coordinates[i].reverse().join(' ');
      }
      node.appendChild(this.createTextNode(parts.join(' ')));
      return node;
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


/**
 * @param {ol.parser.GeoRSSWriteOptions} obj Object structure to write out
 *     as GeoRSS.
 * @return {string} An string representing the GeoRSS document.
 */
ol.parser.GeoRSS.prototype.write = function(obj) {
  var features = goog.isArray(obj.features) ? obj.features : [obj.features];
  var root = this.createElementNS('rss', 'http://backend.userland.com/rss2');
  for (var i = 0, ii = features.length; i < ii; i++) {
    this.writeNode('_feature', features[i], undefined, root);
  }
  return this.serialize(root);
};
