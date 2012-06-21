goog.require("ol.loc");
goog.require("ol.feature");
goog.require("ol.projection");
goog.require('ol.bounds');
goog.require("ol.map");
goog.require("ol.layer.xyz");
goog.require("ol.layer.osm");

// ol.map
goog.exportSymbol('ol.map', ol.map );
goog.exportSymbol('ol.Map', ol.Map );
goog.exportProperty( ol.Map.prototype, 'center', ol.Map.prototype.center );
goog.exportProperty( ol.Map.prototype, 'projection', ol.Map.prototype.projection );
goog.exportProperty( ol.Map.prototype, 'userProjection', ol.Map.prototype.userProjection );
goog.exportProperty( ol.Map.prototype, 'zoom', ol.Map.prototype.zoom );
goog.exportProperty( ol.Map.prototype, 'numZoomLevels', ol.Map.prototype.numZoomLevels );
goog.exportProperty( ol.Map.prototype, 'resolutions', ol.Map.prototype.resolutions );
goog.exportProperty( ol.Map.prototype, 'layers', ol.Map.prototype.layers );
goog.exportProperty( ol.Map.prototype, 'controls', ol.Map.prototype.controls );
goog.exportProperty( ol.Map.prototype, 'maxExtent', ol.Map.prototype.maxExtent );
goog.exportProperty( ol.Map.prototype, 'maxRes', ol.Map.prototype.maxRes );
goog.exportProperty( ol.Map.prototype, 'destroy', ol.Map.prototype.destroy );

// ol.loc
goog.exportSymbol('ol.loc', ol.loc );
goog.exportSymbol('ol.Loc', ol.Loc ); // This is not required only for the tests with isInstanceOf
goog.exportProperty( ol.Loc.prototype, 'projection', ol.Loc.prototype.projection );
goog.exportProperty( ol.Loc.prototype, 'x', ol.Loc.prototype.x );
goog.exportProperty( ol.Loc.prototype, 'y', ol.Loc.prototype.y );
goog.exportProperty( ol.Loc.prototype, 'z', ol.Loc.prototype.z );
goog.exportProperty( ol.Loc.prototype, 'transform', ol.Loc.prototype.transform );
goog.exportProperty( ol.Loc.prototype, 'destroy', ol.Loc.prototype.destroy );

// ol.projection
goog.exportSymbol('ol.projection', ol.projection );
goog.exportSymbol('ol.Projection', ol.Projection );
goog.exportProperty( ol.Projection.prototype, 'code', ol.Projection.prototype.code );
goog.exportProperty( ol.Projection.prototype, 'units', ol.Projection.prototype.units );

// ol.bounds
goog.exportSymbol('ol.bounds', ol.bounds );
goog.exportSymbol('ol.Bounds', ol.Bounds );
goog.exportProperty( ol.Bounds.prototype, 'projection', ol.Bounds.prototype.projection );
goog.exportProperty( ol.Bounds.prototype, 'minX', ol.Bounds.prototype.minX );
goog.exportProperty( ol.Bounds.prototype, 'minY', ol.Bounds.prototype.minY );
goog.exportProperty( ol.Bounds.prototype, 'maxX', ol.Bounds.prototype.maxX );
goog.exportProperty( ol.Bounds.prototype, 'maxY', ol.Bounds.prototype.maxY );
