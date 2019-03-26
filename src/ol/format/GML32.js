/**
 * @module ol/format/GML32
 */
import GML3Format from './GML3.js';
import GMLBaseFormat from './GMLBase.js';
import {makeArrayPusher, makeReplacer, makeChildAppender} from '../xml.js';
import {writeStringTextNode} from '../format/xsd.js';

/**
 * @classdesc Feature format for reading and writing data in the GML format
 *            version 3.2.1.
 * @api
 */
class GML32 extends GML3Format {

  /**
   * @param {import("./GMLBase.js").Options=} opt_options Optional configuration object.
   */
  constructor(opt_options) {
    const options = /** @type {import("./GMLBase.js").Options} */ (opt_options ? opt_options : {});

    super(options);

    /**
     * @inheritDoc
     */
    this.schemaLocation = options.schemaLocation ?
      options.schemaLocation : this.namespace + ' http://schemas.opengis.net/gml/3.2.1/gml.xsd';

  }
}

GML32.prototype.namespace = 'http://www.opengis.net/gml/3.2';

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @protected
 */
GML32.prototype.GEOMETRY_FLAT_COORDINATES_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'pos': makeReplacer(GML3Format.prototype.readFlatPos_),
    'posList': makeReplacer(GML3Format.prototype.readFlatPosList_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @protected
 */
GML32.prototype.FLAT_LINEAR_RINGS_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'interior': GML3Format.prototype.interiorParser_,
    'exterior': GML3Format.prototype.exteriorParser_
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @protected
 */
GML32.prototype.GEOMETRY_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'Point': makeReplacer(GMLBaseFormat.prototype.readPoint),
    'MultiPoint': makeReplacer(
      GMLBaseFormat.prototype.readMultiPoint),
    'LineString': makeReplacer(
      GMLBaseFormat.prototype.readLineString),
    'MultiLineString': makeReplacer(
      GMLBaseFormat.prototype.readMultiLineString),
    'LinearRing': makeReplacer(
      GMLBaseFormat.prototype.readLinearRing),
    'Polygon': makeReplacer(GMLBaseFormat.prototype.readPolygon),
    'MultiPolygon': makeReplacer(
      GMLBaseFormat.prototype.readMultiPolygon),
    'Surface': makeReplacer(GML32.prototype.readSurface_),
    'MultiSurface': makeReplacer(
      GML3Format.prototype.readMultiSurface_),
    'Curve': makeReplacer(GML32.prototype.readCurve_),
    'MultiCurve': makeReplacer(
      GML3Format.prototype.readMultiCurve_),
    'Envelope': makeReplacer(GML32.prototype.readEnvelope_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.MULTICURVE_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'curveMember': makeArrayPusher(
      GML3Format.prototype.curveMemberParser_),
    'curveMembers': makeArrayPusher(
      GML3Format.prototype.curveMemberParser_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.MULTISURFACE_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'surfaceMember': makeArrayPusher(
      GML3Format.prototype.surfaceMemberParser_),
    'surfaceMembers': makeArrayPusher(
      GML3Format.prototype.surfaceMemberParser_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.CURVEMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'LineString': makeArrayPusher(
      GMLBaseFormat.prototype.readLineString),
    'Curve': makeArrayPusher(GML3Format.prototype.readCurve_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.SURFACEMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'Polygon': makeArrayPusher(GMLBaseFormat.prototype.readPolygon),
    'Surface': makeArrayPusher(GML3Format.prototype.readSurface_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.SURFACE_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'patches': makeReplacer(GML3Format.prototype.readPatch_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.CURVE_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'segments': makeReplacer(GML3Format.prototype.readSegment_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.ENVELOPE_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'lowerCorner': makeArrayPusher(
      GML3Format.prototype.readFlatPosList_),
    'upperCorner': makeArrayPusher(
      GML3Format.prototype.readFlatPosList_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.PATCHES_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'PolygonPatch': makeReplacer(
      GML3Format.prototype.readPolygonPatch_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.SEGMENTS_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'LineStringSegment': makeReplacer(
      GML3Format.prototype.readLineStringSegment_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.MULTIPOINT_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'pointMember': makeArrayPusher(
      GMLBaseFormat.prototype.pointMemberParser_),
    'pointMembers': makeArrayPusher(
      GMLBaseFormat.prototype.pointMemberParser_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.MULTILINESTRING_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'lineStringMember': makeArrayPusher(
      GMLBaseFormat.prototype.lineStringMemberParser_),
    'lineStringMembers': makeArrayPusher(
      GMLBaseFormat.prototype.lineStringMemberParser_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.MULTIPOLYGON_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'polygonMember': makeArrayPusher(
      GMLBaseFormat.prototype.polygonMemberParser_),
    'polygonMembers': makeArrayPusher(
      GMLBaseFormat.prototype.polygonMemberParser_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.POINTMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'Point': makeArrayPusher(
      GMLBaseFormat.prototype.readFlatCoordinatesFromNode_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.LINESTRINGMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'LineString': makeArrayPusher(
      GMLBaseFormat.prototype.readLineString)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.POLYGONMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'Polygon': makeArrayPusher(
      GMLBaseFormat.prototype.readPolygon)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @protected
 */
GML32.prototype.RING_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'LinearRing': makeReplacer(
      GMLBaseFormat.prototype.readFlatLinearRing_)
  }
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 * @private
 */
GML32.prototype.RING_SERIALIZERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'exterior': makeChildAppender(GML3Format.prototype.writeRing_),
    'interior': makeChildAppender(GML3Format.prototype.writeRing_)
  }
};


/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 * @private
 */
GML32.prototype.ENVELOPE_SERIALIZERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'lowerCorner': makeChildAppender(writeStringTextNode),
    'upperCorner': makeChildAppender(writeStringTextNode)
  }
};


/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 * @private
 */
GML32.prototype.SURFACEORPOLYGONMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'surfaceMember': makeChildAppender(
      GML3Format.prototype.writeSurfaceOrPolygonMember_),
    'polygonMember': makeChildAppender(
      GML3Format.prototype.writeSurfaceOrPolygonMember_)
  }
};


/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 * @private
 */
GML32.prototype.POINTMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'pointMember': makeChildAppender(
      GML3Format.prototype.writePointMember_)
  }
};


/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 * @private
 */
GML32.prototype.LINESTRINGORCURVEMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'lineStringMember': makeChildAppender(
      GML3Format.prototype.writeLineStringOrCurveMember_),
    'curveMember': makeChildAppender(
      GML3Format.prototype.writeLineStringOrCurveMember_)
  }
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 * @private
 */
GML32.prototype.GEOMETRY_SERIALIZERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'Curve': makeChildAppender(
      GML3Format.prototype.writeCurveOrLineString_),
    'MultiCurve': makeChildAppender(
      GML3Format.prototype.writeMultiCurveOrLineString_),
    'Point': makeChildAppender(GML32.prototype.writePoint_),
    'MultiPoint': makeChildAppender(
      GML3Format.prototype.writeMultiPoint_),
    'LineString': makeChildAppender(
      GML3Format.prototype.writeCurveOrLineString_),
    'MultiLineString': makeChildAppender(
      GML3Format.prototype.writeMultiCurveOrLineString_),
    'LinearRing': makeChildAppender(
      GML3Format.prototype.writeLinearRing_),
    'Polygon': makeChildAppender(
      GML3Format.prototype.writeSurfaceOrPolygon_),
    'MultiPolygon': makeChildAppender(
      GML3Format.prototype.writeMultiSurfaceOrPolygon_),
    'Surface': makeChildAppender(
      GML3Format.prototype.writeSurfaceOrPolygon_),
    'MultiSurface': makeChildAppender(
      GML3Format.prototype.writeMultiSurfaceOrPolygon_),
    'Envelope': makeChildAppender(
      GML3Format.prototype.writeEnvelope)
  }
};

export default GML32;
