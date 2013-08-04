goog.provide('ol.parser.ogc.GML_v3');

goog.require('goog.array');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('ol.geom.GeometryType');
goog.require('ol.parser.ogc.GML');



/**
 * @constructor
 * @param {ol.parser.GMLOptions=} opt_options Optional configuration object.
 * @extends {ol.parser.ogc.GML}
 */
ol.parser.ogc.GML_v3 = function(opt_options) {
  this.schemaLocation = 'http://www.opengis.net/gml ' +
      'http://schemas.opengis.net/gml/3.1.1/profiles/gmlsfProfile/' +
      '1.0.0/gmlsf.xsd';
  goog.base(this, opt_options);
  this.featureNSWiters_['_geometry'] = function(geometry) {
    var node = this.createElementNS('feature:' + this.geometryName,
        this.featureNS);
    var type = geometry.getType(), child;
    if (type === ol.geom.GeometryType.POINT) {
      child = this.writeNode('Point', geometry, null, node);
    } else if (type === ol.geom.GeometryType.MULTIPOINT) {
      child = this.writeNode('MultiPoint', geometry, null, node);
    } else if (type === ol.geom.GeometryType.LINESTRING) {
      if (this.curve === true) {
        child = this.writeNode('Curve', geometry, null, node);
      } else {
        child = this.writeNode('LineString', geometry, null, node);
      }
    } else if (type === ol.geom.GeometryType.LINEARRING) {
      child = this.writeNode('LinearRing', geometry.getCoordinates(), null,
          node);
    } else if (type === ol.geom.GeometryType.MULTILINESTRING) {
      if (this.multiCurve === false) {
        child = this.writeNode('MultiLineString', geometry, null, node);
      } else {
        child = this.writeNode('MultiCurve', geometry, null, node);
      }
    } else if (type === ol.geom.GeometryType.POLYGON) {
      if (this.surface === true) {
        child = this.writeNode('Surface', geometry, null, node);
      } else {
        child = this.writeNode('Polygon', geometry, null, node);
      }
    } else if (type === ol.geom.GeometryType.MULTIPOLYGON) {
      if (this.multiSurface === false) {
        child = this.writeNode('MultiPolygon', geometry, null, node);
      } else {
        child = this.writeNode('MultiSurface', geometry, null, node);
      }
    } else if (type === ol.geom.GeometryType.GEOMETRYCOLLECTION) {
      child = this.writeNode('MultiGeometry', geometry, null, node);
    }
    if (goog.isDef(this.srsName)) {
      this.setAttributeNS(child, null, 'srsName', this.srsName);
    }
    return node;
  };
  goog.object.extend(this.readers['http://www.opengis.net/gml'], {
    '_inherit': goog.functions.sequence(
        this.readers['http://www.opengis.net/gml']['_inherit'],
        function(node, obj, container) {
          // SRSReferenceGroup attributes
          var dim = parseInt(node.getAttribute('srsDimension'), 10) ||
              (container && container.srsDimension);
          if (dim) {
            obj.srsDimension = dim;
          }
        }),
    'featureMembers': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'Curve': function(node, container) {
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
    'segments': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'LineStringSegment': function(node, container) {
      var coordinates = [];
      this.readChildNodes(node, coordinates);
      container.push(coordinates[0]);
    },
    'pos': function(node, obj) {
      var str = this.getChildValue(node).replace(
          this.regExes.trimSpace, '');
      var coords = goog.array.map(str.split(this.regExes.splitSpace),
          parseFloat);
      if (this.axisOrientation.substr(0, 2) === 'en') {
        obj.push([coords]);
      } else {
        if (coords.length === 2) {
          obj.push([coords.reverse()]);
        } else if (coords.length === 3) {
          obj.push([coords[1], coords[0], coords[2]]);
        }
      }
    },
    'posList': function(node, obj) {
      var str = this.getChildValue(node).replace(
          this.regExes.trimSpace, '');
      var coords = str.split(this.regExes.splitSpace);
      // The "dimension" attribute is from the GML 3.0.1 spec.
      var dim = obj.srsDimension ||
          parseInt(node.getAttribute('srsDimension') ||
          node.getAttribute('dimension'), 10) || 2;
      var x, y, z;
      var numPoints = coords.length / dim;
      var points = new Array(numPoints);
      for (var i = 0, ii = coords.length; i < ii; i += dim) {
        x = parseFloat(coords[i]);
        y = parseFloat(coords[i + 1]);
        var xy = this.axisOrientation.substr(0, 2) === 'en';
        if (dim === 3) {
          if (xy) {
            points[i / dim] = [x, y, parseFloat(coords[i + 2])];
          } else {
            points[i / dim] = [y, x, parseFloat(coords[i + 2])];
          }
        } else if (dim === 2) {
          if (xy) {
            points[i / dim] = [x, y];
          } else {
            points[i / dim] = [y, x];
          }
        }
      }
      obj.push(points);
    },
    'Surface': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'patches': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'PolygonPatch': function(node, obj) {
      this.readers[this.defaultNamespaceURI]['Polygon'].apply(this,
          [node, obj]);
    },
    'exterior': function(node, container) {
      var coordinates = [];
      this.readChildNodes(node, coordinates);
      container.outer = coordinates[0][0];
    },
    'interior': function(node, container) {
      var coordinates = [];
      this.readChildNodes(node, coordinates);
      container.inner.push(coordinates[0][0]);
    },
    'MultiCurve': function(node, container) {
      var parts = [];
      this.readers[this.defaultNamespaceURI]['_inherit'].apply(this,
          [node, parts, container]);
      this.readChildNodes(node, parts);
      container.geometry = {
        type: ol.geom.GeometryType.MULTILINESTRING,
        parts: parts
      };
    },
    'curveMember': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'MultiSurface': function(node, container) {
      var parts = [];
      this.readers[this.defaultNamespaceURI]['_inherit'].apply(this,
          [node, parts, container]);
      this.readChildNodes(node, parts);
      container.geometry = {
        type: ol.geom.GeometryType.MULTIPOLYGON,
        parts: parts
      };
    },
    'surfaceMember': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'surfaceMembers': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'pointMembers': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'lineStringMembers': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'polygonMembers': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'geometryMembers': function(node, obj) {
      this.readChildNodes(node, obj);
    },
    'Envelope': function(node, container) {
      var coordinates = [];
      this.readers[this.defaultNamespaceURI]['_inherit'].apply(this,
          [node, coordinates, container]);
      this.readChildNodes(node, coordinates);
      container.bounds = [coordinates[0][0][0][0], coordinates[1][0][0][0],
        coordinates[0][0][0][1], coordinates[1][0][0][1]];
    },
    'lowerCorner': function(node, envelope) {
      var coordinates = [];
      this.readers[this.defaultNamespaceURI]['pos'].apply(this,
          [node, coordinates]);
      envelope.push(coordinates);
    },
    'upperCorner': function(node, envelope) {
      var coordinates = [];
      this.readers[this.defaultNamespaceURI]['pos'].apply(this,
          [node, coordinates]);
      envelope.push(coordinates);
    }
  });
  goog.object.extend(this.writers['http://www.opengis.net/gml'], {
    'featureMembers': function(features) {
      var node = this.createElementNS('gml:featureMembers');
      for (var i = 0, ii = features.length; i < ii; ++i) {
        this.writeNode('_typeName', features[i], this.featureNS, node);
      }
      return node;
    },
    'Point': function(geometry) {
      var node = this.createElementNS('gml:Point');
      this.writeNode('pos', geometry.getCoordinates(), null, node);
      return node;
    },
    'pos': function(point) {
      // only 2d for simple features profile
      var pos;
      if (this.axisOrientation.substr(0, 2) === 'en') {
        pos = (point[0] + ' ' + point[1]);
      } else {
        pos = (point[1] + ' ' + point[0]);
      }
      var node = this.createElementNS('gml:pos');
      node.appendChild(this.createTextNode(pos));
      return node;
    },
    'LineString': function(geometry) {
      var node = this.createElementNS('gml:LineString');
      this.writeNode('posList', geometry.getCoordinates(), null, node);
      return node;
    },
    'Curve': function(geometry) {
      var node = this.createElementNS('gml:Curve');
      this.writeNode('segments', geometry, null, node);
      return node;
    },
    'segments': function(geometry) {
      var node = this.createElementNS('gml:segments');
      this.writeNode('LineStringSegment', geometry, null, node);
      return node;
    },
    'LineStringSegment': function(geometry) {
      var node = this.createElementNS('gml:LineStringSegment');
      this.writeNode('posList', geometry.getCoordinates(), null, node);
      return node;
    },
    'posList': function(points) {
      // only 2d for simple features profile
      var len = points.length;
      var parts = new Array(len);
      var point;
      for (var i = 0; i < len; ++i) {
        point = points[i];
        if (this.axisOrientation.substr(0, 2) === 'en') {
          parts[i] = point[0] + ' ' + point[1];
        } else {
          parts[i] = point[1] + ' ' + point[0];
        }
      }
      var node = this.createElementNS('gml:posList');
      node.appendChild(this.createTextNode(parts.join(' ')));
      return node;
    },
    'Surface': function(geometry) {
      var node = this.createElementNS('gml:Surface');
      this.writeNode('patches', geometry, null, node);
      return node;
    },
    'patches': function(geometry) {
      var node = this.createElementNS('gml:patches');
      this.writeNode('PolygonPatch', geometry, null, node);
      return node;
    },
    'PolygonPatch': function(geometry) {
      var node = this.createElementNS('gml:PolygonPatch');
      node.setAttribute('interpolation', 'planar');
      var coordinates = geometry.getCoordinates();
      this.writeNode('exterior', coordinates[0].reverse(), null, node);
      for (var i = 1, len = coordinates.length; i < len; ++i) {
        this.writeNode('interior', coordinates[i].reverse(), null, node);
      }
      return node;
    },
    'Polygon': function(geometry) {
      var node = this.createElementNS('gml:Polygon');
      var coordinates = geometry.getCoordinates();
      /**
       * Though there continues to be ambiguity around this, GML references
       * ISO 19107, which says polygons have counter-clockwise exterior rings
       * and clockwise interior rings.  The ambiguity comes because the
       * the Simple Feature Access - SQL spec (ISO 19125-2) says that no
       * winding order is enforced.  Anyway, we write out counter-clockwise
       * exterior and clockwise interior here but accept either when reading.
       */
      this.writeNode('exterior', coordinates[0].reverse(), null, node);
      for (var i = 1, len = coordinates.length; i < len; ++i) {
        this.writeNode('interior', coordinates[i].reverse(), null, node);
      }
      return node;
    },
    'exterior': function(ring) {
      var node = this.createElementNS('gml:exterior');
      this.writeNode('LinearRing', ring, null, node);
      return node;
    },
    'interior': function(ring) {
      var node = this.createElementNS('gml:interior');
      this.writeNode('LinearRing', ring, null, node);
      return node;
    },
    'LinearRing': function(ring) {
      var node = this.createElementNS('gml:LinearRing');
      this.writeNode('posList', ring, null, node);
      return node;
    },
    'MultiCurve': function(geometry) {
      var node = this.createElementNS('gml:MultiCurve');
      for (var i = 0, len = geometry.components.length; i < len; ++i) {
        this.writeNode('curveMember', geometry.components[i], null, node);
      }
      return node;
    },
    'curveMember': function(geometry) {
      var node = this.createElementNS('gml:curveMember');
      if (this.curve) {
        this.writeNode('Curve', geometry, null, node);
      } else {
        this.writeNode('LineString', geometry, null, node);
      }
      return node;
    },
    'MultiSurface': function(geometry) {
      var node = this.createElementNS('gml:MultiSurface');
      for (var i = 0, len = geometry.components.length; i < len; ++i) {
        this.writeNode('surfaceMember', geometry.components[i], null, node);
      }
      return node;
    },
    'surfaceMember': function(polygon) {
      var node = this.createElementNS('gml:surfaceMember');
      if (this.surface) {
        this.writeNode('Surface', polygon, null, node);
      } else {
        this.writeNode('Polygon', polygon, null, node);
      }
      return node;
    },
    'Envelope': function(bounds) {
      var node = this.createElementNS('gml:Envelope');
      this.writeNode('lowerCorner', bounds, null, node);
      this.writeNode('upperCorner', bounds, null, node);
      // srsName attribute is required for gml:Envelope
      if (goog.isDef(this.srsName)) {
        node.setAttribute('srsName', this.srsName);
      }
      return node;
    },
    'lowerCorner': function(bounds) {
      // only 2d for simple features profile
      var pos;
      if (this.axisOrientation.substr(0, 2) === 'en') {
        pos = (bounds.left + ' ' + bounds.bottom);
      } else {
        pos = (bounds.bottom + ' ' + bounds.left);
      }
      var node = this.createElementNS('gml:lowerCorner');
      node.appendChild(this.createTextNode(pos));
      return node;
    },
    'upperCorner': function(bounds) {
      // only 2d for simple features profile
      var pos;
      if (this.axisOrientation.substr(0, 2) === 'en') {
        pos = (bounds.right + ' ' + bounds.top);
      } else {
        pos = (bounds.top + ' ' + bounds.right);
      }
      var node = this.createElementNS('gml:upperCorner');
      node.appendChild(this.createTextNode(pos));
      return node;
    }
  });
};
goog.inherits(ol.parser.ogc.GML_v3, ol.parser.ogc.GML);


/**
 * @param {ol.parser.ReadFeaturesResult} obj Object structure to write out as
 *     XML.
 * @param {ol.parser.GMLWriteOptions=} opt_options Write options.
 * @return {string} An string representing the XML document.
 */
ol.parser.ogc.GML_v3.prototype.write = function(obj, opt_options) {
  this.applyWriteOptions(obj, opt_options);
  var root = this.writeNode('featureMembers', obj.features);
  this.setAttributeNS(
      root, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation);
  var gml = this.serialize(root);
  delete this.srsName;
  delete this.axisOrientation;
  return gml;
};
