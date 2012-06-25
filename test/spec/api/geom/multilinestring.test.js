describe("ol.geom.multilinestring", function() {
    var mls,
        formatPoint = function(p){
            return p.getX() + ',' + p.getY();
        },
        linestringNPointN = function(mls, i, j) {
            return formatPoint(mls.linestrings()[i].vertices()[j]);
        };
    beforeEach(function() {
        mls = ol.geom.multilinestring([
            [
                {x:0, y:0},
                {x:2, y:2}
            ], [
                {x:0, y:2},
                {x:2, y:0}
            ]
        ]);
    });

    afterEach(function() {
        mls = null;
    });
    describe("can construct instances without some lines", function() {
        it("works for the object notation of points", function(){
            expect( mls ).toBeA( ol.geom.MultiLineString );
        });

        it("works for the array notation of points", function(){
            mls = ol.geom.multilinestring([
                [
                    [0, 0],
                    [2, 2]
                ], [
                    [0, 2],
                    [2, 0]
                ]
            ]);

            expect( mls ).toBeA( ol.geom.MultiLineString );
        });

        it("works for real lines", function(){
            mls = ol.geom.multilinestring([
                ol.geom.linestring([
                    ol.geom.point([0, 0]),
                    ol.geom.point([2, 2])
                ]),
                ol.geom.linestring([
                    ol.geom.point([0, 2]),
                    ol.geom.point([2, 0])
                ])
            ]);

            expect( mls ).toBeA( ol.geom.MultiLineString );
        });
    });

    describe("can construct instances without any lines", function() {

        it("works with an empty array", function(){
            mls = ol.geom.multilinestring([]);

            expect( mls ).toBeA( ol.geom.MultiLineString );
        });

        it("works without arguments", function(){
            mls = ol.geom.multilinestring();

            expect( mls ).toBeA( ol.geom.MultiLineString );
        });
    });

    describe("the method 'add'", function() {
        it("exists", function(){
            expect( mls.add ).toBeA( Function );
        });

        describe("can be used as setter", function(){
            it("works with a single line specification and an index", function(){
                var ls = ol.geom.linestring([
                    [5, 7],
                    [5, 10]
                ]);
                mls.add(ls, 0);

                expect(mls.linestrings().length).toBe(3);

                expect( linestringNPointN(mls, 0, 0) ).toBe( '5,7' );
            });

            it("works with a linestring instance", function(){
                mls = ol.geom.multilinestring();
                mls.add(ol.geom.linestring([
                    [-5.2, 7.3],
                    [-5.6, 7.7]
                ]));
                expect(mls.linestrings().length).toBe(1);

                expect( linestringNPointN(mls, 0, 0) ).toBe( '-5.2,7.3' );
            });

            it("the index is functional", function(){
                var l = ol.geom.linestring([
                    [-5.2, 7.3],
                    [-5.6, 7.7]
                ]);
                mls.add(l, 1);

                expect(mls.linestrings().length).toBe(3);

                expect( linestringNPointN(mls, 0, 0) ).toBe( '0,0' );
                expect( linestringNPointN(mls, 1, 0) ).toBe( '-5.2,7.3' );
                expect( linestringNPointN(mls, 2, 0) ).toBe( '0,2' );
            });

            it("the index is optional", function(){
                var l = ol.geom.linestring([
                    [-5.2, 7.3],
                    [-5.6, 7.7]
                ]);
                mls.add(l);

                expect(mls.linestrings().length).toBe(3);

                expect( linestringNPointN(mls, 2, 0) ).toBe( '-5.2,7.3' );
            });

            it("returns the multipoint instance", function(){
                var l = ol.geom.linestring([
                    [-5.2, 7.3],
                    [-5.6, 7.7]
                ]);
                var returned = mls.add(l, 1);

                expect(returned).toBe(mls);
            });
        });
    });

    describe("the method 'addAll'", function(){
        it("exists", function(){
            expect( mls.addAll ).toBeA( Function );
        });

        describe("can be used as setter", function(){

            it("works with an array of point specifications and an index", function(){
                var lines = [
                    ol.geom.linestring([
                        [-5.2, 7.3],
                        [-5.6, 7.7]
                    ]),
                    ol.geom.linestring([
                        [2, 4],
                        [5, 7]
                    ])
                ];
                mls.addAll(lines, 0);

                expect(mls.linestrings().length).toBe(4);

                expect( linestringNPointN(mls, 0, 0) ).toBe( '-5.2,7.3' );
                expect( linestringNPointN(mls, 1, 0) ).toBe( '2,4' );
            });

            it("the index is functional", function(){
                var lines = [
                    ol.geom.linestring([
                        [-5.2, 7.3],
                        [-5.6, 7.7]
                    ]),
                    ol.geom.linestring([
                        [2, 4],
                        [5, 7]
                    ])
                ];
                mls.addAll(lines, 1);

                expect(mls.linestrings().length).toBe(4);

                expect( linestringNPointN(mls, 0, 0) ).toBe( '0,0' );
                expect( linestringNPointN(mls, 1, 0) ).toBe( '-5.2,7.3' );
                expect( linestringNPointN(mls, 2, 0) ).toBe( '2,4' );
                expect( linestringNPointN(mls, 3, 0) ).toBe( '0,2' );
            });

            it("the index is optional", function(){
                var lines = [
                    ol.geom.linestring([
                        [-5.2, 7.3],
                        [-5.6, 7.7]
                    ]),
                    ol.geom.linestring([
                        [2, 4],
                        [5, 7]
                    ])
                ];
                mls.addAll(lines);

                expect(mls.linestrings().length).toBe(4);

                expect( linestringNPointN(mls, 2, 0) ).toBe( '-5.2,7.3' );
                expect( linestringNPointN(mls, 3, 0) ).toBe( '2,4' );
            });

            it("returns the multipoint instance", function(){
                var lines = [
                    ol.geom.linestring([
                        [-5.2, 7.3],
                        [-5.6, 7.7]
                    ]),
                    ol.geom.linestring([
                        [2, 4],
                        [5, 7]
                    ])
                ];
                var returned = mls.addAll(lines, 0);

                expect(returned).toBe(mls);
            });
        });
    });

    describe("the method 'remove'", function() {
        it("exists", function(){
            expect( mls.remove ).toBeA( Function );
        });

        it("works with a single line", function(){
            var l = mls.linestrings()[0];
            mls.remove(l);
            expect(mls.linestrings().length).toBe(1);

            expect( linestringNPointN(mls, 0, 0) ).toBe( '0,2' );
        });

        it("works with an array of linestrings", function(){
            var lines = [
                mls.linestrings()[0],
                mls.linestrings()[1]
            ];
            mls.remove(lines);
            expect(mls.linestrings().length).toBe(0);
        });
    });

    describe("the centroid method is functional", function(){
        it("returns an instance of ol.geom.Point", function(){
            expect(mls.centroid()).toBeA(ol.geom.Point);
        });

        it("has the expected coordinates", function(){
            mls = ol.geom.multilinestring([
                ol.geom.linestring([
                    ol.geom.point([2, 1]),
                    ol.geom.point([2, 3])
                ]),
                ol.geom.linestring([
                    ol.geom.point([1, 2]),
                    ol.geom.point([3, 2])
                ])
            ]);
            var c = mls.centroid();
            expect( formatPoint(c) ).toBe('2,2');
        });
    });
});
