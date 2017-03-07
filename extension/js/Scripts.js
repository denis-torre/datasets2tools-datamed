var Page = {

	isDataMedSearchResults: function() {
		return /https:\/\/datamed\.org\/search\.php\?.*/.test(window.location.href);
	},

	isDataMedLanding: function() {
		return /https:\/\/datamed\.org\/display\-item\.php\?.*/.test(window.location.href);
	},

	getLabel: function() {
		var self = this;
		if (self.isDataMedSearchResults()) {
			return 'datamed datamed-search';
		} else if (self.isDataMedLanding()) {
			return 'datamed datamed-landing';
		}
	}
};

var Interface = {

	locateParents: function() {
		var $parents;
		if (Page.isDataMedSearchResults()) {
			$parents = $('.search-result li');
		} else if (Page.isDataMedLanding()) {
			$parents = $('a:contains("Dataset")').parents('.panel-group');
		}
		return $parents;
	},

	getDatasetAccession: function($parents) {
		var datasetAccession;
		if (Page.isDataMedSearchResults()) {
			datasetAccession = $parents.find(".result-field em:contains('ID:'), em:contains('Accession:')").next().text().replace(/\s+/g, '');
		} else if (Page.isDataMedLanding()) {
			datasetAccession = $parents.find('td:contains("ID:")').next().children().eq(0).text().replace(/\s+/g, '');
		}
		return datasetAccession;
	},

	addCannedAnalyses: function($parents, cannedAnalysisData) {
		var self = this;
		if (Page.isDataMedSearchResults()) {
			$($parents).each(function(i, elem){
				datasetAccession = self.getDatasetAccession($(elem));
				if ($.inArray(datasetAccession, Object.keys(cannedAnalysisData['canned_analyses'])) > -1) {
					var toolbarHTML = toolbar.getHTML(datasetAccession, cannedAnalysisData);
					toolbar.add($parents.eq(i), toolbarHTML);
				}
			})
		} else if (Page.isDataMedLanding()) {
			var self = this, datasetAccessionString = self.getDatasetAccession($parents), toolbarHTML = tooltable.getHTML(datasetAccessionString, cannedAnalysisData);
			tooltable.add($parents, toolbarHTML);
		}
	}
};

var API = {
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

var toolbar = {

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

	add: function($parent, elementHTML) {
		if (Page.isDataMedSearchResults() || Page.isGEOSearchResults()) {
			$('.seven_col').css('overflow', 'visible');
			$('.rprt').css('overflow', 'visible');
			$parent.append(elementHTML);
		}
	},

	compact: function($datasets2toolsToolbar) {
		$datasets2toolsToolbar.find('.datasets2tools-compact').show();
		$datasets2toolsToolbar.find('.datasets2tools-expand').hide();
		$datasets2toolsToolbar.find('.datasets2tools-tool-info-label').hide();
		$datasets2toolsToolbar.find('.datasets2tools-search-form').show();
		$datasets2toolsToolbar.find('.datasets2tools-search-bar').css('display', 'inline-block');
		$datasets2toolsToolbar.find('.datasets2tools-logo-button').css({'filter': 'grayscale(0%)', 'opacity': '1'});
	},

	expand: function($datasets2toolsToolbar) {
		$datasets2toolsToolbar.find('.datasets2tools-compact').hide();
		$datasets2toolsToolbar.find('.datasets2tools-expand').show();
		$datasets2toolsToolbar.find('.datasets2tools-search-bar').css('display', 'block');
		$datasets2toolsToolbar.find('.datasets2tools-logo-button').css({'filter': 'grayscale(100%)', 'opacity': '0.5'});
	},

	addSelectedToolTab: function($datasets2toolsToolbar, toolId, cannedAnalysisData) {
		var $selectedToolTab = $datasets2toolsToolbar.find('.datasets2tools-selected-tool-tab');
		var selectedToolTabHTML = '<img src="' + cannedAnalysisData['tools'][toolId]['tool_icon_url'] + '" class="datasets2tools-selected-tool-img" id="' + toolId + '"><div class="datasets2tools-selected-tool-label">' + cannedAnalysisData['tools'][toolId]['tool_name'] + '</div><button type="button" class="datasets2tools-tool-info-button datasets2tools-button"></button>';
		$selectedToolTab.html(selectedToolTabHTML);
	},

	addToolInfoTab: function($datasets2toolsToolbar, toolId, cannedAnalysisData) {
		var toolDescriptionHTML = cannedAnalysisData['tools'][toolId]['tool_description'];
		var toolLinkHTML = '<a href="' + cannedAnalysisData['tools'][toolId]['tool_homepage_url'] + '">Homepage</a>';
		var publicationLinkHTML = '<a href="' + cannedAnalysisData['tools'][toolId]['publication_url'] + '">Reference</a>';
		toolInfoHTML = '<b><u>Tool Description</b></u><br>' + toolDescriptionHTML + '<br><br><b><u>Links</b></u><br>' + toolLinkHTML + '&nbsp' + publicationLinkHTML + '<button class="datasets2tools-close-tool-info-button">✖</button>';
		$datasets2toolsToolbar.find('.datasets2tools-tool-info-tab').html(toolInfoHTML);
		$datasets2toolsToolbar.find('.datasets2tools-search-form').hide();
		$datasets2toolsToolbar.find('.datasets2tools-tool-info-label').show();
		$datasets2toolsToolbar.find('.datasets2tools-tool-info-tab').show();
		$datasets2toolsToolbar.find('.datasets2tools-table-wrapper').hide();
	}
};

var tooltable = {
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

	addToolDescription: function($evtTarget, toolId, cannedAnalysisData) {
		var toolDescriptionHTML = '<a class="datasets2tools-back"> <<< Back To Tools </a><br><div class="datasets2tools-tooltable-toolintro"><img class="datasets2tools-selected-tool-img" id="' + toolId + '" style="height:50px;width:50px;" src="' + cannedAnalysisData['tools'][toolId]['tool_icon_url'] + '"></img><div class="datasets2tools-tooltable-toolname">' + cannedAnalysisData['tools'][toolId]['tool_name'] + '</div></div><br>' + cannedAnalysisData['tools'][toolId]['tool_description'] + '.';
		$('.datasets2tools-main').find('.datasets2tools-table-intro').html(toolDescriptionHTML);
	},

	add: function($parent, elementHTML) {
		var self = this;
		if (Page.isDataMedLanding()) {
			$parent.after('<div class="panel-group" id="accordion-cannedAnalyses" role="tablist" aria-multiselectable="true"><div class="panel panel-info"><div class="panel-heading" role="tab" id="heading-dataset-cannedAnalyses"><h4 class="panel-title"><a role="button" data-toggle="collapse" data-parent="#accordion-cannedAnalyses" data-target="#collapse-dataset-cannedAnalyses" href="#collapse-dataset-cannedAnalyses" aria-expanded="true" aria-controls="collapse-dataset-cannedAnalyses"><i class="fa fa-chevron-up"></i>&nbspCanned Analyses</a></h4></div><div id="collapse-dataset-cannedAnalyses" class="panel-collapse collapse in" role="tabpanel" aria-labelledby="heading-dataset-cannedAnalyses"><div class="panel-body"><div id="' + Interface.getDatasetAccession($parent) + '" class="datasets2tools-main ' + Page.getLabel() + '">'+elementHTML+'</div></div></div></div></div>');
		} else if (Page.isGDSLanding()) {
			$parent.after('<div id="cannedAnalysisDiv" style="padding-top:10px;"><table id="cannedanalysistable" class="gds_panel" width="100%"><tr class="caption"><th style="text-align: center;">Canned Analyses</th></tr><tr><td><div id="' + Interface.getDatasetAccession($parent) + '" class="datasets2tools-main ' + Page.getLabel() +'">'+elementHTML+'</div></td></tr></table></div>');
		} else if (Page.isLDPLanding()) {
			// $parent.html('<a data-toggle="tab" class="tab-link datasets2tools-tab-link" aria-expanded="false"> Analysis Tools </a>');
			// $('head-title').append(elementHTML);
			$parent.html(elementHTML);
		}
	}
};