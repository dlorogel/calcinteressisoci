sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Filter, FilterOperator, MessageToast, Fragment, JSONModel) {
        "use strict";

        return Controller.extend("it.orogel.calcinteressisoci.controller.Home", {
            onInit: function () {
                this.oGlobalBusyDialog = new sap.m.BusyDialog();
                this.setInitialsModel();
            },
            onCalculate: function () {

            },
            onValueHelpRequest: async function (event, field, isFilter) {

                var oView = this.getView();

                if (!this._pValueHelpDialog) {
                    this._pValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "it.orogel.calcinteressisoci.view.MatchFrag",
                        controller: this
                    }).then(function (oValueHelpDialog) {
                        oView.addDependent(oValueHelpDialog);
                        return oValueHelpDialog;
                    });
                }

                await this.getCompanyCode();
                this._pValueHelpDialog.then(function (oValueHelpDialog) {
                    oValueHelpDialog.open();
                }.bind(this));
            },
            onValueHelpDialogClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                var inputModel = this.getOwnerComponent().getModel("inputModel").getData()
                inputModel.BUKRS = oSelectedItem.getTitle()
                inputModel.BUKRS_text = oSelectedItem.getProperty("description")
                this.getOwnerComponent().setModel(new JSONModel({}), "matchModel")
                this.refresh("matchModel");
                this.refresh("inputModel");
            },
            getCompanyCode: function (filters) {
                this.oGlobalBusyDialog.open();
                var model = this.getOwnerComponent().getModel("companyModel");
                var that = this;
                var arrRes = [];
                //aFilter.push(new Filter("CompanyCode", sap.ui.model.FilterOperator.EQ, filters.BUKRS));
                //aFilter.push(new Filter("Customer", sap.ui.model.FilterOperator.EQ, filters.KUNNR));
                //aFilter.push(new Filter("SpecialGLCode", sap.ui.model.FilterOperator.EQ, "1"));
                //aFilter.push(new Filter("ClearingAccountingDocument", sap.ui.model.FilterOperator.EQ, ""));

                model.read("/A_CompanyCode", {
                    success: function (response) {
                        response.results.forEach(e => {
                            let obj = { key: e.CompanyCode, text: e.CompanyCodeName }
                            arrRes.push(obj)
                        });
                        that.getOwnerComponent().getModel("matchModel").setData(arrRes);
                        that.refresh("matchModel");
                        that.oGlobalBusyDialog.close();
                    },
                    error: function (error) {
                        console.log(error)
                        that.oGlobalBusyDialog.close();
                    }
                });
            },
            getJournal: function () {
                this.oGlobalBusyDialog.open();
                var input = this.getOwnerComponent().getModel("inputModel").getData()
                var tax = this.getOwnerComponent().getModel("taxModel").getData()
                var model = this.getOwnerComponent().getModel();
                var that = this;
                var aFilter = [];
                var arrTable1 = [];
                var arrTable2 = [];
                var arrTable3 = [];
                tax.forEach(t => {
                    let t2 = { ZZ_DATA_DA: t.ZZ_DATA_DA, ZZ_DATA_A: t.ZZ_DATA_A, ZZ_TASSO: t.ZZ_TASSO }
                    arrTable2.push(t2)
                });

                aFilter.push(new Filter("CompanyCode", sap.ui.model.FilterOperator.EQ, input.BUKRS));
                //aFilter.push(new Filter("Customer", sap.ui.model.FilterOperator.EQ, filters.KUNNR));
                aFilter.push(new Filter("SpecialGLCode", sap.ui.model.FilterOperator.EQ, "1"));
                aFilter.push(new Filter("ClearingAccountingDocument", sap.ui.model.FilterOperator.EQ, ""));
                aFilter.push(new Filter("FiscalYear", sap.ui.model.FilterOperator.EQ, this.sYear));
                model.read("/A_OperationalAcctgDocItemCube", {
                    filters: [aFilter],
                    success: function (response) {

                        for (let i = 0; i < response.results.length; i++) {
                            //if (response.results.length === 2) {
                            if (i > 0) {
                                var dateA = response.results[i].DocumentDate.toJSON().slice(0, 10)
                                var table1 = { ZZ_DATA_DA: response.results[i].DocumentDate.toJSON().slice(0, 10), ZZ_DATA_A: input.ZZ_DATA_A, capitale: parseFloat(response.results[i].AmountInTransactionCurrency) + parseFloat(response.results[i - 1].AmountInTransactionCurrency) }
                            } else if (response.results.length === 1) {
                                var dateA = response.results[i].DocumentDate.toJSON().slice(0, 10)
                                var table1 = { ZZ_DATA_DA: response.results[i].DocumentDate.toJSON().slice(0, 10), ZZ_DATA_A: input.ZZ_DATA_A, capitale: parseFloat(response.results[i].AmountInTransactionCurrency) }
                            } else {
                                var dateSub = that.subtractDays(1, response.results[i + 1].DocumentDate)
                                var dateA = dateSub.toJSON().slice(0, 10)
                                var table1 = { ZZ_DATA_DA: response.results[i].DocumentDate.toJSON().slice(0, 10), ZZ_DATA_A: dateA, capitale: parseFloat(response.results[i].AmountInTransactionCurrency) }
                            }
                            //}
                            arrTable1.push(table1)
                        }

                        var flag = false;
                        var lastdata = "";
                        for (let l = 0; l < tax.length; l++) {
                            for (let z = 0; z < arrTable1.length; z++) {
                                if ((arrTable1[z].ZZ_DATA_DA <= tax[l].ZZ_DATA_DA && arrTable1[z].ZZ_DATA_A <= tax[l].ZZ_DATA_A && arrTable1[z].ZZ_DATA_A >= tax[l].ZZ_DATA_DA) || (arrTable1[z].ZZ_DATA_DA >= tax[l].ZZ_DATA_DA && arrTable1[z].ZZ_DATA_A <= tax[l].ZZ_DATA_A) || (arrTable1[z].ZZ_DATA_DA <= tax[l].ZZ_DATA_A && arrTable1[z].ZZ_DATA_A >= tax[l].ZZ_DATA_A)) {
                                    if (lastdata === "") {
                                        lastdata = arrTable1[z].ZZ_DATA_DA;
                                    }
                                    if (arrTable1[z].ZZ_DATA_A <= tax[l].ZZ_DATA_A && lastdata >= tax[l].ZZ_DATA_DA) {
                                        var table3 = { ZZ_DATA_DA: lastdata, ZZ_DATA_A: arrTable1[z].ZZ_DATA_A, capitale: arrTable1[z].capitale, tassoInteresse: that.getPercentage(lastdata).percentage }
                                        arrTable3.push(table3)
                                        if (arrTable1[z + 1] !== undefined) {
                                            lastdata = arrTable1[z + 1].ZZ_DATA_DA;
                                        }

                                    } else if (arrTable1[z].ZZ_DATA_A >= tax[l].ZZ_DATA_A && lastdata >= tax[l].ZZ_DATA_DA && lastdata <= tax[l].ZZ_DATA_A) {
                                        var table3 = { ZZ_DATA_DA: lastdata, ZZ_DATA_A: tax[l].ZZ_DATA_A, capitale: arrTable1[z].capitale, tassoInteresse: that.getPercentage(lastdata).percentage }
                                        arrTable3.push(table3)
                                        if (tax[l + 1] !== undefined) {
                                            lastdata = tax[l + 1].ZZ_DATA_DA;
                                        }
                                    }
                                }
                            }
                        }

                        var arrTable4 = [];
                        var total = 0;
                        arrTable3.forEach(e => {
                            var table4 = { ZZ_DATA_DA: e.ZZ_DATA_DA, ZZ_DATA_A: e.ZZ_DATA_A, capitale: e.capitale, tassoInteresse: e.tassoInteresse, nDays: that.differenceDays(e.ZZ_DATA_DA, e.ZZ_DATA_A) }
                            total += (e.capitale * e.tassoInteresse * that.differenceDays(e.ZZ_DATA_DA, e.ZZ_DATA_A) / 100) / 365;
                            arrTable4.push(table4)
                        });
                        console.table(arrTable4)
                       
                        var outputObject = { BUKRS: response.results[0].CompanyCode, BUTXT: response.results[0].CompanyCodeName, KUNNR: response.results[0].Customer, NAME1: response.results[0].CustomerName, WRBTR: total }

                        that.getOwnerComponent().getModel("outputModel").setData(outputObject);
                        that.refresh("outputModel");
                        that.oGlobalBusyDialog.close();
                    },
                    error: function (error) {
                        console.log(error)
                        that.oGlobalBusyDialog.close();
                    }
                });
            },
            getPercentage: function (date) {
                var taxModel = this.getOwnerComponent().getModel("taxModel").getData()
                var obj = {}
                for (let i = 0; i < taxModel.length; i++) {
                    if (taxModel[i].hasOwnProperty('ZZ_DATA_DA') && taxModel[i].hasOwnProperty('ZZ_DATA_A')) {
                        if (date >= taxModel[i].ZZ_DATA_DA && date <= taxModel[i].ZZ_DATA_A) {
                            obj.percentage = taxModel[i].ZZ_TASSO
                            obj.flag = true
                            return obj;
                        }
                    }

                }
            },
            onOpenTax: function () {
                if (!this._searchHelpEMPDialog) {
                    this._searchHelpEMPDialog = sap.ui.xmlfragment("it.orogel.calcinteressisoci.view.TaxFrag", this);
                    this.getView().addDependent(this._searchHelpEMPDialog);
                }
                this._searchHelpEMPDialog.open();
            },
            onSaveTax: function () {
                this.refresh("taxModel")
                this.onCloseTax()
            },
            onCloseTax: function () {
                this._searchHelpEMPDialog.close();
                this._searchHelpEMPDialog.destroy();
                this._searchHelpEMPDialog = null;
            },
            setInitialsModel: function () {
                let dToday = new Date()
                this.sDay = String(dToday.getDate()).padStart(2, "0");
                this.sMonth = String(dToday.getMonth() + 1).padStart(2, "0");
                this.sYear = dToday.getFullYear();
                this.today = this.sYear + '-' + this.sMonth + '-' + this.sDay;
                var inputModel = this.getOwnerComponent().setModel(new JSONModel({ ZZ_DATA_DA: this.sYear + '-01-01', ZZ_DATA_A: this.sYear + '-12-31' }), "inputModel");
                var outputModel = this.getOwnerComponent().setModel(new JSONModel({}), "outputModel");
                this.refresh("inputModel")
                var matchModel = this.getOwnerComponent().setModel(new JSONModel({}), "matchModel");
                var taxModel = this.getOwnerComponent().setModel(new JSONModel([{ ZZ_DATA_DA: this.sYear + '-01-01', ZZ_DATA_A: this.sYear + '-08-31', ZZ_TASSO: 2 }, { ZZ_DATA_DA: this.sYear + '-09-01', ZZ_DATA_A: this.sYear + '-12-31', ZZ_TASSO: 3 }]), "taxModel");
            },
            differenceDays: function (date1, date2) {
                let time = Math.round(new Date(date2) - new Date(date1))
                let diffDays = Math.ceil(time / (1000 * 60 * 60 * 24))
                return diffDays;
                //let finalAmount = (obj.amount * obj.tassoInteresse * diffDays / 100) / 365;
            },
            subtractDays: function (numOfDays, date = new Date()) {
                const dateCopy = new Date(date.getTime());

                dateCopy.setDate(dateCopy.getDate() - numOfDays);

                return dateCopy;
            },
            refresh: function (modelName) {
                this.getOwnerComponent().getModel(modelName).refresh();
            },
            getText: function (text) {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(text);
            },
        });
    });
