/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Feature/Vector.js
 */

/**
 * Class: OpenLayers.Control.Measure
 * Allows for drawing of features for measurements.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.Measure = OpenLayers.Class(OpenLayers.Control, {

    /**
     * Constant: EVENT_TYPES
     * {Array(String)} Supported application event types.  Register a listener
     *     for a particular event with the following syntax:
     * (code)
     * control.events.register(type, obj, listener);
     * (end)
     *
     * Listeners will be called with a reference to an event object.  The
     *     properties of this event depends on exactly what happened.
     *
     * Supported control event types (in addition to those from <OpenLayers.Control>):
     *  - *measure* Triggered when a measurement sketch is complete.  Listeners
     *      will receive an event with measure, units, order, and geometry
     *      properties.
     *  - *measurepartial* Triggered when a new point is added to the
     *      measurement sketch.  Listeners receive an event with measure,
     *      units, order, and geometry.
     */
    EVENT_TYPES: ['measure', 'measurepartial'],

    /**
     * APIProperty: handlerOptions
     * {Object} Used to set non-default properties on the control's handler
     */
    handlerOptions: null,
    
    /**
     * Property: callbacks
     * {Object} The functions that are sent to the handler for callback
     */
    callbacks: null,
    
    /**
     * Property: displaySystem
     * {String} Display system for output measurements.  Supported values
     *     are 'english', 'metric', and 'geographic'.  Default is 'metric'.
     */
    displaySystem: 'metric',
    
    /**
     * Property: displaySystemUnits
     * {Object} Units for various measurement systems.  Values are arrays
     *     of unit abbreviations (from OpenLayers.INCHES_PER_UNIT) in decreasing
     *     order of length.
     */
    displaySystemUnits: {
        geographic: ['dd'],
        english: ['mi', 'ft', 'in'],
        metric: ['km', 'm']
    },

    /**
     * Constructor: OpenLayers.Control.Measure
     * 
     * Parameters:
     * handler - {<OpenLayers.Handler>} 
     * options - {Object} 
     */
    initialize: function(handler, options) {
        // concatenate events specific to measure with those from the base
        this.EVENT_TYPES =
            OpenLayers.Control.Measure.prototype.EVENT_TYPES.concat(
            OpenLayers.Control.prototype.EVENT_TYPES
        );
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.callbacks = OpenLayers.Util.extend(
            {done: this.measureComplete, point: this.measurePartial},
            this.callbacks
        );
        this.handler = new handler(this, this.callbacks, this.handlerOptions);
    },
    
    /**
     * Method: updateHandler
     *
     * Parameters:
     * handler - {Function} One of the sketch handler constructors.
     * options - {Object} Options for the handler.
     */
    updateHandler: function(handler, options) {
        var active = this.active;
        if(active) {
            this.deactivate();
        }
        this.handler = new handler(this, this.callbacks, options);
        if(active) {
            this.activate();
        }
    },

    /**
     * Method: measureComplete
     * Called when the measurement sketch is done.
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     */
    measureComplete: function(geometry) {
        this.measure(geometry, "measure");
    },
    
    /**
     * Method: measurePartial
     * Called each time a new point is added to the measurement sketch.
     *
     * Parameters:
     * point - {<OpenLayers.Geometry.Point>} The last point added.
     * geometry - {<OpenLayers.Geometry>} The sketch geometry.
     */
    measurePartial: function(point, geometry) {
        this.measure(geometry, "measurepartial");
    },

    /**
     * Method: measure
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * eventType - {String}
     */
    measure: function(geometry, eventType) {
        var stat, order;
        if(geometry.CLASS_NAME.indexOf('LineString') > -1) {
            stat = this.getBestLength(geometry);
            order = 1;
        } else {
            stat = this.getBestArea(geometry);
            order = 2;
        }
        this.events.triggerEvent(eventType, {
            measure: stat[0],
            units: stat[1],
            order: order,
            geometry: geometry
        });
    },
    
    /**
     * Method: getBestArea
     * Based on the <displaySystem> returns the area of a geometry.
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     *
     * Returns:
     * {Array([Float, String])}  Returns a two item array containing the
     *     area and the units abbreviation.
     */
    getBestArea: function(geometry) {
        var units = this.displaySystemUnits[this.displaySystem];
        var unit, area;
        for(var i=0, len=units.length; i<len; ++i) {
            unit = units[i];
            area = this.getArea(geometry, unit);
            if(area > 1) {
                break;
            }
        }
        return [area, unit];
    },
    
    /**
     * Method: getArea
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * units - {String} Unit abbreviation
     *
     * Returns:
     * {Float} The geometry area in the given units.
     */
    getArea: function(geometry, units) {
        var area = geometry.getArea();
        var inPerDisplayUnit = OpenLayers.INCHES_PER_UNIT[units];
        if(inPerDisplayUnit) {
            var inPerMapUnit = OpenLayers.INCHES_PER_UNIT[this.map.getUnits()];
            area *= Math.pow((inPerMapUnit / inPerDisplayUnit), 2);
        }
        return area;
    },
    
    /**
     * Method: getBestLength
     * Based on the <displaySystem> returns the length of a geometry.
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     *
     * Returns:
     * {Array([Float, String])}  Returns a two item array containing the
     *     length and the units abbreviation.
     */
    getBestLength: function(geometry) {
        var units = this.displaySystemUnits[this.displaySystem];
        var unit, length;
        for(var i=0, len=units.length; i<len; ++i) {
            unit = units[i];
            length = this.getLength(geometry, unit);
            if(length > 1) {
                break;
            }
        }
        return [length, unit];
    },

    /**
     * Method: getLength
     *
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     * units - {String} Unit abbreviation
     *
     * Returns:
     * {Float} The geometry length in the given units.
     */
    getLength: function(geometry, units) {
        var length = geometry.getLength();
        var inPerDisplayUnit = OpenLayers.INCHES_PER_UNIT[units];
        if(inPerDisplayUnit) {
            var inPerMapUnit = OpenLayers.INCHES_PER_UNIT[this.map.getUnits()];
            length *= (inPerMapUnit / inPerDisplayUnit);
        }
        return length;
    },

    CLASS_NAME: "OpenLayers.Control.Measure"
});
