console.log("hello world!");

const projection = d3.geo.albersUsa();
const path = d3.geo.path().projection(projection);

const svg = d3.selectAll("path").enter().append();
