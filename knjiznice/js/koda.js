
var baseUrl = 'https://rest.ehrscape.com/rest/v1';

var username = "ois.seminar";
var password = "ois4fri";
 
var baseURL = 'https://api.infermedica.com/v2/';

var appid = "21d48171";
var appkey = "fab45ae08b455c52c3415d80afcf7927";

var trenutniEhrID = null;
var trenutniSpol;    
var trenutnaStarost;
var evidence = [];


/* App name
Markus Tischler's App
App ID
58bd7b38
Key
7010808956ebbe0a0228eb94396aacf1 */

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
    var gender;
    var date;
    var ehrId;
   
    switch (stPacienta) {
    	case 1:
    		name = "Dedek";
    		surname = "Mraz";
    		gender = "MALE";
    		date = "1922-12-30T00:00Z";
    		break;
    	case 2:
    		name = "Darth";
    		surname = "Vader";
    		gender = "MALE";
    		date = "1977-05-25T00:00Z";
    		break;
    	case 3:
    	    name = "Lara";
    		surname = "Gut";
    		gender = "FEMALE";
    		date = "1991-04-27T00:00Z";
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
		        gender: gender,
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
		                dodajMeritveVitalnihZnakov(stPacienta, ehrId);
		                gender = gender.toLowerCase();
		                $('#izbiraUporabnika-menu').append("<li><a data-eid="+ehrId+" gender="+gender
		                   +" dob="+date+" href=#>"+name+" "+surname+"</a></li>");
		            }
		        },
		        error: function(err) {
		            $('#obvestila').html("<div class=alert-danger>Kreiranje EhrID-ja ni uspelo. Prosimo poskusite znova.</div>");
		        },
		    });
		},
    });
}

function dodajMeritveVitalnihZnakov(stPacienta, ehrId) {
	var datumInUra;
	var telesnaVisina;
	var telesnaTeza;
	var telesnaTemperatura;
	var sistolicniKrvniTlak;
	var diastolicniKrvniTlak;
	var nasicenostKrviSKisikom;
	
	switch (stPacienta) {
	    case 1:
	        datumInUra = "2016-06-01T00:00Z";
	        telesnaVisina = "150.5";
	        telesnaTeza = "120.2";
	        telesnaTemperatura = "97.8";
	        sistolicniKrvniTlak = "119.4";
	        diastolicniKrvniTlak = "75.5";
	        nasicenostKrviSKisikom = "95.7";
	        break;
	    case 2:
	        datumInUra = "2016-06-01T00:00Z";
	        telesnaVisina = "180.1";
	        telesnaTeza = "90.3";
	        sistolicniKrvniTlak = "125.3";
	        diastolicniKrvniTlak = "80.3";
	        nasicenostKrviSKisikom = "90.7";
	        break;
	    case 2:
	        datumInUra = "2016-06-01T00:00Z";
	        telesnaVisina = "160.4";
	        telesnaTeza = "70.1";
	        sistolicniKrvniTlak = "118.2";
	        diastolicniKrvniTlak = "80.1";
	        nasicenostKrviSKisikom = "99.6";
	        break;
	}
	
	
	$.ajaxSetup({
		   headers: {"Ehr-Session": getSessionId()}
	});
	
	var podatki = {
        "ctx/language": "en",
		"ctx/territory": "SI",
		"ctx/time": datumInUra,
		"vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		"vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		"vital_signs/body_temperature/any_event/temperature|unit": "°F",
	    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		"vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		"vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
	};
		
	var parametriZahteve = {
	    ehrId: ehrId,
		templateId: 'Vital Signs',
		format: 'FLAT'
    };
	
	$.ajax({
        url: baseUrl + "/composition?" + $.param(parametriZahteve),
		type: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(podatki),
		error: function(err) {
            $('#obvestila').html("<div class=alert-danger>Dodajanje vitalnih znakov ni uspelo. Prosimo poskusite znova."+JSON.parse(err.responseText).userMessage+"</div>");
		}
	});
}

function vrniStarostVLetih(dateOfBirth) {
    var dob = new Date(dateOfBirth);
    var timeDiff = Math.abs(Date.now() - dob.getTime());
    return Math.floor(timeDiff / (1000 * 3600 * 24 * 365));
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
                $('#izbiraUporabnika-menu').append("<li><a data-eid"+party.partyAdditionalInfo.ehrId+" gender="+party.gender+" dob="+party.dateOfBirth 
                +" href=#>"+party.firstNames+" "+party.lastNames+"</a></li>");
                $('#obvestila').html("<div class=alert-success>Uporabnik "+party.firstNames+" "+party.lastNames+" dodan v seznam</div>");
            }
        }, 
        error: function(err) {
            $('#obvestila').html("<div class=alert-danger>Pri iskanju je prislo do napake. Prosimo poskusite ponovno.</div>");
        }
    });    
}

function simptomiInFaktorjiTveganjaEHRbaza(trenutniEhrID, trenutniSpol, trenutnaStarost) {
    evidence = [];
    if (trenutniSpol == 'female') {
        var con = {
            id: "p_1",
            choice_id: "present"
        };
        evidence.push(con);
    }
        
    if (trenutnaStarost >= 40) {
        var con1 = {
            id: "p_3",
            choice_id: "present"
        };
        evidence.push(con1);
    }
    
    $.ajaxSetup({
        headers: {
            "Ehr-Session": getSessionId()
        }
    });
    
    $.ajax({
        url: baseUrl + "/view/" + trenutniEhrID + "/blood_pressure",
	    type: 'GET',
	    contentType: 'application/json',
	    success: function(res) {
	        var d = res.length;
	        var sumS = 0;
	        var sumD = 0;
	        for (i in res) {
	            sumS += res[i].systolic;
	            sumD += res[i].diastolic;
	        }
	        if (d != 0 && ((sumS / d) > 120 || (sumD / d) > 80)) {
	            var con2 = {
	                id: "s_543",
	                choice_id: "present"
	            }
	            evidence.push(con2);
	        }
	    },
	    error: function(err) {
            $('#obvestila').html("<div class=alert-danger>Pridobivanje vitalnih znakov ni uspelo. Prosimo poskusite znova.</div>");
	    }
    });
    
    $.ajax({
        url: baseUrl + "/view/" + ehrId + "/body_temperature",
	    type: 'GET',
	    contentType: 'application/json',
	    success: function(res) {
	        var sum = 0;
	        var d = res.length;
	        for (i in res) {
	            sum += res[i].temperature;
	        }
	        if (d != 0 && (sum / d > 101)) {
	            evidence.push("s_100");
	        }
	        else if (d != 0 && ((sum / d) <= 101) && ((sum / d) > 99.5)) {
	            evidence.push("s_99");
	        }
	    },
	    error: function(err) {
            $('#obvestila').html("<div class=alert-danger>Pridobivanje vitalnih znakov ni uspelo. Prosimo poskusite znova.</div>");
	    }
    });
}


function poisciSimptomeInFaktorjeTveganja(phrase, gender) { 
    delete $.ajaxSettings.headers["Ehr-Session"];
    $.ajaxSetup({
	    headers: {
		    "app_id": appid,
		    "app_key": appkey,
	    }
    });        
    
    $.ajax({
        url: baseURL + "search?phrase="+phrase+"&sex="+gender+"&max_results=10",
        type: 'GET',
        contentType: "application/json",
        success: function(res) {
            $("#rezultati").html("");
            for (i in res) {
                var re = res[i];
                $("#rezultati").append("<button type=button class=list-group-item id="+re.id+">"+re.label+"</button>");
            }
        }
    });
}

function diagnoza(gender, age, evidence, callback) { 
    delete $.ajaxSettings.headers["Ehr-Session"];
    $.ajaxSetup({
	    headers: {
		    "app_id": appid,
		    "app_key": appkey,
	    }
    });
    var d = {    
        sex: gender,
        age: age,
        evidence: evidence
    };
    $.ajax({
        url: "https://api.infermedica.com/v2/diagnosis",
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify(d),
        success: function(res) {
            $("#graf").html("");
            if (res.conditions.length > 5) {
                var array = [];
                for (var i = 0; i < 5; i++) {
                    array[i] = res.conditions[i];
                }
                izrisiGraf(array);
            } else {
                izrisiGraf(res.conditions);
            }
            callback(res);
        }
    });
}
 
function podrobnosti(diagnoza) {
    $("#diagnoze").html("");
    for (i in diagnoza.conditions) {
        c = diagnoza.conditions[i];
        (function (c, i) {
        $.ajax({
            url: baseURL + "conditions/"+c.id,
            type: 'GET',
            contentType: "application/json",
            success: function(data) {
                $("#diagnoze").append("<button type=button class=list-group-item data-toggle=collapse href=#details"+i+" aria-expanded=false"+
                    " aria-controls=details"+i+">"+c.name+"</button>"+
                    "<div id=details"+i+" class=collapse in>"+
                    "<ul class=list-group>"+
                    "<li class=list-group-item-info><b>Probability: </b>"+c.probability+"</li>"+
                    "<li class=list-group-item-info><b>Prevalence: </b>"+data.prevalence.replace(/_/g, " ")+"</li>"+
                    "<li class=list-group-item-info><b>Acuteness: </b>"+data.acuteness.replace(/_/g, " ")+"</li>"+
                    "<li class=list-group-item-info><b>Severity: </b>"+data.severity+"</li>"+
                    "</ul>"+
                    "<div>");
            }
        });
        })(c, i);
    }
}

function izrisiGraf(data) {    
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 400 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")

    var svg = d3.select("#graf").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    x.domain(data.map(function(d) { return d.name; }));

    var gxAxis = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        gxAxis.selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)" );
            
    var maxWidth = 0;
	gxAxis.selectAll("text").each(function () {
		var boxWidth = this.getBBox().width;
		if (boxWidth > maxWidth) 
		    maxWidth = boxWidth;
	});
	height = height - maxWidth;

	gxAxis.attr("transform", "translate(0," + height + ")");

    var y = d3.scale.linear()
        .range([height, 0]);

    y.domain([0, d3.max(data, function(d) { return d.probability; })]);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Probability");
        
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.name); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.probability); })
        .attr("height", function(d) { return height - y(d.probability); });

}

$(document).ready(function() {
    var box = bootbox.dialog({
        message: "Kako zelis zaceti?",
        title: "eDiagnosis",
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
                    for (var i = 1; i <= 3; i++) {
                        generirajPodatke(i);
                    }
                    $("#obvestila").html("<div class=alert-success>Vzorcni uporabniki generirani.</div>");
                }
            }
        }
    });
    
    box.css({
        'top': '50%',
        'margin-top': function () {
            return -(box.height() / 2);
        }
    });
    
    $("#generirajPodatke").click(function() {
        for (var i = 1; i <= 3; i++) {
            generirajPodatke(i);
        }
        $("#obvestila").html("<div class=alert-success>Vzorcni uporabniki generirani.</div>");
    });
    
    $("#isciEhrID").click(function() {
        var ehrId = $("#vnesiEhrID").val();
        poisciEhrID(ehrId);
    });
    
    $(function(){
        $(".dropdown-menu").on('click', 'li a', function() {
        $("#user").html("<div class=alert-info><strong>Trenutni uporabnik:</strong> "+$(this).text()+
            " <strong>EhrID: </strong>"+$(this).attr('data-eid')+"</div>");
        });
    });
    
    $(function(){
        $(".dropdown-menu").on('click', 'li a', function() {
            trenutniEhrID = $(this).attr('data-eid');
            trenutniSpol = $(this).attr('gender');
            trenutnaStarost = vrniStarostVLetih($(this).attr('dob'));
            simptomiInFaktorjiTveganjaEHRbaza(trenutniEhrID, trenutniSpol, trenutnaStarost);
        });
    });
    
    $("#poisciSimptome").click(function() {
        if (trenutniEhrID == null) {
            $("#obvestila").html("<div class=alert-danger>Prosimo izberite enega od uporabnikov.</div>");
        } else {
            var phrase = $("#vnesiPoizvedbo").val()
            poisciSimptomeInFaktorjeTveganja(phrase, trenutniSpol);
        }
    });
    
    $(function() {
        $("#rezultati").on("click", 'button', function() {
            if (!$(this).hasClass('disabled')) {
                $(this).addClass('disabled');
                $("#izbire").append("<li class=list-group-item>"+$(this).text()+"</li>");
                var con = {
                    id: $(this).attr('id'),
                    choice_id: "present"
                };
                evidence.push(con);
                diagnoza(trenutniSpol, trenutnaStarost, evidence, function(data) {
                    podrobnosti(data);   
                });
            }
        });
    });

    $("#pocistiIzbor").click(function() {
        $("#izbire").html("");
        $("#diagnoze").html("");
        $("#graf").html("");
        evidence = [];
    });
});