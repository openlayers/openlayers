OpenLayers.Feature = Class.create();
OpenLayers.Feature.prototype= {

    // events object
    events:null,
    
    // ol.LonLat
    lonlat:null,

    // Object
    data:null,

    initialize: function(lonlat, data) {
        this.lonlat = lonlat;
        this.data = data;
    },

    destroy: function() {
    },
    

    /** html content based on feature information
    *
	* ret(str): 
    */
    getContentHTML:function() {
    
        var contentHTML = "";
        
        contentHTML += "<div style='margin: 0.25em'>" 
        
        contentHTML += "<div style='height: 1.5em; overflow: hidden'>" 
        contentHTML += "<span style='font-size: 1.2em; font-weight: bold'>" 
        contentHTML +=     this.data['title'];
        contentHTML += "</span>"
        contentHTML += "</div>"

        contentHTML += "</div>"

        return contentHTML;
    },

    /////////////////////////////////
    who:function(){return ("Feature.js");}  //last
    
};
