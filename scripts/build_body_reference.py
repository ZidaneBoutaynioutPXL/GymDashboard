"""Build a compact DXA body-fat reference from NHANES 2017–2018 data.

Input XPT files are the CDC DEMO_J, BMX_J and DXX_J datasets in tmp/.
Uses NHANES MEC examination weights for weighted quantiles. This is a
descriptive reference, not a clinical assessment.
"""

import json
from pathlib import Path

import pandas as pd

AGE_BANDS = [(18, 24), (25, 34), (35, 44), (45, 54), (55, 59)]


def age_band(age: float) -> str | None:
    for low, high in AGE_BANDS:
        if low <= age <= high:
            return f'{low}-{high}'
    return None


def weighted_quantiles(frame: pd.DataFrame) -> list[float]:
    frame = frame.sort_values('DXDTOPF')
    values = frame.DXDTOPF.to_numpy()
    weights = frame.WTMEC2YR.to_numpy()
    cumulative = weights.cumsum() / weights.sum()
    return [round(float(values[cumulative.searchsorted(p / 20, side='left').clip(0, len(values)-1)]), 1) for p in range(21)]


def main() -> None:
    demo = pd.read_sas('tmp/DEMO_J.XPT')[['SEQN', 'RIDAGEYR', 'RIAGENDR', 'WTMEC2YR']]
    body = pd.read_sas('tmp/BMX_J.XPT')[['SEQN', 'BMXWT']]
    dxa = pd.read_sas('tmp/DXX_J.XPT')[['SEQN', 'DXDTOPF']]
    joined = demo.merge(body, on='SEQN').merge(dxa, on='SEQN')
    joined = joined.dropna(subset=['RIDAGEYR', 'RIAGENDR', 'WTMEC2YR', 'BMXWT', 'DXDTOPF'])
    joined = joined[(joined.WTMEC2YR > 0) & (joined.BMXWT >= 40) & (joined.BMXWT < 200) & (joined.DXDTOPF > 0)]
    joined['ageBand'] = joined.RIDAGEYR.map(age_band)
    joined = joined.dropna(subset=['ageBand'])
    joined['sex'] = joined.RIAGENDR.map({1.0: 'M', 2.0: 'F'})
    joined = joined.dropna(subset=['sex'])
    joined['weightBin'] = (joined.BMXWT // 20 * 20).astype(int)
    cohorts = {}
    for (sex, age, weight), frame in joined.groupby(['sex', 'ageBand', 'weightBin']):
        if len(frame) < 25:
            continue
        cohorts[f'{sex}|{age}|{weight}'] = {'n': len(frame), 'q': weighted_quantiles(frame)}
    payload = {
        'source': 'CDC NHANES 2017–2018',
        'sourceUrl': 'https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/DXX_J.htm',
        'method': 'DXA total percent fat, age band and 20 kg bodyweight band, weighted with WTMEC2YR. Cohorts with fewer than 25 valid scans are omitted.',
        'cohorts': cohorts,
    }
    output = Path('src/bodyReference.json')
    output.write_text(json.dumps(payload, separators=(',', ':')), encoding='utf-8')
    print(f'Wrote {len(cohorts)} cohorts to {output} ({output.stat().st_size:,} bytes)')


if __name__ == '__main__':
    main()
