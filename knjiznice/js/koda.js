
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
                $('#izbiraUporabnika-menu').append("<li><a data-eid"+ehrId+" gender="+gender+" dob="+date 
                +" href=#>"+party.firstNames+" "+party.lastNames+"</a></li>");
                $('#obvestila').html("<div class=alert-success>Uporabnik "+party.firstNames+" "+party.lastNames+" dodan v seznam</div>");
            }
        }, 
        error: function(err) {
            $('#obvestila').html("<div class=alert-danger>Pri iskanju je prislo do napake. Prosimo poskusite ponovno.</div>");
        }
    });    
}

function poisciOpazovanja(phrase, gender) { 
    delete $.ajaxSettings.headers["Ehr-Session"];
    $.ajaxSetup({
	    headers: {
		    "app_id": "9604c0a9",
		    "app_key": "985798a1abd45beb2cac6e0e0116ebea"
	    }
    });
    $.ajax({
        url: "https://api.infermedica.com/v2/search?phrase="+phrase+"&sex="+gender+"&max_results=10",
        type: 'GET',
        contentType: "application/json",
        success: function(res) {
            $("#rezultati").html("");
            for (i in res) {
                var re = res[i];
                $("#rezultati").append("<button type=button class=list-group-item izbire>"+re.label+"</button>");
            }
        }
    });
}

function diagnoza(gender, age, evidence) { 
  //  delete $.ajaxSettings.headers["Ehr-Session"];
    $.ajaxSetup({
	    headers: {
		    "app_id": "9604c0a9",
		    "app_key": "985798a1abd45beb2cac6e0e0116ebea"
	    }
    });
    var d = {    
        sex: gender,
        age: age,
        evidence: evidence
    }
    $.ajax({
        url: "https://api.infermedica.com/v2/diagnosis",
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify(d),
        success: function(res) {
            izrisi(res.conditions);
            for (i in res.conditions) {
                var c = res.conditions[i];
                $("#obvestila").append("<span>"+c.name+"</span>");
            }
        }
    });
}

    
function izrisi(data) {    
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 400 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var svg = d3.select("#graf").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    x.domain(data.map(function(d) { return d.name; }));
    y.domain([0, d3.max(data, function(d) { return d.probability; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)

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

function getAgeInYears(dateOfBirth) {
    var dob = new Date(dateOfBirth);
    console.log(dob);
    var timeDiff = Math.abs(Date.now() - dob.getTime());
    return Math.floor(timeDiff / (1000 * 3600 * 24 * 365));
}

// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija
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
    
    $("#gen").click(function() {
        for (var i = 1; i <= 3; i++) {
            generirajPodatke(i);
        }
        $("#obvestila").html("<div class=alert-success>Vzorcni uporabniki generirani.</div>");
    });
    
    $("#isci").click(function() {
        var ehrId = $("#vnesiEhrID").val();
        poisciEhrID(ehrId);
    });
    
    var trenutniSpol;    
    var trenutnaStarost;

    $(function(){
        $(".dropdown-menu").on('click', 'li a', function() {
        $("#user").html("<div class=alert-info><strong>Trenutni uporabnik:</strong> "+$(this).text()+
            " <strong>EhrID: </strong>"+$(this).attr('data-eid')+"</div>");
        });
    });
    
    $(function(){
        $(".dropdown-menu").on('click', 'li a', function() {
            trenutniSpol = $(this).attr('gender');
            trenutnaStarost = $(this).attr('dob');
        });
    });
    
    $("#isciO").click(function() {
        var phrase = $("#opazovanja").val()
        poisciOpazovanja(phrase, trenutniSpol);
    });
    
    $(function() {
        $("#rezultati").on("click", 'button', function() {
            if (!$(this).hasClass('disabled')) {
                $(this).addClass('disabled');
                $("#izbire").append("<li class=list-group-item>"+$(this).text()+"</li>");
            }
        });
    });
});
