import json

data = json.load(open('demo/data/demo-run.json', encoding='utf-8-sig'))
evs = data['events']
print('== STAGES ==')
for e in evs:
    if e['type'] == 'stage_started':
        d = e.get('data') or {}
        print(f"  {d.get('kind', '?')}: {e['message'].replace('Stage: ', '')}")
print('== STAGE RESULTS ==')
for e in evs:
    if e['type'] == 'stage_succeeded':
        print(f"  {e['message']}")
print('== CONSENSUS ==')
for e in evs:
    if e['type'] in ('consensus_round', 'consensus_verdict', 'consensus_arbitrated',
                     'consensus_repaired', 'consensus_final'):
        d = e.get('data') or {}
        print(f"--- {e['type']}: {e['message']}")
        if e['type'] == 'consensus_verdict':
            print(f"    {d.get('role')} {d.get('model')}: {d.get('verdict')}")
            for r in (d.get('reasons') or [])[:3]:
                print(f"      - {r}")
        if e['type'] == 'consensus_arbitrated':
            print(f"    conclusion={d.get('conclusion')} statement={d.get('statement')}")
            for c in (d.get('classification') or []):
                print(f"      {c['class']}: {c['reason'][:90]}")
        if e['type'] == 'consensus_final':
            print(f"    verdict={d.get('verdict')} rounds={d.get('rounds')} agree={d.get('agreement')}")
            print(f"    dissent={len(d.get('dissent') or [])} reviewers={len(d.get('reviewers') or [])}")