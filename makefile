build\cb_2019_us_state_20m.zip:
	mkdir -p $(dir $@)
	curl -o $@ https://www2.census.gov/geo/tiger/GENZ2019/shp/$(notdir $@)

build\cb_2019_us_state_20m.shp: build\cb_2019_us_state_20m.zip
	unzip -od $(dir $@) $<
	touch $@

build\states.json:  build\cb_2019_us_state_20m.shp
	npx topojson \
		-o $@ \
		--projection='width = 960, height = 960, d3.geo.albersUsa().scale(1280).translate([width / 2, height / 2])' \
		--simplify=.5 \
		--states=$<
