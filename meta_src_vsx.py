#%%

import numpy as np
from astropy.coordinates import SkyCoord
import astropy.units as u
from astroquery.vizier import Vizier

from io import StringIO


def _parse_vsx_result(sr):
    if len(sr) < 1:
      return None
    tab = sr[0]
    if len(tab) < 1:
      return None

    row = tab[0]
    if row['f_min'] == '(':  # the recorded min/max actually means magnitude / amplitude
      mag = row['max']
      amplitude = row['min']
      is_amplitude_in_vsx = True
    else:
      amplitude = (row['min'] - row['max']) / 2
      mag = row['max'] - amplitude
      is_amplitude_in_vsx = False  # the mag / amplitude we return is a simple derivation from the min max in record


    return dict(id=row['OID'], type=row['Type'],
      period=row['Period'], epoch_hjd=row['_tab1_15'],
      mag=mag, amplitude=amplitude,
      is_amplitude_in_vsx=is_amplitude_in_vsx,
      mag_band=row['n_max'],  # here we assume the passband for min, n_min, is the same
      angular_distance=row['_r'],
      name_other=row['Name'])

# OPEN: ways to reduce number of calls to server
# 1. bulk queries (searching against a set of coordinates)
# https://astroquery.readthedocs.io/en/latest/vizier/vizier.html#query-with-table
# 2. search against multiple catalog (catalog argument can be a list)
# - ASAS/SN is also there ('II/366/catalog')
def get_vsx_meta_of_coord(id_meta):
    ra_deg, dec_deg = id_meta['ra'], id_meta['dec']
    vizier_catalog = 'B/vsx/vsx'
    radius_arcsec=120
    sc = SkyCoord(ra_deg, dec_deg, frame='icrs', unit='deg')
    #
    radius = radius_arcsec * u.arcsec
    v = Vizier(columns=["**", "+_r"], catalog=vizier_catalog)
    #     all columns ---^     ^---> add column for (increasing) angular
    #                                separation
    # N.B.: "*" <--- a *single* asterisk in the first argument gets only the
    # *default* columns
    v.ROW_LIMIT = -1  # no row limit

    sr = v.query_region(sc, radius=radius)
    res = _parse_vsx_result(sr)
    if res is None:
      res = {}

    res['tic'] = id_meta['tic']
    #  res['_sr'] = sr  # for debug purposes

    # store entire result too
    text = ''
    if len(sr) > 0:
      with StringIO() as output:
        sr[0].write(output, format='ascii.csv')
        text = output.getvalue().replace('\r', '')  # if the writer outputs \n\r, we retain only \n for simplicity

    return dict(meta=res, text=text)


# Test

# sr = get_vsx_meta_of_coord({'tic': 627436, 'ra': 73.047325, 'dec': -25.19406})
# sr

#%%

import csv

def res_to_csv(res):
  fieldnames = ['tic', 'id', 'type', 'period', 'epoch_hjd', 'mag', 'amplitude', 'is_amplitude_in_vsx', 'mag_band', 'angular_distance', 'name_other']
  with StringIO() as output:
    writer = csv.DictWriter(output, fieldnames=fieldnames, delimiter='|', extrasaction='ignore')
    writer.writerow(res)
    return output.getvalue().rstrip()  # remove trailing newlines, let the caller add it if needed


from astropy.table import Table
from astropy.io import ascii

# read the list of tic  / coordiantes
def read_tic_coordinate_csv():
  tic_meta_tab = ascii.read('data_samples/exofop_meta_samples.csv',
      format='no_header', delimiter='|',
      # names={'tic', 'ra', 'dec'}
      )
  # we only care about the first 3 columns
  tic_meta_tab.rename_column('col1', 'tic')
  tic_meta_tab.rename_column('col2', 'ra')
  tic_meta_tab.rename_column('col3', 'dec')
  return tic_meta_tab

tic_meta_tab = read_tic_coordinate_csv()
# tic_meta_tab = tic_meta_tab[:100] # only read a small samples

with open('data_samples/vsx_meta_samples.csv', 'w') as meta_w, open('data_samples/vsx_text_samples.txt', 'w') as text_w:
  for id_meta in tic_meta_tab:
    print(f"TIC {id_meta['tic']}") # debug, show of status
    sr = get_vsx_meta_of_coord(id_meta)
    meta_w.write(res_to_csv(sr['meta']))
    meta_w.write('\n')

    text_w.write(f"\n------ TIC {sr['meta']['tic']}\n")
    text_w.write(sr['text'])
print('Done')

#%%

