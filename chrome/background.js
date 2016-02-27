// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function (details) {
	if (details.reason == "install") {
		if (chrome.runtime.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		} else {
			window.open(chrome.runtime.getURL('options.html'));
		}
	}
});