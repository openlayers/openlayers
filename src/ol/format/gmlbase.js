// FIXME Envelopes should not be treated as geometries! readEnvelope_ is part
// of GEOMETRY_PARSERS_ and methods using GEOMETRY_PARSERS_ do not expect
// envelopes/extents, only geometries!
goog.provide('ol.format.GMLBase');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.Feature');
goog.require('ol.format.Feature');
goog.require('ol.format.XMLFeature');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.LineString');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.obj');
goog.require('ol.proj');
goog.require('ol.xml');


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Feature base format for reading and writing data in the GML format.
 * This class cannot be instantiated, it contains only base content that
 * is shared with versioned format classes ol.format.GML2 and
 * ol.format.GML3.
 *
 * @constructor
 * @param {olx.format.GMLOptions=} opt_options
 *     Optional configuration object.
 * @extends {ol.format.XMLFeature}
 */
ol.format.GMLBase = function(opt_options) {
  var options = /** @type {olx.format.GMLOptions} */
      (opt_options ? opt_options : {});

  /**
   * @protected
   * @type {Array.<string>|string|undefined}
   */
  this.featureType = options.featureType;

  /**
   * @protected
   * @type {Object.<string, string>|string|undefined}
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
  this.schemaLocation = '';

  /**
   * @type {Object.<string, Object.<string, Object>>}
   */
  this.FEATURE_COLLECTION_PARSERS = {};
  this.FEATURE_COLLECTION_PARSERS[ol.format.GMLBase.GMLNS] = {
    'featureMember': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readFeaturesInternal),
    'featureMembers': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readFeaturesInternal)
  };

  ol.format.XMLFeature.call(this);
};
ol.inherits(ol.format.GMLBase, ol.format.XMLFeature);


/**
 * @const
 * @type {string}
 */
ol.format.GMLBase.GMLNS = 'http://www.opengis.net/gml';


/**
 * A regular expression that matches if a string only contains whitespace
 * characters. It will e.g. match `''`, `' '`, `'\n'` etc. The non-breaking
 * space (0xa0) is explicitly included as IE doesn't include it in its
 * definition of `\s`.
 *
 * Information from `goog.string.isEmptyOrWhitespace`: https://github.com/google/closure-library/blob/e877b1e/closure/goog/string/string.js#L156-L160
 *
 * @const
 * @type {RegExp}
 * @private
 */
ol.format.GMLBase.ONLY_WHITESPACE_RE_ = /^[\s\xa0]*$/;


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<ol.Feature> | undefined} Features.
 */
ol.format.GMLBase.prototype.readFeaturesInternal = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  var localName = node.localName;
  var features = null;
  if (localName == 'FeatureCollection') {
    if (node.namespaceURI === 'http://www.opengis.net/wfs') {
      features = ol.xml.pushParseAndPop([],
          this.FEATURE_COLLECTION_PARSERS, node,
          objectStack, this);
    } else {
      features = ol.xml.pushParseAndPop(null,
          this.FEATURE_COLLECTION_PARSERS, node,
          objectStack, this);
    }
  } else if (localName == 'featureMembers' || localName == 'featureMember') {
    var context = objectStack[0];
    var featureType = context['featureType'];
    var featureNS = context['featureNS'];
    var i, ii, prefix = 'p', defaultPrefix = 'p0';
    if (!featureType && node.childNodes) {
      featureType = [], featureNS = {};
      for (i = 0, ii = node.childNodes.length; i < ii; ++i) {
        var child = node.childNodes[i];
        if (child.nodeType === 1) {
          var ft = child.nodeName.split(':').pop();
          if (featureType.indexOf(ft) === -1) {
            var key = '';
            var count = 0;
            var uri = child.namespaceURI;
            for (var candidate in featureNS) {
              if (featureNS[candidate] === uri) {
                key = candidate;
                break;
              }
              ++count;
            }
            if (!key) {
              key = prefix + count;
              featureNS[key] = uri;
            }
            featureType.push(key + ':' + ft);
          }
        }
      }
      if (localName != 'featureMember') {
        // recheck featureType for each featureMember
        context['featureType'] = featureType;
        context['featureNS'] = featureNS;
      }
    }
    if (typeof featureNS === 'string') {
      var ns = featureNS;
      featureNS = {};
      featureNS[defaultPrefix] = ns;
    }
    var parsersNS = {};
    var featureTypes = Array.isArray(featureType) ? featureType : [featureType];
    for (var p in featureNS) {
      var parsers = {};
      for (i = 0, ii = featureTypes.length; i < ii; ++i) {
        var featurePrefix = featureTypes[i].indexOf(':') === -1 ?
            defaultPrefix : featureTypes[i].split(':')[0];
        if (featurePrefix === p) {
          parsers[featureTypes[i].split(':').pop()] =
              (localName == 'featureMembers') ?
              ol.xml.makeArrayPusher(this.readFeatureElement, this) :
              ol.xml.makeReplacer(this.readFeatureElement, this);
        }
      }
      parsersNS[featureNS[p]] = parsers;
    }
    if (localName == 'featureMember') {
      features = ol.xml.pushParseAndPop(undefined, parsersNS, node, objectStack);
    } else {
      features = ol.xml.pushParseAndPop([], parsersNS, node, objectStack);
    }
  }
  if (features === null) {
    features = [];
  }
  return features;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {ol.geom.Geometry|undefined} Geometry.
 */
ol.format.GMLBase.prototype.readGeometryElement = function(node, objectStack) {
  var context = /** @type {Object} */ (objectStack[0]);
  context['srsName'] = node.firstElementChild.getAttribute('srsName');
  /** @type {ol.geom.Geometry} */
  var geometry = ol.xml.pushParseAndPop(null,
      this.GEOMETRY_PARSERS_, node, objectStack, this);
  if (geometry) {
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
 */
ol.format.GMLBase.prototype.readFeatureElement = function(node, objectStack) {
  var n;
  var fid = node.getAttribute('fid') ||
      ol.xml.getAttributeNS(node, ol.format.GMLBase.GMLNS, 'id');
  var values = {}, geometryName;
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    var localName = n.localName;
    // Assume attribute elements have one child node and that the child
    // is a text or CDATA node (to be treated as text).
    // Otherwise assume it is a geometry node.
    if (n.childNodes.length === 0 ||
        (n.childNodes.length === 1 &&
        (n.firstChild.nodeType === 3 || n.firstChild.nodeType === 4))) {
      var value = ol.xml.getAllTextContent(n, false);
      if (ol.format.GMLBase.ONLY_WHITESPACE_RE_.test(value)) {
        value = undefined;
      }
      values[localName] = value;
    } else {
      // boundedBy is an extent and must not be considered as a geometry
      if (localName !== 'boundedBy') {
        geometryName = localName;
      }
      values[localName] = this.readGeometryElement(n, objectStack);
    }
  }
  var feature = new ol.Feature(values);
  if (geometryName) {
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
ol.format.GMLBase.prototype.readPoint = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'Point', 'localName should be Point');
  var flatCoordinates =
      this.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    var point = new ol.geom.Point(null);
    ol.DEBUG && console.assert(flatCoordinates.length == 3,
        'flatCoordinates should have a length of 3');
    point.setFlatCoordinates(ol.geom.GeometryLayout.XYZ, flatCoordinates);
    return point;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {ol.geom.MultiPoint|undefined} MultiPoint.
 */
ol.format.GMLBase.prototype.readMultiPoint = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'MultiPoint',
      'localName should be MultiPoint');
  /** @type {Array.<Array.<number>>} */
  var coordinates = ol.xml.pushParseAndPop([],
      this.MULTIPOINT_PARSERS_, node, objectStack, this);
  if (coordinates) {
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
ol.format.GMLBase.prototype.readMultiLineString = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'MultiLineString',
      'localName should be MultiLineString');
  /** @type {Array.<ol.geom.LineString>} */
  var lineStrings = ol.xml.pushParseAndPop([],
      this.MULTILINESTRING_PARSERS_, node, objectStack, this);
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
 * @return {ol.geom.MultiPolygon|undefined} MultiPolygon.
 */
ol.format.GMLBase.prototype.readMultiPolygon = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'MultiPolygon',
      'localName should be MultiPolygon');
  /** @type {Array.<ol.geom.Polygon>} */
  var polygons = ol.xml.pushParseAndPop([],
      this.MULTIPOLYGON_PARSERS_, node, objectStack, this);
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
ol.format.GMLBase.prototype.pointMemberParser_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'pointMember' ||
      node.localName == 'pointMembers',
      'localName should be pointMember or pointMembers');
  ol.xml.parseNode(this.POINTMEMBER_PARSERS_,
      node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GMLBase.prototype.lineStringMemberParser_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'lineStringMember' ||
      node.localName == 'lineStringMembers',
      'localName should be LineStringMember or LineStringMembers');
  ol.xml.parseNode(this.LINESTRINGMEMBER_PARSERS_,
      node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GMLBase.prototype.polygonMemberParser_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'polygonMember' ||
      node.localName == 'polygonMembers',
      'localName should be polygonMember or polygonMembers');
  ol.xml.parseNode(this.POLYGONMEMBER_PARSERS_, node,
      objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {ol.geom.LineString|undefined} LineString.
 */
ol.format.GMLBase.prototype.readLineString = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'LineString',
      'localName should be LineString');
  var flatCoordinates =
      this.readFlatCoordinatesFromNode_(node, objectStack);
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
 * @return {Array.<number>|undefined} LinearRing flat coordinates.
 */
ol.format.GMLBase.prototype.readFlatLinearRing_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'LinearRing',
      'localName should be LinearRing');
  var ring = ol.xml.pushParseAndPop(null,
      this.GEOMETRY_FLAT_COORDINATES_PARSERS_, node,
      objectStack, this);
  if (ring) {
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
ol.format.GMLBase.prototype.readLinearRing = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'LinearRing',
      'localName should be LinearRing');
  var flatCoordinates =
      this.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
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
ol.format.GMLBase.prototype.readPolygon = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  ol.DEBUG && console.assert(node.localName == 'Polygon',
      'localName should be Polygon');
  /** @type {Array.<Array.<number>>} */
  var flatLinearRings = ol.xml.pushParseAndPop([null],
      this.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack, this);
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
 * @return {Array.<number>} Flat coordinates.
 */
ol.format.GMLBase.prototype.readFlatCoordinatesFromNode_ = function(node, objectStack) {
  ol.DEBUG && console.assert(node.nodeType == Node.ELEMENT_NODE,
      'node.nodeType should be ELEMENT');
  return ol.xml.pushParseAndPop(null,
      this.GEOMETRY_FLAT_COORDINATES_PARSERS_, node,
      objectStack, this);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GMLBase.prototype.MULTIPOINT_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'pointMember': ol.xml.makeArrayPusher(
        ol.format.GMLBase.prototype.pointMemberParser_),
    'pointMembers': ol.xml.makeArrayPusher(
        ol.format.GMLBase.prototype.pointMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GMLBase.prototype.MULTILINESTRING_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'lineStringMember': ol.xml.makeArrayPusher(
        ol.format.GMLBase.prototype.lineStringMemberParser_),
    'lineStringMembers': ol.xml.makeArrayPusher(
        ol.format.GMLBase.prototype.lineStringMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GMLBase.prototype.MULTIPOLYGON_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'polygonMember': ol.xml.makeArrayPusher(
        ol.format.GMLBase.prototype.polygonMemberParser_),
    'polygonMembers': ol.xml.makeArrayPusher(
        ol.format.GMLBase.prototype.polygonMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GMLBase.prototype.POINTMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'Point': ol.xml.makeArrayPusher(
        ol.format.GMLBase.prototype.readFlatCoordinatesFromNode_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GMLBase.prototype.LINESTRINGMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'LineString': ol.xml.makeArrayPusher(
        ol.format.GMLBase.prototype.readLineString)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.GMLBase.prototype.POLYGONMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml' : {
    'Polygon': ol.xml.makeArrayPusher(
        ol.format.GMLBase.prototype.readPolygon)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @protected
 */
ol.format.GMLBase.prototype.RING_PARSERS = {
  'http://www.opengis.net/gml' : {
    'LinearRing': ol.xml.makeReplacer(
        ol.format.GMLBase.prototype.readFlatLinearRing_)
  }
};


/**
 * @inheritDoc
 */
ol.format.GMLBase.prototype.readGeometryFromNode = function(node, opt_options) {
  var geometry = this.readGeometryElement(node,
      [this.getReadOptions(node, opt_options ? opt_options : {})]);
  return geometry ? geometry : null;
};


/**
 * Read all features from a GML FeatureCollection.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Options.
 * @return {Array.<ol.Feature>} Features.
 * @api stable
 */
ol.format.GMLBase.prototype.readFeatures;


/**
 * @inheritDoc
 */
ol.format.GMLBase.prototype.readFeaturesFromNode = function(node, opt_options) {
  var options = {
    featureType: this.featureType,
    featureNS: this.featureNS
  };
  if (opt_options) {
    ol.obj.assign(options, this.getReadOptions(node, opt_options));
  }
  var features = this.readFeaturesInternal(node, [options]);
  return features || [];
};


/**
 * @inheritDoc
 */
ol.format.GMLBase.prototype.readProjectionFromNode = function(node) {
  return ol.proj.get(this.srsName ? this.srsName :
      node.firstElementChild.getAttribute('srsName'));
};
