//Getting data from latitude and longitude
async function findClosestBuildingInsights(latitude, longitude, apiKey) {
  //Forming the request URL
  const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${latitude}&location.longitude=${longitude}&requiredQuality=HIGH&key=${apiKey}`;

  try {
    //Making the fetch request and wait for the response
    const response = await fetch(url);
    //Converting response to JSON and return
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

//Updating max value on range selector for # of modules
function changeMaxValue(element, new_max) {
  if (element && element.value > new_max) {
    element.value = new_max;
    element_modules_range_display.innerHTML = new_max;
  }
  element.max = new_max;
  console.log("Max value changed to", new_max);
}

//Updating value on range display span
function updateRange(rangeElement, displayElement) {
  displayElement.innerHTML = rangeElement.value;
}

//Total output calculation from # of modules * output watts
function calculate_output(rangeElement, wattsElement, displayElement) {
  //Calculating the total output in watts
  var totalWatts = Number(rangeElement.value) * Number(wattsElement.value);
  //Converting watts to kilowatts and round to two decimal places
  var totalKilowatts = (totalWatts / 1000).toFixed(2);
  //Updating the display element with the formatted result
  displayElement.innerHTML = totalKilowatts + " kW/hour";
}

//Event listeners
document.addEventListener("DOMContentLoaded", (event) => {
  changeMaxValue(element_modules_range, 100);
  updateRange(element_modules_range, element_modules_range_display);
  //Event listener for the range input
  element_modules_range.addEventListener("input", () => {
    updateRange(element_modules_range, element_modules_range_display);
  });
  element_modules_range.addEventListener("change", () => {
    calculate_output(
      element_modules_range,
      element_modules_range_watts,
      element_modules_calculator_display
    );
  });
});