PLOVR_JAR=bin/plovr-4b3caf2b7d84.jar
SRC = $(shell find externs src/ol -name \*.js)
comma := ,
empty :=
space := $(empty) $(empty)

.PHONY: all
all: build webgl-debug.js

.PHONY: build
build: ol-api.js ol-skeleton.js

ol-api.js: $(PLOVR_JAR) $(SRC) ol-base.json ol-api.json ol.js
	java -jar $(PLOVR_JAR) build $(basename $@).json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

ol-skeleton.js: $(PLOVR_JAR) $(SRC) ol-base.json ol-skeleton.json skeleton.js
	java -jar $(PLOVR_JAR) build $(basename $@).json >$@
	@echo $@ "uncompressed:" $$(wc -c <$@) bytes
	@echo $@ "  compressed:" $$(gzip -9 -c <$@ | wc -c) bytes

.PHONY: serve
serve: $(PLOVR_JAR)
	java -jar $(PLOVR_JAR) serve ol-api.json ol-skeleton.json

ol.js: $(SRC)
	( find src/ol -name \*.js | xargs grep -rh ^goog.provide | sort | uniq | sed -e 's/provide/require/g' ) > $@

.PHONY: lint
lint:
	gjslint --strict --limited_doc_files=$(subst $(space),$(comma),$(shell find externs -name \*.js)) $(SRC) skeleton.js

webgl-debug.js:
	curl https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/sdk/debug/webgl-debug.js > $@

$(PLOVR_JAR):
	curl http://plovr.googlecode.com/files/$(notdir $@) > $@

clean:
	rm -f ol.js
	rm -f ol-api.js
	rm -f ol-skeleton.js

reallyclean: clean
	rm -f $(PLOVR_JAR)
	rm -f webgl-debug.js
