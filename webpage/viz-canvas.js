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

const canvas = d3
  .select("body")
  .append("canvas")
  .attr("width", width)
  .attr("height", height);

const ctx = canvas.node().getContext("2d");

const pathGen = d3.geoPath(projection, ctx);

function getProjectedCoord(d, i) {
  return projection([d.lng, d.lat])[i];
}

Promise.all([
  d3.json("data/states-10m.json"),
  d3.csv("data/sighting-per-state.csv"),
  d3.json("data/stateCodes.json"),
  d3.csv("data/sighting-duration-location.csv"),
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

  pathGen(topojson.feature(data[0], data[0].objects.states));

  // clear context
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();

  // // create state shapes
  // ctx.fillStyle = "#222";
  // ctx.fill();

  // // state shape outlines
  // ctx.strokeStyle = "#999";
  // ctx.stroke();

  // add points
  // TODO fix lag
  data[3].forEach((d) => {
    ctx.fillStyle = "steelblue";
    ctx.arc(
      getProjectedCoord(d, 0),
      getProjectedCoord(d, 1),
      3,
      0,
      2 * Math.PI
    );
    ctx.fill();
  });
});
