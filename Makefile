all:
	java -jar plovr.jar serve main.json
build:
	java -jar plovr.jar build main.json > index.js
jsdoc:
	java -jar plovr.jar jsdoc main.json

.PHONY: build
.PHONY: jsdoc
