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
        # Calculate latest and previous
        valid_forecasts.sort(key=lambda x: x["year"])
        latest_emp = valid_forecasts[-1]["employmentCount"] if valid_forecasts else 0
        latest_year = valid_forecasts[-1]["year"] if valid_forecasts else None
        prev_emp = valid_forecasts[0]["employmentCount"] if len(valid_forecasts) > 1 else None

        # Calculate CAGR
        cagr = None
        if len(valid_forecasts) > 1:
            start_f = valid_forecasts[0]
            end_f = valid_forecasts[-1]
            years_diff = end_f["year"] - start_f["year"]
            if years_diff > 0 and start_f["employmentCount"] > 0:
                try:
                    cagr = (end_f["employmentCount"] / start_f["employmentCount"]) ** (1 / years_diff) - 1
                except Exception:
                    cagr = None

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
            "previousEmployment": prev_emp,
            "cagr": cagr
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

    # Quadrant analytics computation using Polars (Replacement vs Openings)
    quadrant_data = []
    if fc_df.height > 0 and occ_df.height > 0:
        try:
            df = occ_df.join(fc_df, left_on="id", right_on="occupationId")
            cols = df.select("dataSource").unique().to_series().to_list()
            
            if "EU_Replacement_Demand" in cols and "EU_Job_Openings" in cols:
                pivoted = df.pivot(
                    index=["occupationTitle", "geography", "year"],
                    on="dataSource",
                    values="employmentCount",
                    aggregate_function="sum"
                ).fill_null(0)
                
                # Filter to latest year with any data
                latest_years_df = pivoted.group_by(["occupationTitle", "geography"]).agg(pl.col("year").max().alias("latestYear"))
                joined_latest = pivoted.join(latest_years_df, on=["occupationTitle", "geography"])
                filtered_latest = joined_latest.filter(pl.col("year") == pl.col("latestYear"))

                for row in filtered_latest.to_dicts():
                    rep = row.get("EU_Replacement_Demand", 0)
                    open_open = row.get("EU_Job_Openings", 0)
                    if rep > 0 or open_open > 0:
                        quadrant_data.append({
                            "occupation": row["occupationTitle"],
                            "geography": row["geography"],
                            "year": row["year"],
                            "replacement": rep,
                            "openings": open_open,
                            "ratio": open_open / rep if rep > 0 else 0
                        })
        except Exception as e:
            quadrant_data = []

    return {
        "availableYears": [int(y) for y in years],
        "availableGeographies": [str(g) for g in geographies],
        "availableSources": [str(s) for s in sources],
        "occupations": occ_df.to_dicts(),
        "forecasts": fc_df.to_dicts(),
        "quadrantItems": quadrant_data
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
