function renderContent(content) {
  document.getElementById(content.id).textContent = content.text;
}

function getCurrentTab(callback) {
  const queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, tabs => {
    const tab = tabs[0];
    callback(tab);
  });
}

function httpGet(uri, opt) {
  const defaults = {
    cache: true,
    success() { },
    error(err) {
      const error = typeof err.responseJSON === "object" ? err.responseJSON.message : null;
      console.error(error);
    }
  };

  const options = Object.assign(defaults, opt);

  const req = new Request(uri, {
    method: "GET",
    credentials: "same-origin"
  });

  fetch(req)
    .then(res => {
      if (res.ok) {
        res.json().then(json => {
          options.success(json);
        });
      } else {
        res.json().then(err => {
          options.error(err);
        });
      }
    })
    .catch(err => {
      options.error(err);
    });
}