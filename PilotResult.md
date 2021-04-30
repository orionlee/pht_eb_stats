# Planet Hunters TESS New Eclipsing Binary Candidates - Pilot

## Summary

- Goal: produce a list of eclipsing binary candidates not in existing well known catalogs: [VSX](https://www.aavso.org/vsx/), [ASAS-SN](https://asas-sn.osu.edu/variables), and [SIMBAD](http://simbad.u-strasbg.fr/simbad/).
- Based on a sample of 2000 subjects tagged with [#eclipisingbinary](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/talk/tags/eclipsingbinary) in Planet Hunters TESS Talk across sectors 1 -26 (covering full sky), or 1448 unique TICs.
- Produced a list of **210** new eclipsing binary candidates.
- While there is no rigorous assessment of the accuracy of the tagging yet, there are reason to believe that they are quite accurate, upward about **90%** in the candidate list.
  - i.e, the list of 210 candidates is expected to have upward **191** real eclipsing binaries.
  - TODO: link to the list
- If the work is expanded to all subjects across sectors 1 - 26, the list is estimated to have about 1900 candidates.


## Methodology

The list of 210 candidates is produced by the following method:

- Given the 2000 subjects, crawl their talk pages to count the number of eclipsing binary (and its variants) tags.
  - Transit-like tags are also counted as "opposition votes."
- Each subject is assigned with a *adjusted number of eclipsing binary tags*,  `N_eb_adj`
- Group the subject by TICs.
  - If a TIC has multiple subjects, use the largest `N_eb_adj`
- 1448 unique TICs are produced from the 2000 subjects.
- It got filtered down to 773 TICs, by retaining only the TICs with `N_eb_adj` >= 2
  - The cutoff point is chosen after observing a approximation of accuracy, described later.
- For each TIC, match it against 3 catalogs (VSX, ASAS-SN and SIMBAD) to filter out:
  - known eclipsing binaries
  - known stars that are most likely not eclipsing binaries (e.g., RR Lyrae, system with transiting planets, etc.)
  - In other words, retain those:
    - not listed in any of th3 3 catalogs,
    - listed, but the classification in unrelated to eclipsing binary classification, e.g., High Proper Motion Star in SIMBAD.
- 210 TICs retained, producing the candidate list.
  - Upward 191 real eclipsing binaries are expected, based on a proxy of tagging accuracy of 91.1% (see below).


## Tagging Accuracy

### Proxy Accuracy

While there is no formal assessment of the tagging accuracy (there is no definite answer that can be compared against), a proxy accuracy is produced
by considering only those listed in the catalogs, count those listed as eclipsing binary and those most likely not an eclipsing binary.

I group the TICs by `N_eb_adj`, and find at `N_eb_adj` = 2, the proxy accuracy is 85.8%. With `N_eb_adj` >= 2 (the cutoff point of the 210 TICs), the proxy accuracy is 91.1%.

One limitation of the proxy accuracy is that the TICs counted are biased (they are present in the catalog to begin with): it probably represents the best case accuracy, while the actual accuracy is probably lower.

The breakdown of the proxy accuracy:

![image](https://user-images.githubusercontent.com/250644/116738216-0268fe80-a9a7-11eb-9805-a50886de5872.png)

![image](https://user-images.githubusercontent.com/250644/116738359-304e4300-a9a7-11eb-9d1c-c0bcf7a696bc.png)


### Manual Vetting

I have manually scrutinized about 20 subjects, and report that the majority of them do look like eclipsing binary.
While I am not expert in classifying eclipsing binary, I feel the scrutiny provide some assurance that the proxy accuracy reported above is not way off the actual one.


## Data

- TODO: link to the list, scripts, etc.

## Credits

- [Planet Hunters TESS](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess/) volunteers
- The 3 catalogs used: [VSX](https://www.aavso.org/vsx/), [ASAS-SN](https://asas-sn.osu.edu/variables), and [SIMBAD](http://simbad.u-strasbg.fr/simbad/).
- Accessing VSX is done by using [astroquery](https://astroquery.readthedocs.io/) package via [Vizier](https://vizier.u-strasbg.fr/).
