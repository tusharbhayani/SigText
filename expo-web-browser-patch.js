// This is a workaround for the expo-web-browser module
// It provides mock implementations of the common functions

const openBrowserAsync = async (url) => {
  console.log('Mock: openBrowserAsync called with URL:', url);
  return { type: 'opened', url };
};

const dismissBrowser = async () => {
  console.log('Mock: dismissBrowser called');
  return { type: 'dismissed' };
};

const openAuthSessionAsync = async (url, redirectUrl) => {
  console.log(
    'Mock: openAuthSessionAsync called with URL:',
    url,
    'redirectUrl:',
    redirectUrl
  );
  return { type: 'success', url: redirectUrl || url };
};

module.exports = {
  openBrowserAsync,
  dismissBrowser,
  openAuthSessionAsync,
  // Add other methods as needed
};
