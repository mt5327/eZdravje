
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
    var name;
    var surname;
    var date;
    var ehrId;
   
    switch (stPacienta) {
    	case 1:
    		name = "Dedek";
    		surname = "Mraz";
    		date = "1922-12-30T00:00";
    		break;
    	case 2:
    		name = "Darth";
    		surname = "Vader";
    		date = "1977-5-25T00:00";
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
		                key: "ehrId", value: ehrId
		            }
		        ]
		    };
		    $.ajax({
		        url: baseUrl + "/demographics/party",
		        type: 'POST',
		        contentType: 'application/json',
		        data: JSON.stringify(partyData),
		        success: function (party) {
		            if (party.action == 'CREATE') {
		                $('#izbiraUporabnika-menu').append("<li><a data-eid="+ehrId+" href=#>"+name+" "+surname+"</a></li>");
		            }
		        },
		        error: function(err) {
		            $('#obvestila').html("<div class=alert-danger>Kreiranje EhrID-ja ni uspelo. Prosimo poskusite znova.</div>");
		        }
		    });
		}
    });
    return ehrId;
}

function poisciEhrID(ehrId) {
    $.ajaxSetup({
        headers: {
            "Ehr-Session": getSessionId()
        }
    });
    var searchData = [{key: "ehrId", value: ehrId}];
    
    $.ajax({
        url: baseUrl + "/demographics/party/query",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(searchData),
        success: function (res) {
            for (i in res.parties) {
                var party = res.parties[i];
                $('#izbiraUporabnika-menu').append("<li><a href=#>"+party.firstNames+" "+party.lastNames+"</a></li>");
                $('#obvestila').html("<div class=alert-success>Uporabnik "+party.firstNames+" "+party.lastNames+" dodan v seznam</div>");
            }
        }, 
        error: function(err) {
            $('#obvestila').html("<div class=alert-danger>Pri iskanju je prislo do napake. Prosimo poskusite ponovno.</div>");
        }
    });    
}

// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija
$(document).ready(function() {
    bootbox.dialog({
        message: "Kako zelis zaceti?",
        title: "{ime aplikacije}",
        buttons: {
            rocno: {
                label: "Ročni vnos EhrID",
                className: "btn-default",
                callback: function() {
                    $('#vnesiEhrID').focus();
                }
            },  
            generiraj: {
                label: "Generiraj vzorčne uporabnike",
                className: "btn-default",
                callback: function() {
                    for (var i = 1; i <= 3; i++)
                        generirajPodatke(i);
                        $("#obvestila").html("<div class=alert-success>Vzorcni uporabniki generirani.</div>");
                }
            }
        }
    });
    
    $("#gen").click(function() {
        for (var i = 1; i <= 3; i++)
            generirajPodatke(i);
        $("#obvestila").html("<div class=alert-success>Vzorcni uporabniki generirani.</div>");
    });
    
    $("#isci").click(function() {
        var ehrId = $("#vnesiEhrID").val();
        poisciEhrID(ehrId);
    });
    
    $(function(){
        $(".dropdown-menu").on('click', 'li a', function() {
        $("#user").html("<div class=alert-info><strong>Trenutni uporabnik:</strong> "+$(this).text()+
            " <strong>EhrID: </strong>"+$(this).attr('data-eid')+"</div>");
        });
    });
});
