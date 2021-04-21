// Read in data (data pre-processed in R) 
const data = d3.csv('data/us_states.csv', (d) => {
    return {
        state: d.State,
        sightings: +d.Sightings // Convert to number
    }
}, (data) => {

    // Testing that data works when clicking screen
    // It's an array of objects that list state and number of sightings
    window.addEventListener('click', () => console.log(data));

    const map = new Datamap({
        /* TODO: Edit configuration: https://datamaps.github.io
            - Info can be found on bottom of the page or on their
            GitHub repo
        */
        scope: 'usa',
        element: document.getElementById('mapContainer'),
        responsive: true,
        gepgraphyConfig: {
            highlightOnHover: false,
            // Match states when hovering over
            // Can possibly match with '.sightings' in 'data' somehow..
            popupTemplate: function(geography) {
                return '<div class="hoverinfo">' + geography.properties.name +  
                'Why are you not showing up' + '</div>';
            }
        }
    });
    
    // Make map resize when window size updated
    d3.select(window).on('resize', () => map.resize());
});