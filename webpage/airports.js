function updateAirports(byState = true, showPoints = false) {
    
    const [margin, width, height, svg, tooltip] = initialAirportSetup();

    // Plot by state
    if (byState) {
        d3.csv('data/airports-and-sightings-state.csv')
        .then((data) => {
            
            // Add X axis
            const xScale = d3.scaleLinear()
                .domain([0, d3.max(data, d => parseInt(d.Sightings))])
                .range([0, width])
                .nice();

            // Add Y axis
            const yScale = d3.scaleLinear()
                .domain([0, d3.max(data, d => parseInt(d['Airport Count']))])
                .range([height, 0])
                .nice();

            // labels
            svg.append('text')
                .attr('text-anchor', 'end')
                .attr('x', width)
                .attr('y', height + (margin.bottom - 10))
                .text('Number of Sightings');
        
            svg.append('text')
                .attr('text-anchor', 'end')
                .attr('x', -40)
                .attr('y', -20)
                .text('Number of Airports by State')
                .attr('text-anchor', 'start')
            
            svg.append("g")
                .call(d3.axisLeft(yScale));

            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale));

            const colorScale = d3.scaleSequential()
                .interpolator(d3.interpolateInferno)
                .domain([0, d3.max(data, d => parseInt(d.Sightings))])
            
            // Add dots
            const dots = svg.append('g')
                            .selectAll("dot")
                            .data(data)
                            .enter()
                            .append("circle")
                            .attr("height", d => height - yScale(0))
                            .attr("cy", d => yScale(0))
                            
            dots.transition()
                .duration(700)
                .attr("cx", d => xScale(d.Sightings))
                .attr("cy", d => yScale(d['Airport Count']))
                .attr("r", 3.5)
                .style("fill", d => colorScale(+d.Sightings))
                .style("opacity", "0.7")
                .style('stroke-width', "0.7")
                .attr("stroke", "black")
        
            dots.on('mouseover', (event, d) => tooltip.style('opacity', 1))
                .on('mousemove', (event, d) => {
                    tooltip.html('State: ' + d.State + '<br>' + 
                                    'Sightings: ' + d.Sightings + '<br>' +
                                    'Airports: ' + d['Airport Count'] + '<br>')
                        .style("left", (event.x - 900) + "px")
                        .style("top", (event.y) + "px")
                })
                .on('mouseleave', (event, d) => {
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 0)
                })
        });
    // Plot by city
    } else {
        d3.csv('data/airports-and-sightings-city.csv')
        .then((data) => {
        
            const groupedData = d3.groups(data, d => d['Airport Count']);
            const boxData = groupedData.map(count => {

                const sightingsByAirport = count[1].map(place => +place.Sightings)
                                                .sort(d3.ascending);
                
                const q1 = d3.quantile(sightingsByAirport, 0.25);
                const median = d3.quantile(sightingsByAirport, 0.5);
                const q3 = d3.quantile(sightingsByAirport, 0.75);

                const IQR = q3 - q1;
                const min = q1 - (1.5 * IQR);
                const max = q3 + (1.5 * IQR);

                return { key: count[0], q1: q1, median: median, q3: q3, IQR: IQR, min: min, max: max };
            });
            
            const xScale = d3.scaleLinear()
                            .domain(d3.extent(data, d => +d.Sightings))
                            .range([0, width])
                            .nice();

            const yScale = d3.scaleBand()
                            .domain(d3.range(0, 7, 1))
                            .range([height, 0])
                            .padding(0.4);

            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale).ticks(5))
            
            svg.append("g")
                .call(d3.axisLeft(yScale).tickSize(0))
                .select(".domain").remove() // Remove y axis line

            // labels
            svg.append('text')
                .attr('text-anchor', 'end')
                .attr('x', width)
                .attr('y', height + (margin.bottom - 10))
                .text('Number of Sightings');

            svg.append('text')
                .attr('text-anchor', 'end')
                .attr('x', -40)
                .attr('y', -20)
                .text('Number of Airports by City')
                .attr('text-anchor', 'start')

            const colorScale = d3.scaleSequential()
                            .interpolator(d3.interpolateInferno)
                            .domain(d3.extent(data, d => +d.Sightings))

            svg.selectAll("vertLines")
                .data(boxData)
                .enter()
                .append("line")
                .attr("x1", d => xScale(d.min))
                .attr("x2", d => xScale(d.max))
                .attr("y1", d => yScale(d.key) + yScale.bandwidth() / 2)
                .attr("y2", d => yScale(d.key) + yScale.bandwidth() / 2)
                .attr("stroke", "grey")
                .style("width", 40)
                .style('opacity', 0.8)

            svg.selectAll("boxes")
                .data(boxData)
                .enter()
                .append("rect")
                .attr("x", d => xScale(d.q1)) 
                .attr("width", d => xScale(d.q3) - xScale(d.q1))
                .attr("y", d => yScale(d.key))
                .attr("height", yScale.bandwidth())
                .attr("stroke", "black")
                .style("fill", "#69b3a2")
                .style("opacity", 0.7)
            
            svg.selectAll("medianLines")
                .data(boxData)
                .enter()
                .append("line")
                .attr("y1", d => yScale(d.key))
                .attr("y2", d => yScale(d.key) + yScale.bandwidth()/2)
                .attr("x1", d => xScale(d.median))
                .attr("x2", d => xScale(d.median))
                .attr("stroke", "black")
                .style("width", 80)

            if (showPoints) {
                const jitterWidth = 50
                const dots = svg.selectAll("indPoints")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr('id', 'jitterPoints')
                    .attr("cx", d => xScale(+d.Sightings))
                    .attr("cy", d => yScale(+d['Airport Count']) + (yScale.bandwidth() / 2) - 
                        jitterWidth / 2 + Math.random() * jitterWidth) // Add jitter (randomize points by airport count)
                    .attr("r", 4)
                
                dots.style("fill", d => colorScale(+d.Sightings))
                    .style('opacity', 0.5)
            }
        });
    }
}

function initialAirportSetup() {
    const margin = { 
        top: 50, 
        right: 50, 
        bottom: 50, 
        left: 50
    },
    width = 350,
    height = 300;

    const svg = d3.select("#historicalAndAirportContainer")
                .append("svg")
                .attr('id', 'routes-plot')
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")")
                .attr('id', 'routes-plot-group');

    const tooltip = d3.select('#historicalAndAirportContainer')
                        .append('div')
                        .attr('class', 'tooltip')
                        .style('opacity', 0);

    return [margin, width, height, svg, tooltip];
}

function airportSelected() {
    const attr = document.getElementById('attr-selection').value;

    if (attr === 'US Airports') {
        return true;
    } else {
        alert('US Airports must be choosen as an attribute.');
        return false;
    }
}

async function addIndividualPoints() {
    const svg = d3.select('#routes-plot-group');
    const data = await d3.csv('data/airports-and-sightings-city.csv');

    const xScale = d3.scaleLinear()
                    .domain(d3.extent(data, d => +d.Sightings))
                    .range([0, 350])
                    .nice();

    const yScale = d3.scaleBand()
                    .domain(d3.range(0, 7, 1))
                    .range([300, 0])
                    .padding(0.4);

    const colorScale = d3.scaleSequential()
                        .interpolator(d3.interpolateInferno)
                        .domain([0, d3.max(data, d => parseInt(d.Sightings))])
    
    const jitterWidth = 50
    svg.selectAll("indPoints")
        .data(data)
        .enter()
        .append("circle")
        .attr('class', 'jitterPoints')
        .attr("cx", d => xScale(+d.Sightings))
        .attr("cy", d => yScale(+d['Airport Count']) + (yScale.bandwidth() / 2) - 
            jitterWidth / 2 + Math.random() * jitterWidth) // Add jitter (randomize points by airport count)
        .attr("r", 4)
        .style("fill", d => colorScale(+d.Sightings))
        .style('opacity', 0.5)
}

document.getElementById('filterAirportByState').addEventListener('change', () => {
    if (airportSelected()) {
        const filterByState = document.getElementById('filterAirportByState').checked;
        d3.select('#routes-plot').remove(); 
        updateAirports(filterByState);
    } else {
        document.getElementById('filterAirportByState').checked = true;
    }
});

document.getElementById('showAirportCityPoints').addEventListener('change', () => {

    if (airportSelected()) {
        const filterByState = document.getElementById('filterAirportByState').checked;

        if (filterByState) {
            alert('Individual points can only be shown when the airport attribute is selected and filtered by city.')
            document.getElementById('showAirportCityPoints').checked = false;
        } else {
            const showPoints = document.getElementById('showAirportCityPoints').checked;

            showPoints ? addIndividualPoints() : d3.selectAll('.jitterPoints').remove();
        }
    } else {
        document.getElementById('showAirportCityPoints').checked = false;
    }
});