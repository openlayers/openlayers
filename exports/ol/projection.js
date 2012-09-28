goog.require('ol.Projection');

goog.exportSymbol('ol.Projection', ol.Projection);
goog.exportProperty(ol.Projection,
    'getFromCode', ol.Projection.getFromCode);
goog.exportProperty(ol.Projection,
    'getTransform', ol.Projection.getTransform);
goog.exportProperty(ol.Projection,
    'getTransformFromCodes', ol.Projection.getTransformFromCodes);
goog.exportProperty(ol.Projection,
    'transform', ol.Projection.transform);
goog.exportProperty(ol.Projection,
    'transformWithCodes', ol.Projection.transformWithCodes);
goog.exportProperty(ol.Projection.prototype,
    'getCode', ol.Projection.prototype.getCode);
goog.exportProperty(ol.Projection.prototype,
    'getExtent', ol.Projection.prototype.getExtent);
goog.exportProperty(ol.Projection.prototype,
    'getUnits', ol.Projection.prototype.getUnits);
