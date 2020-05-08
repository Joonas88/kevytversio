'use strict';
/**
 * @author Joonas Soininen
 */

let paikka

function success(pos) { //Funktiolla ajetaan käyttäjän sijainti kartalle
    paikka = pos.coords;
    console.log(`Latitude: ${paikka.latitude}`);
    console.log(`Longitude: ${paikka.longitude}`);
}

hakunappi.addEventListener('click', napinpano);

function napinpano() { //Funktiolla määritellään mitä tapahtuu hakunappia painettaessa
    pysakit(paikka);
    clear();
}
const options = { //Kartan asetuksia joilla määritetään sijainnin tarkuuden tarkkuus
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};
navigator.geolocation.getCurrentPosition(success, error, options);

function error(err) { //Virheen sattuessa ajetaan tämä funktio ja tulostetaan virheestä johtuva data konsoliin
    console.warn(`ERROR(${err.code}): ${err.message}`);
}

//Helsingin rautatieasmean koordinaatit:lat:60.171040,lon: 24.941957
//Tikkurila Heurekan koordinaatit:lat:60.287520,lon: 25.040841
//Pasia koordinaatit:lat:60.198008,lon:24.933722
// kartan toiminnallisuuden testaamista varten

let tulostaLista =[];
let ajoneuvot = [];

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
        //console.log(katsoKarttaa);
        for (let x = 0; x < pysakit.data.stopsByRadius.edges.length; x++) {

            //console.log(tulos.data.stopsByRadius.edges[x].node.stop.gtfsId+' '+tulos.data.stopsByRadius.edges[x].node.stop.name+' '+tulos.data.stopsByRadius.edges[x].node.distance+'m päässä');
            //console.log(katsoKarttaa.data.stopsByRadius.edges[x].node.stop.vehicleMode);
            const koordinaatit = {latitude: pysakit.data.stopsByRadius.edges[x].node.stop.lat, longitude: pysakit.data.stopsByRadius.edges[x].node.stop.lon};
            const teksti=pysakit.data.stopsByRadius.edges[x].node.stop.name;
            const matka = pysakit.data.stopsByRadius.edges[x].node.distance;
            const stopID=pysakit.data.stopsByRadius.edges[x].node.stop.gtfsId;

            tulostaLista.push([teksti,stopID,matka,[]]);
            tietojenTulostus();
            kulkuneuvot(pysakit.data.stopsByRadius.edges[x].node.stop.gtfsId,koordinaatit)
        }

    });
}

function kulkuneuvot (pysakkiId, koordinaatit) {
    //console.log(pysakkiId);
    const  kulkuneuvot = {
        query: `{
  stop(id: "${pysakkiId}") {
    name
    gtfsId
    platformCode
    zoneId
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

        for (let x=0; x<pysakkiInfo.data.stop.stoptimesWithoutPatterns.length; x++){

            const aikaLeima = new Date((pysakkiInfo.data.stop.stoptimesWithoutPatterns[x].serviceDay+pysakkiInfo.data.stop.stoptimesWithoutPatterns[x].realtimeDeparture)*1000).toLocaleTimeString("fi-FI");

            let maaranpaa = null;

            if (pysakkiInfo.data.stop.stoptimesWithoutPatterns[x].headsign===null){
                maaranpaa='Linjan päätepysäkki';
            } else{
                maaranpaa=pysakkiInfo.data.stop.stoptimesWithoutPatterns[x].headsign;
            }

            linjanumero=pysakkiInfo.data.stop.stoptimesWithoutPatterns[x].trip.route.shortName
            zoneId=pysakkiInfo.data.stop.zoneId;
            //console.log(linjanumero, maaranpaa, aikaLeima, zoneId);



            ajoneuvot.push([pysakkiId,[linjanumero, maaranpaa,aikaLeima, zoneId]]);
            //tulostaLista[x][3].push(ajoneuvot);

            tietojenTulostus(tulostaLista);

        }


    });
}
console.log(tulostaLista);
console.log(ajoneuvot);
const tulostus = document.getElementById('tulostus');

//pysakinNimi, datapaketti, maaranpaa, lahtoAika, vyohyke,crd
function tietojenTulostus() { //Tämä funktio tulostaa HTML-sivulle kartan alle halutut tiedot, eli pysäkin nimen, sen läpi kulkevat linjat ja niiden lähtöajan
    //let linjaNumero=datapaketti.shortName;
    //let reittiID=datapaketti.gtfsId;
    for (let a=0;a<tulostaLista.length;a++){
        tulostus.innerHTML=tulostaLista;
    }


/*
    if (vyohyke==='D'){
        vyohykeKuva.src='media/vyohyke_D.png';
    } else if (vyohyke==='B'){
        vyohykeKuva.src='media/vyohyke_B.png';
    } else if (vyohyke==='C'){
        vyohykeKuva.src='media/vyohyke_C.png';
    } else {
        vyohykeKuva.src='media/vyohyke_A.png';
    }

 */

/*
    lahto.innerHTML+=lahtoAika+'<br/>';
    linjaNRO.innerHTML+=`<a href="https://reittiopas.hsl.fi/linjat/${reittiID}" target="_blank">${linjaNumero}`;
    reitti.innerHTML+=`<a href="https://reittiopas.hsl.fi/linjat/${reittiID}" target="_blank">${maaranpaa}</a><br/><br/>`
    navigoi.href=`https://www.openstreetmap.org/directions?engine=graphhopper_foot&route=${paikka.latitude}%2C${paikka.longitude}%3B${crd.latitude}%2C${crd.longitude}`;

 */


}

function clear() { //Funktio tyhjentää pysäkkitiedot ennen uudelleenkirjoitusta

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
