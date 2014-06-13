var KasperskyLabOnlineBanking = (function (ns)
{

var HttpHeaders = KasperskyLabOnlineBanking.HttpHeaders;

ns.HeadersReplacer = function()
{
	var m_webRequestHandlerIsSet = false;
	var m_headersToReplace = {};

	this.replaceHeadersOnce = function(url, headers)
	{
		require(headers && headers instanceof HttpHeaders, 'Invalid headers parameter');

		ensureWebRequestHandlerIsSet();
		m_headersToReplace[String(url).toLowerCase()] = headers;
	}

	function setWebRequestHandler()
	{
		chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders,
			{ urls: ["<all_urls>"] }, [ "blocking", "requestHeaders" ]);
	}

	function ensureWebRequestHandlerIsSet()
	{
		if (!m_webRequestHandlerIsSet)
		{
			setWebRequestHandler();
			m_webRequestHandlerIsSet = true;
		}
	}

	function onBeforeSendHeaders(details)
	{
		var lowercasedUrl =  String(details.url).toLowerCase();
		if (details.type == 'main_frame' && m_headersToReplace.hasOwnProperty(lowercasedUrl))
		{
			var headers = replaceHeaders(new HttpHeaders(details.requestHeaders), m_headersToReplace[lowercasedUrl]);
			delete m_headersToReplace[lowercasedUrl];
			return { requestHeaders: headers.getData() };
		}
	}

	function replaceHeaders(chromeHeaders, replacementHeaders)
	{
		return addNewHeaders(replaceExistingHeaders(chromeHeaders, replacementHeaders), replacementHeaders);
	}

	function replaceExistingHeaders(chromeHeaders, replacementHeaders)
	{
		return chromeHeaders.map(function(header) {
			if (replacementHeaders.exists(header.name))
			{
				return replacementHeaders.get(header.name);
			}
			return header;
		});
	}

	function addNewHeaders(chromeHeaders, replacementHeaders)
	{
		return chromeHeaders.concat(replacementHeaders.filter(function(header) {
			return !chromeHeaders.exists(header.name);
		}));
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
}(KasperskyLabOnlineBanking || {}));
