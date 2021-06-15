# Planet Hunters TESS New Eclipsing Binary Candidates - Pilot

## Summary

- Goal: produce a list of eclipsing binary candidates not in existing well known catalogs: [VSX](https://www.aavso.org/vsx/), [ASAS-SN](https://asas-sn.osu.edu/variables), [SIMBAD](http://simbad.u-strasbg.fr/simbad/), and [TESS Eclipsing Binary Data Validation](https://baas.aas.org/pub/2021n1i530p01)
- Based on a sample of 2000 subjects tagged with [#eclipisingbinary](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/tags/eclipsingbinary) in Planet Hunters TESS Talk across sectors 1 -26 (covering full sky), or 1448 unique TICs.
- Produced a list of **61** new eclipsing binary candidates.
- While there is no rigorous assessment of the accuracy of the tagging yet, there are reason to believe that they are quite accurate, upward about **94%** overall, **75%** among the new candidates.
  - the [list in csv](data_samples/pht_eb_candidates_from_samples.csv)
- If the work is expanded to all subjects across sectors 1 - 26, the list is estimated to have about **610** candidates.
- The 61 candidates are further vetted manually, 46 (75%) remain viable.
  - The accuracy drops off significantly for `N_eb_adj` = 2 (see Methodology section).
- Among the candidates, a few of them, e.g., TIC [388508344](https://exofop.ipac.caltech.edu/tess/target.php?id=388508344)  (Subject [48227275](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/48227275)), have only 1 eclipse observed. Such targets are much less likely to be detected by automated pipelines.
- If the work is expanded to cover entire primary mission (sectors 1 - 26), the result could potentially be used for
  - augment existing catalogs for, e.g., population-based studies.
  - feedback for automated pipeline / algorithms that could points to potential area of improvement.

## Methodology

The list of candidates is produced by the following method:

- Given the 2000 subjects, crawl their talk pages to count the number of eclipsing binary (and its variants) tags.
  - Transit-like tags are also counted as "opposition votes."
- Each subject is assigned with a *adjusted number of eclipsing binary tags*,  `N_eb_adj`: number of eclipsing binary tags minus transit-like tags.
- Group the subject by TICs.
  - If a TIC has multiple subjects, use the largest `N_eb_adj`
- 1448 unique TICs are produced from the 2000 subjects.
- It got filtered down to 773 TICs, by retaining only the TICs with `N_eb_adj` >= 2
  - The cutoff point is chosen after observing a approximation of accuracy, described later.
- For each TIC, match it against 4 catalogs (VSX, ASAS-SN and SIMBAD, TESS EB Data Validation) to filter out:
  - known eclipsing binaries
  - known stars that are most likely not eclipsing binaries (e.g., RR Lyrae, system with transiting planets, etc.)
  - In other words, retain those:
    - not listed in any of the 4 catalogs,
    - listed, but the classification in unrelated to eclipsing binary classification, e.g., High Proper Motion Star in SIMBAD.
- 61 TICs retained, producing the candidate list.
  - Note: initially, 67 TICs are retained, 6 of which are excluded.
    - It turns out there was some error in the initial PHT subject selection, 13 of which are from sectors 27 (extended mission).
    - As a result, 6 TICs that rely exclusively on those sector 27 subjects were excluded from the candidate list, to keep the study focused on primary mission data only.
- The 61 TICs are further inspected manually. 46 TICs are retained.
  - The retained TICs eclipsing binary candidates, contaminated by a nearby eclipsing binary, or a known one (confirmed by sources outside the catalogs matched).

- Note: the initial 2000 subjects are selected quasi-randomly. They are scraped from [#eclipisingbinary](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/tags/eclipsingbinary) in Planet Hunters TESS Talk. 200 pages are arbitrarily selected, with 10 subjects on each page.


## Tagging Accuracy

### Proxy Accuracy

While there is no formal assessment of the tagging accuracy (there is no definite answer that can be compared against), a proxy accuracy is produced
by considering only those listed in the catalogs, count those listed as eclipsing binary and those most likely not an eclipsing binary.

I group the TICs by `N_eb_adj`, and find at `N_eb_adj` = 2, the proxy accuracy is 93.6%. With `N_eb_adj` >= 2 (the cutoff point of the 61 TICs), the proxy accuracy is 96.6%.

One limitation of the proxy accuracy is that the TICs counted are biased (they are present in the catalog to begin with): it probably represents the best case accuracy, while the actual accuracy is probably lower.

In particular, for TICs not found TESS Eclipsing Binary Data Validation Report, it is treated as no data is found from matching perspective. However, given the report is specifically for TESS data set, the fact that a TIC is not found there could possibly mean it more less likely to be an eclipsing binary. (It is not definite no though: there are TICs not found in the report but is listed in other catalogs.)


The breakdown of the proxy accuracy:

![image](https://user-images.githubusercontent.com/250644/116791693-f5b0dd00-aa70-11eb-82a0-145a6aa608ee.png)

![image](https://user-images.githubusercontent.com/250644/116791661-cbf7b600-aa70-11eb-8f93-ae6474057569.png)


*Note:* Strictly speaking, the accuracy discussed here is concerned about false positives. False negatives are not considered.


### Manual Vetting

The 61 candidates are manually vetted, using the following data:

- lightcurve data (lightcurve and target pixel files)
- TCE vetting reports, if available.
- Comments from PHT volunteers about the subjects.

The primary goals are:

- weed out those that do not look like eclipsing binaries.
- identify those that are likely to be blended / contaminated: they are still retained, but are marked separately, with the potential contamination source identified.

After vetting, 46 TICs, or about 75%, remain viable. There is a significant dropoff in accuracy for those `N_eb_adj` = 2.

- those with `N_eb_adj` >= 3 : accuracy is 95.2%
- those with `N_eb_adj` = 2 : accuracy is 65.0%

The breakdown:
![image](https://user-images.githubusercontent.com/250644/122117298-8ce0b280-cddb-11eb-9ff1-281d7ef5eb65.png)


The details of individual vetting is available. See Data Section below.

## Top Candidates

The following are the top 9 candidates 9 with the `N_eb_adj` >= 5, with some notes after inspecting their lightcurves, stellar parameters (from ExoFOP), TCE validation reports (if available), and source target pixel files, for false positive possibilities (e.g., contamination). They all appear to be legitimate eclipsing binary candidates.


- TIC [233060434](https://exofop.ipac.caltech.edu/tess/target.php?id=233060434)  (Subject [48227121](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/48227121))
  - appears to be a system of a M-dwarf and a brown dwarf.

<br>![image](https://thumbnails.zooniverse.org/999x250/panoptes-uploads.zooniverse.org/subject_location/a53941ec-447a-4dea-b828-c027a118ef28.png)

---

- TIC [76073981](https://exofop.ipac.caltech.edu/tess/target.php?id=76073981)  (Subject [48934888](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/48934888))
  - probably an algol: a system of an F main sequence star and a M dwarf or brown dwarf.

<br>![image](https://thumbnails.zooniverse.org/999x250/panoptes-uploads.zooniverse.org/subject_location/f985b10e-69bf-4c69-860c-ad76f970d053.png)

---

- TIC [207385593](https://exofop.ipac.caltech.edu/tess/target.php?id=207385593)  (Subject [44564164](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/44564164))
  - appears to be a system of a M-dwarf and a brown dwarf.

<br>![image](https://thumbnails.zooniverse.org/999x250/panoptes-uploads.zooniverse.org/subject_location/69e527a9-3310-4271-ab55-6c0352115596.png)

---

- TIC [255921197](https://exofop.ipac.caltech.edu/tess/target.php?id=255921197)  (Subject [48948447](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/48948447))
  - possibly an algol: a system of an F main sequence star and a M dwarf or brown dwarf. Some additional high frequency (~0.05 day) oscillation.
  - No clear secondary eclipses. They could possibly be buried in the oscillation.

<br>![image](https://thumbnails.zooniverse.org/999x250/panoptes-uploads.zooniverse.org/subject_location/ec4b6f0b-d1b9-4281-ae50-b17f7c810a1e.png)

---

- TIC [388508344](https://exofop.ipac.caltech.edu/tess/target.php?id=388508344)  (Subject [48227275](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/48227275))
  - only a single eclipse was observed. But all point to it to be an eclipsing binary.
  - a system of an A main sequence star and a brown dwarf or M dwarf
  - observed only a single deep dip across 3 continuous sectors (24, 25, 26).
  - A rough estimate on the period placed it larger than 100 days, consistent with the observation.

<br>![image](https://thumbnails.zooniverse.org/999x250/panoptes-uploads.zooniverse.org/subject_location/fb154111-23fb-4a65-a035-3e36fe8c4701.png)

---

- TIC [423027012](https://exofop.ipac.caltech.edu/tess/target.php?id=423027012)  (Subject [48942511](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/48942511))
  - probably an algol: A system of an F main sequence star and a brown dwarf or M dwarf

<br>![image](https://thumbnails.zooniverse.org/999x250/panoptes-uploads.zooniverse.org/subject_location/9abe7bf3-6277-4767-b4bf-6a07c1dcc29c.png)

---

- TIC [468276605](https://exofop.ipac.caltech.edu/tess/target.php?id=468276605)  (Subject [48224154](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/48224154))
  - appears to be a system of a G main sequence star and a M dwarf or brown dwarf.
  - appears to have some (tiny) flares as well.

<br>![image](https://thumbnails.zooniverse.org/999x250/panoptes-uploads.zooniverse.org/subject_location/c041e987-f9f9-41f9-ad4e-e1f4720486ee.png)

---

- TIC [342061072](https://exofop.ipac.caltech.edu/tess/target.php?id=342061072)  (Subject [48943266](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/48943266))
  - appears to be a system of a K main sequence star and a brown dwarf of M dwarf.

<br>![image](https://thumbnails.zooniverse.org/999x250/panoptes-uploads.zooniverse.org/subject_location/71401b42-8ce7-42a3-b58c-007f940582aa.png)

---

- TIC [178171080](https://exofop.ipac.caltech.edu/tess/target.php?id=178171080)  (Subject [29666960](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/29666960) + 2 others)
  - appears to be a system of B main sequence star and a brown dwarf or M dwarf.
  - Cannot spot secondary eclipses though all other data point it to be an eclipsing binary.

<br>![image](https://thumbnails.zooniverse.org/999x250/panoptes-uploads.zooniverse.org/subject_location/17f06d2a-48f7-4256-b995-5b93b3bd6fa9.png)

---

### Single Eclipse Candidates

4 candidates have only 1 eclipse observed. They are noted  as single eclipse candidates.

For example, TIC [388508344](https://exofop.ipac.caltech.edu/tess/target.php?id=388508344)  (Subject [48227275](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/subjects/48227275)), is special in that only one eclipses was observed. It is likely to be a long period eclipsing binary (with a period longer than 100 days). Targets similar to this one are likely to fall through the crack of typical automated pipelines to identify eclipsing binaries.


## Future Work and Ideas

- Expand to cover all targets from sectors 1 - 26 (the TESS prime mission) if the pilot is deemed viable and useful.
- The candidate list's accuracy is so so (75%). However,
  - those with `N_eb_adj` >= 3 is quite accurate. The downside is they only account for about 33% of the candidates (21 out of 61).
  - those with `N_eb_adj` =2's accuracy is so-so (65%). There are possibilities to weed some of them out automatically.
- One area could be reducing false positives.
  - possibly some other tags might indicate false positives (in addition to transit-like ones), e.g., tags for pulsators, `#contaminated`, etc.
  - Identify those that are likely to be contaminated by / blended with a nearby eclipsing binary.
    - E.g., infer the companion object's approximate radius and flag those that are too small
    - the radius can be inferred from the dips' approximate depth, which could plausibly obtained from some of the following sources.
      - [TCEs](https://exo.mast.stsci.edu/): some of the candidates are flagged by the exoplanet finding pipeline, which can provide information on the identified periodic dips.
      - [Planet Hunters Analysis Database](https://mast.stsci.edu/phad/about.html): contains the dips identified by Planet Hunters TESS volunteers.
      - Standard periodicity finding algorithms, e.g., Box Least Squares, Lomb-Scargle , etc.


## Data

- The candidate list is available in :  [csv](data_samples/pht_eb_candidates_from_samples.csv), [google sheet](https://docs.google.com/spreadsheets/d/1np63ehIBzJirj0byuZv8_7qW5e4JAM9XvAxB5UPoAi0/edit?usp=sharing)

- Manual vetting
  - the [candidate list google sheet](https://docs.google.com/spreadsheets/d/1np63ehIBzJirj0byuZv8_7qW5e4JAM9XvAxB5UPoAi0/edit?usp=sharing) also include manual vetting result.
  - Reports of individual candidates can be found in [vetting_samples folder](vetting_samples/)

- This [google sheet](https://docs.google.com/spreadsheets/d/18wDmfVStrwNpAf-6RDzmYPUzVSEkG3zMbzZKFuYQ2Ss/edit?usp=sharing) contains data of all the TICs before data reduction is done to create the candidate list.

## Credits

- [Planet Hunters TESS](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/) volunteers
- The 4 catalogs used: [VSX](https://www.aavso.org/vsx/), [ASAS-SN](https://asas-sn.osu.edu/variables), [SIMBAD](http://simbad.u-strasbg.fr/simbad/), [TESS Eclipsing Binary Data Validation](https://baas.aas.org/pub/2021n1i530p01)
- Accessing VSX is done by using [astroquery](https://astroquery.readthedocs.io/) package via [Vizier](https://vizier.u-strasbg.fr/).
- Stellar parameters from [ExoFOP TESS](https://exofop.ipac.caltech.edu/tess/)
- TCE Validation reports from [ExoMAST](https://exo.mast.stsci.edu/)
- Light Curves and Target Pixel Files from [MAST](https://mast.stsci.edu/).
  - Accessing and visualizing them by using [lightkurve](http://docs.lightkurve.org/) package

## Appendix

Distribution of the eclipsing binary candidates:

![image](https://user-images.githubusercontent.com/250644/116791757-4de7df00-aa71-11eb-86d5-c6ef455f8ee3.png)

