import argparse
import json
from pathlib import Path

import polars as pl


def build_snapshot(occupations):
    demand_rows = []
    skill_rows = []

    for occupation in occupations:
        occupation_id = str(occupation.get("id") or "").strip()
        occupation_title = str(occupation.get("occupationTitle") or "").strip()
        occupation_code = occupation.get("occupationCode")
        geography = str(occupation.get("geography") or "").strip()
        industry = str(occupation.get("industry") or "").strip() or "Sin industria"
        skills = occupation.get("skills") or []
        skill_count = len(skills)

        for forecast in occupation.get("forecasts") or []:
            year = forecast.get("year")
            employment_count = forecast.get("employmentCount")
            if not occupation_id or not occupation_title or not geography:
                continue
            if year is None or employment_count is None:
                continue

            demand_row = {
                "id": occupation_id,
                "occupationTitle": occupation_title,
                "occupationCode": occupation_code,
                "geography": geography,
                "industry": industry,
                "year": int(year),
                "employmentCount": float(employment_count),
                "skillCount": int(skill_count),
            }
            demand_rows.append(demand_row)

            for skill in skills:
                skill_id = str(skill.get("id") or "").strip()
                skill_name = str(skill.get("name") or "").strip()
                skill_industry = str(skill.get("industry") or "").strip() or "Servicios"
                if not skill_id or not skill_name:
                    continue

                skill_rows.append(
                    {
                        "occupationId": occupation_id,
                        "occupationTitle": occupation_title,
                        "geography": geography,
                        "industry": industry,
                        "year": int(year),
                        "employmentCount": float(employment_count),
                        "skillId": skill_id,
                        "skillName": skill_name,
                        "skillIndustry": skill_industry,
                        "skillCategory": skill.get("category"),
                    }
                )

    demand_df = pl.DataFrame(demand_rows) if demand_rows else pl.DataFrame(
        schema={
            "id": pl.String,
            "occupationTitle": pl.String,
            "occupationCode": pl.String,
            "geography": pl.String,
            "industry": pl.String,
            "year": pl.Int64,
            "employmentCount": pl.Float64,
            "skillCount": pl.Int64,
        }
    )
    skill_df = pl.DataFrame(skill_rows) if skill_rows else pl.DataFrame(
        schema={
            "occupationId": pl.String,
            "occupationTitle": pl.String,
            "geography": pl.String,
            "industry": pl.String,
            "year": pl.Int64,
            "employmentCount": pl.Float64,
            "skillId": pl.String,
            "skillName": pl.String,
            "skillIndustry": pl.String,
            "skillCategory": pl.String,
        }
    )

    years = []
    if demand_df.height > 0:
        years = (
            demand_df.select("year")
            .unique()
            .sort("year")
            .to_series()
            .to_list()
        )

    industries = (
        demand_df.select("industry")
        .unique()
        .sort("industry")
        .to_series()
        .to_list()
        if demand_df.height > 0
        else []
    )
    geographies = (
        demand_df.select("geography")
        .unique()
        .sort("geography")
        .to_series()
        .to_list()
        if demand_df.height > 0
        else []
    )

    return {
        "occupationYears": [int(year) for year in years],
        "occupationIndustries": [str(item) for item in industries],
        "occupationGeographies": [str(item) for item in geographies],
        "latestOccupationYear": int(years[-1]) if years else None,
        "demandRows": demand_df.to_dicts(),
        "skillRows": skill_df.to_dicts(),
    }


def main():
    parser = argparse.ArgumentParser(description="Compila snapshot analitico Home para Skills21.")
    parser.add_argument("--input-file", required=True, help="Archivo JSON de entrada.")
    parser.add_argument("--output-file", required=True, help="Archivo JSON de salida.")
    args = parser.parse_args()

    input_path = Path(args.input_file)
    output_path = Path(args.output_file)

    payload = json.loads(input_path.read_text(encoding="utf-8"))
    occupations = payload.get("occupations") or []

    snapshot = build_snapshot(occupations)
    output_path.write_text(
        json.dumps(snapshot, ensure_ascii=False),
        encoding="utf-8"
    )

    print(
        f"Snapshot Home generado: {len(snapshot['demandRows'])} filas demanda, "
        f"{len(snapshot['skillRows'])} filas habilidad."
    )


if __name__ == "__main__":
    main()
