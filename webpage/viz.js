const width = 660;
const height = 400;

const projection = d3
  .geoAlbersUsa()
  .scale(800)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const svg = d3
  .select(".mapContainer")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const colorScaleLegend = d3
  .select(".mapContainer")
  .append("svg")
  .attr("class", "colorScaleLegend")
  .attr("width", 50)
  .attr("height", height);

// Set up tooltip
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", "0%");

// state info
const stateInfo = d3
  .select(".mapContainer")
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
        "</br>" + // make this only if duration known
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
  for (const state in data[1]) {
    const stateObj = data[1][state];
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
  for (const state in data[2]) {
    const stateObj = data[2][state];
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

  return {
    stateData: stateData,
    cityData: cityData,
    freqExtent: d3.extent(data[3], (d) => {
      return parseFloat(d.freq);
    }),
    durExtent: d3.extent(data[3], (d) => {
      return parseFloat(d.mean_dur);
    }),
  };
}

function makeMap(stateShapes, data) {
  const stateData = data.stateData;
  const cityData = data.cityData;

  const extent = d3.extent(cityData, (d) => parseFloat(d.freq));

  const logScale = d3.scaleLog().domain(extent);
  const colorScale = d3
    .scaleSequential()
    // .domain(d3.extent(data[1], (d) => parseFloat(d.freq)))
    .interpolator((d) => d3.interpolateViridis(logScale(d)));

  svg.selectAll("g").remove();

  // TODO scale bar https://blog.scottlogic.com/2019/03/13/how-to-create-a-continuous-colour-range-legend-using-d3-and-d3fc.html

  // const expandedDomain = d3.range(
  //   extent[0],
  //   extent[1],
  //   (extent[1] - extent[0]) / height
  // );

  // // Defining the legend bar
  // const svgBar = fc
  //   .autoBandwidth(fc.seriesSvgBar())
  //   // .xScale(xScale)
  //   .yScale(logScale)
  //   .crossValue(0)
  //   .baseValue((_, i) => (i > 0 ? expandedDomain[i - 1] : 0))
  //   .mainValue((d) => d)
  //   .decorate((selection) => {
  //     selection.selectAll("path").style("fill", (d) => colourScale(d));
  //   });

  // // Drawing the legend bar
  // const legendSvg = container.append("svg");
  // const legendBar = legendSvg.append("g").datum(expandedDomain).call(svgBar);

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

function updateMap(data, color, relColor) {
  const stateData = data.stateData;
  const cityData = data.cityData;
  const freqExtent = data.freqExtent;
  const durExtent = data.durExtent;

  const logScale = d3.scaleSymlog().domain(
    relColor
      ? color === "freq"
        ? freqExtent
        : durExtent
      : d3.extent(cityData, (d) => {
          return parseFloat(color === "freq" ? d.freq : d.mean_dur);
        })
  );
  const colorScale = d3
    .scaleSequential()
    .interpolator((d) => d3.interpolateViridis(logScale(d)));

  const points = svg.selectAll("circle").data(cityData);

  // update existing points
  points
    .sort((a, b) =>
      color === "freq" ? a.freq - b.freq : a.mean_dur - b.mean_dur
    )
    .attr("cx", (d) => getProjectedCoord(d, 0))
    .attr("cy", (d) => getProjectedCoord(d, 1))
    .attr("class", "cityDot")
    .style("stroke-width", "0px")
    // .transition()
    .style("fill", (d) => {
      const val = colorScale(
        parseFloat(color === "freq" ? d.freq : d.mean_dur)
      );
      return val ? val : "grey";
    });

  // add any new points
  points
    .enter()
    .append("circle")
    .sort((a, b) =>
      color === "freq" ? a.freq - b.freq : a.mean_dur - b.mean_dur
    )
    .attr("cx", (d) => getProjectedCoord(d, 0))
    .attr("cy", (d) => getProjectedCoord(d, 1))
    .attr("r", "3px")
    .attr("class", "cityDot")
    .style("stroke-width", "0px")
    .style("fill", (d) => {
      const val = colorScale(
        parseFloat(color === "freq" ? d.freq : d.mean_dur)
      );
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
  d3.json("data/ufo_us_by_city_year.json"),
  d3.json("data/ufo_us_by_state_year.json"),
  d3.csv("data/ufo_us_by_city_year.csv"),
]).then(async (data) => {
  console.log(data);
  let savedData = getDataInRange(data, [2000, 2021]);
  makeMap(data[0], savedData);

  let color = "freq",
    range = [2000, 2021],
    relColor = false;

  let prevArea = await updateHistoricalPlot(); // Needed as a basis for transitions (based on previous area plots)

  // time slider
  const sliderTime = d3
    .sliderBottom()
    .min(d3.min(data[3], (d) => d.year))
    .max(d3.max(data[3], (d) => d.year))
    .width((width / 2) * 0.8)
    .step(1)
    .tickFormat(d3.format(""))
    .ticks(10)
    .default(2021)
    .on("onchange", async (val) => {
      val = [parseInt(val), parseInt(val)];
      if (range[0] !== val[0] || range[1] !== val[1]) {
        range = val;
        savedData = getDataInRange(data, range);
      }
      updateMap(savedData, color, relColor);

      // Historical data update
      prevArea = await updateHistoricalPlot(prevArea);
    })

  const gTime = d3
    .select(".yearSliderBox")
    .attr("class", "yearSlider hidden")
    .append("svg")
    .attr("width", width / 2)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(30,30)");

  gTime.call(sliderTime);

  // time range
  const sliderRange = d3
    .sliderBottom()
    .min(d3.min(data[3], (d) => d.year))
    .max(d3.max(data[3], (d) => d.year))
    .width((width / 2) * 0.8)
    .tickFormat(d3.format(""))
    .ticks(10)
    .step(1)
    .default([2000, 2021])
    .fill("#2196f3")
    .on("end", async (val) => {
      val = val.map((d) => parseInt(d));
      if (range[0] !== val[0] || range[1] !== val[1]) {
        range = val;
        savedData = getDataInRange(data, range);
      }
      updateMap(savedData, color, relColor);

      // Historical data update
      prevArea = await updateHistoricalPlot(prevArea);
    })

  const gRange = d3
    .select(".yearRangeSliderBox")
    .append("svg")
    .attr("width", width / 2)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(30,30)")
    .attr("class", "yearRangeSlider");

  gRange.call(sliderRange);
  // TODO implement color switch between count and duration

  document.getElementById("useRange").addEventListener("change", () => {
    // toggle which slider is shown
    document.getElementById("yearSliderBox").classList.toggle("hidden");
    document.getElementById("yearRangeSliderBox").classList.toggle("hidden");
    // update map to reflect newly shown slider
    range = document
      .getElementById("yearSliderBox")
      .classList.contains("hidden")
      ? sliderRange.value().map((d) => parseInt(d))
      : [parseInt(sliderTime.value()), parseInt(sliderTime.value())];
    console.log(range);
    savedData = getDataInRange(data, range);
    updateMap(savedData, color, relColor);
  });

  document.getElementById("relColor").addEventListener("change", () => {
    relColor = document.getElementById("relColor").checked;
    updateMap(savedData, color, relColor);
  });

  function colorDisplayChanged(event) {
    color = document.getElementById("showFreq").checked ? "freq" : "dur";
    console.log(color);
    savedData = getDataInRange(data, range);
    updateMap(savedData, color, relColor);
  }

  document
    .getElementById("showFreq")
    .addEventListener("change", colorDisplayChanged);

  document
    .getElementById("showDur")
    .addEventListener("change", colorDisplayChanged);
});

document.getElementById("useRange").checked = true;
document.getElementById("relColor").checked = false;
document.getElementById("showFreq").checked = true;
document.getElementById("showDur").checked = false;