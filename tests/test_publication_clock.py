import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('news', ROOT / 'scripts' / 'actualizar_nuevas_palabras.py')
news = importlib.util.module_from_spec(spec)
spec.loader.exec_module(news)

class PublicationClockTests(unittest.TestCase):
    def test_editing_editorial_date_keeps_real_clock(self):
        item = dict(palabra='Prueba', categoria='General', video='abcdefghijk', fechaPublicacion='2000-01-01', publicadoEn='2026-10-10T07:30:00-05:00')
        with patch.object(news, 'fechas_publicacion_historial', return_value={}):
            before = news.candidatos_fuente([item], 'diccionario', 'data/palabras.json', {})[0][1]
            item['fechaPublicacion'] = '2030-01-01'
            after = news.candidatos_fuente([item], 'diccionario', 'data/palabras.json', {})[0][1]
        self.assertEqual(before['publicadoEn'], '2026-10-10T12:30:00Z')
        self.assertEqual(before['publicadoEn'], after['publicadoEn'])
        self.assertEqual(before['fecha'], after['fecha'])
        self.assertNotEqual(before['fechaPublicacion'], after['fechaPublicacion'])

    def test_historical_dates_do_not_gain_invented_hours(self):
        item = dict(palabra='Antigua', categoria='General', video='abcdefghijk', fechaPublicacion='2026-10-09')
        with patch.object(news, 'fechas_publicacion_historial', return_value={}):
            record = news.candidatos_fuente([item], 'vocabulario', 'data/vocabulario.json', {})[0][1]
        self.assertEqual(record['publicadoEn'], '')
        self.assertEqual(record['origenFecha'], 'fechaPublicacion')

    def test_clock_requires_an_explicit_timezone_and_time(self):
        for value in ['2026-10-10', '10/10/2026', '2026-10-10T07:30:00', 'invalid']:
            self.assertEqual(news.momento_publicacion({'publicadoEn': value}), '')
        self.assertEqual(news.momento_publicacion({'publicadoen': '2026-10-10T07:30:00-05:00'}), '2026-10-10T12:30:00Z')

if __name__ == '__main__':
    unittest.main()
