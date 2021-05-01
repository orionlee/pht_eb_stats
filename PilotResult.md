# Planet Hunters TESS New Eclipsing Binary Candidates - Pilot

## Summary

- Goal: produce a list of eclipsing binary candidates not in existing well known catalogs: [VSX](https://www.aavso.org/vsx/), [ASAS-SN](https://asas-sn.osu.edu/variables), [SIMBAD](http://simbad.u-strasbg.fr/simbad/), and [TESS Eclipsing Binary Data Validation](https://baas.aas.org/pub/2021n1i530p01)
- Based on a sample of 2000 subjects tagged with [#eclipisingbinary](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/tags/eclipsingbinary) in Planet Hunters TESS Talk across sectors 1 -26 (covering full sky), or 1448 unique TICs.
- Produced a list of **67** new eclipsing binary candidates.
- While there is no rigorous assessment of the accuracy of the tagging yet, there are reason to believe that they are quite accurate, upward about **96%** in the candidate list.
  - i.e, the list of 67 candidates is expected to have upward **65** real eclipsing binaries.
  - the [list in csv](data_samples/pht_eb_candidates_from_samples.csv)
- If the work is expanded to all subjects across sectors 1 - 26, the list is estimated to have about 1900 candidates.


## Methodology

The list of 67 candidates is produced by the following method:

- Given the 2000 subjects, crawl their talk pages to count the number of eclipsing binary (and its variants) tags.
  - Transit-like tags are also counted as "opposition votes."
- Each subject is assigned with a *adjusted number of eclipsing binary tags*,  `N_eb_adj`
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
- 67 TICs retained, producing the candidate list.
  - Upward 65 real eclipsing binaries are expected, based on a proxy of tagging accuracy of 96.6% (see below).


## Tagging Accuracy

### Proxy Accuracy

While there is no formal assessment of the tagging accuracy (there is no definite answer that can be compared against), a proxy accuracy is produced
by considering only those listed in the catalogs, count those listed as eclipsing binary and those most likely not an eclipsing binary.

I group the TICs by `N_eb_adj`, and find at `N_eb_adj` = 2, the proxy accuracy is 93.6%. With `N_eb_adj` >= 2 (the cutoff point of the 67 TICs), the proxy accuracy is 96.6%.

One limitation of the proxy accuracy is that the TICs counted are biased (they are present in the catalog to begin with): it probably represents the best case accuracy, while the actual accuracy is probably lower.

In particular, for TICs not found TESS Eclipsing Binary Data Validation Report, it is treated as no data is found from matching perspective. However, given the report is specifically for TESS data set, the fact that a TIC is not found there could possibly mean it more less likely to be an eclipsing binary. (It is not definite no though: there are TICs not found in the report but is listed in other catalogs.)


The breakdown of the proxy accuracy:

![image](https://user-images.githubusercontent.com/250644/116791693-f5b0dd00-aa70-11eb-82a0-145a6aa608ee.png)

![image](https://user-images.githubusercontent.com/250644/116791661-cbf7b600-aa70-11eb-8f93-ae6474057569.png)


### Manual Vetting

I have manually scrutinized about 20 subjects, and report that the majority of them do look like eclipsing binary.
While I am not expert in classifying eclipsing binary, I feel the scrutiny provide some assurance that the proxy accuracy reported above is not way off the actual one.


## Data

- The candidate list is available in :  [csv](data_samples/pht_eb_candidates_from_samples.csv), [google sheet](https://docs.google.com/spreadsheets/d/1np63ehIBzJirj0byuZv8_7qW5e4JAM9XvAxB5UPoAi0/edit?usp=sharing)

- This [google sheet](https://docs.google.com/spreadsheets/d/18wDmfVStrwNpAf-6RDzmYPUzVSEkG3zMbzZKFuYQ2Ss/edit?usp=sharing) contains data of all the TICs before data reduction is done to create the sample list.

## Credits

- [Planet Hunters TESS](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/) volunteers
- The 4 catalogs used: [VSX](https://www.aavso.org/vsx/), [ASAS-SN](https://asas-sn.osu.edu/variables), [SIMBAD](http://simbad.u-strasbg.fr/simbad/), [TESS Eclipsing Binary Data Validation](https://baas.aas.org/pub/2021n1i530p01)
- Accessing VSX is done by using [astroquery](https://astroquery.readthedocs.io/) package via [Vizier](https://vizier.u-strasbg.fr/).

## Appendix

Distribution of the eclipsing binary candidates:

![image](https://user-images.githubusercontent.com/250644/116791757-4de7df00-aa71-11eb-86d5-c6ef455f8ee3.png)

