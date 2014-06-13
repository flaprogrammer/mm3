// TODO: put to a namespace

function SequenceGenerator(initialValue, nextValueGenerator)
{
	var m_value = initialValue;

	this.generate = function()
	{
		var currentValue = m_value;
		m_value = nextValueGenerator(currentValue);
		return currentValue;
	}
}
