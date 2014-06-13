var DangerImageHtml      = "&nbsp;<img src='" + DangerImage + "');width:12px;/>&nbsp;";
var SuspiciousImageHtml  = "&nbsp;<img src='" + SuspiciousImage + "');width:12px;/>&nbsp;";
var GoodImageHtml        = "&nbsp;<img src='" + GoodImage + "');width:12px;/>&nbsp;";
var HightlightedElementName = "KavHltTag";
var HightlightedAttrUrl = "kis_url";
var HightlightedAttrStatus = "kis_status";
var HightlightedAttrSource = "kis_source";
var HightlightedAttrCategories = "kis_categoties";
var HightlightedAttrThreats = "kis_threats";
var ShowInfoWindowTimeout = 500;
var TimerId = 0;
var localHostname;
var HighlightEnabled = false;
var LinksMode = LinksMode_List;
var CheckPageEnable = false;


Startup();


function HighlightUpdate()
{
	if (HighlightEnabled && CheckPageEnable)
		RequestLinksInfo();
	else
		UnhightlightLinks();
}

function IsSchemeUrlEnabledToCheck(url)
{
	var schemeUrlEnabledToCheck =
		(url.indexOf("http://") == 0) ||
		(url.indexOf("https://") == 0) ||
		(url.indexOf("ftp://") == 0) ||
		(url.indexOf("ftps://") == 0);

	return schemeUrlEnabledToCheck;
}

function RequestLinksInfo()
{
	try 
	{
		//console.log("content.js: RequestLinksInfo ");

		UpdateLocalHostName();
		
		var request = new Object();
		request.name = "GetLinksInfo";
		
		request.urls = new Array();
		for(var i=0; i < document.links.length; i++)
		{
			if (!IsSchemeUrlEnabledToCheck(document.links[i].href))
			{
				continue;
			}

			if (IsLocalHost(document.links[i].href)) 
			{
				continue;
			}
			
			if (LinksMode == LinksMode_List && !IsSearchEngineResult(document.links[i])) 
			{
				continue;
			}
			
			request.urls.push(document.links[i].href);
		}
		
		chrome.extension.sendRequest(request);
	} 
	catch(exception) 
	{
		console.error("RequestLinksInfo exc: " + exception);
	}
}

function ProcessLinksInfo(arrayInfo)
{
	var docLinks = document.links;
	for(var i=0; i < docLinks.length; i++)
	{
		if (!IsSchemeUrlEnabledToCheck(docLinks[i].href))
		{
			continue;
		}
		
		if (LinksMode == LinksMode_List && !IsSearchEngineResult(docLinks[i])) 
		{
			continue;
		}
		
		var linkInfo = GetLinkInfo(arrayInfo, docLinks[i].href);
		if (linkInfo == null) continue;
		
		if (CanShowStatusInfo(linkInfo.status))
			HighlightLink(docLinks[i], linkInfo);
		else
			UnhighlightLink(docLinks[i]);
	}
}

function GetLinkInfo(arrayInfo, url)
{
	for(var i=0; i < arrayInfo.length; i++)
	{
		if (arrayInfo[i].url == url)
		{
			var linkInfo = new Object();
			linkInfo.status = arrayInfo[i].status;
			linkInfo.source = arrayInfo[i].source;
			linkInfo.categories = arrayInfo[i].categories;
			linkInfo.threats = arrayInfo[i].threats;
			return linkInfo;
		}
	}
	
	return null;
}

function HighlightLink(link, linkInfo)
{
	var linkHightlighted = IsLinkHightlighted(link);
	
	var statusIcon = linkHightlighted ? link.nextSibling : document.createElement("SPAN");
	
	if (linkInfo.status == LCR_DANGER)
		statusIcon.innerHTML = DangerImageHtml;
	else 
	if (linkInfo.status == LCR_UNKNOWN)
		statusIcon.innerHTML = SuspiciousImageHtml;
	else 
	if (linkInfo.status == LCR_GOOD)
		statusIcon.innerHTML = GoodImageHtml;
	else
		statusIcon.innerHTML = "";
		
	if (!linkHightlighted)
	{
		statusIcon.setAttribute("name", HightlightedElementName);
		link.parentNode.insertBefore(statusIcon, link.nextSibling);
	}

	var node = statusIcon.firstChild;
	while(node)
	{
		if (node.nodeName == "img" || node.nodeName == "IMG")
		{
			break;
		}
		
		node = node.nextSibling;
	}
	
	if (node)
	{
		node.setAttribute(HightlightedAttrUrl, link.href);
		node.setAttribute(HightlightedAttrStatus, linkInfo.status);
		node.setAttribute(HightlightedAttrSource, linkInfo.source);
		node.setAttribute(HightlightedAttrCategories, linkInfo.categories);
		node.setAttribute(HightlightedAttrThreats, linkInfo.threats);
		AttachEventsToLink(node);
	}
}

function CanShowStatusInfo(status)
{
	if (status == LCR_NONE) return false;
	
	return true;
}

function ShowInfoWindow(url, status, source, categories, threats, x, y)
{
	try 
	{
		var request = new Object();
		request.name = "ShowInfoWindow";
		request.x = x;
		request.y = y ;
		request.url = url;
		request.status = status;
		request.source = source;
		request.categories = categories;
		request.threats = threats;
		chrome.extension.sendRequest(request);
	} 
	catch(exception) 
	{
		console.error("ShowInfoWindow exc: " + exception);
	}
}

function HideInfoWindow()
{
	try 
	{
		var request = new Object();
		request.name = "HideInfoWindow";
		chrome.extension.sendRequest(request);
	} 
	catch(exception) 
	{
		console.error("HideInfoWindow exc: " + exception);
	}
}

function OnElementMouseAction(event)
{
	try 
	{
		if (!event) return;
		
		if (event.type == "mouseover" || event.type == "mousemove") 
		{
			if (!TimerId && event.target && event.target.attributes && 
				event.target.attributes.getNamedItem(HightlightedAttrUrl) &&
				event.target.attributes.getNamedItem(HightlightedAttrStatus) &&
				event.target.attributes.getNamedItem(HightlightedAttrSource) &&
				event.target.attributes.getNamedItem(HightlightedAttrCategories) &&
				event.target.attributes.getNamedItem(HightlightedAttrThreats))
			{
				var url = event.target.attributes.getNamedItem(HightlightedAttrUrl).value;
				var status = event.target.attributes.getNamedItem(HightlightedAttrStatus).value;
				var source = event.target.attributes.getNamedItem(HightlightedAttrSource).value;
				var categories = event.target.attributes.getNamedItem(HightlightedAttrCategories).value;
				var threats = event.target.attributes.getNamedItem(HightlightedAttrThreats).value;
			
				TimerId = window.setTimeout(ShowInfoWindow, ShowInfoWindowTimeout, url, status, source, categories, threats, event.screenX, event.screenY);
			}
		}
		else
		if (event.type == "mouseout") 
		{
			if (TimerId) 
			{
				window.clearTimeout(TimerId);
				TimerId = 0;
				HideInfoWindow();
			}
		}
	} 
	catch(exception) 
	{
		console.error("OnElementMouseAction exc: " + exception);
	}
}

function AttachEventsToLink(element)
{
	element.addEventListener("mouseover", OnElementMouseAction, false);
	element.addEventListener("mouseout", OnElementMouseAction, false);
	element.addEventListener("mousemove", OnElementMouseAction, false);
}

function IsLinkHightlighted(link)
{
	return (link.nextSibling != null) && 
			link.nextSibling.attributes &&
			link.nextSibling.attributes.getNamedItem("name") && 
			(link.nextSibling.attributes.getNamedItem("name").value == HightlightedElementName);
}

function UnhightlightLinks()
{
	var docLinks = document.links;
	for(var i=0; i < docLinks.length; i++)
	{
		UnhighlightLink(docLinks[i]);
	}
}

function UnhighlightLink(link)
{
	if (link.href == "javascript:void(0)" || !IsLinkHightlighted(link) || !link.parentNode) return;
	link.parentNode.removeChild(link.nextSibling);
}

function RightOf(s, rightLength)
{
	if (s.length < rightLength)
		return s;
		
	return s.substr(s.length - rightLength, rightLength);
}

function IsLocalHost(url)
{
	var hostname = ParseUrl(url).host;
	if (hostname == localHostname) 
	{
		return true;
	}
	
	return false;
}

function UpdateLocalHostName()
{
	localHostname = ParseUrl(location.href).host;
}

function GetElementTarget(element)
{
	return element == null ? '' :
		(element.attributes == null ? '' :
			(element.attributes.getNamedItem('target') == null ? '' : 
				element.attributes.getNamedItem('target').value));
}

function GetElementClass(element)
{
	return element == null ? '' :
		(element.attributes == null ? '' :
			(element.attributes.getNamedItem('class') == null ? '' : 
				element.attributes.getNamedItem('class').value));
}

function GetParentNodeName(element)
{
	return element == null ? '' :
		(element.parentNode == null ? '' : element.parentNode.nodeName);
}

function GetParentClass(parentLevel, element)
{
	if (element == null || element.parentNode == null)
		return '';
		
	var parent = element;
	for(var i=0; i <= parentLevel && parent != null; ++i)
	{
		parent = parent.parentNode;
	}
	
	return parent == null ? '' : GetElementClass(parent);
}

// TODO: move this implementation to a logic level
function IsSearchEngineResult(link)
{
	if (link == null) return false;
	
	var currentHost = ParseUrl(location.href).host.toLowerCase();
	var hostDomains = currentHost.split(".");
	
	var parentNodeName = GetParentNodeName(link).toLowerCase();
	var linkTarget = GetElementTarget(link).toLowerCase();
	var linkClass = GetElementClass(link).toLowerCase();
	var parentClass = GetParentClass(0, link).toLowerCase();
	var grandParentClass = GetParentClass(1, link).toLowerCase();
	var bigGrandClass = GetParentClass(2, link).toLowerCase();
	
	var isYandex = hostDomains.length == 2 && hostDomains[0] == 'yandex';
	if (isYandex && linkClass == 'b-serp-item__title-link' && parentNodeName == 'h2')
		return true;

	// example: http://ru.search.yahoo.com/search;_ylt=AnQ1vf8w7SWFWP_2lYklVIutk7x_?vc=&p=c%2B%2B&toggle=1&cop=mss&ei=UTF-8&fr=yfp-t-722
	var isYahoo = (hostDomains.length >= 2 && hostDomains[hostDomains.length-2] == 'yahoo');
	if (isYahoo && linkClass == 'yschttl spt')
		return true;

	var isYahooCo = (hostDomains.length >= 3 && hostDomains[hostDomains.length-3] == 'yahoo' && hostDomains[hostDomains.length-2] == 'co');
	if (isYahooCo && grandParentClass == 'hd' && parentNodeName == 'h3')
		return true;

	var isGoogle =
		(hostDomains.length >= 2 && hostDomains[hostDomains.length-2] == 'google') ||
		(hostDomains.length >= 3 && hostDomains[hostDomains.length-3] == 'google') ;

	if (isGoogle && parentNodeName == 'h3' && parentClass == 'r')
		return true;
		
	var isBing = hostDomains.length >= 2 && (hostDomains[hostDomains.length-1] == 'bing' || hostDomains[hostDomains.length-2] == 'bing');
	if (isBing && grandParentClass == 'sb_tlst')
		return true;

	var isMailRu = hostDomains.length >= 2 && hostDomains[hostDomains.length-2] == 'mail' && hostDomains[hostDomains.length-1] == 'ru';
	if (isMailRu && linkTarget == '_blank' && parentClass == 'res-head')
		return true;

	var isNigma = hostDomains.length >= 2 && hostDomains[hostDomains.length-2] == 'nigma' && hostDomains[hostDomains.length-1] == 'ru';
	if (isNigma && parentClass == "snippet_title")
		return true;

	var isRamblerRu = hostDomains.length >= 2 && hostDomains[hostDomains.length-2] == 'rambler' && hostDomains[hostDomains.length-1] == 'ru';
	if (isRamblerRu)
	{
		if (parentClass == 'b-serp__list_item_title' && bigGrandClass == 'b-serp__list')
		{
			return true;
		}
	}

	var isBaiduCom = hostDomains.length >= 2 && hostDomains[hostDomains.length-2] == 'baidu' && hostDomains[hostDomains.length-1] == 'com';
	var isBaiduJp = hostDomains.length >= 2 && hostDomains[hostDomains.length-2] == 'baidu' && hostDomains[hostDomains.length-1] == 'jp';
	if ((isBaiduCom && parentClass == "t") || (isBaiduJp && parentNodeName == 'h3' && grandParentClass == 'web'))
		return true;

	var isAskCom = hostDomains.length >= 2 && hostDomains[hostDomains.length-2] == 'ask' && hostDomains[hostDomains.length-1] == 'com';
	if (isAskCom && (bigGrandClass == "tsrc_tled" || bigGrandClass == "stm rmwi"))
		return true;

	return false;
}

function SetEnableHighlight(enable)
{
	//console.log("content.js: SetEnableHighlight " + enable);
	
	HighlightEnabled = enable;
	
	if (enable)
	{
		GetCheckPageEnable();
	}
	else
	{
		HighlightUpdate();
	}
}

function SetLinksMode(mode)
{
	//console.log("content.js: SetLinksMode " + mode);
	
	if (LinksMode != mode)
	{
		LinksMode = mode;
		
		UnhightlightLinks();
		HighlightUpdate();
	}
}

function GetCheckPageEnable()
{
	chrome.extension.sendRequest({name: "IsCheckPageEnabled", url: location.href}, function(response)
	{
		CheckPageEnable = response;
		
		//console.log("content.js: CheckPageEnable: "+response);
		
		HighlightUpdate();
	});
}

function Startup()
{
	try 
	{
		chrome.extension.sendRequest({name: "GetHighlightEnabled"}, function(response)
		{
			//console.log("Startup HighlightEnabled= " + response);
			SetEnableHighlight(response);
		});
		
		chrome.extension.sendRequest({name: "GetLinksMode"}, function(response)
		{
			//console.log("Startup LinksMode= " + response);
			SetLinksMode(response);
		});

		GetCheckPageEnable();
				
		chrome.extension.onRequest.addListener(
		function(request, sender, sendResponse) 
		{
			//console.log("content.js: listener: "+request.name);

			if (request.name == "ContentUpdate")
			{
				//console.log("content.js: ContentUpdate HighlightEnabled= " + HighlightEnabled);

				HighlightUpdate();
			}
			else
			if (request.name == "LinkCollection")
			{
				ProcessLinksInfo(request.linkCollection);
			}
			else
			if (request.name == "EnableHighlight")
			{
				SetEnableHighlight(request.enable);
			}
			else
			if (request.name == "SetLinksMode")
			{
				SetLinksMode(request.mode);
			}
			else
			{
				throw "chrome.extension.onRequest content.js has wrong request.name";
			}
		});
	} 
	catch(exception) 
	{
		console.error("Startup exc: " + exception);
	}
}
