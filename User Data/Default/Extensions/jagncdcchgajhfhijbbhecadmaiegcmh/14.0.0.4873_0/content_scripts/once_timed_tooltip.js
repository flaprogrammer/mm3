var KasperskyLabVirtualKeyboard = (function (ns) 
{

ns.OnceTimedTooltip = function(window, text)
{
	this.IconDelayHideTimeoutMs = 3 * 1000;
	this.TooltipShownAttribute = 'kasperskyVirtualKeyboardTooltipShown';
	this.TooltipShownValue = 'yes';

	this.m_window = window;
	this.m_text = text;
	this.m_tooltip = null;
	this.m_hideTimer = null;

	this.show = function(element)
	{
		var document = element.ownerDocument;
		
		var tooltipShown = document.body.attributes.getNamedItem(this.TooltipShownAttribute);
		if (tooltipShown == null)
		{
			this.m_tooltip = new KasperskyVirtualKeyboardTooltip(element, this.m_text, this.m_window, document);
			this.m_tooltip.show();

			document.body.setAttribute(this.TooltipShownAttribute, this.TooltipShownValue);

			var thisObject = this;
			this.m_hideTimer = setTimeout(function() { thisObject.hide(); }, this.IconDelayHideTimeoutMs);
		}
	}

	this.hide = function()
	{
		if (this.m_hideTimer)
		{
			clearTimeout(this.m_hideTimer);
			this.m_hideTimer = null;
		}

		if (this.m_tooltip)
		{
			this.m_tooltip.hide();
			this.m_tooltip = null;
		}
	}
}

return ns;
}(KasperskyLabVirtualKeyboard || {}));
