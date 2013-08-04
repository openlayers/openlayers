goog.provide('ol.parser.GPX');

goog.require('goog.dom.xml');
goog.require('ol.Feature');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.DomFeatureParser');
goog.require('ol.parser.ObjectFeatureParser');
goog.require('ol.parser.ReadFeaturesOptions');
goog.require('ol.parser.StringFeatureParser');
goog.require('ol.parser.XML');



/**
 * @constructor
 * @implements {ol.parser.DomFeatureParser}
 * @implements {ol.parser.StringFeatureParser}
 * @implements {ol.parser.ObjectFeatureParser}
 * @param {ol.parser.GPXOptions=} opt_options Optional configuration object.
 * @extends {ol.parser.XML}
 */
ol.parser.GPX = function(opt_options) {
  var options = /** @type {ol.parser.GPXOptions} */
      (goog.isDef(opt_options) ? opt_options : {});
  this.extractAttributes = goog.isDef(options.extractAttributes) ?
      options.extractAttributes : true;
  this.extractWaypoints = goog.isDef(options.extractWaypoints) ?
      options.extractWaypoints : true;
  this.extractTracks = goog.isDef(options.extractTracks) ?
      options.extractTracks : true;
  this.extractRoutes = goog.isDef(options.extractRoutes) ?
      options.extractRoutes : true;
  this.creator = goog.isDef(options.creator) ?
      options.creator : 'OpenLayers';
  this.defaultDesc = goog.isDef(options.defaultDesc) ?
      options.defaultDesc : 'No description available';
  this.defaultNamespaceURI = 'http://www.topografix.com/GPX/1/1';
  this.schemaLocation = 'http://www.topografix.com/GPX/1/1 ' +
      'http://www.topografix.com/GPX/1/1/gpx.xsd';
  this.readers = {
    'http://www.topografix.com/GPX/1/1': {
      'gpx': function(node, obj) {
        if (!goog.isDef(obj.features)) {
          obj.features = [];
        }
        this.readChildNodes(node, obj);
      },
      'wpt': function(node, obj) {
        if (this.extractWaypoints) {
          var properties = {};
          var coordinates = [parseFloat(node.getAttribute('lon')),
                parseFloat(node.getAttribute('lat'))];
          this.readChildNodes(node, properties);
          var feature = new ol.Feature(properties);
          var sharedVertices;
          if (this.readFeaturesOptions_) {
            var callback = this.readFeaturesOptions_.callback;
            if (callback) {
              sharedVertices = callback(feature, ol.geom.GeometryType.POINT);
            }
          }
          var geometry = new ol.geom.Point(coordinates, sharedVertices);
          feature.setGeometry(geometry);
          obj.features.push(feature);
        }
      },
      'rte': function(node, obj) {
        if (this.extractRoutes || obj.force) {
          var type = ol.geom.GeometryType.LINESTRING;
          var container = {
            properties: {},
            geometry: {
              type: type,
              coordinates: []
            }
          };
          this.readChildNodes(node, container);
          var feature = new ol.Feature(container.properties);
          var sharedVertices;
          if (this.readFeaturesOptions_) {
            var callback = this.readFeaturesOptions_.callback;
            if (callback) {
              sharedVertices = callback(feature, type);
            }
          }
          var geometry = new ol.geom.LineString(container.geometry.coordinates,
              sharedVertices);
          feature.setGeometry(geometry);
          obj.features.push(feature);
        }
      },
      'rtept': function(node, container) {
        var coordinate = [parseFloat(node.getAttribute('lon')),
              parseFloat(node.getAttribute('lat'))];
        container.geometry.coordinates.push(coordinate);
      },
      'trk': function(node, obj) {
        if (this.extractTracks) {
          var readers = this.readers[this.defaultNamespaceURI];
          obj.force = true;
          readers['rte'].apply(this, arguments);
        }
      },
      'trkseg': function(node, container) {
        this.readChildNodes(node, container);
      },
      'trkpt': function(node, container) {
        var readers = this.readers[this.defaultNamespaceURI];
        readers['rtept'].apply(this, arguments);
      },
      '*': function(node, obj) {
        if (this.extractAttributes === true) {
          var len = node.childNodes.length;
          if ((len === 1 || len === 2) && (node.firstChild.nodeType === 3 ||
              node.firstChild.nodeType === 4)) {
            var readers = this.readers[this.defaultNamespaceURI];
            readers['_attribute'].apply(this, arguments);
          }
        }
      },
      '_attribute': function(node, obj) {
        var local = node.localName || node.nodeName.split(':').pop();
        var value = this.getChildValue(node);
        if (obj.properties) {
          obj.properties[local] = value.replace(this.regExes.trimSpace, '');
        } else {
          obj[local] = value.replace(this.regExes.trimSpace, '');
        }
      }
    }
  };
  // create an alias for GXP 1.0
  this.readers['http://www.topografix.com/GPX/1/0'] =
      this.readers[this.defaultNamespaceURI];
  this.writers = {
    'http://www.topografix.com/GPX/1/1': {
      '_feature': function(feature) {
        var geom = feature.getGeometry();
        if (geom instanceof ol.geom.Point) {
          return this.writeNode('wpt', feature);
        } else if ((geom instanceof ol.geom.LineString) ||
            (geom instanceof ol.geom.MultiLineString) ||
            (geom instanceof ol.geom.Polygon)) {
          return this.writeNode('trk', feature);
        }
      },
      'wpt': function(feature) {
        var node = this.createElementNS('wpt');
        var geom = feature.getGeometry();
        var coordinates = geom.getCoordinates();
        node.setAttribute('lon', coordinates[0]);
        node.setAttribute('lat', coordinates[1]);
        var attributes = feature.getAttributes();
        var name = attributes['name'] || goog.getUid(feature).toString();
        this.writeNode('name', name, undefined, node);
        var desc = attributes['description'] || this.defaultDesc;
        this.writeNode('desc', desc, undefined, node);
        return node;
      },
      'trk': function(feature) {
        var attributes = feature.getAttributes();
        var node = this.createElementNS('trk');
        var name = attributes['name'] || goog.getUid(feature).toString();
        this.writeNode('name', name, undefined, node);
        var desc = attributes['description'] || this.defaultDesc;
        this.writeNode('desc', desc, undefined, node);
        var geom = feature.getGeometry();
        var i, ii;
        if (geom instanceof ol.geom.LineString) {
          this.writeNode('trkseg', feature.getGeometry(), undefined, node);
        } else if (geom instanceof ol.geom.MultiLineString) {
          for (i = 0, ii = geom.components.length; i < ii; ++i) {
            this.writeNode('trkseg', geom.components[i], undefined, node);
          }
        } else if (geom instanceof ol.geom.Polygon) {
          for (i = 0, ii = geom.rings.length; i < ii; ++i) {
            this.writeNode('trkseg', geom.rings[i], undefined, node);
          }
        }
        return node;
      },
      'trkseg': function(geometry) {
        var node = this.createElementNS('trkseg');
        var coordinates = geometry.getCoordinates();
        for (var i = 0, ii = coordinates.length; i < ii; ++i) {
          this.writeNode('trkpt', coordinates[i], undefined, node);
        }
        return node;
      },
      'trkpt': function(coord) {
        var node = this.createElementNS('trkpt');
        node.setAttribute('lon', coord[0]);
        node.setAttribute('lat', coord[1]);
        return node;
      },
      'metadata': function(metadata) {
        var node = this.createElementNS('metadata');
        if (goog.isDef(metadata['name'])) {
          this.writeNode('name', metadata['name'], undefined, node);
        }
        if (goog.isDef(metadata['desc'])) {
          this.writeNode('desc', metadata['desc'], undefined, node);
        }
        if (goog.isDef(metadata['author'])) {
          this.writeNode('author', metadata['author'], undefined, node);
        }
        return node;
      },
      'name': function(name) {
        var node = this.createElementNS('name');
        node.appendChild(this.createTextNode(name));
        return node;
      },
      'desc': function(desc) {
        var node = this.createElementNS('desc');
        node.appendChild(this.createTextNode(desc));
        return node;
      },
      'author': function(author) {
        var node = this.createElementNS('author');
        node.appendChild(this.createTextNode(author));
        return node;
      }
    }
  };
  goog.base(this);
};
goog.inherits(ol.parser.GPX, ol.parser.XML);


/**
 * @param {string|Document|Element|Object} data Data to read.
 * @return {ol.parser.ReadFeaturesResult} An object representing the document.
 */
ol.parser.GPX.prototype.read = function(data) {
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
 * Parse a GPX document provided as a string.
 * @param {string} str GPX document.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.GPX.prototype.readFeaturesFromString =
    function(str, opt_options) {
  this.readFeaturesOptions_ = opt_options;
  return this.read(str);
};


/**
 * Parse a GPX document provided as a DOM structure.
 * @param {Element|Document} node Document or element node.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Feature reading options.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.GPX.prototype.readFeaturesFromNode =
    function(node, opt_options) {
  this.readFeaturesOptions_ = opt_options;
  return this.read(node);
};


/**
 * @param {Object} obj Object representing features.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Feature reading options.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.GPX.prototype.readFeaturesFromObject =
    function(obj, opt_options) {
  this.readFeaturesOptions_ = opt_options;
  return this.read(obj);
};


/**
 * @param {ol.parser.GPXWriteOptions} obj Object structure to write out
 *     as GPX.
 * @return {string} An string representing the GPX document.
 */
ol.parser.GPX.prototype.write = function(obj) {
  var features = goog.isArray(obj.features) ? obj.features : [obj.features];
  var root = this.createElementNS('gpx');
  root.setAttribute('version', '1.1');
  root.setAttribute('creator', this.creator);
  this.setAttributeNS(
      root, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation);
  if (goog.isDef(obj.metadata)) {
    this.writeNode('metadata', obj.metadata, undefined, root);
  }
  for (var i = 0, ii = features.length; i < ii; i++) {
    this.writeNode('_feature', features[i], undefined, root);
  }
  return this.serialize(root);
};
