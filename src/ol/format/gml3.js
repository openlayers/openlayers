goog.provide('ol.format.GML3');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('ol.format.Feature');
goog.require('ol.format.GMLBase');
goog.require('ol.format.XSD');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Polygon');
goog.require('ol.obj');
goog.require('ol.proj');
goog.require('ol.xml');


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
ol.format.GML3 = function(opt_options) {
  var options = /** @type {olx.format.GMLOptions} */
      (opt_options ? opt_options : {});

  ol.format.GMLBase.call(this, options);

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
      options.schemaLocation : ol.format.GML3.schemaLocation_;

};
ol.inherits(ol.format.GML3, ol.format.GMLBase);


/**
 * @const
 * @type {string}
 * @private
 */
ol.format.GML3.schemaLocation_ = ol.format.GMLBase.GMLNS +
    ' http://schemas.opengis.net/gml/3.1.1/profiles/gmlsfProfile/' +
    '1.0.0/gmlsf.xsd';


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.MultiLineString|undefined} MultiLineString.
 */
ol.format.GML3.prototype.readMultiCurve_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'MultiCurve',
      'localName should be MultiCurve');
  /** @type {Array.<ol.geom.LineString>} */
  var lineStrings = ol.xml.pushParseAndPop([],
      this.MULTICURVE_PARSERS_, node, objectStack, this);
  if (lineStrings) {
    var multiLineString = new ol.geom.MultiLineString(null);
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
ol.format.GML3.prototype.readMultiSurface_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'MultiSurface',
      'localName should be MultiSurface');
  /** @type {Array.<ol.geom.Polygon>} */
  var polygons = ol.xml.pushParseAndPop([],
      this.MULTISURFACE_PARSERS_, node, objectStack, this);
  if (polygons) {
    var multiPolygon = new ol.geom.MultiPolygon(null);
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
ol.format.GML3.prototype.curveMemberParser_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'curveMember' ||
      node.localName == 'curveMembers',
      'localName should be curveMember or curveMembers');
  ol.xml.parseNode(this.CURVEMEMBER_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML3.prototype.surfaceMemberParser_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'surfaceMember' ||
      node.localName == 'surfaceMembers',
      'localName should be surfaceMember or surfaceMembers');
  ol.xml.parseNode(this.SURFACEMEMBER_PARSERS_,
      node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<(Array.<number>)>|undefined} flat coordinates.
 */
ol.format.GML3.prototype.readPatch_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'patches',
      'localName should be patches');
  return ol.xml.pushParseAndPop([null],
      this.PATCHES_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>|undefined} flat coordinates.
 */
ol.format.GML3.prototype.readSegment_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'segments',
      'localName should be segments');
  return ol.xml.pushParseAndPop([null],
      this.SEGMENTS_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<(Array.<number>)>|undefined} flat coordinates.
 */
ol.format.GML3.prototype.readPolygonPatch_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'npde.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'PolygonPatch',
      'localName should be PolygonPatch');
  return ol.xml.pushParseAndPop([null],
      this.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>|undefined} flat coordinates.
 */
ol.format.GML3.prototype.readLineStringSegment_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'LineStringSegment',
      'localName should be LineStringSegment');
  return ol.xml.pushParseAndPop([null],
      this.GEOMETRY_FLAT_COORDINATES_PARSERS_,
      node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML3.prototype.interiorParser_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'interior',
      'localName should be interior');
  /** @type {Array.<number>|undefined} */
  var flatLinearRing = ol.xml.pushParseAndPop(undefined,
      this.RING_PARSERS, node, objectStack, this);
  if (flatLinearRing) {
    var flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    ol.DEBUG && console.assert(Array.isArray(flatLinearRings),
        'flatLinearRings should be an array');
    ol.DEBUG && console.assert(flatLinearRings.length > 0,
        'flatLinearRings should have an array length of 1 or more');
    flatLinearRings.push(flatLinearRing);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML3.prototype.exteriorParser_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'exterior',
      'localName should be exterior');
   /** @type {Array.<number>|undefined} */
  var flatLinearRing = ol.xml.pushParseAndPop(undefined,
      this.RING_PARSERS, node, objectStack, this);
  if (flatLinearRing) {
    var flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    ol.DEBUG && console.assert(Array.isArray(flatLinearRings),
        'flatLinearRings should be an array');
    ol.DEBUG && console.assert(flatLinearRings.length > 0,
        'flatLinearRings should have an array length of 1 or more');
    flatLinearRings[0] = flatLinearRing;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.Polygon|undefined} Polygon.
 */
ol.format.GML3.prototype.readSurface_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'Surface',
      'localName should be Surface');
  /** @type {Array.<Array.<number>>} */
  var flatLinearRings = ol.xml.pushParseAndPop([null],
      this.SURFACE_PARSERS_, node, objectStack, this);
  if (flatLinearRings && flatLinearRings[0]) {
    var polygon = new ol.geom.Polygon(null);
    var flatCoordinates = flatLinearRings[0];
    var ends = [flatCoordinates.length];
    var i, ii;
    for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
      ol.array.extend(flatCoordinates, flatLinearRings[i]);
      ends.push(flatCoordinates.length);
    }
    polygon.setFlatCoordinates(
        ol.geom.GeometryLayout.XYZ, flatCoordinates, ends);
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
ol.format.GML3.prototype.readCurve_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'Curve', 'localName should be Curve');
  /** @type {Array.<number>} */
  var flatCoordinates = ol.xml.pushParseAndPop([null],
      this.CURVE_PARSERS_, node, objectStack, this);
  if (flatCoordinates) {
    var lineString = new ol.geom.LineString(null);
    lineString.setFlatCoordinates(ol.geom.GeometryLayout.XYZ, flatCoordinates);
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
ol.format.GML3.prototype.readEnvelope_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'Envelope',
      'localName should be Envelope');
  /** @type {Array.<number>} */
  var flatCoordinates = ol.xml.pushParseAndPop([null],
      this.ENVELOPE_PARSERS_, node, objectStack, this);
  return ol.extent.createOrUpdate(flatCoordinates[1][0],
      flatCoordinates[1][1], flatCoordinates[2][0],
      flatCoordinates[2][1]);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>|undefined} Flat coordinates.
 */
ol.format.GML3.prototype.readFlatPos_ = function(node, objectStack) {
  var s = ol.xml.getAllTextContent(node, false);
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
    var proj = ol.proj.get(containerSrs);
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
ol.format.GML3.prototype.readFlatPosList_ = function(node, objectStack) {
  var s = ol.xml.getAllTextContent(node, false).replace(/^\s*|\s*$/g, '');
  var context = objectStack[0];
  var containerSrs = context['srsName'];
  var containerDimension = node.parentNode.getAttribute('srsDimension');
  var axisOrientation = 'enu';
  if (containerSrs) {
    var proj = ol.proj.get(containerSrs);
    axisOrientation = proj.getAxisOrientation();
  }
  var coords = s.split(/\s+/);
  // The "dimension" attribute is from the GML 3.0.1 spec.
  var dim = 2;
  if (node.getAttribute('srsDimension')) {
    dim = ol.format.XSD.readNonNegativeIntegerString(
        node.getAttribute('srsDimension'));
  } else if (node.getAttribute('dimension')) {
    dim = ol.format.XSD.readNonNegativeIntegerString(
        node.getAttribute('dimension'));
  } else if (containerDimension) {
    dim = ol.format.XSD.readNonNegativeIntegerString(containerDimension);
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
ol.format.GML3.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'pos': ol.xml.makeReplacer(ol.format.GML3.prototype.readFlatPos_),
    'posList': ol.xml.makeReplacer(ol.format.GML3.prototype.readFlatPosList_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML3.prototype.FLAT_LINEAR_RINGS_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'interior': ol.format.GML3.prototype.interiorParser_,
    'exterior': ol.format.GML3.prototype.exteriorParser_
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML3.prototype.GEOMETRY_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'Point': ol.xml.makeReplacer(ol.format.GMLBase.prototype.readPoint),
    'MultiPoint': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readMultiPoint),
    'LineString': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readLineString),
    'MultiLineString': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readMultiLineString),
    'LinearRing' : ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readLinearRing),
    'Polygon': ol.xml.makeReplacer(ol.format.GMLBase.prototype.readPolygon),
    'MultiPolygon': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readMultiPolygon),
    'Surface': ol.xml.makeReplacer(ol.format.GML3.prototype.readSurface_),
    'MultiSurface': ol.xml.makeReplacer(
        ol.format.GML3.prototype.readMultiSurface_),
    'Curve': ol.xml.makeReplacer(ol.format.GML3.prototype.readCurve_),
    'MultiCurve': ol.xml.makeReplacer(
        ol.format.GML3.prototype.readMultiCurve_),
    'Envelope': ol.xml.makeReplacer(ol.format.GML3.prototype.readEnvelope_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML3.prototype.MULTICURVE_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'curveMember': ol.xml.makeArrayPusher(
        ol.format.GML3.prototype.curveMemberParser_),
    'curveMembers': ol.xml.makeArrayPusher(
        ol.format.GML3.prototype.curveMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML3.prototype.MULTISURFACE_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'surfaceMember': ol.xml.makeArrayPusher(
        ol.format.GML3.prototype.surfaceMemberParser_),
    'surfaceMembers': ol.xml.makeArrayPusher(
        ol.format.GML3.prototype.surfaceMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML3.prototype.CURVEMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'LineString': ol.xml.makeArrayPusher(
        ol.format.GMLBase.prototype.readLineString),
    'Curve': ol.xml.makeArrayPusher(ol.format.GML3.prototype.readCurve_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML3.prototype.SURFACEMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'Polygon': ol.xml.makeArrayPusher(ol.format.GMLBase.prototype.readPolygon),
    'Surface': ol.xml.makeArrayPusher(ol.format.GML3.prototype.readSurface_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML3.prototype.SURFACE_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'patches': ol.xml.makeReplacer(ol.format.GML3.prototype.readPatch_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML3.prototype.CURVE_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'segments': ol.xml.makeReplacer(ol.format.GML3.prototype.readSegment_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML3.prototype.ENVELOPE_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'lowerCorner': ol.xml.makeArrayPusher(
        ol.format.GML3.prototype.readFlatPosList_),
    'upperCorner': ol.xml.makeArrayPusher(
        ol.format.GML3.prototype.readFlatPosList_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML3.prototype.PATCHES_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'PolygonPatch': ol.xml.makeReplacer(
        ol.format.GML3.prototype.readPolygonPatch_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GML3.prototype.SEGMENTS_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'LineStringSegment': ol.xml.makeReplacer(
        ol.format.GML3.prototype.readLineStringSegment_)
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Point} value Point geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML3.prototype.writePos_ = function(node, value, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  var axisOrientation = 'enu';
  if (srsName) {
    axisOrientation = ol.proj.get(srsName).getAxisOrientation();
  }
  var point = value.getCoordinates();
  var coords;
  // only 2d for simple features profile
  if (axisOrientation.substr(0, 2) === 'en') {
    coords = (point[0] + ' ' + point[1]);
  } else {
    coords = (point[1] + ' ' + point[0]);
  }
  ol.format.XSD.writeStringTextNode(node, coords);
};


/**
 * @param {Array.<number>} point Point geometry.
 * @param {string=} opt_srsName Optional srsName
 * @return {string} The coords string.
 * @private
 */
ol.format.GML3.prototype.getCoords_ = function(point, opt_srsName) {
  var axisOrientation = 'enu';
  if (opt_srsName) {
    axisOrientation = ol.proj.get(opt_srsName).getAxisOrientation();
  }
  return ((axisOrientation.substr(0, 2) === 'en') ?
      point[0] + ' ' + point[1] :
      point[1] + ' ' + point[0]);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LineString|ol.geom.LinearRing} value Geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML3.prototype.writePosList_ = function(node, value, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  // only 2d for simple features profile
  var points = value.getCoordinates();
  var len = points.length;
  var parts = new Array(len);
  var point;
  for (var i = 0; i < len; ++i) {
    point = points[i];
    parts[i] = this.getCoords_(point, srsName);
  }
  ol.format.XSD.writeStringTextNode(node, parts.join(' '));
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Point} geometry Point geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML3.prototype.writePoint_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var pos = ol.xml.createElementNS(node.namespaceURI, 'pos');
  node.appendChild(pos);
  this.writePos_(pos, geometry, objectStack);
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.GML3.ENVELOPE_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'lowerCorner': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
    'upperCorner': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode)
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.Extent} extent Extent.
 * @param {Array.<*>} objectStack Node stack.
 */
ol.format.GML3.prototype.writeEnvelope = function(node, extent, objectStack) {
  ol.DEBUG && console.assert(extent.length == 4, 'extent should have 4 items');
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var keys = ['lowerCorner', 'upperCorner'];
  var values = [extent[0] + ' ' + extent[1], extent[2] + ' ' + extent[3]];
  ol.xml.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */
      ({node: node}), ol.format.GML3.ENVELOPE_SERIALIZERS_,
      ol.xml.OBJECT_PROPERTY_NODE_FACTORY,
      values,
      objectStack, keys, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LinearRing} geometry LinearRing geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML3.prototype.writeLinearRing_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var posList = ol.xml.createElementNS(node.namespaceURI, 'posList');
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
ol.format.GML3.prototype.RING_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  var context = objectStack[objectStack.length - 1];
  var parentNode = context.node;
  var exteriorWritten = context['exteriorWritten'];
  if (exteriorWritten === undefined) {
    context['exteriorWritten'] = true;
  }
  return ol.xml.createElementNS(parentNode.namespaceURI,
      exteriorWritten !== undefined ? 'interior' : 'exterior');
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} geometry Polygon geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML3.prototype.writeSurfaceOrPolygon_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  if (node.nodeName !== 'PolygonPatch' && srsName) {
    node.setAttribute('srsName', srsName);
  }
  if (node.nodeName === 'Polygon' || node.nodeName === 'PolygonPatch') {
    var rings = geometry.getLinearRings();
    ol.xml.pushSerializeAndPop(
        {node: node, srsName: srsName},
        ol.format.GML3.RING_SERIALIZERS_,
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
 * @param {Node} node Node.
 * @param {ol.geom.LineString} geometry LineString geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML3.prototype.writeCurveOrLineString_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  if (node.nodeName !== 'LineStringSegment' && srsName) {
    node.setAttribute('srsName', srsName);
  }
  if (node.nodeName === 'LineString' ||
      node.nodeName === 'LineStringSegment') {
    var posList = ol.xml.createElementNS(node.namespaceURI, 'posList');
    node.appendChild(posList);
    this.writePosList_(posList, geometry, objectStack);
  } else if (node.nodeName === 'Curve') {
    var segments = ol.xml.createElementNS(node.namespaceURI, 'segments');
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
ol.format.GML3.prototype.writeMultiSurfaceOrPolygon_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  var surface = context['surface'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var polygons = geometry.getPolygons();
  ol.xml.pushSerializeAndPop({node: node, srsName: srsName, surface: surface},
      ol.format.GML3.SURFACEORPOLYGONMEMBER_SERIALIZERS_,
      this.MULTIGEOMETRY_MEMBER_NODE_FACTORY_, polygons,
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.MultiPoint} geometry MultiPoint geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML3.prototype.writeMultiPoint_ = function(node, geometry,
    objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var points = geometry.getPoints();
  ol.xml.pushSerializeAndPop({node: node, srsName: srsName},
      ol.format.GML3.POINTMEMBER_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory('pointMember'), points,
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.MultiLineString} geometry MultiLineString geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML3.prototype.writeMultiCurveOrLineString_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var srsName = context['srsName'];
  var curve = context['curve'];
  if (srsName) {
    node.setAttribute('srsName', srsName);
  }
  var lines = geometry.getLineStrings();
  ol.xml.pushSerializeAndPop({node: node, srsName: srsName, curve: curve},
      ol.format.GML3.LINESTRINGORCURVEMEMBER_SERIALIZERS_,
      this.MULTIGEOMETRY_MEMBER_NODE_FACTORY_, lines,
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LinearRing} ring LinearRing geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML3.prototype.writeRing_ = function(node, ring, objectStack) {
  var linearRing = ol.xml.createElementNS(node.namespaceURI, 'LinearRing');
  node.appendChild(linearRing);
  this.writeLinearRing_(linearRing, ring, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} polygon Polygon geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML3.prototype.writeSurfaceOrPolygonMember_ = function(node, polygon, objectStack) {
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
ol.format.GML3.prototype.writePointMember_ = function(node, point, objectStack) {
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
ol.format.GML3.prototype.writeLineStringOrCurveMember_ = function(node, line, objectStack) {
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
ol.format.GML3.prototype.writeSurfacePatches_ = function(node, polygon, objectStack) {
  var child = ol.xml.createElementNS(node.namespaceURI, 'PolygonPatch');
  node.appendChild(child);
  this.writeSurfaceOrPolygon_(child, polygon, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LineString} line LineString geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML3.prototype.writeCurveSegments_ = function(node, line, objectStack) {
  var child = ol.xml.createElementNS(node.namespaceURI,
      'LineStringSegment');
  node.appendChild(child);
  this.writeCurveOrLineString_(child, line, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Geometry|ol.Extent} geometry Geometry.
 * @param {Array.<*>} objectStack Node stack.
 */
ol.format.GML3.prototype.writeGeometryElement = function(node, geometry, objectStack) {
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
      (item), ol.format.GML3.GEOMETRY_SERIALIZERS_,
      this.GEOMETRY_NODE_FACTORY_, [value],
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 */
ol.format.GML3.prototype.writeFeatureElement = function(node, feature, objectStack) {
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
 * @param {Array.<ol.Feature>} features Features.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML3.prototype.writeFeatureMembers_ = function(node, features, objectStack) {
  var context = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var featureType = context['featureType'];
  var featureNS = context['featureNS'];
  var serializers = {};
  serializers[featureNS] = {};
  serializers[featureNS][featureType] = ol.xml.makeChildAppender(
      this.writeFeatureElement, this);
  var item = ol.obj.assign({}, context);
  item.node = node;
  ol.xml.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */
      (item),
      serializers,
      ol.xml.makeSimpleNodeFactory(featureType, featureNS), features,
      objectStack);
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.GML3.SURFACEORPOLYGONMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'surfaceMember': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeSurfaceOrPolygonMember_),
    'polygonMember': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeSurfaceOrPolygonMember_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.GML3.POINTMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'pointMember': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writePointMember_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.GML3.LINESTRINGORCURVEMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'lineStringMember': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeLineStringOrCurveMember_),
    'curveMember': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeLineStringOrCurveMember_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.GML3.RING_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'exterior': ol.xml.makeChildAppender(ol.format.GML3.prototype.writeRing_),
    'interior': ol.xml.makeChildAppender(ol.format.GML3.prototype.writeRing_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.GML3.GEOMETRY_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'Curve': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeCurveOrLineString_),
    'MultiCurve': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeMultiCurveOrLineString_),
    'Point': ol.xml.makeChildAppender(ol.format.GML3.prototype.writePoint_),
    'MultiPoint': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeMultiPoint_),
    'LineString': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeCurveOrLineString_),
    'MultiLineString': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeMultiCurveOrLineString_),
    'LinearRing': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeLinearRing_),
    'Polygon': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeSurfaceOrPolygon_),
    'MultiPolygon': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeMultiSurfaceOrPolygon_),
    'Surface': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeSurfaceOrPolygon_),
    'MultiSurface': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeMultiSurfaceOrPolygon_),
    'Envelope': ol.xml.makeChildAppender(
        ol.format.GML3.prototype.writeEnvelope)
  }
};


/**
 * @const
 * @type {Object.<string, string>}
 * @private
 */
ol.format.GML3.MULTIGEOMETRY_TO_MEMBER_NODENAME_ = {
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
ol.format.GML3.prototype.MULTIGEOMETRY_MEMBER_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  var parentNode = objectStack[objectStack.length - 1].node;
  ol.DEBUG && console.assert(ol.xml.isNode(parentNode),
      'parentNode should be a node');
  return ol.xml.createElementNS('http://www.opengis.net/gml',
      ol.format.GML3.MULTIGEOMETRY_TO_MEMBER_NODENAME_[parentNode.nodeName]);
};


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 * @private
 */
ol.format.GML3.prototype.GEOMETRY_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  var context = objectStack[objectStack.length - 1];
  var multiSurface = context['multiSurface'];
  var surface = context['surface'];
  var curve = context['curve'];
  var multiCurve = context['multiCurve'];
  var parentNode = objectStack[objectStack.length - 1].node;
  ol.DEBUG && console.assert(ol.xml.isNode(parentNode),
      'parentNode should be a node');
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
  return ol.xml.createElementNS('http://www.opengis.net/gml',
      nodeName);
};


/**
 * Encode a geometry in GML 3.1.1 Simple Features.
 *
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {Node} Node.
 * @api
 */
ol.format.GML3.prototype.writeGeometryNode = function(geometry, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  var geom = ol.xml.createElementNS('http://www.opengis.net/gml', 'geom');
  var context = {node: geom, srsName: this.srsName,
    curve: this.curve_, surface: this.surface_,
    multiSurface: this.multiSurface_, multiCurve: this.multiCurve_};
  if (opt_options) {
    ol.obj.assign(context, opt_options);
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
 * @api stable
 */
ol.format.GML3.prototype.writeFeatures;


/**
 * Encode an array of features in the GML 3.1.1 format as an XML node.
 *
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {Node} Node.
 * @api
 */
ol.format.GML3.prototype.writeFeaturesNode = function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  var node = ol.xml.createElementNS('http://www.opengis.net/gml',
      'featureMembers');
  ol.xml.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation);
  var context = {
    srsName: this.srsName,
    curve: this.curve_,
    surface: this.surface_,
    multiSurface: this.multiSurface_,
    multiCurve: this.multiCurve_,
    featureNS: this.featureNS,
    featureType: this.featureType
  };
  if (opt_options) {
    ol.obj.assign(context, opt_options);
  }
  this.writeFeatureMembers_(node, features, [context]);
  return node;
};
