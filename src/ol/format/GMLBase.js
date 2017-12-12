/**
 * @module ol/format/GMLBase
 */
// FIXME Envelopes should not be treated as geometries! readEnvelope_ is part
// of GEOMETRY_PARSERS_ and methods using GEOMETRY_PARSERS_ do not expect
// envelopes/extents, only geometries!
import _ol_ from '../index.js';
import _ol_array_ from '../array.js';
import _ol_Feature_ from '../Feature.js';
import _ol_format_Feature_ from '../format/Feature.js';
import _ol_format_XMLFeature_ from '../format/XMLFeature.js';
import _ol_geom_GeometryLayout_ from '../geom/GeometryLayout.js';
import _ol_geom_LineString_ from '../geom/LineString.js';
import _ol_geom_LinearRing_ from '../geom/LinearRing.js';
import _ol_geom_MultiLineString_ from '../geom/MultiLineString.js';
import _ol_geom_MultiPoint_ from '../geom/MultiPoint.js';
import _ol_geom_MultiPolygon_ from '../geom/MultiPolygon.js';
import _ol_geom_Point_ from '../geom/Point.js';
import _ol_geom_Polygon_ from '../geom/Polygon.js';
import _ol_obj_ from '../obj.js';
import _ol_proj_ from '../proj.js';
import _ol_xml_ from '../xml.js';

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
 * @abstract
 * @param {olx.format.GMLOptions=} opt_options
 *     Optional configuration object.
 * @extends {ol.format.XMLFeature}
 */
var _ol_format_GMLBase_ = function(opt_options) {
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
  this.FEATURE_COLLECTION_PARSERS[_ol_format_GMLBase_.GMLNS] = {
    'featureMember': _ol_xml_.makeReplacer(
        _ol_format_GMLBase_.prototype.readFeaturesInternal),
    'featureMembers': _ol_xml_.makeReplacer(
        _ol_format_GMLBase_.prototype.readFeaturesInternal)
  };

  _ol_format_XMLFeature_.call(this);
};

_ol_.inherits(_ol_format_GMLBase_, _ol_format_XMLFeature_);


/**
 * @const
 * @type {string}
 */
_ol_format_GMLBase_.GMLNS = 'http://www.opengis.net/gml';


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
_ol_format_GMLBase_.ONLY_WHITESPACE_RE_ = /^[\s\xa0]*$/;


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<ol.Feature> | undefined} Features.
 */
_ol_format_GMLBase_.prototype.readFeaturesInternal = function(node, objectStack) {
  var localName = node.localName;
  var features = null;
  if (localName == 'FeatureCollection') {
    if (node.namespaceURI === 'http://www.opengis.net/wfs') {
      features = _ol_xml_.pushParseAndPop([],
          this.FEATURE_COLLECTION_PARSERS, node,
          objectStack, this);
    } else {
      features = _ol_xml_.pushParseAndPop(null,
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
                _ol_xml_.makeArrayPusher(this.readFeatureElement, this) :
                _ol_xml_.makeReplacer(this.readFeatureElement, this);
        }
      }
      parsersNS[featureNS[p]] = parsers;
    }
    if (localName == 'featureMember') {
      features = _ol_xml_.pushParseAndPop(undefined, parsersNS, node, objectStack);
    } else {
      features = _ol_xml_.pushParseAndPop([], parsersNS, node, objectStack);
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
_ol_format_GMLBase_.prototype.readGeometryElement = function(node, objectStack) {
  var context = /** @type {Object} */ (objectStack[0]);
  context['srsName'] = node.firstElementChild.getAttribute('srsName');
  context['srsDimension'] = node.firstElementChild.getAttribute('srsDimension');
  /** @type {ol.geom.Geometry} */
  var geometry = _ol_xml_.pushParseAndPop(null,
      this.GEOMETRY_PARSERS_, node, objectStack, this);
  if (geometry) {
    return (
      /** @type {ol.geom.Geometry} */ _ol_format_Feature_.transformWithOptions(geometry, false, context)
    );
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {ol.Feature} Feature.
 */
_ol_format_GMLBase_.prototype.readFeatureElement = function(node, objectStack) {
  var n;
  var fid = node.getAttribute('fid') ||
      _ol_xml_.getAttributeNS(node, _ol_format_GMLBase_.GMLNS, 'id');
  var values = {}, geometryName;
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    var localName = n.localName;
    // Assume attribute elements have one child node and that the child
    // is a text or CDATA node (to be treated as text).
    // Otherwise assume it is a geometry node.
    if (n.childNodes.length === 0 ||
        (n.childNodes.length === 1 &&
        (n.firstChild.nodeType === 3 || n.firstChild.nodeType === 4))) {
      var value = _ol_xml_.getAllTextContent(n, false);
      if (_ol_format_GMLBase_.ONLY_WHITESPACE_RE_.test(value)) {
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
  var feature = new _ol_Feature_(values);
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
_ol_format_GMLBase_.prototype.readPoint = function(node, objectStack) {
  var flatCoordinates =
      this.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    var point = new _ol_geom_Point_(null);
    point.setFlatCoordinates(_ol_geom_GeometryLayout_.XYZ, flatCoordinates);
    return point;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {ol.geom.MultiPoint|undefined} MultiPoint.
 */
_ol_format_GMLBase_.prototype.readMultiPoint = function(node, objectStack) {
  /** @type {Array.<Array.<number>>} */
  var coordinates = _ol_xml_.pushParseAndPop([],
      this.MULTIPOINT_PARSERS_, node, objectStack, this);
  if (coordinates) {
    return new _ol_geom_MultiPoint_(coordinates);
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {ol.geom.MultiLineString|undefined} MultiLineString.
 */
_ol_format_GMLBase_.prototype.readMultiLineString = function(node, objectStack) {
  /** @type {Array.<ol.geom.LineString>} */
  var lineStrings = _ol_xml_.pushParseAndPop([],
      this.MULTILINESTRING_PARSERS_, node, objectStack, this);
  if (lineStrings) {
    var multiLineString = new _ol_geom_MultiLineString_(null);
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
_ol_format_GMLBase_.prototype.readMultiPolygon = function(node, objectStack) {
  /** @type {Array.<ol.geom.Polygon>} */
  var polygons = _ol_xml_.pushParseAndPop([],
      this.MULTIPOLYGON_PARSERS_, node, objectStack, this);
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
_ol_format_GMLBase_.prototype.pointMemberParser_ = function(node, objectStack) {
  _ol_xml_.parseNode(this.POINTMEMBER_PARSERS_,
      node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GMLBase_.prototype.lineStringMemberParser_ = function(node, objectStack) {
  _ol_xml_.parseNode(this.LINESTRINGMEMBER_PARSERS_,
      node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GMLBase_.prototype.polygonMemberParser_ = function(node, objectStack) {
  _ol_xml_.parseNode(this.POLYGONMEMBER_PARSERS_, node,
      objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {ol.geom.LineString|undefined} LineString.
 */
_ol_format_GMLBase_.prototype.readLineString = function(node, objectStack) {
  var flatCoordinates =
      this.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    var lineString = new _ol_geom_LineString_(null);
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
 * @return {Array.<number>|undefined} LinearRing flat coordinates.
 */
_ol_format_GMLBase_.prototype.readFlatLinearRing_ = function(node, objectStack) {
  var ring = _ol_xml_.pushParseAndPop(null,
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
_ol_format_GMLBase_.prototype.readLinearRing = function(node, objectStack) {
  var flatCoordinates =
      this.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    var ring = new _ol_geom_LinearRing_(null);
    ring.setFlatCoordinates(_ol_geom_GeometryLayout_.XYZ, flatCoordinates);
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
_ol_format_GMLBase_.prototype.readPolygon = function(node, objectStack) {
  /** @type {Array.<Array.<number>>} */
  var flatLinearRings = _ol_xml_.pushParseAndPop([null],
      this.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack, this);
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
 * @return {Array.<number>} Flat coordinates.
 */
_ol_format_GMLBase_.prototype.readFlatCoordinatesFromNode_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(null,
      this.GEOMETRY_FLAT_COORDINATES_PARSERS_, node,
      objectStack, this);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GMLBase_.prototype.MULTIPOINT_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'pointMember': _ol_xml_.makeArrayPusher(
        _ol_format_GMLBase_.prototype.pointMemberParser_),
    'pointMembers': _ol_xml_.makeArrayPusher(
        _ol_format_GMLBase_.prototype.pointMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GMLBase_.prototype.MULTILINESTRING_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'lineStringMember': _ol_xml_.makeArrayPusher(
        _ol_format_GMLBase_.prototype.lineStringMemberParser_),
    'lineStringMembers': _ol_xml_.makeArrayPusher(
        _ol_format_GMLBase_.prototype.lineStringMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GMLBase_.prototype.MULTIPOLYGON_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'polygonMember': _ol_xml_.makeArrayPusher(
        _ol_format_GMLBase_.prototype.polygonMemberParser_),
    'polygonMembers': _ol_xml_.makeArrayPusher(
        _ol_format_GMLBase_.prototype.polygonMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GMLBase_.prototype.POINTMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'Point': _ol_xml_.makeArrayPusher(
        _ol_format_GMLBase_.prototype.readFlatCoordinatesFromNode_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GMLBase_.prototype.LINESTRINGMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'LineString': _ol_xml_.makeArrayPusher(
        _ol_format_GMLBase_.prototype.readLineString)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GMLBase_.prototype.POLYGONMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'Polygon': _ol_xml_.makeArrayPusher(
        _ol_format_GMLBase_.prototype.readPolygon)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @protected
 */
_ol_format_GMLBase_.prototype.RING_PARSERS = {
  'http://www.opengis.net/gml': {
    'LinearRing': _ol_xml_.makeReplacer(
        _ol_format_GMLBase_.prototype.readFlatLinearRing_)
  }
};


/**
 * @inheritDoc
 */
_ol_format_GMLBase_.prototype.readGeometryFromNode = function(node, opt_options) {
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
 * @api
 */
_ol_format_GMLBase_.prototype.readFeatures;


/**
 * @inheritDoc
 */
_ol_format_GMLBase_.prototype.readFeaturesFromNode = function(node, opt_options) {
  var options = {
    featureType: this.featureType,
    featureNS: this.featureNS
  };
  if (opt_options) {
    _ol_obj_.assign(options, this.getReadOptions(node, opt_options));
  }
  var features = this.readFeaturesInternal(node, [options]);
  return features || [];
};


/**
 * @inheritDoc
 */
_ol_format_GMLBase_.prototype.readProjectionFromNode = function(node) {
  return _ol_proj_.get(this.srsName ? this.srsName :
    node.firstElementChild.getAttribute('srsName'));
};
export default _ol_format_GMLBase_;
