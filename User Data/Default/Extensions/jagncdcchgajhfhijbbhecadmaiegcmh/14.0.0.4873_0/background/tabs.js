function sendRequestToFocusedTab(request, onResponse, onError)
{
	findFocusedTab(function(tab) {
		sendRequestToTab(request, tab, onResponse, onError);
	});
}

function findFocusedTab(onFound)
{
	forAllTabsInAllWindows(function(window, tab)
		{
			if (window.focused && tab.selected)
			{
				onFound(tab);
			}
		});
}

function sendRequestToTab(request, tab, onResponse, onError)
{
	if (tab.url == "chrome://newtab/")
	{
		throw new Error("Cannot send message to chrome://newtab/");
	}
	chrome.tabs.sendRequest(tab.id, request, function(response)
	{
		if (arguments.length == 0)
		{
			response = {
				hasException: true,
				exceptionMessage: 'Cannot sendRequest to the tab'
				};
		}
		if (response.hasException)
		{
			if (onError)
			{
				onError(response.exceptionMessage);
			}
			else
			{
				console.error('sendRequestToTab got error response: ' + response.exceptionMessage);
			}
		}
		else if (onResponse)
		{
			onResponse(response.value);
		}
	});
}

function forAllTabsInAllWindows(callback) 
{
	chrome.windows.getAll({}, function(windows)
	{
		windows.forEach(function(window)
		{
			forAllTabsInWindow(window, callback);
		});
	});
}

function forAllTabsInWindow(window, callback)
{
	chrome.tabs.getAllInWindow(window.id, function(tabs)
	{
		tabs.forEach(function(tab)
		{
			callback(window, tab);
		});
	});
}
