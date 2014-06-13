try
{
	var kasperskyOnlineBankingPlugin = document.getElementById("KasperskyOnlineBankingPlugin");
	var kasperskyTabsWatcher = new TabsWatcher(kasperskyOnlineBankingPlugin);
	var kasperskyBrowserNavigator = new BrowserNavigator();

	registerAllTabs();
}
catch(e)
{
	console.error("main.js. Exception: " + e);
}

function registerAllTabs()
{
	forEachTab(function(tab)
	{
		kasperskyOnlineBankingPlugin.RegisterTab(tab.id);
	});
}
