import json

data = json.load(open('demo/data/demo-run.json', encoding='utf-8-sig'))
evs = data['events']
print('== verification_limited (stage pairing) ==')
for e in evs:
    if e['type'] == 'verification_limited':
        d = e.get('data') or {}
        print(f"  stage_id={e.get('stage_id')} :: {d.get('limitations')}")
print('== consensus_repaired ==')
for e in evs:
    if e['type'] == 'consensus_repaired':
        print(f"  {e.get('data')}")
print('== final keys ==')
fin = next(e for e in evs if e['type'] == 'consensus_final')
print('  ', sorted((fin.get('data') or {}).keys()))
print('  unverified_checks:', (fin.get('data') or {}).get('unverified_checks'))
print('  dismissed:', (fin.get('data') or {}).get('dismissed'))
print('== task fields ==')
t = data['task']
print('  risk:', t.get('risk_level'), 'status:', t.get('status'), 'mode constraints:', t.get('constraints'))