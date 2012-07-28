PLOVR_JAR=bin/plovr-4b3caf2b7d84.jar
SRC = $(filter-out $(TARGETS),$(shell find externs src/ol -name \*.js))
TARGETS = src/ol/ol.js
comma := ,
empty :=
space := $(empty) $(empty)

.PHONY: all
all: build webgl-debug.js

.PHONY: build
build: ol.js ol-skeleton.js ol-skeleton-debug.js ol-skeleton-dom.js ol-skeleton-webgl.js

ol.js: $(PLOVR_JAR) $(SRC) src/ol/ol.js
	java -jar $(PLOVR_JAR) build $(basename $@).json >$@
	@echo $@ "uncompressed:" $(shell wc -c <$@) bytes
	@echo $@ "  compressed:" $(shell gzip -9 -c <$@ | wc -c) bytes

ol-skeleton.js: $(PLOVR_JAR) $(SRC) skeleton.js
	java -jar $(PLOVR_JAR) build $(basename $@).json >$@
	@echo $@ "uncompressed:" $(shell wc -c <$@) bytes
	@echo $@ "  compressed:" $(shell gzip -9 -c <$@ | wc -c) bytes

ol-skeleton-debug.js: $(PLOVR_JAR) $(SRC) skeleton.js
	java -jar $(PLOVR_JAR) build $(basename $@).json >$@
	@echo $@ "uncompressed:" $(shell wc -c <$@) bytes
	@echo $@ "  compressed:" $(shell gzip -9 -c <$@ | wc -c) bytes

ol-skeleton-dom.js: $(PLOVR_JAR) $(SRC) skeleton.js
	java -jar $(PLOVR_JAR) build $(basename $@).json >$@
	@echo $@ "uncompressed:" $(shell wc -c <$@) bytes
	@echo $@ "  compressed:" $(shell gzip -9 -c <$@ | wc -c) bytes

ol-skeleton-webgl.js: $(PLOVR_JAR) $(SRC) skeleton.js
	java -jar $(PLOVR_JAR) build $(basename $@).json >$@
	@echo $@ "uncompressed:" $(shell wc -c <$@) bytes
	@echo $@ "  compressed:" $(shell gzip -9 -c <$@ | wc -c) bytes

.PHONY: serve
serve: $(PLOVR_JAR)
	java -jar $(PLOVR_JAR) serve *.json

src/ol/ol.js: $(SRC)
	echo "goog.provide('ol');" >$@
	echo >>$@
	find src/ol -name \*.js | grep -v src/ol/ol.js | xargs grep -rh ^goog.provide | sort | uniq | sed -e 's/provide/require/g' >>$@

.PHONY: lint
lint:
	gjslint --strict --limited_doc_files=$(subst $(space),$(comma),$(shell find externs -name \*.js)) $(SRC) skeleton.js

webgl-debug.js:
	curl https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/sdk/debug/webgl-debug.js > $@

$(PLOVR_JAR):
	curl http://plovr.googlecode.com/files/$(notdir $@) > $@

clean:
	rm -f src/ol/ol.js
	rm -f ol-skeleton.js
	rm -f ol-skeleton-debug.js
	rm -f ol-skeleton-dom.js
	rm -f ol-skeleton-webgl.js

reallyclean: clean
	rm -f $(PLOVR_JAR)
	rm -f webgl-debug.js
