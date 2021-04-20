build/cb_2019_us_state_20m.zip:
	mkdir -p $(dir $@)
	curl -o $@ https://www2.census.gov/geo/tiger/GENZ2019/shp/$(notdir $@)

build/cb_2019_us_state_20m.shp: build/cb_2019_us_state_20m.zip
	unzip -od $(dir $@) $<
	touch $@

build/cb_2019_us_state_20m.geojson: build/cb_2019_us_state_20m.shp
	node_modules/.bin/shp2json $< -o $@

build/states.json:  build/cb_2019_us_state_20m.geojson
	node_modules/.bin/geo2topo $< -o $@

all: build/states.json
