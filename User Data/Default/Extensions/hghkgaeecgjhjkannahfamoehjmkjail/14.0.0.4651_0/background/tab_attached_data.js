// TODO: put to a namespace

function TabAttachedData()
{
	var m_data = {};

	chrome.tabs.onRemoved.addListener(function(tabId /*, removeInfo */)
	{
		if (tabExists(tabId))
		{
			delete m_data[tabId];
		}
	});

	this.set = function(tabId, key, value)
	{
		if (!tabExists(tabId))
		{
			m_data[tabId] = {};
		}
		m_data[tabId][key] = value;
	}

	this.get = function(tabId, key)
	{
		return tabExists(tabId) ? m_data[tabId][key] : undefined;
	}

	function tabExists(tabId)
	{
		return tabId in m_data;
	}
}
