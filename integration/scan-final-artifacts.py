"""Local read-only scan. Never print credentials or upload recovery material."""
import json, pathlib, sys, zipfile

root = pathlib.Path(__file__).resolve().parent.parent
release = pathlib.Path(json.loads((root / 'integration/final-release.private.json').read_text())['directory'])
runtime = json.loads((release / 'previous-runtime-config/mobile-real-connection.private.json').read_text())
audit = json.loads((root / 'qa/audit/state.private.json').read_text())
needles = [runtime['credential'].encode(), audit['token'].encode(), b'http://127.0.0.1:63337', b'nexo_audit_test']
bundles = list((release / 'android-release-export').rglob('*.js'))
assert bundles, 'Missing distribution JavaScript export'
for f in bundles:
    content = f.read_bytes()
    assert not any(x in content for x in needles), 'Unexpected private or QA value in distribution export'
apk = release / 'Nexo-Ventas-1.0.1-v5.apk'
entries = 0
if apk.exists():
    with zipfile.ZipFile(apk) as archive:
        for name in archive.namelist():
            if name.startswith('assets/') or name.endswith('AndroidManifest.xml'):
                entries += 1
                assert not any(x in archive.read(name) for x in needles), 'Unexpected private or QA value in APK'
result = dict(distributionExportScanned=True, javaScriptBundles=len(bundles), apkScanned=apk.exists(), apkEntries=entries, operationalCredentialEmbedded=False, auditCredentialEmbedded=False, qaDestinationEmbedded=False)
(release / 'artifact-secret-scan.json').write_text(json.dumps(result, indent=2))
print(json.dumps(result))
