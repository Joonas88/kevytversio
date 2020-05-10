'use strict';
/**
 * @author Joonas Soininen
 */

const aikataulu = document.getElementById('aikataulu');

let paikka

function success(pos) {
    paikka = pos.coords;
    console.log(`Latitude: ${paikka.latitude}`);
    console.log(`Longitude: ${paikka.longitude}`);
    pysakit(paikka);
}

hakunappi.addEventListener('click', napinpano);

function napinpano() {
    clear();


}
const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};
navigator.geolocation.getCurrentPosition(success, error, options);
function error(err) { //Virheen sattuessa ajetaan tämä funktio ja tulostetaan virheestä johtuva data konsoliin
    console.warn(`ERROR(${err.code}): ${err.message}`);
}

//Helsingin rautatieasmean koordinaatit: lat:60.171040,lon: 24.941957
//Tikkurila Heurekan koordinaatit:lat:60.287520,lon: 25.040841
//Pasila koordinaatit:lat:60.198008,lon:24.933722
//kartan toiminnallisuuden testaamista varten

function pysakit (crd) {
    const pysakkiKysely = {
        query: `{
    stopsByRadius(lat:${crd.latitude},lon: ${crd.longitude},radius:1000) {
      edges {
        node {
          stop { 
            gtfsId 
            zoneId
            vehicleMode
            name
            lat
            lon
            platformCode
          }
          distance
        }
      }
    }
}`
    };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
        },
        body: JSON.stringify(pysakkiKysely),
    };

    fetch('https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql', options).then(function (response) {
        return response.json()
    }).then(function (pysakit) {
        console.log(pysakit);
        for (let x = 0; x < pysakit.data.stopsByRadius.edges.length; x++) {
            const koordinaatit = {latitude: pysakit.data.stopsByRadius.edges[x].node.stop.lat, longitude: pysakit.data.stopsByRadius.edges[x].node.stop.lon};
            kulkuneuvot(pysakit.data.stopsByRadius.edges[x].node.stop.gtfsId, pysakit.data.stopsByRadius.edges[x].node.distance, x, pysakit.data.stopsByRadius.edges[x].node.stop.name, pysakit.data.stopsByRadius.edges[x].node.stop.zoneId, pysakit.data.stopsByRadius.edges[x].node.stop.vehicleMode, koordinaatit);
        }

    });
}

//let pysakkiLista = [];
//let kulkuneuvoLista = [];

function kulkuneuvot (pysakkiId, matka, iteraattori, teksti, zondeID, kulkuneuvo, crd) {
    //console.log(pysakkiId);
    const  kulkuneuvot = {
        query: `{
  stop(id: "${pysakkiId}") {
    name
    gtfsId
    platformCode
    zoneId
    vehicleMode
    lat
    lon
      stoptimesWithoutPatterns {
      scheduledArrival
      realtimeArrival
      arrivalDelay
      scheduledDeparture
      realtimeDeparture
      departureDelay
      realtime
      realtimeState
      serviceDay
      headsign
        trip {
            route {
            gtfsId
            mode
            shortName
            longName
            }
        }
      }
    }  
}`
    };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
        },
        body: JSON.stringify(kulkuneuvot),
    };

    fetch('https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql', options).then(function (response) {
        return response.json()
    }).then(function (pysakkiInfo) {
        //console.log(pysakkiInfo);

        let linjanumero =null, zoneId=null;


        //pysakkiLista.push({id:iteraattori, nimi:teksti, tyyppi:kulkuneuvo, etaisyys:matka, vyohyke:zondeID,linja:[]});

        if (kulkuneuvo==='BUS'){

            aikataulu.innerHTML+=`<div id="ylempipysäkki"><div id="pysäkki"><img id="ikoni" alt="bussi" src="media/bussi.png"><div id="pysäkinNimi">${teksti+' '+matka+'m päässä'}</div></div><a id="navigoi" href="https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${paikka.latitude},${paikka.longitude}&destination=${crd.latitude},${crd.longitude}" target="_blank">Näytä reitti</a></div></div>`;
        } else if (kulkuneuvo==='TRAM'){

            aikataulu.innerHTML+=`<div id="ylempipysäkki"><div id="pysäkki"><img id="ikoni" alt="ratikka" src="media/Ratikka.png"><div id="pysäkinNimi">${teksti+' '+matka+'m päässä'}</div></div><a id="navigoi" href="https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${paikka.latitude},${paikka.longitude}&destination=${crd.latitude},${crd.longitude}" target="_blank">Näytä reitti</a></div></div>`;
        } else if (kulkuneuvo==='RAIL'){

            aikataulu.innerHTML+=`<div id="ylempipysäkki"><div id="pysäkki"><img id="ikoni" alt="juna" src="media/Juna.png"><div id="pysäkinNimi">${teksti+' '+matka+'m päässä'}</div></div><a id="navigoi" href="https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${paikka.latitude},${paikka.longitude}&destination=${crd.latitude},${crd.longitude}" target="_blank">Näytä reitti</a></div></div>`;
        } else if (kulkuneuvo==='SUBWAY'){

            aikataulu.innerHTML+=`<div id="ylempipysäkki"><div id="pysäkki"><img id="ikoni" alt="metro" src="media/metro.png"><div id="pysäkinNimi">${teksti+' '+matka+'m päässä'}</div></div><a id="navigoi" href="https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${paikka.latitude},${paikka.longitude}&destination=${crd.latitude},${crd.longitude}" target="_blank">Näytä reitti</a></div></div>`;
        } else {

            aikataulu.innerHTML+=`<div id="ylempipysäkki"><div id="pysäkki"><img id="ikoni" alt="lautta" src="media/lautta.png"><div id="pysäkinNimi">${teksti+' '+matka+'m päässä'}</div></div><a id="navigoi" href="https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${paikka.latitude},${paikka.longitude}&destination=${crd.latitude},${crd.longitude}" target="_blank">Näytä reitti</a></div></div>`;
        }
        const color = document.getElementById('pysäkki');
        if (kulkuneuvo==='BUS'){
            color.id='bussi';
        } else if (kulkuneuvo==='TRAM'){
            color.id='ratikka';
        } else if (kulkuneuvo==='RAIL'){
            color.id='juna';
        } else if (kulkuneuvo==='SUBWAY'){
            color.id='metro';
        } else {
            color.id='lautta';
        }



        for (let x=0; x<pysakkiInfo.data.stop.stoptimesWithoutPatterns.length; x++){

            const aikaLeima = new Date((pysakkiInfo.data.stop.stoptimesWithoutPatterns[x].serviceDay+pysakkiInfo.data.stop.stoptimesWithoutPatterns[x].realtimeDeparture)*1000).toLocaleTimeString("fi-FI");

            let maaranpaa = null;
            linjanumero=pysakkiInfo.data.stop.stoptimesWithoutPatterns[x].trip.route.shortName
            if (pysakkiInfo.data.stop.stoptimesWithoutPatterns[x].headsign===null){
                maaranpaa='Linjan päätepysäkki';
            } else{
                maaranpaa=pysakkiInfo.data.stop.stoptimesWithoutPatterns[x].headsign;
            }
            aikataulu.innerHTML+=`<div id="pysäkkiaikataulu"><div id="lähtöaika">${aikaLeima}</div><div id="linjanumero">${linjanumero}</div><div id="määränpää">${maaranpaa}</div></div>`;
            //pysakkiLista[x]['linja'].push({lahtevat:pysakkiId,linja:linjanumero,maaranaa:maaranpaa,lahtoaika:aikaLeima});

            zoneId=pysakkiInfo.data.stop.zoneId;
        }


    });

}

//console.log(pysakkiLista);
//console.log(kulkuneuvoLista);

function clear() { //Funktio tyhjentää pysäkkitiedot ennen uudelleenkirjoitusta
tulostus.innerHTML='';
}

function startTime() { //Funktio näytää reaaliaikasta kelloa pysäkkiaikataulujen yhteydessä
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    m = checkTime(m);
    s = checkTime(s);
    document.getElementById('kello').innerHTML = h + ":" + m + ":" + s;
    var t = setTimeout(startTime, 500);
}
function checkTime(i) { //Funktiolla määritetään oikea aikamuoto
    if (i < 10) {i = "0" + i}  // add zero in front of numbers < 10
    return i;
}

// When the user scrolls the page, execute myFunction
window.onscroll = function() {myFunction()};

// Get the navbar
var navbar = document.getElementById("kello");

// Get the offset position of the navbar
var sticky = navbar.offsetTop;

// Add the sticky class to the navbar when you reach its scroll position. Remove "sticky" when you leave the scroll position
function myFunction() {
    if (window.pageYOffset >= sticky) {
        navbar.classList.add("sticky")
    } else {
        navbar.classList.remove("sticky");
    }
}