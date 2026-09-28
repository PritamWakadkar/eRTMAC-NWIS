"""
Extract drilling parameters (mud weight, ECD, ROP, torque, pump rate) from
report text, with depth, unit normalisation and source page.

Input: pages = [(page_number, text), ...]  (from PyMuPDF or your OCR step)
Output: list of dicts ready for parameter_store.save_parameters()

Assumptions (check against your real reports):
  * A parameter belongs to the depth on the same line; if the line has no
    depth, to the most recent depth mentioned earlier in the document.
  * Values without a unit are assumed to already be in the canonical unit
    (mud weight/ECD > 3 is assumed to be ppg).
  * Values outside plausible ranges are skipped, not silently kept.
"""

import os
import re

from .event_source import key_of

FT_TO_M = 0.3048

# label regex, {unit: factor to canonical}, canonical default factor, low, high
SPECS = {
    "mud_weight_sg": {
        "label": r"mud\s*(?:weight|density|wt)|\bmw\b",
        "units": {"sg": 1.0, "s.g.": 1.0, "kg/l": 1.0, "g/cc": 1.0, "ppg": 0.119826},
        "low": 0.9, "high": 2.7,
    },
    "ecd_sg": {
        "label": r"\becd\b",
        "units": {"sg": 1.0, "s.g.": 1.0, "kg/l": 1.0, "g/cc": 1.0, "ppg": 0.119826},
        "low": 0.9, "high": 2.9,
    },
    "rop_m_hr": {
        "label": r"\brop\b|rate\s+of\s+penetration",
        "units": {"m/hr": 1.0, "m/h": 1.0, "ft/hr": FT_TO_M, "ft/h": FT_TO_M},
        "low": 0.1, "high": 200.0,
    },
    "torque_knm": {
        "label": r"torque|\btrq\b",
        "units": {
            "knm": 1.0, "kn.m": 1.0, "kn-m": 1.0, "kn·m": 1.0,
            "kft-lbf": 1.35582, "kft-lb": 1.35582,
            "ft-lbf": 0.00135582, "ft-lbs": 0.00135582, "ft-lb": 0.00135582,
        },
        "low": 0.1, "high": 100.0,
    },
    "pump_rate_l_min": {
        "label": r"pump\s*rate|flow\s*rate|flowrate",
        "units": {"l/min": 1.0, "lpm": 1.0, "l/m": 1.0, "gpm": 3.78541},
        "low": 100.0, "high": 6000.0,
    },
}

NUMBER = r"(\d[\d,]*(?:\.\d+)?)"


def _compile():
    compiled = {}
    for name, spec in SPECS.items():
        units = "|".join(
            re.escape(u) for u in sorted(spec["units"], key=len, reverse=True)
        )
        compiled[name] = re.compile(
            rf"(?:{spec['label']})[^\d\n]{{0,20}}{NUMBER}(?:\s*({units})(?![a-z]))?",
            re.IGNORECASE,
        )
    return compiled


PATTERNS = _compile()

DEPTH_RE = re.compile(
    rf"{NUMBER}\s*(m|mtr|mtrs|metres|meters|ft)(?![/\w])", re.IGNORECASE
)


def _to_float(text):
    try:
        return float(text.replace(",", ""))
    except ValueError:
        return None


def _line_depth(line):
    """First plausible depth (in metres) on the line, or None."""
    for match in DEPTH_RE.finditer(line):
        value = _to_float(match.group(1))
        if value is None:
            continue
        if match.group(2).lower() == "ft":
            value *= FT_TO_M
        if 50 <= value <= 12000:
            return round(value, 1)
    return None


def _convert(name, value, unit):
    spec = SPECS[name]
    if unit:
        return value * spec["units"][unit.lower()]
    if name in ("mud_weight_sg", "ecd_sg") and value > 3:
        return value * spec["units"]["ppg"]
    return value


def extract_parameters(well_id, document, pages):
    rows = []
    seen = set()
    current_depth = None
    document_name = os.path.basename(str(document))

    for page_number, text in pages:
        for line in (text or "").splitlines():

            line_depth = _line_depth(line)
            if line_depth is not None:
                current_depth = line_depth

            depth = current_depth
            if depth is None:
                continue

            for name, pattern in PATTERNS.items():
                for match in pattern.finditer(line):

                    raw = _to_float(match.group(1))
                    if raw is None:
                        continue

                    value = _convert(name, raw, match.group(2))
                    spec = SPECS[name]

                    if not (spec["low"] <= value <= spec["high"]):
                        continue

                    fingerprint = (name, depth, round(value, 4), page_number)
                    if fingerprint in seen:
                        continue
                    seen.add(fingerprint)

                    rows.append({
                        "well_id": str(well_id).upper().strip(),
                        "well_key": key_of(well_id),
                        "depth_m": depth,
                        "parameter": name,
                        "value": round(value, 4),
                        "original_text": match.group(0).strip()[:250],
                        "source_document": document_name,
                        "source_page": page_number,
                    })

    return rows


def pages_from_pdf(path):
    """Text-layer pages via PyMuPDF. Scanned pages come back empty:
    pass those through your OCR step and reuse extract_parameters()."""
    import fitz  # PyMuPDF

    pages = []
    with fitz.open(path) as pdf:
        for index, page in enumerate(pdf, start=1):
            pages.append((index, page.get_text()))
    return pages