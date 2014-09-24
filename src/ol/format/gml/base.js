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
goog.require('ol.format.Feature');
goog.require('ol.format.XMLFeature');
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
   * @protected
   * @type {string}
   */
  this.featureType = options.featureType;

  /**
   * @protected
   * @type {string}
   */
  this.featureNS = options.featureNS;

  /**
   * @protected
   * @type {string}
   */
  this.srsName = options.srsName;

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
      this.constructor.GEOMETRY_PARSERS_, node, objectStack, this);
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
 * @return {ol.geom.Point|undefined} Point.
 */
ol.format.GML.prototype.readPoint = function(node, objectStack) {
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
 * @return {ol.geom.MultiPoint|undefined} MultiPoint.
 */
ol.format.GML.prototype.readMultiPoint = function(node, objectStack) {
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
 * @return {ol.geom.MultiLineString|undefined} MultiLineString.
 */
ol.format.GML.prototype.readMultiLineString = function(node, objectStack) {
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
 * @return {ol.geom.MultiPolygon|undefined} MultiPolygon.
 */
ol.format.GML.prototype.readMultiPolygon = function(node, objectStack) {
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
ol.format.GML.prototype.polygonMemberParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'polygonMember' ||
      node.localName == 'polygonMembers');
  ol.xml.parse(ol.format.GML.POLYGONMEMBER_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {ol.geom.LineString|undefined} LineString.
 */
ol.format.GML.prototype.readLineString = function(node, objectStack) {
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
 * @return {ol.geom.LinearRing|undefined} LinearRing.
 */
ol.format.GML.prototype.readLinearRing = function(node, objectStack) {
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
 * @return {ol.geom.Polygon|undefined} Polygon.
 */
ol.format.GML.prototype.readPolygon = function(node, objectStack) {
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
        ol.format.GML.prototype.readLineString)
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
        ol.format.GML.prototype.readPolygon)
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
    'featureType': this.featureType,
    'featureNS': this.featureNS
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
