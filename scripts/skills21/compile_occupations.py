#!/usr/bin/env python3
"""
Compila archivos de ocupaciones de fuentes UE y EE. UU. a una estructura maestra.

Soporta:
- Employment_occupation*.csv (UE, separado por ';', con miles en '.')
- National Employment Matrix_IND_*.csv (EE. UU., tablas markdown separadas por '|')
"""

import argparse
import glob
import os
import re

import numpy as np
import pandas as pd


def process_eu_data(file_path):
    """Extrae, limpia y transforma los archivos CSV de proyecciones europeas."""
    df = pd.read_csv(file_path, sep=';', thousands='.', decimal=',')

    year_cols = [col for col in df.columns if str(col).startswith('20')]

    id_vars = ['country', 'occupation']
    if 'qualification' in df.columns:
        id_vars.append('qualification')

    df_melted = pd.melt(
        df,
        id_vars=id_vars,
        value_vars=year_cols,
        var_name='Year',
        value_name='Employment_Count'
    )

    df_master = pd.DataFrame()
    df_master['Data_Source'] = 'EU_Forecast'
    df_master['Geography'] = df_melted['country']
    df_master['Industry_Code'] = np.nan
    df_master['Occupation_Code'] = np.nan
    df_master['Occupation_Title'] = df_melted['occupation']
    df_master['Occupation_Type'] = 'Summary'
    if 'qualification' in df_melted.columns:
        df_master['Qualification_Level'] = df_melted['qualification']
    else:
        df_master['Qualification_Level'] = 'Total'

    df_master['Year'] = df_melted['Year'].astype(int)
    # UE viene en absoluto; se normaliza a miles para alinear con BLS.
    df_master['Employment_Count'] = pd.to_numeric(
        df_melted['Employment_Count'], errors='coerce'
    ) / 1000
    df_master['Percent_of_Industry'] = np.nan
    df_master['Percent_of_Occupation'] = np.nan

    return df_master


def process_us_data(file_path, industry_code):
    """Extrae, limpia y transforma tablas markdown de matrices de EE. UU."""
    required_cols = {
        'Occupation Code',
        'Occupation Title',
        'Occupation Type',
        '2024 Employment',
        '2024 Percent of Industry',
        '2024 Percent of Occupation',
        'Projected 2034 Employment',
        'Projected 2034 Percent of Industry',
        'Projected 2034 Percent of Occupation'
    }

    # Intento 1: CSV estándar separado por comas.
    try:
        df = pd.read_csv(file_path)
        df.columns = df.columns.str.strip()
        if not required_cols.issubset(set(df.columns)):
            raise ValueError('Formato no coincide con CSV estándar esperado.')
    except Exception:
        # Intento 2: tabla markdown separada por pipes.
        df = pd.read_csv(file_path, sep=r'\|', engine='python', skipinitialspace=True)
        df = df.dropna(how='all', axis=1)
        df.columns = df.columns.str.strip()
        df = df.loc[:, ~df.columns.str.contains(r'^Unnamed', na=False)]
        if not required_cols.issubset(set(df.columns)):
            raise ValueError(
                f'No se encontraron columnas requeridas de EE.UU. en {os.path.basename(file_path)}'
            )

    df = df[~df['Occupation Title'].astype(str).str.contains('---', na=False, regex=False)]
    df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)

    df_2024 = pd.DataFrame()
    df_2024['Year'] = 2024
    df_2024['Employment_Count'] = pd.to_numeric(
        df['2024 Employment'].astype(str).str.replace(',', '', regex=False),
        errors='coerce'
    )
    df_2024['Percent_of_Industry'] = pd.to_numeric(df['2024 Percent of Industry'], errors='coerce')
    df_2024['Percent_of_Occupation'] = pd.to_numeric(df['2024 Percent of Occupation'], errors='coerce')

    df_2034 = pd.DataFrame()
    df_2034['Year'] = 2034
    df_2034['Employment_Count'] = pd.to_numeric(
        df['Projected 2034 Employment'].astype(str).str.replace(',', '', regex=False),
        errors='coerce'
    )
    df_2034['Percent_of_Industry'] = pd.to_numeric(
        df['Projected 2034 Percent of Industry'],
        errors='coerce'
    )
    df_2034['Percent_of_Occupation'] = pd.to_numeric(
        df['Projected 2034 Percent of Occupation'],
        errors='coerce'
    )

    df_combined = pd.concat(
        [
            df.assign(**df_2024.to_dict('series')),
            df.assign(**df_2034.to_dict('series'))
        ],
        ignore_index=True
    )

    df_master = pd.DataFrame()
    df_master['Data_Source'] = 'US_BLS_Matrix'
    df_master['Geography'] = 'USA'
    df_master['Industry_Code'] = str(industry_code)
    df_master['Occupation_Code'] = (
        df_combined['Occupation Code'].astype(str).str.replace(r'[="]', '', regex=True)
    )
    df_master['Occupation_Title'] = df_combined['Occupation Title']
    df_master['Occupation_Type'] = df_combined['Occupation Type']
    df_master['Qualification_Level'] = 'Total'
    df_master['Year'] = df_combined['Year'].astype(int)
    # BLS ya viene en miles.
    df_master['Employment_Count'] = df_combined['Employment_Count']
    df_master['Percent_of_Industry'] = df_combined['Percent_of_Industry']
    df_master['Percent_of_Occupation'] = df_combined['Percent_of_Occupation']

    return df_master


def extract_industry_code(file_path):
    file_name = os.path.basename(file_path)
    match = re.search(r'IND_([A-Za-z0-9]+)(?:\.csv)?$', file_name)
    if not match:
        return None
    return match.group(1)


def compile_database(input_dir='.', output_file='compiled_employment_database.csv'):
    """Orquesta la compilación de todas las fuentes detectadas en input_dir."""
    all_dataframes = []

    eu_files = glob.glob(os.path.join(input_dir, 'Employment_occupation*.csv'))
    us_files = glob.glob(os.path.join(input_dir, 'National Employment Matrix_IND_*.csv'))

    if not eu_files and not us_files:
        raise FileNotFoundError(
            'No se encontraron archivos compatibles en el directorio de entrada.'
        )

    for file_path in eu_files:
        print(f'Procesando fuente europea: {os.path.basename(file_path)}...')
        all_dataframes.append(process_eu_data(file_path))

    for file_path in us_files:
        industry_code = extract_industry_code(file_path)
        if not industry_code:
            print(f'Se omite archivo sin código de industria reconocible: {file_path}')
            continue
        print(f'Procesando matriz de industria EE. UU.: {industry_code}...')
        all_dataframes.append(process_us_data(file_path, industry_code))

    if not all_dataframes:
        raise ValueError('No hubo data válida para compilar.')

    print('\nCompilando Base de Datos Maestra...')
    compiled_db = pd.concat(all_dataframes, ignore_index=True)
    compiled_db.sort_values(
        by=['Data_Source', 'Geography', 'Year', 'Occupation_Title'],
        inplace=True
    )

    compiled_db.to_csv(output_file, index=False)
    print(f'Exito! Base de datos generada con {len(compiled_db)} registros en {output_file}.')
    return compiled_db


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Compilador de ocupaciones UE + EE. UU.')
    parser.add_argument('--input-dir', default='.', help='Directorio con archivos fuente')
    parser.add_argument(
        '--output-file',
        default='compiled_employment_database.csv',
        help='Ruta del CSV compilado de salida'
    )
    args = parser.parse_args()

    compile_database(input_dir=args.input_dir, output_file=args.output_file)
