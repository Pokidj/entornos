"""Build current website, bridge and documentation ZIPs without external dependencies.

Run from any working directory. Does not rebuild EXEs or publish the website.
"""
from pathlib import Path
import zipfile

PROJECT = Path(__file__).resolve().parents[1]
OUTPUTS = PROJECT.parent
BRIDGE = OUTPUTS / 'puente-fivem-configurable'
DOCUMENTS = ('README.md', 'DOCUMENTACION.md', 'CHANGELOG.md', 'REVISION.md')


def included(file):
    return (file.is_file() and not file.is_symlink()
            and not any(part in {'.git', '__pycache__', 'node_modules', '.venv'} for part in file.parts)
            and file.suffix not in {'.pyc', '.pyo', '.tmp'})


def add_tree(archive, directory):
    for file in sorted(directory.rglob('*')):
        if included(file):
            archive.write(file, file.relative_to(directory).as_posix())


def add_documents(archive, prefix=''):
    for name in DOCUMENTS:
        archive.write(PROJECT / name, prefix + name)


def build():
    required = [PROJECT / name for name in DOCUMENTS]
    required += [PROJECT / 'dist' / 'index.html', BRIDGE / 'Puente Entorno.exe',
                 PROJECT / 'dist' / 'downloads' / 'Puente Entorno.exe']
    for file in required:
        if not file.is_file():
            raise FileNotFoundError(f'Falta un archivo de entrega: {file}')
    if (BRIDGE / 'Puente Entorno.exe').read_bytes() != (PROJECT / 'dist' / 'downloads' / 'Puente Entorno.exe').read_bytes():
        raise ValueError('El EXE del puente y el de descarga de la web son distintos.')

    pending = []
    try:
        for name, kind in (('entorno-generator-ultima-version.zip', 'web'),
                           ('puente-fivem-configurable.zip', 'bridge'),
                           ('documentacion-entorno.zip', 'docs')):
            destination = OUTPUTS / name
            temporary = destination.with_suffix('.zip.tmp')
            pending.append((temporary, destination))
            with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED) as archive:
                if kind == 'web':
                    add_tree(archive, PROJECT / 'dist')
                    add_documents(archive)
                elif kind == 'bridge':
                    add_tree(archive, BRIDGE)
                    add_documents(archive, 'docs/')
                else:
                    add_documents(archive)
            with zipfile.ZipFile(temporary) as archive:
                corrupt = archive.testzip()
                if corrupt:
                    raise ValueError(f'Archivo ZIP dañado: {corrupt}')
                expected = {('docs/' if kind == 'bridge' else '') + n for n in DOCUMENTS}
                if not expected.issubset(archive.namelist()):
                    raise ValueError(f'Falta documentación en {name}')
        for temporary, destination in pending:
            temporary.replace(destination)
            print(f'OK: {destination.name}')
    finally:
        for temporary, _ in pending:
            if temporary.exists():
                temporary.unlink()


if __name__ == '__main__':
    build()
