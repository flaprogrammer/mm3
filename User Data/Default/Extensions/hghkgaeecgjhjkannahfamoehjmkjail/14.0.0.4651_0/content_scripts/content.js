var KasperskyLabContentBlocker = (function (ns)
{
	function tryToReloadIfNeed(urlToReload, documentUrl, ignoreCache, _sendResponse)
	{
		var request = {
			name: "checkNeedToReload",
			urlToReload: urlToReload,
			documentUrl: documentUrl
		};
		var sendResponse = _sendResponse;
		chrome.extension.sendRequest(request,
			function(response)
			{
				try
				{
					if (response.needToReload)
					{
						document.location.reload(ignoreCache);
						sendResponse({isDocumentFound: true});
					}
				}
				catch(exception)
				{
					console.error("content.js reload has exception: " + exception);
				}
			});
	}

	function tryToReplaceDocument(url, content, responseCallback)
	{
		if (document.location != url)
		{
			return;
		}

		setTimeout(function()
			{
				try
				{
					document.open();
					document.write(content);
					document.close();
				}
				catch (exception)
				{
					console.error("tryToReplaceDocument has exception: " + exception);
				}
			}, 0);

		responseCallback(true);
	}
		
	function tryToInjectScript(functionBody)
	{
		var scriptElement = document.createElement('script');		
		scriptElement.textContent = functionBody;
		( document.head || document.documentElement ).appendChild(scriptElement);
		scriptElement.parentNode.removeChild(scriptElement);
	}

	function addOnRequestListener()
	{
		chrome.extension.onRequest.addListener(
			function(request, sender, sendResponse)
			{
				try
				{
					if (request.name == "reload")
					{
						tryToReloadIfNeed(request.urlToReload, document.URL, request.ignoreCache, sendResponse);
					}
					else
					if (request.name == "replaceDocument")
					{
						tryToReplaceDocument(request.url, request.content, sendResponse);
					}
					else
					if (request.name == "injectScript")
					{
						tryToInjectScript(request.body);
					}
				}
				catch(exception)
				{
					console.error("content.js addOnRequestListener has exception: " + exception);
				}
			});
	}

	ns.startup = function()
	{
		try
		{
			addOnRequestListener();
		}
		catch(exception)
		{
			console.error("content.js startup exception: " + exception);
		}
	}

	return ns;
}(KasperskyLabContentBlocker || {}));

KasperskyLabContentBlocker.startup();