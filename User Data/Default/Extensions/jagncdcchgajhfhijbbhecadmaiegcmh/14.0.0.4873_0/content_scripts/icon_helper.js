var KasperskyLabVirtualKeyboard = (function (ns) 
{

ns.IconHelper = function (window)
{
	const IconData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAJCAYAAADtj3ZXAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAGJJREFUeNpi7F+xdAIjI0M2AwMDCwPx4M///wxTmcjQCAIsIH1MMI35YVEMpNBgAyasXPqfgUzABGOQYTMDRTYzgDSDMAwgs5EBuhoQBtn8m4zQBkcXEyi+QAxSNYL0AQQYAA9yWpK2jTjwAAAAAElFTkSuQmCC';
	const IconDelayHideTimeout = 500;

	var m_hideTimer = 0;
	var m_iconInjector = new KasperskyLabVirtualKeyboard.VirtualKeyboardIconInjector(window, IconData);
	var m_icon = null;

	this.addKeyboardIcon = function(inputElement, onClickCallback)
	{
		removeTimerAndIcon();
		m_icon = m_iconInjector.showIcon(inputElement, onClickCallback);
	}

	this.forceRemoveKeyboardIcon = function()
	{
		removeTimerAndIcon();
	}

	this.delayRemoveKeyboardIcon = function()
	{
		removeHideTimer();
		m_hideTimer = setTimeout(removeTimerAndIcon, IconDelayHideTimeout);	
	}

	function removeHideTimer()
	{
		if (m_hideTimer)
		{
			clearTimeout(m_hideTimer);
			m_hideTimer = 0;
		}
	}

	function removeTimerAndIcon()
	{
		removeHideTimer();
		m_iconInjector.hideIcon(m_icon);
		m_icon = null;
	}
}

return ns;
}(KasperskyLabVirtualKeyboard || {}));
