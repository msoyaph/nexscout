document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();

  document.getElementById('settingsForm').addEventListener('submit', saveSettings);
});

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['apiUrl', 'apiToken']);

    if (result.apiUrl) {
      document.getElementById('apiUrl').value = result.apiUrl;
    }

    if (result.apiToken) {
      document.getElementById('apiToken').value = result.apiToken;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('error', 'Failed to load saved settings.');
  }
}

async function saveSettings(e) {
  e.preventDefault();

  const apiUrl = document.getElementById('apiUrl').value.trim();
  const apiToken = document.getElementById('apiToken').value.trim();

  if (!apiUrl || !apiToken) {
    showStatus('error', 'Both API URL and API Token are required.');
    return;
  }

  if (!isValidUrl(apiUrl)) {
    showStatus('error', 'Please enter a valid URL (e.g., https://your-project.supabase.co)');
    return;
  }

  try {
    await chrome.storage.sync.set({
      apiUrl: apiUrl,
      apiToken: apiToken
    });

    showStatus('success', 'Settings saved successfully!');

    setTimeout(() => {
      document.getElementById('statusMessage').style.display = 'none';
    }, 3000);

  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('error', `Failed to save settings: ${error.message}`);
  }
}

function showStatus(type, message) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.className = `status-message ${type}`;
  statusEl.textContent = message;
  statusEl.style.display = 'block';
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}
