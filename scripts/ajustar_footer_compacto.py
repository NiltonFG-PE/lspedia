from pathlib import Path

repo = Path(__file__).resolve().parents[1]
index_path = repo / "index.html"
sw_path = repo / "sw.js"

index = index_path.read_text(encoding="utf-8")

reemplazos = {
'''        margin-top: 26px;\n        padding: 24px 20px 22px !important;\n        border-radius: 26px;''':
'''        margin-top: 20px;\n        padding: 16px 16px 14px !important;\n        border-radius: 22px;''',
'''        width: 54px;\n        height: 54px;\n        margin-bottom: 10px;''':
'''        width: 44px;\n        height: 44px;\n        margin-bottom: 8px;''',
'''        box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.055);''':
'''        box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.055);''',
'''        width: 25px;\n        height: 25px;''':
'''        width: 21px;\n        height: 21px;''',
'''        margin: 0 auto 12px;\n        max-width: 560px;\n        color: #24364d;\n        font-size: 0.98rem;\n        font-weight: 600;\n        line-height: 1.55;''':
'''        margin: 0 auto 9px;\n        max-width: 560px;\n        color: #24364d;\n        font-size: 0.92rem;\n        font-weight: 600;\n        line-height: 1.4;''',
'''        min-height: 42px;\n        padding: 9px 18px;\n        margin-bottom: 12px;''':
'''        min-height: 38px;\n        padding: 7px 16px;\n        margin-bottom: 0;''',
'''            margin: 22px 0 4px;\n            padding: 22px 16px 20px !important;\n            border-radius: 24px;''':
'''            margin: 18px 0 4px;\n            padding: 15px 14px 14px !important;\n            border-radius: 20px;''',
'''            font-size: 0.94rem;\n            line-height: 1.5;''':
'''            font-size: 0.88rem;\n            line-height: 1.4;''',
'''            <p class="footer-tagline">Conocimiento sin barreras, un Perú más inclusivo.</p>\n''': ''''''
}

for viejo, nuevo in reemplazos.items():
    cantidad = index.count(viejo)
    if cantidad != 1:
        raise SystemExit(f"Se esperaba 1 coincidencia y se encontraron {cantidad}: {viejo[:80]!r}")
    index = index.replace(viejo, nuevo, 1)

index_path.write_text(index, encoding="utf-8")

sw = sw_path.read_text(encoding="utf-8")
old_version = 'const VERSION_APP = "v40";'
new_version = 'const VERSION_APP = "v41";'
if sw.count(old_version) != 1:
    raise SystemExit("No se encontró exactamente una VERSION_APP v40")
sw = sw.replace(old_version, new_version, 1)
sw_path.write_text(sw, encoding="utf-8")
