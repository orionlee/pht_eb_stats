/**
 * @exports
 *
 * Note: MUST be run from https://exofop.ipac.caltech.edu/tess domain
 * The download is prohibited from other origins.
 */
async function getTicExoFOPMeta(tic) {
  const url = `https://exofop.ipac.caltech.edu/tess/download_target.php?id=${tic}`
  const resp = await fetch(url);
  const text = await resp.text();

  const meta = parseTicMeta(text);
  return {meta, text};
}

function parseTicMeta(text) {
  /**
   * Extract values from Stellar Params.
   * The value is lined up with its corresponding header.
   *
   */
  function get(params, key) {
    const idx = params.header.indexOf(key);
    if (idx < 0) {
      return null;
    }
    return (params.values.substring(idx).match(/^[^\s]+/) || [null])[0];
  }

  function getFloat(params, key) {
    const resText = get(params, key);
    return resText != null ? parseFloat(resText) : null;
  }

  function getMag(band) {
    const [, magText] = text.match(new RegExp(`^${band}\\s+([0-9.]+)`, 'm')) || [null, null];
    return magText != null ? parseFloat(magText) : null;
  }

  // Extract:
  // - TIC
  // - co-ordinates
  // - aliases
  // - magnitudes: B,V, r (or Gaia)
  // - stellar: rSun, mSun, tEff, distancePc

  const [, tic] = text.match(/^TIC\s+\ID\s+(\d+)/m) || [null, null];
  const [, raSexa, raDeg] = text.match(/^RA\s[(][^)]+[)][\s]+([^\s]+)\s+([^\s]+)/m) || [null, null, null];
  const [, decSexa, decDeg] = text.match(/^Dec\s[(][^)]+[)][\s]+([^\s]+)\s+([^\s]+)/m) || [null, null, null];

  if (!raSexa || !decSexa) {
    console.warn(`Cannot get coordinates for TIC ${tic}`);
  }

  const [, aliasesRaw] = text.match(/^Star Name & Aliases\s+(.+)/m) || [null, ''];
  const aliases = aliasesRaw.replace(new RegExp(`TIC ${tic},?\\s*`), '');

  const [, inCtlRaw] = text.match(/^In CTL\s+([^\s]+)/m) || [null, ''];
  const inCtl = (inCtlRaw == 'Yes');

  const magB = getMag('B');
  const magV = getMag('V');
  const magR = getMag('r');
  const magTess = getMag('TESS'); // serve as a fallback for R-band

  const res = { tic, inCtl,
    raDeg, decDeg,
    raSexa, decSexa,
    aliases,
    magB, magV, magR, magTess,
   };

  const [stellarParamsLines] = text.match(/^Telescope\s+.+\n+.+/m) || [null];
  if (stellarParamsLines) {
    const [header, values] = stellarParamsLines.split('\n');
    const stellarParams = {header, values};

    res.rSun = getFloat(stellarParams, 'Radius (R_Sun)');
    res.mSun = getFloat(stellarParams, 'Mass (M_Sun)');
    res.distancePc = get(stellarParams, 'Distance (pc)');
    res.tEff = getFloat(stellarParams, 'Teff (K)');
  }

  return res;
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
async function loadAndProcessBulk(tics, loadFn, processFn, errorFn) {
  for(const tic of tics) {
    try {
      if (PROGRESS_MSG) {
        console.debug(`Processing ${tic}`);
      }
      const res = await loadFn(tic);
      processFn(tic, res);
    } catch (err) {
      try {
        errorFn(tic, err);
      } catch (err1) {
        console.error(`loadAndProcessBulk() - unexpected error during error handling. tic: ${tic} . error:`, err1);
      }
    }
  }
  return;
}

//
// END The bulk action api


function toExoFOPMetaCSV(metaList, sep='|') {
  const csvLines = [];
  for (const meta of metaList) {
    const s = sep;
    const m = (field) => { // output null as empty string for csv
      const val = meta[field];
      return val != null ? val : '';
    };
    const line = `${m('tic')}${s}${m('raDeg')}${s}${m('decDeg')}${s}${m('raSexa')}${s}${m('decSexa')}\
${s}${m('magB')}${s}${m('magV')}${s}${m('magR')}${s}${m('magTess')}${s}${m('distancePc')}\
${s}${m('rSun')}${s}${m('mSun')}${s}${m('tEff')}${s}${m('inCtl')}${s}${m('aliases')}`;

    csvLines.push(line);
  }
  return csvLines.join('\n');
}

function joinExoFOPTextList(textList) {
  let  res = ''
  for (const text of textList) {
    res += text;
    res += '\n------\n';
  }
  return res;
}

function parseTicsText(ticsText) {
  return ticsText.split('\n').filter(text => text != null && text.length > 0);
}

async function run(tics) {
  _loadResults = [];
  _loadErrors = [];
  await loadAndProcessBulk(tics, getTicExoFOPMeta, saveLoadResult, saveLoadError);
  console.log('Num processed in _loadResults: ', _loadResults.length);
  console.log('Num errors    in _loadErrors:  ', _loadErrors.length);
  const metaList = _loadResults.map(res => res.meta);
  const textList = _loadResults.map(res => res.text);
  return [metaList, textList];
}

// Sample top-level codes:
if (false) {
  ticsText = `737546
878056
1029392
1045298
153991851
154067797
154222671
249943198
250195155
250196734
471012349
609742113
1717079071
`;
'';

  [metaList, textList] = await run(parseTicsText(ticsText));
  toExoFOPMetaCSV(metaList);
  joinExoFOPTextList(textList);
}



// Test the parsing of individual TICs
function testParse1() {
  const text = `TIC ID 188816156

RA (J2015.5)                17:29:37.47  262.406143
Dec (J2015.5)               52:32:50.63  52.547397
Galactic Long               79.86774
Galactic Lat                33.44287
Ecliptic Long               251.2886
Ecliptic Lat                75.4934
Proper Motion RA (mas/yr)   -34.2245 +/- 0.039811
Proper Motion Dec (mas/yr)  -35.2216 +/- 0.039098
Star Name & Aliases         TIC 188816156, UCAC4 713-057433, 2MASS J17293754+5232512, SDSS DR9 1237651212826902707, WISE J172937.49+523250.8, APASS 55652246
Planet Name(s)              N/A
In CTL                      Yes
TIC Contamination Ratio     0.053087
# of Contamination sources  81

STELLAR PARMAETERS (1)
Telescope                Instrument        Teff (K)              Teff (K) Error        log(g)                log(g) Error          Radius (R_Sun)        Radius (R_Sun) Error  logR'HK               logR'HK Error         S-index               S-index Error         H-alpha               H-alpha Error         Vsini                 Vsini Error           Rot Per               Rot Per Error         Metallicity           Metallicity Error     Mass (M_Sun)          Mass (M_Sun) Error    Density (g/cm^3)      Density (g/cm^3) Error   Luminosity            Luminosity Error      Observation Time (BJD)   RV (m/s)              RV Error              Distance (pc)         Distance (pc) Error   Date                  User                  Group             Tag               Notes
                                           5131.27               103.818               4.61987               0.0789232             0.754408              0.0383216                                                                                                                                                                                                                                         -0.192                0.05                  0.865                 0.107316              2.840642              0.630692                 0.3554733             0.0100244                                                                                  201.441               0.7995                2019-04-15            Exoplanet Archive                                         TIC v8.1

MAGNITUDES (16)
Band              Value             Error             Date                     User                Group             Tag               Notes
TESS              11.8393           0.0086            2019-04-15               Exoplanet Archive                                       TIC v8.1
B                 13.868            0.021             2019-04-15               Exoplanet Archive                                       TIC v8.1
V                 12.764            0.08              2019-04-15               Exoplanet Archive                                       TIC v8.1
Gaia              12.4691           0.002701          2019-04-15               Exoplanet Archive                                       TIC v8.1
u                 15.5591           0.00524192        2019-04-15               Exoplanet Archive                                       TIC v8.1
g                 14.8534           0.00474247        2019-04-15               Exoplanet Archive                                       TIC v8.1
r                 12.7897           0.00140267        2019-04-15               Exoplanet Archive                                       TIC v8.1
i                 14.172            0.00982709        2019-04-15               Exoplanet Archive                                       TIC v8.1
z                 12.8901           0.00516721        2019-04-15               Exoplanet Archive                                       TIC v8.1
J                 10.788            0.022             2019-04-15               Exoplanet Archive                                       TIC v8.1
H                 10.303            0.018             2019-04-15               Exoplanet Archive                                       TIC v8.1
K                 10.135            0.017             2019-04-15               Exoplanet Archive                                       TIC v8.1
WISE 3.4 micron   10.183            0.023             2019-04-15               Exoplanet Archive                                       TIC v8.1
WISE 4.6 micron   10.164            0.02              2019-04-15               Exoplanet Archive                                       TIC v8.1
WISE 12 micron    10.087            0.042             2019-04-15               Exoplanet Archive                                       TIC v8.1
WISE 22 micron    9.263             0.403             2019-04-15               Exoplanet Archive                                       TIC v8.1
`;

  return parseTicMeta(text);
}

function testParse_MissingDistance() {
  const text =`TIC ID 471012349

RA (J2015.5)                07:17:17.06  109.321084
Dec (J2015.5)               -05:01:03.14  -5.017538
Galactic Long               220.3546
Galactic Lat                3.433672
Ecliptic Long               111.7127
Ecliptic Lat                -27.01209
Proper Motion RA (mas/yr)   421.58 +/- 2
Proper Motion Dec (mas/yr)  -384.47 +/- 2
Star Name & Aliases         TIC 471012349, UCAC4 425-032175, 2MASS J07171706-0501031
Planet Name(s)              N/A
In CTL                      No
TIC Contamination Ratio
# of Contamination sources

STELLAR PARMAETERS (1)
Telescope                Instrument        Teff (K)              Teff (K) Error        log(g)                log(g) Error          Radius (R_Sun)        Radius (R_Sun) Error  logR'HK               logR'HK Error         S-index               S-index Error         H-alpha               H-alpha Error         Vsini                 Vsini Error           Rot Per               Rot Per Error         Metallicity           Metallicity Error     Mass (M_Sun)          Mass (M_Sun) Error    Density (g/cm^3)      Density (g/cm^3) Error   Luminosity            Luminosity Error      Observation Time (BJD)   RV (m/s)              RV Error              Distance (pc)         Distance (pc) Error   Date                  User                  Group             Tag               Notes
                                                                                        5.04755               0.165405              0.199                 0.014                                                                                                                                                                                                                                                                                         0.161                 0.014                 28.806159             6.079694                 0.002936437           0.0004131671                                                                                                                           2019-04-15            Exoplanet Archive                                         TIC v8.1

MAGNITUDES (5)
Band              Value             Error             Date                     User                Group             Tag               Notes
TESS              10.742            0.058             2019-04-15               Exoplanet Archive                                       TIC v8.1
V                 13.88             0.2               2019-04-15               Exoplanet Archive                                       TIC v8.1
J                 8.873             0.027             2019-04-15               Exoplanet Archive                                       TIC v8.1
H                 8.349             0.059             2019-04-15               Exoplanet Archive                                       TIC v8.1
K                 8.045             0.021             2019-04-15               Exoplanet Archive                                       TIC v8.1
`;

  return parseTicMeta(text);
}

function testParse_InCtlYes() {
  const text = `TIC ID 1045298

RA (J2015.5)                02:17:42.43  34.426805
Dec (J2015.5)               -08:16:39.24  -8.277568
Galactic Long               174.2242
Galactic Lat                -62.21487
Ecliptic Long               29.19137
Ecliptic Lat                -20.77078
Proper Motion RA (mas/yr)   16.6651 +/- 0.079471
Proper Motion Dec (mas/yr)  0.444636 +/- 0.070804
Star Name & Aliases         TIC 1045298, TYC 5281-00605-1, UCAC4 409-002694, 2MASS J02174241-0816391, SDSS DR9 1237652901299879979, WISE J021742.42-081639.2, APASS 2892889
Planet Name(s)              N/A
In CTL                      Yes
TIC Contamination Ratio     0.052629
# of Contamination sources  34

STELLAR PARMAETERS (1)
Telescope                Instrument        Teff (K)              Teff (K) Error        log(g)                log(g) Error          Radius (R_Sun)        Radius (R_Sun) Error  logR'HK               logR'HK Error         S-index               S-index Error         H-alpha               H-alpha Error         Vsini                 Vsini Error           Rot Per               Rot Per Error         Metallicity           Metallicity Error     Mass (M_Sun)          Mass (M_Sun) Error    Density (g/cm^3)      Density (g/cm^3) Error   Luminosity            Luminosity Error      Observation Time (BJD)   RV (m/s)              RV Error              Distance (pc)         Distance (pc) Error   Date                  User                  Group             Tag               Notes
                                            5744                  190.156               3.46601               0.0989994             3.10775               0.23299                                                                                                                                                                                                                                                                                       1.03                  0.139999              0.048386              0.013848                 9.472035              0.4924605                                                                                  582.416               12.8665               2019-04-15            Exoplanet Archive                                         TIC v8.1

MAGNITUDES (16)
Band              Value             Error             Date                     User                Group             Tag               Notes
TESS              10.686            0.0117            2019-04-15               Exoplanet Archive                                       TIC v8.1
B                 11.779            0.373             2019-04-15               Exoplanet Archive                                       TIC v8.1
V                 11.267            0.034             2019-04-15               Exoplanet Archive                                       TIC v8.1
Gaia              11.139            0.009647          2019-04-15               Exoplanet Archive                                       TIC v8.1
u                 15.3839           0.00990317        2019-04-15               Exoplanet Archive                                       TIC v8.1
g                 12.0219           0.00137183        2019-04-15               Exoplanet Archive                                       TIC v8.1
r                 11.3296           0.000939458       2019-04-15               Exoplanet Archive                                       TIC v8.1
i                 11.1998           0.0015448         2019-04-15               Exoplanet Archive                                       TIC v8.1
z                 11.8191           0.00349241        2019-04-15               Exoplanet Archive                                       TIC v8.1
J                 10.28             0.023             2019-04-15               Exoplanet Archive                                       TIC v8.1
H                 9.935             0.022             2019-04-15               Exoplanet Archive                                       TIC v8.1
K                 9.861             0.024             2019-04-15               Exoplanet Archive                                       TIC v8.1
WISE 3.4 micron   9.562             0.022             2019-04-15               Exoplanet Archive                                       TIC v8.1
WISE 4.6 micron   9.587             0.021             2019-04-15               Exoplanet Archive                                       TIC v8.1
WISE 12 micron    9.512             0.035             2019-04-15               Exoplanet Archive                                       TIC v8.1
WISE 22 micron    9.083             0.448             2019-04-15               Exoplanet Archive                                       TIC v8.1
`;
  return parseTicMeta(text);
}

console.log(testParse_InCtlYes());
