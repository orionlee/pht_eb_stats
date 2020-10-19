//
// SIMBAD URL format: http://simbad.u-strasbg.fr/simbad/sim-help?Page=sim-url
//

// @exports
async function getSimbadMetaOfCoord(idMeta) {
  if (!idMeta.ra || !idMeta.dec) {
    throw new Error(`getSimbadMetaOfCoord() 'ra' and 'dec' are both required: (${idMeta.ra}, ${idMeta.dec})`);
  }
  const sign = idMeta.dec.match(/^\d+/) ? '+' : '';
  const url = `http://simbad.u-strasbg.fr/simbad/sim-coo?Coord=${idMeta.ra}${sign}${idMeta.dec}&Radius=2&Radius.unit=arcmin&output.format=ASCII`;
  const resp = await fetch(url);
  const text = await resp.text();

  let meta = parseSimbadMeta(text);
  if (meta == null) {
    console.warn(`Parsing SIMBAD result failed. tic: ${idMeta.tic} . text starts with:`, text.substring(0, 100).replace(/\n/g, ' {\\n} '));
    meta = {};
  }
  meta.tic = idMeta.tic;

  return {meta, text};
}

function parseSimbadMeta(text) {
  let res = parseSimbadMetaSingleObject(text);
  if (!res) {
    res = parseSimbadMetaObjectList(text);
  }

  if (!res) {
    if (text.match(/^!! No astronomical object found/)) {
      res = {notFound: true};
    }
    // else parsing failed, return null
  }
  return res;
}

// Parse SIMBAD result for case the result is about a single object
function parseSimbadMetaSingleObject(text) {
  function getMag(band) {
    const [, magText] = text.match(new RegExp(`^Flux ${band} : ([0-9.-]+)`, 'm')) || [null, null];
    if (magText == null) {
      return null;
    }
    return parseFloat(magText);
  }

  const [, id, typeRaw] = text.match(/^------+\s*\n\nObject\s+(.+?)\s+---+(.+)---+\s+OID/m) || [null, null, null];
  if (id == null) {
    // the text is not in the format of single object
    return null;
  }

  const type = typeRaw.trim();
  const angularDistance = null; // single object has no such data
  const magB = getMag('B');
  const magV = getMag('V');
  const magR = getMag('r');

  const [, aliasLines] = text.match(/^Identifiers.+:\n((.|\n)+?)\n\n/m) || [null, null];
  const aliases = aliasLines == null ? null
    : aliasLines.replace(/\n/g, '  ').trim().replace(/\s\s+/g, ', ');

  return { id, type, magB, magV, magR, angularDistance, aliases };
}

// Parse SIMBAD result for case the result is about a single object
function parseSimbadMetaObjectList(text) {
  //                                     V-- must use space rather than \s, as \s will include beginning \n
  const [, header, row1] = text.match(/^([ ]*#\s*[|].+)\n-+[|].+\n(1\s*[|].+)/m) || [null, null, null];

  if (row1 == null) {
    return null;
  }

  // console.debug('parseSimbadMetaObjectList()');
  // window._header = header;
  // window._row1 = row1;
  // console.debug(header);
  // console.debug(row1);

  function get(key) {
    const idx = header.search(new RegExp(`[|]\\s*${key}`));
    if (idx < 0) {
      return null;
    }
    // console.debug(`  key ${key}: ${idx} ; substr: ${row1.substring(idx+1, idx+11)} ; head-sub: ${header.substring(idx+1, idx+11)}`);
    // console.debug(header.substring(idx+1));
    // console.debug(row1.substring(idx+1));
    return (row1.substring(idx+1).match(/^\s*(.+?)\s*([|]|$)/) || [null, null])[1];
  }

  function getFloat(key) {
    const resText = get(key);
    return (resText != null && resText != '~') ? parseFloat(resText) : null;
  }


  const id = get('identifier');
  const type = get('typ');
  const magB = getFloat('Mag B');
  const magV = getFloat('Mag V');
  const magR = getFloat('Mag R');
  const angularDistance = getFloat('dist');
  const aliases = null;  // not available

  return { id, type, magB, magV, magR, angularDistance, aliases };
}


// BEGIN The bulk action api
// @generic

let _loadResults = [];
function saveLoadResult(tic, res) {
  _loadResults.push(res);
}

let _loadErrors = [];
function saveLoadError(tic, err) {
  _loadErrors.push([tic, err]);
}

PROGRESS_MSG = true;
// @exports
async function loadAndProcessBulk(ids, loadFn, processFn, errorFn) {
  for(const id of ids) {
    // TODO: some way to interrupt it
    try {
      if (PROGRESS_MSG) {
        const idMsg = id['tic'] || id.toString();
        console.debug(`Processing ${idMsg}`);
      }
      const res = await loadFn(id);
      processFn(id, res);
    } catch (err) {
      try {
        errorFn(id, err);
      } catch (err1) {
        console.error(`loadAndProcessBulk() - unexpected error during error handling. tic: ${id} . error:`, err1);
      }
    }
  }
  return;
}

async function runAndSaveInMemory(loadFn, ids) {
  _loadResults = [];
  _loadErrors = [];
  await loadAndProcessBulk(ids, loadFn, saveLoadResult, saveLoadError);
  console.log('Num processed in _loadResults: ', _loadResults.length);
  console.log('Num errors    in _loadErrors:  ', _loadErrors.length);
  const metaList = _loadResults.map(res => res.meta);
  const textList = _loadResults.map(res => res.text);
  return [metaList, textList];
}

//
// END The bulk action api


// BEGIN Result Output helpers
//

// @generic
function toCSV(objectList, fields, sep='|') {
  const csvLines = [];
  for (const meta of objectList) {
    const line = fields.map(field => {
      // handle output null as empty string for csv
      const val = meta[field];
      return val != null ? val : '';
    }).join(sep);
    csvLines.push(line);
  }
  return csvLines.join('\n');
}

function toSimbadMetaCSV(metaList, sep='|') {
  return toCSV(metaList, ['tic', 'id', 'type', 'magB', 'magV', 'magR', 'angularDistance', 'aliases'], sep);
}

// @generic
function joinTextList(textList, sep='------') {
  // TODO: changed it so that the separator
  // - precedes the text
  // - in the form of ------ TIC <tic number>
  // so that one can search the resulting text file for a given TIC more easily
  let  res = ''
  for (const text of textList) {
    res += text;
    res += `\n${sep}\n`;
  }
  return res;
}

//
// END Result Output helpers


function parseTicMetaCSV(ticMetaCSVText) {
  function parseLine(line) {
    const cells = line.split('|');
    return {tic: cells[0], ra: cells[1], dec: cells[2]};
  }

  const lines = ticMetaCSVText.split('\n').filter(text => text != null && text.length > 0);
  return lines.map(l => parseLine(l));
}

//
// Ad-hoc tests
//

/*
idMeta = { tic: '249943198', ra: '38.798798', dec: '+49.860304' };
_res = await getSimbadMetaOfCoord(idMeta);
*/
const idMetaText = `878056|123.973843|-15.934388
1029392|33.81222|-10.80029
1045298|34.426805|-8.277568
23936839|276.067089|35.241259
24433067|82.000781|-33.577121
50189810|40.010273|61.129265
50273697|30.084164|-74.332386
229751806|280.687707|69.93889
229771234|282.268028|68.157121
399788405|278.163399|57.648244
400302671|263.324255|14.50538
609742113|9.656502|79.360345
640714388|52.071458|25.481511
1717079071|286.971388|46.868246
1883519478|294.671858|54.974491
1981303680|300.391677|70.454548
`;
'';
// sample top-level codes
if (false) {
  /*
  ids = parseTicMetaCSV(idMetaText);
  [metaList, textList] = await runAndSaveInMemory(getSimbadMetaOfCoord, ids);
  toSimbadMetaCSV(metaList);
  joinTextList(textList);
  */
}

function testDetail() {
  // TIC 249943198
  const text = `C.D.S.  -  SIMBAD4 rel 1.7  -  2020.10.19CEST00:40:36

coord 38.798797880814497 49.860304067315198 (ICRS, J2000, 2000.0), radius: 2 arcmin
-----------------------------------------------------------------------------------

Object V* V376 And  ---  WU*  ---  OID=@110892   (@@1956,14)  ---  coobox=2634

Coordinates(ICRS,ep=J2015.5,eq=2000): 02 35 11.7114917855  +49 51 37.094636506 (Opt ) A [0.0376 0.0368 90] 2018yCat.1345....0G
Coordinates(FK4,ep=B1950,eq=1950): 02 31 48.6284751604  +49 38 32.066418905
Coordinates(Gal,ep=J2000,eq=2000): 139.5513577783713  -09.6336292157754
hierarchy counts: #parents=0, #children=0, #siblings=0
Proper motions: 49.745 -7.569 [0.096 0.086 90] A 2018yCat.1345....0G
Parallax: 5.4417 [0.0490] A 2018yCat.1345....0G
Radial Velocity: 22.83 [0.89] A 2005MNRAS.357..497B
Redshift: 0.000076 [0.000003] A 2005MNRAS.357..497B
cz: 22.83 [0.89] A 2005MNRAS.357..497B
Flux B : 8.02 [0.01] D 2000A&A...355L..27H
Flux V : 7.77 [0.01] D 2000A&A...355L..27H
Flux G : 7.6857 [0.0055] C 2018yCat.1345....0G
Flux J : 7.016 [0.026] C 2003yCat.2246....0C
Flux H : 6.910 [0.026] C 2003yCat.2246....0C
Flux K : 6.883 [0.029] C 2003yCat.2246....0C
Spectral type: A4V ~ 2008RMxAA..44..249D
Morphological type: ~ ~ ~
Angular size:     ~     ~   ~ (~)  ~ ~

Identifiers (15):
    2MASS J02351163+4951374         SBC9 1906                       AG+49 295
    BD+49 701                       GSC 03303-00979                 HD 15922
    HIC 12039                       HIP 12039                       PPM 45228
    SAO 38140                       SKY# 3835                       TYC 3303-979-1
    V* V376 And                     Gaia DR1 450600034231640704     Gaia DR2 450600038527653888

Bibcodes  1850-2020 () (43):
  2020A&A...640A.123B  2019PASJ...71...21K  2018A&A...617A..32B  2018RAA....18...55X
  2016AJ....152...57D  2015IBVS.6152....1H  2014MNRAS.437..185Y  2013AJ....146...70R
  2013AN....334..860A  2013MNRAS.430.2029Y  2012A&A...546A..61D  2012MNRAS.427..343M
  2011MNRAS.414.2602D  2011NewA...16...12C  2010MNRAS.408..464Z  2009IBVS.5889....1H
  2008AJ....135.2245R  2008RMxAA..44..249D  2007AJ....134.2353R  2007IBVS.5760....1N
  2006A&A...446..785M  2006AJ....131.2986P  2006AJ....132..650D  2006AstL...32..759G
  2006IBVS.5731....1H  2006IBVS.5736....1C  2006RoAJ...16...75D  2005IBVS.5599....1T
  2005IBVS.5606....1P  2005IBVS.5623....1D  2005IBVS.5649....1A  2005IBVS.5657....1H
  2005MNRAS.357..497B  2004A&A...424..727P  2004AcA....54..207K  2004RoAJ...14...39D
  2003CoSka..33...38P  2003IBVS.5407....1T  2001AJ....122.1974R  2000IBVS.4855....1K
  1999IBVS.4659....1K  1999IBVS.4662....1K  1993yCat.3135....0C

Measures (distance:1  MK:1  PLX:4  PM:4  V*:1  velocities:1  ):
distance:1MK:1PLX:4PM:4V*:1velocities:1

Notes (0) :

================================================================================
`;

  return parseSimbadMeta(text);
}

function testDetail_NoType() {
  const text = `C.D.S.  -  SIMBAD4 rel 1.7  -  2020.10.19CEST01:08:35

HD  40485
---------

Object HD 40485  ---  *  ---  OID=@3106230   (@@69894,14)  ---  coobox=22785

Coordinates(ICRS,ep=J2015.5,eq=2000): 05 53 08.6603032357  -69 05 54.892025230 (Opt ) A [0.1553 0.1473 90] 2018yCat.1345....0G
Coordinates(FK4,ep=B1950,eq=1950): 05 53 29.7970718375  -69 06 22.331991687
Coordinates(Gal,ep=J2000,eq=2000): 279.3362794941352  -30.3892071538163
hierarchy counts: #parents=0, #children=0, #siblings=0
Proper motions: 7.283 -28.263 [0.286 0.292 90] A 2018yCat.1345....0G
Parallax: 4.4794 [0.1392] A 2018yCat.1345....0G
Radial Velocity: 32.04 [1.48] B 2018yCat.1345....0G
Redshift: 0.000107 [0.000005] B 2018yCat.1345....0G
cz: 32.04 [1.48] B 2018yCat.1345....0G
Flux B : 10.009 [0.095] C 2014AJ....148...81M
Flux V : 9.46 [0.02] D 2000A&A...355L..27H
Flux G : 9.3432 [0.0005] C 2018yCat.1345....0G
Flux J : 8.459 [0.026] C 2003yCat.2246....0C
Flux H : 8.230 [0.029] C 2003yCat.2246....0C
Flux K : 8.144 [0.024] C 2003yCat.2246....0C
Flux g : 10.122 [0.004] B 2014AJ....148...81M
Flux r : 9.403 [0.025] C 2014AJ....148...81M
Flux i : 9.341 [0.136] D 2014AJ....148...81M
Spectral type: F6IV/V D 1975MSS...C01....0H
Morphological type: ~ ~ ~
Angular size:     ~     ~   ~ (~)  ~ ~

Identifiers (15):
   2MASS J05530864-6905543         CD-69 342                       CPC 21.1 891
   CPD-69 540                      GCRV 25414                      GSC 09163-00640
   HD 40485                        PPM 355046                      PV 1646
   SAO 249389                      TYC 9163-640-1                  SSTISAGEMC J055308.64-690554.5
   RAVE J055308.7-690555           Gaia DR1 4657542559618346752    Gaia DR2 4657542563926076672

Bibcodes  1850-2020 () (6):
  2014AJ....148...81M  1993A&AS...99..591G  1993yCat.3135....0C  1991A&AS...90....1P
  1975MSS...C01....0H  1974A&AS...13..173F

Measures (distance:2  Fe_H:1  MK:2  PLX:2  PM:1  velocities:3  ):
distance:2Fe_H:1MK:2PLX:2PM:1velocities:3

Notes (0) :

================================================================================
`;
  return parseSimbadMeta(text);
}

function testObjectList() {
  // TIC 249943198, increased search radius to force it to return a list
  const text = `C.D.S.  -  SIMBAD4 rel 1.7  -  2020.10.19CEST01:29:25

coord 38.798797880814497 49.860304067315198 (ICRS, J2000, 2000.0), radius: 5 arcmin
-----------------------------------------------------------------------------------

Number of objects : 3

#|dist(asec)|            identifier             |typ|      coord1 (ICRS,J2015.5/2000)       |Mag U |Mag B |Mag V |Mag R |Mag I |  spec. type   |#bib|#not
-|----------|-----------------------------------|---|---------------------------------------|------|------|------|------|------|---------------|----|----
1|      0.78|V* V376 And                        |WU*|02 35 11.7114917855 +49 51 37.094636506|     ~| 8.02 | 7.77 |     ~|     ~|A4V            |  43|   0
2|    276.14|TYC 3303-1013-1                    |*  |02 34 50.1999588014 +49 54 38.764879760|     ~|12.03 |11.76 |     ~|     ~|~              |   0|   0
3|    291.47|TYC 3303-841-1                     |*  |02 35 01.5364621634 +49 56 11.434237964|     ~|12.33 |12.10 |     ~|     ~|~              |   0|   0
================================================================================

`;
  return parseSimbadMeta(text);
}

function testObjectList_ParseFailed1() {
  const text = `C.D.S.  -  SIMBAD4 rel 1.7  -  2020.10.19CEST03:45:04

coord 84.696693-2.59459 (ICRS, J2000, 2000.0), radius: 2 arcmin
---------------------------------------------------------------

Number of objects : 70

# |dist(asec)|            identifier             |typ|       coord1 (ICRS,J2000/2000)        |Mag U |Mag B |Mag V |Mag R |Mag I |  spec. type   |#bib|#not
--|----------|-----------------------------------|---|---------------------------------------|------|------|------|------|------|---------------|----|----
1 |      0.02|* sig Ori E                        |Y*O|05 38 47.2050001416 -02 35 40.514907495| 5.66 | 6.38 | 6.46 | 6.84 | 7.08 |B2IV-Vp_He     | 402|   0
2 |      9.98|[BHM2009] SigOri-MAD-32            |NIR|05 38 47.20 -02 35 50.5                |     ~|     ~|     ~|     ~|     ~|~              |   1|   0
3 |     11.49|[BHM2009] SigOri-MAD-29            |NIR|05 38 47.10 -02 35 51.9                |     ~|     ~|     ~|     ~|     ~|~              |   1|   0
4 |     12.77|2MASS J05384652-0235479            |*  |05 38 46.5205129616 -02 35 48.103237425|     ~|     ~|     ~|     ~|     ~|~              |   3|   0
5 |     13.37|[BHM2009] SigOri-MAD-28            |NIR|05 38 47.10 -02 35 53.8                |     ~|     ~|     ~|     ~|     ~|~              |   1|   0
6 |     15.17|[BHM2009] SigOri-MAD-21            |NIR|05 38 46.40 -02 35 49.7                |     ~|     ~|     ~|     ~|     ~|~              |   1|   0

`
  return parseSimbadMeta(text);
}

function testObjectList_ParseFailed2() {
  const text = `C.D.S.  -  SIMBAD4 rel 1.7  -  2020.10.19CEST03:45:17

coord 74.267111-66.486262 (ICRS, J2000, 2000.0), radius: 2 arcmin
-----------------------------------------------------------------

Number of objects : 264

 # |dist(asec)|            identifier             |typ|       coord1 (ICRS,J2000/2000)        |Mag U |Mag B |Mag V |Mag R |Mag I |  spec. type   |#bib|#not
---|----------|-----------------------------------|---|---------------------------------------|------|------|------|------|------|---------------|----|----
1  |      0.03|SK -66 34                          |*  |04 57 04.1022066936 -66 29 10.544737222|11.699|12.502|12.779|     ~|     ~|B1Ia           |   7|   0
2  |     18.36|2MASS J04570105-6629085            |*  |04 57 01.057 -66 29 08.56              |     ~|17.715|16.636|     ~|     ~|~              |   1|   0
3  |     23.10|PGMW 1520                          |*  |04 57 01.70 -66 29 28.6                |     ~|16.239|16.706|     ~|     ~|~              |   1|   0
4  |     26.23|PGMW 1515                          |*  |04 56 59.73 -66 29 09.1                |     ~|19.161|18.662|     ~|     ~|~              |   1|   0
5  |     26.39|2MASS J04570042-6628560            |*  |04 57 00.424 -66 28 56.03              |     ~|17.376|16.668|     ~|     ~|~              |   1|   0
6  |     27.00|OGLE LMC-RRLYR-28291               |RR*|04 57 00.4766901373 -66 29 26.573834156|     ~|     ~|19.662|     ~|18.976|~              |   3|   0
`
  return parseSimbadMeta(text);
}

// console.log(testDetail());
// console.log(testDetail_NoType());
// console.log(testObjectList());
//console.log(testObjectList_ParseFailed1());
console.log(testObjectList_ParseFailed2());
// console.log(parseTicMetaCSV(idMetaText));
