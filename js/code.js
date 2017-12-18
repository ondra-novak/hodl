"use strict";


var curStrategy = {
		settings: {
			name:"",
			asset:"BTC",
			currency:"USD",
		},
		initial: {
			amount: 10,
			price: 10000,
		},
		records: []		
};

var curStrategyID = "";
var lastSums; 

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
		if (curStrategyID == "")
			$id("workArea").classList.add("newDoc");
		else
			$id("workArea").classList.remove("newDoc");
		$id("strategyName").value = data.settings.name;
		$id("strategyAsset").value = data.settings.asset;
		$id("strategyCurrency").value = data.settings.currency;
		$id("initialAsset").value = data.initial.amount;
		$id("initialCurrency").value = data.initial.price;
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
	
	return  (curc/price - cura )/2;
	
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

function addRecordToList(element, x, cura, curc, budget, button) {
	var titemt = $id("tableItem");
	var titemrow = document.importNode(titemt.content, true);
	replaceElementText((new Date(x.time)).toLocaleDateString(), titemrow.querySelector(".date"));
	replaceElementNumb(numToStr(x.price), titemrow.querySelector(".price"));
	replaceElementNumb(numToStr(x.amount), titemrow.querySelector(".assetChange"));
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
	replaceElementText(numToStr(earn), titemrow.querySelector(".earncost"));
	var advice = x.oos?"OOS":numToStr(calculateAdvice(x.price, cura, curc));
	replaceElementNumb(numToStr(earn), titemrow.querySelector(".earncost"));
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
	curStrategy.records.forEach(function(x) {
		
		last--;
		
		addRecordToList(l, x, curAsset, curCurrency, budget, last==0);
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
	}
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

function saveCurrentStrategy() {
	function valNum(x) {
		if (x <=0) return "positive number is required";
		else return null;
	};
	curStrategy.settings = {
			asset : mustBeText("strategyAsset"),
			currency : mustBeText("strategyCurrency"),
			name : mustBeText("strategyName"),
	};
	curStrategy.initial = {
		amount: mustBeNumber("initialAsset",valNum),
		price: mustBeNumber("initialCurrency",valNum)
	};

	if (curStrategyID=="") {
		curStrategyID = "s."+Date.now();
	}
	localStorage[curStrategyID] = JSON.stringify(curStrategy);
	updateStrategySelection(curStrategyID);
	updatePage();
	
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

function start() {
	
	
	updateStrategySelection(localStorage["strategySelected"]);	
	switchStrategy();

	 
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
	 
}