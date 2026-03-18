import argparse
import json
from pathlib import Path

import polars as pl


def build_skills_snapshot(skills):
    # Flatten skills
    rows = []

    for sk in skills:
        sk_id = str(sk.get("id") or "").strip()
        if not sk_id:
            continue

        name = str(sk.get("name") or "").strip()
        industry = str(sk.get("industry") or "").strip() or "Sin industria"
        category = str(sk.get("category") or "").strip()
        desc = str(sk.get("description") or "").strip()
        trend = str(sk.get("trendSummary") or "").strip()
        tags = sk.get("tags") or []
        is_active = bool(sk.get("isActive"))
        provider = str(sk.get("sourceProvider") or "").strip()
        project_count = int(sk.get("projectCount") or 0)

        # Build search tokens
        search_tokens = f"{name} {industry} {category} {desc} {trend} {' '.join(tags)}".lower()

        rows.append({
            "id": sk_id,
            "name": name,
            "industry": industry,
            "category": category,
            "isActive": is_active,
            "sourceProvider": provider,
            "projectCount": project_count,
            "searchTokens": search_tokens
        })

    df = pl.DataFrame(rows) if rows else pl.DataFrame(
        schema={
            "id": pl.String,
            "name": pl.String,
            "industry": pl.String,
            "category": pl.String,
            "isActive": pl.Boolean,
            "sourceProvider": pl.String,
            "projectCount": pl.Int64,
            "searchTokens": pl.String
        }
    )

    industries = df.filter(pl.col("isActive")).select("industry").unique().sort("industry").to_series().to_list() if df.height > 0 else []
    categories = df.filter(pl.col("isActive")).drop_nulls("category").select("category").unique().sort("category").to_series().to_list() if df.height > 0 else []

    return {
        "availableIndustries": [str(i) for i in industries],
        "availableCategories": [str(c) for c in categories],
        "skills": df.to_dicts()
    }


def main():
    parser = argparse.ArgumentParser(description="Compila snapshot analitico Habilidades.")
    parser.add_argument("--input-file", required=True, help="Archivo JSON de entrada.")
    parser.add_argument("--output-file", required=True, help="Archivo JSON de salida.")
    args = parser.parse_args()

    input_path = Path(args.input_file)
    output_path = Path(args.output_file)

    payload = json.loads(input_path.read_text(encoding="utf-8"))
    skills = payload.get("skills") or []

    snapshot = build_skills_snapshot(skills)
    output_path.write_text(
        json.dumps(snapshot, ensure_ascii=False),
        encoding="utf-8"
    )

    print(f"Snapshot Habilidades generado: {len(snapshot['skills'])} habilidades proc.")


if __name__ == "__main__":
    main()
