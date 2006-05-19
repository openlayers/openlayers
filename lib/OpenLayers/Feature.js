

/** Parse a feature from an XML node
* MC specific at the moment
*/
ol.Feature = Class.create();
ol.Feature.prototype= {

    // Object
    listeners:null,

    // ol.Size
    size:null,
    
    // ol.LatLon
    _latlon:null,

    // str        
    id:"",
    fid:null,
    srsName:null,
    title:null,
    location:null,
    docurl:null,
    extract:null,
    geoExtract:null,
    relevance:null,
    geoRelevance:null,
    markerImage:null,

    initialize: function(fNode) {
        this.listeners = new Object();

        var docpt = ol.Application.getNodes(fNode, "docpoint")[0];
        this.fid =  docpt.getAttribute('fid');
        this.id = this.fid;
    
        var node = ol.Application.getNodes(docpt, "position")[0];
        node = ol.Application.getNodes(node, "gml:Point")[0];
        this.srsName = node.getAttribute('srsName');
        var temp = ol.Application.getTagText(node, "gml:coordinates");
        this._latlon = ol.LatLon.fromString(temp);
        
        this.title = ol.Application.getTagText(docpt, "title");
        this.location = ol.Application.getTagText(docpt, "locationName");
        this.docurl = ol.Application.getTagText(docpt, "documentUrl");
        this.extract = ol.Application.getTagText(docpt, "extract");
        this.geoExtract = ol.Application.getTagText(docpt, "geoextract");
        this.relevance = ol.Application.getTagText(docpt, "relevance");
        this.geoRelevance = ol.Application.getTagText(docpt, "georelevance");
    
        this.markerImage = ol.Application.getTagText(docpt, "markerImage");
        this.size = new ol.Size(20, 25); // TODO: Fix this hard coded value.
    },

    destroy: function() {
        this.listeners = null;
        this.fid = null;
        this.id = null;
        this.srsName = null;
        this._latlon = null;
        this.title = null;
        this.location = null;
        this.docurl = null;
        this.extract = null;
        this.geoExtract = null;
        this.relevance = null;
        this.geoRelevance = null;
        this.markerImage = null;
        this.size = null;
    },
    
    toString:function() {
        var s = this.title + " relevance:" + this.relevance + 
                    " [" + this.geoRelevance + "]";
        s += " Fid [" + this.fid + "] @ " + this._latlon.toString();
        s += " Location [" + this.geoExtract + "]";
        return s;
    },

    /* MARKER DATA INTERFACE FUNCTIONS:
    *
    *  getLatLon(), getImage() 
    *
    */
     
    /**
    * ret(ol.Point)
    */
    getLatLon:function() { return this._latlon.copyOf(); },


   /**
    * ret(ol.Point)
    */
    getImage:function() { return this.markerImage; },

 
    /** html content based on feature information
    *
	* ret(str): 
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

    /** html content based on feature information
    *
	* ret(str): 
    */
    getDivListHTML:function() {
    
        var divHTML = '';
      
        divHTML += '<div id="' + this.fid + '">';
        divHTML += '<a href="' + this.docurl + '">';
        divHTML +=     this.title;
        divHTML += '</a><div>';
        divHTML += this.extract;
        divHTML += '</div></div>';

        return divHTML;
    },

    /////////////////////////////////
    who:function(){return ("Feature.js");}  //last
    
};
