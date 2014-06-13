/*
 * @package 	websiteLogonBG
 * @author      TrueSuite Team
 * @copyright (c) AuthenTec Inc.
 */
var websiteLogonBG = {
    _tabsCS: {},
    _tabsCSCount: {},
    _tabsRegInfo: {},
    _tabsOTPInfo: {},
    _tabsLogonMessage: {},
    _tabsTransInfo: {}, //save last transaction(register or logon) information.
    _tabsCachedInfo: {}, //used for cache info when username and password aren't in a page.

    _windowsIntervalId: {},
    _windowsActiveTabId: {},

    _lastFocusTabId: -1,
    _focusIntervalId: null,
    _lastFocusWindowId: -1,

    _supportURL: "",

    connectCS: function (port) {
        console.log("<connectCS> CS[" + port.tab.id + "] -> BG : tab url: " + port.tab.url + ", document url: " + port.name);

        if (!this._tabsCS[port.tab.id]) {
            this._tabsCS[port.tab.id] = new Array();
            this._tabsCSCount[port.tab.id] = 0;
        }

        if (!this._tabsOTPInfo[port.tab.id]) {
            this._tabsOTPInfo[port.tab.id] = new Array();
        }

        if (!this._tabsTransInfo[port.tab.id]) {
            this._tabsTransInfo[port.tab.id] = new Array();
        }

        var count = this._tabsCS[port.tab.id].length;
        this._tabsCS[port.tab.id][count] = port;
        this._tabsCSCount[port.tab.id] += 1;
        if (port.tab.url == port.name) {
            this._tabsCS[port.tab.id].maindocnum = count;
        }

        if (!this._tabsCachedInfo[port.tab.id]) {
            this._tabsCachedInfo[port.tab.id] = new Array();
        }

        if (this._tabsCachedInfo[port.tab.id].registerURL && this.getTLD(this._tabsCachedInfo[port.tab.id].registerURL) != this.getTLD(port.tab.url)) {
            this._tabsCachedInfo[port.tab.id].registerURL = null;
            this._tabsCachedInfo[port.tab.id].username = null;
        }

        if (this._tabsCachedInfo[port.tab.id].logonURL && this.getTLD(this._tabsCachedInfo[port.tab.id].logonURL) != this.getTLD(port.tab.url)) {
            this._tabsCachedInfo[port.tab.id].logonURL = null;
            this._tabsCachedInfo[port.tab.id].password = null;
        }

        var cachedUserName = this._tabsCachedInfo[port.tab.id].username ? this._tabsCachedInfo[port.tab.id].username : "";
        var cachedPassword = this._tabsCachedInfo[port.tab.id].password ? this._tabsCachedInfo[port.tab.id].password : "";
        this.sendCS(port.tab.id, { cmd: "document_connected", docnum: count, taburl: port.tab.url, tabid: port.tab.id, cachedusername: cachedUserName, cachedpassword: cachedPassword }, count);
        port.onMessage.addListener(function (msg, sender) { websiteLogonBG.receiveCS(sender.tab, msg) });
        port.onDisconnect.addListener(function (sender) { websiteLogonBG.disconnectCS(sender.tab, port, count) });
    },

    disconnectCS: function (tab, port, count) {
        console.log("<disconnectCS> Entering tabId:" + tab.id + ", count:" + count + ", document url: " + port.name);
        if (this._tabsCS[tab.id]) {
            if (port.name == tab.url) {	//main frame disconnect
                if (this._tabsCS[tab.id].logonURL) {
                    //cancel logon transaction only when tab reload or close.
                    console.log('<disconnectCS> -- logonURL: ' + this._tabsCS[tab.id].logonURL + ' tabId:' + tab.id);
                    this.abortTransaction(tab.id);
                }
            }

            if (this._tabsCS[tab.id][count]) {
                this._tabsCS[tab.id][count] = null;
            }
            if (--this._tabsCSCount[tab.id] <= 0) {
                console.log("<disconnectCS> clear CS tabId:" + tab.id);
                this._tabsCS[tab.id] = null;
            }
        }
    },

    sendCS: function (tabId, msg, docnum) {
        console.log("<sendCS> Entering tabId:" + tabId + ", docnum:" + docnum);
        if (typeof (this._tabsCS[tabId]) == "undefined" || !this._tabsCS[tabId]) {
            console.log("BG -> CS[" + tabId + "] : FAILED");
            return;
        }

        if (typeof (docnum) != "undefined") {    //docnum can be 0;
            if (docnum == "all") {
                for (var i = 0; i < this._tabsCS[tabId].length; i++) {
                    if (this._tabsCS[tabId][i]) {
                        this._tabsCS[tabId][i].postMessage(msg);
                        console.log("<sendCS> CS[" + tabId + "][" + i + "] : post succeed.");
                    } else {
                        console.error("<sendCS> CS[" + tabId + "][" + i + "] : post failed.");
                    }
                }
            } else if (docnum < this._tabsCS[tabId].length) {
                if (this._tabsCS[tabId][docnum]) {
                    this._tabsCS[tabId][docnum].postMessage(msg);
                    console.log("<sendCS> CS[" + tabId + "][" + docnum + "] : post succeed.");
                } else {
                    console.error("<sendCS> CS[" + tabId + "][" + docnum + "] : post failed.");
                }
            }
        }
    },

    receiveCS: function (tab, msg) {
        if (typeof (msg.cmd) == "undefined") {
            console.log("CS[" + tab.id + "] -> BG : INVALIDMSG");
            return
        } else {
            console.log("CS[" + tab.id + "] -> BG : cmd: " + msg.cmd);
        }

        switch (msg.cmd) {
            case "cs_connected":
                this.onPageLoad(msg, tab);
                break;
            case "cs_selected":
                this.onTabSelect(msg, tab);
                break;
            case "cs_interval":
                this.onInterval(msg, tab);
                break;
            case "formsubmit":
                this.onFormSubmit(msg, tab);
                break;
            case "registersucceed":
                this._tabsTransInfo[tab.id].isRegSucceed = true;
                break;
            case "vip_pagetype":
                console.log("<receiveCS> set page type: " + msg.pagetype);
                this._tabsOTPInfo[tab.id].pagetype = msg.pagetype;
                break;
            case "vip_otppagetype":
                console.log("<receiveCS> set otp page type: " + msg.otppagetype);
                this._tabsOTPInfo[tab.id].otppagetype = msg.otppagetype;
                break;
            case "saveprofile":
                this.sendCS(tab.id, { cmd: "hideframe" }, this._tabsCS[tab.id].maindocnum);
                this.startToRegister(this._tabsRegInfo[tab.id].url, this._tabsRegInfo[tab.id].formid, this._tabsRegInfo[tab.id].userid, this._tabsRegInfo[tab.id].password);
                this._tabsRegInfo[tab.id] = null;
                this.sendCS(tab.id, { cmd: "processvipprompt" }, this._tabsCS[tab.id].maindocnum);
                break;
            case "cs_logon":
                console.log("<receiveCS> logon, tab.selected: " + tab.selected);
                this.startToLogon(tab.url, tab.id);
                break;
            case "cancellogon":
                this.abortTransaction(tab.id);
                if (this._tabsRegInfo[tab.id] && this._tabsRegInfo[tab.id].url && this._tabsRegInfo[tab.id].password) {
                    console.log("<receiveCS> register running.");
                } else {
                    this.sendCS(tab.id, { cmd: "hideframe" }, this._tabsCS[tab.id].maindocnum);
                }
                break;
            case "selectaccount":
                this.selectAccount(msg.account, tab.id);
                break;
            case "verifypassword":
                this.verifyPassword(msg.password, tab.id);
                break;
            case "clearregister":
                this._tabsRegInfo[tab.id] = null;
                this.sendCS(tab.id, { cmd: "hideframe" }, this._tabsCS[tab.id].maindocnum);
                break;
            case "setnever":
                this.setWLOEnabled(tab.url, false);
                this.sendCS(tab.id, { cmd: "hideframe" }, this._tabsCS[tab.id].maindocnum);
                break;
            case "getotp":
                this.getOTP(tab.id, msg.otpnum);
                break;
            case "openhelpfile":
                this.openHelpFile();
                break;
            case "cacheusername":
                this._tabsCachedInfo[tab.id] = new Array();
                this._tabsCachedInfo[tab.id].username = msg.userid;
                this._tabsCachedInfo[tab.id].registerURL = msg.url;
                this._tabsCachedInfo[tab.id].password = null;
                this._tabsCachedInfo[tab.id].logonURL = null;
                break;
            case "cachepassword":
                this._tabsCachedInfo[tab.id] = new Array();
                this._tabsCachedInfo[tab.id].password = msg.password;
                this._tabsCachedInfo[tab.id].logonURL = msg.url;
                this._tabsCachedInfo[tab.id].username = null;
                this._tabsCachedInfo[tab.id].registerURL = null;
                break;
            case "resetcache":
                this._tabsCachedInfo[tab.id] = new Array();
                break;
            case "cs_supportpageload":
                {
                    var supportInfo = this.getSupportInfo();
                    if (supportInfo) {
                        supportInfo += ">>>" + this._supportURL;
                        this._supportURL = "";
                    }

                    console.log("<processCS> support info:" + supportInfo);
                    this.sendCS(tab.id, { cmd: "fillsupportinfo", supportinfo: supportInfo }, msg.docnum);
                }
                break;
            case "frame_connected":
                this._tabsCS[tab.id].frameload = true;
                this._tabsCS[tab.id].framedocnum = msg.docnum;
                if (this._tabsRegInfo[tab.id] && this._tabsRegInfo[tab.id].url && this._tabsRegInfo[tab.id].password) {
                    if (this.isWLOEnabled(tab.url)) {
                        this.sendCS(tab.id, { cmd: "showregister", url: tab.url, otpsupport: this.isOTPSupport(this._tabsRegInfo[tab.id].url) }, msg.docnum);
                        this.sendCS(tab.id, { cmd: "showframe" }, this._tabsCS[tab.id].maindocnum);
                    } else {
                        this._tabsRegInfo[tab.id] = null;
                    }
                } else if (this._tabsLogonMessage[tab.id]) {
                    this.sendCS(tab.id, { cmd: "showframe" }, this._tabsCS[tab.id].maindocnum);
                    this.sendCS(tab.id, this._tabsLogonMessage[tab.id], this._tabsCS[tab.id].framedocnum);
                    if (tab.selected) {
                        chrome.windows.get(tab.windowId, function (window) {
                            if (!window.focused) {
                                websiteLogonBG.sendCS(tab.id, { cmd: "updateui", type: "swipe_unfocused", message: "IDS_NO_FP_FOCUS" }, websiteLogonBG._tabsCS[tab.id].framedocnum);
                            }
                        });
                    }
                    this._tabsLogonMessage[tab.id] = null;
                }
                break;
            default:
                break;
        }

        return true;
    },

    onPageLoad: function (msg, tab) {
        console.log('<onPageLoad> -- url: ' + msg.url + ' tabId:' + tab.id);
        try {
            /*  Handle OTP process  */
            if (msg.url == tab.url) {
                this.sendCS(tab.id, { cmd: "starttoprocessotp", url: tab.url, pagetype: this._tabsOTPInfo[tab.id].pagetype, otppagetype: this._tabsOTPInfo[tab.id].otppagetype }, msg.docnum);
            }

            /*  Handle Register process  */
            if (this._tabsRegInfo[tab.id] && this._tabsRegInfo[tab.id].url && this.getTLD(this._tabsRegInfo[tab.id].url) != this.getTLD(tab.url)) {
                this._tabsRegInfo[tab.id] = null;
            }

            if (this._tabsRegInfo[tab.id] && this._tabsRegInfo[tab.id].url) {
                //Need to remove # flag. For gmail japanese.
                var docURL = msg.url.replace(/#[^!](.*)?/g, "");
                var tabURL = msg.url.replace(/#[^!](.*)?/g, "");
                if (docURL == tabURL && !this._tabsCS[tab.id].frameload) {
                    this.sendCS(tab.id, { cmd: "createframe" }, this._tabsCS[tab.id].maindocnum);
                }
                return;
            }

            /*  Handle Logon process  */
            if (tab.selected) {
                if (msg.passwordstatus) {
                    this._tabsCS[tab.id].passwordstatus = true;
                    this.stopLogonInterval(tab.windowId);
                    if (this._tabsTransInfo[tab.id].lastLoadUrl == tab.url && this._tabsTransInfo[tab.id].isLogonSucceed &&
                    (typeof (msg.bAJAXLogon) == 'undefined' || !msg.bAJAXLogon)) {
                        console.log("<receiveCS> re-enter after logon, url: " + tab.url);
                    } else if (this._tabsTransInfo[tab.id].isRegSucceed) {
                        console.log("<receiveCS> re-enter after register, url: " + tab.url);
                    } else {
                        this.sendCS(tab.id, { cmd: "starttologon", url: tab.url }, this._tabsCS[tab.id].maindocnum);
                    }
                } else {
                    if (msg.docnum == this._tabsCS[tab.id].maindocnum && !this._tabsCS[tab.id].passwordstatus) {
                        console.log("<receiveCS> start a timer to logon");
                        this.startLogonInterval(tab.windowId);
                    }
                }
            }

            this._tabsTransInfo[tab.id].isLogonSucceed = false;
            this._tabsTransInfo[tab.id].lastLoadUrl = tab.url;
            this._tabsTransInfo[tab.id].isRegSucceed = false;
        } catch (e) {
            console.error("<onPageLoad> exception: " + e);
        }
    },

    onTabSelect: function (msg, tab) {
        try {
            console.log('<onTabSelect> -- url: ' + msg.url + ' tabId:' + tab.id);
            if (!msg.passwordstatus) {
                console.log('<onTabSelect> passwordstatus is false');
                //try to start interval only when main document receive message and password isnot existed in all documents.
                if (msg.docnum == this._tabsCS[tab.id].maindocnum && !this._tabsCS[tab.id].passwordstatus) {
                    console.log("<onTabSelect> start a timer to logon");
                    this.startLogonInterval(tab.windowId);
                }
                return;
            }

            this.stopLogonInterval(tab.windowId);

            if (this._tabsRegInfo[tab.id] && this._tabsRegInfo[tab.id].url) {
                console.log('<onTabSelect> register running');
                return;
            }

            this._tabsCS[tab.id].passwordstatus = true;
            this.sendCS(tab.id, { cmd: "starttologon", url: tab.url, docnum: msg.docnum }, this._tabsCS[tab.id].maindocnum);
        } catch (e) {
            console.error("<onTabSelect> exception: " + e);
        }
    },

    onInterval: function (msg, tab) {
        if (!msg.passwordstatus) {
            console.log('<onInterval> passwordstatus is false');
            return;
        }

        this.stopLogonInterval(tab.windowId);

        if (this._tabsRegInfo[tab.id] && this._tabsRegInfo[tab.id].url) {
            console.log('<onInterval> register running');
            return;
        }

        this.sendCS(tab.id, { cmd: "starttologon", url: tab.url }, this._tabsCS[tab.id].maindocnum);
    },

    startLogonInterval: function (windowId) {
        console.log("<startLogonInterval> entering... windowId:" + windowId);
        this.stopLogonInterval(windowId);
        this._windowsIntervalId[windowId] = setInterval(function () {
            chrome.tabs.getSelected(windowId, function (tab) {
                if (tab) {
                    websiteLogonBG.sendCS(tab.id, { cmd: "logon_interval" }, "all");
                }
            });
        }, 2000);
    },

    stopLogonInterval: function (windowId) {
        console.log("<stopLogonInterval> entering... windowId:" + windowId);
        if (this._windowsIntervalId[windowId]) {
            clearInterval(this._windowsIntervalId[windowId]);
            this._windowsIntervalId[windowId] = null;
            console.log("<stopLogonInterval> clear interval.");
        }
    },

    onFormSubmit: function (msg, tab) {
        console.log('<onFormSubmit> entering...');
        if (this.isWLOEnabled(tab.url)) {
            if (this.isAlwaysRememberPassword()) {
                this.abortTransaction(tab.id);
                this.startToRegister(tab.url, msg.formid, msg.userid, msg.password);
                return;
            }

            this._tabsRegInfo[tab.id] = new Array();
            this._tabsRegInfo[tab.id].url = tab.url;
            this._tabsRegInfo[tab.id].formid = msg.formid;
            this._tabsRegInfo[tab.id].userid = msg.userid;
            this._tabsRegInfo[tab.id].password = msg.password;
            if (!this._tabsCS[tab.id].frameload) {
                this.sendCS(tab.id, { cmd: "createframe" }, this._tabsCS[tab.id].maindocnum);
            } else {
                this.abortTransaction(tab.id);
                this.sendCS(tab.id, { cmd: "showregister", url: tab.url, otpsupport: this.isOTPSupport(tab.url) }, this._tabsCS[tab.id].framedocnum);
                this.sendCS(tab.id, { cmd: "showframe" }, this._tabsCS[tab.id].maindocnum);
            }
        } else {
            this._tabsRegInfo[tab.id] = null;
        }
    },

    tabCreated: function (tab) {
        console.log('<tabCreated> --'
                  + ' window: ' + tab.windowId
                  + ' tab: ' + tab.id
                  + ' index: ' + tab.index
                  + ' url: ' + tab.url);
        //this.sendCS(tab.id, {cmd:"tab_created"}, "all");
    },

    tabActiveChanged: function (tabId, selectInfo) {
        console.log('<tabActiveChanged> --'
							+ ' tab: ' + tabId
							+ ' selectInfo.windowId: ' + selectInfo.windowId);
        if (this._windowsActiveTabId[selectInfo.windowId]) {
            //this.sendCS(this._windowsActiveTabId[selectInfo.windowId], { cmd: "tab_unselected" }, "all");
        }
        this.sendCS(tabId, { cmd: "tab_selected" }, "all");
        this._windowsActiveTabId[selectInfo.windowId] = tabId;

        if (this._lastFocusTabId > -1) {
            this.setFocus(false, this._lastFocusTabId);
        }
        this.setFocus(true, tabId);
        this._lastFocusTabId = tabId;
    },

    tabRemoved: function (tabId, removeInfo) {
        console.log('<tabRemoved> --'
							+ ' tab: ' + tabId);
        this.abortTransaction(tabId);
    },

    windowRemoved: function (windowId) {
        console.log("<windowRemoved> windowId:" + windowId);
        this._windowsActiveTabId[windowId] = null;
        this.stopLogonInterval(windowId);
    },

    editWebCard: function () {
        chrome.tabs.getSelected(null, function (tab) {
            console.log("<editWebCard> chrome.tabs.getSelected url: " + tab.url);
            websiteLogonBG.sendCS(tab.id, { cmd: "editwebcard", url: tab.url }, 0);
        });
    },

    isProfileExist: function (url) {
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                return embed.IsProfileExist(url);
            }
        } catch (e) {
            console.error("<isProfileExist> exception: " + e);
            return false;
        }
    },

    openApp: function () {
        try {
            setTimeout(function () {
                var embed = document.getElementById("embed_npwlo");
                if (embed) {
                    embed.OpenApp();
                }
            }, 100);
            return true;
        } catch (e) {
            console.error("<openApp> exception: " + e);
            return false;
        }
    },

    getTLD: function (url) {
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                return embed.GetTLD(url);
            }
        } catch (e) {
            console.error("<isProfileExist> exception: " + e);
            return false;
        }
    },

    startToRegister: function (url, formId, username, password) {
        console.log('<startToRegister> --'
					+ ' url: ' + url);
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                embed.StartToRegister(url, formId, username, password);
            } else {
                console.log("<startToRegister> embed is null");
            }
        } catch (e) {
            console.error("<startToRegister> Exception:" + e);
        }
    },

    startToLogon: function (url, tabId) {
        console.log('<startToLogon> --'
					+ ' url: ' + url);
        try {
            this._tabsCS[tabId].logonURL = url;
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                embed.StartToLogon(url, tabId);
            } else {
                console.log("<startToLogon> embed is null");
            }
        } catch (e) {
            console.error("<startToLogon> Exception:" + e);
        }
    },

    abortTransaction: function (tabId) {
        console.log('<abortTransaction> --'
					+ ' tabId: ' + tabId);
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                embed.AbortTransaction(tabId);
            } else {
                console.log("<abortTransaction> embed is null");
            }
        } catch (e) {
            console.error("<abortTransaction> Exception:" + e);
        }
    },

    selectAccount: function (account, tabId) {
        console.log('<selectAccount> --'
    				+ ' account: ' + account
					+ ' tabId: ' + tabId);
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                embed.SelectAccount(account, tabId);
            } else {
                console.log("<selectAccount> embed is null");
            }
        } catch (e) {
            console.error("<selectAccount> Exception:" + e);
        }
    },

    verifyPassword: function (password, tabId) {
        console.log('<verifyPassword> --'
					+ ' tabId: ' + tabId);
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                embed.VerifyPassword(password, tabId);
            } else {
                console.log("<verifyPassword> embed is null");
            }
        } catch (e) {
            console.error("<verifyPassword> Exception:" + e);
        }
    },

    isOTPSupport: function (url) {
        console.log('<isOTPSupport> --'
					+ ' url: ' + url);
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                var res = embed.IsOTPSupport(url);
                console.log('<isOTPSupport> result: ' + res);
                return res;
            } else {
                console.log("<isOTPSupport> embed is null");
            }

            return false;
        } catch (e) {
            console.error("<isOTPSupport> Exception:" + e);
        }
    },

    isAlwaysRememberPassword: function () {
        console.log('<isAlwaysRememberPassword> entering...');
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                var res = embed.IsAlwaysRememberPassword();
                console.log('<isAlwaysRememberPassword> result: ' + res);
                return res;
            } else {
                console.log("<isAlwaysRememberPassword> embed is null");
            }

            return false;
        } catch (e) {
            console.error("<isAlwaysRememberPassword> Exception:" + e);
        }
    },

    isWLOEnabled: function (url) {
        console.log('<isWLOEnabled> --'
					+ ' url: ' + url);
        try {
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

    setWLOEnabled: function (url, enable) {
        console.log('<setWLOEnabled> --'
					+ ' url: ' + url
					+ ' enable: ' + enable);
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                embed.SetWLOEnabled(url, enable);
            } else {
                console.log("<setWLOEnabled> embed is null");
            }
        } catch (e) {
            console.error("<setWLOEnabled> Exception:" + e);
        }
    },

    setFocus: function (enable, tabId) {
        console.log('<setFocus> --'
					+ ' tabId: ' + tabId
					+ ' enable: ' + enable);
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                embed.SetFocus(enable, tabId);
            } else {
                console.log("<setFocus> embed is null");
            }
        } catch (e) {
            console.error("<setFocus> Exception:" + e);
        }
    },

    getOTP: function (tabId, otpNum) {
        console.log('<getOTP> -- otpNum: ' + otpNum + ' tabId: ' + tabId);
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                var result = embed.GetOTP(tabId, otpNum);
                if (typeof (result) != "undefined" && result) {
                    console.log('<getOTP> result: ' + result);
                    return result;
                }
            }
        } catch (e) {
            console.error("<getOTP> Exception:" + e);
        }

        return "";
    },

    openHelpFile: function () {
        console.log('<openHelpFile> entering');
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                var helpFile = embed.GetHelpFile();
                if (helpFile) {
                    helpFile = helpFile.replace(/\\/g, '/');
                    helpFile = helpFile.replace(/ /g, '%20');
                    helpFile = "file:///" + helpFile;

                    chrome.tabs.getAllInWindow(null, function (tab_array) {
                        var curr_tab;
                        var createTab = true;
                        for (var i = 0; curr_tab = tab_array[i]; i++) {
                            if (curr_tab.url === helpFile) {
                                createTab = false;
                                chrome.tabs.update(curr_tab.id, { 'selected': true, 'url': helpFile });
                                break;
                            }
                        }

                        if (createTab) { chrome.tabs.create({ 'url': helpFile }) }
                    });
                }
            }
        } catch (e) {
            console.error("<openHelpFile> Exception:" + e);
        }

        return false;
    },

    setSyncID: function (url, username, password) {
        console.log('<setSyncID> entering, username: ' + username);
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                embed.SetSyncID(url, username, password);
            } else {
                console.log("<setSyncID> embed is null");
            }
        } catch (e) {
            console.error("<setSyncID> Exception:" + e);
        }

        return false;
    },

    fillProfile: function (aFormId, aUserName, aPassword, tabId) {
        console.log('<fillProfile> --'
						+ ' formid: ' + aFormId
						+ ' username: ' + aUserName
						+ ' password: ' + aPassword);
        this._tabsTransInfo[tabId].isLogonSucceed = true;
        this.sendCS(tabId, { cmd: "fillprofile", formid: aFormId, username: aUserName, password: aPassword, issubmit: "1" }, "all");
    },

    updateUI: function (tabId, aType, aMessage) {
        console.log('<updateUI> --'
						+ ' tabId: ' + tabId
						+ ' type: ' + aType);
        if (!this._tabsCS[tabId]) {
            return;
        }

        switch (aType) {
            case "fill_otp":
                this.sendCS(tabId, { cmd: "fillotp", message: aMessage }, this._tabsCS[tabId].maindocnum);
                break;
            case "swipe_end":
                if (this._tabsRegInfo[tabId] && this._tabsRegInfo[tabId].url && this._tabsRegInfo[tabId].password) {
                    console.log("<updateUI> register running.");
                } else {
                    this.sendCS(tabId, { cmd: "hideframe" }, this._tabsCS[tabId].maindocnum);
                }
                break;
            case "logon_show":
                if (this._tabsCS[tabId].frameload) {
                    this.sendCS(tabId, { cmd: "updateui", type: aType, message: aMessage }, this._tabsCS[tabId].framedocnum);
                    this.sendCS(tabId, { cmd: "showframe" }, this._tabsCS[tabId].maindocnum);
                } else {
                    this._tabsLogonMessage[tabId] = { cmd: "updateui", type: aType, message: aMessage }; //save the logon status to update UI until iframe load.
                    this.sendCS(tabId, { cmd: "createframe" }, this._tabsCS[tabId].maindocnum);
                }
                this.initFocus(tabId);
                break;
            case "swipe_failed":
            case "swipe_focused":
            case "swipe_unfocused":
                if (this._tabsCS[tabId].frameload) {
                    this.sendCS(tabId, { cmd: "updateui", type: aType, message: aMessage }, this._tabsCS[tabId].framedocnum);
                }
                break;
            default:
                console.error("<updateUI> unhandled cmd: " + aType);
                break;
        }
    },

    initFocus: function (tabId) {
        console.log("<updateUI> set focus.");
        chrome.tabs.get(tabId, function (tab) {
            chrome.windows.get(tab.windowId, function (window) {
                console.log("<updateUI> logon window: " + window.id + " focused:" + window.focused + " tab id: " + tabId);
                if (!window.focused) {
                    websiteLogonBG.setFocus(false, tabId);
                } else {
                    // work around for "Issue 96986:  chrome.windows.onFocusChanged"
                    //start a timer to check window focus.
                    if (websiteLogonBG._lastFocusWindowId == -1) {
                        websiteLogonBG._lastFocusWindowId = window.id;
                        websiteLogonBG._focusIntervalId = setInterval("websiteLogonBG.windowFocusInterval()", 1000);
                    }
                    websiteLogonBG._lastFocusTabId = tabId;
                }
            });
        });
    },

    clearFocusInterval: function () {
        if (this._focusIntervalId) {
            clearInterval(websiteLogonBG._focusIntervalId);
            websiteLogonBG._focusIntervalId = null;
            websiteLogonBG._lastFocusWindowId = -1;
        }
    },

    windowFocusInterval: function () {
        console.log("<windowFocusInterval> entering...");
        chrome.windows.getCurrent(function (window) {
            console.log("<windowFocusInterval> window.id: " + window.id + ", focused: " + window.focused + ", _lastFocusWindowId: " + websiteLogonBG._lastFocusWindowId);
            if (window.id != websiteLogonBG._lastFocusWindowId || !window.focused) {
                websiteLogonBG.setFocus(false, websiteLogonBG._lastFocusTabId);
                websiteLogonBG.clearFocusInterval();
            }
        });
    },

    onFocusChanged: function (windowId) {
        console.log('<onFocusChanged> --'
						+ ' windowId: ' + windowId
						+ ' _lastFocusTabId: ' + this._lastFocusTabId);
        if (this._lastFocusTabId > -1) {
            this.setFocus(false, this._lastFocusTabId);
        }
        if (windowId == chrome.windows.WINDOW_ID_NONE) {
            console.log("<onFocusChanged> all chrome windows have lost focus.");
            this._lastFocusTabId = -1;
            return;
        }

        chrome.tabs.getSelected(windowId, function (tab) {
            if (tab) {
                console.log("<onFocusChanged> get focus tabId: " + tab.id);
                //clear the timer when another window get focus.
                websiteLogonBG.clearFocusInterval();
                websiteLogonBG.setFocus(true, tab.id);
                websiteLogonBG._lastFocusTabId = tab.id;
            }
        });
    },

    setSupportURL: function (url) {
        this._supportURL = url;
    },

    getSupportInfo: function () {
        console.log('<getSupportInfo> entering...');
        try {
            var embed = document.getElementById("embed_npwlo");
            if (embed) {
                return embed.GetSupportInfo();
            } else {
                console.log("<callJSFunction> embed is null");
            }
        } catch (e) {
            console.error("<callJSFunction> Exception:" + e);
        }

        return null;
    },

    intialize: function () {
        console.log("<intialize> Entering");
    },

    unintialize: function () {
        console.log("<uninitailize> Entering");
    }
};

function fillProfile(aFormId, aUserName, aPassword, tabId) {
	console.log("<fillProfile_global> Entering... formid: "+aFormId+", username:"+aUserName+", tabId:"+tabId);
	websiteLogonBG.fillProfile(aFormId, aUserName, aPassword, tabId);
	return 4;
}

function updateUI(tabId, aType, aMessage) {
	console.log("<updateUI_global> Entering... tabId:"+tabId+", type: "+aType+", message: "+aMessage);
	websiteLogonBG.updateUI(tabId, aType, aMessage);
	return 3;
}

window.addEventListener("load", function() { websiteLogonBG.intialize(); }, false);
window.addEventListener("unload", function() { websiteLogonBG.unintialize(); }, false);

chrome.extension.onConnect.addListener(function(port) { websiteLogonBG.connectCS(port); });
chrome.windows.onFocusChanged.addListener(function(windowId) { websiteLogonBG.onFocusChanged(windowId); });
chrome.windows.onRemoved.addListener(function(windowId) { websiteLogonBG.windowRemoved(windowId); }); 

chrome.tabs.onCreated.addListener(function(tab){websiteLogonBG.tabCreated(tab);});
chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo) { websiteLogonBG.tabActiveChanged(tabId, selectInfo); });
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) { websiteLogonBG.tabRemoved(tabId, removeInfo); });

//"onSelectionChanged" is change to "onActiveChanged" from chrome16, the old method still work.
//chrome.tabs.onActiveChanged.addListener(function(tabId, selectInfo){websiteLogonBG.tabActiveChanged(tabId, selectInfo);});