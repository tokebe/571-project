const width = 960;
const height = 500;

const projection = d3
  .geoAlbersUsa()
  .scale(1000)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Set up tooltip
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", "0");

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

function getProjectedCoord(d, i) {
  return projection([d.lng, d.lat])[i];
}

Promise.all([
  d3.json("data/states-10m.json"),
  d3.csv("data/sighting-per-state.csv"),
  d3.json("data/stateCodes.json"),
]).then((data) => {
  function getStateSightings(d, data) {
    const stateCode = stateCodes[d.properties.name];
    // console.log(stateCode);
    const val = stateCode ? data[1].filter((d) => d.State === stateCode) : [];

    return val.length > 0 ? val[0].Sightings : undefined;
  }

  console.log(data);
  const stateCodes = data[2];
  const colorScale = d3
    .scaleSequential()
    .domain(d3.extent(data[1], (d) => parseFloat(d.Sightings)))
    .interpolator(d3.interpolateViridis);

  console.log();
  svg
    .append("g")
    .selectAll("path")
    .data(topojson.feature(data[0], data[0].objects.states).features)
    .enter()
    .append("path")
    .attr("class", "state")
    .attr("d", path)
    .style("fill", (d) => {
      const val = getStateSightings(d, data);
      return val ? colorScale(val) : "grey";
    })
    .on("mouseover", (e, d) => {
      d3.select(e.target)
        .transition()
        .duration(50)
        .style("stroke-width", "3px");
      tooltip.transition().style("opacity", ".9");

      tooltip
        .html(d.properties.name + ",\n" + getStateSightings(d, data))
        .style("left", e.pageX + 5 + "px")
        .style("top", e.pageY - 30 + "px");
    })
    .on("mousemove", function (e, d) {
      tooltip
        .style("left", e.pageX + 10 + "px")
        .style("top", e.pageY - 30 + "px");
    })
    .on("mouseout", function (e, d) {
      d3.select(e.target)
        .transition()
        .duration(300)
        .style("stroke-width", "1px");
      tooltip.transition().style("opacity", "0");
    });
});
