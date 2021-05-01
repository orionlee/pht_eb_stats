// Helpers to publish a list of TIC / Subject in markdown

function splitLines(text) {
  return text.split('\n');
}

//Top 9 candidates not found in other catalogs

subjects = splitLines(`48227121
48934888
44564164
48948447
48227275
48942511
48224154
48943266
30253517`)
;

tics = splitLines(`233060434
76073981
207385593
255921197
388508344
423027012
468276605
342061072
178171080`);

// image thumbnail of the subject
imgIds = splitLines(`a53941ec-447a-4dea-b828-c027a118ef28
f985b10e-69bf-4c69-860c-ad76f970d053
69e527a9-3310-4271-ab55-6c0352115596
ec4b6f0b-d1b9-4281-ae50-b17f7c810a1e
fb154111-23fb-4a65-a035-3e36fe8c4701
9abe7bf3-6277-4767-b4bf-6a07c1dcc29c
c041e987-f9f9-41f9-ad4e-e1f4720486ee
71401b42-8ce7-42a3-b58c-007f940582aa
fd79206f-6612-43cb-bce8-6694b0c969f1`);

function to_md(subject, tic, imgId) {
  return `\
- TIC [${tic}](https://exofop.ipac.caltech.edu/tess/target.php?id=${tic})  (Subject [${subject}](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/${subject}))

<br>![image](https://thumbnails.zooniverse.org/999x250/panoptes-uploads.zooniverse.org/subject_location/${imgId}.png)

---

`;
}

function all_to_md() {
  let res = '';
  for(let i = 0; i < subjects.length; i++) {
    res += to_md(subjects[i], tics[i], imgIds[i]);

  }
  return res;
}

console.log(all_to_md())
