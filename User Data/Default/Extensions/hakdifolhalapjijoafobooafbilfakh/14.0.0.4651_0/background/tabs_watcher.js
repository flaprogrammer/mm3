function TabsWatcher(kasperskyOnlineBankingPlugin)
{
	this.m_kasperskyOnlineBankingPlugin = kasperskyOnlineBankingPlugin;

	var thisObject = this;

	chrome.tabs.onCreated.addListener(function(tab) { thisObject.onTabAdded(tab.id); });
	chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) { thisObject.onTabRemoved(tabId); });
}

TabsWatcher.prototype.onTabAdded = function(tabId)
{
	try
	{
		this.m_kasperskyOnlineBankingPlugin.RegisterTab(tabId);
	}
	catch(e)
	{
		console.error("onTabAdded. Exception: " + e);
	}
}

TabsWatcher.prototype.onTabRemoved = function(tabId)
{
	try
	{
		this.m_kasperskyOnlineBankingPlugin.UnregisterTab(tabId);
	}
	catch(e)
	{
		console.error("onTabRemoved. Exception: " + e);
	}
}
