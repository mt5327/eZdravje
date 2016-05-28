
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta) {
	sessionId = getSessionId();
	
    var name;
    var surname;
    var date;
    var ehrId;
   
    switch (stPacienta) {
    	case 1:
    		name = "Dedek";
    		surname = "Mraz";
    		date = "1922-30-12T00:00";
    		break;
    	case 2:
    		name = "Darth";
    		surname = "Vader";
    		date = "1977-25-5T00:00";
    		break;
    	case 3:
    	    name = "Lara";
    		surname = "Gut";
    		date = "1991-4-27T00:00";
    		break;
    }
    
    $.ajaxSetup({
	    headers: {
		    "Ehr-Session": getSessionId()
	    	
	    }
    });
    $.ajax({
        url: baseUrl + "/ehr",
		type: 'POST',
		success: function (data) {
		    ehrId = data.ehrId;
		    var partyData = {
		        firstNames: name,
		        lastNames: surname,
		        dateOfBirth: date,
		        partyAdditionalInfo: [
		            {
		                key: "stPacienta", value: stPacienta,
		                key: "ehrId", value: ehrId
		                
		            }
		        ]
		    };
		    $.ajax({
		        url: baseUrl + "/demographics/party",
		        type: 'POST',
		        contentType: 'application/json',
		        data: JSON.stringify(partyData),
		    });
		}
    });
    return ehrId;
}
// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija
$(document).ready(function() {
	for (var i = 1; i <= 3; i++) {
    	console.log(generirajPodatke(i));
 	}
});
