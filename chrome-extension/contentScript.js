console.log('NexScout.ai Content Script loaded');

function detectPlatform() {
  const hostname = window.location.hostname.toLowerCase();

  if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
    return 'facebook';
  }
  if (hostname.includes('instagram.com')) {
    return 'instagram';
  }
  if (hostname.includes('linkedin.com')) {
    return 'linkedin';
  }
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return 'twitter';
  }
  if (hostname.includes('tiktok.com')) {
    return 'tiktok';
  }

  return 'unknown';
}

function suggestCaptureType() {
  const url = window.location.href.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();

  if (pathname.includes('/friends') || url.includes('/friends')) {
    return 'friends_list';
  }
  if (pathname.includes('/groups') || url.includes('/groups')) {
    return 'group_members';
  }
  if (pathname.includes('/posts') || pathname.includes('/post/') || url.includes('/posts/')) {
    return 'post';
  }
  if (pathname.includes('/messages') || pathname.includes('/inbox') || url.includes('/messages')) {
    return 'messages';
  }
  if (pathname.includes('/profile') || pathname === '/' || pathname.includes('/timeline')) {
    return 'profile';
  }

  return 'custom';
}

function extractVisibleText() {
  const bodyText = document.body.innerText || '';

  const visibleElements = document.querySelectorAll('p, div, span, a, h1, h2, h3, h4, h5, h6, li');
  const texts = [];

  visibleElements.forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
      const text = el.innerText?.trim();
      if (text && text.length > 0 && text.length < 500) {
        texts.push(text);
      }
    }
  });

  const uniqueTexts = [...new Set(texts)];

  return bodyText.substring(0, 50000);
}

function captureHtmlSnapshot() {
  try {
    const html = document.documentElement.outerHTML;

    if (html.length > 500000) {
      return html.substring(0, 500000) + '\n<!-- HTML truncated at 500KB -->';
    }

    return html;
  } catch (error) {
    console.error('Failed to capture HTML:', error);
    return '<html><body>Failed to capture HTML</body></html>';
  }
}

function executeCapture() {
  try {
    const platform = detectPlatform();
    const autoCaptureType = suggestCaptureType();
    const sourceUrl = window.location.href;
    const textContent = extractVisibleText();
    const htmlSnapshot = captureHtmlSnapshot();

    return {
      success: true,
      payload: {
        sourceUrl,
        htmlSnapshot,
        textContent,
        platform,
        autoCaptureType
      }
    };
  } catch (error) {
    console.error('Capture failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_PAGE_EXECUTE') {
    console.log('Executing page capture...');
    const result = executeCapture();
    sendResponse(result);
    return true;
  }

  if (request.action === 'GET_PAGE_INFO') {
    sendResponse({
      platform: detectPlatform(),
      autoCaptureType: suggestCaptureType(),
      sourceUrl: window.location.href
    });
    return true;
  }
});

console.log('NexScout.ai Content Script ready');
