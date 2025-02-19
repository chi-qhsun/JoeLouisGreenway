function initMap() {
  var map = L.map("map", {
    center: [42.3514, -83.0758],
    zoom: 13,
  });

  //  **Basemap Layers**
  var baseLayers = {
    "🌍 Standard Map": L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      }
    ),
    "🛰️ Esri Clarity (HD)": L.tileLayer(
      "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "&copy; Esri, Maxar, Earthstar Geographics",
        maxZoom: 20,
      }
    ),
  };

  baseLayers["🛰️ Esri Clarity (HD)"].addTo(map); // Default basemap: Esri HD

  //  **Route Status Layers (Ensuring Default Visibility)**
  var statusLayers = {
    "🟢 Funded Routes": L.layerGroup().addTo(map),
    "🔵 Open Routes": L.layerGroup().addTo(map),
    "🟠 Under Construction Routes": L.layerGroup().addTo(map),
    "🔴 Unfunded Routes": L.layerGroup().addTo(map),
  };

  function getStatusColor(status) {
    if (!status) return "gray";

    // Standardizing Status Values
    let formattedStatus = status.trim().toLowerCase();
    let colorMapping = {
      funded: "#07b87d",
      open: "#077bb8",
      "under construction": "#b85607",
      unfunded: "#b80778",
    };

    return colorMapping[formattedStatus] || "gray";
  }

  //  **Loading Route Shapefile**
  function loadShapefile(url) {
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((buffer) => shp(buffer))
      .then((geojson) => {
        console.log("✅ Loaded Route GeoJSON:", geojson);

        L.geoJSON(geojson, {
          style: function (feature) {
            let status = feature.properties.Status?.trim() || "Unknown";
            return { color: getStatusColor(status), weight: 4 };
          },
          onEachFeature: function (feature, layer) {
            let status =
              feature.properties.Status?.trim().toLowerCase() || "unknown";
            let popupContent = `<b>Status:</b> ${status}`;
            layer.bindPopup(popupContent);

            // **Ensure correct assignment to status layers**
            if (status === "funded") {
              statusLayers["🟢 Funded Routes"].addLayer(layer);
            } else if (status === "open") {
              statusLayers["🔵 Open Routes"].addLayer(layer);
            } else if (status === "under construction") {
              statusLayers["🟠 Under Construction Routes"].addLayer(layer);
            } else if (status === "unfunded") {
              statusLayers["🔴 Unfunded Routes"].addLayer(layer);
            }
          },
        });
      })
      .catch((error) =>
        console.error("❌ Error loading Route Shapefile:", error)
      );
  }

  loadShapefile("https://yidanchangyd.github.io/greenway_map/route.zip");

  // **Facility Layers**
  var poiLayers = {
    "🚲 Bike Sharing": L.layerGroup().addTo(map),
    "🅿️ Parking Lots": L.layerGroup().addTo(map),
    "⚡ EV Charging Stations": L.layerGroup().addTo(map),
  };

  function loadPOI(url, category) {
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((buffer) => shp(buffer))
      .then((geojson) => {
        console.log(`Loaded POI GeoJSON for ${category}:`, geojson);

        L.geoJSON(geojson, {
          pointToLayer: function (feature, latlng) {
            return L.marker(latlng, { icon: getPOIIcon(category) }).bindPopup(
              `<b>${
                feature.properties.name || "Facility"
              }</b><br>Type: ${category}`
            );
          },
        }).addTo(poiLayers[category]);
      })
      .catch((error) =>
        console.error(`Error loading POI for ${category}:`, error)
      );
  }

  loadPOI(
    "https://yidanchangyd.github.io/greenway_map/bike_sharing.zip",
    "🚲 Bike Sharing"
  );
  loadPOI(
    "https://yidanchangyd.github.io/greenway_map/detroit_parking.zip",
    "🅿️ Parking Lots"
  );
  loadPOI(
    "https://yidanchangyd.github.io/greenway_map/ev_charging.zip",
    "⚡ EV Charging Stations"
  );

  function getPOIIcon(type) {
    let icons = {
      "🚲 Bike Sharing":
        "https://github.com/yidanchangyd/greenway_map/blob/main/icon/bike.png?raw=true",
      "🅿️ Parking Lots":
        "https://github.com/yidanchangyd/greenway_map/blob/main/icon/parkinglot.png?raw=true",
      "⚡ EV Charging Stations":
        "https://github.com/yidanchangyd/greenway_map/blob/main/icon/ev.png?raw=true",
    };
    return L.icon({
      iconUrl: icons[type],
      iconSize: [25, 25],
      iconAnchor: [12, 12],
      popupAnchor: [0, -10],
    });
  }

  //  **Layer Control Panel (Fixed to the Left)**
  var layerControl = L.control
    .layers(baseLayers, {}, { collapsed: false })
    .addTo(map);

  setTimeout(() => {
    var container = document.querySelector(".leaflet-control-layers");
    if (container) {
      container.style.left = "10px"; // Positioning on the left
      container.style.right = "auto";

      var overlayContainer = container.querySelector(
        ".leaflet-control-layers-overlays"
      );
      var baseContainer = container.querySelector(
        ".leaflet-control-layers-base"
      );

      if (overlayContainer && baseContainer) {
        let sections = overlayContainer.querySelectorAll(
          ".layer-control-section"
        );
        sections.forEach((section) => section.remove());

        // **Basemap at the Top**
        if (!baseContainer.querySelector(".layer-control-basemap")) {
          baseContainer.insertAdjacentHTML(
            "afterbegin",
            `<div class="layer-control-section layer-control-basemap"><b>🌍 Basemap</b></div>`
          );
        }

        // **Route Status**
        if (!overlayContainer.querySelector(".layer-control-route")) {
          overlayContainer.insertAdjacentHTML(
            "afterbegin",
            `<div class="layer-control-section layer-control-route"><b>🛤️ Route Status</b></div>`
          );
        }

        // **Facilities**
        if (!overlayContainer.querySelector(".layer-control-facility")) {
          overlayContainer.insertAdjacentHTML(
            "beforeend",
            `<div class="layer-control-section layer-control-facility"><b>🏢 Facilities</b></div>`
          );
        }

        // **Add Route Status Layers**
        Object.entries(statusLayers).forEach(([name, layer]) => {
          layerControl.addOverlay(layer, name);
        });

        // **Add Facility Layers**
        Object.entries(poiLayers).forEach(([name, layer]) => {
          layerControl.addOverlay(layer, name);
        });
      } else {
        console.warn(
          "⚠️ `leaflet-control-layers-overlays` or `leaflet-control-layers-base` container not found!"
        );
      }
    } else {
      console.warn("⚠️ `leaflet-control-layers` container not found!");
    }
  }, 1000);
}
window.onload = initMap;
