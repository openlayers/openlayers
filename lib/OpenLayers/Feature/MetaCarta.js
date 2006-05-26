/** 
 * @class
 */
MCFeature = Class.create();
MCFeature.prototype = {

    /** @type String */
    id: "",

    /** @type OpenLayers.Size */
    size:null,
    
    /** @type OpenLayers.LonLat */
    lonlat:null,

    /** @type String */
    markerImage: "",
    
    /** @type String */
    srsName: "",

    /** @type String */
    title: "",

    /** @type String */
    location: "",

    /** @type String */
    docurl: "",

    /** @type String */
    extract: "",

    /** @type String */
    geoExtract: "",

    /** @type String */
    relevance: "",

    /** @type String */
    geoRelevance: "",

    /**
     * @constructor
     * 
     * @param {XMLNode} node
     */
    initialize: function(node) {

        var docpt = OpenLayers.Util.getNodes(node, "docpoint")[0];
        this.id = docpt.getAttribute('fid');
    
        var position = OpenLayers.Util.getNodes(docpt, "position")[0];
        var point = OpenLayers.Util.getNodes(position, "gml:Point")[0];
        this.srsName = point.getAttribute('srsName');
        var coords = OpenLayers.Util.getTagText(point, "gml:coordinates");
        this.lonlat = OpenLayers.LonLat.fromString(coords);
        
        this.title = OpenLayers.Util.getTagText(docpt, "title");
        this.location = OpenLayers.Util.getTagText(docpt, "locationName");
        this.docurl = OpenLayers.Util.getTagText(docpt, "documentUrl");
        this.extract = OpenLayers.Util.getTagText(docpt, "extract");
        this.geoExtract = OpenLayers.Util.getTagText(docpt, "geoextract");
        this.relevance = OpenLayers.Util.getTagText(docpt, "relevance");
        this.geoRelevance = OpenLayers.Util.getTagText(docpt, "georelevance");
    
        this.markerImage = OpenLayers.Util.getTagText(docpt, "markerImage");
        this.size = new OpenLayers.Size(20, 25); // TODO: Fix this hard coded value.
    },

    /**
     * 
     */
    destroy: function() {
    },
    

    /**
     * @returns String version of this MCFeature, for easy debugging
     * @type String
     */
    toString:function() {
        return this.title + " relevance:" + this.relevance + 
                    " [" + this.geoRelevance + "]";
        s += " Fid [" + this.fid + "] @ " + this._latlon.toString();
        s += " Location [" + this.geoExtract + "]";
    },

    /**
     * @param {OpenLayers.Marker} marker
     */
    loadEvents: function(marker) {
        marker.events.register("mousedown", marker, this.onMarkerMouseDown);

// this.onMarkerMouseDown.bindAsEventListener(this));                
    },


    /**
     * @param {Event} evt
     */
    onMarkerMouseDown: function(evt) {
        alert("yo!");
    },

    /** 
     * @returns HTML content based on feature information - for use with Popups
     * @type String
     */
    getContentHTML:function() {

        var contentHTML = "";
        
        contentHTML += "<div style='margin: 0.25em'>" 
        
        contentHTML += "<div style='height: 1.5em; overflow: hidden'>" 
        contentHTML += "<span style='font-size: 1.2em; font-weight: bold'>" 
        contentHTML +=     this.title;
        contentHTML += "</span>"
        contentHTML += "</div>"
        contentHTML += "<br/>"


        contentHTML += "<span style='font-size: 0.7em;'>" 
        contentHTML += "<b>Location:</b>";
        contentHTML += this.location;
        contentHTML += " (" + this.geoRelevance + ")";
        contentHTML += "</span>"
        contentHTML += "<br>"; 
        contentHTML += "<br/>"

        contentHTML += "<span style='font-size: 0.7em; align:center'>" 
        contentHTML += "<b>Extract:</b>";
        contentHTML += "</span>"
        contentHTML += "<br>"; 
        contentHTML += "<span style='font-size: 0.7em; align:center'>" 
        contentHTML += this.extract;
        contentHTML += "</span>"

        contentHTML += "</div>"

        return contentHTML;
    },

    /** 
     * @returns HTML content based on feature information- for use with ListDiv
     * @type String
     */
    getDivListHTML:function() {
    
        var divHTML = '';
      
        divHTML += '<div id="' + this.id + '">';
        divHTML += '<a href="' + this.docurl + '">';
        divHTML +=     this.title;
        divHTML += '</a><div>';
        divHTML += this.extract;
        divHTML += '</div></div>';

        return divHTML;
    },

  /** @final @type String */
  CLASS_NAME: "MCFeature"  
};


