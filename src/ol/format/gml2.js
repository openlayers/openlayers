goog.provide('ol.format.GML2');

goog.require('ol');
goog.require('ol.extent');
goog.require('ol.format.Feature');
goog.require('ol.format.GMLBase');
goog.require('ol.format.XSD');
goog.require('ol.geom.Geometry');
goog.require('ol.obj');
goog.require('ol.proj');
goog.require('ol.xml');


/**
 * @classdesc
 * Feature format for reading and writing data in the GML format,
 * version 2.1.2.
 *
 * @constructor
 * @param {olx.format.GMLOptions=} opt_options Optional configuration object.
 * @extends {ol.format.GMLBase}
 * @api
 */
ol.format.GML2 = function(opt_options) {
  var options = /** @type {olx.format.GMLOptions} */
      (opt_options ? opt_options : {});

  ol.format.GMLBase.call(this, options);

  this.FEATURE_COLLECTION_PARSERS[ol.format.GMLBase.GMLNS][
      'featureMember'] =
      ol.xml.makeArrayPusher(ol.format.GMLBase.prototype.readFeaturesInternal);

  /**
   * @inheritDoc
   */
  this.schemaLocation = options.schemaLocation ?
    options.schemaLocation : ol.format.GML2.schemaLocation_;

};
ol.inherits(ol.format.GML2, ol.format.GMLBase);


/**
 * @const
 * @type {string}
 * @private
 */
ol.format.GML2.schemaLocation_ = ol.format.GMLBase.GMLNS +
    ' http://schemas.opengis.net/gml/2.1.2/feature.xsd';


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>|undefined} Flat coordinates.
 */
ol.format.GML2.prototype.readFlatCoordinates_ = function(node, objectStack) {
  var s = ol.xml.getAllTextContent(node, false).replace(/^\s*|\s*$/g, '');
  var context = /** @type {ol.XmlNodeStackItem} */ (objectStack[0]);
  var containerSrs = context['srsName'];
  var axisOrientation = 'enu';
  if (containerSrs) {
    var proj = ol.proj.get(containerSrs);
    if (proj) {
      axisOrientation = proj.getAxisOrientation();
    }
  }
  var coordsGroups = s.trim().split(/\s+/);
  var x, y, z;
  var flatCoordinates = [];
  for (var i = 0, ii = coordsGroups.length; i < ii; i++) {
    var coords = coordsGroups[i].split(/,+/);
    x = parseFloat(coords[0]);
    y = parseFloat(coords[1]);
    z = (coords.length === 3) ? parseFloat(coords[2]) : 0;
    if (axisOrientation.substr(0, 2) === 'en') {
      flatCoordinates.push(x, y, z);
    } else {
      flatCoordinates.push(y, x, z);
    }
  }
  return flatCoordinates;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.Extent|undefined} Envelope.
 */
ol.format.GML2.prototype.readBox_ = function(node, objectStack) {
  /** @type {Array.<number>} */
  var flatCoordinates = ol.xml.pushParseAndPop([null],
      this.BOX_PARSERS_, node, objectStack, this);
  return ol.extent.createOrUpdate(flatCoordinates[1][0],
      flatCoordinates[1][1], flatCoordinates[1][3],
      flatCoordinates[1][4]);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML2.prototype.innerBoundaryIsParser_ = function(node, objectStack) {
  /** @type {Array.<number>|undefined} */
  var flatLinearRing = ol.xml.pushParseAndPop(undefined,
      this.RING_PARSERS, node, objectStack, this);
  if (flatLinearRing) {
    var flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    flatLinearRings.push(flatLinearRing);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML2.prototype.outerBoundaryIsParser_ = function(node, objectStack) {
  /** @type {Array.<number>|undefined} */
  var flatLinearRing = ol.xml.pushParseAndPop(undefined,
      this.RING_PARSERS, node, objectStack, this);
  if (flatLinearRing) {
    var flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    flatLinearRings[0] = flatLinearRing;
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML2.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'coordinates': ol.xml.makeReplacer(
        ol.format.GML2.prototype.readFlatCoordinates_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML2.prototype.FLAT_LINEAR_RINGS_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'innerBoundaryIs': ol.format.GML2.prototype.innerBoundaryIsParser_,
    'outerBoundaryIs': ol.format.GML2.prototype.outerBoundaryIsParser_
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML2.prototype.BOX_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'coordinates': ol.xml.makeArrayPusher(
        ol.format.GML2.prototype.readFlatCoordinates_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML2.prototype.GEOMETRY_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'Point': ol.xml.makeReplacer(ol.format.GMLBase.prototype.readPoint),
    'MultiPoint': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readMultiPoint),
    'LineString': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readLineString),
    'MultiLineString': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readMultiLineString),
    'LinearRing': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readLinearRing),
    'Polygon': ol.xml.makeReplacer(ol.format.GMLBase.prototype.readPolygon),
    'MultiPolygon': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readMultiPolygon),
    'Box': ol.xml.makeReplacer(ol.format.GML2.prototype.readBox_)
  }
};


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 * @private
 */
ol.format.GML2.prototype.GEOMETRY_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  var context = objectStack[objectStack.length - 1];
  var multiSurface = context['multiSurface'];
  var surface = context['surface'];
  var multiCurve = context['multiCurve'];
  var nodeName;
  if (!Array.isArray(value)) {
    nodeName = /** @type {ol.geom.Geometry} */ (value).getType();
    if (nodeName === 'MultiPolygon' && multiSurface === true) {
      nodeName = 'MultiSurface';
    } else if (nodeName === 'Polygon' && surface === true) {
      nodeName = 'Surface';
    } else if (nodeName === 'MultiLineString' && multiCurve === true) {
      nodeName = 'MultiCurve';
    }
  } else {
    nodeName = 'Envelope';
  }
  return ol.xml.createElementNS('http://www.opengis.net/gml',
      nodeName);
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 */
ol.format.GML2.prototype.writeFeatureElement = function(node, feature, objectStack) {
  var fid = feature.getId();
  if (fid) {
    node.setAttribute('fid', fid);
  }
  var context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var featureNS = context['featureNS'];
  var geometryName = feature.getGeometryName();
  if (!context.serializers) {
    context.serializers = {};
    context.serializers[featureNS] = {};
  }
  var properties = feature.getProperties();
  var keys = [], values = [];
  for (var key in properties) {
    var value = properties[key];
    if (value !== null) {
      keys.push(key);
      values.push(value);
      if (key == geometryName || value instanceof ol.geom.Geometry) {
        if (!(key in context.serializers[featureNS])) {
          context.serializers[featureNS][key] = ol.xml.makeChildAppender(
              this.writeGeometryElement, this);
        }
      } else {
        if (!(key in context.serializers[featureNS])) {
          context.serializers[featureNS][key] = ol.xml.makeChildAppender(
              ol.format.XSD.writeStringTextNode);
        }
      }
    }
  }
  var item = ol.obj.assign({}, context);
  item.node = node;
  ol.xml.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */
      (item), context.serializers,
      ol.xml.makeSimpleNodeFactory(undefined, featureNS),
      values,
      objectStack, keys);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Geometry|ol.Extent} geometry Geometry.
 * @param {Array.<*>} objectStack Node stack.
 */
ol.format.GML2.prototype.writeGeometryElement = function(node, geometry, objectStack) {
  var context = /** @type {olx.format.WriteOptions} */ (objectStack[objectStack.length - 1]);
  var item = ol.obj.assign({}, context);
  item.node = node;
  var value;
  if (Array.isArray(geometry)) {
    if (context.dataProjection) {
      value = ol.proj.transformExtent(
          geometry, context.featureProjection, context.dataProjection);
    } else {
      value = geometry;
    }
  } else {
    value =
        ol.format.Feature.transformWithOptions(/** @type {ol.geom.Geometry} */ (geometry), true, context);
  }
  ol.xml.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */
      (item), ol.format.GML2.GEOMETRY_SERIALIZERS_,
      this.GEOMETRY_NODE_FACTORY_, [value],
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LineString} geometry LineString geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writeCurveOrLineString_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  if (node.nodeName !== 'LineStringSegment' && srsName) {
    node.setAttribute('srsName', srsName);
  }
  if (node.nodeName === 'LineString' ||
      node.nodeName === 'LineStringSegment') {
    var coordinates = this.createCoordinatesNode_(node.namespaceURI);
    node.appendChild(coordinates);
    this.writeCoordinates_(coordinates, geometry, objectStack);
  } else if (node.nodeName === 'Curve') {
    var segments = ol.xml.createElementNS(node.namespaceURI, 'segments');
    node.appendChild(segments);
    this.writeCurveSegments_(segments,
        geometry, objectStack);
  }
};


/**
 * @param {string} namespaceURI XML namespace.
 * @returns {Node} coordinates node.
 * @private
 */
ol.format.GML2.prototype.createCoordinatesNode_ = function(namespaceURI) {
  var coordinates = ol.xml.createElementNS(namespaceURI, 'coordinates');
  coordinates.setAttribute('decimal', '.');
  coordinates.setAttribute('cs', ',');
  coordinates.setAttribute('ts', ' ');

  return coordinates;
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LineString|ol.geom.LinearRing} value Geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writeCoordinates_ = function(node, value, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var hasZ = context['hasZ'];
  var srsName = context['srsName'];
  // only 2d for simple features profile
  var points = value.getCoordinates();
  var len = points.length;
  var parts = new Array(len);
  var point;
  for (var i = 0; i < len; ++i) {
    point = points[i];
    parts[i] = this.getCoords_(point, srsName, hasZ);
  }
  ol.format.XSD.writeStringTextNode(node, parts.join(' '));
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LineString} line LineString geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writeCurveSegments_ = function(node, line, objectStack) {
  var child = ol.xml.createElementNS(node.namespaceURI,
      'LineStringSegment');
  node.appendChild(child);
  this.writeCurveOrLineString_(child, line, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} geometry Polygon geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writeSurfaceOrPolygon_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var hasZ = context['hasZ'];
  var srsName = context['srsName'];
  if (node.nodeName !== 'PolygonPatch' && srsName) {
    node.setAttribute('srsName', srsName);
  }
  if (node.nodeName === 'Polygon' || node.nodeName === 'PolygonPatch') {
    var rings = geometry.getLinearRings();
    ol.xml.pushSerializeAndPop(
        {node: node, hasZ: hasZ, srsName: srsName},
        ol.format.GML2.RING_SERIALIZERS_,
        this.RING_NODE_FACTORY_,
        rings, objectStack, undefined, this);
  } else if (node.nodeName === 'Surface') {
    var patches = ol.xml.createElementNS(node.namespaceURI, 'patches');
    node.appendChild(patches);
    this.writeSurfacePatches_(
        patches, geometry, objectStack);
  }
};


/**
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node} Node.
 * @private
 */
ol.format.GML2.prototype.RING_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  var context = objectStack[objectStack.length - 1];
  var parentNode = context.node;
  var exteriorWritten = context['exteriorWritten'];
  if (exteriorWritten === undefined) {
    context['exteriorWritten'] = true;
  }
  return ol.xml.createElementNS(parentNode.namespaceURI,
      exteriorWritten !== undefined ? 'innerBoundaryIs' : 'outerBoundaryIs');
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} polygon Polygon geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writeSurfacePatches_ = function(node, polygon, objectStack) {
  var child = ol.xml.createElementNS(node.namespaceURI, 'PolygonPatch');
  node.appendChild(child);
  this.writeSurfaceOrPolygon_(child, polygon, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LinearRing} ring LinearRing geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writeRing_ = function(node, ring, objectStack) {
  var linearRing = ol.xml.createElementNS(node.namespaceURI, 'LinearRing');
  node.appendChild(linearRing);
  this.writeLinearRing_(linearRing, ring, objectStack);
};


/**
 * @param {Array.<number>} point Point geometry.
 * @param {string=} opt_srsName Optional srsName
 * @param {boolean=} opt_hasZ whether the geometry has a Z coordinate (is 3D) or not.
 * @return {string} The coords string.
 * @private
 */
ol.format.GML2.prototype.getCoords_ = function(point, opt_srsName, opt_hasZ) {
  var axisOrientation = 'enu';
  if (opt_srsName) {
    axisOrientation = ol.proj.get(opt_srsName).getAxisOrientation();
  }
  var coords = ((axisOrientation.substr(0, 2) === 'en') ?
    point[0] + ',' + point[1] :
    point[1] + ',' + point[0]);
  if (opt_hasZ) {
    // For newly created points, Z can be undefined.
    var z = point[2] || 0;
    coords += ',' + z;
  }

  return coords;
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.MultiLineString} geometry MultiLineString geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writeMultiCurveOrLineString_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var hasZ = context['hasZ'];
  var srsName = context['srsName'];
  var curve = context['curve'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var lines = geometry.getLineStrings();
  ol.xml.pushSerializeAndPop({node: node, hasZ: hasZ, srsName: srsName, curve: curve},
      ol.format.GML2.LINESTRINGORCURVEMEMBER_SERIALIZERS_,
      this.MULTIGEOMETRY_MEMBER_NODE_FACTORY_, lines,
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Point} geometry Point geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writePoint_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var hasZ = context['hasZ'];
  var srsName = context['srsName'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var coordinates = this.createCoordinatesNode_(node.namespaceURI);
  node.appendChild(coordinates);
  var point = geometry.getCoordinates();
  var coord = this.getCoords_(point, srsName, hasZ);
  ol.format.XSD.writeStringTextNode(coordinates, coord);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.MultiPoint} geometry MultiPoint geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writeMultiPoint_ = function(node, geometry,
    objectStack) {
  var context = objectStack[objectStack.length - 1];
  var hasZ = context['hasZ'];
  var srsName = context['srsName'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var points = geometry.getPoints();
  ol.xml.pushSerializeAndPop({node: node, hasZ: hasZ, srsName: srsName},
      ol.format.GML2.POINTMEMBER_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory('pointMember'), points,
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Point} point Point geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writePointMember_ = function(node, point, objectStack) {
  var child = ol.xml.createElementNS(node.namespaceURI, 'Point');
  node.appendChild(child);
  this.writePoint_(child, point, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LineString} line LineString geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writeLineStringOrCurveMember_ = function(node, line, objectStack) {
  var child = this.GEOMETRY_NODE_FACTORY_(line, objectStack);
  if (child) {
    node.appendChild(child);
    this.writeCurveOrLineString_(child, line, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LinearRing} geometry LinearRing geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writeLinearRing_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var coordinates = this.createCoordinatesNode_(node.namespaceURI);
  node.appendChild(coordinates);
  this.writeCoordinates_(coordinates, geometry, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.MultiPolygon} geometry MultiPolygon geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writeMultiSurfaceOrPolygon_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var hasZ = context['hasZ'];
  var srsName = context['srsName'];
  var surface = context['surface'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var polygons = geometry.getPolygons();
  ol.xml.pushSerializeAndPop({node: node, hasZ: hasZ, srsName: srsName, surface: surface},
      ol.format.GML2.SURFACEORPOLYGONMEMBER_SERIALIZERS_,
      this.MULTIGEOMETRY_MEMBER_NODE_FACTORY_, polygons,
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} polygon Polygon geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writeSurfaceOrPolygonMember_ = function(node, polygon, objectStack) {
  var child = this.GEOMETRY_NODE_FACTORY_(
      polygon, objectStack);
  if (child) {
    node.appendChild(child);
    this.writeSurfaceOrPolygon_(child, polygon, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.Extent} extent Extent.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML2.prototype.writeEnvelope = function(node, extent, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var keys = ['lowerCorner', 'upperCorner'];
  var values = [extent[0] + ' ' + extent[1], extent[2] + ' ' + extent[3]];
  ol.xml.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */
      ({node: node}), ol.format.GML2.ENVELOPE_SERIALIZERS_,
      ol.xml.OBJECT_PROPERTY_NODE_FACTORY,
      values,
      objectStack, keys, this);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.GML2.GEOMETRY_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'Curve': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeCurveOrLineString_),
    'MultiCurve': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeMultiCurveOrLineString_),
    'Point': ol.xml.makeChildAppender(ol.format.GML2.prototype.writePoint_),
    'MultiPoint': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeMultiPoint_),
    'LineString': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeCurveOrLineString_),
    'MultiLineString': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeMultiCurveOrLineString_),
    'LinearRing': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeLinearRing_),
    'Polygon': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeSurfaceOrPolygon_),
    'MultiPolygon': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeMultiSurfaceOrPolygon_),
    'Surface': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeSurfaceOrPolygon_),
    'MultiSurface': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeMultiSurfaceOrPolygon_),
    'Envelope': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeEnvelope)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.GML2.RING_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'outerBoundaryIs': ol.xml.makeChildAppender(ol.format.GML2.prototype.writeRing_),
    'innerBoundaryIs': ol.xml.makeChildAppender(ol.format.GML2.prototype.writeRing_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.GML2.POINTMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'pointMember': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writePointMember_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.GML2.LINESTRINGORCURVEMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'lineStringMember': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeLineStringOrCurveMember_),
    'curveMember': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeLineStringOrCurveMember_)
  }
};


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 * @private
 */
ol.format.GML2.prototype.MULTIGEOMETRY_MEMBER_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  var parentNode = objectStack[objectStack.length - 1].node;
  return ol.xml.createElementNS('http://www.opengis.net/gml',
      ol.format.GML2.MULTIGEOMETRY_TO_MEMBER_NODENAME_[parentNode.nodeName]);
};

/**
 * @const
 * @type {Object.<string, string>}
 * @private
 */
ol.format.GML2.MULTIGEOMETRY_TO_MEMBER_NODENAME_ = {
  'MultiLineString': 'lineStringMember',
  'MultiCurve': 'curveMember',
  'MultiPolygon': 'polygonMember',
  'MultiSurface': 'surfaceMember'
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.GML2.SURFACEORPOLYGONMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'surfaceMember': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeSurfaceOrPolygonMember_),
    'polygonMember': ol.xml.makeChildAppender(
        ol.format.GML2.prototype.writeSurfaceOrPolygonMember_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.GML2.ENVELOPE_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'lowerCorner': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
    'upperCorner': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode)
  }
};
