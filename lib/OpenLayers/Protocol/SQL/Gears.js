/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires Gears/gears_init.js
 * @requires OpenLayers/Protocol/SQL.js
 * @requires OpenLayers/Format/JSON.js
 * @requires OpenLayers/Format/WKT.js
 */

/**
 * Class: OpenLayers.Protocol.SQL.Gears
 * This Protocol stores feature in the browser via the Gears Database module 
 * <http://code.google.com/apis/gears/api_database.html>.
 *
 * The main advantage is that all the read, create, update and delete operations 
 * can be done offline.
 *
 * Inherits from:
 *  - <OpenLayers.Protocol.SQL>
 */
OpenLayers.Protocol.SQL.Gears = OpenLayers.Class(OpenLayers.Protocol.SQL, {

    /**
     * Property: FID_PREFIX
     * {String}
     */
    FID_PREFIX: '__gears_fid__',

    /**
     * Property: NULL_GEOMETRY
     * {String}
     */
    NULL_GEOMETRY: '__gears_null_geometry__',

    /**
     * Property: NULL_FEATURE_STATE
     * {String}
     */
    NULL_FEATURE_STATE: '__gears_null_feature_state__',

    /**
     * Property: jsonParser
     * {<OpenLayers.Format.JSON>}
     */
    jsonParser: null,

    /**
     * Property: wktParser
     * {<OpenLayers.Format.WKT>}
     */
    wktParser: null,

    /**
     * Property: fidRegExp
     * {RegExp} Regular expression to know whether a feature was
     *      created in offline mode.
     */
    fidRegExp: null,

    /**
     * Property: saveFeatureState
     * {Boolean} Whether to save the feature state (<OpenLayers.State>)
     *      into the database, defaults to true.
     */    
    saveFeatureState: true,

    /**
     * Property: typeOfFid
     * {String} The type of the feature identifier, either "number" or
     *      "string", defaults to "string".
     */
    typeOfFid: "string",

    /**
     * Property: db
     * {GearsDatabase}
     */
    db: null,

    /**
     * Constructor: OpenLayers.Protocol.SQL.Gears
     */
    initialize: function(options) {
        if (!this.supported()) {
            return;
        }
        OpenLayers.Protocol.SQL.prototype.initialize.apply(this, [options]);
        this.jsonParser = new OpenLayers.Format.JSON();
        this.wktParser = new OpenLayers.Format.WKT();

        this.fidRegExp = new RegExp('^' + this.FID_PREFIX);
        this.initializeDatabase();

        
    },

    /**
     * Method: initializeDatabase
     */
    initializeDatabase: function() {
        this.db = google.gears.factory.create('beta.database');
        this.db.open(this.databaseName);
        this.db.execute(
            "CREATE TABLE IF NOT EXISTS " + this.tableName +
            " (fid TEXT UNIQUE, geometry TEXT, properties TEXT," +
            "  state TEXT)");
   },

    /**
     * APIMethod: destroy
     * Clean up the protocol.
     */
    destroy: function() {
        this.db.close();
        this.db = null;

        this.jsonParser = null;
        this.wktParser = null;

        OpenLayers.Protocol.SQL.prototype.destroy.apply(this);
    },

    /**
     * APIMethod: supported
     * Determine whether a browser supports Gears
     *
     * Returns:
     * {Boolean} The browser supports Gears
     */
    supported: function() {
        return !!(window.google && google.gears);
    },

    /**
     * APIMethod: read
     * Read all features from the database and return a
     * <OpenLayers.Protocol.Response> instance. If the options parameter
     * contains a callback attribute, the function is called with the response
     * as a parameter.
     *
     * Parameters:
     * options - {Object} Optional object for configuring the request; it
     *      can have the {Boolean} property "noFeatureStateReset" which
     *      specifies if the state of features read from the Gears
     *      database must be reset to null, if "noFeatureStateReset"
     *      is undefined or false then each feature's state is reset
     *      to null, if "noFeatureStateReset" is true the feature state
     *      is preserved.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     *      object.
     */
    read: function(options) {
        OpenLayers.Protocol.prototype.read.apply(this, arguments);
        options = OpenLayers.Util.applyDefaults(options, this.options);

        var feature, features = [];
        var rs = this.db.execute("SELECT * FROM " + this.tableName);
        while (rs.isValidRow()) {
            feature = this.unfreezeFeature(rs);
            if (this.evaluateFilter(feature, options.filter)) {
                if (!options.noFeatureStateReset) {
                    feature.state = null;
                }
                features.push(feature);
            }
            rs.next();
        }
        rs.close();

        var resp = new OpenLayers.Protocol.Response({
            code: OpenLayers.Protocol.Response.SUCCESS,
            requestType: "read",
            features: features
        });

        if (options && options.callback) {
            options.callback.call(options.scope, resp);
        }

        return resp;
    },

    /**
     * Method: unfreezeFeature
     *
     * Parameters:
     * row - {ResultSet}
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>}
     */
    unfreezeFeature: function(row) {
        var feature;
        var wkt = row.fieldByName('geometry');
        if (wkt == this.NULL_GEOMETRY) {
            feature = new OpenLayers.Feature.Vector();
        } else {
            feature = this.wktParser.read(wkt);
        }

        feature.attributes = this.jsonParser.read(
            row.fieldByName('properties'));

        feature.fid = this.extractFidFromField(row.fieldByName('fid'));

        var state = row.fieldByName('state');
        if (state == this.NULL_FEATURE_STATE) {
            state = null;
        }
        feature.state = state;

        return feature;
    },

    /**
     * Method: extractFidFromField
     *
     * Parameters:
     * field - {String}
     *
     * Returns
     * {String} or {Number} The fid.
     */
    extractFidFromField: function(field) {
        if (!field.match(this.fidRegExp) && this.typeOfFid == "number") {
            field = parseFloat(field);
        }
        return field;
    },

    /**
     * APIMethod: create
     * Create new features into the database.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})} or
     *            {<OpenLayers.Feature.Vector>} The features to create in
     *            the database.
     * options - {Object} Optional object for configuring the request.
     *
     * Returns:
     *  {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     *          object.
     */
    create: function(features, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options);

        var resp = this.createOrUpdate(features);
        resp.requestType = "create";

        if (options && options.callback) {
            options.callback.call(options.scope, resp);
        }

        return resp;
    },

    /**
     * APIMethod: update
     * Construct a request updating modified feature.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})} or
     *            {<OpenLayers.Feature.Vector>} The features to update in
     *            the database.
     * options - {Object} Optional object for configuring the request.
     *
     * Returns:
     *  {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     *          object.
     */
    update: function(features, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options);

        var resp = this.createOrUpdate(features);
        resp.requestType = "update";

        if (options && options.callback) {
            options.callback.call(options.scope, resp);
        }

        return resp;
    },

    /**
     * Method: createOrUpdate
     * Construct a request for updating or creating features in the
     * database.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})} or
     *      {<OpenLayers.Feature.Vector>} The feature to create or update
     *      in the database.
     *
     * Returns:
     *  {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     *          object.
     */
    createOrUpdate: function(features) {
        if (!(features instanceof Array)) {
            features = [features];
        }

        var i, len = features.length, feature;
        var insertedFeatures = new Array(len);
 
        for (i = 0; i < len; i++) {
            feature = features[i];
            var params = this.freezeFeature(feature);
            this.db.execute(
                "REPLACE INTO " + this.tableName + 
                " (fid, geometry, properties, state)" + 
                " VALUES (?, ?, ?, ?)",
                params);

            var clone = feature.clone();
            clone.fid = this.extractFidFromField(params[0]);
            insertedFeatures[i] = clone;
        }

        return new OpenLayers.Protocol.Response({
            code: OpenLayers.Protocol.Response.SUCCESS,
            features: insertedFeatures,
            reqFeatures: features
        });
    },

    /**
     * Method: freezeFeature
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     * state - {String} The feature state to store in the database.
     *
     * Returns:
     * {Array}
     */
    freezeFeature: function(feature) {
        // 2 notes:
        // - fid might not be a string
        // - getFeatureStateForFreeze needs the feature fid to it's stored
        //   in the feature here
        feature.fid = feature.fid != null ?
            "" + feature.fid : OpenLayers.Util.createUniqueID(this.FID_PREFIX);

        var geometry = feature.geometry != null ?
            feature.geometry.toString() : this.NULL_GEOMETRY;

        var properties = this.jsonParser.write(feature.attributes);

        var state = this.getFeatureStateForFreeze(feature);

        return [feature.fid, geometry, properties, state];
    },

    /**
     * Method: getFeatureStateForFreeze
     * Get the state of the feature to store into the database.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature.
     *
     * Returns
     * {String} The state
     */
    getFeatureStateForFreeze: function(feature) {
        var state;
        if (!this.saveFeatureState) {
            state = this.NULL_FEATURE_STATE;
        } else if (this.createdOffline(feature)) {
            // if the feature was created in offline mode, its
            // state must remain INSERT
            state = OpenLayers.State.INSERT;
        } else {
            state = feature.state;
        }
        return state;
    },

    /**
     * APIMethod: delete
     * Delete features from the database.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})} or
     *            {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     *       This object is modified and should not be reused.
     *
     * Returns:
     *  {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     *          object.
     */
    "delete": function(features, options) {
        if (!(features instanceof Array)) {
            features = [features];
        }

        options = OpenLayers.Util.applyDefaults(options, this.options);

        var i, len, feature;
        for (i = 0, len = features.length; i < len; i++) {
            feature = features[i];

            // if saveFeatureState is set to true and if the feature wasn't created
            // in offline mode we don't delete it in the database but just update 
            // it state column
            if (this.saveFeatureState && !this.createdOffline(feature)) {
                var toDelete = feature.clone();
                toDelete.fid = feature.fid;
                if (toDelete.geometry) {
                    toDelete.geometry.destroy();
                    toDelete.geometry = null;
                }
                toDelete.state = feature.state;
                this.createOrUpdate(toDelete);
            } else {
                this.db.execute(
                    "DELETE FROM " + this.tableName +
                    " WHERE fid = ?", [feature.fid]);
            }
        }

        var resp = new OpenLayers.Protocol.Response({
            code: OpenLayers.Protocol.Response.SUCCESS,
            requestType: "delete",
            reqFeatures: features
        });

        if (options && options.callback) {
            options.callback.call(options.scope, resp);
        }

        return resp;
    },

    /**
     * Method: createdOffline
     * Returns true if the feature had a feature id when it was created in
     *      the Gears database, false otherwise; this is determined by
     *      checking the form of the feature's fid value.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     *
     * Returns:
     * {Boolean}
     */
    createdOffline: function(feature) {
        return (typeof feature.fid == "string" &&
                !!(feature.fid.match(this.fidRegExp)));
    },

    /**
     * APIMethod: commit
     * Go over the features and for each take action
     * based on the feature state. Possible actions are create,
     * update and delete.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})}
     * options - {Object} Object whose possible keys are "create", "update",
     *      "delete", "callback" and "scope", the values referenced by the
     *      first three are objects as passed to the "create", "update", and
     *      "delete" methods, the value referenced by the "callback" key is
     *      a function which is called when the commit operation is complete
     *      using the scope referenced by the "scope" key.
     *
     * Returns:
     * {Array({<OpenLayers.Protocol.Response>})} An array of
     *       <OpenLayers.Protocol.Response> objects, one per request made
     *       to the database.
     */
    commit: function(features, options) {
        var opt, resp = [], nRequests = 0, nResponses = 0;

        function callback(resp) {
            if (++nResponses < nRequests) {
                resp.last = false;
            }
            this.callUserCallback(options, resp);
        }

        var feature, toCreate = [], toUpdate = [], toDelete = [];
        for (var i = features.length - 1; i >= 0; i--) {
            feature = features[i];
            switch (feature.state) {
            case OpenLayers.State.INSERT:
                toCreate.push(feature);
                break;
            case OpenLayers.State.UPDATE:
                toUpdate.push(feature);
                break;
            case OpenLayers.State.DELETE:
                toDelete.push(feature);
                break;
            }
        }
        if (toCreate.length > 0) {
            nRequests++;
            opt = OpenLayers.Util.applyDefaults(
                {"callback": callback, "scope": this},
                options.create
            );
            resp.push(this.create(toCreate, opt));
        }
        if (toUpdate.length > 0) {
            nRequests++;
            opt = OpenLayers.Util.applyDefaults(
                {"callback": callback, "scope": this},
                options.update
            );
            resp.push(this.update(toUpdate, opt));
        }
        if (toDelete.length > 0) {
            nRequests++;
            opt = OpenLayers.Util.applyDefaults(
                {"callback": callback, "scope": this},
                options["delete"]
            );
            resp.push(this["delete"](toDelete, opt));
        }

        return resp;
    },

    /**
     * Method: clear
     * Removes all rows of the table.
     */
    clear: function() {
        this.db.execute("DELETE FROM " + this.tableName);
    },

    /**
     * Method: callUserCallback
     * This method is called from within commit each time a request is made
     * to the database, it is responsible for calling the user-supplied
     * callbacks.
     *
     * Parameters:
     * options - {Object} The map of options passed to the commit call.
     * resp - {<OpenLayers.Protocol.Response>}
     */
    callUserCallback: function(options, resp) {
        var opt = options[resp.requestType];
        if (opt && opt.callback) {
            opt.callback.call(opt.scope, resp);
        }
        if (resp.last && options.callback) {
            options.callback.call(options.scope);
        }
    },

    CLASS_NAME: "OpenLayers.Protocol.SQL.Gears"
});
