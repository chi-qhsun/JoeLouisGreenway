function initMap() {
  var map = L.map("map", {
    center: [42.3514, -83.0758],
    zoom: 13,
  });

  //  **Basemap Layers**
  var baseLayers = {
    "Carto(light)": L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "&copy; Carto, OpenStreetMap contributors",
        subdomains: "abcd",
      }
    ),
    "Carto(dark)": L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "&copy; Carto, OpenStreetMap contributors",
        subdomains: "abcd",
      }
    ),
    "Esri Imagery": L.tileLayer(
      "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "&copy; Esri, Maxar, Earthstar Geographics",
        maxZoom: 20,
      }
    ),
    "Open Street Map": L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      }
    ),
  };

  baseLayers["Carto(dark)"].addTo(map);

  //  **Route Status Layers (Ensuring Default Visibility)**
  var statusLayers = {
    "Funded Routes": L.layerGroup().addTo(map),
    "Open Routes": L.layerGroup().addTo(map),
    "Under Construction Routes": L.layerGroup().addTo(map),
    "Unfunded Routes": L.layerGroup().addTo(map),
  };

  function getStatusColor(status) {
    if (!status) return "gray";

    // Standardizing Status Values
    let formattedStatus = status.trim().toLowerCase();
    let colorMapping = {
      funded: "#83dc80",
      open: "#8ed8ca",
      "under construction": "#fdde6d",
      unfunded: "#fd9b6d",
    };

    return colorMapping[formattedStatus] || "gray";
  }

  //  **Loading Route Shapefile**
  function loadShapefile(url) {
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((buffer) => shp(buffer))
      .then((geojson) => {
        console.log("Loaded Route GeoJSON:", geojson);

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
              statusLayers["Funded Routes"].addLayer(layer);
            } else if (status === "open") {
              statusLayers["Open Routes"].addLayer(layer);
            } else if (status === "under construction") {
              statusLayers["Under Construction Routes"].addLayer(layer);
            } else if (status === "unfunded") {
              statusLayers["Unfunded Routes"].addLayer(layer);
            }
          },
        });
      })
      .catch((error) =>
        console.error("Error loading Route Shapefile:", error)
      );
  }

  loadShapefile("https://yidanchangyd.github.io/greenway_map/route.zip");

  // **Facility Layers**
  var poiLayers = {
    "Bike Sharing": L.layerGroup().addTo(map),
    "Parking Lots": L.layerGroup().addTo(map),
    "EV Charging Stations": L.layerGroup().addTo(map),
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
    "Bike Sharing"
  );
  loadPOI(
    "https://yidanchangyd.github.io/greenway_map/detroit_parking.zip",
    "Parking Lots"
  );
  loadPOI(
    "https://yidanchangyd.github.io/greenway_map/ev_charging.zip",
    "EV Charging Stations"
  );

  function getPOIIcon(type) {
    let icons = {
      "Bike Sharing":
        "https://github.com/yidanchangyd/greenway_map/blob/main/icon/bike.png?raw=true",
      "Parking Lots":
        "https://github.com/yidanchangyd/greenway_map/blob/main/icon/parkinglot.png?raw=true",
      "EV Charging Stations":
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
  //  添加 statusLayers (路线状态) 到图例
  Object.entries(statusLayers).forEach(([name, layer]) => {
    layerControl.addOverlay(layer, name);
    });

  //  添加 poiLayers (设施) 到图例
  Object.entries(poiLayers).forEach(([name, layer]) => {
    layerControl.addOverlay(layer, name);
    });

    setTimeout(() => {
      var container = document.querySelector(".leaflet-control-layers");
      if (!container) {
        console.warn("⚠️ Leaflet control container not found!");
        return;
      }
    
      var baseContainer = container.querySelector(".leaflet-control-layers-base");
      var overlayContainer = container.querySelector(".leaflet-control-layers-overlays");
    
      console.log("✅ Base Container:", baseContainer);
      console.log("✅ Overlay Container:", overlayContainer);
    
      // 确保 Basemap 组标题
      if (baseContainer && !baseContainer.querySelector(".layer-section-title")) {
        let title = document.createElement("div");
        title.classList.add("layer-section-title");
        title.innerText = "Basemap";
        baseContainer.prepend(title);
      }
    
      if (overlayContainer) {
        overlayContainer.querySelectorAll(".layer-section-title").forEach((el) => el.remove());
    
        let firstOverlay = overlayContainer.querySelector("label");
        if (firstOverlay) {
          let routeTitle = document.createElement("div");
          routeTitle.classList.add("layer-section-title");
          routeTitle.innerText = "Routes Status";
          overlayContainer.insertBefore(routeTitle, firstOverlay);
        }
    
        let facilityStart = [...overlayContainer.querySelectorAll("label")].find(
          (el) => el.textContent.includes("Bike Sharing") ||
                  el.textContent.includes("Parking Lots") ||
                  el.textContent.includes("EV Charging Stations")
        );
    
        if (facilityStart) {
          let facilityTitle = document.createElement("div");
          facilityTitle.classList.add("layer-section-title");
          facilityTitle.innerText = "Facilities";
          overlayContainer.insertBefore(facilityTitle, facilityStart);
        }
      }
    
      // 🟢 确保 radio 和 checkbox 被正确插入
      document.querySelectorAll(".leaflet-control-layers-base input[type='radio']").forEach((radio) => {
        let label = radio.parentElement;
        if (!label.querySelector(".custom-radio")) {
          console.log("🔵 Adding custom-radio for:", label.textContent.trim());
          radio.style.opacity = 0;
    
          let customRadio = document.createElement("span");
          customRadio.classList.add("custom-radio");
    
          if (radio.checked) customRadio.classList.add("checked");
    
          radio.addEventListener("change", () => {
            document.querySelectorAll(".custom-radio").forEach((el) => el.classList.remove("checked"));
            if (radio.checked) customRadio.classList.add("checked");
          });
    
          label.insertBefore(customRadio, radio);
        }
      });
    
      document.querySelectorAll(".leaflet-control-layers-overlays input[type='checkbox']").forEach((checkbox) => {
        let label = checkbox.parentElement;
        if (!label.querySelector(".custom-checkbox")) {
          console.log("🟢 Adding custom-checkbox for:", label.textContent.trim());
          checkbox.style.opacity = 0;
    
          let customCheckbox = document.createElement("span");
          customCheckbox.classList.add("custom-checkbox");
    
          if (checkbox.checked) customCheckbox.classList.add("checked");
    
          checkbox.addEventListener("change", () => {
            checkbox.checked ? customCheckbox.classList.add("checked") : customCheckbox.classList.remove("checked");
          });
    
          label.insertBefore(customCheckbox, checkbox);
        }
      });
    
    }, 2000);  // 增加延迟，确保 Layer Control 先加载
    

}
window.onload = initMap;
