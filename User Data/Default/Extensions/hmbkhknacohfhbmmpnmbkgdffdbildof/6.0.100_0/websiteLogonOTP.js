/*
 * @package 	websiteLogonOTP
 * @author      TrueSuite Team
 * @copyright (c) AuthenTec Inc.
 */
var websiteLogonOTP = {
	otpMap: {},
	isOTPMapInitialized: false,
	_currentOTPElements: null,
	
	processOTPPage: function(aURL, pageType, otpPageType) {
		console.log("<processOTPPage> entering tab URL: "+ aURL+ ", document URL:" + document.location.href);
		try {
			this.processOTPExt(document, pageType);
			this.processOTP(document, otpPageType);
		} catch(e) {
			console.error("<processOTPPage> Exception:"+e);
		}
	},
	
	processOTP: function(doc, lastPageType) {
		console.log("<processOTP> Entering...");
		this.initOTPMap();
		var otpElems = this.getOTPElements(doc, lastPageType);
		this._currentOTPElements = otpElems;
		if(typeof(otpElems)!="undefined"&&otpElems){
			console.log("<processOTP> otpElems isn't null.");
			if(!this.isProfileExist(doc.location.href)) {
				return false;
			}
			
			if(otpElems.formElement){
				if(otpElems.cidElement){
					console.log("<processOTP> set cid field.");
					var cid = this.getCredentialID();
					if(cid) {
						otpElems.cidElement.value = cid;
					} else {
						return false;
					}
				}
				
				if(otpElems.otp1Element){
					var otpCount = otpElems.otp2Element ? 2 : 1;
					websiteLogon.sendBG({ cmd: "getotp", otpnum: otpCount });
					return true;
				}
			}
		}
		return false;
	},

	fillOTP: function(otpString) {
		console.log("<fillOTP> entering...");
		if(otpString && this._currentOTPElements) {
			if (this._currentOTPElements.otp2Element) {
				var otpArr = otpString.split(">>>");
				console.log("<fillOTP> set two otp fields.");
				this._currentOTPElements.otp1Element.value = otpArr[0];
				this._currentOTPElements.otp2Element.value = otpArr[1];
			} else if (this._currentOTPElements.otp1Element){
				this._currentOTPElements.otp1Element.value = otpString;
			}
			
			if (this.submitGeicoForm(document)) {
				return true;
			}
			
			if(this.submitForm(this._currentOTPElements.formElement)){
				return true;
			}
		}
		
		return false;
	},
	
	getOTPElements: function(doc, lastPageType) {
		var pageType = "";
		var aURL = doc.location.href;
		var otpInfo = this.getOTPInfo(aURL);
		if(typeof(otpInfo)!="undefined" && otpInfo){
			if(aURL.toLowerCase().indexOf(otpInfo.LoginPages.OTPFormURL.toLowerCase()) > -1
				|| (aURL.indexOf("https://www.paypal.com/") > -1 && aURL.indexOf("cgi-bin/webscr?cmd=_login-submit&dispatch=") > -1)) {
				pageType = "logon";
			} else if (aURL.toLowerCase().indexOf(otpInfo.VIPCredentialRegistrationPage.URL.toLowerCase())>-1) {
				pageType = "activate";
			} else if (typeof(otpInfo.VIPCredentialDeactivationPage) != "undefined"
				&& aURL.toLowerCase().indexOf(otpInfo.VIPCredentialDeactivationPage.URL.toLowerCase())>-1) {
				pageType = "deactivate";
			} else if (typeof(otpInfo.LoginPages.OTPFailURL) != "undefined"
				&& aURL.toLowerCase().indexOf(otpInfo.LoginPages.OTPFailURL.toLowerCase()) > -1
				&& this.getFormByName(doc, otpInfo.LoginPages.OTPForm.Name)) {
				pageType = "logonfail";
			} else if (typeof(otpInfo.VIPCredentialRegistrationPage.OTPFailURL) != "undefined"
				&& aURL.toLowerCase().indexOf(otpInfo.VIPCredentialRegistrationPage.OTPFailURL.toLowerCase())>-1
				&& this.getFormByName(doc, otpInfo.VIPCredentialRegistrationPage.Form.Name)) {
				pageType = "activatefail";
			} else if (typeof(otpInfo.VIPCredentialDeactivationPage) != "undefined"
				&& aURL.toLowerCase().indexOf(otpInfo.VIPCredentialDeactivationPage.OTPFailURL.toLowerCase())>-1
				&& this.getFormByName(doc, otpInfo.VIPCredentialDeactivationPage.Form.Name)) {
				pageType = "deactivatefail";
			} else {
				for(var i = 0; i<otpInfo.LoginPages.URLs.length; i++) {
					if(aURL.toLowerCase().indexOf(otpInfo.LoginPages.URLs[i].URL.toLowerCase())> -1) {
						if(otpInfo.LoginPages.PasswordForm.OTPAppendToPassword) {
							pageType = "logonappend";
						}
						break;
					}
				}
			}
			
			websiteLogon.setOTPPageType(pageType);
			
			//Retry once
			if (pageType == lastPageType && (pageType == "logonfail" || pageType == "activatefail" || pageType == "deactivatefail")) {
				return null;
			}
		} else {
			console.log("<getOTPElements> otp information not found.");
			return null;
		}
		
		var otpElements = {};
		switch(pageType) {
			case "activate":
			case "activatefail":
				var aForm = null;
				var formId = otpInfo.VIPCredentialRegistrationPage.Form.ID;
				console.log("<getOTPElements> activate formId: " + formId);
				if(typeof(formId)!="undefined"&&formId){
					aForm = this.getFormById(doc, formId);
				}
				
				if(!aForm){
					var formName = otpInfo.VIPCredentialRegistrationPage.Form.Name;
					console.log("<getOTPElements> formName: " + formName);
					if(typeof(formName)!="undefined"&&formName){
						aForm = this.getFormByName(doc, formName);
					}
				}
				
				if(aForm){
					otpElements.formElement = aForm;
					
					///GET CID
					var cidInfo = otpInfo.VIPCredentialRegistrationPage.Form.CredentialIDFormInput;
					if(typeof(cidInfo)!="undefined"&&cidInfo){
						var cid = null;
						var cidId = cidInfo.ID;
						console.log("<getOTPElements> cidId: " + cidId);
						if(typeof(cidId)!="undefined"&&cidId){
							cid = this.getElementById(doc, cidId);
						}
						
						if(!cid){
							var cidName = cidInfo.Name;
							console.log("<getOTPElements> cidName: " + cidName);
							if(typeof(cidName)!="undefined"&&cidName){
								cid = this.getElementByName(aForm, cidName);
							}
						}
						
						if(cid){
							otpElements.cidElement = cid;
						}
					}
					
					///GET OTP1
					var otp1Info = otpInfo.VIPCredentialRegistrationPage.Form.OTPInput;
					if(typeof(otp1Info)!="undefined"&&otp1Info){
						var otp1 = null;
						var otp1Id = otp1Info.ID;
						console.log("<getOTPElements> otp1Id: " + otp1Id);
						if(typeof(otp1Id)!="undefined"&&otp1Id){
							otp1 = this.getElementById(doc, otp1Id);
						}
						
						if(!otp1){
							var otp1Name = otp1Info.Name;
							console.log("<getOTPElements> otp1Name: " + otp1Name);
							if(typeof(otp1Name)!="undefined"&&otp1Name){
								otp1 = this.getElementByName(aForm, otp1Name);
							}
						}
						
						if(otp1){
							otpElements.otp1Element = otp1;
						}
					}
					
					///GET OTP2
					var otp2Info = otpInfo.VIPCredentialRegistrationPage.Form.SecondOTPInput;
					if(typeof(otp2Info)!="undefined"&&otp2Info){
						var otp2 = null;
						var otp2Id = otp2Info.ID;
						console.log("<getOTPElements> otp2Id: " + otp2Id);
						if(typeof(otp2Id)!="undefined"&&otp2Id){
							otp2 = this.getElementById(doc, otp2Id);
						}
						
						if(!otp2){
							var otp2Name = otp2Info.Name;
							console.log("<getOTPElements> otp2Name: " + otp2Name);
							if(typeof(otp2Name)!="undefined"&&otp2Name){
								otp2 = this.getElementByName(aForm, otp2Name);
							}
						}
						
						if(otp2){
							otpElements.otp2Element = otp2;
						}
					}
				}
				break;
			case "logon":
			case "logonfail":
				var aForm = null;
				var formId = otpInfo.LoginPages.OTPForm.ID;
				console.log("<getOTPElements> logon formId: " + formId);
				if(typeof(formId)!="undefined"&&formId){
					aForm = this.getFormById(doc, formId);
				}
				
				if(!aForm){
					var formName = otpInfo.LoginPages.OTPForm.Name;
					console.log("<getOTPElements> formName: " + formName);
					if(typeof(formName)!="undefined"&&formName){
						aForm = this.getFormByName(doc, formName);
					}
				}
				
				if(aForm){
					otpElements.formElement = aForm;
					
					///GET CID
					var cidInfo = otpInfo.LoginPages.OTPForm.CredentialIDFormInput;
					if(typeof(cidInfo)!="undefined"&&cidInfo){
						var cid = null;
						var cidId = cidInfo.ID;
						console.log("<getOTPElements> cidId: " + cidId);
						if(typeof(cidId)!="undefined"&&cidId){
							cid = this.getElementById(doc, cidId);
						}
						
						if(!cid){
							var cidName = cidInfo.Name;
							console.log("<getOTPElements> cidName: " + cidName);
							if(typeof(cidName)!="undefined"&&cidName){
								cid = this.getElementByName(aForm, cidName);
							}
						}
						
						if(cid){
							otpElements.cidElement = cid;
						}
					}
					
					///GET OTP1
					var otp1Info = otpInfo.LoginPages.OTPForm.OTPInput;
					if(typeof(otp1Info)!="undefined"&&otp1Info){
						var otp1 = null;
						var otp1Id = otp1Info.ID;
						console.log("<getOTPElements> otp1Id: " + otp1Id);
						if(typeof(otp1Id)!="undefined"&&otp1Id){
							otp1 = this.getElementById(doc, otp1Id);
						}
						
						if(!otp1){
							var otp1Name = otp1Info.Name;
							console.log("<getOTPElements> otp1Name: " + otp1Name);
							if(typeof(otp1Name)!="undefined"&&otp1Name){
								otp1 = this.getElementByName(aForm, otp1Name);
							}
						}
						
						if(otp1){
							otpElements.otp1Element = otp1;
						}
					}
					
					///GET OTP2
					var otp2Info = otpInfo.LoginPages.OTPForm.SecondOTPInput;
					if(typeof(otp2Info)!="undefined"&&otp2Info){
						var otp2 = null;
						var otp2Id = otp2Info.ID;
						console.log("<getOTPElements> otp2Id: " + otp2Id);
						if(typeof(otp2Id)!="undefined"&&otp2Id){
							otp2 = this.getElementById(doc, otp2Id);
						}
						
						if(!otp2){
							var otp2Name = otp2Info.Name;
							console.log("<getOTPElements> otp2Name: " + otp2Name);
							if(typeof(otp2Name)!="undefined"&&otp2Name){
								otp2 = this.getElementByName(aForm, otp2Name);
							}
						}
						
						if(otp2){
							otpElements.otp2Element = otp2;
						}
					}
				}
				break;
			case "deactivate":
			case "deactivatefail":
				var aForm = null;
				var formId = otpInfo.VIPCredentialDeactivationPage.Form.ID;
				console.log("<getOTPElements> activate formId: " + formId);
				if(typeof(formId)!="undefined"&&formId){
					aForm = this.getFormById(doc, formId);
				}
				
				if(!aForm){
					var formName = otpInfo.VIPCredentialDeactivationPage.Form.Name;
					console.log("<getOTPElements> formName: " + formName);
					if(typeof(formName)!="undefined"&&formName){
						aForm = this.getFormByName(doc, formName);
					}
				}
				
				if(aForm){
					otpElements.formElement = aForm;
					
					///GET CID
					var cidInfo = otpInfo.VIPCredentialDeactivationPage.Form.CredentialIDFormInput;
					if(typeof(cidInfo)!="undefined"&&cidInfo){
						var cid = null;
						var cidId = cidInfo.ID;
						console.log("<getOTPElements> cidId: " + cidId);
						if(typeof(cidId)!="undefined"&&cidId){
							cid = this.getElementById(doc, cidId);
						}
						
						if(!cid){
							var cidName = cidInfo.Name;
							console.log("<getOTPElements> cidName: " + cidName);
							if(typeof(cidName)!="undefined"&&cidName){
								cid = this.getElementByName(aForm, cidName);
							}
						}
						
						if(cid){
							otpElements.cidElement = cid;
						}
					}
					
					///GET OTP1
					var otp1Info = otpInfo.VIPCredentialDeactivationPage.Form.OTPInput;
					if(typeof(otp1Info)!="undefined"&&otp1Info){
						var otp1 = null;
						var otp1Id = otp1Info.ID;
						console.log("<getOTPElements> otp1Id: " + otp1Id);
						if(typeof(otp1Id)!="undefined"&&otp1Id){
							otp1 = this.getElementById(doc, otp1Id);
						}
						
						if(!otp1){
							var otp1Name = otp1Info.Name;
							console.log("<getOTPElements> otp1Name: " + otp1Name);
							if(typeof(otp1Name)!="undefined"&&otp1Name){
								otp1 = this.getElementByName(aForm, otp1Name);
							}
						}
						
						if(otp1){
							otpElements.otp1Element = otp1;
						}
					}
					
					///GET OTP2
					var otp2Info = otpInfo.VIPCredentialDeactivationPage.Form.SecondOTPInput;
					if(typeof(otp2Info)!="undefined"&&otp2Info){
						var otp2 = null;
						var otp2Id = otp2Info.ID;
						console.log("<getOTPElements> otp2Id: " + otp2Id);
						if(typeof(otp2Id)!="undefined"&&otp2Id){
							otp2 = this.getElementById(doc, otp2Id);
						}
						
						if(!otp2){
							var otp2Name = otp2Info.Name;
							console.log("<getOTPElements> otp2Name: " + otp2Name);
							if(typeof(otp2Name)!="undefined"&&otp2Name){
								otp2 = this.getElementByName(aForm, otp2Name);
							}
						}
						
						if(otp2){
							otpElements.otp2Element = otp2;
						}
					}
				}
				break;
			case "logonappend":
				otpElements = null;
				break;
			default:
				break;
		}
		
		return otpElements;
	},
	
	getFormById: function(doc, formId) {
		var aForm = doc.getElementById(formId);
		if(typeof(aForm)!="undefined" && aForm && aForm.tagName == "form") {
			return aForm;
		}
		
		return null;
	},
	
	getFormByName: function(doc, formName) {
		var formArr = doc.forms;
		for(var i=0; i<formArr.length; i++) {
			console.log("<getOTPElements> formArr[i].name: " + formArr[i].name);
			if(formArr[i].name == formName){
				return formArr[i];
			}
		}
		
		return null;
	},
	
	getElementById: function(doc, elemId) {
		var elem = doc.getElementById(elemId);
		if(typeof(elem)!="undefined" && elem && elem.tagName == "input" && elem.type == "text") {
			return elem;
		}
		
		return null;
	},
	
	getElementByName: function(aForm, elemName) {
		var elemArr = aForm.getElementsByTagName("input");
		console.log("<getElementByName> elemArr.length: " + elemArr.length);
		if(elemArr.length != 0){
			for(var i=0; i<elemArr.length; i++){
				console.log("<getElementByName> elemArr[i].name: " + elemArr[i].name);
				if(elemArr[i].type == "text" && elemArr[i].name == elemName){
					return elemArr[i];
				}
			}
		} else {
			elemArr = aForm.elements;
			console.log("<getElementByName> aForm.elements.length: " + elemArr.length);
			for(var i=0; i<elemArr.length; i++){
				console.log("<getElementByName> elemArr[i].name: " + elemArr[i].name);
				if(elemArr[i].type == "text" && elemArr[i].name == elemName){
					return elemArr[i];
				}
			}
		}
		
		return null;
	},
	
	submitForm: function(aForm) {
		if(typeof(aForm) == "undefined" || !aForm) {
			return false;
		}
		
		var isSubmitted = false;
		var formElems = aForm.elements;
		for (var i = 0; i < formElems.length; i++) {
			if ((formElems[i].type == "submit")) {
				formElems[i].click();
				isSubmitted = true;
				break;
			}
		}
		
		if (!isSubmitted) {
			var inputElems = aForm.getElementsByTagName("input");
			for (var j = 0; j < inputElems.length; j++) {
				if (inputElems[j].type == "image") {
					inputElems[j].click();
					isSubmitted = true;
					break;
				}
			}
		}
		
		return isSubmitted;
	},
	
	//GEICO's form submit
	submitGeicoForm: function (doc) {
		if (doc.location.href.indexOf("service.geico.com")) {
			var submitBtn = doc.getElementById("form:btnLogin");
			if (!submitBtn) {
				//activate page
				submitBtn = doc.getElementById("form:btnActivate");
				if (submitBtn) {
					var otpField = doc.getElementById("form:securityCode");
					if(otpField.focus) {
						otpField.focus();
					}
					
					if(otpField.blur) {
						otpField.blur();
					}
				}
			}
			
			if (submitBtn) {
				if(!submitBtn.click) {
					var ev = document.createEvent('HTMLEvents');
					ev.initEvent('click', false, true);
					submitBtn.dispatchEvent(ev);
				}	else {
					submitBtn.click();
				}
				
				return true;
			}
		}
		
		return false;
	},
	
	initOTPMap: function() {
		console.log("<initOTPMap> Entering...");
		try {
			if(this.isOTPMapInitialized) {
				return;
			}
					
			this.isOTPMapInitialized = true;
			var otpArr = OTPList.VIPRelyingPartyList.VIPRelyingParty;
			console.log("<initOTPMap> otpArr.length = "+otpArr.length);
			for(var i = 0; i<otpArr.length; i++){
				var key = this.getShortAddr(otpArr[i].VIPCredentialRegistrationPage.URL);
				this.otpMap[key] = otpArr[i];
			}
		} catch (e) {
			console.error("<initOTPMap> Exception: " + e);
		}
	},
	
	getOTPInfo: function(aURL) {
		var key = this.getShortAddr(aURL);
		return this.otpMap[key];
	},
	
	getShortAddr: function (aURL){
		var shortAddr = aURL;
		if(typeof(shortAddr)!="undefined"&&shortAddr) {
			if (shortAddr.indexOf("//") > -1) {
				shortAddr = shortAddr.split("//")[1];
			}

			if (shortAddr.indexOf("/") > -1) {
				shortAddr = shortAddr.split("/")[0];
			}
		} else {
			return "";
		}
		return shortAddr;
	},
	
	////////////////////////////////////////////////////////////////
	///For extend page
	////////////////////////////////////////////////////////////////
	currentURL: "",
	_otpPromptType: null,
	
	processOTPExt: function(doc, pageType) {
		console.log("<processOTPExt> Entering...");
		var aURL = doc.location.href;
		if(aURL.indexOf(PayPalSignInProcessHistoryUrl)>-1 || aURL.indexOf(PayPalSignInProcessOverviewUrl)>-1) {
			return false;
		}
		
		this._otpPromptType = null;
		
		this.currentURL = aURL;

		switch (pageType) {
			case "PAGE_TYPE_EBAY_SIGNIN":
				this.processEbaySignInPage(doc);
				break;
			case "PAGE_TYPE_EBAY_OTPACTIVATE":
				this.processEbayOTPActivatePage(doc);
				break;
			case "PAGE_TYPE_EBAY_OTPDEACTIVATE":
				this.processEbayOTPDeactivatePage(doc);
				break;
		
			case "PAGE_TYPE_PAYPAL_SIGNIN":
				this.processPaypalSignInPage(doc);
				break;
			case "PAGE_TYPE_PAYPAL_OTPACTIVATE":
				this.processPaypalOTPActivatePage(doc);
				break;
			case "PAGE_TYPE_PAYPAL_OTPDEACTIVATE":
				this.processPaypalOTPDeactivatePage(doc);
				break;
				
			case "PAGE_TYPE_TBANK_SIGNIN":
				this.processTBankSignInPage(doc);
				break;
			case "PAGE_TYPE_TBANK_OTPACTIVATE":
				this.processTBankOTPActivatePage(doc);
				break;
			case "PAGE_TYPE_TBANK_OTPDEACTIVATE":
				this.processTBankOTPDeactivatePage(doc);
				break;
				
			case "PAGE_TYPE_GEICO_SIGNIN":
				this.processGeicoSignInPage(doc);
				break;
			case "PAGE_TYPE_GEICO_OTPACTIVATE":
			 this.processGeicoOTPActivatePage(doc);
			 	break;
				
			default:
				break;
		}
	
		var currentPageType = this.getPageType(doc);
		console.log("<processOTPExt> currentPageType: "+currentPageType+", lastPageType: "+pageType);
		websiteLogon.setPageType(currentPageType);
		return true;
	},

	getPageType: function(doc) {
		var pageType = "";
		var aURL = this.currentURL;
		//eBay
		if ((aURL.indexOf(eBaySignInUrl) > -1 && this.isPasswordExist(doc))
			|| (aURL.indexOf(eBayOTPLogonUrl) > -1 && !this.getFormByName(doc, eBayOTPLogonForm))) {
			pageType = "PAGE_TYPE_EBAY_SIGNIN";
			console.log("this page is eBay sigin page");
		}
		else if ((aURL.indexOf(eBayOTPActivateUrl) > -1 || aURL.indexOf(eBayOTPActivateFailedUrl) > -1) && this.getFormByName(doc, eBayOTPActivateForm)) {
			pageType = "PAGE_TYPE_EBAY_OTPACTIVATE";
			console.log("this page is eBay OTP activate page");
		}
		else if ((aURL.indexOf(eBayOTPDeactivateUrl) > -1 || aURL.indexOf(eBayOTPActivateFailedUrl) > -1) && this.getFormByName(doc, eBayOTPDeactivateForm)) {
			pageType = "PAGE_TYPE_EBAY_OTPDEACTIVATE";
			console.log("last page is eBay OTP deactivate page");
		}
		//PayPal
		else if (aURL.indexOf(PayPalSignInUrl) > -1 && this.isPasswordExist(doc)) {
			pageType = "PAGE_TYPE_PAYPAL_SIGNIN";
			console.log("this page is PayPal sigin page");
		}
		else if ((aURL.indexOf(PayPalOTPActivateUrl) > -1 || aURL.indexOf(PayPalOTPActivateFailedUrl) > -1) && this.getFormByName(doc, PayPalOTPActivateForm)) {
			pageType = "PAGE_TYPE_PAYPAL_OTPACTIVATE";
			console.log("this page is PayPal activate page");
		}
		//else if (aURL.indexOf(PayPalOTPDeactivateUrl) > -1) {
		//	pageType = "PAGE_TYPE_PAYPAL_OTPDEACTIVATE";
		//	alert("last page is PayPal deactivate page");
		//}
		else if (aURL.indexOf(TBankSignInUrl) > -1 && this.isPasswordExist(doc)) {
			pageType = "PAGE_TYPE_TBANK_SIGNIN";
		}
		else if ((aURL.indexOf(TBankOTPActivateUrl) > -1 || aURL.indexOf(TBankOTPActivateFailedUrl) > -1) && this.getFormByName(doc, TBankOTPForm)) {
			pageType = "PAGE_TYPE_TBANK_OTPACTIVATE";
		}
		//else if (aURL.indexOf(TBankOTPDeactivateUrl) > -1) {
		//	ePageType = "PAGE_TYPE_TBANK_OTPDEACTIVATE";
		//}
		else if (aURL.indexOf(GeicoSignInUrl) > -1 && this.isPasswordExist(doc)) {
			pageType = "PAGE_TYPE_GEICO_SIGNIN";
		}
		else if (aURL.indexOf(GeicoOTPActivateUrl) > -1 && this.getFormByName(doc, GeicoOTPForm)) {
			pageType = "PAGE_TYPE_GEICO_OTPACTIVATE";
		}
		
		return pageType;
	},
	
	//<a href="https://signin.ebay.com/ws/eBayISAPI.dll?SignIn" rel="nofollow">Sign out</a>
	//<a href="https://signin.ebay.com/ebaymotors/ws/eBayISAPI.dll?SignIn" rel="nofollow">Sign out</a>
	processEbaySignInPage: function(doc) {
		//1. If next page is OTP logon page, set activate flag to enabled(if the flag is unkown).
		if(this.currentURL.indexOf(eBayOTPLogonUrl) > -1) {
			if(this.getFormByName(doc, eBayOTPLogonForm)) {
				//alert("eBay OTP activated!");
	
				//Check if database is existed, set otp activate flag status.
				if(this.setOTPActivateStatus(eBaySignInUrl, true)) {
					console.log("ProcessEbaySignInPage SetVIPActivateStatus successfully.");
				}
	
				return true;
			}
		}
	
		//2. If next page is logon page, show UI to guide user to activate page.
		var anchorArr = doc.getElementsByTagName("a");
		for(var i = 0; i < anchorArr.length; i++) {
			if (anchorArr[i].innerHTML == "Sign out") {
				var aHref = anchorArr[i].href;
				if(aHref.indexOf(eBaySignOutUrl) > -1 || aHref.indexOf(eBaySignOutMotorUrl) > -1) {
					console.log("ProcessEbaySignInPage Href: "+aHref);

					//Check if profile had been saved.
					if(1 != this.isProfileExist(eBaySignInUrl)) {
						this._otpPromptType="ebay";
						return false;
					}

					//Check if database is existed, otp activate flag status.
					if(this.launchOTPPromptUI(eBaySignInUrl, true)) {
						window.location = eBayOTPActivateNavigateUrl;
					}
					
					return true;
				}
			}
		}
		
		return false;
	},
	
	processEbayOTPActivatePage: function(doc) {
		if (this.currentURL.indexOf(eBayOTPActivateSucceedUrl) > -1) {
			//alert("eBay activate successfully!");
	
			//Check if database is existed, set otp activate flag status.
			if(this.setOTPActivateStatus(eBaySignInUrl, true)) {
				console.log("ProcessEbayOTPActivatePage SetVIPActivateStatus successfully.");
			}
	
			return true;
		}
	
		return false;
	},
	
	processEbayOTPDeactivatePage: function(doc) {
		if (this.currentURL.indexOf(eBayOTPDeactivateSucceedUrl) > -1) {
			//alert("eBay deactivate successful!");
	
			//Check if database is existed, set otp activate flag status.
			if(this.setOTPActivateStatus(eBaySignInUrl, false)) {
				console.log("ProcessEbayOTPDeactivatePage SetVIPActivateStatus successfully.");
			}
	
			return true;
		}
	
		return false;
	},
	
	processPaypalSignInPage: function(doc) {
		//1. If next page is OTP logon page, set activate flag to enabled(if the flag is unkown).
		if(this.currentURL.indexOf(PayPalOTPLogonUrl) > -1) {
			if(this.getFormByName(doc, PayPalOTPLogonForm)) {
				//alert("PayPal OTP activated!");
	
				//Check if database is existed, set otp activate flag status.
				if(this.setOTPActivateStatus(this.currentURL, true)) {
					console.log("ProcessPaypalSignInPage SetVIPActivateStatus successfully.");
				}
				
				return true;
			}
		}
	
		//2. If next page is logoned page, show UI to guide user to activate page.
		if(this.currentURL.indexOf(PayPalSignInSucceedOverviewUrl) > -1 
			|| this.currentURL.indexOf(PayPalSignInSucceedHistoryUrl) > -1) {

			//Check if profile had been saved.
			if(1 != this.isProfileExist(this.currentURL)) {
				this._otpPromptType="paypal";
				return false;
			}

			//Check if database is existed, otp activate flag status.
			if(this.launchOTPPromptUI(this.currentURL, false)) {
				window.location = PayPalOTPActivateNavigateUrl;
			}

			return true;
		}

		return false;
	},
	
	processPaypalOTPActivatePage: function(doc) {
		if (this.currentURL.indexOf(PayPalOTPActivateSucceedUrl) > -1) {
			if(this.getFormByName(doc, PayPalOTPStatusForm)) {
				//alert("PayPal activate successfully!");
				
				//Check if database is existed, set otp activate flag status.
				if(this.setOTPActivateStatus(this.currentURL, true)) {
					console.log("ProcessPaypalOTPActivatePage SetVIPActivateStatus successfully.");
				}
	
				return true;
			}
		}
	
		return false;
	},
	
	processPaypalOTPDeactivatePage: function(doc) {
		if (this.currentURL.indexOf(PayPalOTPDeactivateSucceedUrl) > -1) {
			//alert("PayPal deactivate successfully!");
	
			//Check if database is existed, set otp activate flag status.
			if(this.setOTPActivateStatus(this.currentURL, false)) {
				console.log("ProcessPaypalOTPDeactivatePage SetVIPActivateStatus successfully.");
			}
	
			return true;
		}
	
		return false;
	},
	
	processTBankSignInPage: function(doc) {
		//1. If next page is OTP logon page, set activate flag to enabled(if the flag is unkown).
		if(this.currentURL.indexOf(TBankOTPLogonUrl) > -1) {
			if(this.getFormByName(doc, TBankOTPForm)) {
				//alert("Trusted bank OTP activated!");
	
				//Check if database is existed, set otp activate flag status.
				if(this.setOTPActivateStatus(this.currentURL, true)) {
					console.log("processTBankSignInPage SetVIPActivateStatus successfully.");
				}
	
				return true;
			}
		}
	
		//2. If next page is logon page, show UI to guide user to activate page.
		if(this.currentURL.indexOf(TBankSignInUrl) > -1 && !this.isPasswordExist(doc)) {
			var anchorArr = doc.getElementsByTagName("a");
			for(var i = 0; i < anchorArr.length; i++) {
				if (anchorArr[i].outerHTML.indexOf("goToSignOut")) {
					//Check if profile had been saved.
					if(1 != this.isProfileExist(this.currentURL)) {
						this._otpPromptType="trusted-bank";
						return false;
					}

					//Check if database is existed, otp activate flag status.
					if(this.launchOTPPromptUI(this.currentURL, false)) {
						window.location = TBankOTPActivateNavigateUrl;
					}
					
					return true;
				}
			}
		}
		
		return false;
	},
	
	processTBankOTPActivatePage: function(doc) {
		if (this.currentURL.indexOf(TBankOTPActivateSucceedUrl) > -1) {
			//alert("Trusted bank activate successfully!");
			
			//Check if database is existed, set otp activate flag status.
			if(this.setOTPActivateStatus(this.currentURL, true)) {
					console.log("processTBankOTPActivatePage SetVIPActivateStatus successfully.");
			}
			
			return true;
		}
		
		return false;
	},
	
	processTBankOTPDeactivatePage: function(doc) {
		return false;
	},
	
	processGeicoSignInPage: function(doc) {
		//1. If next page is OTP logon page, set activate flag to enabled(if the flag is unkown).
		if(this.currentURL.indexOf(GeicoSignInSucceedUrl) > -1) {
			if(doc.getElementById("form:securityCode")) {
				//alert("GEICO OTP activated!");
	
				//Check if database is existed, set otp activate flag status.
				if(this.setOTPActivateStatus(this.currentURL, true)) {
					console.log("processGeicoSignInPage SetVIPActivateStatus successfully.");
				}
	
				return true;
			}
		}
	
		//2. If next page is logon page, show UI to guide user to activate page.
		if(this.currentURL.indexOf(GeicoSignInSucceedUrl) > -1) {
			if(doc.getElementById("form:view_logOut")) {
				//Check if profile had been saved.
				if(1 != this.isProfileExist(this.currentURL)) {
					this._otpPromptType="geico";
					return false;
				}
			
				//Check if database is existed, otp activate flag status.
				if(this.launchOTPPromptUI(this.currentURL, false)) {
					window.location = GeicoOTPActivateNavigateUrl;
				}
				
				return true;
			}
		}
		
		return false;
	},
	
	processGeicoOTPActivatePage: function(doc) {
		if (this.currentURL.indexOf(GeicoOTPActivateReturnUrl) > -1) {
			if(doc.getElementById("form:tokenId")) {
				//this.currentURL = this.lastURL;
			} else {
				//alert("GEICO activate successfully!");
				
				//Check if database is existed, set otp activate flag status.
				if(this.setOTPActivateStatus(this.currentURL, true)) {
					console.log("processGeicoOTPActivatePage SetVIPActivateStatus successfully.");
				}
			}
			
			return true;
		}
		
		return false;
	},

	processVIPPrompt: function() {
		if(this._otpPromptType) {
			if(this.launchOTPPromptUI(this.currentURL, (this._otpPromptType=="ebay"?true:false))) {
				switch(this._otpPromptType) {
					case "ebay":
						window.location = eBayOTPActivateNavigateUrl;
						break;
					case "paypal":
						window.location = PayPalOTPActivateNavigateUrl;
						break;
					case "trusted-bank":
						window.location = TBankOTPActivateNavigateUrl;
						break;
					case "geico":
						window.location = GeicoOTPActivateNavigateUrl;
						break;
				}
			}
		}
	},

	isPasswordExist: function(doc) {
		console.log("<isPasswordExists> Entering");

		var formArray = doc.forms;
		//console.log("<isPasswordExistsInDocument> form length:"+formArray.length);
		for (var l = 0; l < formArray.length; l++) {
			if (this.isOnePasswordAndTextForm(formArray[l])) {
				return true;
			}
		}

		return false;
	},
	
	isOnePasswordAndTextForm: function(aForm) {
		var passwordCount = 0;
		var textCount = 0;
		var inputArr = aForm.getElementsByTagName("input");
		if (inputArr.length == 0) {
			inputArr = aForm.elements;
		}
		
		for (var i = 0; i < inputArr.length; i++) {
			var vType = inputArr[i].type;
			if (vType == "password") {
				console.log("<isOnePasswordAndTextForm> found password.");
				passwordCount++;
			} else if (vType == "text" || vType == "email") {
				console.log("<isOnePasswordAndTextForm> found text.");
				textCount++;
			}
			
			if (passwordCount > 1 || textCount > 1) {
				break;
			}
		}
		
		if (passwordCount == 1 && textCount == 1) {
			return true;
		}
		
		return false;
	},

	getCredentialID: function() {
		console.log('<getCredentialID> entering...');
		try {
			websiteLogon.addEmbed();
			var embed = document.getElementById("embed_npwlo");
			if(embed) {
				var result = embed.GetCredentialID();
				if (typeof(result) != "undefined" && result) {
					console.log('<getCredentialID> result: '+ result);
					return result;
				}
			}
		} catch (e) {
			console.error("<getCredentialID> Exception:" + e);
		}
		
		return "";
	},
	
	setOTPActivateStatus: function(aURL, bActivated) {
		console.log('<setOTPActivateStatus> --'
					+ ' url: ' 			+ aURL);
		try {
			websiteLogon.addEmbed();
			var embed = document.getElementById("embed_npwlo");
			console.log('<setOTPActivateStatus> 1');
			if(embed) {
				var bRes = embed.SetOTPActivateStatus(aURL, bActivated);
				console.log('<setOTPActivateStatus> bRes: '+ bRes);
				return bRes;
			}
		} catch (e) {
			console.error("<setOTPActivateStatus> Exception:" + e);
		}
		
		return false;
	},
	
	launchOTPPromptUI: function(aURL, bCheckActived) {
		console.log('<launchOTPPromptUI> entering --'
					+ ' url: ' 			+ aURL);
		try {
			websiteLogon.addEmbed();
			var embed = document.getElementById("embed_npwlo");
			if(embed) {
				var bRes = embed.LaunchOTPPromptUI(aURL, bCheckActived);
				console.log('<launchOTPPromptUI> bRes: '+ bRes);
				return bRes;
			}
		} catch (e) {
			console.error("<launchOTPPromptUI> Exception:" + e);
		}
		
		return false;
	},
	
	isProfileExist: function(aURL) {
		console.log('<isProfileExist> --'
					+ ' url: ' 			+ aURL);
		try {
			websiteLogon.addEmbed();
			var embed = document.getElementById("embed_npwlo");
			if(embed) {
				var bRes = embed.IsProfileExist(aURL);
				console.log('<isProfileExist> bRes: '+ bRes);
				return bRes;
			}
		} catch (e) {
			console.error("<isProfileExist> Exception:" + e);
		}
		
		return false;
	},
};

const eBaySignInUrl = "https://signin.ebay.com/ws/eBayISAPI.dll?SignIn";
const eBayOTPLogonForm = "signInForm";
const eBayOTPActivateForm = "ActivateSecurityToken";
const eBayOTPDeactivateForm = "Deact-ResyncToken";

const eBayOTPActivateUrl = "signin.ebay.com/ws/eBayISAPI.dll?ActivateSecurityToken";
const eBayOTPDeactivateUrl = "signin.ebay.com/ws/eBayISAPI.dll?DeactivateSecurityToken";
const eBayOTPLogonUrl = "signin.ebay.com/ws/eBayISAPI.dll?co_partnerId=2&siteid=0&UsingSSL=1";
	
const eBaySignInSucceedUrl = "signin.ebay.com/ws/eBayISAPI.dll?SignInRTMMessage&ru=";
const eBayOTPActivateSucceedUrl = "my.ebay.com/ws/eBayISAPI.dll?MyeBay&tokenid=46&CurrentPage=MyeBayPersonalInfo&ssPageName=successTokenActivation";
const eBayOTPDeactivateSucceedUrl =	"my.ebay.com/ws/eBayISAPI.dll?MyeBay&tokenid=47&CurrentPage=MyeBayPersonalInfo&ssPageName=successTokenDeactivation";
const eBayOTPActivateFailedUrl = "signin.ebay.com/ws/eBayISAPI.dll";

const eBayOTPActivateNavigateUrl = "https://signin.ebay.com/ws/eBayISAPI.dll?ActivateSecurityToken";

const eBaySignOutUrl = "signin.ebay.com/ws/eBayISAPI.dll?SignIn";
const eBaySignOutMotorUrl = "signin.ebay.com/ebaymotors/ws/eBayISAPI.dll?SignIn";

const PayPalSignInUrl = "www.paypal.com";
const PayPalOTPLogonForm = "security_form";
const PayPalOTPActivateForm = "activate_security_form";
const PayPalOTPDeactivateForm = "form2";
const PayPalOTPStatusForm = "securityKeyStatus";

const PayPalSignInProcessHistoryUrl = "history.paypal.com/us/cgi-bin/webscr?cmd=_login-processing&login_cmd=";
const PayPalSignInProcessOverviewUrl = "www.paypal.com/us/cgi-bin/webscr?cmd=_login-processing&login_cmd=";

const PayPalOTPActivateUrl = "www.paypal.com/us/cgi-bin/webscr?cmd=_activate-security-key-any";
//https://www.paypal.com/us/cgi-bin/webscr?dispatch=5885d80a13c0db1f8e263663d3faee8dc60d77e6184470d515cedf52660ea0cd
const PayPalSignInSucceedOverviewUrl = "www.paypal.com/us/cgi-bin/webscr?cmd=_login-done&login_access=";
const PayPalSignInSucceedHistoryUrl = "history.paypal.com/us/cgi-bin/webscr?cmd=_history";

const PayPalOTPLogonUrl = "www.paypal.com/cgi-bin/webscr?cmd=_login-submit&dispatch=";

const PayPalOTPDeactivateUrl = "www.paypal.com/us/cgi-bin/webscr?dispatch=";
const PayPalOTPActivateSucceedUrl = "www.paypal.com/us/cgi-bin/webscr?dispatch=";
const PayPalOTPDeactivateSucceedUrl = "www.paypal.com/us/cgi-bin/webscr?dispatch=";
const PayPalOTPActivateFailedUrl = "www.paypal.com/us/cgi-bin/webscr?dispatch=";

const PayPalOTPActivateNavigateUrl = "https://www.paypal.com/us/cgi-bin/webscr?cmd=_activate-security-key-any";

///TrustedBank
const TBankSignInUrl = "https://www.trusted-bank.com/trustedbank/app";
const TBankOTPActivateUrl = "https://www.trusted-bank.com/trustedbank/app?x=wi1Y7RONlx-l-ZRWNfKkjbWagnCInLvv3bituySizZXZF*M7k6lbYQ";

const TBankOTPForm = "form";

const TBankOTPLogonUrl = "https://www.trusted-bank.com/trustedbank/app?x=wi1Y7RONlx-l-ZRWNfKkjYVC2khIj9GBSHlKKtJz4-A";
const TBankOTPActivateNavigateUrl = "https://www.trusted-bank.com/trustedbank/app?x=wi1Y7RONlx-l-ZRWNfKkjbWagnCInLvv3bituySizZXZF*M7k6lbYQ";
const TBankOTPActivateSucceedUrl = "https://www.trusted-bank.com/trustedbank/app?x=tpTCdGeLG1M";
const TBankOTPActivateFailedUrl = "https://www.trusted-bank.com/trustedbank/app?x=*6e2dpTK6fI";

///GEICO
const GeicoSignInUrl ="service.geico.com/insite/";
const GeicoSignInSucceedUrl = "service.geico.com/insite/login.xhtml";
const GeicoOTPActivateUrl = "service.geico.com/insite/vipActivate.xhtml";

const GeicoOTPForm = "form";

const GeicoOTPActivateNavigateUrl = "https://service.geico.com/insite/vipActivate.xhtml";
const GeicoOTPActivateReturnUrl = "service.geico.com/insite/vipActivate.xhtml";