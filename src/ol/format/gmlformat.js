goog.provide('ol.format.GML');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.NodeType');
goog.require('goog.dom.TagName');
goog.require('ol.extent');
goog.require('ol.format.XML');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.xml');



/**
 * @constructor
 * @extends {ol.format.XML}
 * @todo stability experimental
 */
ol.format.GML = function() {
  goog.base(this);
};
goog.inherits(ol.format.GML, ol.format.XML);


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
ol.format.GML.NAMESPACE_URIS_ = [
  'http://www.opengis.net/gml'
];


/**
 * @inheritDoc
 */
ol.format.GML.prototype.readGeometryFromDocument = function(doc) {
  var node;
  if (doc.nodeType == goog.dom.NodeType.DOCUMENT) {
    // TODO intermediate element node - revisit later
    node = goog.dom.createElement(goog.dom.TagName.PRE);
    node.appendChild(doc.documentElement);
  } else {
    node = doc;
  }
  return this.readGeometryFromNode(node);
};


/**
 * @inheritDoc
 */
ol.format.GML.prototype.readGeometryFromNode = function(node) {
  var objectStack = [];
  var geometries = ol.xml.pushParseAndPop(
      /** @type {Array.<ol.geom.Geometry>} */ ([]),
      ol.format.GML.GEOMETRY_PARSERS_, node, objectStack);
  if (!goog.isDef(geometries)) {
    return null;
  }
  if (geometries.length === 0) {
    return new ol.geom.GeometryCollection(geometries);
  }
  return geometries[0];
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.Point|undefined} Point.
 */
ol.format.GML.readPoint_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Point');
  var flatCoordinates =
      ol.format.GML.readFlatCoordinatesFromNode_(node, objectStack);
  if (goog.isDefAndNotNull(flatCoordinates)) {
    var point = new ol.geom.Point(null);
    goog.asserts.assert(flatCoordinates.length == 3);
    point.setFlatCoordinates(ol.geom.GeometryLayout.XYZ, flatCoordinates);
    return point;
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
ol.format.GML.readLineString_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'LineString');
  var flatCoordinates =
      ol.format.GML.readFlatCoordinatesFromNode_(node, objectStack);
  if (goog.isDefAndNotNull(flatCoordinates)) {
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
 * @return {Array.<(Array.<number>)>} flat coordinates.
 */
ol.format.GML.patchesParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'patches');
  var result = ol.xml.pushParseAndPop(
      /** @type {Array.<Array.<number>>} */ ([null]),
      ol.format.GML.PATCHES_PARSERS_, node, objectStack);
  if (!goog.isDef(result)) {
    return null;
  } else {
    return result;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>} flat coordinates.
 */
ol.format.GML.segmentsParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'segments');
  var result = ol.xml.pushParseAndPop(
      /** @type {Array.<number>} */ ([null]),
      ol.format.GML.SEGMENTS_PARSERS_, node, objectStack);
  if (!goog.isDef(result)) {
    return null;
  } else {
    return result;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<(Array.<number>)>} flat coordinates.
 */
ol.format.GML.polygonPatchParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'PolygonPatch');
  var result = ol.xml.pushParseAndPop(
      /** @type {Array.<Array.<number>>} */ ([null]),
      ol.format.GML.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack);
  if (!goog.isDef(result)) {
    return null;
  } else {
    return result;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>} flat coordinates.
 */
ol.format.GML.lineStringSegmentParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'LineStringSegment');
  var result = ol.xml.pushParseAndPop(
      /** @type {Array.<number>} */ ([null]),
      ol.format.GML.GEOMETRY_FLAT_COORDINATES_PARSERS_, node, objectStack);
  if (!goog.isDef(result)) {
    return null;
  } else {
    return result;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML.interiorParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'interior');
  var flatLinearRing = ol.xml.pushParseAndPop(
      /** @type {Array.<number>|undefined} */ (undefined),
      ol.format.GML.INTERIOR_PARSERS_, node, objectStack);
  if (goog.isDef(flatLinearRing)) {
    var flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    goog.asserts.assert(goog.isArray(flatLinearRings));
    goog.asserts.assert(flatLinearRings.length > 0);
    flatLinearRings.push(flatLinearRing);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML.exteriorParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'exterior');
  var flatLinearRing = ol.xml.pushParseAndPop(
      /** @type {Array.<number>|undefined} */ (undefined),
      ol.format.GML.EXTERIOR_PARSERS_, node, objectStack);
  if (goog.isDef(flatLinearRing)) {
    var flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    goog.asserts.assert(goog.isArray(flatLinearRings));
    goog.asserts.assert(flatLinearRings.length > 0);
    flatLinearRings[0] = flatLinearRing;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>} LinearRing flat coordinates.
 */
ol.format.GML.readFlatLinearRing_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'LinearRing');
  return /** @type {Array.<number>} */ (ol.xml.pushParseAndPop(
      null, ol.format.GML.FLAT_LINEAR_RING_PARSERS_, node, objectStack));
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.Polygon|undefined} Polygon.
 */
ol.format.GML.readLinearRing_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'LinearRing');
  var flatCoordinates =
      ol.format.GML.readFlatCoordinatesFromNode_(node, objectStack);
  if (goog.isDef(flatCoordinates)) {
    var polygon = new ol.geom.Polygon(null);
    polygon.setFlatCoordinates(ol.geom.GeometryLayout.XYZ, flatCoordinates,
        [flatCoordinates.length]);
    return polygon;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.Polygon|undefined} Polygon.
 */
ol.format.GML.readPolygon_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Polygon');
  var flatLinearRings = ol.xml.pushParseAndPop(
      /** @type {Array.<Array.<number>>} */ ([null]),
      ol.format.GML.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack);
  if (goog.isDefAndNotNull(flatLinearRings) &&
      !goog.isNull(flatLinearRings[0])) {
    var polygon = new ol.geom.Polygon(null);
    var flatCoordinates = flatLinearRings[0];
    var ends = [flatCoordinates.length];
    var i, ii;
    for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
      goog.array.extend(flatCoordinates, flatLinearRings[i]);
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
 * @return {ol.geom.Polygon|undefined} Polygon.
 */
ol.format.GML.readSurface_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Surface');
  var flatLinearRings = ol.xml.pushParseAndPop(
      /** @type {Array.<Array.<number>>} */ ([null]),
      ol.format.GML.SURFACE_PARSERS_, node, objectStack);
  if (goog.isDefAndNotNull(flatLinearRings) &&
      !goog.isNull(flatLinearRings[0])) {
    var polygon = new ol.geom.Polygon(null);
    var flatCoordinates = flatLinearRings[0];
    var ends = [flatCoordinates.length];
    var i, ii;
    for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
      goog.array.extend(flatCoordinates, flatLinearRings[i]);
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
ol.format.GML.readCurve_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Curve');
  var flatCoordinates = ol.xml.pushParseAndPop(
      /** @type {Array.<number>} */ ([null]),
      ol.format.GML.CURVE_PARSERS_, node, objectStack);
  if (goog.isDefAndNotNull(flatCoordinates)) {
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
ol.format.GML.readEnvelope_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Envelope');
  var flatCoordinates = ol.xml.pushParseAndPop(
      /** @type {Array.<number>} */ ([null]),
      ol.format.GML.ENVELOPE_PARSERS_, node, objectStack);
  return ol.extent.createOrUpdate(flatCoordinates[1][0],
      flatCoordinates[1][1], flatCoordinates[2][0],
      flatCoordinates[2][1]);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>} Flat coordinates.
 */
ol.format.GML.readFlatCoordinatesFromNode_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  return /** @type {Array.<number>} */ (ol.xml.pushParseAndPop(
      node.getAttribute('srsDimension'),
      ol.format.GML.GEOMETRY_FLAT_COORDINATES_PARSERS_, node, objectStack));
};


/**
 * @param {Node} node Node.
 * @private
 * @return {Array.<number>|undefined} Flat coordinates.
 */
ol.format.GML.readFlatPos_ = function(node) {
  var s = ol.xml.getAllTextContent(node, false).replace(/^\s*|\s*$/g, '');
  var flatCoordinates = goog.array.map(s.split(/\s+/), parseFloat);
  // TODO handle axis order
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
ol.format.GML.readFlatPosList_ = function(node, objectStack) {
  var containerDimension = objectStack[objectStack.length - 1];
  var s = ol.xml.getAllTextContent(node, false).replace(/^\s*|\s*$/g, '');
  var coords = s.split(/\s+/);
  // The "dimension" attribute is from the GML 3.0.1 spec.
  var dim = parseInt(node.getAttribute('srsDimension') ||
      node.getAttribute('dimension'), 10) ||
      (goog.isString(containerDimension)) ?
      parseInt(containerDimension, 10) : 2;
  var x, y, z;
  var flatCoordinates = [];
  for (var i = 0, ii = coords.length; i < ii; i += dim) {
    x = parseFloat(coords[i]);
    y = parseFloat(coords[i + 1]);
    z = (dim === 3) ? parseFloat(coords[i + 2]) : 0;
    // TODO axis orientation
    flatCoordinates.push(x, y, z);
  }
  return flatCoordinates;
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.GEOMETRY_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'Point': ol.xml.makeArrayPusher(ol.format.GML.readPoint_),
      'LineString': ol.xml.makeArrayPusher(ol.format.GML.readLineString_),
      'LinearRing' : ol.xml.makeArrayPusher(ol.format.GML.readLinearRing_),
      'Polygon': ol.xml.makeArrayPusher(ol.format.GML.readPolygon_),
      'Surface': ol.xml.makeArrayPusher(ol.format.GML.readSurface_),
      'Curve': ol.xml.makeArrayPusher(ol.format.GML.readCurve_),
      'Envelope': ol.xml.makeArrayPusher(ol.format.GML.readEnvelope_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.GEOMETRY_FLAT_COORDINATES_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'pos': ol.xml.makeReplacer(ol.format.GML.readFlatPos_),
      'posList': ol.xml.makeReplacer(ol.format.GML.readFlatPosList_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.FLAT_LINEAR_RINGS_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'interior': ol.format.GML.interiorParser_,
      'exterior': ol.format.GML.exteriorParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.SURFACE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'patches': ol.xml.makeReplacer(ol.format.GML.patchesParser_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.CURVE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'segments': ol.xml.makeReplacer(ol.format.GML.segmentsParser_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.ENVELOPE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'lowerCorner': ol.xml.makeArrayPusher(ol.format.GML.readFlatPosList_),
      'upperCorner': ol.xml.makeArrayPusher(ol.format.GML.readFlatPosList_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.PATCHES_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'PolygonPatch': ol.xml.makeReplacer(ol.format.GML.polygonPatchParser_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.SEGMENTS_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'LineStringSegment': ol.xml.makeReplacer(
          ol.format.GML.lineStringSegmentParser_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.INTERIOR_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'LinearRing': ol.xml.makeReplacer(ol.format.GML.readFlatLinearRing_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.EXTERIOR_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'LinearRing': ol.xml.makeReplacer(ol.format.GML.readFlatLinearRing_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.FLAT_LINEAR_RING_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'posList': ol.xml.makeReplacer(ol.format.GML.readFlatPosList_)
    });
