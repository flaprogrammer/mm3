// TODO: put to a namespace

function SessionRegistry()
{
	var m_sessions = {};

	this.register = function(session)
	{
		m_sessions[session.getRequestId()] = session;
		session.onRegister();
	}

	this.unregister = function(session)
	{
		delete m_sessions[session.getRequestId()];
		session.onUnregister();
	}

	this.findByRequestId = function(requestId)
	{
		return m_sessions[requestId];
	}

	this.find = function(predicate)
	{
		for(var requestId in m_sessions)
		{
			var session = m_sessions[requestId];
			if (predicate(session))
			{
				return session;
			}
		}
		return null;
	}

	this.filter = function(predicate)
	{
		var sessions = [];
		for(var requestId in m_sessions)
		{
			var session = m_sessions[requestId];
			if (predicate(session))
			{
				sessions.push(session);
			}
		}
		return sessions;
	}
}
