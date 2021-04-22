build/states-10m.json:
	mkdir -p $(dir $@)
	curl -o $@ https://www2.census.gov/geo/tiger/GENZ2019/shp/$(notdir $@)


all: build/states-10m.json
