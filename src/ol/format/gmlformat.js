goog.provide('ol.format.GML');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.NodeType');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.format.XML');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
goog.require('ol.xml');



/**
 * @constructor
 * @param {olx.format.GMLOptions=} opt_options
 *     Optional configuration object.
 * @extends {ol.format.XML}
 * @todo stability experimental
 */
ol.format.GML = function(opt_options) {
  var options = /** @type {olx.format.GMLOptions} */
      (goog.isDef(opt_options) ? opt_options : {});
  this.featureType_ = options.featureType;
  this.featureNS_ = options.featureNS;
  this.NAMESPACE_URIS_ = goog.array.clone(ol.format.GML.NAMESPACE_URIS_);
  goog.base(this);
};
goog.inherits(ol.format.GML, ol.format.XML);


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
ol.format.GML.NAMESPACE_URIS_ = [
  'http://www.opengis.net/gml',
  'http://www.opengis.net/wfs'
];


/**
 * @inheritDoc
 */
ol.format.GML.prototype.readFeaturesFromNode = function(node) {
  if (goog.array.indexOf(this.NAMESPACE_URIS_,
      this.featureNS_) === -1) {
    this.NAMESPACE_URIS_.push(this.featureNS_);
  }
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  if (goog.array.indexOf(this.NAMESPACE_URIS_, node.namespaceURI) ==
      -1) {
    return [];
  }
  var features, n, fs;
  var localName = ol.xml.getLocalName(node);
  if (localName === this.featureType_) {
    var feature = this.readFeatureFromNode(node);
    if (goog.isDef(feature)) {
      return [feature];
    } else {
      return [];
    }
  } else if (localName == 'featureMembers') {
    features = [];
    for (n = node.firstElementChild; !goog.isNull(n);
         n = n.nextElementSibling) {
      fs = this.readFeaturesFromNode(n);
      if (goog.isDef(fs)) {
        goog.array.extend(features, fs);
      }
    }
    return features;
  } else if (localName == 'FeatureCollection') {
    features = [];
    for (n = node.firstElementChild; !goog.isNull(n);
         n = n.nextElementSibling) {
      fs = this.readFeaturesFromNode(n);
      if (goog.isDef(fs)) {
        goog.array.extend(features, fs);
      }
    }
    return features;
  } else {
    return [];
  }
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
 * @return {ol.Feature} Feature.
 */
ol.format.GML.prototype.readFeatureFromNode = function(node) {
  var n;
  var values = {}, geometryName;
  for (n = node.firstElementChild; !goog.isNull(n);
      n = n.nextElementSibling) {
    // Assume attribute elements have one child node and that the child
    // is a text node.  Otherwise assume it is a geometry node.
    if (n.childNodes.length === 0 ||
        (n.childNodes.length === 1 &&
        n.firstChild.nodeType === 3)) {
      var value = ol.xml.getAllTextContent(n, false);
      if (goog.string.isEmpty(value)) {
        value = undefined;
      }
      values[ol.xml.getLocalName(n)] = value;
    } else {
      geometryName = ol.xml.getLocalName(n);
      values[geometryName] = this.readGeometryFromNode(n);
    }
  }
  var feature = new ol.Feature(values);
  if (goog.isDef(geometryName)) {
    feature.setGeometryName(geometryName);
  }
  return feature;
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
 * @return {ol.geom.MultiPoint|undefined} MultiPoint.
 */
ol.format.GML.readMultiPoint_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'MultiPoint');
  var coordinates = ol.xml.pushParseAndPop(
      /** @type {Array.<Array.<number>>} */ ([]),
      ol.format.GML.MULTIPOINT_PARSERS_, node, objectStack);
  if (goog.isDefAndNotNull(coordinates)) {
    return new ol.geom.MultiPoint(coordinates);
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.MultiLineString|undefined} MultiLineString.
 */
ol.format.GML.readMultiLineString_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'MultiLineString');
  var lineStrings = ol.xml.pushParseAndPop(
      /** @type {Array.<ol.geom.LineString>} */ ([]),
      ol.format.GML.MULTILINESTRING_PARSERS_, node, objectStack);
  if (goog.isDefAndNotNull(lineStrings)) {
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
 * @return {ol.geom.MultiLineString|undefined} MultiLineString.
 */
ol.format.GML.readMultiCurve_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'MultiCurve');
  var lineStrings = ol.xml.pushParseAndPop(
      /** @type {Array.<ol.geom.LineString>} */ ([]),
      ol.format.GML.MULTICURVE_PARSERS_, node, objectStack);
  if (goog.isDefAndNotNull(lineStrings)) {
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
ol.format.GML.readMultiSurface_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'MultiSurface');
  var polygons = ol.xml.pushParseAndPop(
      /** @type {Array.<ol.geom.Polygon>} */ ([]),
      ol.format.GML.MULTISURFACE_PARSERS_, node, objectStack);
  if (goog.isDefAndNotNull(polygons)) {
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
 * @return {ol.geom.MultiPolygon|undefined} MultiPolygon.
 */
ol.format.GML.readMultiPolygon_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'MultiPolygon');
  var polygons = ol.xml.pushParseAndPop(
      /** @type {Array.<ol.geom.Polygon>} */ ([]),
      ol.format.GML.MULTIPOLYGON_PARSERS_, node, objectStack);
  if (goog.isDefAndNotNull(polygons)) {
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
ol.format.GML.pointMemberParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'pointMember' ||
      node.localName == 'pointMembers');
  ol.xml.parse(ol.format.GML.POINTMEMBER_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML.lineStringMemberParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'lineStringMember' ||
      node.localName == 'lineStringMembers');
  ol.xml.parse(ol.format.GML.LINESTRINGMEMBER_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML.curveMemberParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'curveMember' ||
      node.localName == 'curveMembers');
  ol.xml.parse(ol.format.GML.CURVEMEMBER_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML.surfaceMemberParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'surfaceMember' ||
      node.localName == 'surfaceMembers');
  ol.xml.parse(ol.format.GML.SURFACEMEMBER_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML.polygonMemberParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'polygonMember' ||
      node.localName == 'polygonMembers');
  ol.xml.parse(ol.format.GML.POLYGONMEMBER_PARSERS_, node, objectStack);
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
      null,
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
  var containerSrs = node.parentNode.getAttribute('srsName');
  var axisOrientation = 'enu';
  if (containerSrs !== null) {
    var proj = ol.proj.get(containerSrs);
    axisOrientation = proj.getAxisOrientation();
  }
  if (axisOrientation === 'neu') {
    flatCoordinates = flatCoordinates.reverse();
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
ol.format.GML.readFlatPosList_ = function(node, objectStack) {
  var s = ol.xml.getAllTextContent(node, false).replace(/^\s*|\s*$/g, '');
  var containerDimension = node.parentNode.getAttribute('srsDimension');
  var containerSrs = node.parentNode.getAttribute('srsName');
  var axisOrientation = 'enu';
  if (containerSrs !== null) {
    var proj = ol.proj.get(containerSrs);
    axisOrientation = proj.getAxisOrientation();
  }
  var coords = s.split(/\s+/);
  // The "dimension" attribute is from the GML 3.0.1 spec.
  var dim = parseInt(node.getAttribute('srsDimension') ||
      node.getAttribute('dimension'), 10) ||
      (containerDimension !== null) ?
      parseInt(containerDimension, 10) : 2;
  var x, y, z;
  var flatCoordinates = [];
  for (var i = 0, ii = coords.length; i < ii; i += dim) {
    x = parseFloat(coords[i]);
    y = parseFloat(coords[i + 1]);
    z = (dim === 3) ? parseFloat(coords[i + 2]) : 0;
    if (axisOrientation === 'enu') {
      flatCoordinates.push(x, y, z);
    } else {
      flatCoordinates.push(y, x, z);
    }
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
      'MultiPoint': ol.xml.makeArrayPusher(ol.format.GML.readMultiPoint_),
      'LineString': ol.xml.makeArrayPusher(ol.format.GML.readLineString_),
      'MultiLineString': ol.xml.makeArrayPusher(
          ol.format.GML.readMultiLineString_),
      'LinearRing' : ol.xml.makeArrayPusher(ol.format.GML.readLinearRing_),
      'Polygon': ol.xml.makeArrayPusher(ol.format.GML.readPolygon_),
      'MultiPolygon': ol.xml.makeArrayPusher(ol.format.GML.readMultiPolygon_),
      'Surface': ol.xml.makeArrayPusher(ol.format.GML.readSurface_),
      'MultiSurface': ol.xml.makeArrayPusher(ol.format.GML.readMultiSurface_),
      'Curve': ol.xml.makeArrayPusher(ol.format.GML.readCurve_),
      'MultiCurve': ol.xml.makeArrayPusher(ol.format.GML.readMultiCurve_),
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
ol.format.GML.MULTIPOINT_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'pointMember': ol.xml.makeArrayPusher(ol.format.GML.pointMemberParser_),
      'pointMembers': ol.xml.makeArrayPusher(ol.format.GML.pointMemberParser_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.MULTILINESTRING_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'lineStringMember': ol.xml.makeArrayPusher(
          ol.format.GML.lineStringMemberParser_),
      'lineStringMembers': ol.xml.makeArrayPusher(
          ol.format.GML.lineStringMemberParser_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.MULTICURVE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'curveMember': ol.xml.makeArrayPusher(
          ol.format.GML.curveMemberParser_),
      'curveMembers': ol.xml.makeArrayPusher(
          ol.format.GML.curveMemberParser_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.MULTISURFACE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'surfaceMember': ol.xml.makeArrayPusher(
          ol.format.GML.surfaceMemberParser_),
      'surfaceMembers': ol.xml.makeArrayPusher(
          ol.format.GML.surfaceMemberParser_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.MULTIPOLYGON_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'polygonMember': ol.xml.makeArrayPusher(
          ol.format.GML.polygonMemberParser_),
      'polygonMembers': ol.xml.makeArrayPusher(
          ol.format.GML.polygonMemberParser_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.POINTMEMBER_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'Point': ol.xml.makeArrayPusher(
          ol.format.GML.readFlatCoordinatesFromNode_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.LINESTRINGMEMBER_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'LineString': ol.xml.makeArrayPusher(
          ol.format.GML.readLineString_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.CURVEMEMBER_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'LineString': ol.xml.makeArrayPusher(ol.format.GML.readLineString_),
      'Curve': ol.xml.makeArrayPusher(ol.format.GML.readCurve_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.SURFACEMEMBER_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'Polygon': ol.xml.makeArrayPusher(ol.format.GML.readPolygon_),
      'Surface': ol.xml.makeArrayPusher(ol.format.GML.readSurface_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.POLYGONMEMBER_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GML.NAMESPACE_URIS_, {
      'Polygon': ol.xml.makeArrayPusher(
          ol.format.GML.readPolygon_)
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
