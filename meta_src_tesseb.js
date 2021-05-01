// TESS EB portal
// http://tessebs.villanova.edu/
// https://baas.aas.org/pub/2021n1i530p01/

//
// Unlike other meta_ script, this one crawls all TICs from TESS EB portal,
// rather than trying to see if a particular TIC exists in the portal
// It's more convenient to do matching afterwards locally.
//

// @generic
async function fetchText(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    const err = new Error(`HTTP Error: ${resp.status} ${resp.statusText}`);
    err.url = url;
    err.status = resp.status;
    err.statusText = resp.statusText;
    throw err;
  }
  return resp.text();
}



// @exports
async function getTICsOfPage(page) {
  const url = `http://tessebs.villanova.edu/?page=${page}&order_by=tic__tess_id&order=asc`;

  const text = await fetchText(url);
  const doc = new DOMParser().parseFromString(text, 'text/html');

  const tics = Array.from(doc.querySelectorAll('table tbody tr td:nth-of-type(2)'),
    td => td.textContent.replace(/^0+/, ''));

  return tics;
}

// @exports
async function getAllTICs(pageStart, pageEnd) {
  const res = []
  for (page = pageStart; page < pageEnd; page++) {
    console.debug(`Page ${page}`)
    res.push(...await getTICsOfPage(page));
  }
  return res;
}


//@generic
function parseTicsCSV(text) {
  return text.split('\n').filter(text => text != null && text.length > 0);
}

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

// END

//
// Top level
//

allTICs = await getAllTICs(1, 41) // there are 40 pages at the time of crawling
console.log(allTICs.join('\n'))  // to be saved in a text file for later use

sampleTICsText = `TO-FILL`; // from tic_samples.txt
sampleTICs = parseTicsCSV(sampleTICsText);

function matchTICs(samples, all) {
  const allInSet = new Set(all);
  return samples.map(tic => ({tic: tic, inTessEB: allInSet.has(tic)}));
}

metaList = matchTICs(sampleTICs, allTICs);
console.log(toCSV(metaList, ['tic', 'inTessEB'], '|'))
