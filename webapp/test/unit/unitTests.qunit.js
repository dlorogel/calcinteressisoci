/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"itorogel/calc_interessi_soci/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
