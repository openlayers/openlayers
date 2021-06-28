/**
 * @module ol/format/GML32
 */
import GML2 from './GML2.js';
import GML3 from './GML3.js';
import GMLBase from './GMLBase.js';
import {makeArrayPusher, makeChildAppender, makeReplacer} from '../xml.js';
import {writeStringTextNode} from '../format/xsd.js';

/**
 * @classdesc Feature format for reading and writing data in the GML format
 *            version 3.2.1.
 * @api
 */
class GML32 extends GML3 {
  /**
   * @param {import("./GMLBase.js").Options} [opt_options] Optional configuration object.
   */
  constructor(opt_options) {
    const options = /** @type {import("./GMLBase.js").Options} */ (
      opt_options ? opt_options : {}
    );

    super(options);

    /**
     * @type {string}
     */
    this.schemaLocation = options.schemaLocation
      ? options.schemaLocation
      : this.namespace + ' http://schemas.opengis.net/gml/3.2.1/gml.xsd';
  }
}

GML32.prototype.namespace = 'http://www.opengis.net/gml/3.2';

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'pos': makeReplacer(GML3.prototype.readFlatPos),
    'posList': makeReplacer(GML3.prototype.readFlatPosList),
    'coordinates': makeReplacer(GML2.prototype.readFlatCoordinates),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.FLAT_LINEAR_RINGS_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'interior': GML3.prototype.interiorParser,
    'exterior': GML3.prototype.exteriorParser,
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.GEOMETRY_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'Point': makeReplacer(GMLBase.prototype.readPoint),
    'MultiPoint': makeReplacer(GMLBase.prototype.readMultiPoint),
    'LineString': makeReplacer(GMLBase.prototype.readLineString),
    'MultiLineString': makeReplacer(GMLBase.prototype.readMultiLineString),
    'LinearRing': makeReplacer(GMLBase.prototype.readLinearRing),
    'Polygon': makeReplacer(GMLBase.prototype.readPolygon),
    'MultiPolygon': makeReplacer(GMLBase.prototype.readMultiPolygon),
    'Surface': makeReplacer(GML32.prototype.readSurface),
    'MultiSurface': makeReplacer(GML3.prototype.readMultiSurface),
    'Curve': makeReplacer(GML32.prototype.readCurve),
    'MultiCurve': makeReplacer(GML3.prototype.readMultiCurve),
    'Envelope': makeReplacer(GML32.prototype.readEnvelope),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.MULTICURVE_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'curveMember': makeArrayPusher(GML3.prototype.curveMemberParser),
    'curveMembers': makeArrayPusher(GML3.prototype.curveMemberParser),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.MULTISURFACE_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'surfaceMember': makeArrayPusher(GML3.prototype.surfaceMemberParser),
    'surfaceMembers': makeArrayPusher(GML3.prototype.surfaceMemberParser),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.CURVEMEMBER_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'LineString': makeArrayPusher(GMLBase.prototype.readLineString),
    'Curve': makeArrayPusher(GML3.prototype.readCurve),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.SURFACEMEMBER_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'Polygon': makeArrayPusher(GMLBase.prototype.readPolygon),
    'Surface': makeArrayPusher(GML3.prototype.readSurface),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.SURFACE_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'patches': makeReplacer(GML3.prototype.readPatch),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.CURVE_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'segments': makeReplacer(GML3.prototype.readSegment),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.ENVELOPE_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'lowerCorner': makeArrayPusher(GML3.prototype.readFlatPosList),
    'upperCorner': makeArrayPusher(GML3.prototype.readFlatPosList),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.PATCHES_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'PolygonPatch': makeReplacer(GML3.prototype.readPolygonPatch),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.SEGMENTS_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'LineStringSegment': makeReplacer(GML3.prototype.readLineStringSegment),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.MULTIPOINT_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'pointMember': makeArrayPusher(GMLBase.prototype.pointMemberParser),
    'pointMembers': makeArrayPusher(GMLBase.prototype.pointMemberParser),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.MULTILINESTRING_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'lineStringMember': makeArrayPusher(
      GMLBase.prototype.lineStringMemberParser
    ),
    'lineStringMembers': makeArrayPusher(
      GMLBase.prototype.lineStringMemberParser
    ),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.MULTIPOLYGON_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'polygonMember': makeArrayPusher(GMLBase.prototype.polygonMemberParser),
    'polygonMembers': makeArrayPusher(GMLBase.prototype.polygonMemberParser),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.POINTMEMBER_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'Point': makeArrayPusher(GMLBase.prototype.readFlatCoordinatesFromNode),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.LINESTRINGMEMBER_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'LineString': makeArrayPusher(GMLBase.prototype.readLineString),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.POLYGONMEMBER_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'Polygon': makeArrayPusher(GMLBase.prototype.readPolygon),
  },
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 */
GML32.prototype.RING_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'LinearRing': makeReplacer(GMLBase.prototype.readFlatLinearRing),
  },
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
GML32.prototype.RING_SERIALIZERS = {
  'http://www.opengis.net/gml/3.2': {
    'exterior': makeChildAppender(GML3.prototype.writeRing),
    'interior': makeChildAppender(GML3.prototype.writeRing),
  },
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
GML32.prototype.ENVELOPE_SERIALIZERS = {
  'http://www.opengis.net/gml/3.2': {
    'lowerCorner': makeChildAppender(writeStringTextNode),
    'upperCorner': makeChildAppender(writeStringTextNode),
  },
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
GML32.prototype.SURFACEORPOLYGONMEMBER_SERIALIZERS = {
  'http://www.opengis.net/gml/3.2': {
    'surfaceMember': makeChildAppender(
      GML3.prototype.writeSurfaceOrPolygonMember
    ),
    'polygonMember': makeChildAppender(
      GML3.prototype.writeSurfaceOrPolygonMember
    ),
  },
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
GML32.prototype.POINTMEMBER_SERIALIZERS = {
  'http://www.opengis.net/gml/3.2': {
    'pointMember': makeChildAppender(GML3.prototype.writePointMember),
  },
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
GML32.prototype.LINESTRINGORCURVEMEMBER_SERIALIZERS = {
  'http://www.opengis.net/gml/3.2': {
    'lineStringMember': makeChildAppender(
      GML3.prototype.writeLineStringOrCurveMember
    ),
    'curveMember': makeChildAppender(
      GML3.prototype.writeLineStringOrCurveMember
    ),
  },
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 */
GML32.prototype.GEOMETRY_SERIALIZERS = {
  'http://www.opengis.net/gml/3.2': {
    'Curve': makeChildAppender(GML3.prototype.writeCurveOrLineString),
    'MultiCurve': makeChildAppender(GML3.prototype.writeMultiCurveOrLineString),
    'Point': makeChildAppender(GML32.prototype.writePoint),
    'MultiPoint': makeChildAppender(GML3.prototype.writeMultiPoint),
    'LineString': makeChildAppender(GML3.prototype.writeCurveOrLineString),
    'MultiLineString': makeChildAppender(
      GML3.prototype.writeMultiCurveOrLineString
    ),
    'LinearRing': makeChildAppender(GML3.prototype.writeLinearRing),
    'Polygon': makeChildAppender(GML3.prototype.writeSurfaceOrPolygon),
    'MultiPolygon': makeChildAppender(
      GML3.prototype.writeMultiSurfaceOrPolygon
    ),
    'Surface': makeChildAppender(GML3.prototype.writeSurfaceOrPolygon),
    'MultiSurface': makeChildAppender(
      GML3.prototype.writeMultiSurfaceOrPolygon
    ),
    'Envelope': makeChildAppender(GML3.prototype.writeEnvelope),
  },
};

export default GML32;
