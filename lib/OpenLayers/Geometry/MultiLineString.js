/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Geometry/Collection.js
 * @requires OpenLayers/Geometry/LineString.js
 */

/**
 * Class: OpenLayers.Geometry.MultiLineString
 * A MultiLineString is a geometry with multiple <OpenLayers.Geometry.LineString>
 * components.
 * 
 * Inherits from:
 *  - <OpenLayers.Geometry.Collection>
 *  - <OpenLayers.Geometry> 
 */
OpenLayers.Geometry.MultiLineString = OpenLayers.Class(
  OpenLayers.Geometry.Collection, {

    /**
     * Property: componentTypes
     * {Array(String)} An array of class names representing the types of
     * components that the collection can include.  A null value means the
     * component types are not restricted.
     */
    componentTypes: ["OpenLayers.Geometry.LineString"],

    /**
     * Constructor: OpenLayers.Geometry.MultiLineString
     * Constructor for a MultiLineString Geometry.
     *
     * Parameters: 
     * components - {Array(<OpenLayers.Geometry.LineString>)} 
     *
     */
    
    /**
     * Method: split
     * Use this geometry (the source) to attempt to split a target geometry.
     * 
     * Parameters:
     * geometry - {<OpenLayers.Geometry>} The target geometry.
     * options - {Object} Properties of this object will be used to determine
     *     how the split is conducted.
     *
     * Valid options:
     * mutual - {Boolean} Split the source geometry in addition to the target
     *     geometry.  Default is false.
     * edge - {Boolean} Allow splitting when only edges intersect.  Default is
     *     true.  If false, a vertex on the source must be within the tolerance
     *     distance of the intersection to be considered a split.
     * tolerance - {Number} If a non-null value is provided, intersections
     *     within the tolerance distance of an existing vertex on the source
     *     will be assumed to occur at the vertex.
     * 
     * Returns:
     * {Array} A list of geometries (of this same type as the target) that
     *     result from splitting the target with the source geometry.  The
     *     source and target geometry will remain unmodified.  If no split
     *     results, null will be returned.  If mutual is true and a split
     *     results, return will be an array of two arrays - the first will be
     *     all geometries that result from splitting the source geometry and
     *     the second will be all geometries that result from splitting the
     *     target geometry.
     */
    split: function(geometry, options) {
        var results = null;
        var mutual = options && options.mutual;
        var splits, sourceLine, sourceLines, sourceSplit, targetSplit;
        var sourceParts = [];
        var targetParts = [geometry];
        for(var i=0, len=this.components.length; i<len; ++i) {
            sourceLine = this.components[i];
            sourceSplit = false;
            for(var j=0; j < targetParts.length; ++j) { 
                splits = sourceLine.split(targetParts[j], options);
                if(splits) {
                    if(mutual) {
                        sourceLines = splits[0];
                        for(var k=0, klen=sourceLines.length; k<klen; ++k) {
                            if(k===0 && sourceParts.length) {
                                sourceParts[sourceParts.length-1].addComponent(
                                    sourceLines[k]
                                );
                            } else {
                                sourceParts.push(
                                    new OpenLayers.Geometry.MultiLineString([
                                        sourceLines[k]
                                    ])
                                );
                            }
                        }
                        sourceSplit = true;
                        splits = splits[1];
                    }
                    if(splits.length) {
                        // splice in new target parts
                        splits.unshift(j, 1);
                        Array.prototype.splice.apply(targetParts, splits);
                        break;
                    }
                }
            }
            if(!sourceSplit) {
                // source line was not hit
                if(sourceParts.length) {
                    // add line to existing multi
                    sourceParts[sourceParts.length-1].addComponent(
                        sourceLine.clone()
                    );
                } else {
                    // create a fresh multi
                    sourceParts = [
                        new OpenLayers.Geometry.MultiLineString(
                            sourceLine.clone()
                        )
                    ];
                }
            }
        }
        if(sourceParts && sourceParts.length > 1) {
            sourceSplit = true;
        } else {
            sourceParts = [];
        }
        if(targetParts && targetParts.length > 1) {
            targetSplit = true;
        } else {
            targetParts = [];
        }
        if(sourceSplit || targetSplit) {
            if(mutual) {
                results = [sourceParts, targetParts];
            } else {
                results = targetParts;
            }
        }
        return results;
    },
    
    /**
     * Method: splitWith
     * Split this geometry (the target) with the given geometry (the source).
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>} A geometry used to split this
     *     geometry (the source).
     * options - {Object} Properties of this object will be used to determine
     *     how the split is conducted.
     *
     * Valid options:
     * mutual - {Boolean} Split the source geometry in addition to the target
     *     geometry.  Default is false.
     * edge - {Boolean} Allow splitting when only edges intersect.  Default is
     *     true.  If false, a vertex on the source must be within the tolerance
     *     distance of the intersection to be considered a split.
     * tolerance - {Number} If a non-null value is provided, intersections
     *     within the tolerance distance of an existing vertex on the source
     *     will be assumed to occur at the vertex.
     * 
     * Returns:
     * {Array} A list of geometries (of this same type as the target) that
     *     result from splitting the target with the source geometry.  The
     *     source and target geometry will remain unmodified.  If no split
     *     results, null will be returned.  If mutual is true and a split
     *     results, return will be an array of two arrays - the first will be
     *     all geometries that result from splitting the source geometry and
     *     the second will be all geometries that result from splitting the
     *     target geometry.
     */
    splitWith: function(geometry, options) {
        var results = null;
        var mutual = options && options.mutual;
        var splits, targetLine, sourceLines, sourceSplit, targetSplit, sourceParts, targetParts;
        if(geometry instanceof OpenLayers.Geometry.LineString) {
            targetParts = [];
            sourceParts = [geometry];
            for(var i=0, len=this.components.length; i<len; ++i) {
                targetSplit = false;
                targetLine = this.components[i];
                for(var j=0; j<sourceParts.length; ++j) {
                    splits = sourceParts[j].split(targetLine, options);
                    if(splits) {
                        if(mutual) {
                            sourceLines = splits[0];
                            if(sourceLines.length) {
                                // splice in new source parts
                                sourceLines.unshift(j, 1);
                                Array.prototype.splice.apply(sourceParts, sourceLines);
                                j += sourceLines.length - 2;
                            }
                            splits = splits[1];
                            if(splits.length === 0) {
                                splits = [targetLine.clone()];
                            }
                        }
                        for(var k=0, klen=splits.length; k<klen; ++k) {
                            if(k===0 && targetParts.length) {
                                targetParts[targetParts.length-1].addComponent(
                                    splits[k]
                                );
                            } else {
                                targetParts.push(
                                    new OpenLayers.Geometry.MultiLineString([
                                        splits[k]
                                    ])
                                );
                            }
                        }
                        targetSplit = true;                    
                    }
                }
                if(!targetSplit) {
                    // target component was not hit
                    if(targetParts.length) {
                        // add it to any existing multi-line
                        targetParts[targetParts.length-1].addComponent(
                            targetLine.clone()
                        );
                    } else {
                        // or start with a fresh multi-line
                        targetParts = [
                            new OpenLayers.Geometry.MultiLineString([
                                targetLine.clone()
                            ])
                        ];
                    }
                    
                }
            }
        } else {
            results = geometry.split(this);
        }
        if(sourceParts && sourceParts.length > 1) {
            sourceSplit = true;
        } else {
            sourceParts = [];
        }
        if(targetParts && targetParts.length > 1) {
            targetSplit = true;
        } else {
            targetParts = [];
        }
        if(sourceSplit || targetSplit) {
            if(mutual) {
                results = [sourceParts, targetParts];
            } else {
                results = targetParts;
            }
        }
        return results;
    },

    CLASS_NAME: "OpenLayers.Geometry.MultiLineString"
});
