function TsfEditorProxy(editorId, tsfEditorEventsSink)
{
	var m_sender = new PendingRequests();
	var m_eventsSink = tsfEditorEventsSink;

	findFocusedTab(function(tab) {
		var pendingRequests = m_sender;
		m_sender = new Sender(tab);
		pendingRequests.flush(m_sender);
	});
	create();

	function create()
	{
		m_sender.send({ name: "tsfEditorCreate", editorId: editorId });
	}

	this.destroy = function()
	{
		m_sender.send({ name: "tsfEditorDestroy", editorId: editorId });
	}

	this.insertText = function(text) 
	{
		m_sender.send({ name: "tsfEditorInsertText", text: text, editorId: editorId });
	}

	this.setComposition = function(composition) 
	{
		m_sender.send({ name: "tsfEditorSetComposition", composition: composition, editorId: editorId });
	}

	this.onCompositionLayoutChange = function(compositionLayout, windowLayout)
	{
		m_eventsSink.onCompositionLayoutChange(compositionLayout, windowLayout);
	}

	function PendingRequests()
	{
		var m_pendingRequests = [];

		this.send = function(request)
		{
			m_pendingRequests.push(request);
		}

		this.flush = function(sender)
		{
			for (var i = 0; i < m_pendingRequests.length; ++i)
			{
				sender.send(m_pendingRequests[i]);
			}
			m_pendingRequests = [];
		}
	}

	function Sender(tab)
	{
		this.send = function(request)
		{
			sendRequestToTab(request, tab);
		}
	}
}
