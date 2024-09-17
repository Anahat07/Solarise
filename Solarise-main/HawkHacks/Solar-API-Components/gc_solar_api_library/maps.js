function getLatLong() {
  address = addressInputElement.value;
  console.log(address);

  //Plus (+) for URL compatibility
  const formattedAddress = address.split(" ").join("+");

  //Forming the request URL
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${formattedAddress}&key=${apiKey}`;

  //Making the fetch request
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "OK") {
        //Extracting latitude and longitude
        latitude = data.results[0].geometry.location.lat;
        longitude = data.results[0].geometry.location.lng;
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
        //Clearing existing overlays
        overlays.forEach((overlay) => overlay.setMap(null));
        overlays = [];
        //Re-initiating map and requests
        initMas();
      } else {
        console.log("Geocoding failed: " + data.status);
        console.log(data);
      }
    })
    .catch((error) => console.error("Error:", error));
}

//Google Map Initiation Function
var initMas = async () => {
  //Function to update the month name based on the slider's value
  function updateMonth() {
    monthNameDisplay.textContent = monthNames[selectedMonthElement.value];
  }
  //Function to update the hour display based on the slider's value
  function updateHour() {
    hourDisplay.textContent = hourNames[selectedHourElement.value];
  }
  //Event listeners
  selectedMonthElement.addEventListener("input", updateMonth);
  selectedHourElement.addEventListener("input", updateHour);
  // Initialize the display
  updateMonth();
  updateHour();

  const selectedMonth = parseInt(selectedMonthElement.value, 10);
  const myLatLng = new google.maps.LatLng(latitude, longitude);
  var mapOptions = {
    zoom: 19,
    center: myLatLng,
    mapTypeId: "satellite",
  };
  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  const url = new URL("https://solar.googleapis.com/v1/dataLayers:get");

  //Defining UTM Zone 11N projection string
  var utmZone11N =
    "+proj=utm +zone=11 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";

  //Adding map query initiation parameters
  url.searchParams.append("location.latitude", latitude);
  url.searchParams.append("location.longitude", longitude);
  url.searchParams.append("radiusMeters", "100");
  url.searchParams.append("view", "FULL_LAYERS");
  url.searchParams.append("requiredQuality", "HIGH");
  url.searchParams.append("pixelSizeMeters", "0.5");
  url.searchParams.append("key", apiKey);
  fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(async (data) => {
      solar_data_layers = data;

      solar_layers = [
        solar_data_layers.dsmUrl,
        solar_data_layers.rgbUrl,
        solar_data_layers.annualFluxUrl,
        solar_data_layers.monthlyFluxUrl,
        solar_data_layers.hourlyShadeUrls,
      ];

      //Loading and applying mask first
      let maskUrl = new URL(solar_data_layers.maskUrl);
      if (maskUrl) {
        maskUrl.searchParams.append("key", apiKey);
        let maskResponse = await loadAndRenderGeoTIFF(maskUrl, true);
        maskCanvas = maskResponse.canvas;
      }
      
      try {
        const selectedLayer = parseInt(selectedOverlayElement.value, 10);

        let geotiff_url;
        if (layer_type[selectedLayer] === "hourlyShade") {
          geotiff_url = new URL(solar_layers[selectedLayer][selectedMonth]);
        } else {
          geotiff_url = new URL(solar_layers[selectedLayer]);
        }
        geotiff_url.searchParams.append("key", apiKey);
        const isMask =
          solar_layers[selectedLayer] === solar_data_layers.maskUrl;
        const month =
          layer_type[selectedLayer] === "monthlyFlux" ? selectedMonth : null;

        const canvas_result = await loadAndRenderGeoTIFF(
          geotiff_url,
          isMask,
          layer_type[selectedLayer],
          selectedMonth
        );

        const canvas = canvas_result.canvas;

        if (!isMask && maskCanvas) {
          applyMaskToOverlay(canvas, maskCanvas);
        }
        //Converting each corner of the bounding box
        var sw = proj4(utmZone11N, "EPSG:4326", [
          canvas_result.bbox[0],
          canvas_result.bbox[1],
        ]);
        var ne = proj4(utmZone11N, "EPSG:4326", [
          canvas_result.bbox[2],
          canvas_result.bbox[3],
        ]);

        const overlayBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(sw[1], sw[0]),
          new google.maps.LatLng(ne[1], ne[0])
        );

        const overlay = new GeoTIFFOverlay(overlayBounds, canvas, map);
        overlays.push(overlay);
      } catch (error) {
        console.error("Error loading GeoTIFF:", error);
      }
    })
    .catch((error) => {
      console.error("Fetch gapi error:", error);
    });

  (async () => {
    var solar_data = await findClosestBuildingInsights(
      latitude,
      longitude,
      apiKey
    );
    //Getting the data
    let maxModules = solar_data.solarPotential.maxArrayPanelsCount;
    let maxSunshineHoursPerYear = Math.round(
      solar_data.solarPotential.maxSunshineHoursPerYear
    );
    let wholeRoofSize = Number(
      solar_data.solarPotential.wholeRoofStats.areaMeters2.toFixed(2)
    );

    const element_modules_range = document.getElementById(
      "system_modules_range"
    );
    const element_modules_range_watts = document.getElementById(
      "system_modules_watts"
    );
    const element_modules_calculator_display = document.getElementById(
      "modules_calculator_display"
    );

    changeMaxValue(element_modules_range, maxModules);
    calculate_output(
      element_modules_range,
      element_modules_range_watts,
      element_modules_calculator_display
    );

    let gsa_data = document.getElementById("gsa_data");
    gsa_data.innerHTML = "Max Module Count: " + maxModules + " modules";
    gsa_data.innerHTML +=
      "<br/> Max Annual Sunshine: " + maxSunshineHoursPerYear + " hr";
    gsa_data.innerHTML +=
      "<br/> Roof Area: " + wholeRoofSize + " m<sup>2</sup>";
  })();
  map.setTilt(0);

  function changeMonthLayer() {
    //Getting the selected month as an integer
    const selectedMonth = parseInt(this.value, 10);
    const monthlyFluxUrl = solar_data_layers.monthlyFluxUrl;
    if (monthlyFluxUrl) {
      //Clearing existing overlays
      overlays.forEach((overlay) => overlay.setMap(null));
      //Resetting the overlays array
      overlays = [];
      //Reloading the GeoTIFF layer for the selected month
      let geotiff_url = new URL(monthlyFluxUrl);
      geotiff_url.searchParams.append("key", apiKey);

      loadAndRenderGeoTIFF(
        geotiff_url.toString(),
        false,
        "monthlyFlux",
        selectedMonth
      )
        .then((canvas_result) => {
          if (canvas_result) {
            selectedOverlayElement.value = 3;
            if (!checkboxDisplayOverlays.checked) {
              checkboxDisplayOverlays.checked = true;
            }
            const { canvas, bbox } = canvas_result;

            if (maskCanvas) {
              applyMaskToOverlay(canvas, maskCanvas);
            }

            //Converting each corner of the bounding box
            var sw = proj4(utmZone11N, "EPSG:4326", [bbox[0], bbox[1]]);
            var ne = proj4(utmZone11N, "EPSG:4326", [bbox[2], bbox[3]]);

            const overlayBounds = new google.maps.LatLngBounds(
              new google.maps.LatLng(sw[1], sw[0]),
              new google.maps.LatLng(ne[1], ne[0])
            );

            const overlay = new GeoTIFFOverlay(overlayBounds, canvas, map);
            overlays.push(overlay);
          }
        })
        .catch((error) => {
          console.error("Error reloading GeoTIFF for selected month:", error);
        });
    }
  }

  function changeHourLayer() {
    //Changing the event listener to 'change' to update the hour display when the user finishes sliding
    const selectedMonth = parseInt(selectedMonthElement.value, 10);
    const selectedHour = parseInt(this.value, 10);
    const hourlyShadeUrls = solar_data_layers.hourlyShadeUrls[selectedMonth];

    if (hourlyShadeUrls) {
      //Clearing existing overlays
      overlays.forEach((overlay) => overlay.setMap(null));
      overlays = [];

      //Reloading the GeoTIFF layer for the selected hour
      let geotiff_url = new URL(hourlyShadeUrls);
      geotiff_url.searchParams.append("key", apiKey);

      loadAndRenderGeoTIFF(
        geotiff_url,
        false,
        "hourlyShade",
        selectedMonth,
        null,
        selectedHour
      )
        .then((canvas_result) => {
          if (canvas_result) {
            selectedOverlayElement.value = 4;
            if (!checkboxDisplayOverlays.checked) {
              checkboxDisplayOverlays.checked = true;
            }
            const { canvas, bbox } = canvas_result;

            if (maskCanvas) {
              applyMaskToOverlay(canvas, maskCanvas);
            }

            //Converting each corner of the bounding box
            var sw = proj4(utmZone11N, "EPSG:4326", [bbox[0], bbox[1]]);
            var ne = proj4(utmZone11N, "EPSG:4326", [bbox[2], bbox[3]]);

            const overlayBounds = new google.maps.LatLngBounds(
              new google.maps.LatLng(sw[1], sw[0]),
              new google.maps.LatLng(ne[1], ne[0])
            );

            const overlay = new GeoTIFFOverlay(overlayBounds, canvas, map);
            overlays.push(overlay);
          }
        })
        .catch((error) => {
          console.error("Error reloading GeoTIFF for selected month:", error);
        });
    }
  }

  function changeTypeLayer() {
    const selectedMonth = parseInt(selectedMonthElement.value, 10);
    const selectedHour = parseInt(selectedHourElement.value, 10);
    const selectedLayer = parseInt(this.value, 10);

    const data_layer_url = solar_layers[parseInt(selectedLayer)];

    if (data_layer_url) {
      //Clearing existing overlays
      overlays.forEach((overlay) => overlay.setMap(null));
      overlays = [];

      //Reloading the GeoTIFF layer for the selected hour
      let geotiff_url;

      if (layer_type[selectedLayer] === "hourlyShade") {
        geotiff_url = new URL(data_layer_url[selectedMonth]);
      } else {
        geotiff_url = new URL(data_layer_url);
      }
      geotiff_url.searchParams.append("key", apiKey);

      loadAndRenderGeoTIFF(
        geotiff_url.toString(),
        false,
        layer_type[selectedLayer],
        selectedMonth,
        null,
        selectedHour
      )
        .then((canvas_result) => {
          if (canvas_result) {
            if (!checkboxDisplayOverlays.checked) {
              checkboxDisplayOverlays.checked = true;
            }

            const { canvas, bbox } = canvas_result;

            if (maskCanvas) {
              applyMaskToOverlay(canvas, maskCanvas);
            }

            //Converting each corner of the bounding box
            var sw = proj4(utmZone11N, "EPSG:4326", [bbox[0], bbox[1]]);
            var ne = proj4(utmZone11N, "EPSG:4326", [bbox[2], bbox[3]]);

            const overlayBounds = new google.maps.LatLngBounds(
              new google.maps.LatLng(sw[1], sw[0]),
              new google.maps.LatLng(ne[1], ne[0])
            );

            const overlay = new GeoTIFFOverlay(overlayBounds, canvas, map);
            overlays.push(overlay);
          }
        })
        .catch((error) => {
          console.error("Error reloading GeoTIFF for selected month:", error);
        });
    }
  }

  if (!listenersAdded) {
    selectedMonthElement.addEventListener("change", changeMonthLayer);
    selectedHourElement.addEventListener("change", changeHourLayer);
    selectedOverlayElement.addEventListener("change", changeTypeLayer);
    listenersAdded = true;
  }
};