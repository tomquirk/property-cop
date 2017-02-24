var GOOGLE_API_KEY = 'AIzaSyCxnnuZP82AlrtMlHyM0d8oNqBIxeF08pw'

function getCurrentTab(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];

    callback(tab);
  });
}

function getCrimeStats(coords) {
  var distance = 50
  var url = `https://crimemap.info/api/offences?filter%5Blocation%5D=${coords.lat}%2C${coords.lng}&filter%5Bdistance%5D=${distance}&group=location`
  // var url = `https://crimemap.info/api/offences?filter%5Blocation%5D=${coords.lat}%2C${coords.lng}&limit=10&offset=0&sort=-started`
  return new Promise(function(resolve, reject) {
    httpGet(url, {
      success: res => {
        resolve(res)
      }
    })
  });
}

function httpGet(uri, opt) {
  var defaults = {
    cache: true,
    success: function() { },
    error: function(err) {
      var error = typeof err.responseJSON === 'object' ? err.responseJSON.message : null;
      self.notifyBad(error);
    }
  };

  var options = Object.assign(defaults, opt);

  var req = new Request(uri, {
    method: 'GET',
    credentials: 'same-origin'
  });

  fetch(req)
    .then(function(res) {
      if (res.ok) {
        res.json().then(function(json) {
          options.success(json);
        });
      } else {
        res.json().then(function(err) {
          options.error(err);
        });
      }
    })
    .catch(function(err) {
      options.error(err);
    });
}

function getAddressCoords(address) {
  var url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GOOGLE_API_KEY}`
  return new Promise(function(resolve, reject) {
    httpGet(url, {
      success: res => {
        data = res.results[0].geometry.location
        resolve(data)
      }
    })
  });
  // return data.results.geometry.location;
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

document.addEventListener('DOMContentLoaded', function() {
  getCurrentTab(function(tab) {
    if (tab.url.slice(0, 28) == 'http://www.realestate.com.au') {
      var address = tab.title.split(' - ')[0]
      var coords = getAddressCoords(address)
        .then(coords => {
          // var test = {lat: -27.49360306, lng: 153.00120853}
          return getCrimeStats(coords)
        })
        .then(stats => {
          console.log(stats)
          var count = stats.data.reduce((acc, curr) => {
            return acc + curr.count
          }, 0)
          renderStatus(count + ' Crimes found within 50m')
        })
    }
  });
});
