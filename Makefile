all:
	java -jar plovr.jar serve main.json
build:
	java -jar plovr.jar build main.json > index.js
