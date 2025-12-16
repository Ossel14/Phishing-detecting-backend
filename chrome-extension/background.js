let allowNext = false;

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (allowNext) {
    allowNext = false;
    return;
  }

  const url = details.url;

  // Ignore browser internal pages
  if (
    url.startsWith("chrome://") ||
    url.startsWith("about:") ||
    url.startsWith("edge://")
  ) return;

  try {
    const response = await fetch("http://127.0.0.1:8000/predict/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    const result = await response.json();

    if (result.phishing === true) {
      // Stop navigation
      chrome.tabs.update(details.tabId, { url: "about:blank" });

      const confirmContinue = confirm(
        "⚠️ WARNING ⚠️\n\nThis URL looks like a phishing link.\n\nDo you want to continue anyway?"
      );

      if (confirmContinue) {
        allowNext = true;
        chrome.tabs.update(details.tabId, { url });
      }
    }
  } catch (e) {
    console.error("FastAPI not reachable", e);
  }
});
