import argparse
import json
from pathlib import Path

import polars as pl


def build_occupations_snapshot(occupations):
    # Flatten occupations and forecasts
    base_rows = []
    forecast_rows = []

    for occ in occupations:
        occ_id = str(occ.get("id") or "").strip()
        if not occ_id:
            continue

        title = str(occ.get("occupationTitle") or "").strip()
        code = occ.get("occupationCode")
        geo = str(occ.get("geography") or "").strip()
        industry = str(occ.get("industryCode") or "").strip() or "Sin industria"
        data_source = str(occ.get("dataSource") or "").strip()
        occ_type = str(occ.get("occupationType") or "").strip()
        qual_level = str(occ.get("qualificationLevel") or "").strip()
        
        skills = occ.get("skills") or []
        skill_names = [str(s.get("name") or "").strip() for s in skills if s.get("name")]
        
        forecasts = occ.get("forecasts") or []
        valid_forecasts = []
        for f in forecasts:
            y = f.get("year")
            emp = f.get("employmentCount")
            if y is not None and emp is not None:
                valid_forecasts.append({"year": int(y), "employmentCount": float(emp)})
                forecast_rows.append({
                    "occupationId": occ_id,
                    "year": int(y),
                    "employmentCount": float(emp)
                })

        # Calculate latest and previous
        valid_forecasts.sort(key=lambda x: x["year"])
        latest_emp = valid_forecasts[-1]["employmentCount"] if valid_forecasts else 0
        latest_year = valid_forecasts[-1]["year"] if valid_forecasts else None
        prev_emp = valid_forecasts[0]["employmentCount"] if len(valid_forecasts) > 1 else None

        base_rows.append({
            "id": occ_id,
            "occupationTitle": title,
            "occupationCode": code,
            "geography": geo,
            "industryCode": industry,
            "dataSource": data_source,
            "occupationType": occ_type,
            "qualificationLevel": qual_level,
            "skillCount": len(skills),
            "searchTokens": f"{title} {occ_type} {code or ''} {industry} {qual_level} {geo} {' '.join(skill_names)}".lower(),
            "latestEmployment": latest_emp,
            "latestYear": latest_year,
            "previousEmployment": prev_emp
        })

    occ_df = pl.DataFrame(base_rows) if base_rows else pl.DataFrame(
        schema={
            "id": pl.String,
            "occupationTitle": pl.String,
            "occupationCode": pl.String,
            "geography": pl.String,
            "industryCode": pl.String,
            "dataSource": pl.String,
            "occupationType": pl.String,
            "qualificationLevel": pl.String,
            "skillCount": pl.Int64,
            "searchTokens": pl.String,
            "latestEmployment": pl.Float64,
            "latestYear": pl.Int64,
            "previousEmployment": pl.Float64
        }
    )

    fc_df = pl.DataFrame(forecast_rows) if forecast_rows else pl.DataFrame(
        schema={
            "occupationId": pl.String,
            "year": pl.Int64,
            "employmentCount": pl.Float64
        }
    )

    years = fc_df.select("year").unique().sort("year").to_series().to_list() if fc_df.height > 0 else []
    geographies = occ_df.select("geography").unique().sort("geography").to_series().to_list() if occ_df.height > 0 else []
    sources = occ_df.select("dataSource").unique().sort("dataSource").to_series().to_list() if occ_df.height > 0 else []

    return {
        "availableYears": [int(y) for y in years],
        "availableGeographies": [str(g) for g in geographies],
        "availableSources": [str(s) for s in sources],
        "occupations": occ_df.to_dicts(),
        "forecasts": fc_df.to_dicts()
    }


def main():
    parser = argparse.ArgumentParser(description="Compila snapshot analitico Ocupaciones.")
    parser.add_argument("--input-file", required=True, help="Archivo JSON de entrada.")
    parser.add_argument("--output-file", required=True, help="Archivo JSON de salida.")
    args = parser.parse_args()

    input_path = Path(args.input_file)
    output_path = Path(args.output_file)

    payload = json.loads(input_path.read_text(encoding="utf-8"))
    occupations = payload.get("occupations") or []

    snapshot = build_occupations_snapshot(occupations)
    output_path.write_text(
        json.dumps(snapshot, ensure_ascii=False),
        encoding="utf-8"
    )

    print(f"Snapshot Ocupaciones generado: {len(snapshot['occupations'])} filas base.")


if __name__ == "__main__":
    main()
