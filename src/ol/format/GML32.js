/**
 * @module ol/format/GML32
 */
import GML3 from './GML3.js';
import GMLBase from './GMLBase.js';
import {makeArrayPusher, makeReplacer, makeChildAppender} from '../xml.js';
import {writeStringTextNode} from '../format/xsd.js';

/**
 * @classdesc Feature format for reading and writing data in the GML format
 *            version 3.2.1.
 * @api
 */
class GML32 extends GML3 {

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
    'pos': makeReplacer(GML3.prototype.readFlatPos_),
    'posList': makeReplacer(GML3.prototype.readFlatPosList_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @protected
 */
GML32.prototype.FLAT_LINEAR_RINGS_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'interior': GML3.prototype.interiorParser_,
    'exterior': GML3.prototype.exteriorParser_
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @protected
 */
GML32.prototype.GEOMETRY_PARSERS = {
  'http://www.opengis.net/gml/3.2': {
    'Point': makeReplacer(GMLBase.prototype.readPoint),
    'MultiPoint': makeReplacer(
      GMLBase.prototype.readMultiPoint),
    'LineString': makeReplacer(
      GMLBase.prototype.readLineString),
    'MultiLineString': makeReplacer(
      GMLBase.prototype.readMultiLineString),
    'LinearRing': makeReplacer(
      GMLBase.prototype.readLinearRing),
    'Polygon': makeReplacer(GMLBase.prototype.readPolygon),
    'MultiPolygon': makeReplacer(
      GMLBase.prototype.readMultiPolygon),
    'Surface': makeReplacer(GML32.prototype.readSurface_),
    'MultiSurface': makeReplacer(
      GML3.prototype.readMultiSurface_),
    'Curve': makeReplacer(GML32.prototype.readCurve_),
    'MultiCurve': makeReplacer(
      GML3.prototype.readMultiCurve_),
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
      GML3.prototype.curveMemberParser_),
    'curveMembers': makeArrayPusher(
      GML3.prototype.curveMemberParser_)
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
      GML3.prototype.surfaceMemberParser_),
    'surfaceMembers': makeArrayPusher(
      GML3.prototype.surfaceMemberParser_)
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
      GMLBase.prototype.readLineString),
    'Curve': makeArrayPusher(GML3.prototype.readCurve_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.SURFACEMEMBER_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'Polygon': makeArrayPusher(GMLBase.prototype.readPolygon),
    'Surface': makeArrayPusher(GML3.prototype.readSurface_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.SURFACE_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'patches': makeReplacer(GML3.prototype.readPatch_)
  }
};

/**
 * @const
 * @type {Object<string, Object<string, import("../xml.js").Parser>>}
 * @private
 */
GML32.prototype.CURVE_PARSERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'segments': makeReplacer(GML3.prototype.readSegment_)
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
      GML3.prototype.readFlatPosList_),
    'upperCorner': makeArrayPusher(
      GML3.prototype.readFlatPosList_)
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
      GML3.prototype.readPolygonPatch_)
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
      GML3.prototype.readLineStringSegment_)
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
      GMLBase.prototype.pointMemberParser_),
    'pointMembers': makeArrayPusher(
      GMLBase.prototype.pointMemberParser_)
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
      GMLBase.prototype.lineStringMemberParser_),
    'lineStringMembers': makeArrayPusher(
      GMLBase.prototype.lineStringMemberParser_)
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
      GMLBase.prototype.polygonMemberParser_),
    'polygonMembers': makeArrayPusher(
      GMLBase.prototype.polygonMemberParser_)
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
      GMLBase.prototype.readFlatCoordinatesFromNode_)
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
      GMLBase.prototype.readLineString)
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
      GMLBase.prototype.readPolygon)
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
      GMLBase.prototype.readFlatLinearRing_)
  }
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 * @private
 */
GML32.prototype.RING_SERIALIZERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'exterior': makeChildAppender(GML3.prototype.writeRing_),
    'interior': makeChildAppender(GML3.prototype.writeRing_)
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
      GML3.prototype.writeSurfaceOrPolygonMember_),
    'polygonMember': makeChildAppender(
      GML3.prototype.writeSurfaceOrPolygonMember_)
  }
};


/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 * @private
 */
GML32.prototype.POINTMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'pointMember': makeChildAppender(
      GML3.prototype.writePointMember_)
  }
};


/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 * @private
 */
GML32.prototype.LINESTRINGORCURVEMEMBER_SERIALIZERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'lineStringMember': makeChildAppender(
      GML3.prototype.writeLineStringOrCurveMember_),
    'curveMember': makeChildAppender(
      GML3.prototype.writeLineStringOrCurveMember_)
  }
};

/**
 * @type {Object<string, Object<string, import("../xml.js").Serializer>>}
 * @private
 */
GML32.prototype.GEOMETRY_SERIALIZERS_ = {
  'http://www.opengis.net/gml/3.2': {
    'Curve': makeChildAppender(
      GML3.prototype.writeCurveOrLineString_),
    'MultiCurve': makeChildAppender(
      GML3.prototype.writeMultiCurveOrLineString_),
    'Point': makeChildAppender(GML32.prototype.writePoint_),
    'MultiPoint': makeChildAppender(
      GML3.prototype.writeMultiPoint_),
    'LineString': makeChildAppender(
      GML3.prototype.writeCurveOrLineString_),
    'MultiLineString': makeChildAppender(
      GML3.prototype.writeMultiCurveOrLineString_),
    'LinearRing': makeChildAppender(
      GML3.prototype.writeLinearRing_),
    'Polygon': makeChildAppender(
      GML3.prototype.writeSurfaceOrPolygon_),
    'MultiPolygon': makeChildAppender(
      GML3.prototype.writeMultiSurfaceOrPolygon_),
    'Surface': makeChildAppender(
      GML3.prototype.writeSurfaceOrPolygon_),
    'MultiSurface': makeChildAppender(
      GML3.prototype.writeMultiSurfaceOrPolygon_),
    'Envelope': makeChildAppender(
      GML3.prototype.writeEnvelope)
  }
};

export default GML32;
