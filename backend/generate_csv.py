import csv
import math
import random

# Center: Avenida Paulista
center_lat = -23.5632
center_lon = -46.6542

neighborhoods = [
    ("Bela Vista", "São Paulo", "SP"),
    ("Consolação", "São Paulo", "SP"),
    ("Jardins", "São Paulo", "SP"),
    ("Higienópolis", "São Paulo", "SP"),
    ("Centro", "São Paulo", "SP"),
    ("Itaim Bibi", "São Paulo", "SP"),
    ("Vila Olímpia", "São Paulo", "SP"),
    ("Moema", "São Paulo", "SP"),
    ("Pinheiros", "São Paulo", "SP"),
    ("Vila Madalena", "São Paulo", "SP"),
    ("Perdizes", "São Paulo", "SP"),
    ("Lapa", "São Paulo", "SP"),
    ("Santana", "São Paulo", "SP"),
    ("Tatuapé", "São Paulo", "SP"),
    ("Ipiranga", "São Paulo", "SP"),
    ("Santo André", "Santo André", "SP"),
    ("São Bernardo", "São Bernardo do Campo", "SP"),
    ("Guarulhos", "Guarulhos", "SP"),
    ("Osasco", "Osasco", "SP"),
]

streets = [
    "Avenida Paulista", "Rua Augusta", "Rua Oscar Freire", "Avenida Brigadeiro Faria Lima",
    "Rua Consolação", "Avenida Rebouças", "Rua Haddock Lobo", "Avenida Brasil",
    "Rua da Liberdade", "Avenida 9 de Julho", "Rua Vergueiro", "Avenida Ibirapuera",
    "Rua Pamplona", "Rua Estados Unidos", "Avenida Europa", "Rua Itapeva",
    "Rua Bela Cintra", "Avenida Angélica", "Rua Peixoto Gomide", "Rua Alameda Santos",
    "Rua Teodoro Sampaio", "Rua Cardeal Arcoverde", "Rua Mourato Coelho",
    "Avenida Sumaré", "Rua Aspicuelta", "Rua Harmonia",
]

cep_prefixes = [
    "0131", "0132", "0133", "0134", "0135", "0136", "0137", "0138", "0139",
    "0140", "0141", "0142", "0143", "0144", "0145", "0146", "0147", "0148",
    "0420", "0421", "0422", "0423", "0424", "0425",
    "0430", "0431", "0432", "0433", "0434", "0435",
    "0440", "0441", "0442", "0443", "0444", "0445",
    "0450", "0451", "0452", "0453", "0454",
    "0460", "0461", "0462", "0463",
    "0920", "0921", "0922",
    "0930", "0931", "0932",
    "1230", "1231", "1232",
    "0950", "0951",
    "0960", "0961",
    "0740", "0741",
    "0750", "0751",
]

rows = []
used_ceps = set()

random.seed(42)

for i, prefix in enumerate(cep_prefixes):
    for j in range(2):
        suffix = str(random.randint(0, 999)).zfill(3)
        cep = prefix + suffix
        if cep in used_ceps:
            suffix = str((int(suffix) + 1) % 1000).zfill(3)
            cep = prefix + suffix
        if cep in used_ceps:
            continue
        used_ceps.add(cep)
        
        # Random offset within ~30km
        angle = random.uniform(0, 2 * math.pi)
        radius_km = random.uniform(0, 30)
        dlat = (radius_km / 111) * math.cos(angle)
        dlon = (radius_km / (111 * math.cos(math.radians(center_lat)))) * math.sin(angle)
        lat = center_lat + dlat
        lon = center_lon + dlon
        
        nbh = neighborhoods[i % len(neighborhoods)]
        street = streets[random.randint(0, len(streets)-1)]
        rows.append([cep, street, nbh[0], nbh[1], nbh[2], round(lat, 6), round(lon, 6)])

# Ensure we have at least 100 rows
while len(rows) < 120:
    prefix = random.choice(cep_prefixes)
    suffix = str(random.randint(0, 999)).zfill(3)
    cep = prefix + suffix
    if cep in used_ceps:
        continue
    used_ceps.add(cep)
    angle = random.uniform(0, 2 * math.pi)
    radius_km = random.uniform(0, 25)
    dlat = (radius_km / 111) * math.cos(angle)
    dlon = (radius_km / (111 * math.cos(math.radians(center_lat)))) * math.sin(angle)
    lat = center_lat + dlat
    lon = center_lon + dlon
    nbh = random.choice(neighborhoods)
    street = random.choice(streets)
    rows.append([cep, street, nbh[0], nbh[1], nbh[2], round(lat, 6), round(lon, 6)])

# Add the canonical example CEPs
if "01310100" not in used_ceps:
    rows.insert(0, ["01310100", "Avenida Paulista", "Bela Vista", "São Paulo", "SP", -23.5632, -46.6542])
if "01310200" not in used_ceps:
    rows.insert(1, ["01310200", "Avenida Paulista", "Bela Vista", "São Paulo", "SP", -23.5640, -46.6555])

with open('data/ceps.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['cep', 'logradouro', 'bairro', 'localidade', 'uf', 'latitude', 'longitude'])
    for row in rows:
        writer.writerow(row)

print(f"Generated {len(rows)} CEP rows")
