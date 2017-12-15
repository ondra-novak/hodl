"use strict";

var db = new PouchDB('HODL');

var designDocuments = [
  {
	  _id:"_design/index",
	  views:{
		  byStrategy: {
			  map: function(doc) {
				  if (doc._id.substr(0,2) == "s.") {
					  emit([doc._id,0],[doc.initial.amount, doc.initial.price, doc.initial.amount*doc.initial.price]);
				  } else if (doc._id.substr(0,2) == "r.") {
					  emit([doc.strategy, parseInt(doc._id.substr(2))],[doc.amount, doc.price, -doc.amount*doc.price]);
				  }
			  }.toString(),
			  reduce:function(keys, values, rereduce) {
				  return values.reduce(function(v, a) {
					  return [v[0]+a[0],v[1]+a[1],v[2]+a[2]];
				  },[0,0,0]);
			  }.toString(),
		  }
	  },
	  revision:1	  
  }
];


function updateDesignDocs(ddocs) {
	function compareAndUploadDDoc(newDoc,oldDoc) {
		newDoc._rev = oldDoc._rev;
		if (typeof oldDoc.revision == 'undefined' || newDoc.revision > oldDoc.revision) {
			db.put(newDoc);
		}
	}

	var promises =[];
	ddocs.forEach(function(x) {		
		promises.push(
				db.get(x._id).then(compareAndUploadDDoc.bind(this,x), compareAndUploadDDoc.bind(this,x,{}))
		);
	});
	return Promise.all(promises);
}

function $id(id) {
	return document.getElementById(id);
}

function mustBeText(id) {
	var val = $id(id).value;
	if (val == "") {
		$id(id).focus();
		alert("The field cannot be empty");
		throw {error:"Validation failed"};		
	} else {
		return val;
	}
}

function mustBeNumber(id) {
	var val = $id(id).value;
	var num = parseFloat(val);	
	if (isNaN(num) ) {
		$id(id).focus();
		alert("The field must contain a number");
		throw {error:"Validation failed"};		
	} else {
		return num;
	}
}

function updatePage() {
	var selected = $id("curStrategy").value;
	
	if (selected == "") {				
		$id("workArea").hidden = true;
		$id("strategyName").value = "";		
	} else {
		db.get(selected).then(function(data){
			$id("workArea").hidden = false;
			$id("strategyName").value = data.name;
			$id("strategyAsset").value = data.asset;
			$id("strategyCurrency").value = data.currency;
			$id("initialAsset").value = data.initial.amount;
			$id("initialCurrency").value = data.initial.price;
		})
		
	}
}

function switchStrategy() {
	var selected = $id("curStrategy").value;
	localStorage["strategySelected"] = selected;
	updatePage();
}

function updateStrategySelection(curSelection) {
	
	db.allDocs({start_key:"s.",end_key:"s.~",include_docs:true })
		.then(function(curSelection,result){
			  var i;
			  var sel = $id("curStrategy");
			  for(i = sel.options.length - 1 ; i >= 0 ; i--) {
				  if (sel.options[i].value !="")  sel.remove(i);
			  }
			  result.rows.forEach(function(item){
				 var opt = document.createElement("option");
				 opt.value = item.doc._id;
				 opt.text = item.doc.name;				  
				 if (opt.value == curSelection) {
					 opt.selected = true;
				 }
				 sel.add(opt);
			  });
			  updatePage();
		}.bind(this,curSelection));
	
	
}

function saveCurrentStrategy() {
	var selected = $id("curStrategy");
	var curStrategyID = selected.value;
	if (curStrategyID == "") {
		saveToDoc({_id:"s."+Date.now()});
	} else {
		db.get(curStrategyID).then(saveToDoc);
	}
	
	function saveToDoc(doc) {
		doc.name = mustBeText("strategyName");
		doc.asset = mustBeText("strategyAsset");
		doc.currency = mustBeText("strategyCurrency");
		doc.initial = {
				amount: mustBeNumber("initialAsset"),
				price: mustBeNumber("initialCurrency")
		};
		db.put(doc).then(updateStrategySelection.bind(this,doc._id));
	}
	
}
function start() {
	
	 updateDesignDocs(designDocuments)
	 .then(updateStrategySelection.bind(this,(function(){
		 var x = localStorage["strategySelected"];
		 if (x) return x;
		 return "";
	 })()));
	 
	 $id("saveStrategy").addEventListener("click", function() {
		saveCurrentStrategy(); 
	 });
	 $id("curStrategy").addEventListener("change", switchStrategy);
	 
	
}