const GOOGLE_API_KEY = "AIzaSyCxnnuZP82AlrtMlHyM0d8oNqBIxeF08pw";

const statQuery = {
  property(coords) {
    return getCrimeStats({
      query: "limit=10&offset=0&sort=-started",
      distance: 1,
      coords
    });
  },
  area(coords) {
    return getCrimeStats({
      query: "group=location",
      distance: 100,
      coords
    });
  },
};

function getCrimeStats(payload) {
  const url = `https://crimemap.info/api/offences?filter%5Blocation%5D=${payload.coords.lat}%2C${payload.coords.lng}&filter%5Bdistance%5D=${payload.distance}&${payload.query}`;
  return new Promise((resolve, reject) => {
    httpGet(url, {
      success: res => {
        resolve(res);
      }
    });
  });
}

function setIcon(statCount) {
  let color = "red";
  if (statCount <= 6) {
    color = "orange";
  }
  if (statCount <= 3) {
    color = "green";
  }

  const path = `assets/icon-${color}-16x16.png`;
  chrome.browserAction.setIcon({
    path: {
      "16": path
    }
  });
}

function getAddressCoords(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GOOGLE_API_KEY}`;
  return new Promise((resolve, reject) => {
    httpGet(url, {
      success: res => {
        data = res.results[0].geometry.location;
        resolve(data);
      }
    });
  });
}

function runall() {
  console.log("RUNNING");
  getCurrentTab(tab => {
    const location = tab.url.slice(0, 28);
    if (location == "http://www.realestate.com.au") {
      const address = tab.title.split(" - ")[0];
      const coords = getAddressCoords(address)
        .then(res => {
          return Promise.all([statQuery.property(res), statQuery.area(res)]);
        })
        .then(values => {
          const statsProperty = values[0];
          const statsArea = values[1];

          const statsPropertyCount = statsProperty.meta.total;
          const statsAreaCount = statsArea.data.reduce((acc, curr) => {
            return acc + curr.count;
          }, 0);

          renderContent({ id: "title", text: address });
          renderContent({ id: "statsProperty", text: `${statsPropertyCount} crime${statsPropertyCount === 1 ? "" : "s"} reported at this property` });
          renderContent({ id: "statsArea", text: `${statsAreaCount} crimes found within 100m` });
          setIcon(statsPropertyCount);
        });
    }
    else {
      renderContent({ id: "title", text: "Search for a property on realestate.com.au" });
      renderContent({ id: "stat", text: "" });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  runall();
});