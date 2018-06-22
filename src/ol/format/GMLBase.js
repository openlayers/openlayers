/**
 * @module ol/format/GMLBase
 */
// FIXME Envelopes should not be treated as geometries! readEnvelope_ is part
// of GEOMETRY_PARSERS_ and methods using GEOMETRY_PARSERS_ do not expect
// envelopes/extents, only geometries!
import {inherits} from '../util.js';
import {extend} from '../array.js';
import Feature from '../Feature.js';
import {transformWithOptions} from '../format/Feature.js';
import XMLFeature from '../format/XMLFeature.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import LineString from '../geom/LineString.js';
import LinearRing from '../geom/LinearRing.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import {assign} from '../obj.js';
import {get as getProjection} from '../proj.js';
import {getAllTextContent, getAttributeNS, makeArrayPusher, makeReplacer, parseNode, pushParseAndPop} from '../xml.js';


/**
 * @const
 * @type {string}
 */
export const GMLNS = 'http://www.opengis.net/gml';


/**
 * @typedef {Object} Options
 * @property {Object.<string, string>|string} [featureNS] Feature
 * namespace. If not defined will be derived from GML. If multiple
 * feature types have been configured which come from different feature
 * namespaces, this will be an object with the keys being the prefixes used
 * in the entries of featureType array. The values of the object will be the
 * feature namespaces themselves. So for instance there might be a featureType
 * item `topp:states` in the `featureType` array and then there will be a key
 * `topp` in the featureNS object with value `http://www.openplans.org/topp`.
 * @property {Array.<string>|string} [featureType] Feature type(s) to parse.
 * If multiple feature types need to be configured
 * which come from different feature namespaces, `featureNS` will be an object
 * with the keys being the prefixes used in the entries of featureType array.
 * The values of the object will be the feature namespaces themselves.
 * So for instance there might be a featureType item `topp:states` and then
 * there will be a key named `topp` in the featureNS object with value
 * `http://www.openplans.org/topp`.
 * @property {string} srsName srsName to use when writing geometries.
 * @property {boolean} [surface=false] Write gml:Surface instead of gml:Polygon
 * elements. This also affects the elements in multi-part geometries.
 * @property {boolean} [curve=false] Write gml:Curve instead of gml:LineString
 * elements. This also affects the elements in multi-part geometries.
 * @property {boolean} [multiCurve=true] Write gml:MultiCurve instead of gml:MultiLineString.
 * Since the latter is deprecated in GML 3.
 * @property {boolean} [multiSurface=true] Write gml:multiSurface instead of
 * gml:MultiPolygon. Since the latter is deprecated in GML 3.
 * @property {string} [schemaLocation] Optional schemaLocation to use when
 * writing out the GML, this will override the default provided.
 */


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Feature base format for reading and writing data in the GML format.
 * This class cannot be instantiated, it contains only base content that
 * is shared with versioned format classes GML2 and GML3.
 *
 * @constructor
 * @abstract
 * @param {module:ol/format/GMLBase~Options=} opt_options
 *     Optional configuration object.
 * @extends {module:ol/format/XMLFeature}
 */
const GMLBase = function(opt_options) {
  const options = /** @type {module:ol/format/GMLBase~Options} */ (opt_options ? opt_options : {});

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
  this.FEATURE_COLLECTION_PARSERS[GMLNS] = {
    'featureMember': makeReplacer(GMLBase.prototype.readFeaturesInternal),
    'featureMembers': makeReplacer(GMLBase.prototype.readFeaturesInternal)
  };

  XMLFeature.call(this);
};

inherits(GMLBase, XMLFeature);


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
 */
const ONLY_WHITESPACE_RE = /^[\s\xa0]*$/;


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {Array.<module:ol/Feature> | undefined} Features.
 */
GMLBase.prototype.readFeaturesInternal = function(node, objectStack) {
  const localName = node.localName;
  let features = null;
  if (localName == 'FeatureCollection') {
    if (node.namespaceURI === 'http://www.opengis.net/wfs') {
      features = pushParseAndPop([],
        this.FEATURE_COLLECTION_PARSERS, node,
        objectStack, this);
    } else {
      features = pushParseAndPop(null,
        this.FEATURE_COLLECTION_PARSERS, node,
        objectStack, this);
    }
  } else if (localName == 'featureMembers' || localName == 'featureMember') {
    const context = objectStack[0];
    let featureType = context['featureType'];
    let featureNS = context['featureNS'];
    const prefix = 'p';
    const defaultPrefix = 'p0';
    if (!featureType && node.childNodes) {
      featureType = [], featureNS = {};
      for (let i = 0, ii = node.childNodes.length; i < ii; ++i) {
        const child = node.childNodes[i];
        if (child.nodeType === 1) {
          const ft = child.nodeName.split(':').pop();
          if (featureType.indexOf(ft) === -1) {
            let key = '';
            let count = 0;
            const uri = child.namespaceURI;
            for (const candidate in featureNS) {
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
      const ns = featureNS;
      featureNS = {};
      featureNS[defaultPrefix] = ns;
    }
    const parsersNS = {};
    const featureTypes = Array.isArray(featureType) ? featureType : [featureType];
    for (const p in featureNS) {
      const parsers = {};
      for (let i = 0, ii = featureTypes.length; i < ii; ++i) {
        const featurePrefix = featureTypes[i].indexOf(':') === -1 ?
          defaultPrefix : featureTypes[i].split(':')[0];
        if (featurePrefix === p) {
          parsers[featureTypes[i].split(':').pop()] =
              (localName == 'featureMembers') ?
                makeArrayPusher(this.readFeatureElement, this) :
                makeReplacer(this.readFeatureElement, this);
        }
      }
      parsersNS[featureNS[p]] = parsers;
    }
    if (localName == 'featureMember') {
      features = pushParseAndPop(undefined, parsersNS, node, objectStack);
    } else {
      features = pushParseAndPop([], parsersNS, node, objectStack);
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
 * @return {module:ol/geom/Geometry|undefined} Geometry.
 */
GMLBase.prototype.readGeometryElement = function(node, objectStack) {
  const context = /** @type {Object} */ (objectStack[0]);
  context['srsName'] = node.firstElementChild.getAttribute('srsName');
  context['srsDimension'] = node.firstElementChild.getAttribute('srsDimension');
  /** @type {module:ol/geom/Geometry} */
  const geometry = pushParseAndPop(null, this.GEOMETRY_PARSERS_, node, objectStack, this);
  if (geometry) {
    return (
      /** @type {module:ol/geom/Geometry} */ (transformWithOptions(geometry, false, context))
    );
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/Feature} Feature.
 */
GMLBase.prototype.readFeatureElement = function(node, objectStack) {
  let n;
  const fid = node.getAttribute('fid') || getAttributeNS(node, GMLNS, 'id');
  const values = {};
  let geometryName;
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    const localName = n.localName;
    // Assume attribute elements have one child node and that the child
    // is a text or CDATA node (to be treated as text).
    // Otherwise assume it is a geometry node.
    if (n.childNodes.length === 0 ||
        (n.childNodes.length === 1 &&
        (n.firstChild.nodeType === 3 || n.firstChild.nodeType === 4))) {
      let value = getAllTextContent(n, false);
      if (ONLY_WHITESPACE_RE.test(value)) {
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
  const feature = new Feature(values);
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
 * @return {module:ol/geom/Point|undefined} Point.
 */
GMLBase.prototype.readPoint = function(node, objectStack) {
  const flatCoordinates = this.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    const point = new Point(null);
    point.setFlatCoordinates(GeometryLayout.XYZ, flatCoordinates);
    return point;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/geom/MultiPoint|undefined} MultiPoint.
 */
GMLBase.prototype.readMultiPoint = function(node, objectStack) {
  /** @type {Array.<Array.<number>>} */
  const coordinates = pushParseAndPop([],
    this.MULTIPOINT_PARSERS_, node, objectStack, this);
  if (coordinates) {
    return new MultiPoint(coordinates);
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/geom/MultiLineString|undefined} MultiLineString.
 */
GMLBase.prototype.readMultiLineString = function(node, objectStack) {
  /** @type {Array.<module:ol/geom/LineString>} */
  const lineStrings = pushParseAndPop([],
    this.MULTILINESTRING_PARSERS_, node, objectStack, this);
  if (lineStrings) {
    const multiLineString = new MultiLineString(null);
    multiLineString.setLineStrings(lineStrings);
    return multiLineString;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/geom/MultiPolygon|undefined} MultiPolygon.
 */
GMLBase.prototype.readMultiPolygon = function(node, objectStack) {
  /** @type {Array.<module:ol/geom/Polygon>} */
  const polygons = pushParseAndPop([], this.MULTIPOLYGON_PARSERS_, node, objectStack, this);
  if (polygons) {
    const multiPolygon = new MultiPolygon(null);
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
GMLBase.prototype.pointMemberParser_ = function(node, objectStack) {
  parseNode(this.POINTMEMBER_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
GMLBase.prototype.lineStringMemberParser_ = function(node, objectStack) {
  parseNode(this.LINESTRINGMEMBER_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
GMLBase.prototype.polygonMemberParser_ = function(node, objectStack) {
  parseNode(this.POLYGONMEMBER_PARSERS_, node, objectStack, this);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/geom/LineString|undefined} LineString.
 */
GMLBase.prototype.readLineString = function(node, objectStack) {
  const flatCoordinates = this.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    const lineString = new LineString(null);
    lineString.setFlatCoordinates(GeometryLayout.XYZ, flatCoordinates);
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
GMLBase.prototype.readFlatLinearRing_ = function(node, objectStack) {
  const ring = pushParseAndPop(null,
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
 * @return {module:ol/geom/LinearRing|undefined} LinearRing.
 */
GMLBase.prototype.readLinearRing = function(node, objectStack) {
  const flatCoordinates = this.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    const ring = new LinearRing(null);
    ring.setFlatCoordinates(GeometryLayout.XYZ, flatCoordinates);
    return ring;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @return {module:ol/geom/Polygon|undefined} Polygon.
 */
GMLBase.prototype.readPolygon = function(node, objectStack) {
  /** @type {Array.<Array.<number>>} */
  const flatLinearRings = pushParseAndPop([null],
    this.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack, this);
  if (flatLinearRings && flatLinearRings[0]) {
    const polygon = new Polygon(null);
    const flatCoordinates = flatLinearRings[0];
    const ends = [flatCoordinates.length];
    let i, ii;
    for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
      extend(flatCoordinates, flatLinearRings[i]);
      ends.push(flatCoordinates.length);
    }
    polygon.setFlatCoordinates(GeometryLayout.XYZ, flatCoordinates, ends);
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
GMLBase.prototype.readFlatCoordinatesFromNode_ = function(node, objectStack) {
  return pushParseAndPop(null, this.GEOMETRY_FLAT_COORDINATES_PARSERS_, node, objectStack, this);
};


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 * @private
 */
GMLBase.prototype.MULTIPOINT_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'pointMember': makeArrayPusher(GMLBase.prototype.pointMemberParser_),
    'pointMembers': makeArrayPusher(GMLBase.prototype.pointMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 * @private
 */
GMLBase.prototype.MULTILINESTRING_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'lineStringMember': makeArrayPusher(GMLBase.prototype.lineStringMemberParser_),
    'lineStringMembers': makeArrayPusher(GMLBase.prototype.lineStringMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 * @private
 */
GMLBase.prototype.MULTIPOLYGON_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'polygonMember': makeArrayPusher(GMLBase.prototype.polygonMemberParser_),
    'polygonMembers': makeArrayPusher(GMLBase.prototype.polygonMemberParser_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 * @private
 */
GMLBase.prototype.POINTMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'Point': makeArrayPusher(GMLBase.prototype.readFlatCoordinatesFromNode_)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 * @private
 */
GMLBase.prototype.LINESTRINGMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'LineString': makeArrayPusher(GMLBase.prototype.readLineString)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 * @private
 */
GMLBase.prototype.POLYGONMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml': {
    'Polygon': makeArrayPusher(GMLBase.prototype.readPolygon)
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, module:ol/xml~Parser>>}
 * @protected
 */
GMLBase.prototype.RING_PARSERS = {
  'http://www.opengis.net/gml': {
    'LinearRing': makeReplacer(GMLBase.prototype.readFlatLinearRing_)
  }
};


/**
 * @inheritDoc
 */
GMLBase.prototype.readGeometryFromNode = function(node, opt_options) {
  const geometry = this.readGeometryElement(node,
    [this.getReadOptions(node, opt_options ? opt_options : {})]);
  return geometry ? geometry : null;
};


/**
 * Read all features from a GML FeatureCollection.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {module:ol/format/Feature~ReadOptions=} opt_options Options.
 * @return {Array.<module:ol/Feature>} Features.
 * @api
 */
GMLBase.prototype.readFeatures;


/**
 * @inheritDoc
 */
GMLBase.prototype.readFeaturesFromNode = function(node, opt_options) {
  const options = {
    featureType: this.featureType,
    featureNS: this.featureNS
  };
  if (opt_options) {
    assign(options, this.getReadOptions(node, opt_options));
  }
  const features = this.readFeaturesInternal(node, [options]);
  return features || [];
};


/**
 * @inheritDoc
 */
GMLBase.prototype.readProjectionFromNode = function(node) {
  return getProjection(this.srsName ? this.srsName : node.firstElementChild.getAttribute('srsName'));
};
export default GMLBase;
