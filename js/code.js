"use strict";


var curStrategy = {
		settings: {
			name:"(untitled)",
			asset:"BTC",
			currency:"USD",
			lowest: 0
		},
		initial: {
			amount: 10,
			price: 10000,
		},
		records: []		
};

var curStrategyID = "";
var lastSums; 
var initialBalanceAdjust = 0;
var title = document.title;

function updatePageState(uri, saved) {
	var lastPrice="";
	if (curStrategy.records.length) {
		var lastIndex = curStrategy.records.length-1;
		lastPrice = " "+numToStr(curStrategy.records[lastIndex].price)+" "+curStrategy.settings.currency; 
	}
	var name = curStrategy.settings.name;
	if (!name) name="(untitled)";
	var newTitle = name+lastPrice+" - "+title;
	if (saved) newTitle = "(SAVED) " + newTitle 
	document.title = newTitle;
	window.history.replaceState(null,newTitle,uri);	
	
}

function Chart(element) {
	
	var elm = element;
	var chart = new google.visualization.LineChart(element);
	var options = {
	          curveType: 'none',
	          legend: { position: 'bottom' },
	          vAxis : {
	        	  minorGridlines: {
	        		  count:5
	        	  }
	          },
	          hAxis: {},
	          pointsVisible:true
	        };
	
	var title = 'Strategy performance';
		
	this.update = function(hodl,advice,user,name) {

		if (name) options.title = title+": "+name;
		else options.title = title;
		
		var maxLen = hodl.length;
		if (advice.length>maxLen) maxLen = advice.length;
		if (user.length>maxLen) maxLen = user.length;
		
		if (maxLen < 2) {
			elm.hidden = true;	
			return;
		} else {
			elm.hidden = false;
		}
		
		var axis = ["Trade"];
		options.colors = [];
		if (hodl.length==maxLen) {
			axis.push("HODLing performance");
			options.colors.push("#888888");
		}
		if (advice.length==maxLen) {
			axis.push("Advices performance");
			options.colors.push("#88CCCC");
		}
		if (user.length==maxLen) {
			axis.push("User performance");
			options.colors.push("#000088");
		}
		
		var data = [axis];
		var ticks = [];
		
		for (var i = 0 ; i < maxLen; i++) {
			var row = [i];
			if (hodl.length==maxLen) row.push(hodl[i]);
			if (advice.length==maxLen) row.push(advice[i]);
			if (user.length==maxLen) row.push(user[i]);
			
			data.push( row);
			ticks.push({v:i,f:""+i});
		}
		if (user.length)  {
			options.vAxis.baseline = hodl[0] || advice[0] || user[0];
		}
		options.hAxis.ticks = ticks;
		
		chart.draw(google.visualization.arrayToDataTable(data), options);
	}
	
}

var chart;

function $id(id) {
	return document.getElementById(id);
}

function mustBeText(id, validation) {
	var val = $id(id).value;
	if (val == "") {
		$id(id).focus();
		alert("The field cannot be empty");
		throw {error:"Validation failed"};		
	} else {
		if (validation) {
			var valError = validation(val);
			if (valError) {
				alert("The field validation error: "+valError);
				throw {error:"Validation failed"};
			}
		}
		return val;
	}
}

function mustBeNumber(id, validation) {
	var val = $id(id).value;
	var num = parseFloat(val);	
	if (isNaN(num) ) {
		$id(id).focus();
		alert("The field must contain a number");
		throw {error:"Validation failed"};		
	} else {
		if (validation) {
			var valError = validation(num);
			if (valError) {
				alert("The field validation error: "+valError);
				throw {error:"Validation failed"};
			}
		}
		return num;
	}
}



function replaceElementText(text,element) {
	while (element.firstChild) 
		element.removeChild(element.firstChild);
	element.appendChild(document.createTextNode(text));
}

function replaceElementNumb(numb,element) {
	while (element.firstChild) 
		element.removeChild(element.firstChild);
	element.appendChild(document.createTextNode(numb));
	if ((""+numb).substr(0,1)=="-") {
		element.classList.add("negnumb");
		element.classList.remove("posnumb");
	}
	else {
		element.classList.remove("negnumb");
		element.classList.add("posnumb");
	}
}


function listStrategies() {
	var strategies = {}
	for (var x in localStorage) if (localStorage.hasOwnProperty(x)) {
		if (x.substr(0,2) == "s.") {
			var data = JSON.parse(localStorage[x]);
			strategies[x] = data.settings.name+ " ("+data.settings.asset+"/"+data.settings.currency+")";
		}		
	}
	return strategies;
}


function updatePage() {
		var initial;
		var data = curStrategy
		initialBalanceAdjust = [0,0];
		initialBalanceAdjust[0] = calculateAdvice(data.initial.price, data.initial.amount, data.initial.price*data.initial.amount);
		initialBalanceAdjust[1] = -initialBalanceAdjust[0]* data.initial.price;
		if (curStrategyID == "")
			$id("workArea").classList.add("newDoc");
		else
			$id("workArea").classList.remove("newDoc");
		$id("strategyName").value = data.settings.name;
		$id("strategyAsset").value = data.settings.asset;
		$id("strategyCurrency").value = data.settings.currency;
		$id("initialAsset").value = data.initial.amount;
		$id("initialCurrency").value = data.initial.price;
		$id("lowestPrice").value = data.settings.lowest?data.settings.lowest:0;
		$id("newPrice").focus();
		initial = data.initial;
		initial.cost = initial.price *initial.amount;
		updateSymbols();	
		updateList();

}
function updateSymbols() {
	var asset = $id("strategyAsset").value;
	var currency = $id("strategyCurrency").value;
	document.querySelectorAll(".assetName").forEach(replaceElementText.bind(this,asset));
	document.querySelectorAll(".currencyName").forEach(replaceElementText.bind(this,currency));
}


function calculateAdvice(price, cura, curc) {
	
	var totaladv = 0;
	var curadv;
	var remainc = curc;
	cura += initialBalanceAdjust[0];
	curc += initialBalanceAdjust[1];
	
	for (var i = 0; i < 20; i++) {
		var fakeprice = price - curStrategy.settings.lowest;
		var fakeadv = (curc - fakeprice*cura)/2;
		curadv =  fakeadv / price;
		if (Math.abs(fakeadv/curc) < 0.0000001 || remainc - fakeadv < 0)
			break; 
		cura += curadv;
		curc -= fakeadv;
		remainc -= fakeadv;
		totaladv += curadv;
	}
	return totaladv;
}

function numToStr(x) {
	var f = -Math.log10(Math.abs(x)+0.0001)+5;
	if (f < 0) f = 0;
	return x.toFixed(f);
	
}

function deleteLastRecord() {
	curStrategy.records.pop();
	updateList();
}

function addRecordToList(element,index, x, cura, curc, budget, button) {
	var titemt = $id("tableItem");
	var titemrow = document.importNode(titemt.content, true);
	replaceElementText("#"+index,titemrow.querySelector(".idx"))
	replaceElementText((new Date(x.time)).toLocaleDateString(), titemrow.querySelector(".date"));
	replaceElementNumb(numToStr(x.price), titemrow.querySelector(".price"));
	var elem_assetChange = titemrow.querySelector(".assetChange");
	replaceElementNumb(numToStr(x.amount), elem_assetChange);
	elem_assetChange.setAttribute("title","Total "+numToStr(cura+x.amount));
	var b = titemrow.querySelector(".killbutt");
	if (button) {
		b.hidden = false;
		b.addEventListener("click",deleteLastRecord);
	} else {
		b.hidden = true;
	}
	recordCalcs(titemrow, x, cura, curc, budget)
	element.appendChild(titemrow);
}

function recordCalcs(titemrow, x, cura, curc, budget){
	var earn = -x.amount * x.price;
	var pl = x.price * cura;	
	var advice = x.oos?"OOS":numToStr(calculateAdvice(x.price, cura, curc));
	var elem_earncost = titemrow.querySelector(".earncost");
	elem_earncost.setAttribute("title","Budget: "+numToStr(curc+earn));
	replaceElementNumb(numToStr(earn), elem_earncost);
	replaceElementNumb(advice, titemrow.querySelector(".adviceVal"));
	replaceElementNumb(numToStr(earn/curc * 100)+" %", titemrow.querySelector(".relativepl"));
	replaceElementNumb(numToStr(pl-earn-budget), titemrow.querySelector(".unrealizedpl"));
	replaceElementNumb(numToStr((pl-earn-budget)/budget*100), titemrow.querySelector(".unrealizedplp"));
}

function updateList() {
	var l = $id("table");	
	while (l.firstChild) l.removeChild(l.firstChild);
	var curAsset = curStrategy.initial.amount;
	var curCurrency = curStrategy.initial.amount*curStrategy.initial.price;
	var sumEarn = 0;	
	var budget = curCurrency; 
	var last = curStrategy.records.length; 
	curStrategy.records.forEach(function(x,i) {
		
		last--;
		
		addRecordToList(l,i+1, x, curAsset, curCurrency, budget, last==0);
		curAsset += x.amount
		var cost = x.amount*x.price;
		sumEarn += -cost;
		if (x.oos) {
			curCurrency += cost;
			budget += cost;
		} else {
			curCurrency -= cost;
		}		
	})
	
	
	
	lastSums = [curAsset, curCurrency, budget];
	replaceElementNumb(numToStr(curAsset), $id("totalAsset"));
	replaceElementNumb(numToStr(sumEarn), $id("totalEarnCost"));
	replaceElementNumb(numToStr(sumEarn/budget*100)+" %", $id("totalPl"));
	
	updateChart();
	
}

function updateChart() {
	var hodlChart=[];
	var adviceChart=[];
	var userChart=[];
	var chartTypeElm = $id("chartType")
	var chartUnitElm = $id("chartUnit")
	var chartType = chartTypeElm.value;
	var chartUnit = chartUnitElm.value;
	
	$id("chartDescSelect").dataset.select = chartType;
	
	var name = chartTypeElm.options[chartTypeElm.selectedIndex].text + " (" 
			   + chartUnitElm.options[chartUnitElm.selectedIndex].text + ")";
	
	
	var assets = curStrategy.initial.amount;
	var price = curStrategy.initial.price;
	var initCurrencies = price*assets;
	var hodlAssets = assets;
	var adviceAssets = assets;
	var adviceCurrencies = initCurrencies;
	var adviceCosts = adviceCurrencies;
	var userAssets = assets;
	var userCosts = initCurrencies;
	var curPrice;
	var curChange;
	
	function updateChartDataTotal() {
		hodlChart.push(assets*curPrice - initCurrencies);
		adviceChart.push(adviceAssets*curPrice - adviceCosts);
		userChart.push(userAssets*curPrice - userCosts);
	}

	function updateChartDataUnrealized() {
		hodlChart.push(assets*curPrice - initCurrencies);
		adviceChart.push(adviceAssets*curPrice - initCurrencies);
		userChart.push(userAssets*curPrice - initCurrencies);
	}


	function updateChartDataRealized() {
		adviceChart.push(initCurrencies-adviceCosts);
		userChart.push(initCurrencies-userCosts);
	}
	
	function updateChartDataNormalized() {
		adviceChart.push((adviceAssets-hodlAssets)*curStrategy.initial.price + (initCurrencies-adviceCosts));
		userChart.push((userAssets-hodlAssets)*curStrategy.initial.price + (initCurrencies-userCosts));		
	}
	function updateChartDataRelative() {
		var hodl = assets*curPrice - initCurrencies;
		adviceChart.push((adviceAssets*curPrice - adviceCosts) - hodl);
		userChart.push((userAssets*curPrice - userCosts) - hodl);
	}
	
	var updateChartData;
	
	switch (chartType) {
	case "unrealized":updateChartData = updateChartDataUnrealized;break;
	case "realized":updateChartData = updateChartDataRealized;break;
	case "normalized":updateChartData = updateChartDataNormalized;break;
	case "relative":updateChartData = updateChartDataRelative;break;
	default: updateChartData = updateChartDataTotal;break;
	}
	
	curPrice = price;
	updateChartData();
	
	function step(item) {
		curPrice = item.price;
		curChange = item.amount;
		var advice = calculateAdvice(item.price, adviceAssets, adviceCurrencies)
		adviceAssets += advice;
		adviceCurrencies -= advice*item.price;
		adviceCosts += advice*item.price;
		userAssets += item.amount;
		userCosts += item.amount*item.price;
		updateChartData();
	}
	
	curStrategy.records.forEach(step);

	curPrice = parseFloat($id("newPrice").value);
	if (!isNaN(curPrice)) {
		curChange = 0;
		updateChartData();		
	}

	function recalcToPercent(input) {
		var initial = initCurrencies;
		return input.reduce(function(cur,val) {
			cur.push(val/initial*100);
			return cur;			
		},[]);
	}

	if (chartUnit=="percent") {
		hodlChart = recalcToPercent(hodlChart);
		adviceChart = recalcToPercent(adviceChart);
		userChart = recalcToPercent(userChart);
	}
	
	chart.update(hodlChart, adviceChart, userChart, name);
	
}

function switchStrategy() {
	var selected = $id("curStrategy").value;
	localStorage["strategySelected"] = selected;
	curStrategyID = selected;
	if (selected == "") {
		curStrategy.records=[];
		curStrategy.settings.name="";
	} else {
		curStrategy = JSON.parse(localStorage[selected]);
		if (!curStrategy.settings.lowest)
			curStrategy.settings.lowest = 0;
	}	
	updatePageState("#");
	updatePage();
}

function updateStrategySelection(curSelection) {

	var strat = listStrategies(); 
	  var sel = $id("curStrategy");
	  for(var i = sel.options.length - 1 ; i >= 0 ; i--) {
		  if (sel.options[i].value !="")  sel.remove(i);
	  }
	  for (var itm in strat) {
			 var opt = document.createElement("option");
			 opt.value = itm;
			 opt.text = strat[itm];				  
			 if (opt.value == curSelection) {
				 opt.selected = true;
			 }
			 sel.add(opt);		  
	  }	
}

function saveForSharing(id) {
	var data = JSON.parse(localStorage[id]);
	var pkg = [id,data];
	var strpkg = JSON.stringify(pkg);
	var b64 = LZString.compressToEncodedURIComponent(strpkg);
	updatePageState("#share="+b64,true);	
}




function saveCurrentStrategy() {
	function valNum(x) {
		if (x <=0) return "positive number is required";
		else return null;
	};
	function valNum0(x) {
		if (x <0) return "non-negative number is required";
		else return null;
	};
	curStrategy.settings = {
			asset : mustBeText("strategyAsset"),
			currency : mustBeText("strategyCurrency"),
			name : mustBeText("strategyName"),
			lowest: mustBeNumber("lowestPrice",valNum0)
	};
	curStrategy.initial = {
		amount: mustBeNumber("initialAsset",valNum),
		price: mustBeNumber("initialCurrency",valNum)
	};

	if (curStrategyID=="") {
		curStrategyID = "s."+Date.now();
	}
	curStrategy.rev=Date.now();
	localStorage[curStrategyID] = JSON.stringify(curStrategy);
	updateStrategySelection(curStrategyID);
	updatePage();
	setTimeout(saveForSharing.bind(null, curStrategyID),100);
	
} 

function priceMustBeAboveZero(x) {
	if (x <=0) return "The price must be above the zero";
	else return null;
};


function addRecord() {
	
	var newAssetChange = $id("newAssetChange");
	var price = mustBeNumber("newPrice",priceMustBeAboveZero);
	var change;
	if (newAssetChange.value == "") change = calculateAdvice(price, lastSums[0],lastSums[1]);
	else change = mustBeNumber("newAssetChange");
	var oos = $id("oos").value;
	if (change) {
		curStrategy.records.push({
			   time:Date.now(),
			   amount: change,
			   price: price,
			   oos: oos == 1, 
		});
		localStorage[curStrategyID] = JSON.stringify(curStrategy);
		updatePage();
		$id("newPrice").value="";
		$id("oos").value = "0";
		newAssetChange.value = "";
	}
}

function onInput() {
	var pstr = $id("newPrice");
	var price = parseFloat(pstr.value);
	if (isNaN(price) || price<=0) return;
	var astr = $id("newAssetChange");
	var amount= parseFloat(astr.value);
	if (isNaN(amount)) amount = calculateAdvice(price, lastSums[0],lastSums[1]);
		

	recordCalcs($id("inputRow"),{price:price, amount:amount},lastSums[0],lastSums[1],lastSums[2]);
	
}

function DelayUpdateChart() {
	var curVal=0;
	
	this.update = function() {
		var price = $id("newPrice").value;
		if (price != curVal) {
			updateChart();
			curVal = price;
		}
	}
	
	
}

function copyStrategy() {
	var newNameTemplate = curStrategy.settings.name;
	var idxpos = newNameTemplate.lastIndexOf("(");
	var idx = 1
	if (idxpos != -1 && newNameTemplate.substr(-1) == ")") {
		var idx = parseInt(newNameTemplate.substr(idxpos+1,newNameTemplate.length-idxpos-1));
		if (!isNaN(idx)) {
			newNameTemplate = newNameTemplate.substr(0,idxpos);
			++idx;
		} else {
			idx = 1;
			newNameTemplate = newNameTemplate +" ";
		}
	} else {
		newNameTemplate = newNameTemplate + " ";
	}
	newNameTemplate = newNameTemplate + "("+ idx+")";
	var newName = prompt("Please enter new name of the strategy",newNameTemplate );
	if (newName) {
		curStrategyID = "s."+Date.now();
		$id("strategyName").value = newName;
		saveCurrentStrategy();
	}
}

function delStrategy() {
	if (confirm("Do you really want to delete current strategy '"+curStrategy.settings.name+"'?")) {
		delete localStorage[curStrategyID];
		curStrategyID = "";
		updateStrategySelection(curStrategyID);
		updatePage();
	}
}

function importStrategy(data) {
	try {
		var pkgstr = LZString.decompressFromEncodedURIComponent(data);
		var pkg = JSON.parse(pkgstr);
		var curStgstr = localStorage[pkg[0]];
		if (curStgstr) {
			var curStg = JSON.parse(curStgstr);
			if (!(curStg.rev && curStg.rev >= pkg[1].rev)) {
				localStorage[pkg[0]] = JSON.stringify(pkg[1]);
				return pkg[0];
			}			
		} else {
			localStorage[pkg[0]] = JSON.stringify(pkg[1]);
			return pkg[0];			
		}
	} catch (e) {
		alert("Import has failed: "+ e.toString());
		updatePageState("#");		
	}
	return null;
}

function checkHash() {
	 if (location.hash.substr(0,7) == "#share=") {
		 var swstr = importStrategy(location.hash.substr(7));
		 if (swstr) {
			updateStrategySelection(swstr);	
			switchStrategy();	
			return true;
		 }
	 } else {
		 
	 }	
	 return false;
	 
}
function start() {

	if (localStorage["chartType"]) $id("chartType").value = localStorage["chartType"];
	if (localStorage["chartUnit"]) $id("chartUnit").value = localStorage["chartUnit"];
	
   google.charts.load('current', {'packages':['corechart']});
   google.charts.setOnLoadCallback(function() {

	    $id("workArea").hidden=false;
	    $id("loadSpinner").hidden=true;
		chart = new Chart(chartContainer);
	
	
		 
		 $id("saveStrategy").addEventListener("click", function() {
			saveCurrentStrategy(); 
		 });
		 $id("createStrategy").addEventListener("click", function() {
				saveCurrentStrategy(); 
			 });
		 $id("curStrategy").addEventListener("change", switchStrategy);
		 $id("strategyAsset").addEventListener("change", updateSymbols);
		 $id("strategyCurrency").addEventListener("change", updateSymbols);
		 $id("addrec").addEventListener("click", addRecord);
		 $id("newAssetChange").addEventListener("input", onInput)
		 $id("newPrice").addEventListener("input", onInput);
		 $id("buttfork").addEventListener("click", copyStrategy);
		 $id("buttdel").addEventListener("click", delStrategy);
		 
		 function changeChartType() {
			 updateChart();
			 localStorage["chartType"] = $id("chartType").value;
			 localStorage["chartUnit"] = $id("chartUnit").value;
		 }
		 
		 $id("chartType").addEventListener("change", changeChartType);
		 $id("chartUnit").addEventListener("change", changeChartType);
		 setInterval((new DelayUpdateChart()).update,1000);
		 if (!checkHash()) {
			updateStrategySelection(localStorage["strategySelected"]);	
			switchStrategy();
		 }
		 window.addEventListener("hashchange",checkHash);
		 
   });
   $id("tybutton").addEventListener("click",function(e){
   		document.querySelector(".support-page").classList.add("hid");   		
   		e.preventDefault();
   });
   var iframeloaded = false;
   function showSupport() {
	   document.querySelector(".support-page").classList.remove("hid");
	   if (iframeloaded == false) {
		   document.querySelector(".support-page iframe").setAttribute("src","donate.html");
		   iframeloaded = true;
	   }
   };
   $id("support").addEventListener("click",function(e) {
	   showSupport();
	   e.preventDefault();
   });
   if (location.hash == "#support") {
	   showSupport();
   }	 
}
