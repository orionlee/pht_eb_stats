DEBUG = true;

function dbg(...args) {
  if (DEBUG) { console.debug('[DBG] '.concat(args)); }
}

async function fetchJson(url) {
  const resp = await fetch(url, {
    headers: {
      accept: 'application/vnd.api+json; version=1',
      'content-type': 'application/json',
    },
 }); // the headers are needed for subject metadata call
  dbg('fetching: ', url);
  const json = await resp.json();
  return json;
}

async function getSubjectIdsOfTags(tag, page) {
  const url = `https://talk.zooniverse.org/tags/popular?http_cache=true&taggable_type=Subject&section=project-7929&name=${tag}&page=${page}`;
  const respJson = await fetchJson(url);
  //  meta.popular.page_count has the list of pages
  return Array.from(respJson.popular, e => e.taggable_id);
}

function toSubjectUrl(subjectId) {
  return `https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/${subjectId}`;
}

async function getCommentsOfSubject(subjectId) {
  async function getCommentPageOfSubject(subjectId, page) {
    const url = `https://talk.zooniverse.org/comments?http_cache=true&section=project-7929&focus_type=Subject&sort=-created_at&focus_id=${subjectId}&page=${page}`;
    return await fetchJson(url);
  }

  const commentsPage = await getCommentPageOfSubject(subjectId, 1);
  const comments = commentsPage.comments;
  const numPages = commentsPage.meta.comments.page_count;
  dbg('#pages for subject: ', numPages);

  // load subsequent pages
  for(let page = 2; page <= numPages; page++) {
    const curCommentsPage = await getCommentPageOfSubject(subjectId, page);
    comments.push(...curCommentsPage.comments);
  }

  return comments;
}


//@export
function ebAndTransitSynonym(tag) {
  // TODO: consider to add  #binary
  if (['#eclipsingbinary', '#eclipsing-binary', '#eb', '#eccentric-eb'].includes(tag)) {
    return 'like#eclipsingbinary';
  }

  // TODO: consider to add  #planet, #planets, #confirmedplanet, #confirmed
  if (['#transit', '#transits', '#possible', '#possibletransit', '#possible_transit', '#possible-transit', '#possibletransits', '#candidate'].includes(tag)) {
    return 'like#transit';
  }

  return tag;
}


async function getMetaOfSubject(subjectId) {
  const url = `https://www.zooniverse.org/api/subjects/${subjectId}?http_cache=true`; // the ZN UI also includes parameter '&include=project', but we don't need it
  const respJson = await fetchJson(url);
  // respJson.subjects[0].locations  - contains the image / data URL of the subject rendered.
  return respJson.subjects[0].metadata;
}

function toMetaCSV(meta, prefix='', sep='|') {
  // TODO: handle case that TIC ID is not present (avoid output undefined)
  return `${prefix}${meta['!TIC ID']}${sep}${meta['Sector']}`;
}

//@export
async function getTagStatsOfSubject(subjectId, tagMapFn = ebAndTransitSynonym) {
  const comments = await getCommentsOfSubject(subjectId);
  const userTagsMap = {};
  const commentsTags = []; // keep the tags of each individual comments;
  comments.forEach(cmt => {
    // userTags: the set of tags the user has used for the suibject
    const userTags = (() => {
      let res = userTagsMap[cmt.user_login];
      if (!res) {
        res = new Set();
        userTagsMap[cmt.user_login] = res;
      }
      return res;
    })();

    for (let tag in cmt.tagging) {
      // add tag, also add the canonical form, indicated by tagMapFn, if any
      userTags.add(tag);
      if (tagMapFn) {
        tag = tagMapFn(tag);
        userTags.add(tag);
      }
    }
  });
  // comments.map(cmt => cmt.body) // the actual comments bodies.

  const tagCounts = {};
  for (const userTags of Object.values(userTagsMap)) {
    for (const tag of userTags.values()) {
      const curVal = tagCounts[tag] || 0;
      tagCounts[tag] = curVal + 1;
    }
  }

  dbg(`${subjectId}: \t${JSON.stringify(tagCounts)}`);
  return {
    subjectId,
    tagCounts,
    numComments: comments.length,
    comments, // also return comments in case callers need to summarize them differently
  };
}

// TODO:
// combine getTagStatsOfSubject() and getMetaOfSubject() into one function
//

//@export
async function getTagStatsOfPages(tag, pageNums, tagMapFn = ebAndTransitSynonym) {
  const res = [];
  for (const page of pageNums) {
    const subjectIds = await getSubjectIdsOfTags(tag, page);
    for (const subjectId of subjectIds) {
      const subjectTagStats = await getTagStatsOfSubject(subjectId, tagMapFn);
      res.push(subjectTagStats);
    }
  }
  return res;
}


//@export
function ranges(...boundaries) {
  // OPEN: change to a generator
  function range(start, endExclusive) {
    const size = endExclusive - start;
    return [...Array(size).keys()].map(i => i + start);
  }

  if (boundaries.length < 1 || boundaries.length % 2 != 0) {
    throw new Error('ranges(): the boundaries arguments must be in start - end-exclusive pairs');
  }
  const res = [];
  for(let i = 0; i < boundaries.length; i += 2) {
    const start = boundaries[i];
    const endExclusive = boundaries[i+1];
    res.push(...range(start, endExclusive));
  }
  return res;
}

//@export
function toEbAndTransitSummaryCSV(subjectTagStatsList, sep = '|') {
  function count(map, tag) {
    return map[tag] || 0;
  }

  // TODO: include TIC / Sector in output too

  let res = `Subject_ID${sep}eb_like_count${sep}transit_like_count${sep}comment_count${sep}tag_count_json\n`;
  for (const subjectTagStats of subjectTagStatsList) {
    const tagCounts = subjectTagStats.tagCounts;
    const ebLikeCount = count(tagCounts, 'like#eclipsingbinary');
    const transitLikeCount = count(tagCounts, 'like#transit');
    const tagCountsJSON = JSON.stringify(tagCounts);

    res += `${subjectTagStats.subjectId}${sep}${ebLikeCount}${sep}${transitLikeCount}${sep}${subjectTagStats.numComments}${sep}${tagCountsJSON}\n`;
  }

  return res;
}



// Usage example
if (false) {
  curRange = ranges(11, 31,  311, 331,   511, 531,  711, 731,  911, 931,
                    1111, 1131,  1311, 1331,  1511, 1531,  1711, 1731,  1911, 1931);
  statsOfPages = await getTagStatsOfPages('eclipsingbinary', curRange);
  csvSummary = toEbAndTransitSummaryCSV(statsOfPages);
  console.log('Tag Summary completes');
  // JSON.stringify(statsOfPages, null, 2)
}

async function printSubjectTICs(subjectIds) {
  let metaList = []
  let csv = '';
  for (const subjectId of subjectIds) {
    meta = await getMetaOfSubject(subjectId);
    const row = toMetaCSV(meta, `${subjectId}|`);
    dbg(row);
    csv += `${row}\n`;
    metaList.push(meta)
  }
  return {metaList, csv};
}

if (false) {
  subjectIds = [31326490, 36977584];
  csv = await printSubjectTICs(subjectIds);
}
