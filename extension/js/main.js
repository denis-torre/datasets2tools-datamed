//////////////////////////////////////////////////////////////////////
///////// 1. Define Main Function ////////////////////////////////////
//////////////////////////////////////////////////////////////////////
////////// Author: Denis Torre
////////// Affiliation: Ma'ayan Laboratory, Icahn School of Medicine at Mount Sinai
////////// Based on Cite-D-Lite (https://github.com/MaayanLab/Cite-D-Lite).

function main() {

	// Locate parents on HTML page
	var $parents = Interface.locateParents();

	// Get Canned Analyses of corresponding datasets
	var cannedAnalysisData = API.main($parents);

	// Add Canned Analyses to the webpage
	Interface.addCannedAnalyses($parents, cannedAnalysisData);

	// Add event listeners for interactivity
	eventListener.main(cannedAnalysisData);
	console.log(cannedAnalysisData);
}


//////////////////////////////////////////////////////////////////////
///////// 2. Run Main Function ///////////////////////////////////////
//////////////////////////////////////////////////////////////////////
main();
