"""Build compact peer reference curves from OpenPowerlifting's public data.

Download https://openpowerlifting.gitlab.io/opl-csv/files/openpowerlifting-latest.zip
to tmp/openpowerlifting-latest.zip, then run this script from the project root.
"""

import json
import math
import zipfile
from collections import defaultdict
from pathlib import Path

SOURCE = Path('tmp/openpowerlifting-latest.zip')
OUTPUT = Path('src/benchmarks.json')
AGE_BANDS = [(18, 24), (25, 34), (35, 44), (45, 54), (55, 64), (65, 99)]
LIFTS = [('squat', 14), ('bench', 19), ('deadlift', 24), ('total', 25)]


def age_band(age: float) -> str | None:
    for low, high in AGE_BANDS:
        if low <= age <= high:
            return f'{low}-{high}'
    return None


def positive_number(value: str) -> float:
    try:
        number = float(value)
        return number if math.isfinite(number) and number > 0 else 0
    except ValueError:
        return 0


def quantiles(values: list[float]) -> list[float]:
    values.sort()
    last = len(values) - 1
    return [round(values[round(last * percent / 20)], 1) for percent in range(21)]


def main() -> None:
    # A competitor can appear at several meets. Retain their best result per cohort.
    cohorts: dict[str, dict[str, list[float]]] = defaultdict(dict)
    with zipfile.ZipFile(SOURCE) as archive:
        csv_file = next(name for name in archive.namelist() if name.endswith('.csv'))
        revision = csv_file.rsplit('/', 1)[-1].replace('.csv', '')
        with archive.open(csv_file) as source:
            next(source)
            for line in source:
                parts = line.decode('utf-8').rstrip('\r\n').split(',')
                if len(parts) < 26 or parts[2] != 'SBD' or parts[3] != 'Raw' or parts[1] not in ('M', 'F', 'Mx'):
                    continue
                try:
                    band = age_band(float(parts[4]))
                    bodyweight = float(parts[8])
                except ValueError:
                    continue
                if not band or not (35 <= bodyweight < 200):
                    continue
                weight_bin = min(190, int(bodyweight // 10) * 10)
                key = f'{parts[1]}|{band}|{weight_bin}'
                current = cohorts[key].setdefault(parts[0], [0, 0, 0, 0])
                for index, (_, column) in enumerate(LIFTS):
                    current[index] = max(current[index], positive_number(parts[column]))

    result = {}
    for key, athletes in cohorts.items():
        lift_data = {}
        for index, (name, _) in enumerate(LIFTS):
            values = [scores[index] for scores in athletes.values() if scores[index] > 0]
            if len(values) >= 30:
                lift_data[name] = {'n': len(values), 'q': quantiles(values)}
        if lift_data:
            result[key] = lift_data
    payload = {
        'source': 'OpenPowerlifting',
        'sourceUrl': 'https://openpowerlifting.gitlab.io/opl-csv/',
        'revision': revision,
        'method': 'Raw SBD competition results, best result per competitor within each sex, age band and 10 kg bodyweight band. Results with missing age or bodyweight are excluded.',
        'cohorts': result,
    }
    OUTPUT.write_text(json.dumps(payload, separators=(',', ':')), encoding='utf-8')
    print(f'Wrote {len(result)} cohorts to {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)')


if __name__ == '__main__':
    main()
