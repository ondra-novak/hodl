"use strict";

var db = new PouchDB('HODL');

var designDocuments = [
  {
	  _id:"_design/index",
	  views:{
		  byStrategy: {
			  map: function(doc) {
				  if (doc.class == "strategy") {
					  emit([doc._id,0],[doc.initial.amount, doc.initial.price, doc.initial.amount*doc.initial.price]);
				  } else if (doc.class == "record") {
					  emit([doc.strategu, parseInt(doc._id)],[doc.amount, doc.price, -doc.amount*doc.price]);
				  }
			  },
			  reduce:function(keys, values, rereduce) {
				  return values.reduce(function(v, a) {
					  return [v[0]+a[0],v[1]+a[1],v[2]+a[2]];
				  },[0,0,0]);
			  }
		  }
	  }
	  
  }
];



function start() {
	
	db.bulkDocs(designDocuments);
	
	
	
	
}