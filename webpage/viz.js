var width = 960;
var height = 500;

var projection = d3
  .geoAlbersUsa()
  .scale(1000)
  .translate([width / 2, height / 2]);

var path = d3.geoPath().projection(projection);

var svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

function handleData(jsonData) {
  console.log(jsonData);
}

Promise.all([
  d3.json("data/states-10m.json", handleData),
  d3.csv("data/sighting-duration-location.csv"),
]).then((data) => {
  console.log(data);

  svg
    .append("g")
    .selectAll("path")
    .data(topojson.feature(data[0], data[0].objects.states).features)
    .enter()
    .append("path")
    .attr("class", "state")
    .attr("d", path);

  // svg
  //   .selectAll("circle")
  //   .data(data[1])
  //   .enter()
  //   .append("circle")
  //   .attr("cx", (d) => projection(d))
  //   .attr("cy", (d) => projection(d));
  // .on("mouseover", (event, d) => console.log(d));
});
