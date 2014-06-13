/*
 * @package     websiteLogon
 * @author      TrueSuite Team
 * @copyright (c) AuthenTec Inc.
 */
var websiteLogon = {
    _currentPort: null,
    _currentDocNum: 0,
    _currentTabUrl: null,
    _configHelper: null,

    _cachedUserName: "",
    _cachedPassword: "",

    // Variable to define if the current page has submited by fill transaction:
    _isSubmitByLogon: false,

    initialize: function () {
        try {
            console.log("<initialize> Entering... url: " + document.location.href);
            this.connectBG();

            //special for hotmail.
            this.processHotmailPage();

            this.addFormClickListener();

            this.callToFIDOTokenCounter(document.location.href);

            //fill support page
            if (document.location.href == "http://support.authentec.com/a/TrueSuiteIssueReport.aspx") {
                this.sendBG({ cmd: "cs_supportpageload" });
            }
        } catch (e) {
            console.error("<initialize> Exception:" + e);
        }
    },

    connectBG: function () {
        console.log("<connectBG> Entering");
        this._currentPort = chrome.extension.connect({ name: document.location.href });
        if (typeof (this._currentPort) != "undefined" && this._currentPort) {
            console.log("<connectBG> connect BG, URL: " + document.location.href);
            this._currentPort.onMessage.addListener(function (msg) { websiteLogon.receiveBG(msg); });
            this._currentPort.onDisconnect.addListener(function () { websiteLogon.disconnectBG(); });
        }
    },

    disconnectBG: function () {
        if (this._currentPort) {
            this._currentPort.disconnect();
            this._currentPort = null;
        }
    },

    receiveBG: function (msg) {
        if (typeof (msg.cmd) == "undefined") {
            console.log("[BG -> CS] INVALIDMSG");
            return;
        } else {
            console.log("[BG -> CS] cmd: " + msg.cmd);
        }
        switch (msg.cmd) {
            case "document_connected":
                {
                    this._currentDocNum = msg.docnum;
                    this._currentTabUrl = msg.taburl;
                    this._cachedUserName = msg.cachedusername;
                    this._cachedPassword = msg.cachedpassword;
                    if (msg.docnum == 0) {	//only set once for one tab.
                        this.setWindow(msg.tabid);
                    }

                    //Get config file by AJAX.
                    var request = new XMLHttpRequest();
                    request.open("get", chrome.extension.getURL('config.json'), false);
                    request.send(null);

                    var strData = 'var config = ' + request.responseText;
                    eval(strData);
                    this._configHelper = new config_helper(config, this._currentTabUrl);

                    if (this._configHelper && this._configHelper.isSpecialSite()) {
                        console.log('<receiveBG> current website is special website. url:' + document.location.href + '.');
                        if (!this._configHelper.isUserNameExist() && this._configHelper.isPasswordExist() && this._cachedPassword) {
                            // Used for fill cached password.
                            this._configHelper.getPassword().value = this._cachedPassword;

                            //Ensure only try to submit once.
                            this._cachedPassword = "";
                            this.sendBG({ cmd: "resetcache", url: websiteLogon._currentTabUrl });

                            if (this._configHelper.getIsAutoLogin()) {
                                var elemLogon = this._configHelper.getSubmit();
                                var evt = document.createEvent("MouseEvents");
                                evt.initEvent("click", true, false);
                                elemLogon.dispatchEvent(evt);
                            }

                            return;
                        }

                        if (this._currentTabUrl == "https://www.bankofamerica.com/") {
                            this._configHelper.getUserName().addEventListener('blur', this.specialSiteBlurListener, false);
                        } else {
                            this._configHelper.getSubmit().addEventListener('click', this.specialSiteClickListener, false);
                        }

                        if (!this._configHelper.isUserNameExist() && this._configHelper.isPasswordExist()) {
                            return;
                        }

                        this.sendBG({
                            cmd: "cs_connected",
                            url: document.location.href,
                            passwordstatus: true,
                            bAJAXLogon: !this._configHelper.getIsRefreshOnLoginFailed()//Some website will not refresh when a user logon. so this kind of page should be distinguish from common.
                        });
                    } else {
                        //sendBG must call after document_connected, else docnum will be 0.
                        var passwordStatus = this.isPasswordExists();
                        this.sendBG({ cmd: "cs_connected", url: document.location.href, passwordstatus: passwordStatus });

                        //Some websites will show password form between "window.load" and "background.document_connected" event. such as "hotmail.com".
                        this.addFormClickListener();
                    }
                }
                break;
            case "tab_created":
                console.log("<receiveBG> tab_created");
                break;
            case "tab_selected":
                {
                    console.log("<receiveBG> tab_selected");
                    if (this._configHelper && this._configHelper.isSpecialSite()) {
                        console.log('<receiveBG> current website is special website. url:' + document.location.href + '.');
                        if (this._currentTabUrl == "https://www.bankofamerica.com/") {
                            this._configHelper.getUserName().addEventListener('blur', this.specialSiteBlurListener, false);
                        } else {
                            this._configHelper.getSubmit().addEventListener('click', this.specialSiteClickListener, false);
                        }

                        this.sendBG({ cmd: "cs_selected", url: document.location.href, passwordstatus: true });
                    } else {
                        var passwordStatus = this.isPasswordExists();
                        this.sendBG({ cmd: "cs_selected", url: document.location.href, passwordstatus: passwordStatus });
                    }
                }
                break;
            case "tab_closed":
                console.log("<receiveBG> tab_closed");
                break;
            case "logon_interval":
                {
                    console.log("<receiveBG> logon_interval");
                    if (this._configHelper && this._configHelper.isSpecialSite()) {
                        console.log('<receiveBG> current website is special website. url:' + document.location.href + '.');
                        if (this._currentTabUrl == "https://www.bankofamerica.com/") {
                            this._configHelper.getUserName().addEventListener('blur', this.specialSiteBlurListener, false);
                        } else {
                            this._configHelper.getSubmit().addEventListener('click', this.specialSiteClickListener, false);
                        }

                        this.sendBG({ cmd: "cs_interval", passwordstatus: true });
                    } else {
                        this.addFormClickListener();
                        var passwordStatus = this.isPasswordExists();
                        this.sendBG({ cmd: "cs_interval", passwordstatus: passwordStatus });
                    }
                }
                break;
            case "starttologon":
                console.log("<receiveBG> starttologon, docnum:" + this._currentDocNum + ", url: " + document.location.href);
                if (!this.isNotificationShowed()) {
                    this.sendBG({ cmd: "cs_logon", url: document.location.href });
                } else {
                    console.log("<receiveBG> starttologon logon running, url: " + document.location.href);
                }
                break;
            case "starttoprocessotp":
                console.log("<receiveBG> starttoprocessotp, pagetype: " + msg.pagetype + ", otppagetype: " + msg.otppagetype + ", url: " + document.location.href);
                websiteLogonOTP.processOTPPage(msg.url, msg.pagetype, msg.otppagetype);
                break;
            case "editwebcard":
                console.log("<receiveBG> editwebcard, url: " + document.location.href);
                this.editWebCard(msg.url);
                break;
            case "fillprofile":
                this._isSubmitByLogon = true;
                this.fillPasswordProfile(msg.formid, msg.username, msg.password, msg.issubmit);
                this._isSubmitByLogon = false;
                break;
            case "fillotp":
                websiteLogonOTP.fillOTP(msg.message);
                break;
            case "fillsupportinfo":
                this.fillSupportPage(document, msg.supportinfo);
                break;
            case "createframe":
                this.createNotification();
                break;
            case "hideframe":
                this.hideNotification();
                break;
            case "showframe":
                this.showNotification();
                break;
            case "processvipprompt":
                websiteLogonOTP.processVIPPrompt();
                break;
            default:
                break;
        }
    },

    sendBG: function (msg) {
        if (!this._currentPort) {
            console.log("CS -> BG : FAILED " + msg.cmd);
            return;
        } else {
            if (msg.passwordstatus) {
                console.log("<sendBG> msg.cmd:" + msg.cmd + ", docnum:" + this._currentDocNum + ", url:" + document.location.href);
            }
        }
        msg.docnum = this._currentDocNum;
        this._currentPort.postMessage(msg);
    },

    uninitailize: function () {
        try {
            console.log("<uninitailize> Entering");
        } catch (e) {
            //alert("<uninitailize> Exception:"+e);
        }
    },

    fillPasswordProfile: function (aFormId, aUserId, aPassword, iSubmit) {
        try {
            console.log("<fillPasswordProfile> Entering");
            if (aUserId == "" || aPassword == "" || iSubmit != 1) {
                return;
            }

            //The logon procession of special website.
            if (this._configHelper && this._configHelper.isSpecialSite()) {
                if (this._configHelper.isUserNameExist()) {
                    this._configHelper.getUserName().value = aUserId;
                }

                if (this._configHelper.isPasswordExist()) {
                    this._configHelper.getPassword().value = aPassword;
                } else {
                    this.sendBG({ cmd: "cachepassword", url: this._currentTabUrl, formid: '', password: aPassword });
                }

                if (this._configHelper.getIsAutoLogin()) {
                    var elemLogon = this._configHelper.getSubmit();
                    var evt = document.createEvent("MouseEvents");
                    evt.initEvent("click", true, false);
                    elemLogon.dispatchEvent(evt);
                }
                return;
            }

            var formArray = document.forms;
            for (var i = 0; i < formArray.length; i++) {
                if (!this.isOnePasswordAndTextForm(formArray[i]))
                    continue;

                if (this.fillPasswordForm(formArray[i], aFormId, aUserId, aPassword, iSubmit)) {
                    return;
                }
            }
        } catch (e) {
            console.error("<fillPasswordProfile> Exception:" + e);
        }
    },

    fillPasswordForm: function (aForm, aFormId, aUserId, aPassword, iSubmit) {
        try {
            console.log("<fillPasswordForm> Entering... formname: " + aForm.name);
            if (aUserId == "" || aPassword == "" || iSubmit != 1) {
                return false;
            }

            var useridField = null;
            var isFilled = false;
            try {
                var inputElements = aForm.getElementsByTagName("input");
                if (inputElements.length == 0) {
                    var inputElements = aForm.elements;
                }
                console.log("<fillPasswordForm> inputElements.length=" + inputElements.length + ", aForm.name=" + aForm.name);
                for (var i = 0; i < inputElements.length; i++) {
                    if (inputElements[i].type == "password") {
                        console.log("<fillPasswordForm> found password!!");
                        if (useridField != null) {
                            useridField.value = aUserId;
                        }

                        inputElements[i].value = aPassword;
                        isFilled = true;
                        break;
                    }

                    // add type email for vemio website, chrome seems not detect type correctly
                    if (inputElements[i].type.toLowerCase() == "text" || inputElements[i].type.toLowerCase() == "email") {
                        useridField = inputElements[i];
                    }
                }
            } catch (e) {
                isFilled = false;
                console.error("<fillPasswordForm> Exception1:" + e);
            }

            if (isFilled) {
                if (iSubmit == 1) {
                    this.submitForm(aForm);
                }

                return true;
            }

            return false;
        } catch (e) {
            console.error("<fillPasswordForm> Exception2:" + e);
            return false;
        }
    },

    submitForm: function (aForm) {
        if (!aForm) {
            return false;
        }

        console.log("<submitForm> entering...");
        try {
            //<input type="submit/image"...>
            var inputElements = aForm.getElementsByTagName("input");
            if (inputElements.length == 0) {
                console.log("<submitForm> inputElements.length == 0");
                inputElements = aForm.elements;
            }

            var submitElement = null;
            for (var i = 0; i < inputElements.length; i++) {
                if (inputElements[i].type == "submit" || inputElements[i].type == "image") {
                    submitElement = inputElements[i];
                    break;
                }
            }

            //<button type="submit"...>
            if (!submitElement) {
                var buttonElements = aForm.getElementsByTagName("button");
                for (var j = 0; j < buttonElements.length; j++) {
                    if (buttonElements[j].type == "submit") {
                        submitElement = buttonElements[j];
                        break;
                    }

                    // For some websites <botton type="button">login</button>, such as https://www.rentpayment.com/pay/login.html
                    var innerText = buttonElements[j].innerText.toLowerCase();
                    if (innerText == "login") {
                        submitElement = buttonElements[j];
                        break;
                    }
                }
            }

            if (typeof (submitElement) != "undefined" && submitElement) {
                if (document.all || typeof (submitElement.click) == "function") {
                    submitElement.click();
                    console.log("<submitForm> submitElement.click");
                } else {
                    var evt = document.createEvent("HTMLEvents");
                    evt.initEvent("click", false, true);
                    var result = submitElement.dispatchEvent(evt);
                    console.log("<submitForm> submitElement.dispatchEvent result: " + result);
                }

                return true;
            }

            var anchorElements = aForm.getElementsByTagName("a");
            for (var k = 0; k < anchorElements.length; k++) {
                if (anchorElements[k].id.indexOf("SignIn") > -1 || anchorElements[k].id.indexOf("login") > -1 || anchorElements[k].id.indexOf("btnLogin") > -1) {
                    var evt = document.createEvent("HTMLEvents");
                    evt.initEvent("click", false, true);
                    anchorElements[k].dispatchEvent(evt);
                    console.log("<submitForm> anchor element click");
                    return true;
                }
            }

            if (document.all) { //if browser is IE
                aForm.submit();
            } else {
                var submitEvent = document.createEvent("HTMLEvents");
                submitEvent.initEvent("submit", true, false);
                aForm.dispatchEvent(submitEvent);
            }

            return true;
        } catch (e) {
            console.error("<submitForm> exception: " + e);
            return false;
        }
    },

    isPasswordExists: function () {
        console.log("<isPasswordExists> Entering");
        if (!document.forms) {
            return;
        }

        for (var i = 0; i < document.forms.length; i++) {
            if (this.isOnePasswordAndTextForm(document.forms[i])) {
                console.log("<isPasswordExistInDocument> password found.");
                return true;
            }
        }

        return false;
    },

    processHotmailPage: function () {
        try {
            if (document.location.href.indexOf("login.live.com") > -1) {
                var elem = document.getElementById("i1668");
                if (typeof (elem) != "undefined" && elem) {
                    console.log("<processHotmailPage> element: " + elem.outerHTML);
                    if (document.createEvent) { //FOR DOM2
                        var ev = document.createEvent('HTMLEvents');
                        ev.initEvent('click', false, true);
                        elem.dispatchEvent(ev);
                    }
                }
            }
        } catch (e) {
            console.error("<processHotmailPage> Exception: " + e);
        }
    },

    isOnePasswordForm: function (aForm) {
        var passwordCount = 0;
        var inputArray = aForm.getElementsByTagName("input");
        console.log("<isOnePasswordForm> inputArray.length:" + inputArray.length);
        if (inputArray.length == 0) {
            inputArray = aForm.elements;
        }

        for (var i = 0; i < inputArray.length; i++) {
            if (inputArray[i].type == "password") {
                console.log("<isOnePasswordForm> found password.");
                if (!this.isElementDisplayNone(inputArray[i])) {
                    console.log("<isOnePasswordForm> found display password.");
                    passwordCount++;
                }
            }

            if (passwordCount > 1) {
                break;
            }
        }

        console.log("<isOnePasswordForm> passwordCount: " + passwordCount);

        if (passwordCount == 1) {
            return true;
        }

        return false;
    },

    isOnePasswordAndTextForm: function (aForm) {
        var passwordCount = 0;
        var textCount = 0;
        var inputArray = aForm.getElementsByTagName("input");
        //console.log("<isOnePasswordAndTextForm> inputArray.length:"+inputArray.length);
        if (inputArray.length == 0) {
            inputArray = aForm.elements;
        }

        for (var i = 0; i < inputArray.length; i++) {
            var vType = inputArray[i].type;
            if (vType == "password") {
                console.log("<isOnePasswordAndTextForm> found password.");
                if (!this.isElementDisplayNone(inputArray[i])) {
                    console.log("<isOnePasswordAndTextForm> found display password.");
                    passwordCount++;
                }
            } else if (vType == "text" || vType == "email") {
                console.log("<isOnePasswordAndTextForm> found text.");
                if (!this.isElementDisplayNone(inputArray[i])) {
                    console.log("<isOnePasswordAndTextForm> found display text.");
                    if (inputArray[i].title != null && inputArray[i].title.indexOf("search") > -1) {
                        console.log("<isOnePasswordAndTextForm> found display text. but this input is search input, not user name");
                    }
                    else {
                        textCount++;
                    }
                }
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

    isElementDisplayNone: function (elem) {
        try {
            if (typeof (elem) != "undefine" && elem) {
                var style = document.defaultView.getComputedStyle(elem, null);
                if (style.display == "none") {
                    console.log("<isElementDisplayNone> password field is display:none");
                    return true;
                } else {
                    return this.isElementDisplayNone(elem.parentElement);
                }
            } else {
                console.log("<isElementDisplayNone> enum all elements");
            }
        } catch (e) {
            console.error("<isElementDisplayNone> Exception: " + e)
        }

        return false;
    },

    isElementEmpty: function (elem) {
        if (elem != null) {
            if (elem.value == "" || elem.value == null) {
                return true;
            } else {
                return false;
            }
        }

        return true;
    },

    addFormClickListener: function () {
        try {
            console.log("<addFormClickListener> Entering");
            if (!document.forms) {
                return;
            }

            for (var i = 0; i < document.forms.length; i++) {
                if (this.isOnePasswordForm(document.forms[i])) {
                    console.log("<addFormClickListener> password form found, name:" + document.forms[i].name);
                    //If multiple identical EventListeners are registered on the same EventTarget with the same parameters, the duplicate instances are discarded.
                    //So the event function must be defined, avoid to use "function(event){...}". 
                    document.forms[i].addEventListener("click", this.formClickListener, false);
                }
            }
            console.log("<addFormClickListener> Exitting");
        } catch (ex) {
            console.error("<addFormClickListener> Exception:" + ex);
        }
    },

    formClickListener: function (event) {
        websiteLogon.onFormClick(event);
    },

    onFormClick: function (event) {
        //event.target provide element on which user clicked
        //this - refers to the form on which event has occured
        try {
            console.log("<onFormClick> Entering _isSubmitByLogon:" + this._isSubmitByLogon);
            if (!this._isSubmitByLogon && this.isSubmitButton(event)) {
                console.log("<onFormClick> submit button clicked");
                this.formRegister(event);
            }
        } catch (e) {
            console.error("<onFormClick> Exception:" + e);
        }
    },

    isSubmitButton: function (event) {
        console.log("<isSubmitButton> Entering...");
        try {
            var eTarget = event.target;

            //Tag
            var vTag = eTarget.tagName.toLowerCase();
            //alert("vTag="+vTag);
            if (vTag != "input" && vTag != "button" && vTag != "img" && vTag != "span" && vTag != "a") {
                return false;
            }

            if (vTag == "span") {
                var eParent = eTarget.parentNode;
                var vParentTag = eParent.tagName.toLowerCase();
                if (vParentTag == "button") {
                    eTarget = eParent;
                    vTag = vParentTag;
                }
            }

            if (vTag == "span") {
                var innerHTML = eTarget.innerHTML.toLowerCase();
                if (innerHTML.indexOf("log in") > -1 || innerHTML.indexOf("sign in") > -1) {
                    return true;
                }
            }

            if (vTag == "button") {
                var innerText = eTarget.innerText.toLowerCase();
                if (innerText == "login") {
                    return true;
                }
            }

            //Type
            var vType = eTarget.type;
            //alert("vType="+vType);
            if (vType == null || vType == "undefined") {
                vType = "";
            } else {
                vType = vType.toLowerCase();
            }
            if ((vTag == "input" && vType == "submit") || (vTag == "input" && vType == "image") || (vTag == "button" && vType == "submit")) {
                return true;
            }
            if (vType == "checkbox" || vType == "radio" || vType == "text" || vType == "password") {
                return false;
            }

            //outerHTML
            var vOuterHTML = eTarget.value;
            //alert("vOuterHTML="+vOuterHTML);
            if (vOuterHTML == null || vOuterHTML == "undefined") {
                vOuterHTML = "";
            } else {
                vOuterHTML = vOuterHTML.toLowerCase();
            }
            if (vOuterHTML.indexOf("reg") > -1 || vOuterHTML.indexOf("reset") > -1) {
                return false;
            }

            //Onclick
            var vOnclick = eTarget.getAttribute("onclick");
            //alert("vOnclick="+vOnclick);
            if (vOnclick == null || vOnclick == "undefined") {
                vOnclick = "";
            } else {
                vOnclick = vOnclick.toLowerCase();
            }
            //alert("vOnclick="+vOnclick);
            if (vOnclick.indexOf("reg") > -1 || vOnclick.indexOf("reset") > -1) {
                return false;
            }
            if ((vOnclick.indexOf("login") > -1) || (vOnclick.indexOf("javascript") > -1) || (vOnclick.indexOf("submit") > -1)) {
                return true;
            }

            //Class
            var vClassName = eTarget.className;
            //alert("vClassName="+vClassName);
            if (vClassName == null || vClassName == "undefined") {
                vClassName = "";
            } else {
                vClassName = vClassName.toLowerCase();
            }
            if (vClassName.indexOf("buttontext") > -1 || vClassName.indexOf("button_enter") > -1) {
                return true;
            }

            if (vTag == "img") {
                //alert("Image Element");
                eParent = eTarget.parentNode;
                vParentTag = eParent.tagName.toLowerCase();
                if (vParentTag == "a") {
                    //alert("Its image with anchor element");
                    var mHref = eParent.getAttribute("href").toLowerCase();
                    if (mHref.indexOf("javascript") > -1) {
                        return true;
                    }
                }
            } else if (vTag == "a") {
                var mHref = eTarget.getAttribute("href").toLowerCase();
                if (mHref.indexOf("javascript") != -1) {
                    return true;
                }

                var mOnClick = eTarget.getAttribute("onclick").toLowerCase();
                //alert("OnClick in OnFormClick");
                if (mOnClick != "" && mOnClick != "undefined") {
                    if (mOnClick.indexOf("login") > -1) {
                        return true;
                    }
                }
            } //else if(vTag == "span") {
            //var eParent = eTarget.parentNode;
            //var vParentTag = eParent.tagName.toLowerCase();
            //while(vParentTag!="form") {
            //if(vParentTag == "a") {
            //return true;
            //}
            //eParentNode = eParent.parentNode;
            //vParentTag = eParent.tagName.toLowerCase();
            //}
            //}

            return false;
        } catch (e) {
            console.error("<isSubmitButton> Exception:" + e);
            return false;
        }
    },

    formRegister: function (event) {
        console.log("<formRegister> Entering");
        try {
            var eTarget = event.target;
            while (eTarget.tagName.toUpperCase() != "FORM") {
                eTarget = eTarget.parentNode
                if (!eTarget) {
                    return false
                }
            }

            var formName = eTarget.name;
            var inputElements = eTarget.getElementsByTagName("input");
            if (inputElements.length == 0) {
                console.log("<formRegister> getElementsByTagName failed");
                inputElements = eTarget.elements;
            }

            var username = "";
            var password = "";
            for (var i = 0; i < inputElements.length; i++) {
                if (inputElements[i].type == "password") {
                    password = inputElements[i].value;
                    break;
                }

                if (inputElements[i].type == "text" || inputElements[i].getAttribute("class") == "text" || inputElements[i].type == "email") {
                    username = inputElements[i].value;
                }
            }

            if (username != "" && password != "") {
                console.log("<formRegister> before calling startToRegister function");
                this.sendBG({ cmd: "registersucceed" });
                if (this.isWLOEnabled(this._currentTabUrl) && !this.showDiscoveryDlg(this._currentTabUrl, formName, username, password)) {
                    this.sendBG({ cmd: "formsubmit", url: this._currentTabUrl, formid: formName, userid: username, password: password });
                }
            }
        } catch (e) {
            console.error("<formRegister> Exception:" + e);
        }
    },

    specialSiteClickListener: function () {
        websiteLogon.onSpecialSiteClick();
    },

    onSpecialSiteClick: function () {
        console.log("<onSpecialSiteClick> sepecial website register.");

        if (this._isSubmitByLogon) {
            console.log("<onSpecialSiteClick> plugin logon, should not be registered.");
            return;
        }

        //If website is a AJAX website, message "registersucceed" should not be send.
        if (!this._configHelper || !this._configHelper.isSpecialSite() || this._configHelper.getIsRefreshOnLoginFailed()) {
            this.sendBG({ cmd: "registersucceed" });
        }

        var username = "";
        if (this._configHelper.isUserNameExist()) {
            username = this._configHelper.getUserName().value;
            if (!username || username == "") {
                console.log("<onSpecialSiteClick> username is empty.");
                return;
            }
        }

        var password = "";
        if (this._configHelper.isPasswordExist()) {
            password = this._configHelper.getPassword().value;
            if (!password || password == "") {
                console.log("<onSpecialSiteClick> password is empty.");
                return;
            }
        }

        // Cache username for register when username and password aren't in a page.
        if (this._configHelper.isUserNameExist() && !this._configHelper.isPasswordExist()) {
            this.sendBG({ cmd: "cacheusername", url: this._currentTabUrl, formid: '', userid: username });
            return;
        }

        if (!this._configHelper.isUserNameExist() && this._configHelper.isPasswordExist()) {
            username = this._cachedUserName;
            if (username == "") {
                return;
            }
        }

        if (this.isWLOEnabled(this._currentTabUrl) && !this.showDiscoveryDlg(this._currentTabUrl, '', username, password)) {
            this.sendBG({ cmd: "formsubmit", url: this._currentTabUrl, formid: '', userid: username, password: password });
        }
    },

    specialSiteBlurListener: function () {
        websiteLogon.onSpecialSiteBlur();
    },

    onSpecialSiteBlur: function () {
        console.log("<onSpecialSiteBlur> sepecial website register.");
        var username = this._configHelper.getUserName().value;
        this.sendBG({ cmd: "cacheusername", url: this._currentTabUrl, formid: '', userid: username });
    },

    setPageType: function (pageType) {
        console.log("<setPageType> Entering... pagetype: " + pageType);
        this.sendBG({ cmd: "vip_pagetype", pagetype: pageType });
    },

    setOTPPageType: function (otpPageType) {
        console.log("<setOTPPageType> Entering... pagetype: " + otpPageType);
        this.sendBG({ cmd: "vip_otppagetype", otppagetype: otpPageType });
    },

    fillSupportPage: function (doc, supportInfo) {
        try {
            console.log('<fillSupportPage> entering');

            //Date: <input id="dnn_ctr3008_DynamicForms_TBR_GUIDfbd4c0b7-f35d-41b3-954a-d0c7d277c1fcDate" ...>
            var currentDate = new Date();
            doc.getElementById("dnn_ctr3008_DynamicForms_TBR_GUIDfbd4c0b7-f35d-41b3-954a-d0c7d277c1fcDate").value = currentDate.toLocaleString();

            //Browser Type/Version: <input id="dnn_ctr3008_DynamicForms_TBR_GUIDc8b9bad0-577a-4e3d-8a98-3e4c32af3025Browser" ...>
            var mybrowser = this.browserInfo();
            doc.getElementById("dnn_ctr3008_DynamicForms_TBR_GUIDc8b9bad0-577a-4e3d-8a98-3e4c32af3025Browser").value = mybrowser.appname + "/" + mybrowser.version;

            if (!supportInfo) {
                return;
            }

            var mergeArray = supportInfo.split(">>>");
            //TS Version: <input id="dnn_ctr3008_DynamicForms_TBR_GUID7e5593f0-f1cc-4f38-80bb-dfa9b0fa157eTSVersion" ...>
            doc.getElementById("dnn_ctr3008_DynamicForms_TBR_GUID7e5593f0-f1cc-4f38-80bb-dfa9b0fa157eTSVersion").value = mergeArray[0];
            //OS: <input id="dnn_ctr3008_DynamicForms_TBR_GUID35b8b7a5-ba94-4848-bd4a-e330a9ef6b22OS" ...>
            doc.getElementById("dnn_ctr3008_DynamicForms_TBR_GUID35b8b7a5-ba94-4848-bd4a-e330a9ef6b22OS").value = mergeArray[1];
            //Language: <input id="dnn_ctr3008_DynamicForms_TBR_GUID3b476dc1-b5fc-4599-8da2-b0383c36b3e6Language" ...>
            doc.getElementById("dnn_ctr3008_DynamicForms_TBR_GUID3b476dc1-b5fc-4599-8da2-b0383c36b3e6Language").value = mergeArray[2];
            //FP Driver Version: <input id="dnn_ctr3008_DynamicForms_TBR_GUID4dc48432-52e0-403c-b397-ca1362e67deaFPDriverversion" ...>
            doc.getElementById("dnn_ctr3008_DynamicForms_TBR_GUID4dc48432-52e0-403c-b397-ca1362e67deaFPDriverversion").value = mergeArray[3];
            //FP Sensor Type: <input id="dnn_ctr3008_DynamicForms_TBR_GUIDb2dece6a-73e7-4830-b6e5-7a5b783f9f1cFPSensorType" ...>
            doc.getElementById("dnn_ctr3008_DynamicForms_TBR_GUIDb2dece6a-73e7-4830-b6e5-7a5b783f9f1cFPSensorType").value = mergeArray[4];
            //URL: <input id="dnn_ctr3008_DynamicForms_TBR_GUID9d49b066-a938-4f10-9548-a3dc6f6b4760URL" ...>
            doc.getElementById("dnn_ctr3008_DynamicForms_TBR_GUID9d49b066-a938-4f10-9548-a3dc6f6b4760URL").value = mergeArray[5];
        } catch (e) {
            console.error("<fillSupportPage> Exception: " + e);
        }
    },

    browserInfo: function () {
        var browser = {
            msie: false, firefox: false, opera: false, safari: false,
            chrome: false, netscape: false, appname: 'unknown', version: 0
        },
	        userAgent = window.navigator.userAgent.toLowerCase();
        if (/(msie|firefox|opera|chrome|netscape)\D+(\d[\d.]*)/.test(userAgent)) {
            browser[RegExp.$1] = true;
            browser.appname = RegExp.$1;
            browser.version = RegExp.$2;
        } else if (/version\D+(\d[\d.]*).*safari/.test(userAgent)) { // safari
            browser.safari = true;
            browser.appname = 'safari';
            browser.version = RegExp.$2;
        }
        return browser;
    },

    addEmbed: function () {
        try {
            if (!window.ActiveXObject) {
                var embed = document.getElementById("embed_npwlo");
                if (typeof (embed) == "undefined" || !embed) {
                    console.log("<addEmbed> embed adding.");
                    embed = document.createElement("embed");
                    embed.setAttribute("id", "embed_npwlo");
                    embed.setAttribute("type", "application/npwlo");
                    embed.setAttribute("height", "0");
                    document.body.appendChild(embed);

                    console.log("<addEmbed> embed add completed.");
                } else {
                    console.log("<addEmbed> embed has been added.");
                }
            } else {
                console.log("<addEmbed> window.ActiveXObject isn't null.");
            }
        } catch (e) {
            console.error("<addEmbed> Exception:" + e);
        }
    },

    setWindow: function (tabId) {
        console.log('<setWindow> --'
					+ ' tabId: ' + tabId);
        try {
            this.addEmbed();
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                return embed.SetWindow(tabId);
            } else {
                console.log("<setWindow> embed is null");
            }
        } catch (e) {
            console.error("<setWindow> Exception:" + e);
        }

        return false;
    },

    isWLOEnabled: function (url) {
        console.log('<isWLOEnabled> --'
					+ ' url: ' + url);
        try {
            this.addEmbed();
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                var res = embed.IsWLOEnabled(url);
                console.log('<isWLOEnabled> enabled: ' + res);
                return res;
            } else {
                console.log("<isWLOEnabled> embed is null");
            }

            return false;
        } catch (e) {
            console.error("<isWLOEnabled> Exception:" + e);
        }
    },

    showDiscoveryDlg: function (aURL, aFormId, aUserName, aPassword) {
        console.log('<showDiscoveryDlg> entering...');
        try {
            this.addEmbed();
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                return embed.ShowDiscoveryDlg(aURL, aFormId, aUserName, aPassword);
            } else {
                console.log("<showDiscoveryDlg> embed is null");
            }
        } catch (e) {
            console.error("<showDiscoveryDlg> Exception:" + e);
        }

        return false;
    },

    getAccounts: function (url) {
        console.log('<getAccounts> --'
					+ ' url: ' + url);
        try {
            this.addEmbed();
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                return embed.GetProfileAccounts(url);
            } else {
                console.log("<getAccounts> embed is null");
            }
        } catch (e) {
            console.error("<getAccounts> Exception:" + e);
        }

        return "";
    },

    editWebCard: function (url) {
        try {
            console.log('<editWebCard> --'
						+ ' url: ' + url)
            this.addEmbed();
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                embed.EditWebCard(url);
            }
        } catch (e) {
            console.error("<editWebCard> Exception:" + e);
        }
    },

    callToFIDOTokenCounter: function (url) {
        console.log('<callJSFunction> --'
					+ ' url: ' + url);
        try {
            this.addEmbed();
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                embed.CallJSFunction(url, "FIDOTokenCounter");
            } else {
                console.log("<callJSFunction> embed is null");
            }
        } catch (e) {
            console.error("<callJSFunction> Exception:" + e);
        }
    },

    /* Set iframe and space for notification */
    createNotification: function () {
        var notificationContainer = document.getElementById("wlo_notification_container");
        if (!notificationContainer) {
            //Create notification container
            notificationContainer = document.createElement("div");
            notificationContainer.setAttribute("id", "wlo_notification_container");
            notificationContainer.setAttribute("style", "display:none;height:48px;width:100%;position:fixed;top:0px;left:0px;z-index: 2147482999;opacity:1.0;-moz-box-shadow:8px 12px 13px #000000;-webkit-box-shadow:0px 0px 50px #000000;box-shadow:0px 0px 23px #000000;");

            //Create iframe
            var extensionId = chrome.i18n.getMessage("@@extension_id");
            var notificationFrame = document.createElement("iframe");
            notificationFrame.setAttribute("style", "height:48px;width:100%;border: 0px;");
            notificationFrame.src = "chrome-extension://" + extensionId + "/notification.html";
            notificationContainer.appendChild(notificationFrame);

            //Insert the space in the top of webpage.
            var notificationTop = document.createElement("div");
            notificationTop.setAttribute("id", "wlo_notification_top");
            notificationTop.setAttribute("style", "display:none;height:48px;");
            document.body.insertBefore(notificationTop, document.body.firstChild);
            document.body.appendChild(notificationContainer);
        }
    },

    hideNotification: function () {
        var notificationContainer = document.getElementById("wlo_notification_container");
        if (notificationContainer) {
            notificationContainer.style.display = "none";
            document.getElementById("wlo_notification_top").style.display = "none";
        }
    },

    showNotification: function () {
        document.getElementById("wlo_notification_container").style.display = "";
        document.getElementById("wlo_notification_top").style.display = "";
    },

    isNotificationShowed: function () {
        var notificationContainer = document.getElementById("wlo_notification_container");
        var notificationTop = document.getElementById("wlo_notification_top");
        if (notificationContainer && notificationTop && notificationContainer.style.display != "none" && notificationTop.style.display != "none") {
            return true;
        }

        return false;
    }

    /* end for notification */
};

window.addEventListener("load", function() { websiteLogon.initialize(); }, false);
window.addEventListener("unload", function() { websiteLogon.uninitailize(); }, false);