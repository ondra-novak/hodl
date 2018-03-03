function $id(id) {
	return document.getElementById(id);
}


function fetchCryptoRation(currency, cb) {
	var uris = {
		BTC:"bitcoin",
		LTC:"litecoin",
		BCH:"bitcoin-cash",
		DASH:"dash",
		ZEC:"zcash",
		ETH:"ethereum",
		ETC:"ethereum-classic"
	}
	var url = "https://api.coinmarketcap.com/v1/ticker/"+uris[currency]+"/";
	var xhr = new XMLHttpRequest;
	xhr.open("GET", url);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			var ratio = 0;
			if (xhr.status == 200) {
				var out;
				try {
					out = JSON.parse(xhr.responseText);
					ratio = parseFloat(out[0].price_usd);
				} catch (e) {
					ratio = 0;
				}				
			}
			cb(ratio);
		}
	};
	xhr.send();

}

var paymentLinks = {
	BTC: function(addr, amount) {
		return "bitcoin:"+addr+"?amount="+amount;
	},
	LTC: function(addr, amount) {
		return "litecoin:"+addr+"?amount="+amount;
	},
	ETH: function(addr, amount) {
		return "ethereum:"+addr+"?amount="+amount+"&gas=21000";
	},
	DASH: function(addr, amount) {
		return "dash:"+addr+"?amount="+amount;
	},
	ZEC: function(addr, amount) {
		return "zcash:"+addr+"?amount="+amount;
	},
	BCH: function(addr, amount) {
		return "bitcoincash:"+addr+"?amount="+amount;
	},
	ETC: function(addr, amount) {
		return "ethereumclassic:"+addr+"?amount="+amount+"&gas=21000";
	}
}


var qrcode_gen;
var paytrezor_fn;

function updateSupportPage() {
	var amount = $id("gift").value;
	var crypto = $id("giftcurrency").value.split(",");
	var currency = crypto[0];
	var address = crypto[1];
	var iseth = (currency == "ETH" || currency == "ETC");
	$id("imgmew").hidden = !iseth;
	$id("imgtrezor").hidden = iseth;

	fetchCryptoRation(currency, function(r){

		$id("valid_data").hidden = r == 0;
		$id("invalid_data").hidden = r != 0;
		$id("thank_you").hidden = true;

		var mult = 100000000;
		var total = Math.round((amount / r)*mult) / mult; 
		var uri = paymentLinks[currency](address, total);

		$id("detail_addr").innerHTML = address;
		$id("detail_amount").innerHTML = total+" " + currency;
		$id("qrcode_area").setAttribute("data-href",uri);

		qrcode_gen.makeCode(uri);

		if (paytrezor_fn) {
			$id("paytrezor").removeEventListener("click",paytrezor_fn);
		}
		paytrezor_fn = function() {
			if (currency == "ETH") {
				window.open("https://www.myetherwallet.com/?network=eth_mew&to="+address+"&value="+total+"#send-transaction");
			} else if (currency == "ETC") {
				window.open("https://www.myetherwallet.com/?network=etc_epool&to="+address+"&value="+total+"#send-transaction");
			} else {

				 $id("paytrezor").classList.add("busy");
				 $id("paytrezor_err").innerHTML='';
				 TrezorConnect.setCurrency(currency);
				 TrezorConnect.closeAfterSuccess(false);
				 TrezorConnect.composeAndSignTx([{
					 address:address,amount: (total * mult) | 0
					}], function (result) {
						$id("paytrezor").classList.remove("busy");
						if (result.success) {
							TrezorConnect.closeAfterSuccess(true);
							TrezorConnect.pushTransaction(result.serialized_tx, function (pushResult) {
								if (pushResult.success) {
									$id("thank_you").hidden = false;
									$id("valid_data").hidden = true;
								} else {
									$id("paytrezor_err").innerHTML='An error happened: '+ pushResult.error;
								}
							});
						} else {
							$id("paytrezor_err").innerHTML='An error happened: '+ result.error;
						}
					});
			}
		 };
		 $id("paytrezor").addEventListener("click",paytrezor_fn);
   
	});

		
}

function start() {

   qrcode_gen = new QRCode("qrcode_area");
   $id("gift").addEventListener("change",updateSupportPage);
   $id("giftcurrency").addEventListener("change",updateSupportPage);
   updateSupportPage();
   $id("qrcode_area").addEventListener("click",function() {
   		window.open($id("qrcode_area").dataset.href);
   });
	 
}