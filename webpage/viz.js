const width = 960;
const height = 500;

const projection = d3
  .geoAlbersUsa()
  .scale(1000)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Set up tooltip
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", "0%");

// state info
const stateInfo = d3
  .select("body")
  .append("div")
  .attr("class", "stateInfo")
  .style("opacity", "0%");

function getProjectedCoord(d, i) {
  return projection([d.lng, d.lat])[i];
}

// toTitleCase(str: str): str
// make str Title Case
function toTitleCase(str) {
  return str
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(" ");
}

// add function to string prototype
String.prototype.toTitleCase = function (str) {
  return toTitleCase(this);
};

function cityMouseOverFunc(e, d, data) {
  const stateData = data.stateData;
  const cityData = data.cityData;

  stateInfo.transition().style("opacity", "100%");
  stateInfo.html(
    d.state.toTitleCase() +
      ": " +
      "</br>" +
      "State Total Sightings: " +
      stateData[d.state].freq +
      "</br>" +
      "State Avg. Duration: " +
      humanizeDuration(stateData[d.state].mean_dur * 1000, {
        maxDecimalPoints: 1,
        largest: 1,
      })
  );
  d3.select(e.target).transition().duration(50).style("stroke-width", "1px");
  tooltip.transition().style("opacity", ".9");

  const plural = d.freq > 1 ? "s" : "";

  tooltip
    .html(
      d.city.toTitleCase() +
        ", " +
        d.state.toTitleCase() +
        "</br>" +
        d.freq +
        " Sighting" +
        plural +
        +"</br>" + // make this only if duration known
        "Avg. Sighting Duration: " +
        humanizeDuration(d.mean_dur * 1000, {
          maxDecimalPoints: 1,
          largest: 1,
        })
    )
    .style("left", e.pageX + 5 + "px")
    .style("top", e.pageY - 30 + "px");
}

function cityMouseOutFunc(e, d) {
  d3.select(e.target).transition().duration(300).style("stroke-width", "0px");
  tooltip.transition().style("opacity", "0");
}

function getDataInRange(data, range) {
  const cityData = [];
  for (const state in data[2]) {
    const stateObj = data[2][state];
    for (const city in stateObj) {
      const cityObj = stateObj[city];
      let freq = 0,
        mean_dur = 0,
        count = 0;
      for (let year of cityObj) {
        if (year.year >= range[0] && year.year <= range[1]) {
          freq += year.freq;
          mean_dur += year.mean_dur === "NA" ? 0 : year.mean_dur;
          count += year.mean_dur === "NA" ? 0 : 1;
        }
      }
      // if (typeof mean_dur !== "number") {
      //   console.log(
      //     "non-number dur '" + mean_dur + "' in " + city + ", " + state
      //   );
      // }
      mean_dur /= count ? count : 1;
      if (freq > 0) {
        cityData.push({
          state: state,
          city: city,
          lat: cityObj[0].lat,
          lng: cityObj[0].lng,
          state_code: cityObj[0].state_code,
          freq: freq,
          mean_dur: mean_dur,
        });
      }
    }
  }

  const stateData = {};
  for (const state in data[3]) {
    const stateObj = data[3][state];
    let freq = 0,
      mean_dur = 0,
      count = 0;
    for (const year of stateObj) {
      if (year.year >= range[0] && year.year <= range[1]) {
        freq += year.freq;
        mean_dur += year.mean_dur === "NA" ? 0 : year.mean_dur;
        count += year.mean_dur === "NA" ? 0 : 1;
      }
    }
    mean_dur /= count ? count : 1;
    stateData[state] = {
      state: state,
      state_code: stateObj[0].state_code,
      freq: freq,
      mean_dur: mean_dur,
    };
  }

  return { stateData: stateData, cityData: cityData };
}

function makeMap(stateShapes, data) {
  const stateData = data.stateData;
  const cityData = data.cityData;

  const logScale = d3
    .scaleLog()
    .domain(d3.extent(cityData, (d) => parseFloat(d.freq)));
  const colorScale = d3
    .scaleSequential()
    // .domain(d3.extent(data[2], (d) => parseFloat(d.freq)))
    .interpolator((d) => d3.interpolateViridis(logScale(d)));

  svg.selectAll("g").remove();

  svg
    .append("g")
    .selectAll("path")
    .data(topojson.feature(stateShapes, stateShapes.objects.states).features)
    .enter()
    .append("path")
    .attr("class", "state")
    .attr("d", path)
    .style("fill", "#444")
    .on("mouseover", (e, d) => {
      stateInfo.transition().style("opacity", "100%");
      stateInfo.html(
        d.properties.name.toLowerCase().toTitleCase() +
          ": " +
          "</br>" +
          "State Total Sightings: " +
          stateData[d.properties.name.toLowerCase()].freq +
          "</br>" +
          "State Avg. Duration: " +
          humanizeDuration(
            stateData[d.properties.name.toLowerCase()].mean_dur * 1000,
            {
              maxDecimalPoints: 1,
              largest: 1,
            }
          )
      );
    });

  svg
    .selectAll("circle")
    .data(cityData)
    .enter()
    .append("circle")
    .sort((a, b) => a.freq - b.freq)
    .attr("cx", (d) => getProjectedCoord(d, 0))
    .attr("cy", (d) => getProjectedCoord(d, 1))
    .attr("r", "3px")
    .attr("class", "cityDot")
    .style("stroke-width", "0px")
    .style("fill", (d) => {
      const val = colorScale(d.freq);
      return val ? val : "grey";
    })
    .on("mouseover", (e, d) => {
      cityMouseOverFunc(e, d, data);
    })
    .on("mouseout", function (e, d) {
      cityMouseOutFunc(e, d);
    });
}

function updateMap(data) {
  const stateData = data.stateData;
  const cityData = data.cityData;

  const logScale = d3
    .scaleLog()
    .domain(d3.extent(cityData, (d) => parseFloat(d.freq)));
  const colorScale = d3
    .scaleSequential()
    // .domain(d3.extent(data[2], (d) => parseFloat(d.freq)))
    .interpolator((d) => d3.interpolateViridis(logScale(d)));

  const points = svg.selectAll("circle").data(cityData);

  // update existing points
  points
    .sort((a, b) => a.freq - b.freq)
    .transition()
    .attr("cx", (d) => getProjectedCoord(d, 0))
    .attr("cy", (d) => getProjectedCoord(d, 1))
    .attr("class", "cityDot")
    .style("stroke-width", "0px")
    .style("fill", (d) => {
      const val = colorScale(d.freq);
      return val ? val : "grey";
    });

  // add any new points
  points
    .enter()
    .append("circle")
    .sort((a, b) => a.freq - b.freq)
    .attr("cx", (d) => getProjectedCoord(d, 0))
    .attr("cy", (d) => getProjectedCoord(d, 1))
    .attr("r", "3px")
    .attr("class", "cityDot")
    .style("stroke-width", "0px")
    .style("fill", (d) => {
      const val = colorScale(d.freq);
      return val ? val : "grey";
    })
    .on("mouseover", (e, d) => {
      cityMouseOverFunc(e, d, data);
    })
    .on("mouseout", function (e, d) {
      cityMouseOutFunc(e, d);
    });

  // remove unused points
  points.exit().remove();
}

Promise.all([
  d3.json("data/states-10m.json"),
  d3.json("data/stateCodes.json"),
  d3.json("data/ufo_us_by_city_year.json"),
  d3.json("data/ufo_us_by_state_year.json"),
  d3.csv("data/ufo_us_by_city_year.csv"),
]).then((data) => {
  console.log(data);
  makeMap(data[0], getDataInRange(data, [2000, 2021]));

  const sliderRange = d3
    .sliderBottom()
    .min(d3.min(data[4], (d) => d.year))
    .max(d3.max(data[4], (d) => d.year))
    .width(width * 0.8)
    .tickFormat(d3.format(""))
    .ticks(10)
    .step(1)
    .default([2000, 2021])
    .fill("#2196f3")
    .on("end", (val) => {
      val = val.map((d) => parseInt(d));
      console.log(val); // TODO call drawMap with new range
      updateMap(getDataInRange(data, val));
    });

  var gRange = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(30,30)")
    .attr("class", "yearSlider");

  gRange.call(sliderRange);
  // TODO implement year selection
  // TODO implement color switch between count and duration
});
