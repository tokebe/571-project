var width = 960;
var height = 500;

var projection = d3
  .geoAlbersUsa()
  .scale(1300)
  .translate([width / 2, height / 2]);

var path = d3.geoPath().projection(projection);

var svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

var t = d3.transition().on("interrupt", function (d, i) {
  console.info(i);
});

d3.json("data/states.json", function (error, us) {
  if (error) throw error;

  svg
    .append("path")
    .attr("stroke", 0.5)
    .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));
});
