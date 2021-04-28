window.addEventListener('load', () => {
    // Dimensions
    const margin = { 
        top: 50, 
        right: 50, 
        bottom: 50, 
        left: 50
    },
    width = 960,
    height = 500;

    const svg = d3.select("#airport-viz")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

    const tooltip = d3.select("#airport-viz")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "10px")
        .style('height', '40px')
    
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
        
        svg.append("g")
            .call(d3.axisLeft(yScale));

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale));

        const colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateInferno)
            .domain([0, d3.max(data, d => parseInt(d.Sightings))])
        
        // Add dots
        svg.append('g')
            .selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.Sightings))
            .attr("cy", d => yScale(d['Airport Count']))
            .attr("r", 3.5)
            .style("fill", d => colorScale(+d.Sightings))
            .style("opacity", "0.7")
            .style('stroke-width', "0.7")
            .attr("stroke", "black")
            .on('mouseover', (d) => tooltip.style('opacity', 1))
            .on('mousemove', (event, d) => {
                tooltip.html('State: ' + d.State + '<br>' + 
                                'Sightings: ' + d.Sightings + '<br>' +
                                'Airports: ' + d['Airport Count'] + '<br>')
                    .style("left", (event.x) + "px")
                    .style("top", (event.y) + "px")
            })
            .on('mouseleave', (d) => {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0)
            })
    });
});

// window.addEventListener('load', () => {
//     // Dimensions
//     const margin = { 
//         top: 50, 
//         right: 50, 
//         bottom: 50, 
//         left: 50
//     },
//     width = 960,
//     height = 500;

//     const svg = d3.select("#airport-viz")
//                 .append("svg")
//                 .attr("width", width + margin.left + margin.right)
//                 .attr("height", height + margin.top + margin.bottom)
//                 .append("g")
//                 .attr("transform",
//                     "translate(" + margin.left + "," + margin.top + ")");
    
//     d3.csv('data/airports-and-sightings-city.csv')
//     .then((data) => {
        
//         const groupedData = d3.groups(data, d => d['Airport Count']);
//         const boxData = groupedData.map(count => {

//             const sightingsByAirport = count[1].map(place => +place.Sightings)
//                                             .sort(d3.ascending);
            
//             const q1 = d3.quantile(sightingsByAirport, 0.25);
//             const median = d3.quantile(sightingsByAirport, 0.5);
//             const q3 = d3.quantile(sightingsByAirport, 0.75);

//             const IQR = q3 - q1;
//             const min = q1 - (1.5 * IQR);
//             const max = q3 + (1.5 * IQR);

//             return { key: count[0], q1: q1, median: median, q3: q3, IQR: IQR, min: min, max: max };
//         });
        
//         const xScale = d3.scaleLinear()
//                         .domain(d3.extent(data, d => +d.Sightings))
//                         .range([0, width])
//                         .nice();

//         const yScale = d3.scaleBand()
//                         .domain(d3.range(0, 7, 1))
//                         .range([height, 0])
//                         .padding(0.4);

//         svg.append("g")
//             .attr("transform", "translate(0," + height + ")")
//             .call(d3.axisBottom(xScale).ticks(5))
        
//         svg.append("g")
//             .call(d3.axisLeft(yScale).tickSize(0))
//             .select(".domain").remove() // Remove y axis line

//         const colorScale = d3.scaleSequential()
//                         .interpolator(d3.interpolateInferno)
//                         .domain(d3.extent(data, d => +d.Sightings))


//         svg.selectAll("vertLines")
//             .data(boxData)
//             .enter()
//             .append("line")
//             .attr("x1", d => xScale(d.min))
//             .attr("x2", d => xScale(d.max))
//             .attr("y1", d => yScale(d.key) + yScale.bandwidth() / 2)
//             .attr("y2", d => yScale(d.key) + yScale.bandwidth() / 2)
//             .attr("stroke", "grey")
//             .style("width", 40)
//             .style('opacity', 0.8)

//         svg.selectAll("boxes")
//             .data(boxData)
//             .enter()
//             .append("rect")
//             .attr("x", d => xScale(d.q1)) 
//             .attr("width", d => xScale(d.q3) - xScale(d.q1))
//             .attr("y", d => yScale(d.key))
//             .attr("height", yScale.bandwidth())
//             .attr("stroke", "black")
//             .style("fill", "#69b3a2")
//             .style("opacity", 0.7)
        
//         svg.selectAll("medianLines")
//             .data(boxData)
//             .enter()
//             .append("line")
//             .attr("y1", d => yScale(d.key))
//             .attr("y2", d => yScale(d.key) + yScale.bandwidth()/2)
//             .attr("x1", d => xScale(d.median))
//             .attr("x2", d => xScale(d.median))
//             .attr("stroke", "black")
//             .style("width", 80)

//         const jitterWidth = 50
//         svg.selectAll("indPoints")
//             .data(data)
//             .enter()
//             .append("circle")
//             .attr("cx", d => xScale(+d.Sightings))
//             .attr("cy", d => yScale(+d['Airport Count']) + (yScale.bandwidth() / 2) - jitterWidth / 2 + Math.random() * jitterWidth)
//             .attr("r", 4)
//             .style("fill", d => colorScale(+d.Sightings))
//             .style('opacity', 0.5)
//     });
// });