// Background service worker for the extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Phishing Detector Extension Installed');
  
  // Set default settings
  chrome.storage.sync.set({ 
    apiEndpoint: 'http://localhost:8000',
    autoProtection: true // Enable automatic protection by default
  });
  
  // Create context menu for quick URL check
  chrome.contextMenus.create({
    id: 'checkUrl',
    title: 'Check URL for Phishing',
    contexts: ['link']
  });
  
  chrome.contextMenus.create({
    id: 'checkSelection',
    title: 'Check Selected Text as URL',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const settings = await chrome.storage.sync.get(['apiEndpoint']);
  const apiEndpoint = settings.apiEndpoint || 'http://localhost:8000';
  
  let urlToCheck = '';
  
  if (info.menuItemId === 'checkUrl') {
    urlToCheck = info.linkUrl;
  } else if (info.menuItemId === 'checkSelection') {
    urlToCheck = info.selectionText;
  }
  
  if (urlToCheck) {
    checkAndNotify(urlToCheck, apiEndpoint, tab.id);
  }
});

// Check URL and show notification
async function checkAndNotify(url, apiEndpoint, tabId) {
  try {
    const response = await fetch(`${apiEndpoint}/predict/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    const data = await response.json();
    
    // Create notification
    const notificationId = `phishing-${Date.now()}`;
    
    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: data.url_phishing ? '⚠️ Dangerous URL Detected!' : '✅ URL Appears Safe',
      message: `${url}\n\nConfidence: ${(data.confidence * 100).toFixed(1)}%`,
      priority: data.url_phishing ? 2 : 1,
      requireInteraction: data.url_phishing // Keep warning visible until dismissed
    });
    
    // Auto-clear safe notifications after 5 seconds
    if (!data.url_phishing) {
      setTimeout(() => {
        chrome.notifications.clear(notificationId);
      }, 5000);
    }
    
  } catch (error) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '❌ Error',
      message: `Could not check URL: ${error.message}`,
      priority: 1
    });
  }
}

// Listen for page navigation and check current URL automatically
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only check when page finishes loading
  if (changeInfo.status !== 'complete') return;
  
  // Get settings
  const settings = await chrome.storage.sync.get(['autoProtection', 'apiEndpoint']);
  if (!settings.autoProtection) return;
  
  const url = tab.url;
  
  // Skip chrome:// and extension pages
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;
  
  // Skip trusted domains for performance
  if (isTrustedDomain(url)) return;
  
  // Check the page URL
  try {
    const response = await fetch(`${settings.apiEndpoint}/predict/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    const data = await response.json();
    
    // If phishing detected, show warning notification
    if (data.url_phishing) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '🚨 WARNING: Dangerous Website!',
        message: `This website may be a phishing attempt!\n\nConfidence: ${(data.confidence * 100).toFixed(1)}%\n\nConsider leaving this page immediately.`,
        priority: 2,
        requireInteraction: true // User must dismiss
      });
      
      // Update badge to show warning
      chrome.action.setBadgeText({ text: '⚠', tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#f44336', tabId: tabId });
    } else {
      // Clear badge for safe sites
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  } catch (error) {
    console.error('Error checking page URL:', error);
  }
});

// Trusted domains helper function
function isTrustedDomain(url) {
  const trustedDomains = [
    'google.com', 'youtube.com', 'facebook.com', 'twitter.com', 
    'linkedin.com', 'github.com', 'stackoverflow.com', 'wikipedia.org',
    'amazon.com', 'microsoft.com', 'apple.com', 'netflix.com',
    'reddit.com', 'instagram.com', 'whatsapp.com', 'zoom.us'
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