//
// ASAS-SN variables: https://asas-sn.osu.edu/variables
// - must run the script from the site

// @exports
async function getAsasSnMetaOfCoord(idMeta) {
  if (!idMeta.ra || !idMeta.dec) {
    throw new Error(`getAsasSnMetaOfCoord() 'ra' and 'dec' are both required: (${idMeta.ra}, ${idMeta.dec})`);
  }
  const url = `https://asas-sn.osu.edu/variables?ra=${idMeta.ra}&dec=${idMeta.dec}&radius=2\
&vmag_min=&vmag_max=&amplitude_min=&amplitude_max=&period_min=&period_max=&lksl_min=&lksl_max=&class_prob_min=&class_prob_max=&parallax_over_err_min=&parallax_over_err_max=&name=&references[]=I&references[]=II&references[]=III&references[]=IV&references[]=V&references[]=VI&sort_by=distance&sort_order=asc&show_non_periodic=true&show_without_class=true&asassn_discov_only=false&`;

  // OPEN: consider getting csv export instead of scarping the HTML.
  // it has the advantage of having more data, in particular classification probability
  // but it requires a few http calls to complete, and seems to be slower (and possibly less prepared for bulk calls)

  const resp = await fetch(url);
  const text = await resp.text();
  const doc = new DOMParser().parseFromString(text, 'text/html');

  let textToSave = '';
  let meta = parseAsasSnMeta(doc);
  if (meta == null) {
    console.warn(`Parsing ASAS-SN result failed. tic: ${idMeta.tic} . text starts with:`, text.substring(0, 100).replace(/\n/g, ' {\\n} '));
    meta = {};
  }
  meta.tic = idMeta.tic;

  // hack: get the relevant html section out to be saved separately
  // it's not really part of the meta
  textToSave = meta.resHtml;
  delete meta.resHtml;

  return {meta, text: textToSave};
}

function parseAsasSnMeta(doc) {
  // hack: not really part of the meta, but used to return the portion of raw html relevant to search result
  const resHtml = (doc.querySelector('.table-panel') || {outerHTML: ''}).outerHTML;

  // more specific would be #variables-stars-db-search ~ .table-panel, but seems to be unnecessary
  const resTr = doc.querySelector('.table-panel table > tbody > tr');
  if (!resTr) {
    return {resHtml};
  }

  function getTd(fieldIdx) {
    return resTr.querySelector(`td:nth-of-type(${fieldIdx})`);
  }

  function get(fieldIdx) {
    return getTd(fieldIdx).textContent;
  }

  function getFloat(fieldIdx) {
    return parseFloat(get(fieldIdx));
  }

  function getPeriod() {
    let periodFloat = getFloat(8);
    if (isNaN(periodFloat)) { // case the cell is "NON PERIODIC"
      periodFloat = -1;
    }
    return periodFloat;
  }

  const id = get(1);
  // get the Uuid that can construct the URL for the id's detail  page
  // in the form of /variables/{idUuid}
  // The URL might only be valid for a short time (unclear), but I am extracting it for just in case
  const idUuid = (getTd(1).querySelector('a') || {href: ''}).href.replace(/^.*[/]variables[/]/, '');
  const type = get(9);
  const period = getPeriod();
  const magV = getFloat(6);
  const angularDistance = getFloat(5);

  return { id, type, period, magV, angularDistance, idUuid, resHtml };
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

// @generic
function joinTextList(textList, metaList, sep='------') {
  // In the form of
  // ------ TIC <tic number>
  // <actual text>
  // so that one can search the resulting text file for a given TIC more easily
  let  res = ''
  for(let i=0; i < textList.length; i++) {
    const text = textList[i];
    const tic = metaList[i].tic;
    res += `\n${sep} TIC ${tic}\n`;
    res += text;
  }
  res += '\n'; // in case the output does not end with an enter, gives it out
  return res;
}

function toAsasSnMetaCSV(metaList, sep='|') {
  return toCSV(metaList, ['tic', 'id', 'type', 'period', 'magV', 'angularDistance', 'idUuid'], sep);
}

//
// END Result Output helpers

//@generic
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
idMeta = { tic: '249943198', ra: '38.798798', dec: '49.860304' };
_res = await getAsasSnMetaOfCoord(idMeta);
*/
idMetaText = `878056|123.973843|-15.934388
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
  ids = parseTicMetaCSV(idMetaText);
  [metaList, textList] = await runAndSaveInMemory(getAsasSnMetaOfCoord, ids);
  toAsasSnMetaCSV(metaList);
  joinTextList(textList, metaList);
}
