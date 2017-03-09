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
}

//////////////////////////////////////////////////////////////////////
///////// 2. Define Variables ////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////
////////// 1. Page ///////////////////////////////
//////////////////////////////////////////////////

///// Functions related to the webpage.

var Page = {

	//////////////////////////////
	///// 1. isDataMedSearchResults
	//////////////////////////////

	///// Returns true if the user is on a DataMed search results page, otherwise false

	isDataMedSearchResults: function() {
		// return /https:\/\/datamed\.org\/search\.php\?.*/.test(window.location.href);
		return /http:\/\/localhost\:5000\/datamedResults.*/.test(window.location.href);
	},

	//////////////////////////////
	///// 2. isDataMedLanding
	//////////////////////////////

	///// Returns true if the user is on a DataMed dataset landing page, otherwise false

	isDataMedLanding: function() {
		// return /https:\/\/datamed\.org\/display\-item\.php\?.*/.test(window.location.href);
		return /http:\/\/localhost\:5000\/datamedLanding.*/.test(window.location.href);
	},

	//////////////////////////////
	///// 3. getLabel
	//////////////////////////////

	///// Returns labels according to location, used for CSS formatting

	getLabel: function() {
		var self = this;
		if (self.isDataMedSearchResults()) {
			return 'datamed datamed-search';
		} else if (self.isDataMedLanding()) {
			return 'datamed datamed-landing';
		}
	}
};

//////////////////////////////////////////////////
////////// 2. Interface //////////////////////////
//////////////////////////////////////////////////

///// Functions related to preparing and loading the interfaces.

var Interface = {

	//////////////////////////////
	///// 1. locateParents
	//////////////////////////////

	///// Locates HTML elements which will be used to extract dataset accessions and append the interfaces

	locateParents: function() {
		var $parents;
		if (Page.isDataMedSearchResults()) {
			$parents = $('.search-result li');
		} else if (Page.isDataMedLanding()) {
			$parents = $('a:contains("Dataset")').parents('.panel-group');
		}
		return $parents;
	},

	//////////////////////////////
	///// 2. getDatasetAccession
	//////////////////////////////

	///// Extracts the dataset accession from a parent element identified above

	getDatasetAccession: function($parents) {
		var datasetAccession;
		if (Page.isDataMedSearchResults()) {
			datasetAccession = $parents.find(".result-field em:contains('ID:'), em:contains('Accession:')").next().text().replace(/\s+/g, '');
		} else if (Page.isDataMedLanding()) {
			datasetAccession = $parents.find('td:contains("ID:")').next().children().eq(0).text().replace(/\s+/g, '');
		}
		return datasetAccession;
	},

	//////////////////////////////
	///// 3. addCannedAnalyses
	//////////////////////////////

	///// Prepares and adds canned analysis interface to the parent element, given the canned analysis data

	addCannedAnalyses: function($parents, cannedAnalysisData) {
		var self = this;
		if (Page.isDataMedSearchResults()) {
			$($parents).each(function(i, elem){
				datasetAccession = self.getDatasetAccession($(elem));
				if ($.inArray(datasetAccession, Object.keys(cannedAnalysisData['canned_analyses'])) > -1) {
					var toolbarHTML = toolbar.getHTML(datasetAccession, cannedAnalysisData);
					$parents.eq(i).append(toolbarHTML);
				}
			})
		} else if (Page.isDataMedLanding()) {
			var self = this, datasetAccessionString = self.getDatasetAccession($parents), toolbarHTML = tooltable.getHTML(datasetAccessionString, cannedAnalysisData);
			tooltable.add($parents, toolbarHTML);
		}
	}
};

//////////////////////////////////////////////////
////////// 3. API ////////////////////////////////
//////////////////////////////////////////////////

///// Function related to getting canned analyses from the Datasets2Tools database.

var API = {

	//////////////////////////////
	///// 1. main
	//////////////////////////////

	///// Gets canned analysis data, given the parents

	main: function($parents) {
		var apiURL = 'https://amp.pharm.mssm.edu/datasets2tools/data?';
		if (Object.keys($parents).length > 1) {
			var datasetAccession, datasetAccessionArray = [];
			$($parents).each(function(i, elem) {
				datasetAccession = Interface.getDatasetAccession($(elem));
				datasetAccessionArray.push(datasetAccession);
			})
			apiURL += datasetAccessionArray.join('+');
		} else {
			apiURL += Interface.getDatasetAccession($parents);
		}
		$.ajax({
			type: "GET",
			url: apiURL,
			async: false,
			success: function(text) {
				cannedAnalysisData = JSON.parse(text);
			}
		});
		return cannedAnalysisData;
	}
};

//////////////////////////////////////////////////
////////// 4. toolbar ////////////////////////////
//////////////////////////////////////////////////

///// Functions related to preparing the Datasets2Tools toolbar for dataset search results pages.

var toolbar = {

	//////////////////////////////
	///// 1. getToolTabHTML
	//////////////////////////////

	///// Function to prepare the tool tab HTML (the element containing the tool icons).  Will be expanded when there are 5+ tools for GEO datasets.

	getToolTabHTML: function(datasetAccessionString, cannedAnalysisData) {
		var toolbarHTML = '<div class="datasets2tools-tool-icon-tab datasets2tools-compact">', toolIds, toolId, nrCannedAnalyses;
		toolIds = Object.keys(cannedAnalysisData['canned_analyses'][datasetAccessionString]);
		for (var i = 0; i < toolIds.length; i++) {
			toolId = toolIds[i];
			nrCannedAnalyses = Object.keys(cannedAnalysisData['canned_analyses'][datasetAccessionString][toolId]).length;
			toolbarHTML += '<div class="datasets2tools-tooltip-hover datasets2tools-toolicon-tooltip-hover"><button class="datasets2tools-tool-icon-button datasets2tools-button" id="' + toolId + '" type="button" style="background:url(' + cannedAnalysisData['tools'][toolId]['tool_icon_url'] + ') no-repeat;background-size:95%;background-position:center;"></button><div class="datasets2tools-tooltip-text datasets2tools-toolicon-tooltip-text"><b>' + cannedAnalysisData['tools'][toolId]['tool_name'] + '</b><p><i>' + nrCannedAnalyses + ' canned analyses</i></p><p>' + cannedAnalysisData['tools'][toolId]['tool_description'] + '</p></div></div>'
		}
		toolbarHTML += '</div>'
		return toolbarHTML;
	},

	//////////////////////////////
	///// 2. getHTML
	//////////////////////////////

	///// Function to prepare the toolbar HTML.

	getHTML: function(datasetAccessionString, cannedAnalysisData) {
		var self = this,
			interfaceHTML,
			toolbarHTML = '<div class="datasets2tools-toolbar datasets2tools-main ' + Page.getLabel() + '" id="' + datasetAccessionString + '">', //datasets2tools-
			searchBarHTML = '<div class="datasets2tools-search-bar">',
			logoTabHTML = '<div class="datasets2tools-logo-tab"><button class="datasets2tools-logo-button datasets2tools-button"></button><span style="font-size:xx-small">&nbsp</span><div class="datasets2tools-title-label datasets2tools-compact">Datasets2Tools</div></div>',
			toolTabHTML = self.getToolTabHTML(datasetAccessionString, cannedAnalysisData),
			selectedToolTabHTML = '<div class="datasets2tools-selected-tool-tab datasets2tools-expand"></div>',
			searchTabHTML = '<div class="datasets2tools-search-tab datasets2tools-expand"><div class="datasets2tools-tool-info-label"> <i>Tool Information</i> </div> <form class="datasets2tools-search-form"> <div class="datasets2tools-search-label">Search:</div><div class="datasets2tools-search-input"><input class="datasets2tools-search-text-input" type="text" name="datasets2tools-search-query"></div></form></div>',
			browseBarHTML = '<div class="datasets2tools-browse-bar datasets2tools-expand"><div id="' + datasetAccessionString + '" class="datasets2tools-table-wrapper"></div><div class="datasets2tools-tool-info-tab"></div></div>';
		interfaceHTML = toolbarHTML + searchBarHTML + logoTabHTML + toolTabHTML + selectedToolTabHTML + searchTabHTML + '</div>' + browseBarHTML + '</div>';
		return interfaceHTML;
	},

	//////////////////////////////
	///// 3. compact
	//////////////////////////////

	///// Switches the display to compact: hides the browsetable, shows the toolbar, colorizes the icon.

	compact: function($datasets2toolsToolbar) {
		$datasets2toolsToolbar.find('.datasets2tools-compact').show();
		$datasets2toolsToolbar.find('.datasets2tools-expand').hide();
		$datasets2toolsToolbar.find('.datasets2tools-tool-info-label').hide();
		$datasets2toolsToolbar.find('.datasets2tools-search-form').show();
		$datasets2toolsToolbar.find('.datasets2tools-search-bar').css('display', 'inline-block');
		$datasets2toolsToolbar.find('.datasets2tools-logo-button').css({'filter': 'grayscale(0%)', 'opacity': '1'});
	},

	//////////////////////////////
	///// 4. expand
	//////////////////////////////

	///// Switches the display to expand: shows the browsetable, hides the toolbar, turns the icon to grayscale.

	expand: function($datasets2toolsToolbar) {
		$datasets2toolsToolbar.find('.datasets2tools-compact').hide();
		$datasets2toolsToolbar.find('.datasets2tools-expand').show();
		$datasets2toolsToolbar.find('.datasets2tools-search-bar').css('display', 'block');
		$datasets2toolsToolbar.find('.datasets2tools-logo-button').css({'filter': 'grayscale(100%)', 'opacity': '0.5'});
	},

	//////////////////////////////
	///// 5. addSelectedToolTab
	//////////////////////////////

	///// Adds the tab with information about the selected tool.

	addSelectedToolTab: function($datasets2toolsToolbar, toolId, cannedAnalysisData) {
		var $selectedToolTab = $datasets2toolsToolbar.find('.datasets2tools-selected-tool-tab');
		var selectedToolTabHTML = '<img src="' + cannedAnalysisData['tools'][toolId]['tool_icon_url'] + '" class="datasets2tools-selected-tool-img" id="' + toolId + '"><div class="datasets2tools-selected-tool-label">' + cannedAnalysisData['tools'][toolId]['tool_name'] + '</div><button type="button" class="datasets2tools-tool-info-button datasets2tools-button"></button>';
		$selectedToolTab.html(selectedToolTabHTML);
	},

	//////////////////////////////
	///// 7. addToolInfoTab
	//////////////////////////////

	///// Adds the tab with information about the tool, expanded.

	addToolInfoTab: function($datasets2toolsToolbar, toolId, cannedAnalysisData) {
		var toolDescriptionHTML = cannedAnalysisData['tools'][toolId]['tool_description'];
		var toolLinkHTML = '<a href="' + cannedAnalysisData['tools'][toolId]['tool_homepage_url'] + '">Homepage</a>';
		// var publicationLinkHTML = '<a href="' + cannedAnalysisData['tools'][toolId]['publication_url'] + '">Reference</a>';
		// toolInfoHTML = '<b><u>Tool Description</b></u><br>' + toolDescriptionHTML + '<br><br><b><u>Links</b></u><br>' + toolLinkHTML + '&nbsp' + publicationLinkHTML + '<button class="datasets2tools-close-tool-info-button">✖</button>';
		toolInfoHTML = '<b><u>Tool Description</b></u><br>' + toolDescriptionHTML + '<br><br><b><u>Links</b></u><br>' + toolLinkHTML + '<button class="datasets2tools-close-tool-info-button">✖</button>';
		$datasets2toolsToolbar.find('.datasets2tools-tool-info-tab').html(toolInfoHTML);
		$datasets2toolsToolbar.find('.datasets2tools-search-form').hide();
		$datasets2toolsToolbar.find('.datasets2tools-tool-info-label').show();
		$datasets2toolsToolbar.find('.datasets2tools-tool-info-tab').show();
		$datasets2toolsToolbar.find('.datasets2tools-table-wrapper').hide();
	}
};

//////////////////////////////////////////////////
////////// 5. tooltable //////////////////////////
//////////////////////////////////////////////////

///// Functions related to preparing the Datasets2Tools tooltable for dataset landing pages.

var tooltable = {

	//////////////////////////////
	///// 1. getHTML
	//////////////////////////////

	///// Gets the HTML for the tooltable, to display on dataset landing pages.

	getHTML: function(datasetAccessionString, cannedAnalysisData) {
		var toolTableHTML = '<div class="datasets2tools-table-intro">The following table displays a list of computational tools which have been used to generate canned analyses of the dataset.  To explore the analyses, click on the expand button on the right of the desired tool.</div><div id="' + datasetAccessionString + '" class="datasets2tools-table-wrapper"><table class="datasets2tools-tool-table"><tr><th class="datasets2tools-tooltable-tool-header">Tool</th><th class="datasets2tools-tooltable-description-header">Description</th><th class="datasets2tools-tooltable-cannedanalysis-header">Canned Analyses</th></tr>',
			toolIds = Object.keys(cannedAnalysisData['tools']),
			cannedAnalyses = cannedAnalysisData['canned_analyses'][Object.keys(cannedAnalysisData['canned_analyses'])[0]],
			toolData = cannedAnalysisData['tools'],
			nrOfCannedAnalyses = {},
			toolId;
		for (i = 0; i < toolIds.length; i++) {
			toolId = toolIds[i];
			nrOfCannedAnalyses[toolId] = Object.keys(cannedAnalyses[toolId]).length;
		}
		toolsSorted = Object.keys(nrOfCannedAnalyses).sort(function(a,b){return nrOfCannedAnalyses[b]-nrOfCannedAnalyses[a]});
		for (i = 0; i < toolsSorted.length; i++) {
			toolId = toolsSorted[i];
			toolTableHTML += '<tr class="datasets2tools-tooltable-row"><td class="datasets2tools-tooltable-tool-col"><a href="' + toolData[toolId]['tool_homepage_url'] + '"><img class="datasets2tools-tooltable-tool-img" src="' + toolData[toolId]['tool_icon_url'] + '" id="' + toolId + '"></a><a class="datasets2tools-tooltable-tool-label" href="' + toolData[toolId]['tool_homepage_url'] + '">' + toolData[toolId]['tool_name'] + '</a></td>';
			toolTableHTML += '<td class="datasets2tools-tooltable-description-col">' + toolData[toolId]['tool_description'] + '</td>';
			toolTableHTML += '<td class="datasets2tools-tooltable-cannedanalysis-col">' + Object.keys(cannedAnalyses[toolId]).length + '<button class="datasets2tools-tooltable-plus-button datasets2tools-button" type="button" id="' + toolId + '"></button></td></tr>';
		}
		toolTableHTML += '</table></div>';
		return toolTableHTML;
	},

	//////////////////////////////
	///// 2. addToolDescription
	//////////////////////////////

	///// Add tool description when clicking on a plus icon, and functions to go back to the table.

	addToolDescription: function($evtTarget, toolId, cannedAnalysisData) {
		var toolDescriptionHTML = '<a class="datasets2tools-back"> <<< Back To Tools </a><br><div class="datasets2tools-tooltable-toolintro"><img class="datasets2tools-selected-tool-img" id="' + toolId + '" style="height:50px;width:50px;" src="' + cannedAnalysisData['tools'][toolId]['tool_icon_url'] + '"></img><div class="datasets2tools-tooltable-toolname">' + cannedAnalysisData['tools'][toolId]['tool_name'] + '</div></div>';
		toolDescriptionHTML += '<div class="datasets2tools-toolintro-subtitle">Tool Description</div>' + cannedAnalysisData['tools'][toolId]['tool_description'] + '.<div class="datasets2tools-toolintro-subtitle">Resources</div><a href="' + cannedAnalysisData['tools'][toolId]['tool_homepage_url'] + '">Homepage</a>&nbsp&nbsp&nbspReference';
		toolDescriptionHTML += '<div class="datasets2tools-toolintro-subtitle">Canned Analyses</div>The table below displays existing canned analyses for the dataset-tool pair.  Users can access canned analysis URLs by clicking on the links, browse and download analysis metadata, search analyses by keywords, and share the analyses with other users.<form class="datasets2tools-search-form"><div class="datasets2tools-search-label">Search:</div><div class="datasets2tools-search-input"><input class="datasets2tools-search-text-input" type="text" name="datasets2tools-search-query"></div></form>';
		$('.datasets2tools-main').find('.datasets2tools-table-intro').html(toolDescriptionHTML);
	},

	//////////////////////////////
	///// 3. add
	//////////////////////////////

	///// Adds the tooltable.

	add: function($parent, elementHTML) {
		var self = this;
		$parent.after('<div class="panel-group" id="accordion-cannedAnalyses" role="tablist" aria-multiselectable="true"><div class="panel panel-info"><div class="panel-heading" role="tab" id="heading-dataset-cannedAnalyses"><h4 class="panel-title"><a role="button" data-toggle="collapse" data-parent="#accordion-cannedAnalyses" data-target="#collapse-dataset-cannedAnalyses" href="#collapse-dataset-cannedAnalyses" aria-expanded="true" aria-controls="collapse-dataset-cannedAnalyses"><i class="fa fa-chevron-up"></i>&nbspCanned Analyses</a></h4></div><div id="collapse-dataset-cannedAnalyses" class="panel-collapse collapse in" role="tabpanel" aria-labelledby="heading-dataset-cannedAnalyses"><div class="panel-body"><div id="' + Interface.getDatasetAccession($parent) + '" class="datasets2tools-main ' + Page.getLabel() + '">'+elementHTML+'</div></div></div></div></div>');
	}
};

//////////////////////////////////////////////////
////////// 6. browsetable ////////////////////////
//////////////////////////////////////////////////

///// Functions related to the canned analysis browse table.

var browsetable = {

	//////////////////////////////
	///// 1. getLinkHTML
	//////////////////////////////

	///// Prepares the HTML code for the canned analysis link, column 1 of the canned analysis table.

	getLinkHTML: function(cannedAnalysisObj, toolIconUrl) {
		return '<td><a href="' + cannedAnalysisObj['canned_analysis_url'] + '"><img class="datasets2tools-cannedanalysis-link-img" src="' + toolIconUrl + '"></a></td>';
	},

	//////////////////////////////
	///// 2. getDescriptionHTML
	//////////////////////////////

	///// Prepares the HTML code for the canned analysis description, column 2 of the canned analysis table.

	getDescriptionHTML: function(cannedAnalysisObj, maxDescriptionLength) {

		// Get description
		var cannedAnalysisDescription = cannedAnalysisObj['description'];

		// // Prepare Displayed Description
		// if (cannedAnalysisDescription.length > maxDescriptionLength) {

		// 	displayedDescription = cannedAnalysisDescription.substring(0, maxDescriptionLength) + '<span class="datasets2tools-tooltip-hover datasets2tools-description-tooltip-hover">...<div class="datasets2tools-tooltip-text datasets2tools-description-tooltip-text">' + cannedAnalysisDescription + '</div></span>';

		// } else {

		// 	displayedDescription = cannedAnalysisDescription;

		// }

		// // Return
		// return '<td class="datasets2tools-canned-analysis-description">' + displayedDescription + '</td>';

		// Return
		return '<td class="datasets2tools-canned-analysis-description" data-toggle="tooltip" data-container="body" data-placement="bottom" title="' + cannedAnalysisDescription + '">' + cannedAnalysisDescription + '</td>';//'<div class="datasets2tools-tooltip-text datasets2tools-description-tooltip-text">' + cannedAnalysisDescription + '</div></td>';		
	},

	//////////////////////////////
	///// 3. getViewMetadataHTML
	//////////////////////////////

	///// Prepares the HTML code for the metadata view hover, column 3 of the canned analysis table.

	getViewMetadataHTML: function(cannedAnalysisObj) {

		// Define variables
		var metadataKeys = Object.keys(cannedAnalysisObj),
			metadataKeyNumber = metadataKeys.length,
			metadataTooltipString = '', //<b>Metadata</b><br>
			viewMetadataHTML,
			metadataKey;

		// Loop through tags
		if (metadataKeyNumber > 2) {

			for (var j = 0; j < metadataKeyNumber; j++) {

				// Get Metadata Key
				metadataKey = metadataKeys[j];

				// Get Metadata Value
				if (!(['canned_analysis_url', 'description'].indexOf(metadataKey) >= 0)) {
					metadataTooltipString += '<b>' + metadataKey + '</b>: ' + cannedAnalysisObj[metadataKey] + '<br>';
				}
			}

		} else {

			metadataTooltipString += 'No metadata available.';

		}

		// Close DIV
		viewMetadataHTML = '<div class="datasets2tools-tooltip-hover datasets2tools-metadata-tooltip-hover"><img class="datasets2tools-view-metadata-img datasets2tools-metadata-img" src="./icons/info.png"><div class="datasets2tools-tooltip-text datasets2tools-metadata-tooltip-text">'+metadataTooltipString+'</div></div>';

		// Return
		return viewMetadataHTML;
	},

	//////////////////////////////
	///// 4. getDownloadMetadataHTML
	//////////////////////////////

	///// Prepares the HTML code for the metadata download dropdown, column 3 of the canned analysis table.

	getDownloadMetadataHTML: function(cannedAnalysisObj) {

		// Define variables
		var downloadMetadataHTML = '<div class="datasets2tools-dropdown-hover datasets2tools-metadata-dropdown-hover">';

		// Add Stuff
		downloadMetadataHTML += '<button class="datasets2tools-button datasets2tools-dropdown-button datasets2tools-download-metadata-button"></button>';
		
		// Add Stuff
		downloadMetadataHTML += '<div class="datasets2tools-dropdown-text datasets2tools-metadata-dropdown-text">';

		// Add functionality
		downloadMetadataHTML += '<b>Download Metadata:</b><br>';

		// Add TXT Button
		downloadMetadataHTML += '<ul style="margin:0;padding-left:20px;"><li><button class="datasets2tools-button datasets2tools-metadata-download-button" id="getTXT">TXT</button></li>';

		// Add JSON Button
		downloadMetadataHTML += '<li><button class="datasets2tools-button datasets2tools-metadata-download-button" id="getJSON">JSON</button></li></ul>';
		
		// Close DIV
		downloadMetadataHTML += '</div></div>';

		// Return
		return downloadMetadataHTML;
	},

	//////////////////////////////
	///// 5. downloadFile
	//////////////////////////////

	///// Downloads metadata file.


	downloadFile: function(text, filename) {
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	},

	//////////////////////////////
	///// 6. downloadMetadata
	//////////////////////////////

	///// Formats the metadata in the appropriate way (TXT or JSON), preparing it for download.

	downloadMetadata: function(cannedAnalysisObj, fileFormat) {
		var self = this,
			metadataString;
		switch(fileFormat) {
			case 'TXT':
				var metadataString = 'Tag\tValue\n',
					metadataKey,
					metadataKeys = Object.keys(cannedAnalysisObj);
				for (var k = 0; k < metadataKeys.length; k++) {
					metadataKey = metadataKeys[k];
					metadataString += metadataKey + '\t' + cannedAnalysisObj[metadataKey] + '\n';
				}
				self.downloadFile(metadataString, 'metadata.txt');
				break;

			case 'JSON':
				metadataString = JSON.stringify(cannedAnalysisObj, null, 2);
				self.downloadFile(metadataString, 'metadata.json');
				break;
		}
	},

	//////////////////////////////
	///// 7. getShareHTML
	//////////////////////////////

	///// Prepares the HTML code for the share dropdown, column 4 of the canned analysis table.

	getShareHTML: function(cannedAnalysisObj, toolIconUrl) {

		// Define HTML String
		var shareHTML = '<td>';

		// Interactive DIV HTML
		var interactiveDivHTML = '<div class="datasets2tools-dropdown-hover datasets2tools-share-dropdown-hover">';

		// Dropdown DIV HTML
		var dropdownDivHTML = '<div class="datasets2tools-dropdown-text datasets2tools-share-dropdown-text">';

		// Share Image
		var shareImageHTML = '<button class="datasets2tools-button datasets2tools-dropdown-button datasets2tools-share-button"></button>';

		// Link Image
		var linkImageHTML = '<img class="datasets2tools-dropdown-icons-img" src="./icons/link.png"><b>Canned Analysis URL:</b>';

		// Embed Image
		var embedImageHTML = '<img class="datasets2tools-dropdown-icons-img" src="./icons/embed.png"><b>Embed Icon:</b>';

		// Get Copy Button HTML
		var buttonHTML = '<button class="datasets2tools-button datasets2tools-copy-button"><img class="datasets2tools-dropdown-icons-img" src="./icons/copy.png">Copy</button>';

		// Text Area HTML
		var textAreaHTML = function(content, nRows) {return '<textarea class="datasets2tools-textarea" rows="' + nRows + '">'+content+'</textarea>'};

		// Canned Analysis URL
		var cannedAnalysisUrl = cannedAnalysisObj['canned_analysis_url'];

		// Embed Code
		var embedCode = '<a href="' + cannedAnalysisUrl + '"><img src="' + toolIconUrl + '" style="height:50px;width:50px"></a>'

		shareHTML += interactiveDivHTML + shareImageHTML + dropdownDivHTML + linkImageHTML + textAreaHTML(cannedAnalysisUrl, 2) + buttonHTML + '<br><br>' + embedImageHTML + textAreaHTML(embedCode, 3) + buttonHTML + '</div></div></td>';

		return shareHTML;
	},

	//////////////////////////////
	///// 8. getArrowTabHTML
	//////////////////////////////

	///// Prepares the HTML code for the arrow tab, which allows users to browse the canned analysis table.

	getArrowTabHTML: function(pageNr, pageSize, pairCannedAnalyses) {

		// Define variables
		var numberOfCannedAnalyses = Object.keys(pairCannedAnalyses).length,
			self = this,
			arrowTabHTML = '',
			leftArrowClass,
			rightArrowClass;

		// Add description
		arrowTabHTML += '<div class="datasets2tools-browse-table-arrow-tab"> Showing results ' + Math.min(((pageNr-1)*pageSize+1), numberOfCannedAnalyses) + '-' + Math.min((pageNr*(pageSize)), numberOfCannedAnalyses) + ' of ' + numberOfCannedAnalyses + '.&nbsp&nbsp&nbsp'
		
		// Get left arrow class (condition: if true, if false)
		leftArrowClass = (pageNr > 1 ? '" id="' + (pageNr-1) + '"' : ' datasets2tools-disabled-arrow')

		// Add left arrow
		arrowTabHTML += '<button class="datasets2tools-button datasets2tools-browse-arrow datasets2tools-browse-arrow-left' + leftArrowClass + '"></button>';

		// Get right arrow class (condition: if true, if false)
		rightArrowClass = (numberOfCannedAnalyses > pageNr*(pageSize) ? '" id="' + (parseInt(pageNr) + 1) + '"' : ' datasets2tools-disabled-arrow')

		// Add right arrow
		arrowTabHTML += '<button class="datasets2tools-button datasets2tools-browse-arrow datasets2tools-browse-arrow-right' + rightArrowClass + '"></button></div>';

		// Return HTML string
		return arrowTabHTML;
	},

	//////////////////////////////
	///// 9. completeTableHTML
	//////////////////////////////

	///// Completes the canned analysis table HTML, adding specifed canned analyses on rows, and browsing functions.

	completeTableHTML: function(pairCannedAnalysesSubset, toolIconUrl, maxDescriptionLength=1000) {

		// Get canned analysis IDs
		var cannedAnalysisIds = Object.keys(pairCannedAnalysesSubset),
			self = this,
			browseTableHTMLEnd = '';

		// Loop Through Canned Analyses
		for (var i = 0; i < cannedAnalysisIds.length; i++) {

			// Get Canned Analysis Id
			cannedAnalysisId = cannedAnalysisIds[i];

			// Get Canned Analysis Object
			cannedAnalysisObj = pairCannedAnalysesSubset[cannedAnalysisId];

			// Add Row HTML
			browseTableHTMLEnd += '<tr class="datasets2tools-canned-analysis-row" id="' + cannedAnalysisId + '">' +
								  self.getLinkHTML(cannedAnalysisObj, toolIconUrl) + 
								  self.getDescriptionHTML(cannedAnalysisObj, maxDescriptionLength) +
								  '<td class="datasets2tools-metadata-col">' + self.getViewMetadataHTML(cannedAnalysisObj) + self.getDownloadMetadataHTML(cannedAnalysisObj) + '</td>' +
								  self.getShareHTML(cannedAnalysisObj, toolIconUrl) +
								  '</tr>';
		}

		// Close table
		browseTableHTMLEnd += '</table>';

		// Return HTML string
		return browseTableHTMLEnd;
	},

	//////////////////////////////
	///// 10. getHTML
	//////////////////////////////

	///// Generate the canned analysis table HTML, given the canned analysis subset, by applying search filters and fixing number of rows.

	getHTML: function(pairCannedAnalyses, toolIconUrl, searchFilter='', pageNr=1, pageSize=5) {

		// Define variables
		var self = this,
			pairCannedAnalysesCopy = jQuery.extend({}, pairCannedAnalyses),
			browseTableHTML = '<table class="datasets2tools-browse-table"><tr><th class="datasets2tools-link-col">Link</th><th class="datasets2tools-description-col">Description</th><th class="datasets2tools-metadata-col">Metadata</th><th class="datasets2tools-share-col">Share</th></tr>',
			cannedAnalysisIds = Object.keys(pairCannedAnalysesCopy), cannedAnalysisId, pairCannedAnalysesSubset, browseTableHTML, maxDescriptionLength;

		// Filter search
		if (searchFilter.length > 0) {
			for (var i = 0; i < cannedAnalysisIds.length; i++) {
				cannedAnalysisId = cannedAnalysisIds[i];
				cannedAnalysisDescription = pairCannedAnalysesCopy[cannedAnalysisId]['description'];
				if (!(cannedAnalysisDescription.toLowerCase().includes(searchFilter.toLowerCase()))) {
					delete pairCannedAnalysesCopy[cannedAnalysisId];
				};
			};
		};

		// Get subset
		pairCannedAnalysesSubset = (Object.keys(pairCannedAnalysesCopy).length > pageSize ? Object.keys(pairCannedAnalysesCopy).sort().slice((pageNr-1)*pageSize, pageNr*pageSize).reduce(function(memo, current) { memo[current] = pairCannedAnalysesCopy[current]; return memo;}, {}) : pairCannedAnalysesCopy);

		// Set max description length
		// if (Page.isDataMedSearchResults()) {
		// 	maxDescriptionLength = 1000
		// } else if (Page.isDataMedLanding()) {
		// 	maxDescriptionLength = 1000
		// }

		// Check if there are any canned analyses
		if (Object.keys(pairCannedAnalysesSubset).length === 0) {

			// Add no results
			browseTableHTML += '<tr><td class="datasets2tools-no-results-tab" colspan="4">No Results Found.</td></tr>';

		} else {

			// Get HTML
			browseTableHTML += self.completeTableHTML(pairCannedAnalysesSubset, toolIconUrl);

			// Add browse functions
			browseTableHTML +=  self.getArrowTabHTML(pageNr, pageSize, pairCannedAnalysesCopy);
		};

		// Return
		return browseTableHTML;
	},

	//////////////////////////////
	///// 11. add
	//////////////////////////////

	///// Adds the canned analysis table to the appropriate elements in DataMed dataset search results pages or dataset landing pages.

	add: function($evtTarget, browseTableHTML) {
		$($evtTarget).parents('.datasets2tools-main').find('.datasets2tools-table-wrapper').html(browseTableHTML);
	}
};

//////////////////////////////////////////////////
////////// 7. eventListener //////////////////////
//////////////////////////////////////////////////

///// Functions related to interactivity with the interface.

var eventListener = {

	//////////////////////////////
	///// 1. clickPlusButton
	//////////////////////////////

	///// Active when selecting a tool's + button on dataset landing pages.  Creates browse table and adds tool description.

	clickPlusButton: function(cannedAnalysisData) {
		$('.datasets2tools-main').on('click', '.datasets2tools-tooltable-plus-button', function(evt) {
			var $evtTarget = $(evt.target),
				datasetAccession = $evtTarget.parents('.datasets2tools-table-wrapper').attr('id'),
				toolId = $evtTarget.parent().parent().find('.datasets2tools-tooltable-tool-img').attr('id'),
				pairCannedAnalyses = cannedAnalysisData['canned_analyses'][datasetAccession][toolId],
				toolIconUrl = cannedAnalysisData['tools'][toolId]['tool_icon_url'],
				browseTableHTML = browsetable.getHTML(pairCannedAnalyses, toolIconUrl);
			$evtTarget.parents('.datasets2tools-table-wrapper').html(browseTableHTML);
			tooltable.addToolDescription($evtTarget, toolId, cannedAnalysisData);
		})
	},

	//////////////////////////////
	///// 2. clickLogoButton
	//////////////////////////////

	///// Active when clicking the logo button on the toolbar in dataset search results pages. Returns toolbar to compact mode.

	clickLogoButton: function() {
		$('.datasets2tools-logo-button').click(function(evt) {
			evt.preventDefault();
			toolbar.compact($(evt.target).parents('.datasets2tools-toolbar'));
		})
	},

	//////////////////////////////
	///// 3. clickToolIcon
	//////////////////////////////

	///// Active when clicking a tool icon on the toolbar in dataset search results pages.  Creates browse table and adds selected tool and search tabs.

	clickToolIcon: function(cannedAnalysisData) {
		$('.datasets2tools-tool-icon-button').click(function(evt) {
			evt.preventDefault();
			var $evtTarget = $(evt.target),
				$datasets2toolsToolbar = $evtTarget.parents('.datasets2tools-toolbar'),
				datasetAccession = $datasets2toolsToolbar.attr('id'),
				toolId = $evtTarget.attr('id'),
				pairCannedAnalyses = cannedAnalysisData['canned_analyses'][datasetAccession][toolId],
				toolIconUrl = cannedAnalysisData['tools'][toolId]['tool_icon_url'],
				searchFilter = $datasets2toolsToolbar.find('.datasets2tools-search-text-input').val(),
				browseTableHTML = browsetable.getHTML(pairCannedAnalyses, toolIconUrl, searchFilter);

			browsetable.add($evtTarget, browseTableHTML);
			toolbar.addSelectedToolTab($datasets2toolsToolbar, toolId, cannedAnalysisData);
			toolbar.expand($(evt.target).parents('.datasets2tools-toolbar'));
			$datasets2toolsToolbar.find('.datasets2tools-table-wrapper').show();
			$datasets2toolsToolbar.find('.datasets2tools-tool-info-tab').hide();
		})
	},
	
	//////////////////////////////
	///// 4. clickToolInfoIcon
	//////////////////////////////

	///// Active when clicking on the information icon in the selected tool tab in dataset search results pages.  Replaces the browse table the tool info tab.

	clickToolInfoIcon: function(cannedAnalysisData) {
		$('.datasets2tools-toolbar').on('click', '.datasets2tools-tool-info-button', function(evt) {
			evt.preventDefault();
			var $evtTarget =  $(evt.target),
				$datasets2toolsToolbar = $evtTarget.parents('.datasets2tools-toolbar'),
				toolId = $datasets2toolsToolbar.find('.datasets2tools-selected-tool-img').attr('id');
			toolbar.addToolInfoTab($datasets2toolsToolbar, toolId, cannedAnalysisData);
		})
	},

	//////////////////////////////
	///// 5. clockToolInfoX
	//////////////////////////////

	///// Active when clicking on the X at the top right of the tool info tab.  Closes it and returns to the browse table.

	clockToolInfoX: function() {
		$('.datasets2tools-toolbar').on('click', '.datasets2tools-close-tool-info-button', function(evt) {
			evt.preventDefault();
			var $evtTarget = $(evt.target),
				$datasets2toolsToolbar = $(evt.target).parents('.datasets2tools-toolbar'),
				datasetAccession = $datasets2toolsToolbar.attr('id'),
				toolId = $datasets2toolsToolbar.find('.datasets2tools-selected-tool-img').attr('id'),
				pairCannedAnalyses = cannedAnalysisData['canned_analyses'][datasetAccession][toolId],
				toolIconUrl = cannedAnalysisData['tools'][toolId]['tool_icon_url'],
				searchFilter = $datasets2toolsToolbar.find('.datasets2tools-search-text-input').val(),
				browseTableHTML = browsetable.getHTML(pairCannedAnalyses, toolIconUrl, searchFilter);
			browsetable.add($evtTarget, browseTableHTML);
			$datasets2toolsToolbar.find('.datasets2tools-search-form').show();
			$datasets2toolsToolbar.find('.datasets2tools-tool-info-label').hide();
			$datasets2toolsToolbar.find('.datasets2tools-table-wrapper').show();
			$datasets2toolsToolbar.find('.datasets2tools-tool-info-tab').hide();
		})
	},
	
	//////////////////////////////
	///// 6. clickArrow
	//////////////////////////////

	///// Active when clicking on an arrow at the bottom of the browse table.  Switches to the previous or next page.

	clickArrow: function(cannedAnalysisData) {
		$('.datasets2tools-main').on('click', '.datasets2tools-browse-arrow', function(evt) {
			evt.preventDefault();
			var $evtTarget = $(evt.target),
				$datasets2toolsMain = $evtTarget.parents('.datasets2tools-main'),
				datasetAccession = $datasets2toolsMain.attr('id'),
				toolId = $datasets2toolsMain.find('.datasets2tools-selected-tool-img').attr('id'),
				toolIconUrl = cannedAnalysisData['tools'][toolId]['tool_icon_url'],
				pairCannedAnalyses = cannedAnalysisData['canned_analyses'][datasetAccession][toolId],
				pageNr = $evtTarget.attr('id'),
				searchFilter = $datasets2toolsMain.find('.datasets2tools-search-text-input').val(),
				browseTableHTML = browsetable.getHTML(pairCannedAnalyses, toolIconUrl, searchFilter, pageNr=pageNr);
			browsetable.add($evtTarget, browseTableHTML);
		})
	},

	//////////////////////////////
	///// 7. searchCannedAnalyses
	//////////////////////////////

	///// Active when performing a search for canned analyses.  Updates the browse table.

	searchCannedAnalyses: function(cannedAnalysisData) {
		$('.datasets2tools-main').on('keyup', '.datasets2tools-search-form', function(evt) {
			var $evtTarget = $(evt.target),
				$datasets2toolsMain = $evtTarget.parents('.datasets2tools-main'),
				datasetAccession = $datasets2toolsMain.attr('id'),
				toolId = $datasets2toolsMain.find('.datasets2tools-selected-tool-img').attr('id'),
				toolIconUrl = cannedAnalysisData['tools'][toolId]['tool_icon_url'],
				searchFilter = $datasets2toolsMain.find('.datasets2tools-search-text-input').val(),
				pairCannedAnalyses = cannedAnalysisData['canned_analyses'][datasetAccession][toolId],
				browseTableHTML = browsetable.getHTML(pairCannedAnalyses, toolIconUrl, searchFilter);
			browsetable.add($evtTarget, browseTableHTML);
		})
	},

	//////////////////////////////
	///// 8. clickDropdownButton
	//////////////////////////////

	///// Active when clicking upon a dropdown button.  Toggles the dropdown menu.

	clickDropdownButton: function() {
		$('.datasets2tools-main').on('click', '.datasets2tools-dropdown-button', function(evt) {
			evt.preventDefault();
			$(evt.target).next().toggle();			
		})
	},

	//////////////////////////////
	///// 9. clickCopyButton
	//////////////////////////////

	///// Active when clicking on a copy button in the share dropdown.  Copies the text in the textarea above.

	clickCopyButton: function() {
		$('.datasets2tools-main').on('click', '.datasets2tools-copy-button', function(evt) {
			evt.preventDefault();
			var $evtTarget = $(evt.target);
			var copyTextArea = $evtTarget.prev()[0];
			copyTextArea.select();
			try {
				var successful = document.execCommand('copy');
			} catch (err) {
				console.log('Oops, unable to copy');
			}
		});
	},

	//////////////////////////////
	///// 10. clickDownloadButton
	//////////////////////////////

	///// Active when clicking on a download button in the download dropdown.  Converts the metadata to an appropriate format and downloads the file.

	clickDownloadButton: function(cannedAnalysisData) {
		$('.datasets2tools-main').on('click', '.datasets2tools-metadata-download-button', function(evt) {
			evt.preventDefault();
			var $evtTarget = $(evt.target),
				fileFormat = $evtTarget.text(),
				datasetAccession = $evtTarget.parents('.datasets2tools-table-wrapper').attr('id'),
				toolId = $('.datasets2tools-main').find('.datasets2tools-selected-tool-img').attr('id'),
				cannedAnalysisId = $evtTarget.parents('tr').attr('id');
			var cannedAnalysisObj = jQuery.extend({}, cannedAnalysisData['canned_analyses'][datasetAccession][toolId][cannedAnalysisId]);
			cannedAnalysisObj['dataset_accession'] = datasetAccession;
			cannedAnalysisObj['tool_name'] = cannedAnalysisData['tools'][toolId]['tool_name'];
			cannedAnalysisObj['tool_url'] = cannedAnalysisData['tools'][toolId]['tool_homepage_url'];
			browsetable.downloadMetadata(cannedAnalysisObj, fileFormat);
		});
	},

	//////////////////////////////
	///// 11. clickGoBack
	//////////////////////////////

	///// Active when clicking on the 'go back' div in the dataset landing pages, when a tool has been selected.  Removes the browse table and regenerates the tool table.

	clickGoBack: function(cannedAnalysisData) {
		$('.datasets2tools-main').on('click', '.datasets2tools-back', function(evt) {
			evt.preventDefault();
			var datasetAccession=$('.datasets2tools-table-wrapper').attr('id'),
				tooltableHTML =  tooltable.getHTML(datasetAccession, cannedAnalysisData);
			$('.datasets2tools-main').html(tooltableHTML);
		})
	},

	//////////////////////////////
	///// 12. main
	//////////////////////////////

	///// Groups the event listeners.

	main: function(cannedAnalysisData) {
		var self = this;
		self.clickPlusButton(cannedAnalysisData);
		self.clickLogoButton();
		self.clickToolIcon(cannedAnalysisData);
		self.clickToolInfoIcon(cannedAnalysisData);
		self.clockToolInfoX(cannedAnalysisData);
		self.clickArrow(cannedAnalysisData);
		self.searchCannedAnalyses(cannedAnalysisData);
		self.clickDropdownButton();
		self.clickCopyButton();
		self.clickDownloadButton(cannedAnalysisData);
		self.clickGoBack(cannedAnalysisData);

		$('.datasets2tools-main').on('mouseenter', '.datasets2tools-canned-analysis-description', function(evt) {
			$(evt.target).tooltip().mouseover();
		})
		
	}
};

//////////////////////////////////////////////////////////////////////
///////// 3. Run Main Function ///////////////////////////////////////
//////////////////////////////////////////////////////////////////////
main();
