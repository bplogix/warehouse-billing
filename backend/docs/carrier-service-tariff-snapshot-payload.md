# Carrier Service Tariff Snapshot Payload

This document defines the payload structure stored in `CarrierServiceTariffSnapshot.payload`.

## Goals
- Persist a read-only 2D matrix for pricing lookup.
- Allow range-based lookups using upper bounds only.
- Keep the payload self-contained for snapshot reads.

## Payload Structure
JSON schema is available at `docs/carrier-service-tariff-snapshot-payload-schema.json`.

```json
{
  "currency": "JPY",
  "geo_axis": [
    { "code": "S-KYUSHU", "name": "南九州" },
    { "code": "N-KYUSHU", "name": "北九州" },
    { "code": "SHIKOKU", "name": "四国" },
    { "code": "CHUGOKU", "name": "中国" },
    { "code": "KANSAI", "name": "関西" },
    { "code": "HOKURIKU", "name": "北陸" },
    { "code": "TOKAI", "name": "東海" },
    { "code": "SHINETSU", "name": "信越" },
    { "code": "KANTO", "name": "関東" },
    { "code": "S-TOHOKU", "name": "南東北" },
    { "code": "N-TOHOKU", "name": "北東北" },
    { "code": "HOKKAIDO", "name": "北海道" },
    { "code": "OKINAWA", "name": "沖縄" }
  ],
  "metric_axis": {
    "girth_max_cm": [60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260],
    "weight_max_kg": [2, 5, 10, 15, 20, 25, 30, 30, 30, 50, 50]
  },
  "matrix": [
    {
      "region_code": "S-KYUSHU",
      "rows": [
        { "girth_max_cm": 60, "weight_max_kg": 2, "price_amount": 750 },
        { "girth_max_cm": 80, "weight_max_kg": 5, "price_amount": 950 },
        { "girth_max_cm": 100, "weight_max_kg": 10, "price_amount": 1120 },
        { "girth_max_cm": 120, "weight_max_kg": 15, "price_amount": 1300 },
        { "girth_max_cm": 140, "weight_max_kg": 20, "price_amount": 1300 },
        { "girth_max_cm": 160, "weight_max_kg": 25, "price_amount": 1470 },
        { "girth_max_cm": 180, "weight_max_kg": 30, "price_amount": 2850 },
        { "girth_max_cm": 200, "weight_max_kg": 30, "price_amount": 3350 },
        { "girth_max_cm": 220, "weight_max_kg": 30, "price_amount": 3850 },
        { "girth_max_cm": 240, "weight_max_kg": 50, "price_amount": 4850 },
        { "girth_max_cm": 260, "weight_max_kg": 50, "price_amount": 5850 }
      ]
    },
    {
      "region_code": "N-KYUSHU",
      "rows": [
        { "girth_max_cm": 60, "weight_max_kg": 2, "price_amount": 750 },
        { "girth_max_cm": 80, "weight_max_kg": 5, "price_amount": 950 },
        { "girth_max_cm": 100, "weight_max_kg": 10, "price_amount": 1120 },
        { "girth_max_cm": 120, "weight_max_kg": 15, "price_amount": 1300 },
        { "girth_max_cm": 140, "weight_max_kg": 20, "price_amount": 1300 },
        { "girth_max_cm": 160, "weight_max_kg": 25, "price_amount": 1470 },
        { "girth_max_cm": 180, "weight_max_kg": 30, "price_amount": 2850 },
        { "girth_max_cm": 200, "weight_max_kg": 30, "price_amount": 3350 },
        { "girth_max_cm": 220, "weight_max_kg": 30, "price_amount": 3850 },
        { "girth_max_cm": 240, "weight_max_kg": 50, "price_amount": 4850 },
        { "girth_max_cm": 260, "weight_max_kg": 50, "price_amount": 5850 }
      ]
    }
    ,
    {
      "region_code": "SHIKOKU",
      "rows": [
        { "girth_max_cm": 60, "weight_max_kg": 2, "price_amount": 700 },
        { "girth_max_cm": 80, "weight_max_kg": 5, "price_amount": 880 },
        { "girth_max_cm": 100, "weight_max_kg": 10, "price_amount": 1050 },
        { "girth_max_cm": 120, "weight_max_kg": 15, "price_amount": 1230 },
        { "girth_max_cm": 140, "weight_max_kg": 20, "price_amount": 1230 },
        { "girth_max_cm": 160, "weight_max_kg": 25, "price_amount": 1400 },
        { "girth_max_cm": 180, "weight_max_kg": 30, "price_amount": 2750 },
        { "girth_max_cm": 200, "weight_max_kg": 30, "price_amount": 3250 },
        { "girth_max_cm": 220, "weight_max_kg": 30, "price_amount": 3750 },
        { "girth_max_cm": 240, "weight_max_kg": 50, "price_amount": 4750 },
        { "girth_max_cm": 260, "weight_max_kg": 50, "price_amount": 5750 }
      ]
    },
    {
      "region_code": "CHUGOKU",
      "rows": [
        { "girth_max_cm": 60, "weight_max_kg": 2, "price_amount": 700 },
        { "girth_max_cm": 80, "weight_max_kg": 5, "price_amount": 880 },
        { "girth_max_cm": 100, "weight_max_kg": 10, "price_amount": 1050 },
        { "girth_max_cm": 120, "weight_max_kg": 15, "price_amount": 1230 },
        { "girth_max_cm": 140, "weight_max_kg": 20, "price_amount": 1230 },
        { "girth_max_cm": 160, "weight_max_kg": 25, "price_amount": 1400 },
        { "girth_max_cm": 180, "weight_max_kg": 30, "price_amount": 2750 },
        { "girth_max_cm": 200, "weight_max_kg": 30, "price_amount": 3250 },
        { "girth_max_cm": 220, "weight_max_kg": 30, "price_amount": 3750 },
        { "girth_max_cm": 240, "weight_max_kg": 50, "price_amount": 4750 },
        { "girth_max_cm": 260, "weight_max_kg": 50, "price_amount": 5750 }
      ]
    },
    {
      "region_code": "KANSAI",
      "rows": [
        { "girth_max_cm": 60, "weight_max_kg": 2, "price_amount": 550 },
        { "girth_max_cm": 80, "weight_max_kg": 5, "price_amount": 740 },
        { "girth_max_cm": 100, "weight_max_kg": 10, "price_amount": 910 },
        { "girth_max_cm": 120, "weight_max_kg": 15, "price_amount": 1090 },
        { "girth_max_cm": 140, "weight_max_kg": 20, "price_amount": 1090 },
        { "girth_max_cm": 160, "weight_max_kg": 25, "price_amount": 1260 },
        { "girth_max_cm": 180, "weight_max_kg": 30, "price_amount": 2550 },
        { "girth_max_cm": 200, "weight_max_kg": 30, "price_amount": 3050 },
        { "girth_max_cm": 220, "weight_max_kg": 30, "price_amount": 3550 },
        { "girth_max_cm": 240, "weight_max_kg": 50, "price_amount": 4550 },
        { "girth_max_cm": 260, "weight_max_kg": 50, "price_amount": 5550 }
      ]
    },
    {
      "region_code": "HOKURIKU",
      "rows": [
        { "girth_max_cm": 60, "weight_max_kg": 2, "price_amount": 520 },
        { "girth_max_cm": 80, "weight_max_kg": 5, "price_amount": 670 },
        { "girth_max_cm": 100, "weight_max_kg": 10, "price_amount": 840 },
        { "girth_max_cm": 120, "weight_max_kg": 15, "price_amount": 1020 },
        { "girth_max_cm": 140, "weight_max_kg": 20, "price_amount": 1020 },
        { "girth_max_cm": 160, "weight_max_kg": 25, "price_amount": 1190 },
        { "girth_max_cm": 180, "weight_max_kg": 30, "price_amount": 2450 },
        { "girth_max_cm": 200, "weight_max_kg": 30, "price_amount": 2950 },
        { "girth_max_cm": 220, "weight_max_kg": 30, "price_amount": 3450 },
        { "girth_max_cm": 240, "weight_max_kg": 50, "price_amount": 4450 },
        { "girth_max_cm": 260, "weight_max_kg": 50, "price_amount": 5450 }
      ]
    },
    {
      "region_code": "TOKAI",
      "rows": [
        { "girth_max_cm": 60, "weight_max_kg": 2, "price_amount": 520 },
        { "girth_max_cm": 80, "weight_max_kg": 5, "price_amount": 670 },
        { "girth_max_cm": 100, "weight_max_kg": 10, "price_amount": 840 },
        { "girth_max_cm": 120, "weight_max_kg": 15, "price_amount": 1020 },
        { "girth_max_cm": 140, "weight_max_kg": 20, "price_amount": 1020 },
        { "girth_max_cm": 160, "weight_max_kg": 25, "price_amount": 1190 },
        { "girth_max_cm": 180, "weight_max_kg": 30, "price_amount": 2450 },
        { "girth_max_cm": 200, "weight_max_kg": 30, "price_amount": 2950 },
        { "girth_max_cm": 220, "weight_max_kg": 30, "price_amount": 3450 },
        { "girth_max_cm": 240, "weight_max_kg": 50, "price_amount": 4450 },
        { "girth_max_cm": 260, "weight_max_kg": 50, "price_amount": 5450 }
      ]
    },
    {
      "region_code": "SHINETSU",
      "rows": [
        { "girth_max_cm": 60, "weight_max_kg": 2, "price_amount": 520 },
        { "girth_max_cm": 80, "weight_max_kg": 5, "price_amount": 670 },
        { "girth_max_cm": 100, "weight_max_kg": 10, "price_amount": 840 },
        { "girth_max_cm": 120, "weight_max_kg": 15, "price_amount": 1020 },
        { "girth_max_cm": 140, "weight_max_kg": 20, "price_amount": 1020 },
        { "girth_max_cm": 160, "weight_max_kg": 25, "price_amount": 1190 },
        { "girth_max_cm": 180, "weight_max_kg": 30, "price_amount": 2450 },
        { "girth_max_cm": 200, "weight_max_kg": 30, "price_amount": 2950 },
        { "girth_max_cm": 220, "weight_max_kg": 30, "price_amount": 3450 },
        { "girth_max_cm": 240, "weight_max_kg": 50, "price_amount": 4450 },
        { "girth_max_cm": 260, "weight_max_kg": 50, "price_amount": 5450 }
      ]
    },
    {
      "region_code": "KANTO",
      "rows": [
        { "girth_max_cm": 60, "weight_max_kg": 2, "price_amount": 520 },
        { "girth_max_cm": 80, "weight_max_kg": 5, "price_amount": 670 },
        { "girth_max_cm": 100, "weight_max_kg": 10, "price_amount": 840 },
        { "girth_max_cm": 120, "weight_max_kg": 15, "price_amount": 1020 },
        { "girth_max_cm": 140, "weight_max_kg": 20, "price_amount": 1020 },
        { "girth_max_cm": 160, "weight_max_kg": 25, "price_amount": 1190 },
        { "girth_max_cm": 180, "weight_max_kg": 30, "price_amount": 2450 },
        { "girth_max_cm": 200, "weight_max_kg": 30, "price_amount": 2950 },
        { "girth_max_cm": 220, "weight_max_kg": 30, "price_amount": 3450 },
        { "girth_max_cm": 240, "weight_max_kg": 50, "price_amount": 4450 },
        { "girth_max_cm": 260, "weight_max_kg": 50, "price_amount": 5450 }
      ]
    },
    {
      "region_code": "S-TOHOKU",
      "rows": [
        { "girth_max_cm": 60, "weight_max_kg": 2, "price_amount": 520 },
        { "girth_max_cm": 80, "weight_max_kg": 5, "price_amount": 670 },
        { "girth_max_cm": 100, "weight_max_kg": 10, "price_amount": 840 },
        { "girth_max_cm": 120, "weight_max_kg": 15, "price_amount": 1020 },
        { "girth_max_cm": 140, "weight_max_kg": 20, "price_amount": 1020 },
        { "girth_max_cm": 160, "weight_max_kg": 25, "price_amount": 1190 },
        { "girth_max_cm": 180, "weight_max_kg": 30, "price_amount": 2450 },
        { "girth_max_cm": 200, "weight_max_kg": 30, "price_amount": 2950 },
        { "girth_max_cm": 220, "weight_max_kg": 30, "price_amount": 3450 },
        { "girth_max_cm": 240, "weight_max_kg": 50, "price_amount": 4450 },
        { "girth_max_cm": 260, "weight_max_kg": 50, "price_amount": 5450 }
      ]
    },
    {
      "region_code": "N-TOHOKU",
      "rows": [
        { "girth_max_cm": 60, "weight_max_kg": 2, "price_amount": 550 },
        { "girth_max_cm": 80, "weight_max_kg": 5, "price_amount": 740 },
        { "girth_max_cm": 100, "weight_max_kg": 10, "price_amount": 910 },
        { "girth_max_cm": 120, "weight_max_kg": 15, "price_amount": 1090 },
        { "girth_max_cm": 140, "weight_max_kg": 20, "price_amount": 1090 },
        { "girth_max_cm": 160, "weight_max_kg": 25, "price_amount": 1260 },
        { "girth_max_cm": 180, "weight_max_kg": 30, "price_amount": 2550 },
        { "girth_max_cm": 200, "weight_max_kg": 30, "price_amount": 3050 },
        { "girth_max_cm": 220, "weight_max_kg": 30, "price_amount": 3550 },
        { "girth_max_cm": 240, "weight_max_kg": 50, "price_amount": 4550 },
        { "girth_max_cm": 260, "weight_max_kg": 50, "price_amount": 5550 }
      ]
    },
    {
      "region_code": "HOKKAIDO",
      "rows": [
        { "girth_max_cm": 60, "weight_max_kg": 2, "price_amount": 750 },
        { "girth_max_cm": 80, "weight_max_kg": 5, "price_amount": 950 },
        { "girth_max_cm": 100, "weight_max_kg": 10, "price_amount": 1120 },
        { "girth_max_cm": 120, "weight_max_kg": 15, "price_amount": 1300 },
        { "girth_max_cm": 140, "weight_max_kg": 20, "price_amount": 1300 },
        { "girth_max_cm": 160, "weight_max_kg": 25, "price_amount": 1470 },
        { "girth_max_cm": 180, "weight_max_kg": 30, "price_amount": 2850 },
        { "girth_max_cm": 200, "weight_max_kg": 30, "price_amount": 3350 },
        { "girth_max_cm": 220, "weight_max_kg": 30, "price_amount": 3850 },
        { "girth_max_cm": 240, "weight_max_kg": 50, "price_amount": 4850 },
        { "girth_max_cm": 260, "weight_max_kg": 50, "price_amount": 5850 }
      ]
    },
    {
      "region_code": "OKINAWA",
      "rows": [
        { "girth_max_cm": 60, "weight_max_kg": 2, "price_amount": 1240 },
        { "girth_max_cm": 80, "weight_max_kg": 5, "price_amount": 1740 },
        { "girth_max_cm": 100, "weight_max_kg": 10, "price_amount": 2260 },
        { "girth_max_cm": 120, "weight_max_kg": 15, "price_amount": 2760 },
        { "girth_max_cm": 140, "weight_max_kg": 20, "price_amount": 3280 },
        { "girth_max_cm": 160, "weight_max_kg": 25, "price_amount": 3780 },
        { "girth_max_cm": 180, "weight_max_kg": 30, "price_amount": 5000 },
        { "girth_max_cm": 200, "weight_max_kg": 30, "price_amount": 6000 },
        { "girth_max_cm": 220, "weight_max_kg": 30, "price_amount": 7000 },
        { "girth_max_cm": 240, "weight_max_kg": 50, "price_amount": 8000 },
        { "girth_max_cm": 260, "weight_max_kg": 50, "price_amount": 9000 }
      ]
    }
  ],
  "generated_at": "2024-01-01T00:00:00Z"
}
```

## Field Notes
- `currency`: copy from `CarrierServiceTariff.currency`.
- `geo_axis`: region metadata used to render or validate the matrix.
- `metric_axis`: ordered upper bounds; implicit lower bound is the previous max (or 0 if none).
- `matrix`: a list grouped by `region_code`, each with `rows` for price points.
- `price_amount`: smallest currency unit (integer).
- `generated_at`: snapshot generation timestamp in ISO-8601.

## Lookup Rule
- Select rows by region, then pick the first row where:
  - `weight <= weight_max_kg`
  - `volume <= volume_max_cm3`
  - `girth <= girth_max_cm`
- If a dimension is not used, set the max to `null` and ignore it in matching logic.
