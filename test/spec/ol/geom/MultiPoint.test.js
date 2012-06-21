describe("ol.geom.MultiPoint", function() {
    var mp;
    
    beforeEach(function(){
        mp = new ol.geom.MultiPoint([
            new ol.geom.Point(10,20)
        ]);
    });
    
    afterEach(function(){
        mp = null;
    });
    
    it("constructs instances", function() {
        expect( mp ).toBeA( ol.geom.MultiPoint );
    });
    
    it("can construct instances without any points", function() {
        // empty array
        mp = new ol.geom.MultiPoint([]);
        expect( mp ).toBeA( ol.geom.MultiPoint );
        
        // no argument at all
        mp = new ol.geom.MultiPoint();
        expect( mp ).toBeA( ol.geom.MultiPoint );
    });
    
    it("cannot be constructed with component-types other than 'ol.geom.Point'", function() {
        expect(function(){
            mp = new ol.geom.MultiPoint([
                new ol.geom.LineString()
            ]);
        }).toThrow();
    });
    
    it("inherits from ol.geom.Geometry", function() {
        expect( mp ).toBeA( ol.geom.Geometry );
    });
    
    it("has a working getter for points", function() {
        
        var points = mp.getPoints();
        
        expect( points ).toBeA( Array );
        expect( points.length ).toBe( 1 );
        expect( points[0] ).toBeA( ol.geom.Point );
        
        expect( points[0].getX() + ',' + points[0].getY()).toBe( '10,20' );
        
    });
    
    it("has a working setter for points", function() {
        
        mp.setPoints([
            new ol.geom.Point(30,40),
            new ol.geom.Point(50,60)
        ]);
        
        var points = mp.getPoints();
        
        expect( points.length ).toBe( 2 );
        expect( points[0] ).toBeA( ol.geom.Point );
        expect( points[1] ).toBeA( ol.geom.Point );
        
        expect( points[0].getX() + ',' + points[0].getY()).toBe( '30,40' );
        expect( points[1].getX() + ',' + points[1].getY()).toBe( '50,60' );
        
    });
    
    it("has a method to add points", function() {
        
        mp.addPoint(
            new ol.geom.Point(30,40),
            1
        );
        mp.addPoint(
            new ol.geom.Point(50,60),
            2
        );
        mp.addPoint(
            new ol.geom.Point(-10,0),
            0
        );
        
        var points = mp.getPoints();
        
        expect( points.length ).toBe( 4 );
        expect( points[0].getX() + ',' + points[0].getY()).toBe( '-10,0' );
        expect( points[1].getX() + ',' + points[1].getY()).toBe( '10,20' );
        expect( points[2].getX() + ',' + points[2].getY()).toBe( '30,40' );
        expect( points[3].getX() + ',' + points[3].getY()).toBe( '50,60' );
        
    });
    
    it("can only add ol.geom.Point as components", function() {
        expect(function(){
            mp.addComponent(
                new ol.geom.LineString([
                    new ol.geom.Point(30,40),
                    new ol.geom.Point(50,60)
                ])
            );
        }).toThrow();
    });
    
    it("has a method to remove points", function() {
        mp.setPoints([
            new ol.geom.Point(0,10),
            new ol.geom.Point(10,20),
            new ol.geom.Point(20,30),
            new ol.geom.Point(30,40)
        ]);
        
        var p = mp.getPoints()[2]; // 20,30;
        
        mp.removePoint( p );
        
        var points = mp.getPoints();
        
        expect( points.length ).toBe( 3 );
        expect( points[0].getX() + ',' + points[0].getY()).toBe( '0,10' );
        expect( points[1].getX() + ',' + points[1].getY()).toBe( '10,20' );
        expect( points[2].getX() + ',' + points[2].getY()).toBe( '30,40' );
    });     
});
