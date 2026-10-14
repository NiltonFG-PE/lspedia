import importlib.util
import unittest
from pathlib import Path
from unittest.mock import MagicMock
spec = importlib.util.spec_from_file_location('monitor', Path(__file__).resolve().parents[1] / 'scripts/monitor_supabase.py')
monitor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor)

class MonitorTests(unittest.TestCase):
    def test_publicable_only(self):
        config = "supabaseUrl: '" + monitor.PROJECT_ORIGIN + "', publishableKey: 'sb_publishable_public-test'"
        self.assertEqual(monitor.leer_config(config), 'sb_publishable_public-test')
        with self.assertRaises(ValueError): monitor.leer_config(config.replace('sb_publishable_', 'sb_secret_'))
        with self.assertRaises(ValueError): monitor.leer_config(config.replace('https://', 'http://'))
    def test_real_database_response_required(self):
        opener = MagicMock()
        respuesta = opener.return_value.__enter__.return_value
        respuesta.status = 200
        respuesta.read.return_value = b'true'
        self.assertTrue(monitor.comprobar('sb_publishable_test', opener)['ok'])
        request = opener.call_args.args[0]
        self.assertEqual(request.method, 'GET')
        self.assertTrue(request.full_url.endswith('/rest/v1/rpc/lsp_service_health_v1'))
        self.assertIsNone(request.data)
        for contenido in (b'false', b'{}', b'"true"', b''):
            respuesta.read.return_value = contenido
            with self.assertRaises(ValueError): monitor.comprobar('sb_publishable_test', opener)
if __name__ == '__main__': unittest.main()
