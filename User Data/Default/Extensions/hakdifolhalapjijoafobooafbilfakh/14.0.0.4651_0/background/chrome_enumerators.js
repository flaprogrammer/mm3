// TODO: put to a namespace

function forEachWindow(callback)
{
	chrome.windows.getAll({ populate: true },
		function(windows)
		{
			for (var i in windows)
			{
				callback(windows[i]);
			}
		});
}

function forEachTab(callback)
{
	forEachWindow(function (window)
	{
		for (var i in window.tabs)
		{
			callback(window.tabs[i]);
		}
	});
}
