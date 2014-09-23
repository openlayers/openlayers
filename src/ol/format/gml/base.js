// FIXME Envelopes should not be treated as geometries! readEnvelope_ is part
// of GEOMETRY_PARSERS_ and methods using GEOMETRY_PARSERS_ do not expect
// envelopes/extents, only geometries!
goog.provide('ol.format.GML');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.NodeType');
goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('ol.format.Feature');
goog.require('ol.format.XMLFeature');
goog.require('ol.format.XSD');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.LineString');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
goog.require('ol.xml');



/**
 * @classdesc
 * Feature format for reading and writing data in the GML format.
 * Currently only supports GML 3.1.1 Simple Features profile.
 *
 * @constructor
 * @param {olx.format.GMLOptions=} opt_options
 *     Optional configuration object.
 * @extends {ol.format.XMLFeature}
 * @api stable
 */
ol.format.GML = function(opt_options) {
  var options = /** @type {olx.format.GMLOptions} */
      (goog.isDef(opt_options) ? opt_options : {});

  /**
   * @private
   * @type {string}
   */
  this.featureType_ = options.featureType;

  /**
   * @private
   * @type {string}
   */
  this.featureNS_ = options.featureNS;

  /**
   * @private
   * @type {string}
   */
  this.srsName_ = options.srsName;

  /**
   * @private
   * @type {boolean}
   */
  this.surface_ = goog.isDef(options.surface) ?
      options.surface : false;

  /**
   * @private
   * @type {boolean}
   */
  this.curve_ = goog.isDef(options.curve) ?
      options.curve : false;

  /**
   * @private
   * @type {boolean}
   */
  this.multiCurve_ = goog.isDef(options.multiCurve) ?
      options.multiCurve : true;

  /**
   * @private
   * @type {boolean}
   */
  this.multiSurface_ = goog.isDef(options.multiSurface) ?
      options.multiSurface : true;

  /**
   * @protected
   * @type {string}
   */
  this.schemaLocation = goog.isDef(options.schemaLocation) ?
      options.schemaLocation : this.constructor.schemaLocation_;

  goog.base(this);
};
goog.inherits(ol.format.GML, ol.format.XMLFeature);


/**
 * @const
 * @type {string}
 * @private
 */
ol.format.GML.schemaLocation_ = 'http://www.opengis.net/gml ' +
    'http://schemas.opengis.net/gml/3.1.1/profiles/gmlsfProfile/' +
    '1.0.0/gmlsf.xsd';


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<ol.Feature>} Features.
 * @private
 */
ol.format.GML.prototype.readFeatures_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  var localName = ol.xml.getLocalName(node);
  var features;
  if (localName == 'FeatureCollection') {
    features = ol.xml.pushParseAndPop(null,
        ol.format.GML.FEATURE_COLLECTION_PARSERS, node,
        objectStack, this);
  } else if (localName == 'featureMembers' || localName == 'featureMember') {
    var context = objectStack[0];
    goog.asserts.assert(goog.isObject(context));
    var featureType = goog.object.get(context, 'featureType');
    if (!goog.isDef(featureType) && !goog.isNull(node.firstElementChild)) {
      var member = node.firstElementChild;
      featureType = member.nodeName.split(':').pop();
      goog.object.set(context, 'featureType', featureType);
      goog.object.set(context, 'featureNS', member.namespaceURI);
    }
    var parsers = {};
    var parsersNS = {};
    parsers[featureType] = (localName == 'featureMembers') ?
        ol.xml.makeArrayPusher(this.readFeature_, this) :
        ol.xml.makeReplacer(this.readFeature_, this);
    parsersNS[goog.object.get(context, 'featureNS')] = parsers;
    features = ol.xml.pushParseAndPop([], parsersNS, node, objectStack);
  }
  if (!goog.isDef(features)) {
    features = [];
  }
  return features;
};


/**
 * @type {Object.<string, Object.<string, Object>>}
 */
ol.format.GML.FEATURE_COLLECTION_PARSERS = {
  'http://www.opengis.net/gml': {
    'featureMember': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.readFeatures_),
    'featureMembers': ol.xml.makeReplacer(ol.format.GML.prototype.readFeatures_)
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {ol.geom.Geometry|undefined} Geometry.
 */
ol.format.GML.prototype.readGeometryElement = function(node, objectStack) {
  var context = objectStack[0];
  goog.asserts.assert(goog.isObject(context));
  goog.object.set(context, 'srsName',
      node.firstElementChild.getAttribute('srsName'));
  var geometry = ol.xml.pushParseAndPop(/** @type {ol.geom.Geometry} */(null),
      ol.format.GML.GEOMETRY_PARSERS_, node, objectStack, this);
  if (goog.isDefAndNotNull(geometry)) {
    return /** @type {ol.geom.Geometry} */ (
        ol.format.Feature.transformWithOptions(geometry, false, context));
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {ol.Feature} Feature.
 * @private
 */
ol.format.GML.prototype.readFeature_ = function(node, objectStack) {
  var n;
  var fid = node.getAttribute('fid') ||
      ol.xml.getAttributeNS(node, 'http://www.opengis.net/gml', 'id');
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
      values[geometryName] = this.readGeometryElement(n, objectStack);
    }
  }
  var feature = new ol.Feature(values);
  if (goog.isDef(geometryName)) {
    feature.setGeometryName(geometryName);
  }
  if (fid) {
    feature.setId(fid);
  }
  return feature;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.Point|undefined} Point.
 */
ol.format.GML.prototype.readPoint_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Point');
  var flatCoordinates =
      this.readFlatCoordinatesFromNode_(node, objectStack);
  if (goog.isDefAndNotNull(flatCoordinates)) {
    var point = new ol.geom.Point(null);
    goog.asserts.assert(flatCoordinates.length == 3);
    point.setFlatCoordinates(ol.geom.GeometryLayout.XYZ, flatCoordinates);
    return point;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.MultiPoint|undefined} MultiPoint.
 */
ol.format.GML.prototype.readMultiPoint_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'MultiPoint');
  var coordinates = ol.xml.pushParseAndPop(
      /** @type {Array.<Array.<number>>} */ ([]),
      ol.format.GML.MULTIPOINT_PARSERS_, node, objectStack, this);
  if (goog.isDef(coordinates)) {
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
ol.format.GML.prototype.readMultiLineString_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'MultiLineString');
  var lineStrings = ol.xml.pushParseAndPop(
      /** @type {Array.<ol.geom.LineString>} */ ([]),
      ol.format.GML.MULTILINESTRING_PARSERS_, node, objectStack, this);
  if (goog.isDef(lineStrings)) {
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
ol.format.GML.prototype.readMultiCurve_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'MultiCurve');
  var lineStrings = ol.xml.pushParseAndPop(
      /** @type {Array.<ol.geom.LineString>} */ ([]),
      ol.format.GML.MULTICURVE_PARSERS_, node, objectStack, this);
  if (goog.isDef(lineStrings)) {
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
ol.format.GML.prototype.readMultiSurface_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'MultiSurface');
  var polygons = ol.xml.pushParseAndPop(
      /** @type {Array.<ol.geom.Polygon>} */ ([]),
      ol.format.GML.MULTISURFACE_PARSERS_, node, objectStack, this);
  if (goog.isDef(polygons)) {
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
ol.format.GML.prototype.readMultiPolygon_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'MultiPolygon');
  var polygons = ol.xml.pushParseAndPop(
      /** @type {Array.<ol.geom.Polygon>} */ ([]),
      ol.format.GML.MULTIPOLYGON_PARSERS_, node, objectStack, this);
  if (goog.isDef(polygons)) {
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
ol.format.GML.prototype.pointMemberParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'pointMember' ||
      node.localName == 'pointMembers');
  ol.xml.parse(ol.format.GML.POINTMEMBER_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML.prototype.lineStringMemberParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'lineStringMember' ||
      node.localName == 'lineStringMembers');
  ol.xml.parse(ol.format.GML.LINESTRINGMEMBER_PARSERS_,
      node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML.prototype.curveMemberParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'curveMember' ||
      node.localName == 'curveMembers');
  ol.xml.parse(ol.format.GML.CURVEMEMBER_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML.prototype.surfaceMemberParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'surfaceMember' ||
      node.localName == 'surfaceMembers');
  ol.xml.parse(ol.format.GML.SURFACEMEMBER_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML.prototype.polygonMemberParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'polygonMember' ||
      node.localName == 'polygonMembers');
  ol.xml.parse(ol.format.GML.POLYGONMEMBER_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.LineString|undefined} LineString.
 */
ol.format.GML.prototype.readLineString_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'LineString');
  var flatCoordinates =
      this.readFlatCoordinatesFromNode_(node, objectStack);
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
 * @return {Array.<(Array.<number>)>|undefined} flat coordinates.
 */
ol.format.GML.prototype.readPatch_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'patches');
  return ol.xml.pushParseAndPop(
      /** @type {Array.<Array.<number>>} */ ([null]),
      ol.format.GML.PATCHES_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>|undefined} flat coordinates.
 */
ol.format.GML.prototype.readSegment_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'segments');
  return ol.xml.pushParseAndPop(
      /** @type {Array.<number>} */ ([null]),
      ol.format.GML.SEGMENTS_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<(Array.<number>)>|undefined} flat coordinates.
 */
ol.format.GML.prototype.readPolygonPatch_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'PolygonPatch');
  return ol.xml.pushParseAndPop(
      /** @type {Array.<Array.<number>>} */ ([null]),
      ol.format.GML.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>|undefined} flat coordinates.
 */
ol.format.GML.prototype.readLineStringSegment_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'LineStringSegment');
  return ol.xml.pushParseAndPop(
      /** @type {Array.<number>} */ ([null]),
      ol.format.GML.GEOMETRY_FLAT_COORDINATES_PARSERS_,
      node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GML.prototype.interiorParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'interior');
  var flatLinearRing = ol.xml.pushParseAndPop(
      /** @type {Array.<number>|undefined} */ (undefined),
      ol.format.GML.RING_PARSERS, node, objectStack, this);
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
ol.format.GML.prototype.exteriorParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'exterior');
  var flatLinearRing = ol.xml.pushParseAndPop(
      /** @type {Array.<number>|undefined} */ (undefined),
      ol.format.GML.RING_PARSERS, node, objectStack, this);
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
 * @return {Array.<number>|undefined} LinearRing flat coordinates.
 */
ol.format.GML.prototype.readFlatLinearRing_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'LinearRing');
  var ring = ol.xml.pushParseAndPop(/** @type {Array.<number>} */(null),
      this.constructor.GEOMETRY_FLAT_COORDINATES_PARSERS_, node,
      objectStack, this);
  if (goog.isDefAndNotNull(ring)) {
    return ring;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.LinearRing|undefined} LinearRing.
 */
ol.format.GML.prototype.readLinearRing_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'LinearRing');
  var flatCoordinates =
      this.readFlatCoordinatesFromNode_(node, objectStack);
  if (goog.isDef(flatCoordinates)) {
    var ring = new ol.geom.LinearRing(null);
    ring.setFlatCoordinates(ol.geom.GeometryLayout.XYZ, flatCoordinates);
    return ring;
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
ol.format.GML.prototype.readPolygon_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Polygon');
  var flatLinearRings = ol.xml.pushParseAndPop(
      /** @type {Array.<Array.<number>>} */ ([null]),
      this.constructor.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack, this);
  if (goog.isDef(flatLinearRings) &&
      !goog.isNull(flatLinearRings[0])) {
    var polygon = new ol.geom.Polygon(null);
    var flatCoordinates = flatLinearRings[0];
    var ends = [flatCoordinates.length];
    var i, ii;
    for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
      ol.array.safeExtend(flatCoordinates, flatLinearRings[i]);
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
ol.format.GML.prototype.readSurface_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Surface');
  var flatLinearRings = ol.xml.pushParseAndPop(
      /** @type {Array.<Array.<number>>} */ ([null]),
      ol.format.GML.SURFACE_PARSERS_, node, objectStack, this);
  if (goog.isDef(flatLinearRings) &&
      !goog.isNull(flatLinearRings[0])) {
    var polygon = new ol.geom.Polygon(null);
    var flatCoordinates = flatLinearRings[0];
    var ends = [flatCoordinates.length];
    var i, ii;
    for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
      ol.array.safeExtend(flatCoordinates, flatLinearRings[i]);
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
ol.format.GML.prototype.readCurve_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Curve');
  var flatCoordinates = ol.xml.pushParseAndPop(
      /** @type {Array.<number>} */ ([null]),
      ol.format.GML.CURVE_PARSERS_, node, objectStack, this);
  if (goog.isDef(flatCoordinates)) {
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
ol.format.GML.prototype.readEnvelope_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Envelope');
  var flatCoordinates = ol.xml.pushParseAndPop(
      /** @type {Array.<number>} */ ([null]),
      ol.format.GML.ENVELOPE_PARSERS_, node, objectStack, this);
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
ol.format.GML.prototype.readFlatCoordinatesFromNode_ = function(node,
                                                                objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  return /** @type {Array.<number>} */ (ol.xml.pushParseAndPop(
      null,
      this.constructor.GEOMETRY_FLAT_COORDINATES_PARSERS_, node,
      objectStack, this));
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>|undefined} Flat coordinates.
 */
ol.format.GML.prototype.readFlatPos_ = function(node, objectStack) {
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
  goog.asserts.assert(goog.isObject(context));
  var containerSrs = goog.object.get(context, 'srsName');
  var axisOrientation = 'enu';
  if (!goog.isNull(containerSrs)) {
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
ol.format.GML.prototype.readFlatPosList_ = function(node, objectStack) {
  var s = ol.xml.getAllTextContent(node, false).replace(/^\s*|\s*$/g, '');
  var context = objectStack[0];
  goog.asserts.assert(goog.isObject(context));
  var containerSrs = goog.object.get(context, 'srsName');
  var containerDimension = node.parentNode.getAttribute('srsDimension');
  var axisOrientation = 'enu';
  if (!goog.isNull(containerSrs)) {
    var proj = ol.proj.get(containerSrs);
    axisOrientation = proj.getAxisOrientation();
  }
  var coords = s.split(/\s+/);
  // The "dimension" attribute is from the GML 3.0.1 spec.
  var dim = 2;
  if (!goog.isNull(node.getAttribute('srsDimension'))) {
    dim = ol.format.XSD.readNonNegativeIntegerString(
        node.getAttribute('srsDimension'));
  } else if (!goog.isNull(node.getAttribute('dimension'))) {
    dim = ol.format.XSD.readNonNegativeIntegerString(
        node.getAttribute('dimension'));
  } else if (!goog.isNull(containerDimension)) {
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
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.GEOMETRY_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'Point': ol.xml.makeReplacer(ol.format.GML.prototype.readPoint_),
    'MultiPoint': ol.xml.makeReplacer(ol.format.GML.prototype.readMultiPoint_),
    'LineString': ol.xml.makeReplacer(ol.format.GML.prototype.readLineString_),
    'MultiLineString': ol.xml.makeReplacer(
        ol.format.GML.prototype.readMultiLineString_),
    'LinearRing' : ol.xml.makeReplacer(
        ol.format.GML.prototype.readLinearRing_),
    'Polygon': ol.xml.makeReplacer(ol.format.GML.prototype.readPolygon_),
    'MultiPolygon': ol.xml.makeReplacer(
        ol.format.GML.prototype.readMultiPolygon_),
    'Surface': ol.xml.makeReplacer(ol.format.GML.prototype.readSurface_),
    'MultiSurface': ol.xml.makeReplacer(
        ol.format.GML.prototype.readMultiSurface_),
    'Curve': ol.xml.makeReplacer(ol.format.GML.prototype.readCurve_),
    'MultiCurve': ol.xml.makeReplacer(
        ol.format.GML.prototype.readMultiCurve_),
    'Envelope': ol.xml.makeReplacer(ol.format.GML.prototype.readEnvelope_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.GEOMETRY_FLAT_COORDINATES_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'pos': ol.xml.makeReplacer(ol.format.GML.prototype.readFlatPos_),
    'posList': ol.xml.makeReplacer(ol.format.GML.prototype.readFlatPosList_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.FLAT_LINEAR_RINGS_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'interior': ol.format.GML.prototype.interiorParser_,
    'exterior': ol.format.GML.prototype.exteriorParser_
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.MULTIPOINT_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'pointMember': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.pointMemberParser_),
    'pointMembers': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.pointMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.MULTILINESTRING_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'lineStringMember': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.lineStringMemberParser_),
    'lineStringMembers': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.lineStringMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.MULTICURVE_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'curveMember': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.curveMemberParser_),
    'curveMembers': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.curveMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.MULTISURFACE_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'surfaceMember': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.surfaceMemberParser_),
    'surfaceMembers': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.surfaceMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.MULTIPOLYGON_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'polygonMember': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.polygonMemberParser_),
    'polygonMembers': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.polygonMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.POINTMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'Point': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.readFlatCoordinatesFromNode_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.LINESTRINGMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'LineString': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.readLineString_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.CURVEMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'LineString': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.readLineString_),
    'Curve': ol.xml.makeArrayPusher(ol.format.GML.prototype.readCurve_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.SURFACEMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'Polygon': ol.xml.makeArrayPusher(ol.format.GML.prototype.readPolygon_),
    'Surface': ol.xml.makeArrayPusher(ol.format.GML.prototype.readSurface_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.POLYGONMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'Polygon': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.readPolygon_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.SURFACE_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'patches': ol.xml.makeReplacer(ol.format.GML.prototype.readPatch_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.CURVE_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'segments': ol.xml.makeReplacer(ol.format.GML.prototype.readSegment_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.ENVELOPE_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'lowerCorner': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.readFlatPosList_),
    'upperCorner': ol.xml.makeArrayPusher(
        ol.format.GML.prototype.readFlatPosList_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.PATCHES_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'PolygonPatch': ol.xml.makeReplacer(
        ol.format.GML.prototype.readPolygonPatch_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GML.SEGMENTS_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'LineStringSegment': ol.xml.makeReplacer(
        ol.format.GML.prototype.readLineStringSegment_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @protected
 */
ol.format.GML.RING_PARSERS = {
  'http://www.opengis.net/gml' : {
    'LinearRing': ol.xml.makeReplacer(
        ol.format.GML.prototype.readFlatLinearRing_)
  }
};


/**
 * @inheritDoc
 */
ol.format.GML.prototype.readGeometryFromNode = function(node, opt_options) {
  var geometry = this.readGeometryElement(node,
      [this.getReadOptions(node, goog.isDef(opt_options) ? opt_options : {})]);
  return (goog.isDef(geometry) ? geometry : null);
};


/**
 * Read all features from a GML FeatureCollection.
 *
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @return {Array.<ol.Feature>} Features.
 * @api stable
 */
ol.format.GML.prototype.readFeatures;


/**
 * @inheritDoc
 */
ol.format.GML.prototype.readFeaturesFromNode = function(node, opt_options) {
  var options = {
    'featureType': this.featureType_,
    'featureNS': this.featureNS_
  };
  if (goog.isDef(opt_options)) {
    goog.object.extend(options, this.getReadOptions(node, opt_options));
  }
  return this.readFeatures_(node, [options]);
};


/**
 * @inheritDoc
 */
ol.format.GML.prototype.readProjectionFromNode = function(node) {
  return ol.proj.get(goog.isDef(this.srsName_) ? this.srsName_ :
      node.firstElementChild.getAttribute('srsName'));
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Point} value Point geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML.prototype.writePos_ = function(node, value, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var srsName = goog.object.get(context, 'srsName');
  var axisOrientation = 'enu';
  if (goog.isDefAndNotNull(srsName)) {
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
 * @return {string}
 * @private
 */
ol.format.GML.prototype.getCoords_ = function(point, opt_srsName) {
  var axisOrientation = 'enu';
  if (goog.isDefAndNotNull(opt_srsName)) {
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
ol.format.GML.prototype.writePosList_ = function(node, value, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var srsName = goog.object.get(context, 'srsName');
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
ol.format.GML.prototype.writePoint_ = function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var srsName = goog.object.get(context, 'srsName');
  if (goog.isDefAndNotNull(srsName)) {
    node.setAttribute('srsName', srsName);
  }
  var pos = ol.xml.createElementNS(node.namespaceURI, 'pos');
  node.appendChild(pos);
  this.writePos_(pos, geometry, objectStack);
};


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GML.ENVELOPE_SERIALIZERS_ = {
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
ol.format.GML.prototype.writeEnvelope = function(node, extent, objectStack) {
  goog.asserts.assert(extent.length == 4);
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var srsName = goog.object.get(context, 'srsName');
  if (goog.isDef(srsName)) {
    node.setAttribute('srsName', srsName);
  }
  var keys = ['lowerCorner', 'upperCorner'];
  var values = [extent[0] + ' ' + extent[1], extent[2] + ' ' + extent[3]];
  ol.xml.pushSerializeAndPop(/** @type {ol.xml.NodeStackItem} */
      ({node: node}), ol.format.GML.ENVELOPE_SERIALIZERS_,
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
ol.format.GML.prototype.writeLinearRing_ =
    function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var srsName = goog.object.get(context, 'srsName');
  if (goog.isDefAndNotNull(srsName)) {
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
ol.format.GML.prototype.RING_NODE_FACTORY_ =
    function(value, objectStack, opt_nodeName) {
  var context = objectStack[objectStack.length - 1];
  var parentNode = context.node;
  goog.asserts.assert(goog.isObject(context));
  var exteriorWritten = goog.object.get(context, 'exteriorWritten');
  if (!goog.isDef(exteriorWritten)) {
    goog.object.set(context, 'exteriorWritten', true);
  }
  return ol.xml.createElementNS(parentNode.namespaceURI,
      goog.isDef(exteriorWritten) ? 'interior' : 'exterior');
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} geometry Polygon geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML.prototype.writeSurfaceOrPolygon_ =
    function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var srsName = goog.object.get(context, 'srsName');
  if (node.nodeName !== 'PolygonPatch' && goog.isDefAndNotNull(srsName)) {
    node.setAttribute('srsName', srsName);
  }
  if (node.nodeName === 'Polygon' || node.nodeName === 'PolygonPatch') {
    var rings = geometry.getLinearRings();
    ol.xml.pushSerializeAndPop(
        {node: node, srsName: srsName},
        ol.format.GML.RING_SERIALIZERS_,
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
ol.format.GML.prototype.writeCurveOrLineString_ =
    function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var srsName = goog.object.get(context, 'srsName');
  if (node.nodeName !== 'LineStringSegment' && goog.isDefAndNotNull(srsName)) {
    node.setAttribute('srsName', srsName);
  }
  if (node.nodeName === 'LineString' || node.nodeName === 'LineStringSegment') {
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
ol.format.GML.prototype.writeMultiSurfaceOrPolygon_ = function(node, geometry,
    objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var srsName = goog.object.get(context, 'srsName');
  var surface = goog.object.get(context, 'surface');
  if (goog.isDefAndNotNull(srsName)) {
    node.setAttribute('srsName', srsName);
  }
  var polygons = geometry.getPolygons();
  ol.xml.pushSerializeAndPop({node: node, srsName: srsName, surface: surface},
      ol.format.GML.SURFACEORPOLYGONMEMBER_SERIALIZERS_,
      this.MULTIGEOMETRY_MEMBER_NODE_FACTORY_, polygons,
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.MultiPoint} geometry MultiPoint geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML.prototype.writeMultiPoint_ = function(node, geometry,
    objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var srsName = goog.object.get(context, 'srsName');
  if (goog.isDefAndNotNull(srsName)) {
    node.setAttribute('srsName', srsName);
  }
  var points = geometry.getPoints();
  ol.xml.pushSerializeAndPop({node: node, srsName: srsName},
      ol.format.GML.POINTMEMBER_SERIALIZERS_,
      ol.xml.makeSimpleNodeFactory('pointMember'), points,
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.MultiLineString} geometry MultiLineString geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML.prototype.writeMultiCurveOrLineString_ = function(node, geometry,
    objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var srsName = goog.object.get(context, 'srsName');
  var curve = goog.object.get(context, 'curve');
  if (goog.isDefAndNotNull(srsName)) {
    node.setAttribute('srsName', srsName);
  }
  var lines = geometry.getLineStrings();
  ol.xml.pushSerializeAndPop({node: node, srsName: srsName, curve: curve},
      ol.format.GML.LINESTRINGORCURVEMEMBER_SERIALIZERS_,
      this.MULTIGEOMETRY_MEMBER_NODE_FACTORY_, lines,
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LinearRing} ring LinearRing geometry.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GML.prototype.writeRing_ = function(node, ring, objectStack) {
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
ol.format.GML.prototype.writeSurfaceOrPolygonMember_ = function(node, polygon,
    objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var child = this.GEOMETRY_NODE_FACTORY_(
      polygon, objectStack);
  if (goog.isDef(child)) {
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
ol.format.GML.prototype.writePointMember_ = function(node, point, objectStack) {
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
ol.format.GML.prototype.writeLineStringOrCurveMember_ = function(node, line,
    objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var child = this.GEOMETRY_NODE_FACTORY_(line, objectStack);
  if (goog.isDef(child)) {
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
ol.format.GML.prototype.writeSurfacePatches_ =
    function(node, polygon, objectStack) {
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
ol.format.GML.prototype.writeCurveSegments_ =
    function(node, line, objectStack) {
  var child = ol.xml.createElementNS(node.namespaceURI, 'LineStringSegment');
  node.appendChild(child);
  this.writeCurveOrLineString_(child, line, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Geometry|ol.Extent} geometry Geometry.
 * @param {Array.<*>} objectStack Node stack.
 */
ol.format.GML.prototype.writeGeometryElement =
    function(node, geometry, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var item = goog.object.clone(context);
  item.node = node;
  var value;
  if (goog.isArray(geometry)) {
    if (goog.isDef(context.dataProjection)) {
      value = ol.proj.transformExtent(
          geometry, context.featureProjection, context.dataProjection);
    } else {
      value = geometry;
    }
  } else {
    goog.asserts.assertInstanceof(geometry, ol.geom.Geometry);
    value =
        ol.format.Feature.transformWithOptions(geometry, true, context);
  }
  ol.xml.pushSerializeAndPop(/** @type {ol.xml.NodeStackItem} */
      (item), ol.format.GML.GEOMETRY_SERIALIZERS_,
      this.GEOMETRY_NODE_FACTORY_, [value],
      objectStack, undefined, this);
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Node stack.
 */
ol.format.GML.prototype.writeFeatureElement =
    function(node, feature, objectStack) {
  var fid = feature.getId();
  if (goog.isDef(fid)) {
    node.setAttribute('fid', fid);
  }
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var featureNS = goog.object.get(context, 'featureNS');
  var geometryName = feature.getGeometryName();
  if (!goog.isDef(context.serializers)) {
    context.serializers = {};
    context.serializers[featureNS] = {};
  }
  var properties = feature.getProperties();
  var keys = [], values = [];
  for (var key in properties) {
    var value = properties[key];
    if (!goog.isNull(value)) {
      keys.push(key);
      values.push(value);
      if (key == geometryName) {
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
  var item = goog.object.clone(context);
  item.node = node;
  ol.xml.pushSerializeAndPop(/** @type {ol.xml.NodeStackItem} */
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
ol.format.GML.prototype.writeFeatureMembers_ =
    function(node, features, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var featureType = goog.object.get(context, 'featureType');
  var featureNS = goog.object.get(context, 'featureNS');
  var serializers = {};
  serializers[featureNS] = {};
  serializers[featureNS][featureType] = ol.xml.makeChildAppender(
      this.writeFeatureElement, this);
  var item = goog.object.clone(context);
  item.node = node;
  ol.xml.pushSerializeAndPop(/** @type {ol.xml.NodeStackItem} */
      (item),
      serializers,
      ol.xml.makeSimpleNodeFactory(featureType, featureNS), features,
      objectStack);
};


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GML.SURFACEORPOLYGONMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'surfaceMember': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeSurfaceOrPolygonMember_),
    'polygonMember': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeSurfaceOrPolygonMember_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GML.POINTMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'pointMember': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writePointMember_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GML.LINESTRINGORCURVEMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'lineStringMember': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeLineStringOrCurveMember_),
    'curveMember': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeLineStringOrCurveMember_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GML.RING_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'exterior': ol.xml.makeChildAppender(ol.format.GML.prototype.writeRing_),
    'interior': ol.xml.makeChildAppender(ol.format.GML.prototype.writeRing_)
  }
};


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GML.GEOMETRY_SERIALIZERS_ = {
  'http://www.opengis.net/gml': {
    'Curve': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeCurveOrLineString_),
    'MultiCurve': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeMultiCurveOrLineString_),
    'Point': ol.xml.makeChildAppender(ol.format.GML.prototype.writePoint_),
    'MultiPoint': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeMultiPoint_),
    'LineString': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeCurveOrLineString_),
    'MultiLineString': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeMultiCurveOrLineString_),
    'LinearRing': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeLinearRing_),
    'Polygon': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeSurfaceOrPolygon_),
    'MultiPolygon': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeMultiSurfaceOrPolygon_),
    'Surface': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeSurfaceOrPolygon_),
    'MultiSurface': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeMultiSurfaceOrPolygon_),
    'Envelope': ol.xml.makeChildAppender(
        ol.format.GML.prototype.writeEnvelope)
  }
};


/**
 * @const
 * @type {Object.<string, string>}
 * @private
 */
ol.format.GML.MULTIGEOMETRY_TO_MEMBER_NODENAME_ = {
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
ol.format.GML.prototype.MULTIGEOMETRY_MEMBER_NODE_FACTORY_ = function(value,
    objectStack, opt_nodeName) {
  var parentNode = objectStack[objectStack.length - 1].node;
  goog.asserts.assert(ol.xml.isNode(parentNode));
  return ol.xml.createElementNS('http://www.opengis.net/gml',
      ol.format.GML.MULTIGEOMETRY_TO_MEMBER_NODENAME_[parentNode.nodeName]);
};


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 * @private
 */
ol.format.GML.prototype.GEOMETRY_NODE_FACTORY_ = function(value, objectStack,
    opt_nodeName) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context));
  var multiSurface = goog.object.get(context, 'multiSurface');
  var surface = goog.object.get(context, 'surface');
  var curve = goog.object.get(context, 'curve');
  var multiCurve = goog.object.get(context, 'multiCurve');
  var parentNode = objectStack[objectStack.length - 1].node;
  goog.asserts.assert(ol.xml.isNode(parentNode));
  var nodeName;
  if (!goog.isArray(value)) {
    goog.asserts.assertInstanceof(value, ol.geom.Geometry);
    nodeName = value.getType();
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
 * @inheritDoc
 */
ol.format.GML.prototype.writeGeometryNode = function(geometry, opt_options) {
  var geom = ol.xml.createElementNS('http://www.opengis.net/gml', 'geom');
  var context = {node: geom, srsName: this.srsName_,
    curve: this.curve_, surface: this.surface_,
    multiSurface: this.multiSurface_, multiCurve: this.multiCurve_};
  if (goog.isDef(opt_options)) {
    goog.object.extend(context, opt_options);
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
 * @return {Node} Result.
 * @api stable
 */
ol.format.GML.prototype.writeFeatures;


/**
 * @inheritDoc
 */
ol.format.GML.prototype.writeFeaturesNode = function(features, opt_options) {
  var node = ol.xml.createElementNS('http://www.opengis.net/gml',
      'featureMembers');
  ol.xml.setAttributeNS(node, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation);
  var context = {
    srsName: this.srsName_,
    curve: this.curve_,
    surface: this.surface_,
    multiSurface: this.multiSurface_,
    multiCurve: this.multiCurve_,
    featureNS: this.featureNS_,
    featureType: this.featureType_
  };
  if (goog.isDef(opt_options)) {
    goog.object.extend(context, opt_options);
  }
  this.writeFeatureMembers_(node, features, [context]);
  return node;
};
