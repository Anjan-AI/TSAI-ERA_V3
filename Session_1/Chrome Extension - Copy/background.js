let isActive = false;

chrome.action.onClicked.addListener((tab) => {
  isActive = !isActive;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: injectToggleReadingProgress
  });
});

function injectToggleReadingProgress() {
  // Inject the functions into the page
  function toggleReadingProgress() {
    if (document.getElementById('reading-progress-bar')) {
      document.getElementById('reading-progress-bar').remove();
      window.removeEventListener('scroll', updateReadingProgress);
      chrome.runtime.sendMessage({action: "clearBadge"});
    } else {
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

      window.addEventListener('scroll', updateReadingProgress);
      updateReadingProgress();
    }
  }

  function updateReadingProgress() {
    const progressBar = document.getElementById('reading-progress-bar');
    if (progressBar) {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
      progressBar.style.width = scrollPercentage + '%';
      
      // Send message to update badge
      chrome.runtime.sendMessage({action: "updateBadge", progress: Math.round(scrollPercentage)});
    }
  }

  // Execute the toggle function
  toggleReadingProgress();
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBadge") {
    chrome.action.setBadgeText({text: request.progress + "%", tabId: sender.tab.id});
    chrome.action.setBadgeBackgroundColor({color: "#4CAF50", tabId: sender.tab.id});
  } else if (request.action === "clearBadge") {
    chrome.action.setBadgeText({text: "", tabId: sender.tab.id});
    isActive = false;
  }
});

// Initialize the icon
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  if (tabs[0]) {
    updateIcon(tabs[0].id);
  }
});
