var KasperskyLabOnlineBanking = (function (ns)
{

ns.CookiesHeadersParser = function()
{
	const CookieHeaderName = 'Cookie';

	this.extractCookiesFromHeaders = function(headers)
	{
		if (!headers.exists(CookieHeaderName))
		{
			return [];
		}
		var cookiePairs = headers.get(CookieHeaderName).value.split(';');
		var cookies = convertCookiePairsToCookieObjects(cookiePairs);

		return cookies;
	}

	function convertCookiePairsToCookieObjects(cookiePairs)
	{
		var nameValueRegExp = /^\s*(.*?)\s*(=\s*(.*?)\s*)?$/;
		var cookies = [];
		cookiePairs.forEach(function(pair) {
			var match = nameValueRegExp.exec(pair);
			if (match)
			{
				cookies.push( {
					name: match[1],
					value: match[3] ? match[3] : ''
				});
			}
		});
		return cookies;
	}
}

return ns;
}(KasperskyLabOnlineBanking || {}));
