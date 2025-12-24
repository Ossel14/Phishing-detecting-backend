// Load saved settings
chrome.storage.sync.get(['apiEndpoint', 'autoProtection'], (result) => {
  const endpoint = result.apiEndpoint || 'http://localhost:8000';
  document.getElementById('apiEndpoint').value = endpoint;
  
  const autoProtection = result.autoProtection !== false; // Default: enabled
  document.getElementById('autoProtection').checked = autoProtection;
});

// Save API endpoint on change
document.getElementById('apiEndpoint').addEventListener('change', (e) => {
  chrome.storage.sync.set({ apiEndpoint: e.target.value });
});

// Save auto-protection setting
document.getElementById('autoProtection').addEventListener('change', (e) => {
  chrome.storage.sync.set({ autoProtection: e.target.checked });
  
  if (e.target.checked) {
    showResult('urlResult', false, '✅ Automatic protection enabled! All links will be checked.', 0);
  } else {
    showResult('urlResult', false, '⚠️ Automatic protection disabled. Links will not be checked automatically.', 0);
  }
  
  setTimeout(() => hideResult('urlResult'), 3000);
});

// Check Email Button
document.getElementById('checkEmailBtn').addEventListener('click', async () => {
  const subject = document.getElementById('emailSubject').value.trim();
  const body = document.getElementById('emailBody').value.trim();

  if (!subject && !body) {
    showResult('emailResult', false, 'Please enter email subject and/or body', 0);
    return;
  }

  const apiEndpoint = document.getElementById('apiEndpoint').value;
  showLoading('emailLoading', true);
  hideResult('emailResult');

  try {
    const response = await fetch(`${apiEndpoint}/predict/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body })
    });

    const data = await response.json();
    showLoading('emailLoading', false);
    showResult('emailResult', data.email_phishing, 
      data.email_phishing ? 'This email appears to be PHISHING!' : 'This email appears to be safe',
      data.confidence
    );
  } catch (error) {
    showLoading('emailLoading', false);
    showResult('emailResult', false, `Error: ${error.message}`, 0);
  }
});

// Extract Email from Current Page
document.getElementById('extractEmailBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { action: 'extractEmail' }, (response) => {
    if (response && response.success) {
      document.getElementById('emailSubject').value = response.subject || '';
      document.getElementById('emailBody').value = response.body || '';
    } else {
      showResult('emailResult', false, 'Could not extract email from this page', 0);
    }
  });
});

// Check URL Button
document.getElementById('checkUrlBtn').addEventListener('click', async () => {
  const url = document.getElementById('urlInput').value.trim();

  if (!url) {
    showResult('urlResult', false, 'Please enter a URL', 0);
    return;
  }

  const apiEndpoint = document.getElementById('apiEndpoint').value;
  showLoading('urlLoading', true);
  hideResult('urlResult');

  try {
    const response = await fetch(`${apiEndpoint}/predict/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();
    showLoading('urlLoading', false);
    showResult('urlResult', data.url_phishing,
      data.url_phishing ? 'This URL is DANGEROUS!' : 'This URL appears to be safe',
      data.confidence
    );
  } catch (error) {
    showLoading('urlLoading', false);
    showResult('urlResult', false, `Error: ${error.message}`, 0);
  }
});

// Check Current Page URL
document.getElementById('checkCurrentUrlBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  document.getElementById('urlInput').value = tab.url;
  document.getElementById('checkUrlBtn').click();
});

// Helper Functions
function showResult(elementId, isPhishing, message, confidence) {
  const resultDiv = document.getElementById(elementId);
  resultDiv.style.display = 'block';
  resultDiv.className = `result ${isPhishing ? 'danger' : 'safe'}`;
  
  const icon = isPhishing ? '⚠️' : '✅';
  const confidencePercent = (confidence * 100).toFixed(1);
  
  resultDiv.innerHTML = `
    <div class="result-title">${icon} ${isPhishing ? 'Warning!' : 'Safe'}</div>
    <div class="result-text">${message}</div>
    ${confidence > 0 ? `<div class="confidence">Confidence: ${confidencePercent}%</div>` : ''}
  `;
}

function hideResult(elementId) {
  document.getElementById(elementId).style.display = 'none';
}

function showLoading(elementId, show) {
  const loadingDiv = document.getElementById(elementId);
  if (show) {
    loadingDiv.classList.add('active');
  } else {
    loadingDiv.classList.remove('active');
  }
}