import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetFile = path.resolve(__dirname, '../src/data/uk_postcodes_summary.json');

const districts = [
  // Central London
  { outcode: 'sw1a', name: 'Westminster & Whitehall', region: 'Central London', town: 'London', county: 'Greater London', basePrice: 1450000, growth: 2.8, flatPct: 75, streets: ['Whitehall Court', 'Buckingham Gate', 'Birdcage Walk', 'Palace Street', 'Horse Guards Avenue'] },
  { outcode: 'w1k', name: 'Mayfair Central', region: 'Central London', town: 'London', county: 'Greater London', basePrice: 2850000, growth: 3.2, flatPct: 80, streets: ['Grosvenor Square', 'Park Lane', 'Mount Street', 'South Audley Street', 'Davies Street'] },
  { outcode: 'ec1a', name: 'City of London & Farringdon', region: 'Central London', town: 'London', county: 'Greater London', basePrice: 890000, growth: 1.9, flatPct: 85, streets: ['Charterhouse Street', 'St John Street', 'Long Lane', 'West Smithfield', 'Cloth Fair'] },
  { outcode: 'wc2e', name: 'Covent Garden', region: 'Central London', town: 'London', county: 'Greater London', basePrice: 1250000, growth: 2.4, flatPct: 88, streets: ['King Street', 'Floral Street', 'Bedford Street', 'Henrietta Street', 'Maiden Lane'] },
  { outcode: 'nw1', name: 'Camden Town & Regent\'s Park', region: 'Central London', town: 'London', county: 'Greater London', basePrice: 920000, growth: 3.1, flatPct: 70, streets: ['Parkway', 'Camden High Street', 'Gloucester Gate', 'Arlington Road', 'Delancey Street'] },
  { outcode: 'se1', name: 'Southwark & Waterloo', region: 'Central London', town: 'London', county: 'Greater London', basePrice: 740000, growth: 4.2, flatPct: 82, streets: ['Borough High Street', 'Shad Thames', 'Bermondsey Street', 'Blackfriars Road', 'Tooley Street'] },
  { outcode: 'e1', name: 'Whitechapel & Spitalfields', region: 'East London', town: 'London', county: 'Greater London', basePrice: 610000, growth: 3.8, flatPct: 78, streets: ['Commercial Street', 'Brick Lane', 'Whitechapel High Street', 'Leman Street', 'Hanbury Street'] },
  { outcode: 'w2', name: 'Paddington & Bayswater', region: 'Central London', town: 'London', county: 'Greater London', basePrice: 1100000, growth: 2.1, flatPct: 84, streets: ['Westbourne Terrace', 'Sussex Gardens', 'Queensway', 'Hyde Park Square', 'Gloucester Terrace'] },
  { outcode: 'sw3', name: 'Chelsea', region: 'Central London', town: 'London', county: 'Greater London', basePrice: 2200000, growth: 1.8, flatPct: 72, streets: ['King\'s Road', 'Sloane Avenue', 'Draycott Place', 'Cheyne Walk', 'Cadogan Gardens'] },
  { outcode: 'sw7', name: 'South Kensington', region: 'Central London', town: 'London', county: 'Greater London', basePrice: 1950000, growth: 2.0, flatPct: 76, streets: ['Queen\'s Gate', 'Cromwell Road', 'Elvaston Place', 'Onslow Gardens', 'Harrington Gardens'] },

  // Greater London & South East
  { outcode: 'tw1', name: 'Twickenham & St Margarets', region: 'South West London', town: 'Twickenham', county: 'Greater London', basePrice: 780000, growth: 4.5, flatPct: 40, streets: ['London Road', 'Richmond Road', 'St Margarets Road', 'Cross Deep', 'Chertsey Road'] },
  { outcode: 'kt1', name: 'Kingston upon Thames', region: 'South West London', town: 'Kingston', county: 'Greater London', basePrice: 650000, growth: 3.9, flatPct: 45, streets: ['Portsmouth Road', 'High Street', 'Clarence Street', 'Kingston Hill', 'Penrhyn Road'] },
  { outcode: 'cr0', name: 'Croydon Central', region: 'South London', town: 'Croydon', county: 'Greater London', basePrice: 385000, growth: 2.2, flatPct: 52, streets: ['George Street', 'Addiscombe Road', 'Lower Addiscombe Road', 'London Road', 'Park Lane'] },
  { outcode: 'br1', name: 'Bromley Town', region: 'South East London', town: 'Bromley', county: 'Greater London', basePrice: 495000, growth: 3.6, flatPct: 42, streets: ['High Street', 'Widmore Road', 'Masons Hill', 'Bickley Road', 'London Lane'] },
  { outcode: 'en1', name: 'Enfield Central', region: 'North London', town: 'Enfield', county: 'Greater London', basePrice: 475000, growth: 2.7, flatPct: 35, streets: ['London Road', 'Southbury Road', 'Willow Road', 'Church Street', 'Baker Street'] },
  { outcode: 'ha1', name: 'Harrow on the Hill', region: 'North West London', town: 'Harrow', county: 'Greater London', basePrice: 510000, growth: 3.0, flatPct: 48, streets: ['High Street', 'Station Road', 'Peterborough Road', 'London Road', 'Greenford Road'] },

  // South East England
  { outcode: 'ox1', name: 'Oxford City Centre & Grandpont', region: 'South East', town: 'Oxford', county: 'Oxfordshire', basePrice: 585000, growth: 4.8, flatPct: 45, streets: ['Banbury Road', 'Woodstock Road', 'Iffley Road', 'Abingdon Road', 'Cowley Road'] },
  { outcode: 'cb1', name: 'Cambridge Central & Station', region: 'East of England', town: 'Cambridge', county: 'Cambridgeshire', basePrice: 560000, growth: 5.1, flatPct: 48, streets: ['Hills Road', 'Mill Road', 'Station Road', 'Cherry Hinton Road', 'Tenison Road'] },
  { outcode: 'bn1', name: 'Brighton Central & Preston', region: 'South East', town: 'Brighton', county: 'East Sussex', basePrice: 470000, growth: 3.4, flatPct: 58, streets: ['Ditchling Road', 'London Road', 'Dyke Road', 'Preston Road', 'Lewes Road'] },
  { outcode: 'rg1', name: 'Reading Town Centre', region: 'South East', town: 'Reading', county: 'Berkshire', basePrice: 355000, growth: 4.1, flatPct: 62, streets: ['Kings Road', 'Oxford Road', 'London Road', 'Forbury Road', 'Caversham Road'] },
  { outcode: 'so14', name: 'Southampton Waterfront & City', region: 'South East', town: 'Southampton', county: 'Hampshire', basePrice: 245000, growth: 2.9, flatPct: 72, streets: ['High Street', 'Canute Road', 'Ocean Way', 'Above Bar Street', 'St Mary Street'] },
  { outcode: 'po1', name: 'Portsmouth Historic Dockyard & City', region: 'South East', town: 'Portsmouth', county: 'Hampshire', basePrice: 235000, growth: 3.1, flatPct: 65, streets: ['Commercial Road', 'Queen Street', 'St George\'s Square', 'Gunwharf Road', 'Kingston Crescent'] },

  // Midlands
  { outcode: 'b1', name: 'Birmingham City Centre & Jewellery Qtr', region: 'West Midlands', town: 'Birmingham', county: 'West Midlands', basePrice: 245000, growth: 4.6, flatPct: 88, streets: ['Broad Street', 'Colmore Row', 'Holloway Head', 'Great Charles Street', 'Navigation Street'] },
  { outcode: 'b15', name: 'Edgbaston', region: 'West Midlands', town: 'Birmingham', county: 'West Midlands', basePrice: 420000, growth: 3.7, flatPct: 40, streets: ['Hagley Road', 'Harborne Road', 'Bristol Road', 'Priory Road', 'Calthorpe Road'] },
  { outcode: 'cv1', name: 'Coventry City Centre', region: 'West Midlands', town: 'Coventry', county: 'West Midlands', basePrice: 195000, growth: 3.2, flatPct: 68, streets: ['Warwick Road', 'Corporation Street', 'Gosford Street', 'Hales Street', 'Foleshill Road'] },
  { outcode: 'ng1', name: 'Nottingham City Centre & Lace Market', region: 'East Midlands', town: 'Nottingham', county: 'Nottinghamshire', basePrice: 198000, growth: 3.8, flatPct: 75, streets: ['Mansfield Road', 'Canal Street', 'Stoney Street', 'Derby Road', 'Huntingdon Street'] },
  { outcode: 'le1', name: 'Leicester City Centre', region: 'East Midlands', town: 'Leicester', county: 'Leicestershire', basePrice: 185000, growth: 3.0, flatPct: 70, streets: ['London Road', 'Charles Street', 'Granby Street', 'Humberstone Gate', 'Belgrave Gate'] },

  // North West
  { outcode: 'm1', name: 'Manchester Piccadilly & Northern Quarter', region: 'North West', town: 'Manchester', county: 'Greater Manchester', basePrice: 265000, growth: 5.4, flatPct: 92, streets: ['Whitworth Street', 'Dale Street', 'Portland Street', 'Newton Street', 'Princess Street'] },
  { outcode: 'm3', name: 'Manchester Spinningfields & Salford', region: 'North West', town: 'Manchester', county: 'Greater Manchester', basePrice: 280000, growth: 5.1, flatPct: 94, streets: ['Deansgate', 'Blackfriars Road', 'New Bailey Street', 'Trinity Way', 'Chapel Street'] },
  { outcode: 'm20', name: 'Didsbury & Withington', region: 'North West', town: 'Manchester', county: 'Greater Manchester', basePrice: 395000, growth: 4.8, flatPct: 35, streets: ['Wilmslow Road', 'Palatine Road', 'Barlow Moor Road', 'Didsbury Park', 'Lapwing Lane'] },
  { outcode: 'l1', name: 'Liverpool ONE & Waterfront', region: 'North West', town: 'Liverpool', county: 'Merseyside', basePrice: 175000, growth: 4.2, flatPct: 86, streets: ['Strand Street', 'Hanover Street', 'Duke Street', 'Seel Street', 'Bold Street'] },
  { outcode: 'l3', name: 'Liverpool Waterfront & Vauxhall', region: 'North West', town: 'Liverpool', county: 'Merseyside', basePrice: 190000, growth: 3.9, flatPct: 88, streets: ['Waterloo Road', 'Princes Parade', 'Old Hall Street', 'Great Howard Street', 'Leeds Street'] },
  { outcode: 'ch1', name: 'Chester City Centre', region: 'North West', town: 'Chester', county: 'Cheshire', basePrice: 295000, growth: 3.5, flatPct: 48, streets: ['Foregate Street', 'Watergate Street', 'City Road', 'Bridge Street', 'Northgate Street'] },

  // Yorkshire & North East
  { outcode: 'ls1', name: 'Leeds City Centre', region: 'Yorkshire', town: 'Leeds', county: 'West Yorkshire', basePrice: 215000, growth: 4.9, flatPct: 90, streets: ['The Calls', 'Crown Point Road', 'Wellington Street', 'Neville Street', 'Dock Street'] },
  { outcode: 'ls6', name: 'Headingley & Hyde Park', region: 'Yorkshire', town: 'Leeds', county: 'West Yorkshire', basePrice: 275000, growth: 3.4, flatPct: 35, streets: ['Otley Road', 'Cardigan Road', 'Victoria Road', 'Headingley Lane', 'Woodhouse Lane'] },
  { outcode: 's1', name: 'Sheffield City Centre', region: 'Yorkshire', town: 'Sheffield', county: 'South Yorkshire', basePrice: 165000, growth: 3.6, flatPct: 85, streets: ['West Street', 'Arundel Gate', 'Broad Lane', 'Moorfoot', 'Pinstone Street'] },
  { outcode: 'yo1', name: 'York City Walls & Shambles', region: 'Yorkshire', town: 'York', county: 'North Yorkshire', basePrice: 385000, growth: 4.3, flatPct: 52, streets: ['Micklegate', 'Goodramgate', 'Walmgate', 'Piccadilly', 'Fossgate'] },
  { outcode: 'ne1', name: 'Newcastle City Centre & Quayside', region: 'North East', town: 'Newcastle upon Tyne', county: 'Tyne and Wear', basePrice: 185000, growth: 3.7, flatPct: 84, streets: ['Quayside', 'Grey Street', 'Grainger Street', 'Dean Street', 'Sandhill'] },
  { outcode: 'dh1', name: 'Durham City Centre', region: 'North East', town: 'Durham', county: 'County Durham', basePrice: 265000, growth: 3.3, flatPct: 42, streets: ['Saddler Street', 'North Road', 'New Elvet', 'South Road', 'Claypath'] },

  // South West
  { outcode: 'bs1', name: 'Bristol Old City & Harbourside', region: 'South West', town: 'Bristol', county: 'Bristol', basePrice: 365000, growth: 5.2, flatPct: 84, streets: ['Anchor Road', 'Welsh Back', 'Redcliff Street', 'Baldwin Street', 'Broad Quay'] },
  { outcode: 'bs8', name: 'Clifton & Hotwells', region: 'South West', town: 'Bristol', county: 'Bristol', basePrice: 595000, growth: 4.1, flatPct: 55, streets: ['Clifton Down', 'Pembroke Road', 'Whiteladies Road', 'Royal York Crescent', 'Alma Road'] },
  { outcode: 'ba1', name: 'Bath City Centre', region: 'South West', town: 'Bath', county: 'Somerset', basePrice: 510000, growth: 3.9, flatPct: 58, streets: ['Great Pulteney Street', 'The Circus', 'Royal Crescent', 'Walcot Street', 'Milsom Street'] },
  { outcode: 'ex1', name: 'Exeter City Centre', region: 'South West', town: 'Exeter', county: 'Devon', basePrice: 320000, growth: 4.0, flatPct: 50, streets: ['High Street', 'Fore Street', 'South Street', 'Queen Street', 'Heavitree Road'] },
  { outcode: 'pl1', name: 'Plymouth City Centre & Hoe', region: 'South West', town: 'Plymouth', county: 'Devon', basePrice: 195000, growth: 2.8, flatPct: 60, streets: ['Armada Way', 'Royal Parade', 'Notte Street', 'Citadel Road', 'Union Street'] },
  { outcode: 'tr1', name: 'Truro City Centre', region: 'South West', town: 'Truro', county: 'Cornwall', basePrice: 310000, growth: 3.5, flatPct: 35, streets: ['Lemon Street', 'Boscawen Street', 'Kenwyn Street', 'St Marys Street', 'Tregolls Road'] },

  // Wales
  { outcode: 'cf10', name: 'Cardiff Bay & City Centre', region: 'Wales', town: 'Cardiff', county: 'South Glamorgan', basePrice: 225000, growth: 4.4, flatPct: 82, streets: ['Bute Street', 'Lloyd George Avenue', 'St Mary Street', 'Harbour Drive', 'Pierhead Street'] },
  { outcode: 'sa1', name: 'Swansea Marina & Waterfront', region: 'Wales', town: 'Swansea', county: 'West Glamorgan', basePrice: 175000, growth: 3.0, flatPct: 62, streets: ['Oystermouth Road', 'Kings Road', 'Trawler Road', 'Victoria Road', 'Langdon Road'] },

  // East of England
  { outcode: 'nr1', name: 'Norwich City Centre & Riverside', region: 'East of England', town: 'Norwich', county: 'Norfolk', basePrice: 240000, growth: 3.3, flatPct: 52, streets: ['Riverside Road', 'King Street', 'St Benedicts Street', 'Prince of Wales Road', 'Magdalen Street'] },
  { outcode: 'ip1', name: 'Ipswich Town Centre', region: 'East of England', town: 'Ipswich', county: 'Suffolk', basePrice: 205000, growth: 2.9, flatPct: 48, streets: ['Tavern Street', 'Fore Street', 'St Peters Street', 'Civic Drive', 'Woodbridge Road'] }
];

const data = districts.map(d => {
  const base = d.basePrice;
  const flatRatio = d.flatPct / 100;
  const detachedRatio = (1 - flatRatio) * 0.25;
  const semiRatio = (1 - flatRatio) * 0.35;
  const terracedRatio = (1 - flatRatio) * 0.40;

  const detachedAvg = Math.round(base * 1.85);
  const semiAvg = Math.round(base * 1.35);
  const terracedAvg = Math.round(base * 1.05);
  const flatAvg = Math.round(base * 0.78);

  const totalSales = Math.floor(450 + Math.random() * 800);
  const detachedCount = Math.max(8, Math.round(totalSales * detachedRatio));
  const semiCount = Math.max(15, Math.round(totalSales * semiRatio));
  const terracedCount = Math.max(25, Math.round(totalSales * terracedRatio));
  const flatCount = Math.max(30, Math.round(totalSales * flatRatio));

  const weightedTotal = (detachedAvg * detachedCount) + (semiAvg * semiCount) + (terracedAvg * terracedCount) + (flatAvg * flatCount);
  const avgPrice = Math.round(weightedTotal / (detachedCount + semiCount + terracedCount + flatCount));
  const medianPrice = Math.round(avgPrice * 0.94);

  const topStreets = d.streets.map((st, idx) => ({
    name: st,
    avgPrice: Math.round(avgPrice * (0.85 + (idx * 0.08))),
    salesCount: Math.floor(12 + Math.random() * 28)
  }));

  // Generate realistic recent transactions for 2026/2025
  const sampleAddresses = [
    { num: '14', street: d.streets[0], type: 'Flat', tenure: 'Leasehold', factor: 0.8 },
    { num: '28', street: d.streets[1], type: 'Terraced', tenure: 'Freehold', factor: 1.05 },
    { num: '42A', street: d.streets[2], type: 'Flat', tenure: 'Leasehold', factor: 0.75 },
    { num: '7', street: d.streets[0], type: 'Semi-Detached', tenure: 'Freehold', factor: 1.3 },
    { num: '55', street: d.streets[3] || d.streets[0], type: 'Terraced', tenure: 'Freehold', factor: 1.1 },
    { num: '102', street: d.streets[4] || d.streets[1], type: 'Flat', tenure: 'Leasehold', factor: 0.82 },
    { num: '3', street: d.streets[2] || d.streets[0], type: 'Detached', tenure: 'Freehold', factor: 1.9 },
    { num: '19', street: d.streets[1], type: 'Semi-Detached', tenure: 'Freehold', factor: 1.38 }
  ];

  const recentSales = sampleAddresses.map((sa, idx) => {
    const salePrice = Math.round(avgPrice * sa.factor);
    const monthsAgo = idx * 1.5;
    const date = new Date(2026, 8 - Math.floor(monthsAgo), 15 - (idx * 2)).toISOString().split('T')[0];
    return {
      date,
      address: `${sa.num} ${sa.street}`,
      postcode: `${d.outcode.toUpperCase()} ${Math.floor(1 + Math.random() * 9)}A${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      price: salePrice,
      type: sa.type,
      tenure: sa.tenure,
      newBuild: idx === 1
    };
  });

  return {
    outcode: d.outcode,
    name: d.name,
    region: d.region,
    town: d.town,
    county: d.county,
    avgPrice,
    medianPrice,
    totalSales,
    yoyGrowth: d.growth,
    threeYearGrowth: Number((d.growth * 2.8).toFixed(1)),
    propertyTypes: {
      detached: { avg: detachedAvg, count: detachedCount, pct: Math.round(detachedRatio * 100) },
      semi: { avg: semiAvg, count: semiCount, pct: Math.round(semiRatio * 100) },
      terraced: { avg: terracedAvg, count: terracedCount, pct: Math.round(terracedRatio * 100) },
      flat: { avg: flatAvg, count: flatCount, pct: Math.round(flatRatio * 100) }
    },
    topStreets,
    recentSales
  };
});

fs.mkdirSync(path.dirname(targetFile), { recursive: true });
fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf-8');
console.log(`✅ Generated seed data for ${data.length} UK postcode districts in ${targetFile}`);
