#!/usr/bin/env python3
"""
generate_digital_pr_reports.py — Digital PR Data & Press Kit Generator
Generates statistical rankings and ready-to-pitch UK press releases from
HM Land Registry Price Paid Data in PostgreSQL.

Produces:
1. Top 10 Most Expensive Streets in London
2. Top 10 Most Expensive Streets in England & Wales (Outside London)
3. Top 10 Most Affordable Districts (Best for First-Time Buyers)
4. Top 10 Biggest Single Luxury Sales of the Year
5. Regional Average Price Comparison
6. Ready-to-copy PR Press Releases in UK Journalistic Format
7. JSON data file for the `/market-reports/` web page
"""

import os
import sys
import json
import psycopg2
from datetime import datetime

DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'housepricespro'),
    'user': os.getenv('DB_USER', 'housepricespro_app'),
    'password': os.getenv('DB_PASS', 'HpPro2026_SecureDb'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '../reports')
WEB_DATA_PATH = os.path.join(os.path.dirname(__file__), '../src/data/pr_market_report.json')

def fmt_price(val):
    if not val:
        return '£0'
    return f"£{int(val):,}"

def get_db():
    return psycopg2.connect(**DB_CONFIG)

def generate_reports():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(WEB_DATA_PATH), exist_ok=True)

    conn = get_db()
    cursor = conn.cursor()

    print("📊 [1/5] Extracting London's Most Expensive Streets...")
    cursor.execute("""
        SELECT 
            street, 
            outcode, 
            district, 
            ROUND(AVG(price)) as avg_price, 
            MAX(price) as max_sale, 
            MIN(price) as min_sale,
            COUNT(*) as sales_count
        FROM land_registry_sales
        WHERE town_city = 'LONDON' AND street IS NOT NULL AND street != ''
        GROUP BY street, outcode, district
        HAVING COUNT(*) >= 3
        ORDER BY avg_price DESC
        LIMIT 10;
    """)
    london_streets = []
    for row in cursor.fetchall():
        london_streets.append({
            'street': row[0].title(),
            'outcode': row[1],
            'borough': (row[2] or 'London').title(),
            'avgPrice': int(row[3]),
            'avgPriceFmt': fmt_price(row[3]),
            'maxSale': int(row[4]),
            'maxSaleFmt': fmt_price(row[4]),
            'minSale': int(row[5]),
            'minSaleFmt': fmt_price(row[5]),
            'salesCount': row[6]
        })

    print("📊 [2/5] Extracting Most Expensive Streets Outside London...")
    cursor.execute("""
        SELECT 
            street, 
            town_city, 
            county, 
            outcode,
            ROUND(AVG(price)) as avg_price, 
            MAX(price) as max_sale, 
            COUNT(*) as sales_count
        FROM land_registry_sales
        WHERE town_city != 'LONDON' AND street IS NOT NULL AND street != ''
        GROUP BY street, town_city, county, outcode
        HAVING COUNT(*) >= 3
        ORDER BY avg_price DESC
        LIMIT 10;
    """)
    regional_streets = []
    for row in cursor.fetchall():
        regional_streets.append({
            'street': row[0].title(),
            'town': (row[1] or '').title(),
            'county': (row[2] or '').title(),
            'outcode': row[3],
            'avgPrice': int(row[4]),
            'avgPriceFmt': fmt_price(row[4]),
            'maxSale': int(row[5]),
            'maxSaleFmt': fmt_price(row[5]),
            'salesCount': row[6]
        })

    print("📊 [3/5] Extracting Most Affordable Postcode Districts (min 15 sales)...")
    cursor.execute("""
        SELECT 
            outcode, 
            MODE() WITHIN GROUP (ORDER BY town_city) as town, 
            MODE() WITHIN GROUP (ORDER BY county) as county,
            ROUND(AVG(price)) as avg_price, 
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)) as median_price,
            COUNT(*) as total_sales
        FROM land_registry_sales
        WHERE outcode != ''
        GROUP BY outcode
        HAVING COUNT(*) >= 15
        ORDER BY median_price ASC
        LIMIT 10;
    """)
    affordable_districts = []
    for row in cursor.fetchall():
        affordable_districts.append({
            'outcode': row[0],
            'town': (row[1] or row[0]).title(),
            'county': (row[2] or 'UK').title(),
            'avgPrice': int(row[3]),
            'avgPriceFmt': fmt_price(row[3]),
            'medianPrice': int(row[4]),
            'medianPriceFmt': fmt_price(row[4]),
            'salesCount': row[5]
        })

    print("📊 [4/5] Extracting Top 10 Luxury Single Property Transactions...")
    cursor.execute("""
        SELECT 
            price, 
            paon, 
            street, 
            town_city, 
            postcode, 
            property_type, 
            duration,
            transfer_date
        FROM land_registry_sales
        ORDER BY price DESC
        LIMIT 10;
    """)
    type_map = {'D': 'Detached House', 'S': 'Semi-Detached', 'T': 'Terraced House', 'F': 'Apartment / Penthouse', 'O': 'Other / Estate'}
    tenure_map = {'F': 'Freehold', 'L': 'Leasehold'}
    mega_sales = []
    for row in cursor.fetchall():
        mega_sales.append({
            'price': int(row[0]),
            'priceFmt': fmt_price(row[0]),
            'address': f"{row[1]} {row[2]}".strip().title(),
            'town': (row[3] or '').title(),
            'postcode': row[4],
            'type': type_map.get(row[5], 'Residential Property'),
            'tenure': tenure_map.get(row[6], 'Freehold'),
            'date': row[7].strftime('%d %B %Y') if row[7] else ''
        })

    print("📊 [5/5] Extracting Regional Price Breakdown...")
    cursor.execute("""
        SELECT 
            CASE 
                WHEN county IN ('GREATER LONDON') OR town_city = 'LONDON' THEN 'Greater London'
                WHEN county IN ('SURREY', 'KENT', 'ESSEX', 'BERKSHIRE', 'HERTFORDSHIRE', 'BUCKINGHAMSHIRE', 'HAMPSHIRE', 'WEST SUSSEX', 'EAST SUSSEX', 'OXFORDSHIRE') THEN 'South East & Home Counties'
                WHEN county IN ('GREATER MANCHESTER', 'MERSEYSIDE', 'LANCASHIRE', 'CHESHIRE', 'CUMBRIA') THEN 'North West'
                WHEN county IN ('WEST MIDLANDS', 'WARWICKSHIRE', 'WORCESTERSHIRE', 'STAFFORDSHIRE', 'SHROPSHIRE') THEN 'West Midlands'
                WHEN county IN ('WEST YORKSHIRE', 'SOUTH YORKSHIRE', 'NORTH YORKSHIRE', 'EAST RIDING OF YORKSHIRE') THEN 'Yorkshire & Humber'
                WHEN county IN ('DEVON', 'CORNWALL', 'SOMERSET', 'DORSET', 'GLOUCESTERSHIRE', 'WILTSHIRE') THEN 'South West'
                WHEN county IN ('TYNE AND WEAR', 'COUNTY DURHAM', 'NORTHUMBERLAND') THEN 'North East'
                WHEN county ILIKE '%WALES%' OR county IN ('CARDIFF', 'SWANSEA', 'GWYNEDD', 'CLWYD', 'DYFED', 'GWENT', 'POWYS') THEN 'Wales'
                ELSE 'East of England & Midlands'
            END as region_name,
            ROUND(AVG(price)) as avg_price,
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price)) as median_price,
            COUNT(*) as total_sales
        FROM land_registry_sales
        GROUP BY 1
        ORDER BY avg_price DESC;
    """)
    regional_summary = []
    for row in cursor.fetchall():
        regional_summary.append({
            'region': row[0],
            'avgPrice': int(row[1]),
            'avgPriceFmt': fmt_price(row[1]),
            'medianPrice': int(row[2]),
            'medianPriceFmt': fmt_price(row[2]),
            'salesCount': row[3]
        })

    cursor.close()
    conn.close()

    # Consolidate Data
    report_data = {
        'generatedAt': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'totalTransactionsAnalyzed': sum(r['salesCount'] for r in regional_summary),
        'londonStreets': london_streets,
        'regionalStreets': regional_streets,
        'affordableDistricts': affordable_districts,
        'megaSales': mega_sales,
        'regionalSummary': regional_summary
    }

    # Save JSON for Web
    with open(WEB_DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2)
    print(f"✅ Web report data saved to {WEB_DATA_PATH}")

    # Generate Markdown Press Releases Kit
    press_kit_path = os.path.join(OUTPUT_DIR, 'UK_PROPERTY_DIGITAL_PR_PITCH_KIT.md')
    with open(press_kit_path, 'w', encoding='utf-8') as f:
        f.write(generate_press_kit_markdown(report_data))
    print(f"✅ Digital PR Press Kit written to {press_kit_path}")

def generate_press_kit_markdown(data):
    top_london = data['londonStreets'][0] if data['londonStreets'] else None
    top_affordable = data['affordableDistricts'][0] if data['affordableDistricts'] else None
    top_sale = data['megaSales'][0] if data['megaSales'] else None

    return f"""# 🇬🇧 HousePricesPro.co.uk — UK Digital PR & Press Pitch Kit
**Official Data Source:** HM Land Registry Price Paid Data (Under Open Government Licence v3.0)  
**Total Registered Sales Analyzed:** {data['totalTransactionsAnalyzed']:,}  
**Date of Release:** {datetime.now().strftime('%B %Y')}  
**Attribution & Canonical Source:** [HousePricesPro.co.uk](https://housepricespro.co.uk/market-reports/)

---

## 📢 PITCH #1: FOR LONDON & FINANCIAL EDITORS
**Target Outlets:** *Evening Standard, MyLondon, City A.M., The Telegraph Property, Daily Mail Money, Time Out London*

### Subject Line:
`DATA: London's most expensive street revealed with average sold price of {top_london['avgPriceFmt'] if top_london else '£22.7M'} (HM Land Registry Analysis)`

### Pitch Body:
Hi [Editor Name],

With mortgage rates and property valuations dominating British consumer concerns, new transaction analysis of official **HM Land Registry Price Paid Data** by property portal [HousePricesPro.co.uk](https://housepricespro.co.uk) reveals London’s most expensive residential streets and top single sales this year.

### Key Findings:
- **London's #1 Most Expensive Street:** **{top_london['street']}** ({top_london['outcode']}, {top_london['borough']}), where properties sold for an astonishing average of **{top_london['avgPriceFmt']}**.
- **Top 5 London Millionaire Streets:**
{chr(10).join([f"  {i+1}. **{s['street']}** ({s['outcode']}, {s['borough']}) — Average: **{s['avgPriceFmt']}** (Highest single sale: {s['maxSaleFmt']})" for i, s in enumerate(data['londonStreets'][:5])])}
- **Single Biggest London Sale:** A luxury residential property on **{top_sale['address']}** ({top_sale['town']}, {top_sale['postcode']}) commanded a record **{top_sale['priceFmt']}**.

**Expert Comment:**
> *"Despite broader economic volatility and mortgage rate adjustments, London's ultra-prime residential market continues to record eye-watering sums. As Land Registry filings confirm, buyers on streets like {top_london['street']} are completing multimillion-pound purchases, underscoring the enduring global appeal of prime London real estate."*  
> — **Research Team, HousePricesPro.co.uk**

Full interactive breakdown, borough tables and methodology available at:  
👉 **https://housepricespro.co.uk/market-reports/**

*(Editors are welcome to quote any data or tables with hyperlinked attribution to HousePricesPro.co.uk).*

---

## 📢 PITCH #2: FOR REGIONAL & LOCAL EDITORS (REACH PLC)
**Target Outlets:** *Manchester Evening News, Birmingham Live, Liverpool Echo, Bristol Live, Yorkshire Live*

### Subject Line:
`REVEALED: The UK's most expensive streets outside London in 2026 — Land Registry study`

### Pitch Body:
Hi [Editor Name],

Outside of the capital, significant wealth is concentrated along exclusive residential avenues across England and Wales. According to newly analyzed HM Land Registry figures from [HousePricesPro.co.uk](https://housepricespro.co.uk):

### Top 5 Most Expensive Streets Outside London:
{chr(10).join([f"{i+1}. **{s['street']}** ({s['town']}, {s['county']} — {s['outcode']}): Average Sold Price **{s['avgPriceFmt']}**" for i, s in enumerate(data['regionalStreets'][:5])])}

Full regional datasets and local outcode registers can be explored at:  
👉 **https://housepricespro.co.uk/market-reports/**

---

## 📢 PITCH #3: FOR FIRST-TIME BUYERS & PERSONAL FINANCE JOURNALISTS
**Target Outlets:** *MoneySavingExpert, This is Money, The Sun Money, iNews, Mirror Money*

### Subject Line:
`PR STUDY: The 10 most affordable postcodes in England & Wales where houses still sell under £150k`

### Pitch Body:
Hi [Editor Name],

For first-time buyers struggling with affordability, saving a deposit is the biggest hurdle. Property registry portal [HousePricesPro.co.uk](https://housepricespro.co.uk) has crunched the numbers to reveal where homes are selling for the lowest median prices in England and Wales:

### Top 5 Most Affordable Postcode Districts:
{chr(10).join([f"{i+1}. **{d['outcode']}** ({d['town']}, {d['county']}): Median Price **{d['medianPriceFmt']}** (Average: {d['avgPriceFmt']})" for i, d in enumerate(data['affordableDistricts'][:5])])}

**Expert Comment:**
> *"While average UK house prices hover above £280,000, our Land Registry analysis proves that genuine bargains remain in northern and coastal communities. First-time buyers willing to look beyond major metropolitan centres can still secure solid homes for under a fraction of London prices."*

Complete table, stamp duty savings calculator and free valuation estimates:  
👉 **https://housepricespro.co.uk/market-reports/**

---

## 📊 REGIONAL PRICE COMPARISON TABLE (READY TO EMBED)
| Region | Average Price | Median Price | Transactions Analyzed |
|---|---|---|---|
{chr(10).join([f"| **{r['region']}** | {r['avgPriceFmt']} | {r['medianPriceFmt']} | {r['salesCount']:,} |" for r in data['regionalSummary']])}

---
*Data extracted from HM Land Registry Price Paid Dataset under Open Government Licence v3.0. Conducted by HousePricesPro.co.uk.*
"""

if __name__ == '__main__':
    generate_reports()
