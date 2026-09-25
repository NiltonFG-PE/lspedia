import contextlib
import importlib.util
import io
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


def modulo(nombre):
    spec = importlib.util.spec_from_file_location(nombre, ROOT / 'scripts' / (nombre + '.py'))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


pub = modulo('publicar_generados')


class PublicacionConcurrente(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name)
        self.remote = self.base / 'remote.git'
        self.a, self.b = self.base / 'a', self.base / 'b'
        self.run_git(self.base, 'init', '--bare', str(self.remote))
        self.run_git(self.base, 'clone', str(self.remote), str(self.a))
        self.config(self.a)
        self.run_git(self.a, 'checkout', '-b', 'develop')
        (self.a / 'data').mkdir()
        (self.a / 'fuente.txt').write_text('inicial\n')
        (self.a / 'otra.txt').write_text('inicial\n')
        (self.a / 'data/nuevas-palabras.json').write_text('inicial\n')
        self.commit(self.a)
        self.run_git(self.a, 'push', '-u', 'origin', 'develop')
        self.run_git(self.base, 'clone', '-b', 'develop', str(self.remote), str(self.b))
        self.config(self.b)

    def run_git(self, repo, *args):
        return subprocess.run(['git', *args], cwd=repo, check=True, capture_output=True, text=True).stdout.strip()

    def config(self, repo):
        self.run_git(repo, 'config', 'user.name', 'Prueba')
        self.run_git(repo, 'config', 'user.email', 'prueba@example.invalid')

    def commit(self, repo):
        self.run_git(repo, 'add', '.')
        self.run_git(repo, 'commit', '-m', 'Cambio de prueba')

    def generar(self, repo):
        (repo / 'data/nuevas-palabras.json').write_text((repo / 'fuente.txt').read_text() + (repo / 'otra.txt').read_text())
        self.run_git(repo, 'add', 'data/nuevas-palabras.json')

    def test_conflicto_generado_se_recalcula_con_ambas_fuentes(self):
        (self.a / 'fuente.txt').write_text('cambio local\n')
        (self.a / 'data/nuevas-palabras.json').write_text('generado local\n')
        self.commit(self.a)
        (self.b / 'otra.txt').write_text('cambio remoto\n')
        (self.b / 'data/nuevas-palabras.json').write_text('generado remoto\n')
        self.commit(self.b)
        self.run_git(self.b, 'push')
        pub.publicar(self.a, generar=self.generar)
        self.assertEqual((self.a / 'data/nuevas-palabras.json').read_text(), 'cambio local\ncambio remoto\n')
        self.assertEqual(self.run_git(self.a, 'rev-parse', 'HEAD'), self.run_git(self.remote, 'rev-parse', 'develop'))

    def test_conflicto_fuente_no_se_sobrescribe(self):
        (self.a / 'fuente.txt').write_text('edicion local\n')
        self.commit(self.a)
        local = self.run_git(self.a, 'rev-parse', 'HEAD')
        (self.b / 'fuente.txt').write_text('edicion remota\n')
        self.commit(self.b)
        self.run_git(self.b, 'push')
        remoto = self.run_git(self.remote, 'rev-parse', 'develop')
        with self.assertRaisesRegex(RuntimeError, 'No se sobrescribieron datos fuente'):
            pub.publicar(self.a, generar=self.generar)
        self.assertEqual(self.run_git(self.a, 'rev-parse', 'HEAD'), local)
        self.assertEqual(self.run_git(self.remote, 'rev-parse', 'develop'), remoto)
        self.assertEqual((self.a / 'fuente.txt').read_text(), 'edicion local\n')

    def test_publicacion_sin_cambios_no_crea_commits(self):
        self.generar(self.a)
        self.commit(self.a)
        self.run_git(self.a, 'push')
        anterior = self.run_git(self.a, 'rev-parse', 'HEAD')
        pub.publicar(self.a, generar=self.generar)
        self.assertEqual(self.run_git(self.a, 'rev-parse', 'HEAD'), anterior)


class ActualizacionSinCambios(unittest.TestCase):
    def test_conserva_fecha_solo_si_contenido_es_igual(self):
        import json
        nuevo = modulo('actualizar_nuevas_palabras')
        with tempfile.TemporaryDirectory() as tmp:
            archivo = Path(tmp) / 'nuevo.json'
            archivo.write_text(json.dumps({'generadoEn':'antes','items':[1]}))
            salida = {'generadoEn':'ahora','items':[1]}
            nuevo.conservar_fecha_si_no_cambio(salida, archivo)
            self.assertEqual(salida['generadoEn'], 'antes')
            salida = {'generadoEn':'ahora','items':[2]}
            nuevo.conservar_fecha_si_no_cambio(salida, archivo)
            self.assertEqual(salida['generadoEn'], 'ahora')


class ValidadorAnalytics(unittest.TestCase):
    def test_detecta_modulo_actual_incompleto(self):
        val = modulo('validar_admin_analytics')
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            shutil.copytree(ROOT / 'admin', root / 'admin')
            shutil.copytree(ROOT / 'apps-script', root / 'apps-script')
            val.ROOT = root
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(val.main(), 0)
                path = root / 'admin/admin-vistas-completas.js'
                path.write_text(path.read_text().replace('google.visualization.GeoChart', 'MapaRetirado'))
                self.assertEqual(val.main(), 1)


if __name__ == '__main__':
    unittest.main()
