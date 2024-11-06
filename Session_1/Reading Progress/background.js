let isActive = false;
let tabProgress = {};

chrome.action.onClicked.addListener((tab) => {
  isActive = !isActive;
  updateExtensionState(tab.id);
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  updateExtensionState(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateExtensionState(tabId);
  }
});

function updateExtensionState(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      // Don't inject scripts into chrome:// or chrome-extension:// pages
      return;
    }
    
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: handleReadingProgress,
      args: [isActive, tabId]
    }).catch(error => console.log('Script injection failed:', error));

    if (isActive) {
      updateBadge(tabId, tabProgress[tabId] || 0);
    } else {
      clearBadge(tabId);
    }
  });
}

function handleReadingProgress(active, tabId) {
  if (active) {
    if (!document.getElementById('reading-progress-bar')) {
      const progressBar = document.createElement('div');
      progressBar.id = 'reading-progress-bar';
      progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 5px;
        background-color: #4CAF50;
        z-index: 9999;
        transition: width 0.3s;
      `;
      document.body.appendChild(progressBar);

      window.addEventListener('scroll', () => updateReadingProgress(tabId));
    }
    updateReadingProgress(tabId);
  } else {
    const progressBar = document.getElementById('reading-progress-bar');
    if (progressBar) {
      progressBar.remove();
      window.removeEventListener('scroll', () => updateReadingProgress(tabId));
    }
  }

  function updateReadingProgress(tabId) {
    const progressBar = document.getElementById('reading-progress-bar');
    if (progressBar) {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
      progressBar.style.width = scrollPercentage + '%';
      
      chrome.runtime.sendMessage({action: "updateBadge", progress: Math.round(scrollPercentage), tabId: tabId});
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBadge") {
    updateBadge(request.tabId, request.progress);
  }
});

function updateBadge(tabId, progress) {
  tabProgress[tabId] = progress;
  chrome.action.setBadgeText({text: progress + "%", tabId: tabId});
  chrome.action.setBadgeBackgroundColor({color: "#4CAF50", tabId: tabId});
}

function clearBadge(tabId) {
  delete tabProgress[tabId];
  chrome.action.setBadgeText({text: "", tabId: tabId});
}

// Initialize the extension state for the current tab
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  if (tabs[0]) {
    updateExtensionState(tabs[0].id);
  }
});
