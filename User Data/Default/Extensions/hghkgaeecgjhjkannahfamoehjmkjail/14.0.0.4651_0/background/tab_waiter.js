// TODO: put to a namespace

// Waits for a tab that was internally created by the browser but is not
// avaliable through chrome.tabs.* API.

// Background: chrome.webRequest API informs about all requests and provides
// information about the tab that is associated with the request.
// The tab reported by chrome.webRequest may be unavaliable through chrome.tabs
// API, it can be added to a window later.

// okCallback is called when the tab becomes avaliable or if it was already avaliable.
// failCallback is called when it is guaranteed that no tab will appear
// for the current request because this request was cancelled for some reason.

function waitForTabToAppear(tabId, okCallback, failCallback)
{
	var onBeforeRequest = function(details)
	{
		if (details.tabId == tabId)
		{
			removeEventListeners();
			callOnce(failCallback);
		}
	}

	var onTabCreated = function(tab)
	{
		if (tab.id == tabId)
		{
			removeEventListeners();
			callOnce(okCallback);
		}
	}

	function addEventListeners()
	{
		chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, { urls: ["<all_urls>"] });
		chrome.tabs.onCreated.addListener(onTabCreated);
	}

	function removeEventListeners()
	{
		chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
		chrome.tabs.onCreated.removeListener(onTabCreated);
	}

	var callbackIsCalled = false;
	function callOnce(callback)
	{
		if (!callbackIsCalled)
		{
			callbackIsCalled = true;
			callback();
		}
	}

	addEventListeners();
	// Try to find tab in already existing tabs
	forEachTab(function(tab)
	{
		if (tab.id == tabId)
		{
			removeEventListeners();
			callOnce(okCallback);
		}
	});
}
