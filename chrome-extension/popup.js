let pageInfo = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadPageInfo();
  await loadSavedSettings();

  document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('captureForm').addEventListener('submit', handleCapture);
});

async function loadPageInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      showStatus('error', 'No active tab found. Please open a social media page.');
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      { action: 'GET_PAGE_INFO' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          document.getElementById('platformDisplay').textContent = 'Unknown';
          document.getElementById('suggestedType').textContent = 'None';
          return;
        }

        if (response) {
          pageInfo = response;
          document.getElementById('platformDisplay').textContent = response.platform || 'unknown';
          document.getElementById('suggestedType').textContent = formatCaptureType(response.autoCaptureType) || 'custom';

          document.getElementById('platform').value = response.platform || 'unknown';

          if (response.autoCaptureType) {
            document.getElementById('captureType').value = response.autoCaptureType;
          }
        }
      }
    );
  } catch (error) {
    console.error('Failed to load page info:', error);
    showStatus('error', 'Failed to detect page information.');
  }
}

async function loadSavedSettings() {
  const result = await chrome.storage.sync.get(['apiUrl', 'apiToken']);

  if (!result.apiUrl || !result.apiToken) {
    showStatus('error', 'Please configure your NexScout API credentials in Settings.');
  }
}

async function handleCapture(e) {
  e.preventDefault();

  const captureBtn = document.getElementById('captureBtn');
  const originalText = captureBtn.innerHTML;

  captureBtn.disabled = true;
  captureBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="31.4 31.4" stroke-linecap="round" style="animation: spin 1s linear infinite;"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg> Capturing...';

  try {
    const settings = await chrome.storage.sync.get(['apiUrl', 'apiToken']);

    if (!settings.apiUrl || !settings.apiToken) {
      showStatus('error', 'API credentials not configured. Please go to Settings.');
      captureBtn.disabled = false;
      captureBtn.innerHTML = originalText;
      return;
    }

    showStatus('info', 'Capturing page data...');

    chrome.runtime.sendMessage(
      { action: 'CAPTURE_PAGE' },
      async (captureResponse) => {
        if (!captureResponse || !captureResponse.success) {
          showStatus('error', captureResponse?.error || 'Failed to capture page data.');
          captureBtn.disabled = false;
          captureBtn.innerHTML = originalText;
          return;
        }

        const formData = new FormData(e.target);
        const captureType = document.getElementById('captureType').value;
        const platform = document.getElementById('platform').value;
        const notes = document.getElementById('notes').value;

        const tags = [];
        document.querySelectorAll('input[name="tag"]:checked').forEach(checkbox => {
          tags.push(checkbox.value);
        });

        const payload = {
          captureType: captureType,
          platform: platform,
          sourceUrl: captureResponse.payload.sourceUrl,
          htmlSnapshot: captureResponse.payload.htmlSnapshot,
          textContent: captureResponse.payload.textContent,
          tags: tags,
          notes: notes,
          metadata: {
            capturedAt: new Date().toISOString(),
            extensionVersion: '1.0.0',
            autoDetectedPlatform: captureResponse.payload.platform,
            autoSuggestedType: captureResponse.payload.autoCaptureType
          }
        };

        showStatus('info', 'Sending to NexScout...');

        try {
          const apiUrl = settings.apiUrl.replace(/\/$/, '');
          const response = await fetch(`${apiUrl}/api/browser-capture/ingest`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${settings.apiToken}`
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
          }

          const result = await response.json();

          showStatus('success', `Successfully captured! Event ID: ${result.event_id || 'N/A'}`);

          setTimeout(() => {
            window.close();
          }, 2000);

        } catch (error) {
          console.error('API Error:', error);
          showStatus('error', `Failed to send to NexScout: ${error.message}`);
        }

        captureBtn.disabled = false;
        captureBtn.innerHTML = originalText;
      }
    );

  } catch (error) {
    console.error('Capture error:', error);
    showStatus('error', `Error: ${error.message}`);
    captureBtn.disabled = false;
    captureBtn.innerHTML = originalText;
  }
}

function showStatus(type, message) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.className = `status-message ${type}`;
  statusEl.textContent = message;
  statusEl.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 5000);
  }
}

function formatCaptureType(type) {
  if (!type) return '';
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
