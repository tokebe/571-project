const width = 960;
const height = 500;

stateCodes = {
  Alabama: "AL",
  Alaska: "AK",
  "American Samoa": "AS",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  "District Of Columbia": "DC",
  "Federated States Of Micronesia": "FM",
  Florida: "FL",
  Georgia: "GA",
  Guam: "GU",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  "Marshall Islands": "MH",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  "Northern Mariana Islands": "MP",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Palau: "PW",
  Pennsylvania: "PA",
  "Puerto Rico": "PR",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  "Virgin Islands": "VI",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

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

function getStateSightings(d, data) {
  const stateCode = stateCodes[d.properties.name];
  // console.log(stateCode);
  const val = stateCode ? data[1].filter((d) => d.State === stateCode) : [];

  return val.length > 0 ? val[0].Sightings : undefined;
}

Promise.all([
  d3.json("data/states-10m.json"),
  d3.csv("data/sighting-per-state.csv"),
]).then((data) => {
  console.log(data[1]);
  const colorScale = d3
    .scaleSequential()
    .domain(d3.extent(data[1], (d) => parseFloat(d.Sightings)))
    .interpolator(d3.interpolateViridis);

  console.log();
  // console.log(data);
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
      tooltip.transition().style("opacity", ".9");

      tooltip
        .html(d.properties.name + ",\n" + getStateSightings(d, data))
        .style("left", e.pageX + 5 + "px")
        .style("top", e.pageY - 30 + "px");
    })
    .on("mousemove", function (event, d) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 30 + "px");
    })
    .on("mouseout", function (event, d) {
      tooltip.transition().style("opacity", "0");
    });
});
