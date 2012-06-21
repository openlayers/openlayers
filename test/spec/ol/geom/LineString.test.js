describe("ol.geom.LineString", function() {
    var ls;
    
    beforeEach(function(){
        ls = new ol.geom.LineString([
            new ol.geom.Point(0,0),
            new ol.geom.Point(10,10),
            new ol.geom.Point(10,0),
            new ol.geom.Point(20,20)
        ]);
    });
    
    afterEach(function(){
        ls = null;
    });
    
    it("constructs instances", function() {
        expect( ls ).toBeA( ol.geom.LineString );
    });
    
    it("can construct instances without any points", function() {
        // empty array
        mp = new ol.geom.LineString([]);
        expect( ls ).toBeA( ol.geom.LineString );
        
        // no argument at all
        mp = new ol.geom.LineString();
        expect( ls ).toBeA( ol.geom.LineString );
    });
    
    it("inherits from ol.geom.Geometry", function() {
        expect( ls ).toBeA( ol.geom.Geometry );
    });
    
    it("has a working getter for vertices", function() {
        
        var vertices = ls.getVertices();
        
        expect( vertices ).toBeA( Array );
        expect( vertices.length ).toBe( 4 );
        expect( vertices[0] ).toBeA( ol.geom.Point );
        
        expect( vertices[0].getX() + ',' + vertices[0].getY()).toBe( '0,0' );
        
    });
    
    it("has a working setter for vertices", function() {
        
        ls.setVertices([
            new ol.geom.Point(30,40),
            new ol.geom.Point(50,60)
        ]);
        
        var vertices = ls.getVertices();
        
        expect( vertices.length ).toBe( 2 );
        expect( vertices[0] ).toBeA( ol.geom.Point );
        expect( vertices[1] ).toBeA( ol.geom.Point );
        
        expect( vertices[0].getX() + ',' + vertices[0].getY()).toBe( '30,40' );
        expect( vertices[1].getX() + ',' + vertices[1].getY()).toBe( '50,60' );
        
    });
    
    it("has a method to add vertices", function() {
        
        ls.addVertex(
            new ol.geom.Point(30,40),
            1
        );
        ls.addVertex(
            new ol.geom.Point(50,60),
            2
        );
        ls.addVertex(
            new ol.geom.Point(-10,0),
            0
        );
        
        var vertices = ls.getVertices();
        
        expect( vertices.length ).toBe( 7 );
        expect( vertices[0].getX() + ',' + vertices[0].getY()).toBe( '-10,0' );
        expect( vertices[1].getX() + ',' + vertices[1].getY()).toBe( '0,0' );
        expect( vertices[2].getX() + ',' + vertices[2].getY()).toBe( '30,40' );
        expect( vertices[3].getX() + ',' + vertices[3].getY()).toBe( '50,60' );
        expect( vertices[4].getX() + ',' + vertices[4].getY()).toBe( '10,10' );
        expect( vertices[5].getX() + ',' + vertices[5].getY()).toBe( '10,0' );
        expect( vertices[6].getX() + ',' + vertices[6].getY()).toBe( '20,20' );
        
    });
    
    it("has a method to remove vertices", function() {
        ls.setVertices([
            new ol.geom.Point(0,10),
            new ol.geom.Point(10,20),
            new ol.geom.Point(20,30),
            new ol.geom.Point(30,40)
        ]);
        
        var v = ls.getVertices()[2]; // 20,30;
        
        ls.removeVertex( v );
        
        var vertices = ls.getVertices();
        
        expect( vertices.length ).toBe( 3 );
        expect( vertices[0].getX() + ',' + vertices[0].getY()).toBe( '0,10' );
        expect( vertices[1].getX() + ',' + vertices[1].getY()).toBe( '10,20' );
        expect( vertices[2].getX() + ',' + vertices[2].getY()).toBe( '30,40' );
    });     
});
