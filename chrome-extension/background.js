console.log('NexScout.ai Background Service Worker started');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_PAGE') {
    handleCapture(sendResponse);
    return true;
  }
});

async function handleCapture(sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      { action: 'CAPTURE_PAGE_EXECUTE' },
      async (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error communicating with content script:', chrome.runtime.lastError);
          sendResponse({
            success: false,
            error: 'Failed to communicate with page. Please refresh and try again.'
          });
          return;
        }

        if (response.success) {
          await sendToBackend(response.data);
        }

        sendResponse(response);
      }
    );
  } catch (error) {
    console.error('Capture error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function sendToBackend(captureData) {
  try {
    const settings = await chrome.storage.sync.get(['apiUrl', 'apiKey']);

    if (!settings.apiUrl || !settings.apiKey) {
      console.warn('API credentials not configured');
      return;
    }

    const response = await fetch(settings.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nexscout-api-key': settings.apiKey
      },
      body: JSON.stringify({
        captureType: captureData.captureType,
        platform: captureData.platform,
        sourceUrl: captureData.sourceUrl,
        htmlSnapshot: captureData.htmlSnapshot,
        textContent: captureData.textContent,
        tags: captureData.tags,
        notes: captureData.notes,
        metadata: {
          extensionVersion: chrome.runtime.getManifest().version,
          autoCaptureType: captureData.autoCaptureType,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Capture sent to backend successfully:', result.captureId);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Capture Saved',
        message: 'Your data has been securely saved to NexScout.ai'
      });
    } else {
      console.error('Backend error:', result.error);
    }
  } catch (error) {
    console.error('Failed to send to backend:', error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('NexScout.ai Extension installed');
});
