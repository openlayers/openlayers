/**
 * @module ol/format/GMLBase
 */
// FIXME Envelopes should not be treated as geometries! readEnvelope_ is part
// of GEOMETRY_PARSERS_ and methods using GEOMETRY_PARSERS_ do not expect
// envelopes/extents, only geometries!
import Feature from '../Feature.js';
import Geometry from '../geom/Geometry.js';
import LineString from '../geom/LineString.js';
import LinearRing from '../geom/LinearRing.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import XMLFeature from './XMLFeature.js';
import {extend} from '../array.js';
import {
  getAllTextContent,
  getAttributeNS,
  makeArrayPusher,
  makeReplacer,
  parseNode,
  pushParseAndPop,
} from '../xml.js';
import {get as getProjection} from '../proj.js';
import {
  transformExtentWithOptions,
  transformGeometryWithOptions,
} from './Feature.js';

/**
 * @const
 * @type {string}
 */
export const GMLNS = 'http://www.opengis.net/gml';

/**
 * A regular expression that matches if a string only contains whitespace
 * characters. It will e.g. match `''`, `' '`, `'\n'` etc.
 *
 * @const
 * @type {RegExp}
 */
const ONLY_WHITESPACE_RE = /^\s*$/;

/**
 * @typedef {Object} Options
 * @property {Object<string, string>|string} [featureNS] Feature
 * namespace. If not defined will be derived from GML. If multiple
 * feature types have been configured which come from different feature
 * namespaces, this will be an object with the keys being the prefixes used
 * in the entries of featureType array. The values of the object will be the
 * feature namespaces themselves. So for instance there might be a featureType
 * item `topp:states` in the `featureType` array and then there will be a key
 * `topp` in the featureNS object with value `http://www.openplans.org/topp`.
 * @property {Array<string>|string} [featureType] Feature type(s) to parse.
 * If multiple feature types need to be configured
 * which come from different feature namespaces, `featureNS` will be an object
 * with the keys being the prefixes used in the entries of featureType array.
 * The values of the object will be the feature namespaces themselves.
 * So for instance there might be a featureType item `topp:states` and then
 * there will be a key named `topp` in the featureNS object with value
 * `http://www.openplans.org/topp`.
 * @property {string} [srsName] srsName to use when writing geometries.
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
 * @property {boolean} [hasZ=false] If coordinates have a Z value.
 */

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Feature base format for reading and writing data in the GML format.
 * This class cannot be instantiated, it contains only base content that
 * is shared with versioned format classes GML2 and GML3.
 *
 * @abstract
 * @api
 */
class GMLBase extends XMLFeature {
  /**
   * @param {Options} [options] Optional configuration object.
   */
  constructor(options) {
    super();

    options = options ? options : {};

    /**
     * @protected
     * @type {Array<string>|string|undefined}
     */
    this.featureType = options.featureType;

    /**
     * @protected
     * @type {Object<string, string>|string|undefined}
     */
    this.featureNS = options.featureNS;

    /**
     * @protected
     * @type {string|undefined}
     */
    this.srsName = options.srsName;

    /**
     * @protected
     * @type {string}
     */
    this.schemaLocation = '';

    /**
     * @type {Object<string, Object<string, Object>>}
     */
    this.FEATURE_COLLECTION_PARSERS = {};
    this.FEATURE_COLLECTION_PARSERS[this.namespace] = {
      'featureMember': makeArrayPusher(this.readFeaturesInternal),
      'featureMembers': makeReplacer(this.readFeaturesInternal),
    };

    this.supportedMediaTypes = ['application/gml+xml'];
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<Feature> | undefined} Features.
   */
  readFeaturesInternal(node, objectStack) {
    const localName = node.localName;
    let features = null;
    if (localName == 'FeatureCollection') {
      features = pushParseAndPop(
        [],
        this.FEATURE_COLLECTION_PARSERS,
        node,
        objectStack,
        this,
      );
    } else if (
      localName == 'featureMembers' ||
      localName == 'featureMember' ||
      localName == 'member'
    ) {
      const context = objectStack[0];
      let featureType = context['featureType'];
      let featureNS = context['featureNS'];
      const prefix = 'p';
      const defaultPrefix = 'p0';
      if (!featureType && node.childNodes) {
        (featureType = []), (featureNS = {});
        for (let i = 0, ii = node.childNodes.length; i < ii; ++i) {
          const child = /** @type {Element} */ (node.childNodes[i]);
          if (child.nodeType === 1) {
            const ft = child.nodeName.split(':').pop();
            if (!featureType.includes(ft)) {
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
      /** @type {Object<string, Object<string, import("../xml.js").Parser>>} */
      const parsersNS = {};
      const featureTypes = Array.isArray(featureType)
        ? featureType
        : [featureType];
      for (const p in featureNS) {
        /** @type {Object<string, import("../xml.js").Parser>} */
        const parsers = {};
        for (let i = 0, ii = featureTypes.length; i < ii; ++i) {
          const featurePrefix = featureTypes[i].includes(':')
            ? featureTypes[i].split(':')[0]
            : defaultPrefix;
          if (featurePrefix === p) {
            parsers[featureTypes[i].split(':').pop()] =
              localName == 'featureMembers'
                ? makeArrayPusher(this.readFeatureElement, this)
                : makeReplacer(this.readFeatureElement, this);
          }
        }
        parsersNS[featureNS[p]] = parsers;
      }
      if (localName == 'featureMember' || localName == 'member') {
        features = pushParseAndPop(undefined, parsersNS, node, objectStack);
      } else {
        features = pushParseAndPop([], parsersNS, node, objectStack);
      }
    }
    if (features === null) {
      features = [];
    }
    return features;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {import("../geom/Geometry.js").default|import("../extent.js").Extent|undefined} Geometry.
   */
  readGeometryOrExtent(node, objectStack) {
    const context = /** @type {Object} */ (objectStack[0]);
    context['srsName'] = node.firstElementChild.getAttribute('srsName');
    context['srsDimension'] =
      node.firstElementChild.getAttribute('srsDimension');
    return pushParseAndPop(
      null,
      this.GEOMETRY_PARSERS,
      node,
      objectStack,
      this,
    );
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {import("../extent.js").Extent|undefined} Geometry.
   */
  readExtentElement(node, objectStack) {
    const context = /** @type {Object} */ (objectStack[0]);
    const extent = /** @type {import("../extent.js").Extent} */ (
      this.readGeometryOrExtent(node, objectStack)
    );
    return extent ? transformExtentWithOptions(extent, context) : undefined;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {import("../geom/Geometry.js").default|undefined} Geometry.
   */
  readGeometryElement(node, objectStack) {
    const context = /** @type {Object} */ (objectStack[0]);
    const geometry = /** @type {import("../geom/Geometry.js").default} */ (
      this.readGeometryOrExtent(node, objectStack)
    );
    return geometry
      ? transformGeometryWithOptions(geometry, false, context)
      : undefined;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @param {boolean} asFeature whether result should be wrapped as a feature.
   * @return {Feature|Object} Feature
   */
  readFeatureElementInternal(node, objectStack, asFeature) {
    let geometryName;
    const values = {};
    for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
      let value;
      const localName = n.localName;
      // first, check if it is simple attribute
      if (
        n.childNodes.length === 0 ||
        (n.childNodes.length === 1 &&
          (n.firstChild.nodeType === 3 || n.firstChild.nodeType === 4))
      ) {
        value = getAllTextContent(n, false);
        if (ONLY_WHITESPACE_RE.test(value)) {
          value = undefined;
        }
      } else {
        if (asFeature) {
          //if feature, try it as a geometry or extent
          value =
            localName === 'boundedBy'
              ? this.readExtentElement(n, objectStack)
              : this.readGeometryElement(n, objectStack);
        }
        if (!value) {
          //if not a geometry or not a feature, treat it as a complex attribute
          value = this.readFeatureElementInternal(n, objectStack, false);
        } else if (localName !== 'boundedBy') {
          // boundedBy is an extent and must not be considered as a geometry
          geometryName = localName;
        }
      }

      const len = n.attributes.length;
      if (len > 0 && !(value instanceof Geometry)) {
        value = {_content_: value};
        for (let i = 0; i < len; i++) {
          const attName = n.attributes[i].name;
          value[attName] = n.attributes[i].value;
        }
      }

      if (values[localName]) {
        if (!(values[localName] instanceof Array)) {
          values[localName] = [values[localName]];
        }
        values[localName].push(value);
      } else {
        values[localName] = value;
      }
    }
    if (!asFeature) {
      return values;
    }
    const feature = new Feature(values);
    if (geometryName) {
      feature.setGeometryName(geometryName);
    }
    const fid =
      node.getAttribute('fid') || getAttributeNS(node, this.namespace, 'id');
    if (fid) {
      feature.setId(fid);
    }
    return feature;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Feature} Feature.
   */
  readFeatureElement(node, objectStack) {
    return this.readFeatureElementInternal(node, objectStack, true);
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Point|undefined} Point.
   */
  readPoint(node, objectStack) {
    const flatCoordinates = this.readFlatCoordinatesFromNode(node, objectStack);
    if (flatCoordinates) {
      return new Point(flatCoordinates, 'XYZ');
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {MultiPoint|undefined} MultiPoint.
   */
  readMultiPoint(node, objectStack) {
    /** @type {Array<Array<number>>} */
    const coordinates = pushParseAndPop(
      [],
      this.MULTIPOINT_PARSERS,
      node,
      objectStack,
      this,
    );
    if (coordinates) {
      return new MultiPoint(coordinates);
    }
    return undefined;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {MultiLineString|undefined} MultiLineString.
   */
  readMultiLineString(node, objectStack) {
    /** @type {Array<LineString>} */
    const lineStrings = pushParseAndPop(
      [],
      this.MULTILINESTRING_PARSERS,
      node,
      objectStack,
      this,
    );
    if (lineStrings) {
      return new MultiLineString(lineStrings);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {MultiPolygon|undefined} MultiPolygon.
   */
  readMultiPolygon(node, objectStack) {
    /** @type {Array<Polygon>} */
    const polygons = pushParseAndPop(
      [],
      this.MULTIPOLYGON_PARSERS,
      node,
      objectStack,
      this,
    );
    if (polygons) {
      return new MultiPolygon(polygons);
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   */
  pointMemberParser(node, objectStack) {
    parseNode(this.POINTMEMBER_PARSERS, node, objectStack, this);
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   */
  lineStringMemberParser(node, objectStack) {
    parseNode(this.LINESTRINGMEMBER_PARSERS, node, objectStack, this);
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   */
  polygonMemberParser(node, objectStack) {
    parseNode(this.POLYGONMEMBER_PARSERS, node, objectStack, this);
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {LineString|undefined} LineString.
   */
  readLineString(node, objectStack) {
    const flatCoordinates = this.readFlatCoordinatesFromNode(node, objectStack);
    if (flatCoordinates) {
      const lineString = new LineString(flatCoordinates, 'XYZ');
      return lineString;
    }
    return undefined;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<number>|undefined} LinearRing flat coordinates.
   */
  readFlatLinearRing(node, objectStack) {
    const ring = pushParseAndPop(
      null,
      this.GEOMETRY_FLAT_COORDINATES_PARSERS,
      node,
      objectStack,
      this,
    );
    if (ring) {
      return ring;
    }
    return undefined;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {LinearRing|undefined} LinearRing.
   */
  readLinearRing(node, objectStack) {
    const flatCoordinates = this.readFlatCoordinatesFromNode(node, objectStack);
    if (flatCoordinates) {
      return new LinearRing(flatCoordinates, 'XYZ');
    }
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Polygon|undefined} Polygon.
   */
  readPolygon(node, objectStack) {
    /** @type {Array<Array<number>>} */
    const flatLinearRings = pushParseAndPop(
      [null],
      this.FLAT_LINEAR_RINGS_PARSERS,
      node,
      objectStack,
      this,
    );
    if (flatLinearRings && flatLinearRings[0]) {
      const flatCoordinates = flatLinearRings[0];
      const ends = [flatCoordinates.length];
      let i, ii;
      for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
        extend(flatCoordinates, flatLinearRings[i]);
        ends.push(flatCoordinates.length);
      }
      return new Polygon(flatCoordinates, 'XYZ', ends);
    }
    return undefined;
  }

  /**
   * @param {Element} node Node.
   * @param {Array<*>} objectStack Object stack.
   * @return {Array<number>} Flat coordinates.
   */
  readFlatCoordinatesFromNode(node, objectStack) {
    return pushParseAndPop(
      null,
      this.GEOMETRY_FLAT_COORDINATES_PARSERS,
      node,
      objectStack,
      this,
    );
  }

  /**
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @protected
   * @return {import("../geom/Geometry.js").default} Geometry.
   */
  readGeometryFromNode(node, options) {
    const geometry = this.readGeometryElement(node, [
      this.getReadOptions(node, options ? options : {}),
    ]);
    return geometry ? geometry : null;
  }

  /**
   * @param {Element} node Node.
   * @param {import("./Feature.js").ReadOptions} [options] Options.
   * @return {Array<import("../Feature.js").default>} Features.
   */
  readFeaturesFromNode(node, options) {
    const internalOptions = {
      featureType: this.featureType,
      featureNS: this.featureNS,
    };
    if (internalOptions) {
      Object.assign(internalOptions, this.getReadOptions(node, options));
    }
    const features = this.readFeaturesInternal(node, [internalOptions]);
    return features || [];
  }

  /**
   * @param {Element} node Node.
   * @return {import("../proj/Projection.js").default} Projection.
   */
  readProjectionFromNode(node) {
    return getProjection(
      this.srsName
        ? this.srsName
        : node.firstElementChild.getAttribute('srsName'),
    );
  }
}

GMLBase.prototype.namespace = GMLNS;

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GMLBase.prototype.FLAT_LINEAR_RINGS_PARSERS = {
  'http://www.opengis.net/gml': {},
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GMLBase.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS = {
  'http://www.opengis.net/gml': {},
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GMLBase.prototype.GEOMETRY_PARSERS = {
  'http://www.opengis.net/gml': {},
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GMLBase.prototype.MULTIPOINT_PARSERS = {
  'http://www.opengis.net/gml': {
    'pointMember': makeArrayPusher(GMLBase.prototype.pointMemberParser),
    'pointMembers': makeArrayPusher(GMLBase.prototype.pointMemberParser),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GMLBase.prototype.MULTILINESTRING_PARSERS = {
  'http://www.opengis.net/gml': {
    'lineStringMember': makeArrayPusher(
      GMLBase.prototype.lineStringMemberParser,
    ),
    'lineStringMembers': makeArrayPusher(
      GMLBase.prototype.lineStringMemberParser,
    ),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GMLBase.prototype.MULTIPOLYGON_PARSERS = {
  'http://www.opengis.net/gml': {
    'polygonMember': makeArrayPusher(GMLBase.prototype.polygonMemberParser),
    'polygonMembers': makeArrayPusher(GMLBase.prototype.polygonMemberParser),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GMLBase.prototype.POINTMEMBER_PARSERS = {
  'http://www.opengis.net/gml': {
    'Point': makeArrayPusher(GMLBase.prototype.readFlatCoordinatesFromNode),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GMLBase.prototype.LINESTRINGMEMBER_PARSERS = {
  'http://www.opengis.net/gml': {
    'LineString': makeArrayPusher(GMLBase.prototype.readLineString),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GMLBase.prototype.POLYGONMEMBER_PARSERS = {
  'http://www.opengis.net/gml': {
    'Polygon': makeArrayPusher(GMLBase.prototype.readPolygon),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GMLBase.prototype.RING_PARSERS = {
  'http://www.opengis.net/gml': {
    'LinearRing': makeReplacer(GMLBase.prototype.readFlatLinearRing),
  },
};

export default GMLBase;
