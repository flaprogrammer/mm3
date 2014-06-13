// TODO: put to a namespace

function Session(sessionId, requestId, tabId, url, method, eventSink)
{
	var m_sentEvents = {};
	var m_completed = false;
	var m_canceled = false;

	this.getSessionId = function()
	{
		return sessionId;
	}

	this.getRequestId = function()
	{
		return requestId;
	}

	this.getTabId = function()
	{
		return tabId;
	}

	this.getUrl = function()
	{
		return url;
	}

	this.getMethod = function()
	{
		return method;
	}

	this.isCompleted = function()
	{
		return m_completed;
	}

	this.isCanceled = function()
	{
		return m_canceled;
	}

	this.onRegister = function()
	{
		var eventId = 'onBrowserSessionRegister';
		require(!m_completed, 'Error sending event ' + eventId + ': session is completed');
		require(!m_canceled, 'Error sending event ' + eventId + ': session is canceled');
		require(!isAlreadySent(eventId), 'Error sending event ' + eventId + ': event is already sent');
		sendEvent(eventId);
	}

	this.onUnregister = function()
	{
		var eventId = 'onBrowserSessionUnregister';
		require(m_completed, 'Error sending event ' + eventId + ': session is not completed');
		require(!isAlreadySent(eventId), 'Error sending event ' + eventId + ': event is already sent');
		sendEvent(eventId);
	}

	this.onBeforeNavigate = function(method)
	{
		var eventId = 'onBrowserSessionBeforeNavigate';
		require(!m_completed, 'Error sending event ' + eventId + ': session is completed');
		require(!isAlreadySent(eventId), 'Error sending event ' + eventId + ': event is already sent');
		sendEvent(eventId, {
				'url': url,
				'method': method
			});
	}

	this.onBeforeSendRequest = function(referer, accept)
	{
		var eventId = 'onBrowserSessionBeforeSendRequest';
		require(!m_completed, 'Error sending event ' + eventId + ': session is completed');
		require(!isAlreadySent(eventId), 'Error sending event ' + eventId + ': event is already sent');
		sendEvent(eventId, {
				'referer': referer,
				'accept': accept
		});
	}

	this.onProxyDetected = function(host, port)
	{
		require(host || port, 'Invalid arguments');
		var eventId = 'onBrowserSessionProxyDetected';
		require(!m_completed, 'Error sending event ' + eventId + ': session is completed');
		require(!isAlreadySent(eventId), 'Error sending event ' + eventId + ': event is already sent');
		sendEvent(eventId, {
			'host': host,
			'port': port,
			'username': '', // TODO
			'password': ''
		});
	}

	this.onRemoteAddressDetected = function(remoteIpAddress)
	{
		require(!!remoteIpAddress, 'Invalid argument');
		var eventId = 'onBrowserSessionRemoteAddressDetected';
		require(!m_completed, 'Error sending event ' + eventId + ': session is completed');
		require(!isAlreadySent(eventId), 'Error sending event ' + eventId + ': event is already sent');
		sendEvent(eventId, {
			'ip': remoteIpAddress,
			'port': 0 // TODO: port from the URL should be used
		});
	}

	this.onRequestCompleted = function()
	{
		var eventId = 'onBrowserSessionRequestCompleted';
		require(!m_completed, 'Error sending event ' + eventId + ': session is completed');
		require(!isAlreadySent(eventId), 'Error sending event ' + eventId + ': event is already sent');
		sendEvent(eventId);
		m_completed = true;
	}

	this.toString = function()
	{
		return JSON.stringify({ sessionId: sessionId, requestId: requestId, tabId: tabId, url: url });
	}

	function sendEvent(eventId /*, ... parameters ... */)
	{
		require(!!eventSink[eventId], 'No event handler for event ' + eventId);

		var eventArgs = [ sessionId ].concat(Array.prototype.slice.call(arguments, 1));
		
		var sessionCanceled = eventSink[eventId].apply(eventSink, eventArgs);
		markEventAsSent(eventId);
		if (sessionCanceled)
		{
			m_canceled = true;
		}
	}

	function markEventAsSent(eventId)
	{
		m_sentEvents[eventId] = true;
	}

	function isAlreadySent(eventId)
	{
		return m_sentEvents[eventId] ? true : false;
	}

	// TODO: move this function to a common place
	function require(condition, message)
	{
		if (!condition)
		{
			throw new Error(message ? message : 'Requirement failure');
		}
	}
}
