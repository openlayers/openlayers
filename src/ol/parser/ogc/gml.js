goog.provide('ol.parser.ogc.GML');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom.xml');
goog.require('ol.Feature');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.StringFeatureParser');
goog.require('ol.parser.XML');
goog.require('ol.proj');



/**
 * @constructor
 * @implements {ol.parser.StringFeatureParser}
 * @param {ol.parser.GMLOptions=} opt_options
 *     Optional configuration object.
 * @extends {ol.parser.XML}
 */
ol.parser.ogc.GML = function(opt_options) {
  var options = /** @type {ol.parser.GMLOptions} */
      (goog.isDef(opt_options) ? opt_options : {});
  this.extractAttributes = goog.isDef(options.extractAttributes) ?
      options.extractAttributes : true;
  this.surface = goog.isDef(options.surface) ?
      options.surface : false;
  this.curve = goog.isDef(options.curve) ?
      options.curve : false;
  this.multiCurve = goog.isDef(options.multiCurve) ?
      options.multiCurve : true;
  this.multiSurface = goog.isDef(options.multiSurface) ?
      options.multiSurface : true;
  this.readOptions = options.readOptions;
  this.writeOptions = options.writeOptions;

  /**
   * @protected
   * @type {string|undefined}
   */
  this.srsName;

  /**
   * @protected
   * @type {string|undefined}
   */
  this.axisOrientation;

  if (goog.isDef(options.schemaLocation)) {
    this.schemaLocation = options.schemaLocation;
  }
  if (goog.isDef(options.featureNS)) {
    this.featureNS = options.featureNS;
  }
  if (goog.isDef(options.featureType)) {
    this.featureType = options.featureType;
  }
  this.singleFeatureType = !goog.isDef(opt_options) ||
      goog.isString(opt_options.featureType);
  this.defaultNamespaceURI = 'http://www.opengis.net/gml';
  this.readers = {
    'http://www.opengis.net/wfs': {
      'FeatureCollection': function(node, obj) {
        this.readChildNodes(node, obj);
      }
    },
    'http://www.opengis.net/gml': {
      '_inherit': function(node, obj, container) {
        // Version specific parsers extend this with goog.functions.sequence
        var srsName;
        if (!goog.isDef(this.srsName)) {
          srsName = this.srsName = node.getAttribute('srsName');
        }
        if (!goog.isDef(this.axisOrientation)) {
          if (goog.isDefAndNotNull(srsName)) {
            this.axisOrientation = ol.proj.get(srsName).getAxisOrientation();
          } else {
            this.axisOrientation = 'enu';
          }
        }
      },
      'name': function(node, obj) {
        obj.name = this.getChildValue(node);
      },
      'featureMember': function(node, obj) {
        this.readChildNodes(node, obj);
      },
      'featureMembers': function(node, obj) {
        this.readChildNodes(node, obj);
      },
      'GeometryCollection': function(node, container) {
        var parts = [];
        this.readers[this.defaultNamespaceURI]['_inherit'].apply(this,
            [node, parts, container]);
        this.readChildNodes(node, parts);
        container.geometry = {
          type: ol.geom.GeometryType.GEOMETRYCOLLECTION,
          parts: parts
        };
      },
      'geometryMember': function(node, obj) {
        this.readChildNodes(node, obj);
      },
      'MultiPoint': function(node, container) {
        var parts = [];
        this.readers[this.defaultNamespaceURI]['_inherit'].apply(this,
            [node, parts, container]);
        this.readChildNodes(node, parts);
        container.geometry = {
          type: ol.geom.GeometryType.MULTIPOINT,
          parts: parts
        };
      },
      'pointMember': function(node, obj) {
        this.readChildNodes(node, obj);
      },
      'MultiLineString': function(node, container) {
        var parts = [];
        this.readers[this.defaultNamespaceURI]['_inherit'].apply(this,
            [node, parts, container]);
        this.readChildNodes(node, parts);
        container.geometry = {
          type: ol.geom.GeometryType.MULTILINESTRING,
          parts: parts
        };
      },
      'lineStringMember': function(node, obj) {
        this.readChildNodes(node, obj);
      },
      'MultiPolygon': function(node, container) {
        var parts = [];
        this.readers[this.defaultNamespaceURI]['_inherit'].apply(this,
            [node, parts, container]);
        this.readChildNodes(node, parts);
        container.geometry = {
          type: ol.geom.GeometryType.MULTIPOLYGON,
          parts: parts
        };
      },
      'polygonMember': function(node, obj) {
        this.readChildNodes(node, obj);
      },
      'Point': function(node, container) {
        var coordinates = [];
        this.readers[this.defaultNamespaceURI]['_inherit'].apply(this,
            [node, coordinates, container]);
        this.readChildNodes(node, coordinates);
        var point = {
          type: ol.geom.GeometryType.POINT,
          coordinates: coordinates[0][0]
        };
        // in the case of a multi geometry this is parts
        if (goog.isArray(container)) {
          container.push(point);
        } else {
          container.geometry = point;
        }
      },
      'LineString': function(node, container) {
        var coordinates = [];
        this.readers[this.defaultNamespaceURI]['_inherit'].apply(this,
            [node, coordinates, container]);
        this.readChildNodes(node, coordinates);
        var linestring = {
          type: ol.geom.GeometryType.LINESTRING,
          coordinates: coordinates[0]
        };
        // in the case of a multi geometry this is parts
        if (goog.isArray(container)) {
          container.push(linestring);
        } else {
          container.geometry = linestring;
        }
      },
      'Polygon': function(node, container) {
        var obj = {outer: null, inner: []};
        this.readers[this.defaultNamespaceURI]['_inherit'].apply(this,
            [node, obj, container]);
        this.readChildNodes(node, obj);
        obj.inner.unshift(obj.outer);
        var polygon = {
          type: ol.geom.GeometryType.POLYGON,
          coordinates: obj.inner
        };
        // in the case of a multi geometry this is parts
        if (goog.isArray(container)) {
          container.push(polygon);
        } else {
          container.geometry = polygon;
        }
      },
      'LinearRing': function(node, container) {
        var coordinates = [];
        this.readers[this.defaultNamespaceURI]['_inherit'].apply(this,
            [node, coordinates, container]);
        this.readChildNodes(node, coordinates);
        if (goog.isArray(container)) {
          container.push(coordinates);
        } else {
          container.geometry = {
            type: ol.geom.GeometryType.LINEARRING,
            coordinates: coordinates[0]
          };
        }
      },
      'coordinates': function(node, coordinates) {
        var str = this.getChildValue(node).replace(
            this.regExes.trimSpace, '');
        str = str.replace(this.regExes.trimComma, ',');
        var coords;
        var cs = node.getAttribute('cs') || ',';
        var ts = node.getAttribute('ts') || this.regExes.splitSpace;
        var pointList = str.split(ts);
        var numPoints = pointList.length;
        var points = new Array(numPoints);
        for (var i = 0; i < numPoints; ++i) {
          coords = goog.array.map(pointList[i].split(cs), parseFloat);
          if (this.axisOrientation.substr(0, 2) === 'en') {
            points[i] = coords;
          } else {
            if (coords.length === 2) {
              points[i] = coords.reverse();
            } else if (coords.length === 3) {
              points[i] = [coords[1], coords[0], coords[2]];
            }
          }
        }
        coordinates.push(points);
      },
      'coord': function(node, coordinates) {
        var coord = {};
        if (coordinates.length === 0) {
          coordinates.push([]);
        }
        this.readChildNodes(node, coord);
        if (goog.isDef(coord.z)) {
          coordinates.push([coord.x, coord.y, coord.z]);
        } else {
          coordinates[0].push([coord.x, coord.y]);
        }
      },
      'X': function(node, coord) {
        coord.x = parseFloat(this.getChildValue(node));
      },
      'Y': function(node, coord) {
        coord.y = parseFloat(this.getChildValue(node));
      },
      'Z': function(node, coord) {
        coord.z = parseFloat(this.getChildValue(node));
      }
    }
  };
  this.featureNSReaders_ = {
    '*': function(node, obj) {
      // The node can either be named like the featureType, or it
      // can be a child of the feature:featureType.  Children can be
      // geometry or attributes.
      var name;
      var local = node.localName || node.nodeName.split(':').pop();
      // Since an attribute can have the same name as the feature type
      // we only want to read the node as a feature if the parent
      // node can have feature nodes as children.  In this case, the
      // obj.features property is set.
      if (obj.features) {
        if (!this.singleFeatureType &&
            (goog.array.indexOf(this.featureType, local) !== -1)) {
          name = '_typeName';
        } else if (local === this.featureType) {
          name = '_typeName';
        }
      } else {
        // Assume attribute elements have one child node and that the child
        // is a text node.  Otherwise assume it is a geometry node.
        if (node.childNodes.length === 0 ||
            (node.childNodes.length === 1 &&
            node.firstChild.nodeType === 3)) {
          if (this.extractAttributes) {
            name = '_attribute';
          }
        } else {
          name = '_geometry';
        }
      }
      if (name) {
        this.readers[this.featureNS][name].apply(this, [node, obj]);
      }
    },
    '_typeName': function(node, obj) {
      var container = {properties: {}};
      this.readChildNodes(node, container);
      // look for common gml namespaced elements
      if (container.name) {
        container.properties.name = container.name;
      }
      var feature = new ol.Feature(container.properties);
      var geom = container.geometry;
      if (geom) {
        var sharedVertices = undefined;
        if (this.readFeaturesOptions_) {
          var callback = this.readFeaturesOptions_.callback;
          if (callback) {
            sharedVertices = callback(feature, geom.type);
          }
        }
        var geometry = this.createGeometry_({geometry: geom},
            sharedVertices);
        if (goog.isDef(geometry)) {
          feature.setGeometry(geometry);
        }
      }
      // TODO set feature.type and feature.namespace
      var fid = node.getAttribute('fid') ||
          this.getAttributeNS(node, this.defaultNamespaceURI, 'id');
      if (!goog.isNull(fid)) {
        feature.setFeatureId(fid);
      }
      obj.features.push(feature);
    },
    '_geometry': function(node, obj) {
      if (!this.geometryName) {
        this.geometryName = node.nodeName.split(':').pop();
      }
      this.readChildNodes(node, obj);
    },
    '_attribute': function(node, obj) {
      var local = node.localName || node.nodeName.split(':').pop();
      var value = this.getChildValue(node);
      obj.properties[local] = value;
    }
  };
  if (goog.isDef(this.featureNS)) {
    this.readers[this.featureNS] = this.featureNSReaders_;
  }
  this.writers = {
    'http://www.opengis.net/gml': {
      'featureMember': function(obj) {
        var node = this.createElementNS('gml:featureMember');
        this.writeNode('_typeName', obj, this.featureNS, node);
        return node;
      },
      'MultiPoint': function(geometry) {
        var node = this.createElementNS('gml:MultiPoint');
        for (var i = 0, ii = geometry.components.length; i < ii; ++i) {
          this.writeNode('pointMember', geometry.components[i], null, node);
        }
        return node;
      },
      'pointMember': function(geometry) {
        var node = this.createElementNS('gml:pointMember');
        this.writeNode('Point', geometry, null, node);
        return node;
      },
      'MultiLineString': function(geometry) {
        var node = this.createElementNS('gml:MultiLineString');
        for (var i = 0, ii = geometry.components.length; i < ii; ++i) {
          this.writeNode('lineStringMember', geometry.components[i], null,
              node);
        }
        return node;
      },
      'lineStringMember': function(geometry) {
        var node = this.createElementNS('gml:lineStringMember');
        this.writeNode('LineString', geometry, null, node);
        return node;
      },
      'MultiPolygon': function(geometry) {
        var node = this.createElementNS('gml:MultiPolygon');
        for (var i = 0, ii = geometry.components.length; i < ii; ++i) {
          this.writeNode('polygonMember', geometry.components[i], null, node);
        }
        return node;
      },
      'polygonMember': function(geometry) {
        var node = this.createElementNS('gml:polygonMember');
        this.writeNode('Polygon', geometry, null, node);
        return node;
      },
      'GeometryCollection': function(geometry) {
        var node = this.createElementNS('gml:GeometryCollection');
        for (var i = 0, ii = geometry.components.length; i < ii; ++i) {
          this.writeNode('geometryMember', geometry.components[i], null, node);
        }
        return node;
      },
      'geometryMember': function(geometry) {
        var node = this.createElementNS('gml:geometryMember');
        var child = this.writeNode('_geometry', geometry, this.featureNS);
        node.appendChild(child.firstChild);
        return node;
      }
    },
    'http://www.opengis.net/wfs': {
      'FeatureCollection': function(features) {
        /**
         * This is only here because GML2 only describes abstract
         * feature collections.  Typically, you would not be using
         * the GML format to write wfs elements.  This just provides
         * some way to write out lists of features.  GML3 defines the
         * featureMembers element, so that is used by default instead.
         */
        var node = this.createElementNS('wfs:FeatureCollection',
            'http://www.opengis.net/wfs');
        for (var i = 0, ii = features.length; i < ii; ++i) {
          this.writeNode('featureMember', features[i], null, node);
        }
        return node;
      }
    }
  };
  this.featureNSWiters_ = {
    '_typeName': function(feature) {
      var node = this.createElementNS('feature:' + this.featureType,
          this.featureNS);
      var fid = feature.getFeatureId();
      if (goog.isDef(fid)) {
        this.setAttributeNS(node, this.defaultNamespaceURI, 'fid', fid);
      }
      if (feature.getGeometry() !== null) {
        this.writeNode('_geometry', feature.getGeometry(), this.featureNS,
            node);
      }
      var attributes = feature.getAttributes();
      for (var name in attributes) {
        var value = attributes[name];
        if (goog.isDefAndNotNull(value) && !(value instanceof
            ol.geom.Geometry)) {
          this.writeNode('_attribute', {name: name, value: value},
              this.featureNS, node);
        }
      }
      return node;
    },
    '_geometry': function(geometry) {
      var node = this.createElementNS('feature:' + this.geometryName,
          this.featureNS);
      var type = geometry.getType(), child;
      if (type === ol.geom.GeometryType.POINT) {
        child = this.writeNode('Point', geometry, null, node);
      } else if (type === ol.geom.GeometryType.MULTIPOINT) {
        child = this.writeNode('MultiPoint', geometry, null, node);
      } else if (type === ol.geom.GeometryType.LINEARRING) {
        child = this.writeNode('LinearRing', geometry.getCoordinates(), null,
            node);
      } else if (type === ol.geom.GeometryType.LINESTRING) {
        child = this.writeNode('LineString', geometry, null, node);
      } else if (type === ol.geom.GeometryType.MULTILINESTRING) {
        child = this.writeNode('MultiLineString', geometry, null, node);
      } else if (type === ol.geom.GeometryType.POLYGON) {
        child = this.writeNode('Polygon', geometry, null, node);
      } else if (type === ol.geom.GeometryType.MULTIPOLYGON) {
        child = this.writeNode('MultiPolygon', geometry, null, node);
      } else if (type === ol.geom.GeometryType.GEOMETRYCOLLECTION) {
        child = this.writeNode('GeometryCollection', geometry, null, node);
      }
      if (goog.isDef(this.srsName)) {
        this.setAttributeNS(child, null, 'srsName', this.srsName);
      }
      return node;
    },
    '_attribute': function(obj) {
      var node = this.createElementNS('feature:' + obj.name, this.featureNS);
      node.appendChild(this.createTextNode(obj.value));
      return node;
    }
  };
  if (goog.isDef(this.featureNS)) {
    this.writers[this.featureNS] = this.featureNSWiters_;
  }
  goog.base(this);
};
goog.inherits(ol.parser.ogc.GML, ol.parser.XML);


/**
 * @param {string|Document|Element|Object} data Data to read.
 * @param {ol.parser.GMLReadOptions=} opt_options Read options.
 * @return {ol.parser.ReadFeaturesResult} An object representing the document.
 */
ol.parser.ogc.GML.prototype.read = function(data, opt_options) {
  var srsName;
  if (goog.isDef(opt_options) && goog.isDef(opt_options.srsName)) {
    srsName = opt_options.srsName;
  } else if (goog.isDef(this.readOptions) &&
      goog.isDef(this.readOptions.srsName)) {
    srsName = this.readOptions.srsName;
  }
  if (goog.isDef(srsName)) {
    this.srsName = goog.isString(srsName) ? srsName : srsName.getCode();
  }
  if (goog.isDef(opt_options) && goog.isDef(opt_options.axisOrientation)) {
    this.axisOrientation = opt_options.axisOrientation;
  } else if (goog.isDef(this.readOptions) &&
      goog.isDef(this.readOptions.axisOrientation)) {
    this.axisOrientation = this.readOptions.axisOrientation;
  }
  if (typeof data == 'string') {
    data = goog.dom.xml.loadXml(data);
  }
  if (data && data.nodeType == 9) {
    data = data.documentElement;
  }
  var obj = /** @type {ol.parser.ReadFeaturesResult} */
      ({features: [], metadata: {}});
  this.readNode(data, obj, true);
  obj.metadata.projection = this.srsName;
  delete this.srsName;
  delete this.axisOrientation;
  return obj;
};


/**
 * @param {Element|Document} node The node to be read.
 * @param {Object} obj The object to be modified.
 * @param {boolean=} opt_first Should be set to true for the first node read.
 * This is usually the readNode call in the read method. Without this being
 * set, auto-configured properties will stick on subsequent reads.
 * @return {Object} The input object, modified (or a new one if none was
 * provided).
 */
ol.parser.ogc.GML.prototype.readNode = function(node, obj, opt_first) {
  // on subsequent calls of this.read(), we want to reset auto-
  // configured properties and auto-configure again.
  if (opt_first === true && this.autoConfig === true) {
    this.featureType = null;
    delete this.readers[this.featureNS];
    delete this.writers[this.featureNS];
    this.featureNS = null;
  }
  // featureType auto-configuration
  if (!this.featureNS && (!(node.namespaceURI in this.readers) &&
      node.parentNode.namespaceURI == this.defaultNamespaceURI &&
      (/^(.*:)?featureMembers?$/).test(node.parentNode.nodeName))) {
    this.featureType = node.nodeName.split(':').pop();
    this.readers[node.namespaceURI] = this.featureNSReaders_;
    this.writers[node.namespaceURI] = this.featureNSWiters_;
    this.featureNS = node.namespaceURI;
    this.autoConfig = true;
  }
  return ol.parser.XML.prototype.readNode.apply(this, [node, obj]);
};


/**
 * @private
 * @param {Object} container Geometry container.
 * @param {ol.geom.SharedVertices=} opt_vertices Shared vertices.
 * @return {ol.geom.Geometry} The geometry created.
 */
// TODO use a mixin since this is also used in the KML parser
ol.parser.ogc.GML.prototype.createGeometry_ = function(container,
    opt_vertices) {
  var geometry = null, coordinates, i, ii;
  switch (container.geometry.type) {
    case ol.geom.GeometryType.POINT:
      geometry = new ol.geom.Point(container.geometry.coordinates,
          opt_vertices);
      break;
    case ol.geom.GeometryType.LINEARRING:
      geometry = new ol.geom.LinearRing(container.geometry.coordinates,
          opt_vertices);
      break;
    case ol.geom.GeometryType.LINESTRING:
      geometry = new ol.geom.LineString(container.geometry.coordinates,
          opt_vertices);
      break;
    case ol.geom.GeometryType.POLYGON:
      geometry = new ol.geom.Polygon(container.geometry.coordinates,
          opt_vertices);
      break;
    case ol.geom.GeometryType.MULTIPOINT:
      coordinates = [];
      for (i = 0, ii = container.geometry.parts.length; i < ii; i++) {
        coordinates.push(container.geometry.parts[i].coordinates);
      }
      geometry = new ol.geom.MultiPoint(coordinates, opt_vertices);
      break;
    case ol.geom.GeometryType.MULTILINESTRING:
      coordinates = [];
      for (i = 0, ii = container.geometry.parts.length; i < ii; i++) {
        coordinates.push(container.geometry.parts[i].coordinates);
      }
      geometry = new ol.geom.MultiLineString(coordinates, opt_vertices);
      break;
    case ol.geom.GeometryType.MULTIPOLYGON:
      coordinates = [];
      for (i = 0, ii = container.geometry.parts.length; i < ii; i++) {
        coordinates.push(container.geometry.parts[i].coordinates);
      }
      geometry = new ol.geom.MultiPolygon(coordinates, opt_vertices);
      break;
    case ol.geom.GeometryType.GEOMETRYCOLLECTION:
      var geometries = [];
      for (i = 0, ii = container.geometry.parts.length; i < ii; i++) {
        geometries.push(this.createGeometry_({
          geometry: container.geometry.parts[i]
        }, opt_vertices));
      }
      geometry = new ol.geom.GeometryCollection(geometries);
      break;
    default:
      break;
  }
  return geometry;
};


/**
 * Parse a GML document provided as a string.
 * @param {string} str GML document.
 * @param {ol.parser.ReadFeaturesOptions=} opt_options Reader options.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.ogc.GML.prototype.readFeaturesFromString =
    function(str, opt_options) {
  this.readFeaturesOptions_ = opt_options;
  return this.read(str);
};


/**
 * Applies the writeOptions passed into the write function.
 * @param {ol.parser.ReadFeaturesResult} obj Object structure to write out as
 * GML.
 * @param {ol.parser.GMLWriteOptions=} opt_options Write options.
 */
ol.parser.ogc.GML.prototype.applyWriteOptions = function(obj, opt_options) {
  // srsName handling: opt_options -> this.writeOptions -> obj.metadata
  var srsName;
  if (goog.isDef(opt_options) && goog.isDef(opt_options.srsName)) {
    srsName = opt_options.srsName;
  } else if (goog.isDef(this.writeOptions) &&
      goog.isDef(this.writeOptions.srsName)) {
    srsName = this.writeOptions.srsName;
  } else if (goog.isDef(obj.metadata)) {
    srsName = obj.metadata.projection;
  }
  goog.asserts.assert(goog.isDef(srsName), 'srsName required for writing GML');
  this.srsName = goog.isString(srsName) ? srsName : srsName.getCode();
  // axisOrientation handling: opt_options -> this.writeOptions
  if (goog.isDef(opt_options) && goog.isDef(opt_options.axisOrientation)) {
    this.axisOrientation = opt_options.axisOrientation;
  } else if (goog.isDef(this.writeOptions) &&
      goog.isDef(this.writeOptions.axisOrientation)) {
    this.axisOrientation = this.writeOptions.axisOrientation;
  } else {
    this.axisOrientation = ol.proj.get(this.srsName).getAxisOrientation();
  }
};
