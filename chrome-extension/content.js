function insertWarningBanner() {
  if (document.getElementById("phishing-warning")) return;

  const banner = document.createElement("div");
  banner.id = "phishing-warning";
  banner.innerText = "⚠️ WARNING: This email may be a phishing attempt";
  banner.style.background = "#ff4d4d";
  banner.style.color = "white";
  banner.style.padding = "12px";
  banner.style.fontSize = "16px";
  banner.style.fontWeight = "bold";
  banner.style.textAlign = "center";
  banner.style.zIndex = "9999";

  document.body.prepend(banner);
}

function extractEmailText() {
  const emailBody = document.querySelector("div[role='main']");
  return emailBody ? emailBody.innerText : "";
}

async function checkEmail() {
  const text = extractEmailText();
  if (!text || text.length < 50) return;

  try {
    const response = await fetch("http://127.0.0.1:8000/predict/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const result = await response.json();

    if (result.phishing === true) {
      insertWarningBanner();
    }
  } catch (e) {
    console.error("FastAPI error", e);
  }
}

// Gmail loads dynamically → observe changes
const observer = new MutationObserver(() => {
  checkEmail();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
