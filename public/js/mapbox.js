/* eslint-disable */

export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoidW1hcmthbmc0NSIsImEiOiJjbDA0b3Rqc3Mwbnh2M2ltanNoNmdmYnB4In0.Ra80ir_zZO8dmQQ6PnRPJQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/umarkang45/cl04pbjkc002d15pragsat0fk',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(location => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add Marker
    new mapboxgl.Marker({
      element: el,
      // Bottom of the pin that will be at the exact location
      anchor: 'bottom',
    })
      .setLngLat(location.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(location.coordinates)
      .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(location.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
