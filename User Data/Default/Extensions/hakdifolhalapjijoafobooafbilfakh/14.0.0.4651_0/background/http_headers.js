var KasperskyLabOnlineBanking = (function (ns)
{

ns.HttpHeaders = function HttpHeaders(data)
{
	require(!data || data instanceof Array, 'Invalid HttpHeaders constructor argument');
	var m_data = data ? data : [];

	this.exists = function(name)
	{
		return findHeaders(name).length > 0;
	}

	this.get = function(name)
	{
		var matches = findHeaders(name);
		require(matches.length > 0, 'Header ' + name + ' was not found');
		return matches[0];
	}

	this.getData = function()
	{
		return m_data;
	}

	this.concat = function(otherObject)
	{
		require(otherObject && otherObject instanceof HttpHeaders, 'Invalid argument in concat');
		return new HttpHeaders(m_data.concat(otherObject.getData()));
	}

	this.filter = function()
	{
		return new HttpHeaders(Array.prototype.filter.apply(m_data, arguments));
	}

	this.filterByNames = function(names)
	{
		require(names && names instanceof Array, 'Invalid argument in filterByNames');
		var lowerCasedNames = names.map(function(name) { return name.toLowerCase(); });
		return this.filter(function(header) {
			return lowerCasedNames.indexOf(header.name.toLowerCase()) >= 0;
		});
	}

	this.map = function()
	{
		return new HttpHeaders(Array.prototype.map.apply(m_data, arguments));
	}

	function findHeaders(name)
	{
		require(name, 'Header name is required');
		var lowerCasedName = name.toLowerCase();
		return m_data.filter(function(header) {
			return header.name.toLowerCase() === lowerCasedName;
		});
	}
}

ns.HttpHeaders.createFromString = function(string)
{
	var nameValueRegexp = /^([\w-]+):\s*(.*)$/;
	var continuedValueRegexp = /^\s+(.*)$/;
	var lastValue = null;
	headers = [];
	var lines = string.split('\r\n');

	for (var i = 0; i < lines.length; ++i)
	{
		var line = lines[i];
		var match = nameValueRegexp.exec(line);
		if (match)
		{
			var name = match[1];
			var value = lastValue = match[2];
			headers.push( { name: name, value: value } );
		}
		else if ((match = continuedValueRegexp.exec(line)) && lastValue)
		{
			lastValue += match[1];
		}
	}
	return new ns.HttpHeaders(headers);
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
