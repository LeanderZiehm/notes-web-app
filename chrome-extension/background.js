// Service worker for the Chrome extension
// This can be used for background tasks if needed in the future

chrome.runtime.onInstalled.addListener(() => {
  console.log('Notes Manager extension installed');
});

// Handle any background API requests if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle messages from popup if needed
  return true;
});