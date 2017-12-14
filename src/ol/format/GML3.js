/**
 * @module ol/format/GML3
 */
import {inherits} from '../index.js';
import _ol_array_ from '../array.js';
import {createOrUpdate} from '../extent.js';
import _ol_format_Feature_ from '../format/Feature.js';
import _ol_format_GMLBase_ from '../format/GMLBase.js';
import _ol_format_XSD_ from '../format/XSD.js';
import _ol_geom_Geometry_ from '../geom/Geometry.js';
import _ol_geom_GeometryLayout_ from '../geom/GeometryLayout.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import _ol_geom_MultiPolygon_ from '../geom/MultiPolygon.js';
import _ol_geom_Polygon_ from '../geom/Polygon.js';
import _ol_obj_ from '../obj.js';
import {get as getProjection, transformExtent} from '../proj.js';
import _ol_xml_ from '../xml.js';

/**
 * @classdesc
 * Feature format for reading and writing data in the GML format
 * version 3.1.1.
 * Currently only supports GML 3.1.1 Simple Features profile.
 *
 * @constructor
 * @param {olx.format.GMLOptions=} opt_options
 *     Optional configuration object.
 * @extends {ol.format.GMLBase}
 * @api
 */
var _ol_format_GML3_ = function(opt_options) {
  var options = /** @type {olx.format.GMLOptions} */
      (opt_options ? opt_options : {});

  _ol_format_GMLBase_.call(this, options);

  /**
   * @private
   * @type {boolean}
   */
  this.surface_ = options.surface !== undefined ? options.surface : false;

  /**
   * @private
   * @type {boolean}
   */
  this.curve_ = options.curve !== undefined ? options.curve : false;

  /**
   * @private
   * @type {boolean}
   */
  this.multiCurve_ = options.multiCurve !== undefined ?
    options.multiCurve : true;

  /**
   * @private
   * @type {boolean}
   */
  this.multiSurface_ = options.multiSurface !== undefined ?
    options.multiSurface : true;

  /**
   * @inheritDoc
   */
  this.schemaLocation = options.schemaLocation ?
    options.schemaLocation : _ol_format_GML3_.schemaLocation_;

  /**
   * @private
   * @type {boolean}
   */
  this.hasZ = options.hasZ !== undefined ?
    options.hasZ : false;

};

inherits(_ol_format_GML3_, _ol_format_GMLBase_);


/**
 * @const
 * @type {string}
 * @private
 */
_ol_format_GML3_.schemaLocation_ = _ol_format_GMLBase_.GMLNS +
    ' http://schemas.opengis.net/gml/3.1.1/profiles/gmlsfProfile/' +
    '1.0.0/gmlsf.xsd';


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.MultiLineString|undefined} MultiLineString.
 */
_ol_format_GML3_.prototype.readMultiCurve_ = function(node, objectStack) {
  /** @type {Array.<ol.geom.LineString>} */
  var lineStrings = _ol_xml_.pushParseAndPop([],
      this.MULTICURVE_PARSERS_, node, objectStack, this);
  if (lineStrings) {
    var multiLineString = new MultiLineString(null);
    multiLineString.setLineStrings(lineStrings);
    return multiLineString;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.MultiPolygon|undefined} MultiPolygon.
 */
_ol_format_GML3_.prototype.readMultiSurface_ = function(node, objectStack) {
  /** @type {Array.<ol.geom.Polygon>} */
  var polygons = _ol_xml_.pushParseAndPop([],
      this.MULTISURFACE_PARSERS_, node, objectStack, this);
  if (polygons) {
    var multiPolygon = new _ol_geom_MultiPolygon_(null);
    multiPolygon.setPolygons(polygons);
    return multiPolygon;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GML3_.prototype.curveMemberParser_ = function(node, objectStack) {
  _ol_xml_.parseNode(this.CURVEMEMBER_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GML3_.prototype.surfaceMemberParser_ = function(node, objectStack) {
  _ol_xml_.parseNode(this.SURFACEMEMBER_PARSERS_,
      node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<(Array.<number>)>|undefined} flat coordinates.
 */
_ol_format_GML3_.prototype.readPatch_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop([null],
      this.PATCHES_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>|undefined} flat coordinates.
 */
_ol_format_GML3_.prototype.readSegment_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop([null],
      this.SEGMENTS_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<(Array.<number>)>|undefined} flat coordinates.
 */
_ol_format_GML3_.prototype.readPolygonPatch_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop([null],
      this.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>|undefined} flat coordinates.
 */
_ol_format_GML3_.prototype.readLineStringSegment_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop([null],
      this.GEOMETRY_FLAT_COORDINATES_PARSERS_,
      node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GML3_.prototype.interiorParser_ = function(node, objectStack) {
  /** @type {Array.<number>|undefined} */
  var flatLinearRing = _ol_xml_.pushParseAndPop(undefined,
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
_ol_format_GML3_.prototype.exteriorParser_ = function(node, objectStack) {
  /** @type {Array.<number>|undefined} */
  var flatLinearRing = _ol_xml_.pushParseAndPop(undefined,
      this.RING_PARSERS, node, objectStack, this);
  if (flatLinearRing) {
    var flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    flatLinearRings[0] = flatLinearRing;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.Polygon|undefined} Polygon.
 */
_ol_format_GML3_.prototype.readSurface_ = function(node, objectStack) {
  /** @type {Array.<Array.<number>>} */
  var flatLinearRings = _ol_xml_.pushParseAndPop([null],
      this.SURFACE_PARSERS_, node, objectStack, this);
  if (flatLinearRings && flatLinearRings[0]) {
    var polygon = new _ol_geom_Polygon_(null);
    var flatCoordinates = flatLinearRings[0];
    var ends = [flatCoordinates.length];
    var i, ii;
    for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
      _ol_array_.extend(flatCoordinates, flatLinearRings[i]);
      ends.push(flatCoordinates.length);
    }
    polygon.setFlatCoordinates(
        _ol_geom_GeometryLayout_.XYZ, flatCoordinates, ends);
    return polygon;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.LineString|undefined} LineString.
 */
_ol_format_GML3_.prototype.readCurve_ = function(node, objectStack) {
  /** @type {Array.<number>} */
  var flatCoordinates = _ol_xml_.pushParseAndPop([null],
      this.CURVE_PARSERS_, node, objectStack, this);
  if (flatCoordinates) {
    var lineString = new LineString(null);
    lineString.setFlatCoordinates(_ol_geom_GeometryLayout_.XYZ, flatCoordinates);
    return lineString;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.Extent|undefined} Envelope.
 */
_ol_format_GML3_.prototype.readEnvelope_ = function(node, objectStack) {
  /** @type {Array.<number>} */
  var flatCoordinates = _ol_xml_.pushParseAndPop([null],
      this.ENVELOPE_PARSERS_, node, objectStack, this);
  return createOrUpdate(flatCoordinates[1][0],
      flatCoordinates[1][1], flatCoordinates[2][0],
      flatCoordinates[2][1]);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>|undefined} Flat coordinates.
 */
_ol_format_GML3_.prototype.readFlatPos_ = function(node, objectStack) {
  var s = _ol_xml_.getAllTextContent(node, false);
  var re = /^\s*([+\-]?\d*\.?\d+(?:[eE][+\-]?\d+)?)\s*/;
  /** @type {Array.<number>} */
  var flatCoordinates = [];
  var m;
  while ((m = re.exec(s))) {
    flatCoordinates.push(parseFloat(m[1]));
    s = s.substr(m[0].length);
  }
  if (s !== '') {
    return undefined;
  }
  var context = objectStack[0];
  var containerSrs = context['srsName'];
  var axisOrientation = 'enu';
  if (containerSrs) {
    var proj = getProjection(containerSrs);
    axisOrientation = proj.getAxisOrientation();
  }
  if (axisOrientation === 'neu') {
    var i, ii;
    for (i = 0, ii = flatCoordinates.length; i < ii; i += 3) {
      var y = flatCoordinates[i];
      var x = flatCoordinates[i + 1];
      flatCoordinates[i] = x;
      flatCoordinates[i + 1] = y;
    }
  }
  var len = flatCoordinates.length;
  if (len == 2) {
    flatCoordinates.push(0);
  }
  if (len === 0) {
    return undefined;
  }
  return flatCoordinates;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>|undefined} Flat coordinates.
 */
_ol_format_GML3_.prototype.readFlatPosList_ = function(node, objectStack) {
  var s = _ol_xml_.getAllTextContent(node, false).replace(/^\s*|\s*$/g, '');
  var context = objectStack[0];
  var containerSrs = context['srsName'];
  var contextDimension = context['srsDimension'];
  var axisOrientation = 'enu';
  if (containerSrs) {
    var proj = getProjection(containerSrs);
    axisOrientation = proj.getAxisOrientation();
  }
  var coords = s.split(/\s+/);
  // The "dimension" attribute is from the GML 3.0.1 spec.
  var dim = 2;
  if (node.getAttribute('srsDimension')) {
    dim = _ol_format_XSD_.readNonNegativeIntegerString(
        node.getAttribute('srsDimension'));
  } else if (node.getAttribute('dimension')) {
    dim = _ol_format_XSD_.readNonNegativeIntegerString(
        node.getAttribute('dimension'));
  } else if (node.parentNode.getAttribute('srsDimension')) {
    dim = _ol_format_XSD_.readNonNegativeIntegerString(
        node.parentNode.getAttribute('srsDimension'));
  } else if (contextDimension) {
    dim = _ol_format_XSD_.readNonNegativeIntegerString(contextDimension);
  }
  var x, y, z;
  var flatCoordinates = [];
  for (var i = 0, ii = coords.length; i < ii; i += dim) {
    x = parseFloat(coords[i]);
    y = parseFloat(coords[i + 1]);
    z = (dim === 3) ? parseFloat(coords[i + 2]) : 0;
    if (axisOrientation.substr(0, 2) === 'en') {
      flatCoordinates.push(x, y, z);
    } else {
      flatCoordinates.push(y, x, z);
    }
  }
  return flatCoordinates;
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GML3_.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'pos': _ol_xml_.makeReplacer(_ol_format_GML3_.prototype.readFlatPos_),
    'posList': _ol_xml_.makeReplacer(_ol_format_GML3_.prototype.readFlatPosList_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GML3_.prototype.FLAT_LINEAR_RINGS_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'interior': _ol_format_GML3_.prototype.interiorParser_,
    'exterior': _ol_format_GML3_.prototype.exteriorParser_
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GML3_.prototype.GEOMETRY_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'Point': _ol_xml_.makeReplacer(_ol_format_GMLBase_.prototype.readPoint),
    'MultiPoint': _ol_xml_.makeReplacer(
        _ol_format_GMLBase_.prototype.readMultiPoint),
    'LineString': _ol_xml_.makeReplacer(
        _ol_format_GMLBase_.prototype.readLineString),
    'MultiLineString': _ol_xml_.makeReplacer(
        _ol_format_GMLBase_.prototype.readMultiLineString),
    'LinearRing': _ol_xml_.makeReplacer(
        _ol_format_GMLBase_.prototype.readLinearRing),
    'Polygon': _ol_xml_.makeReplacer(_ol_format_GMLBase_.prototype.readPolygon),
    'MultiPolygon': _ol_xml_.makeReplacer(
        _ol_format_GMLBase_.prototype.readMultiPolygon),
    'Surface': _ol_xml_.makeReplacer(_ol_format_GML3_.prototype.readSurface_),
    'MultiSurface': _ol_xml_.makeReplacer(
        _ol_format_GML3_.prototype.readMultiSurface_),
    'Curve': _ol_xml_.makeReplacer(_ol_format_GML3_.prototype.readCurve_),
    'MultiCurve': _ol_xml_.makeReplacer(
        _ol_format_GML3_.prototype.readMultiCurve_),
    'Envelope': _ol_xml_.makeReplacer(_ol_format_GML3_.prototype.readEnvelope_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GML3_.prototype.MULTICURVE_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'curveMember': _ol_xml_.makeArrayPusher(
        _ol_format_GML3_.prototype.curveMemberParser_),
    'curveMembers': _ol_xml_.makeArrayPusher(
        _ol_format_GML3_.prototype.curveMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GML3_.prototype.MULTISURFACE_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'surfaceMember': _ol_xml_.makeArrayPusher(
        _ol_format_GML3_.prototype.surfaceMemberParser_),
    'surfaceMembers': _ol_xml_.makeArrayPusher(
        _ol_format_GML3_.prototype.surfaceMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GML3_.prototype.CURVEMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'LineString': _ol_xml_.makeArrayPusher(
        _ol_format_GMLBase_.prototype.readLineString),
    'Curve': _ol_xml_.makeArrayPusher(_ol_format_GML3_.prototype.readCurve_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GML3_.prototype.SURFACEMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'Polygon': _ol_xml_.makeArrayPusher(_ol_format_GMLBase_.prototype.readPolygon),
    'Surface': _ol_xml_.makeArrayPusher(_ol_format_GML3_.prototype.readSurface_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GML3_.prototype.SURFACE_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'patches': _ol_xml_.makeReplacer(_ol_format_GML3_.prototype.readPatch_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GML3_.prototype.CURVE_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'segments': _ol_xml_.makeReplacer(_ol_format_GML3_.prototype.readSegment_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GML3_.prototype.ENVELOPE_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'lowerCorner': _ol_xml_.makeArrayPusher(
        _ol_format_GML3_.prototype.readFlatPosList_),
    'upperCorner': _ol_xml_.makeArrayPusher(
        _ol_format_GML3_.prototype.readFlatPosList_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GML3_.prototype.PATCHES_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'PolygonPatch': _ol_xml_.makeReplacer(
        _ol_format_GML3_.prototype.readPolygonPatch_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GML3_.prototype.SEGMENTS_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'LineStringSegment': _ol_xml_.makeReplacer(
        _ol_format_GML3_.prototype.readLineStringSegment_)
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Point} value Point geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writePos_ = function(node, value, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var hasZ = context['hasZ'];
  var srsDimension = hasZ ? 3 : 2;
  node.setAttribute('srsDimension', srsDimension);
  var srsName = context['srsName'];
  var axisOrientation = 'enu';
  if (srsName) {
    axisOrientation = getProjection(srsName).getAxisOrientation();
  }
  var point = value.getCoordinates();
  var coords;
  // only 2d for simple features profile
  if (axisOrientation.substr(0, 2) === 'en') {
    coords = (point[0] + ' ' + point[1]);
  } else {
    coords = (point[1] + ' ' + point[0]);
  }
  if (hasZ) {
    // For newly created points, Z can be undefined.
    var z = point[2] || 0;
    coords += ' ' + z;
  }
  _ol_format_XSD_.writeStringTextNode(node, coords);
};


/**
 * @param {Array.<number>} point Point geometry.
 * @param {string=} opt_srsName Optional srsName
 * @param {boolean=} opt_hasZ whether the geometry has a Z coordinate (is 3D) or not.
 * @return {string} The coords string.
 * @private
 */
_ol_format_GML3_.prototype.getCoords_ = function(point, opt_srsName, opt_hasZ) {
  var axisOrientation = 'enu';
  if (opt_srsName) {
    axisOrientation = getProjection(opt_srsName).getAxisOrientation();
  }
  var coords = ((axisOrientation.substr(0, 2) === 'en') ?
    point[0] + ' ' + point[1] :
    point[1] + ' ' + point[0]);
  if (opt_hasZ) {
    // For newly created points, Z can be undefined.
    var z = point[2] || 0;
    coords += ' ' + z;
  }

  return coords;
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LineString|ol.geom.LinearRing} value Geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writePosList_ = function(node, value, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var hasZ = context['hasZ'];
  var srsDimension = hasZ ? 3 : 2;
  node.setAttribute('srsDimension', srsDimension);
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
  _ol_format_XSD_.writeStringTextNode(node, parts.join(' '));
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Point} geometry Point geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writePoint_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var pos = _ol_xml_.createElementNS(node.namespaceURI, 'pos');
  node.appendChild(pos);
  this.writePos_(pos, geometry, objectStack);
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_GML3_.ENVELOPE_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'lowerCorner': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
    'upperCorner': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode)
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.Extent} extent Extent.
 * @param {Array.<*>} objectStack Node stack.
 */
_ol_format_GML3_.prototype.writeEnvelope = function(node, extent, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var keys = ['lowerCorner', 'upperCorner'];
  var values = [extent[0] + ' ' + extent[1], extent[2] + ' ' + extent[3]];
  _ol_xml_.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */
      ({node: node}), _ol_format_GML3_.ENVELOPE_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY,
      values,
      objectStack, keys, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LinearRing} geometry LinearRing geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writeLinearRing_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var posList = _ol_xml_.createElementNS(node.namespaceURI, 'posList');
  node.appendChild(posList);
  this.writePosList_(posList, geometry, objectStack);
};


/**
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node} Node.
 * @private
 */
_ol_format_GML3_.prototype.RING_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  var context = objectStack[objectStack.length - 1];
  var parentNode = context.node;
  var exteriorWritten = context['exteriorWritten'];
  if (exteriorWritten === undefined) {
    context['exteriorWritten'] = true;
  }
  return _ol_xml_.createElementNS(parentNode.namespaceURI,
      exteriorWritten !== undefined ? 'interior' : 'exterior');
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} geometry Polygon geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writeSurfaceOrPolygon_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var hasZ = context['hasZ'];
  var srsName = context['srsName'];
  if (node.nodeName !== 'PolygonPatch' && srsName) {
    node.setAttribute('srsName', srsName);
  }
  if (node.nodeName === 'Polygon' || node.nodeName === 'PolygonPatch') {
    var rings = geometry.getLinearRings();
    _ol_xml_.pushSerializeAndPop(
        {node: node, hasZ: hasZ, srsName: srsName},
        _ol_format_GML3_.RING_SERIALIZERS_,
        this.RING_NODE_FACTORY_,
        rings, objectStack, undefined, this);
  } else if (node.nodeName === 'Surface') {
    var patches = _ol_xml_.createElementNS(node.namespaceURI, 'patches');
    node.appendChild(patches);
    this.writeSurfacePatches_(
        patches, geometry, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LineString} geometry LineString geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writeCurveOrLineString_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  if (node.nodeName !== 'LineStringSegment' && srsName) {
    node.setAttribute('srsName', srsName);
  }
  if (node.nodeName === 'LineString' ||
      node.nodeName === 'LineStringSegment') {
    var posList = _ol_xml_.createElementNS(node.namespaceURI, 'posList');
    node.appendChild(posList);
    this.writePosList_(posList, geometry, objectStack);
  } else if (node.nodeName === 'Curve') {
    var segments = _ol_xml_.createElementNS(node.namespaceURI, 'segments');
    node.appendChild(segments);
    this.writeCurveSegments_(segments,
        geometry, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.MultiPolygon} geometry MultiPolygon geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writeMultiSurfaceOrPolygon_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var hasZ = context['hasZ'];
  var srsName = context['srsName'];
  var surface = context['surface'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var polygons = geometry.getPolygons();
  _ol_xml_.pushSerializeAndPop({node: node, hasZ: hasZ, srsName: srsName, surface: surface},
      _ol_format_GML3_.SURFACEORPOLYGONMEMBER_SERIALIZERS_,
      this.MULTIGEOMETRY_MEMBER_NODE_FACTORY_, polygons,
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.MultiPoint} geometry MultiPoint geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writeMultiPoint_ = function(node, geometry,
    objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  var hasZ = context['hasZ'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var points = geometry.getPoints();
  _ol_xml_.pushSerializeAndPop({node: node, hasZ: hasZ, srsName: srsName},
      _ol_format_GML3_.POINTMEMBER_SERIALIZERS_,
      _ol_xml_.makeSimpleNodeFactory('pointMember'), points,
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.MultiLineString} geometry MultiLineString geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writeMultiCurveOrLineString_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var hasZ = context['hasZ'];
  var srsName = context['srsName'];
  var curve = context['curve'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var lines = geometry.getLineStrings();
  _ol_xml_.pushSerializeAndPop({node: node, hasZ: hasZ, srsName: srsName, curve: curve},
      _ol_format_GML3_.LINESTRINGORCURVEMEMBER_SERIALIZERS_,
      this.MULTIGEOMETRY_MEMBER_NODE_FACTORY_, lines,
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LinearRing} ring LinearRing geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writeRing_ = function(node, ring, objectStack) {
  var linearRing = _ol_xml_.createElementNS(node.namespaceURI, 'LinearRing');
  node.appendChild(linearRing);
  this.writeLinearRing_(linearRing, ring, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} polygon Polygon geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writeSurfaceOrPolygonMember_ = function(node, polygon, objectStack) {
  var child = this.GEOMETRY_NODE_FACTORY_(
      polygon, objectStack);
  if (child) {
    node.appendChild(child);
    this.writeSurfaceOrPolygon_(child, polygon, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Point} point Point geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writePointMember_ = function(node, point, objectStack) {
  var child = _ol_xml_.createElementNS(node.namespaceURI, 'Point');
  node.appendChild(child);
  this.writePoint_(child, point, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LineString} line LineString geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writeLineStringOrCurveMember_ = function(node, line, objectStack) {
  var child = this.GEOMETRY_NODE_FACTORY_(line, objectStack);
  if (child) {
    node.appendChild(child);
    this.writeCurveOrLineString_(child, line, objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} polygon Polygon geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writeSurfacePatches_ = function(node, polygon, objectStack) {
  var child = _ol_xml_.createElementNS(node.namespaceURI, 'PolygonPatch');
  node.appendChild(child);
  this.writeSurfaceOrPolygon_(child, polygon, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LineString} line LineString geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writeCurveSegments_ = function(node, line, objectStack) {
  var child = _ol_xml_.createElementNS(node.namespaceURI,
      'LineStringSegment');
  node.appendChild(child);
  this.writeCurveOrLineString_(child, line, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Geometry|ol.Extent} geometry Geometry.
 * @param {Array.<*>} objectStack Node stack.
 */
_ol_format_GML3_.prototype.writeGeometryElement = function(node, geometry, objectStack) {
  var context = /** @type {olx.format.WriteOptions} */ (objectStack[objectStack.length - 1]);
  var item = _ol_obj_.assign({}, context);
  item.node = node;
  var value;
  if (Array.isArray(geometry)) {
    if (context.dataProjection) {
      value = transformExtent(
          geometry, context.featureProjection, context.dataProjection);
    } else {
      value = geometry;
    }
  } else {
    value =
        _ol_format_Feature_.transformWithOptions(/** @type {ol.geom.Geometry} */ (geometry), true, context);
  }
  _ol_xml_.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */
      (item), _ol_format_GML3_.GEOMETRY_SERIALIZERS_,
      this.GEOMETRY_NODE_FACTORY_, [value],
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 */
_ol_format_GML3_.prototype.writeFeatureElement = function(node, feature, objectStack) {
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
      if (key == geometryName || value instanceof _ol_geom_Geometry_) {
        if (!(key in context.serializers[featureNS])) {
          context.serializers[featureNS][key] = _ol_xml_.makeChildAppender(
              this.writeGeometryElement, this);
        }
      } else {
        if (!(key in context.serializers[featureNS])) {
          context.serializers[featureNS][key] = _ol_xml_.makeChildAppender(
              _ol_format_XSD_.writeStringTextNode);
        }
      }
    }
  }
  var item = _ol_obj_.assign({}, context);
  item.node = node;
  _ol_xml_.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */
      (item), context.serializers,
      _ol_xml_.makeSimpleNodeFactory(undefined, featureNS),
      values,
      objectStack, keys);
};


/**
 * @param {Node} node Node.
 * @param {Array.<ol.Feature>} features Features.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GML3_.prototype.writeFeatureMembers_ = function(node, features, objectStack) {
  var context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var featureType = context['featureType'];
  var featureNS = context['featureNS'];
  var serializers = {};
  serializers[featureNS] = {};
  serializers[featureNS][featureType] = _ol_xml_.makeChildAppender(
      this.writeFeatureElement, this);
  var item = _ol_obj_.assign({}, context);
  item.node = node;
  _ol_xml_.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */
      (item),
      serializers,
      _ol_xml_.makeSimpleNodeFactory(featureType, featureNS), features,
      objectStack);
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_GML3_.SURFACEORPOLYGONMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'surfaceMember': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeSurfaceOrPolygonMember_),
    'polygonMember': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeSurfaceOrPolygonMember_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_GML3_.POINTMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'pointMember': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writePointMember_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_GML3_.LINESTRINGORCURVEMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'lineStringMember': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeLineStringOrCurveMember_),
    'curveMember': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeLineStringOrCurveMember_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_GML3_.RING_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'exterior': _ol_xml_.makeChildAppender(_ol_format_GML3_.prototype.writeRing_),
    'interior': _ol_xml_.makeChildAppender(_ol_format_GML3_.prototype.writeRing_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_GML3_.GEOMETRY_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'Curve': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeCurveOrLineString_),
    'MultiCurve': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeMultiCurveOrLineString_),
    'Point': _ol_xml_.makeChildAppender(_ol_format_GML3_.prototype.writePoint_),
    'MultiPoint': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeMultiPoint_),
    'LineString': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeCurveOrLineString_),
    'MultiLineString': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeMultiCurveOrLineString_),
    'LinearRing': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeLinearRing_),
    'Polygon': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeSurfaceOrPolygon_),
    'MultiPolygon': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeMultiSurfaceOrPolygon_),
    'Surface': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeSurfaceOrPolygon_),
    'MultiSurface': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeMultiSurfaceOrPolygon_),
    'Envelope': _ol_xml_.makeChildAppender(
        _ol_format_GML3_.prototype.writeEnvelope)
  }
};


/**
 * @const
 * @type {Object.<string, string>}
 * @private
 */
_ol_format_GML3_.MULTIGEOMETRY_TO_MEMBER_NODENAME_ = {
  'MultiLineString': 'lineStringMember',
  'MultiCurve': 'curveMember',
  'MultiPolygon': 'polygonMember',
  'MultiSurface': 'surfaceMember'
};


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 * @private
 */
_ol_format_GML3_.prototype.MULTIGEOMETRY_MEMBER_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  var parentNode = objectStack[objectStack.length - 1].node;
  return _ol_xml_.createElementNS('http://www.opengis.net/gml',
      _ol_format_GML3_.MULTIGEOMETRY_TO_MEMBER_NODENAME_[parentNode.nodeName]);
};


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 * @private
 */
_ol_format_GML3_.prototype.GEOMETRY_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  var context = objectStack[objectStack.length - 1];
  var multiSurface = context['multiSurface'];
  var surface = context['surface'];
  var curve = context['curve'];
  var multiCurve = context['multiCurve'];
  var nodeName;
  if (!Array.isArray(value)) {
    nodeName = /** @type {ol.geom.Geometry} */ (value).getType();
    if (nodeName === 'MultiPolygon' && multiSurface === true) {
      nodeName = 'MultiSurface';
    } else if (nodeName === 'Polygon' && surface === true) {
      nodeName = 'Surface';
    } else if (nodeName === 'LineString' && curve === true) {
      nodeName = 'Curve';
    } else if (nodeName === 'MultiLineString' && multiCurve === true) {
      nodeName = 'MultiCurve';
    }
  } else {
    nodeName = 'Envelope';
  }
  return _ol_xml_.createElementNS('http://www.opengis.net/gml',
      nodeName);
};


/**
 * Encode a geometry in GML 3.1.1 Simple Features.
 *
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {Node} Node.
 * @override
 * @api
 */
_ol_format_GML3_.prototype.writeGeometryNode = function(geometry, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  var geom = _ol_xml_.createElementNS('http://www.opengis.net/gml', 'geom');
  var context = {node: geom, hasZ: this.hasZ, srsName: this.srsName,
    curve: this.curve_, surface: this.surface_,
    multiSurface: this.multiSurface_, multiCurve: this.multiCurve_};
  if (opt_options) {
    _ol_obj_.assign(context, opt_options);
  }
  this.writeGeometryElement(geom, geometry, [context]);
  return geom;
};


/**
 * Encode an array of features in GML 3.1.1 Simple Features.
 *
 * @function
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {string} Result.
 * @api
 */
_ol_format_GML3_.prototype.writeFeatures;


/**
 * Encode an array of features in the GML 3.1.1 format as an XML node.
 *
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {Node} Node.
 * @override
 * @api
 */
_ol_format_GML3_.prototype.writeFeaturesNode = function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  var node = _ol_xml_.createElementNS('http://www.opengis.net/gml',
      'featureMembers');
  _ol_xml_.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation);
  var context = {
    srsName: this.srsName,
    hasZ: this.hasZ,
    curve: this.curve_,
    surface: this.surface_,
    multiSurface: this.multiSurface_,
    multiCurve: this.multiCurve_,
    featureNS: this.featureNS,
    featureType: this.featureType
  };
  if (opt_options) {
    _ol_obj_.assign(context, opt_options);
  }
  this.writeFeatureMembers_(node, features, [context]);
  return node;
};
export default _ol_format_GML3_;
