all: build/stations.js build/london/system.json build/north-arrow.js

build/stations.js: coffee/*.coffee
	mkdir -p build/
	coffee --join build/stations.js --compile coffee/

build/london/system.json: ../assets/london/*/*.js ../assets/london/*/*.yaml ../assets/london/system.yaml
	mkdir -p build/london
	python compile-assets.py ../assets/london build/london

build/north-arrow.js: ../assets/north-arrow.js
	cp ../assets/north-arrow.js build/north-arrow.js
