// TODO: put to a namespace

function SessionEventsAggregator(sessionEventsSink)
{
	var m_sessionIdGenerator = new SequenceGenerator(1, function(value) { return value + 1; });
	var m_sessions = new SessionRegistry();
	var m_tracerEnabled = false; // TODO: move tracer to a common place
	var m_proxy = null;

	initialize();

	this.findSessionBySessionId = function(sessionId)
	{
		return m_sessions.find(function(session) { return session.getSessionId() == sessionId; });
	}

	function initialize()
	{
		// See http://developer.chrome.com/extensions/webRequest.html for the documentation
		var allUrlsDocumentsOnly = { urls: ["<all_urls>"], types: ["main_frame", "sub_frame"] };
		var blocking = ["blocking"];
		addWebRequestListener('onBeforeRequest', onWebRequestBeforeRequest, [ allUrlsDocumentsOnly, blocking ]);
		addWebRequestListener('onBeforeSendHeaders', onWebRequestBeforeSendHeaders, [ allUrlsDocumentsOnly, ['blocking', 'requestHeaders'] ]);
		addWebRequestListener('onAuthRequired', onWebRequestAuthRequired, [ allUrlsDocumentsOnly, blocking ]);
		addWebRequestListener('onErrorOccurred', onWebRequestErrorOccurred, [ allUrlsDocumentsOnly ]);

		addBrowserEventListener(chrome.tabs, 'onRemoved', onTabRemoved);

		trace('initialized');
	}

	function onWebRequestBeforeRequest(details)
	{
		trace(details.requestId, ': onWebRequestBeforeRequest details=(tabId=', details.tabId, ', url=', details.url, ')');
		unregisterSessionWithRequestId(details.requestId);

		if (details.tabId != -1 && isHttpUrl(details.url))
		{
			var session = registerNewSession(details.requestId, details.tabId, details.url, details.method);
			if (session.isCanceled())
			{
				trace('Canceling onBeforeRequest, tabId=', details.tabId);
				return { cancel: true };
			}
		}
	}

	function onWebRequestBeforeSendHeaders(details)
	{
		var requestId = details.requestId;
		var session = findSessionByRequestId(requestId);
		trace(requestId, ': onWebRequestBeforeSendHeaders session=', session, ', details=(tabId=', details.tabId, ', url=', details.url, ')');
		if (session)
		{
			if (session.isCompleted()) // According to documentation this event can occur more than once for one request
			{
				unregisterSessionWithRequestId(requestId);
				session = registerNewSession(requestId, session.getTabId(), session.getUrl(), session.getMethod());
			}

			session.onBeforeNavigate(session.getMethod());
			session.onBeforeSendRequest(
				extractHeaderValue(details.requestHeaders, 'Referer'),
				extractHeaderValue(details.requestHeaders, 'Accept')
			);
			if (m_proxy)
			{
				session.onProxyDetected(m_proxy.host, m_proxy.port);
			}
			session.onRequestCompleted();

			if (session.isCanceled())
			{
				trace('canceling onBeforeSendHeaders, tabId=', details.tabId);
				return { cancel: true };
			}
		}
	}

	function onWebRequestAuthRequired(details)
	{
		var session = findSessionByRequestId(details.requestId);
		trace(details.requestId, ': onWebRequestAuthRequired session=', session, ', details=(tabId=', details.tabId, ', url=', details.url, ')');
		if (session)
		{
			if (details.isProxy && (details.challenger.host || details.challenger.port))
			{
				m_proxy = { host: details.challenger.host, port: details.challenger.port };
			}
		}
	}

	function onWebRequestErrorOccurred(details)
	{
		var session = findSessionByRequestId(details.requestId);
		trace(details.requestId, ': onWebRequestErrorOccurred session=', session, ', details=(tabId=', details.tabId, ', url=', details.url, ')');
		if (session && !session.isCompleted())
		{
			session.onRequestCompleted();
		}
	}

	function onTabRemoved(tabId /*, removeInfo */)
	{
		trace('onTabRemoved tabId=', tabId);
		unregisterAllTabSessions(tabId);
	}

	function bindExceptionHandler(wrappedFunction)
	{
		return function()
		{
			try
			{
				return wrappedFunction.apply(this, arguments);
			}
			catch (e)
			{
				var functionName = wrappedFunction.name ? wrappedFunction.name : '<unknown function>';
				console.error("SessionEventsAggregator." + functionName + " exception: " + e);
			}
		};
	}

	function registerNewSession(requestId, tabId, url, method)
	{
		var session = new Session(String(m_sessionIdGenerator.generate()), requestId, tabId, url, method, sessionEventsSink);
		m_sessions.register(session);
		trace('New session registered ', session, ', tabId=', tabId);
		return session;
	}

	function addBrowserEventListener(apiObject, eventId, listener /*, ... */)
	{
		var args = [ bindExceptionHandler(listener) ].concat(Array.prototype.slice.call(arguments, 3));
		var event = apiObject[eventId];
		require(!!event, 'Event ' + eventId + ' is not supported');
		event.addListener.apply(event, args);
	}

	function addWebRequestListener(eventId, listener, args)
	{
		require(!!chrome.webRequest, 'chrome.webRequest API is not avaliable');
		addBrowserEventListener.apply(null, [ chrome.webRequest, eventId, listener ].concat(args));
	}

	function extractHeaderValue(header, propertyName)
	{
		require(header, 'Header is invalid, cannot extract value');
		var lowerCasedPropertyName = propertyName.toLowerCase();
		for (var index in header)
		{
			var property = header[index];
			if (property && property.name && property.name.toLowerCase() === lowerCasedPropertyName)
			{
				return property.value;
			}
		}
		return '';
	}

	function findSessionByRequestId(requestId)
	{
		return m_sessions.findByRequestId(requestId);
	}

	function unregisterSessionWithRequestId(requestId)
	{
		var session = findSessionByRequestId(requestId);
		if (session)
		{
			m_sessions.unregister(session);
		}
	}

	function unregisterAllTabSessions(tabId)
	{
		var thisTabSessions = m_sessions.filter(function(session) { return session.getTabId() == tabId; });
		for(var index in thisTabSessions)
		{
			m_sessions.unregister(thisTabSessions[index]);
		}
	}	

	// TODO: move this function to a common place
	function isHttpUrl(url)
	{
		return url.toLowerCase().match(/^https?:/) ? true : false;
	}

	// TODO: move this function to a common place
	function require(condition, message)
	{
		if (!condition)
		{
			throw new Error(message ? message : 'Requirement failure');
		}
	}	

	// TODO: move this function to a separate class
	function trace(/* ... */)
	{
		if (m_tracerEnabled)
		{
			var argumentsAsArray = Array.prototype.slice.call(arguments, 0);
			console.log(['SessionEventsAggregator: '].concat(argumentsAsArray).join(''));
		}
	}
}
