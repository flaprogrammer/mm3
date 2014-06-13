function BrowserNavigator()
{
	const TARGET_USE_CURRENT_TAB = 0;
	const TARGET_OPEN_IN_NEW_TAB = 1;

	m_cookiesHeadersParser = new KasperskyLabOnlineBanking.CookiesHeadersParser();
	m_headersReplacer = new KasperskyLabOnlineBanking.HeadersReplacer();

	this.navigateGet = function(tabId, url, headers, target)
	{
		try
		{
			navigate(tabId, url, headers, 'GET', target);
		}
		catch (e)
		{
			console.error("BrowserNavigator.navigateGet. Exception: " + e);
		}
	}

	this.navigatePost = function(tabId, url, headers, postData, postDataEncoding, target)
	{
		try
		{
			navigate(tabId, url, headers, 'POST', target, postData, postDataEncoding);
		}
		catch (e)
		{
			console.error("BrowserNavigator.navigatePost. Exception: " + e);
		}
	}

	function navigate(tabId, url, headersString, method, target, postData, postDataEncoding)
	{
		var headers = KasperskyLabOnlineBanking.HttpHeaders.createFromString(headersString);
		trySetCookiesToBrowserFromHeaders(url, headers, this.m_cookiesHeadersParser);
		m_headersReplacer.replaceHeadersOnce(url, headers.filterByNames([ 'Referer', 'Origin' ]));

		if (method == 'GET')
		{
			createTabAsGet(url);
		}
		else
		{
			createTabAsPost(url, postData, postDataEncoding);
		}

		if (target == TARGET_USE_CURRENT_TAB)
		{
			chrome.tabs.remove(tabId);
		}
	}

	function createTabAsGet(url)
	{
		chrome.tabs.create({'url' : url});
	}

	function createTabAsPost(url, postData, postDataEncoding)
	{
		// TODO: The only supported content type of postData is "application/x-www-form-urlencoded".
		// TODO: Check Content-type value in the header.
		// TODO: Add support for the "multipart/form-data" and "text/plain" content types.
		var postDataPairs = splitPostData(postData);
		var charset = postDataEncoding ? postDataEncoding : 'utf8';
		var urlifiedDocument = "data:text/html;charset=" + charset + "," + makeUrlifiedFormSubmitter(url, postDataPairs);

		chrome.tabs.create({ "url" : urlifiedDocument });
	}

	const FormSubmitterTemplate = "\
<!DOCTYPE html>\
<html>\
<body onload='document.getElementById(\"form\").submit()'>\
<form method='POST' action='__url__' id='form'>\
__inputs__\
</form>\
</body>\
</html>\
";

	function makeUrlifiedFormSubmitter(url, formData)
	{
		return makeUrlifiedHtml(FormSubmitterTemplate,
			{
				__url__: url,
				__inputs__: makeUrlifiedInputs(formData)
			});
	}

	function makeUrlifiedInputs(formData)
	{
		return formData.map(makeUrlifiedInput).join('');
	}

	const InputWithValueTemplate = "<input type='hidden' name='__name__' value='__value__'></input>";
	const InputWithoutValueTemplate = "<input type='hidden' name='__name__'></input>";

	function makeUrlifiedInput(pair)
	{
		if ('value' in pair)
		{
			return makeUrlifiedHtml(InputWithValueTemplate,
				{
					__name__: escapePercentEncodedValue(pair.name),
					__value__: escapePercentEncodedValue(pair.value)
				});
		}
		else
		{
			return makeUrlifiedHtml(InputWithoutValueTemplate,
				{
					__name__: escapePercentEncodedValue(pair.name)
				});
		}
	}

	function makeUrlifiedHtml(template, data)
	{
		return makeHtml(encodeURIComponent(template), data);
	}

	function makeHtml(template, data)
	{
		require(!/\W/.test(Object.keys(data).join('')), 'Data keys should contain alphanumeric characters and underscores only');
		var regexp = new RegExp(Object.keys(data).join('|'), 'g');
		return template.replace(regexp, function(match) {
			return data[match];
		});
	}

	// Escapes characters that mean something in a single quoted ('') string literal
	// It is required for values that are used as HTML tags parameters or Javascript string literals
	// in "urlified" HTML documents.
	function escapePercentEncodedValue(value)
	{
		require(!/[\n\r\\']/.test(value), 'String "' + value + '" is not percent encoded');
		value = value.replace(/%5c/ig, '%5c%5c');	/* \ -> \\ */
		value = value.replace(/%27/g, '%5c%27');	/* ' -> \' */
		value = value.replace(/%0a/ig, '%5c%6e');	/* <\n> -> \n */
		value = value.replace(/%0d/ig, '%5c%72');	/* <\r> -> \r */
		return value;
	}

	function splitPostData(postData)
	{
		var pairs = new Array();

		if (typeof(postData) == 'string' && postData.length != 0)
		{
			var params = postData.split('&');
			for (var i=0; i < params.length; i++)
			{
				var index = params[i].indexOf('=');
				if (index == -1)
				{
					pairs.push({'name': params[i]});
				}
				else
				{
					var paramName = params[i].substring(0, index);
					var paramValue = params[i].substring(index + 1);

					pairs.push({'name': paramName, 'value': paramValue});
				}
			}
		}

		return pairs;
	}

	function trySetCookiesToBrowserFromHeaders(url, headers, cookiesHeadersParser)
	{
		try
		{
			var cookies = cookiesHeadersParser.extractCookiesFromHeaders(headers);

			for (i=0; i < cookies.length; i++)
			{
				var cookie =
				{
					'url': url,
					'name': cookies[i].name,
					'value': cookies[i].value,
					'path': '/'
				};

				chrome.cookies.set(cookie);
			}
		}
		catch (e)
		{
			console.error("BrowserNavigator.trySetCookiesToBrowserFromHeaders. Exception: " + e);
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
}
