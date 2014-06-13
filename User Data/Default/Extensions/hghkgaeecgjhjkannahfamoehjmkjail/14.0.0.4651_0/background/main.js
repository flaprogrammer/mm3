var KasperskyLabContentBlocker = (function (ns)
{
var ContentBlockedPage = chrome.extension.getURL('pages/content_blocked.html');
var DocumentReplaceTimeout = 500;

var m_kasperskyContentBlockerPlugin = null;
var m_sessionEventsAggregator = null;

var m_contentScriptRequestHandlers = {
	checkNeedToReload: onCheckNeedToReload,
	getBlockedPageContent: onGetBlockedPageContent
};
var m_tabAttachedData = new TabAttachedData();

// Called from Plugin
ns.reloadUrl = function (urlToReload, ignoreCache, callback)
{
	// TODO: use forEachTab function
	var localCallback = callback;
	chrome.windows.getAll({populate: true},
		function(windows)
		{
			for (var windowPos = 0; windowPos < windows.length; windowPos++)
			{
				var window = windows[windowPos];
				reloadUrlOnAllWindowTabs(urlToReload, ignoreCache, localCallback, window.id);
			}
		});
}

// Called from Plugin
// TODO: move document replacer to a separate class
ns.replaceDocumentWithHtml = function (sessionId, content, callback)
{
	try
	{
		var session = m_sessionEventsAggregator.findSessionBySessionId(sessionId);
		require(!!session, 'Cannot replace html document: no session with id ' + sessionId);
		var tabId = session.getTabId();
		waitForTabToAppear(tabId,
		function() // onSuccess
		{
			var url = session.getUrl();
			// Try to replace the page in a nice way: using content script
			sendReplaceDocumentCommandWithTimeout(tabId, url, content, DocumentReplaceTimeout, function(replaceResult)
			{
				if (typeof(replaceResult) !== 'boolean') // The answer is not from the content script. Possible reason: http request was blocked by the plugin.
				{
					// Using the hard way
					m_tabAttachedData.set(tabId, 'blockedPageContent', content);
					chrome.tabs.update(tabId, { url: ContentBlockedPage }); // Redirect the whole tab to the plugin's internal page.
					callback.onReplaceResults(true);
				}
				else
				{
					callback.onReplaceResults(replaceResult);
				}
			});
		},
		function() // onFailure
		{
			callback.onReplaceResults(false);
		});
	}
	catch (e)
	{
		console.error('replaceDocumentWithHtml: ' + e);
	}
}

function sendReplaceDocumentCommandWithTimeout(tabId, url, content, timeout, callback)
{
	var request = {
		'name': 'replaceDocument',
		'url': url,
		'content': content
	};

	var callbackCalled = false;
	function callOnce(callback /* , ... */)
	{
		if (!callbackCalled)
		{
			callbackCalled = true;
			callback.apply(null, Array.prototype.slice.call(arguments, 1));
		}
	}

	setTimeout(function()
	{
		callOnce(callback);
	}, timeout);

	chrome.tabs.sendRequest(tabId, request, function(/* ... */)
	{
		callOnce(callback, arguments);
	
	});
}

function needToReloadDocumentWithUrl(urlToReload, documentUrl)
{
	if (!urlToReload || !isHttpUrl(urlToReload))
	{
		return false;
	}
	return m_kasperskyContentBlockerPlugin.checkNeedToReloadUrl(urlToReload, documentUrl);
}

function reloadUrlOnTab(tabId, urlToReload, ignoreCache, callback)
{
	var request = {
		name: "reload",
		urlToReload: urlToReload,
		ignoreCache: ignoreCache
	};
	var localCallback = callback;
	chrome.tabs.sendRequest(tabId, request,
		function(response)
		{
			if (response.isDocumentFound)
			{
				localCallback.onDocumentFound();
			}
		});
}

function reloadUrlOnAllWindowTabs(urlToReload, ignoreCache, callback, windowId)
{
	var localCallback = callback;
	// TODO: use forEachTab function
	chrome.tabs.getAllInWindow(windowId,
		function(tabs)
		{
			for (var i = 0; i < tabs.length; i++)
			{
				var tab = tabs[i];
				if (tab.url.indexOf("chrome://") == 0)	// not process internal pages
				{
					continue;
				}
				if (needToReloadDocumentWithUrl(urlToReload, tab.url))
				{
					chrome.tabs.reload(tab.id, { bypassCache: ignoreCache });
					localCallback.onDocumentFound();
				}
				else
				{
					reloadUrlOnTab(tab.id, urlToReload, ignoreCache, callback);
				}
			}
		});
}

function onCheckNeedToReload(request, sender, sendResponse)
{
	var needToReload = needToReloadDocumentWithUrl(request.urlToReload, request.documentUrl);
	sendResponse({ needToReload: needToReload });
}

function onGetBlockedPageContent(request, sender, sendResponse)
{
	var tabId = sender.tab && sender.tab.id;
	require(!!tabId, 'Invalid blocked page content request: ' + JSON.stringify(request));
	var content = m_tabAttachedData.get(tabId, 'blockedPageContent');
	require(!!content, 'Cannot find content for tab: ' + tabId);
	sendResponse({ content: content });
}

function contentScriptsRequestHandler(request, sender, sendResponse)
{
	try
	{
		require(request.name in m_contentScriptRequestHandlers, 'Unknown request: ' + request.name);
		m_contentScriptRequestHandlers[request.name](request, sender, sendResponse);
	}
	catch (e)
	{
		console.error('Error handling request from content script: ' + e);
		sendResponse();
	}
}

// TODO: move this function to a common place
function isHttpUrl(url)
{
	return url.toLowerCase().match(/^https?:/) ? true : false;
}

/* TODO move inject to the single class*/
function initializeProductVersionInject()
{
    chrome.tabs.onUpdated.addListener(productVersionInjector);
}

function productVersionInjector(tabId/*, changeInfo, tab*/) 
{
    try 
    {
	// TODO: don't call product for every tab update
        var request = {
            "name" : "injectScript",
            "body" : m_kasperskyContentBlockerPlugin.getProductInfoFunctionBody()
        };
        chrome.tabs.sendRequest(tabId, request);
    }
    catch (e)
    {
        console.error("productVersionInjector failed: " + e);
    }
}

ns.startup = function ()
{
	try
	{
		m_kasperskyContentBlockerPlugin = document.getElementById("KasperskyContentBlockerPlugin");
		var initializeResult = m_kasperskyContentBlockerPlugin.initialize();
		initializeProductVersionInject();
		if (!initializeResult)
		{
			console.log('Kaspersky Content Blocker: product is not running. Only script injection is active');
			return;
		}

		chrome.extension.onRequest.addListener(contentScriptsRequestHandler);

		m_sessionEventsAggregator = new SessionEventsAggregator(m_kasperskyContentBlockerPlugin);
	}
	catch(e)
	{
		console.error("main.js startup exception: " + e);
	}
}

// TODO: move this function to a common place
function require(condition, message)
{
	if (!condition)
	{
		throw new Error(message ? message : 'Requirement failure');
	}
}

return ns;
}(KasperskyLabContentBlocker || {}));

KasperskyLabContentBlocker.startup();
