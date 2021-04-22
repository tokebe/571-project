// Historical button clicked
document.getElementById('historical-btn').addEventListener('click', () => {
    
    // Hide map
    const states = Array.from(document.getElementsByClassName('state'));
    states.map(elem => elem.style.visibility = 'hidden');

    // Dimensions
    const [ margin, width, height ] = initDimensions();

    // Append svg
    const svg = initSVG(margin, width, height);

    // Read in data and make plot
    initPlots(svg, width, height);
});

function initDimensions() {
    // Dimensions
    const margin = { 
        top: 10, 
        right: 30, 
        bottom: 30, 
        left: 60
    },
    width = 960,
    height = 500;
    
    return [ margin, width, height ];
}

function initSVG(margin, width, height) {
    const svg = d3.select('#historical-viz')
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform',
                    'translate(' + margin.left + ',' + margin.top + ')');

    return svg; 
}

function initPlots(svg, width, height) {
    // Read data
    d3.csv('data/us-historical-sightings.csv', (d) => {
        return { 
            date : d3.timeParse('%Y-%m-%d')(d['Date/Time']), 
            value : +d.Sightings
        }
    }).then((data) => {
        // Scales 
        const xScale = d3.scaleTime()
                        .domain(d3.extent(data, (d) => d.date))
                        .range([0, width]);
        const yScale = d3.scaleLinear()
                        .domain([0, d3.max(data, (d) => d.value)])
                        .range([height, 0]);

        // Add axes
        const xAxis = d3.axisBottom()
                        .scale(xScale);
                        
        const yAxis = d3.axisLeft()
                        .scale(yScale);
                        
        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);

        svg.append('g')
            .attr('class', 'axis')
            .call(yAxis);

        // Adds lines
        svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', '#e41a1c')
            .attr('stroke-width', 1.5)
            .attr('d', d3.line()
                    .x((d) => xScale(d.date))
                    .y((d) => yScale(d.value))
                )
    });
}