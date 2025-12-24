// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractEmail') {
    const emailData = extractEmailFromPage();
    sendResponse(emailData);
  }
  return true;
});

// Extract email content from common email providers
function extractEmailFromPage() {
  let subject = '';
  let body = '';

  // Gmail detection
  if (window.location.hostname.includes('mail.google.com')) {
    const subjectElement = document.querySelector('h2.hP');
    subject = subjectElement ? subjectElement.textContent.trim() : '';
    
    const bodyElement = document.querySelector('div.a3s.aiL');
    body = bodyElement ? bodyElement.textContent.trim() : '';
  }
  
  // Outlook/Office 365 detection
  else if (window.location.hostname.includes('outlook.')) {
    const subjectElement = document.querySelector('[role="heading"][aria-level="1"]');
    subject = subjectElement ? subjectElement.textContent.trim() : '';
    
    const bodyElement = document.querySelector('[role="document"]');
    body = bodyElement ? bodyElement.textContent.trim() : '';
  }
  
  // Yahoo Mail detection
  else if (window.location.hostname.includes('mail.yahoo.com')) {
    const subjectElement = document.querySelector('[data-test-id="message-subject"]');
    subject = subjectElement ? subjectElement.textContent.trim() : '';
    
    const bodyElement = document.querySelector('[data-test-id="message-view-body-content"]');
    body = bodyElement ? bodyElement.textContent.trim() : '';
  }
  
  // Generic fallback - look for email-like content
  else {
    // Try to find subject in meta tags or title
    const metaSubject = document.querySelector('meta[property="og:title"]');
    subject = metaSubject ? metaSubject.content : document.title;
    
    // Try to get main content
    const article = document.querySelector('article');
    const main = document.querySelector('main');
    const content = article || main || document.body;
    body = content ? content.textContent.trim().substring(0, 5000) : '';
  }

  return {
    success: !!(subject || body),
    subject: subject,
    body: body
  };
}

// ========================================
// AUTOMATIC PHISHING DETECTION
// ========================================

let checkedUrls = new Set(); // Cache to avoid checking same URL multiple times
let isCheckingEnabled = true;

// Load settings from storage
chrome.storage.sync.get(['autoProtection'], (result) => {
  isCheckingEnabled = result.autoProtection !== false; // Enabled by default
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.autoProtection) {
    isCheckingEnabled = changes.autoProtection.newValue;
  }
});

// Monitor ALL link clicks for automatic protection
document.addEventListener('click', async (e) => {
  if (!isCheckingEnabled) return;
  
  const link = e.target.closest('a');
  if (!link || !link.href) return;

  const url = link.href;
  
  // Skip already checked URLs
  if (checkedUrls.has(url)) return;
  
  // Skip internal navigation (same domain)
  if (url.startsWith(window.location.origin)) return;
  
  // Skip common safe domains
  if (isTrustedDomain(url)) return;

  // INTERCEPT THE CLICK
  e.preventDefault();
  e.stopPropagation();
  
  // Show loading indicator
  showLoadingOverlay(link, url);
  
  // Check URL with your backend
  try {
    const result = await checkUrlWithBackend(url);
    checkedUrls.add(url); // Cache result
    
    if (result.url_phishing) {
      // PHISHING DETECTED - Show warning
      hideLoadingOverlay();
      showPhishingWarning(url, result.confidence, link);
    } else {
      // SAFE - Allow navigation
      hideLoadingOverlay();
      window.location.href = url;
    }
  } catch (error) {
    console.error('Error checking URL:', error);
    hideLoadingOverlay();
    
    // If API fails, ask user what to do
    const proceed = confirm(`⚠️ Could not verify URL safety.\n\n${url}\n\nProceed anyway?`);
    if (proceed) {
      window.location.href = url;
    }
  }
}, true); // Use capture phase to intercept early

// Check URL with your backend API
async function checkUrlWithBackend(url) {
  const settings = await chrome.storage.sync.get(['apiEndpoint']);
  const apiEndpoint = settings.apiEndpoint || 'http://localhost:8000';
  
  const response = await fetch(`${apiEndpoint}/predict/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return await response.json();
}

// Trusted domains that we skip checking (performance optimization)
function isTrustedDomain(url) {
  const trustedDomains = [
    'google.com', 'youtube.com', 'facebook.com', 'twitter.com', 
    'linkedin.com', 'github.com', 'stackoverflow.com', 'wikipedia.org',
    'amazon.com', 'microsoft.com', 'apple.com', 'netflix.com'
  ];
  
  try {
    const urlObj = new URL(url);
    return trustedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

// Show loading overlay while checking
function showLoadingOverlay(link, url) {
  const overlay = document.createElement('div');
  overlay.id = 'phishing-detector-loading';
  overlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px 40px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 999999;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  overlay.innerHTML = `
    <div style="margin-bottom: 15px;">
      <div style="border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
    </div>
    <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 8px;">
      🛡️ Checking URL Safety...
    </div>
    <div style="font-size: 12px; color: #666; max-width: 300px; word-break: break-all;">
      ${url}
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  
  document.body.appendChild(overlay);
  
  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'phishing-detector-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999998;
  `;
  document.body.appendChild(backdrop);
}

// Hide loading overlay
function hideLoadingOverlay() {
  const overlay = document.getElementById('phishing-detector-loading');
  const backdrop = document.getElementById('phishing-detector-backdrop');
  if (overlay) overlay.remove();
  if (backdrop) backdrop.remove();
}

// Show phishing warning dialog
function showPhishingWarning(url, confidence, originalLink) {
  const warning = document.createElement('div');
  warning.id = 'phishing-detector-warning';
  warning.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px 40px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 999999;
    max-width: 500px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  const confidencePercent = (confidence * 100).toFixed(1);
  
  warning.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
      <div style="font-size: 24px; font-weight: 700; color: #d32f2f; margin-bottom: 8px;">
        PHISHING WARNING!
      </div>
      <div style="font-size: 14px; color: #666;">
        This URL has been detected as dangerous
      </div>
    </div>
    
    <div style="background: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 600; color: #666; margin-bottom: 5px;">URL:</div>
      <div style="font-size: 13px; color: #d32f2f; word-break: break-all; font-family: monospace;">
        ${url}
      </div>
      <div style="margin-top: 10px; font-size: 12px; color: #666;">
        <strong>Confidence:</strong> ${confidencePercent}%
      </div>
    </div>
    
    <div style="font-size: 13px; color: #666; margin-bottom: 20px; line-height: 1.6;">
      ⚠️ This link may be attempting to steal your personal information, passwords, or financial data. 
      We strongly recommend not visiting this site.
    </div>
    
    <div style="display: flex; gap: 10px;">
      <button id="phishing-go-back" style="
        flex: 1;
        padding: 12px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      ">
        🛡️ Go Back (Safe)
      </button>
      <button id="phishing-proceed" style="
        flex: 1;
        padding: 12px;
        background: #f5f5f5;
        color: #d32f2f;
        border: 2px solid #d32f2f;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      ">
        ⚠️ Proceed Anyway
      </button>
    </div>
  `;
  
  document.body.appendChild(warning);
  
  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'phishing-detector-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    z-index: 999998;
  `;
  document.body.appendChild(backdrop);
  
  // Handle button clicks
  document.getElementById('phishing-go-back').addEventListener('click', () => {
    warning.remove();
    backdrop.remove();
    // Don't navigate anywhere - user stays on current page
  });
  
  document.getElementById('phishing-proceed').addEventListener('click', () => {
    warning.remove();
    backdrop.remove();
    // User chose to proceed despite warning
    window.location.href = url;
  });
}