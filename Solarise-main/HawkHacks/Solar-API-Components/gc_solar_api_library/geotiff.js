//Loading and rendering GeoTiff from URL
async function loadAndRenderGeoTIFF(
    url,
    isMask = false,
    layerId = "",
    month = null,
    day = null,
    hour = null
  ) {
    try {
      //Fetching the GeoTIFF file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoTIFF: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
  
      //Parsing the GeoTIFF file
      const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      const numBands = image.getSamplesPerPixel();
  
      //Setting null values for other layer types
      if (layerId !== "hourlyShade") {
        hour = null;
      }
      if (layerId !== "monthlyFlux" && layerId !== "hourlyShade") {
        month = null;
      }
  
      let rastersOptions = {};
      if (layerId === "monthlyFlux") {
        rastersOptions = { samples: [month] };
        console.log("Month is: " + month);
      }
      if (layerId === "hourlyShade") {
        console.log("Month is: " + month);
        console.log("Hour is: " + hour);
      }
      const rasters = await image.readRasters(rastersOptions);
  
      //Extracting geospatial metadata
      const fileDirectory = image.getFileDirectory();
      const geoKeys = image.getGeoKeys();
      const bbox = image.getBoundingBox();
  
      //Finding the target div by its ID
      const canvasDiv = document.getElementById("canvas_div");
      if (!canvasDiv) {
        console.error('Div with ID "canvas_div" not found.');
        return null;
      }
  
      if (
        layerId == "hourlyShade" &&
        rasters[hour][0] === 0 &&
        rasters[hour][rasters[0].length - 1] === 0
      ) {
        //Creating a black canvas
        const blackCanvas = document.createElement("canvas");
        blackCanvas.width = 399;
        blackCanvas.height = 400;
        const blackCtx = blackCanvas.getContext("2d");
        blackCtx.fillStyle = "black";
        blackCtx.fillRect(0, 0, blackCanvas.width, blackCanvas.height);
  
        if (!isMask) {
          if (!canvasDiv) {
            console.error('Div with ID "canvas_div" not found.');
            return null;
          }
          canvasDiv.appendChild(blackCanvas);
        }
        return { canvas: blackCanvas, bbox };
      }
  
      //Creating a new canvas element dynamically
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
  
      //Setting canvas size
      canvas.width = image.getWidth();
      canvas.height = image.getHeight();
  
      //Creating ImageData
      let imageData = ctx.createImageData(canvas.width, canvas.height);
      let data = imageData.data;
      let bandData = rasters[0];
  
      if (layerId == "hourlyShade") {
        if (hour === null) {
          hour = 12;
        }
        bandData = rasters[hour];
        //console.error(bandData);
      }
  
      let min = bandData[0],
        max = bandData[0];
  
      //Finding the actual min and max values
      for (let i = 0; i < bandData.length; i++) {
        if (bandData[i] < min) min = bandData[i];
        if (bandData[i] > max) max = bandData[i];
      }
      //Scale the raster values to 0-255 based on actual min and max
      for (let i = 0; i < bandData.length; i++) {
        let normalizedValue = (bandData[i] - min) / (max - min);
        let color = valueToColor(normalizedValue, layerId);
        let index = i * 4;
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
        data[index + 3] = 255;
      }
  
      //Function to map a normalized value (0-1) to a color
      //Function to map a normalized value (0-1) to a color based on the layer ID
      function valueToColor(value, layerId) {
        //Determining the color palette based on the layer ID
        let palette;
        switch (layerId) {
          case "dsm":
            palette = rainbowPalette;
            break;
          case "rgb":
            palette = ironPalette;
            break;
          case "annualFlux":
            palette = ironPalette;
            break;
          case "monthlyFlux":
            palette = ironPalette;
            break;
          case "hourlyShade":
            palette = sunlightPalette;
            break;
          default:
            palette = binaryPalette;
        }
  
        //Converting the normalized value to an index for the color palette
        const index = Math.min(
          palette.length - 1,
          Math.floor(value * palette.length)
        );
        const hexColor = palette[index];
  
        //Converting hex color to RGB
        let r = parseInt(hexColor.substring(0, 2), 16);
        let g = parseInt(hexColor.substring(2, 4), 16);
        let b = parseInt(hexColor.substring(4, 6), 16);
  
        return { r, g, b };
      }
  
      //Rendering the ImageData to the canvas
      ctx.putImageData(imageData, 0, 0);
  
      if (!isMask) {
        if (!canvasDiv) {
          console.error('Div with ID "canvas_div" not found.');
          return null;
        }
        canvasDiv.appendChild(canvas);
      }
  
      let return_object = { canvas, bbox };
      console.log(return_object);
      return return_object;
    } catch (error) {
      console.error("Failed to load or render the GeoTIFF:", error);
      return null;
    }
  }
  
  function applyMaskToOverlay(overlayCanvas, maskCanvas) {
    //Creating a new canvas to hold the resized mask
    const resizedMaskCanvas = document.createElement("canvas");
    const resizedMaskCtx = resizedMaskCanvas.getContext("2d");
  
    //Setting the dimensions of the resized mask to match the overlay
    resizedMaskCanvas.width = overlayCanvas.width;
    resizedMaskCanvas.height = overlayCanvas.height;
  
    //Drawing the original mask onto the resized mask canvas, scaling it to fit
    resizedMaskCtx.drawImage(
      maskCanvas,
      0,
      0,
      maskCanvas.width,
      maskCanvas.height,
      0,
      0,
      resizedMaskCanvas.width,
      resizedMaskCanvas.height
    );
  
    //Using the resized mask for the overlay operations
    const overlayCtx = overlayCanvas.getContext("2d");
    const overlayData = overlayCtx.getImageData(
      0,
      0,
      overlayCanvas.width,
      overlayCanvas.height
    );
    const maskData = resizedMaskCtx.getImageData(
      0,
      0,
      resizedMaskCanvas.width,
      resizedMaskCanvas.height
    );
  
    //Applying the resized mask to the overlay
    for (let i = 0; i < overlayData.data.length; i += 4) {
      const maskAlpha = maskData.data[i];
      //Setting alpha channel of overlay based on mask
      overlayData.data[i + 3] = maskAlpha;
    }
  
    //Putting the modified image data back onto the overlay canvas
    overlayCtx.putImageData(overlayData, 0, 0);
  }
  
  function GeoTIFFOverlay(bounds, canvas, map) {
    this.bounds_ = bounds;
    this.canvas_ = canvas;
    this.map_ = map;
    this.div_ = null;
    this.setMap(map);
  }
  
  function toggleAllOverlays() {
    if (!checkboxDisplayOverlays) return;
  
    overlays.forEach((overlay) => {
      if (checkboxDisplayOverlays.checked) {
        overlay.setMap(map);
      } else {
        overlay.setMap(null);
      }
    });
  }
  
  let div = 1;
  var onGoogleMapsLoaded = () => {
    GeoTIFFOverlay.prototype = new google.maps.OverlayView();
    GeoTIFFOverlay.prototype.onAdd = function () {
      this.div_ = document.createElement("div");
      this.div_.style.borderStyle = "none";
      this.div_.style.borderWidth = "0px";
      this.div_.setAttribute("id", "overlay_" + div);
      this.div_.style.position = "absolute";
  
      div++;
  
      //Attaching the canvas to the overlay's div
      this.div_.appendChild(this.canvas_);
  
      //Adding the overlay's div to the map's overlay pane
      var panes = this.getPanes();
      panes.overlayLayer.appendChild(this.div_);
    };
  
    GeoTIFFOverlay.prototype.draw = function () {
      var overlayProjection = this.getProjection();
  
      var swBound = this.bounds_.getSouthWest();
      var neBound = this.bounds_.getNorthEast();
  
      //Using the SW and NE points of the overlay to find the corresponding pixel locations on the map
      var sw = overlayProjection.fromLatLngToDivPixel(swBound);
      var ne = overlayProjection.fromLatLngToDivPixel(neBound);
  
      var currentZoom = this.map_.getZoom();
  
      var currentZoom = map.getZoom();
  
      var minZoom = 17;
      var maxZoom = 20;
      var opacity = 1;
      var div = this.div_;
      div.style.left = sw.x + "px";
      div.style.top = ne.y + "px";
      div.style.width = ne.x - sw.x + "px";
      div.style.height = sw.y - ne.y + "px";
  
      var scaleX = (ne.x - sw.x) / this.canvas_.width;
      var scaleY = (sw.y - ne.y) / this.canvas_.height;
      var canvas = div.getElementsByTagName("canvas")[0];
      canvas.style.transform = `scale(${scaleX}, ${scaleY})`;
      canvas.style.transformOrigin = "top left";
  
      if (currentZoom < minZoom || currentZoom > maxZoom) {
        //opacity = 0;
      }
  
      this.div_.style.opacity = opacity;
    };

    GeoTIFFOverlay.prototype.onRemove = function () {
      if (this.div_) {
        this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
      }
    };
  
    initMas();
  };