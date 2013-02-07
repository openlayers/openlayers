/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/BaseTypes/Class.js
 * @requires OpenLayers/Animation.js
 */

OpenLayers.Kinetic = OpenLayers.Class({

    /**
     * Property: threshold
     * In most cases changing the threshold isn't needed.
     * In px/ms, default to 0.
     */
    threshold: 0,

    /**
     * Property: deceleration
     * {Float} the deseleration in px/ms², default to 0.0035.
     */
    deceleration: 0.0035,

    /**
     * Property: nbPoints
     * {Integer} the number of points we use to calculate the kinetic
     * initial values.
     */
    nbPoints: 100,

    /**
     * Property: delay
     * {Float} time to consider to calculate the kinetic initial values.
     * In ms, default to 200.
     */
    delay: 200,

    /**
     * Property: points
     * List of points use to calculate the kinetic initial values.
     */
    points: undefined,

    /**
     * Property: timerId
     * ID of the timer.
     */
    timerId: undefined,

    /**
     * Constructor: OpenLayers.Kinetic
     *
     * Parameters:
     * options - {Object}
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
    },

    /**
     * Method: begin
     * Begins the dragging.
     */
    begin: function() {
        OpenLayers.Animation.stop(this.timerId);
        this.timerId = undefined;
        this.points = [];
    },

    /**
     * Method: update
     * Updates during the dragging.
     *
     * Parameters:
     * xy - {<OpenLayers.Pixel>} The new position.
     */
    update: function(xy) {
        this.points.unshift({xy: xy, tick: new Date().getTime()});
        if (this.points.length > this.nbPoints) {
            this.points.pop();
        }
    },

    /**
     * Method: end
     * Ends the dragging, start the kinetic.
     *
     * Parameters:
     * xy - {<OpenLayers.Pixel>} The last position.
     *
     * Returns:
     * {Object} An object with two properties: "speed", and "theta". The
     *     "speed" and "theta" values are to be passed to the move 
     *     function when starting the animation.
     */
    end: function(xy) {
        var last, now = new Date().getTime();
        for (var i = 0, l = this.points.length, point; i < l; i++) {
            point = this.points[i];
            if (now - point.tick > this.delay) {
                break;
            }
            last = point;
        }
        if (!last) {
            return;
        }
        var time = new Date().getTime() - last.tick;
        var dist = Math.sqrt(Math.pow(xy.x - last.xy.x, 2) +
                             Math.pow(xy.y - last.xy.y, 2));
        var speed = dist / time;
        if (speed == 0 || speed < this.threshold) {
            return;
        }
        var theta = Math.asin((xy.y - last.xy.y) / dist);
        if (last.xy.x <= xy.x) {
            theta = Math.PI - theta;
        }
        return {speed: speed, theta: theta};
    },

    /**
     * Method: move
     * Launch the kinetic move pan.
     *
     * Parameters:
     * info - {Object} An object with two properties, "speed", and "theta".
     *     These values are those returned from the "end" call.
     * callback - {Function} Function called on every step of the animation,
     *     receives x, y (values to pan), end (is the last point).
     */
    move: function(info, callback) {
        var v0 = info.speed;
        var fx = Math.cos(info.theta);
        var fy = -Math.sin(info.theta);

        var initialTime = new Date().getTime();

        var lastX = 0;
        var lastY = 0;

        var timerCallback = function() {
            if (this.timerId == null) {
                return;
            }

            var t = new Date().getTime() - initialTime;

            var p = (-this.deceleration * Math.pow(t, 2)) / 2.0 + v0 * t;
            var x = p * fx;
            var y = p * fy;

            var args = {};
            args.end = false;
            var v = -this.deceleration * t + v0;

            if (v <= 0) {
                OpenLayers.Animation.stop(this.timerId);
                this.timerId = null;
                args.end = true;
            }

            args.x = x - lastX;
            args.y = y - lastY;
            lastX = x;
            lastY = y;
            callback(args.x, args.y, args.end);
        };

        this.timerId = OpenLayers.Animation.start(
            OpenLayers.Function.bind(timerCallback, this)
        );
    },

    CLASS_NAME: "OpenLayers.Kinetic"
});
