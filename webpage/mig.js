const allStates = ['CA', 'NM', 'NC', 'NY', 'MO', 'ID', 'ND', 'AL', 'IN', 'GA', 'KY', 'FL', 'LA',
                  'MD', 'WA', 'ME', 'TX', 'VA', 'WI', 'OK', 'MI', 'OR', 'TN', 'WY', 'AK', 'DE',
                  'MN', 'MS', 'CO', 'PA', 'MA', 'AZ', 'OH', 'NE', 'IL', 'KS', 'WV', 'AR', 'SC',
                  'NJ', 'IA', 'CT', 'UT', 'MT', 'SD', 'NV', 'NH', 'HI', 'VT', 'RI', 'DC'];

window.addEventListener("load", () => {
  updateBarplot();
});

function updateBarplot() {

  let [ margin, width, height, x, y, xAxis, yAxis, svg ] = getInitBarchartSettings();

  function drawPlot() {
    d3.json("data/mig_data.json").then(async function (data) {

      const newData = await updateBarchartData(data);
      [x, y] = updateDomains(newData, x, y);
      
      // add axis
      svg
        .append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "-.55em")
        .attr("transform", "rotate(-90)");

      svg
        .append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 5)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Frequency");

      const bar = svg.selectAll("bar")
                    .data(newData)
                    .enter()
                    .append("rect")
                    .attr("class", "bar")

      // Add bar chart
      bar.attr("height", function (d) {
          return height - y(0);
        })
        .attr("y", function (d) {
          return y(0);
        })
        .transition()
        .duration(400)
        .attr("x", function (d) {
          return x(d.shape);
        })
        .attr("width", x.bandwidth())
        .attr("y", function (d) {
          return y(d.frequency);
        })
        .attr("height", function (d) {
          return height - y(d.frequency);
        })
        .delay((d, i) => i * 100);
    });
  }

  // load the data
  drawPlot();
}

function getInitBarchartSettings() {
  // set the dimensions of the canvas
  const margin = { top: 20, right: 20, bottom: 70, left: 40 },
    width = 450 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  // set the ranges
  var x = d3.scaleBand().rangeRound([0, width]).padding(0.05);
  var y = d3.scaleLinear().range([height, 0]);

  // define the axis
  var xAxis = d3.axisBottom().scale(x);
  var yAxis = d3.axisLeft().scale(y).ticks(10);

  // add the SVG element
  var svg = d3
    .select(".barplotContainer")
    .append("svg")
    .attr("class", 'barplot')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  return [margin, width, height, x, y, xAxis, yAxis, svg];
}

async function getSelectedStates() {
  if (document.getElementById('attr-selection').value === 'US States') {
    return await getSelectedAttrValues(); 
  } else {
    return allStates;
  }
}

async function updateBarchartData(data) {
  let range = await getSelectedDates()
  range = range.slice(1).map(year => parseInt(year));
  const selected_state = await getSelectedStates();

  const low_year = range[0],
  high_year = range[1];
  function isInYearRange(year) {
    return year >= low_year && year <= high_year;
  }

  function isInState(state) {
    return selected_state.includes(state);
  }

  let year_filtered = data.reduce(
    (acc, el) => (isInYearRange(el.year) ? [...acc, ...el.yeardata] : acc),
    []
  );

  console.log('year')
  console.log(year_filtered)

  let state_filtered = year_filtered.reduce(
    (acc, el) => (isInState(el.state) ? [...acc, ...el.statedata] : acc),
    []
  );

  console.log(state_filtered)

  let final_data = state_filtered.reduce(function (acc, el) {
    if (acc[el.shape]) {
      acc[el.shape] += el.frequency;
    } else {
      acc[el.shape] = el.frequency;
    }
    return acc;
  }, []);

  let final_array = [];
  console.log(final_array);
  for (var shape in final_data) {
    final_array.push({ shape: shape, frequency: final_data[shape] });
    console.log(shape);
  }
  //let final_data2 = final_data.reduce((acc, el) => [...acc, {"shape": el}])

  console.log(final_array);

  data = final_array;

  console.log(data);

  data.forEach(function (d) {
    d.shape = d.shape;
    d.frequency = +d.frequency;
  });

  return data;
}

function updateDomains(newData, x, y) {
  // scale the range of the data
  const xScale = x.domain(
    newData.map(function (d) {
      return d.shape;
    })
  );
  const yScale = y.domain([
    0,
    d3.max(newData, function (d) {
      return d.frequency;
    }),
  ]);
  return [xScale, yScale]
}

async function initNewBarchart() {
  d3.select('.barplot').remove();
  updateBarplot();
}

// Changing between attributes
document.getElementById('attr-selection').addEventListener('change', async () => await initNewBarchart());

// Changing between attribute types
document.getElementById('confirm-attr-types').addEventListener('click', async () => await initNewBarchart());
