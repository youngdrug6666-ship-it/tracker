"""Conservative alignment of Russian exports to explicit 2014 monster sections.
Never match by CR alone. Require English name, CR, HP and all six scores.
Unmatched entries remain reported for review, not silently reclassified.
"""
import json,re,collections
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=json.loads((root/'bestiary-structure-source.json').read_text());local=json.loads((root/'monsters_full_export.json').read_text())
sections=['features','actions','bonus_actions','reactions','legendary_actions','lair_actions','regional_effects']
def norm(s):return re.sub(r'\s*\([^)]*\)','',s.lower().replace('ё','е')).strip()
def english(m):return m['name'].split('/')[-1].strip().lower()
def signature(e):
 t=e.get('description','');dice=re.findall(r'(?:\d+)?d\d+(?:\s*[+-]\s*\d+)?',t,re.I);dice=[re.sub(r'\s','',d.lower()) for d in dice if not d.lower().startswith('1d20')]
 hit=re.search(r'1d20\s*\+\s*(\d+)',t)
 dc=re.findall(r'\[\[/save\s+[^\]]*?(?:dc=|\s)(\d+)\]\]',t,re.I)
 dc+=re.findall(r'(?:Сл|СЛ|DC)\s*(\d+)',t)
 return bool(re.search(r'атака (?:оружием|заклинанием)|(?:рукопашная|дистанционная) атака',t,re.I)),hit[1] if hit else None,tuple(sorted(dice)),tuple(sorted(set(map(int,dc))))
def srcsig(e):return e['attack'],e.get('hit'),tuple(sorted(e['dice'])),tuple(sorted(set(e['dc'])))
aliases={'мультиатака':'multiattack','заклинания':'spellcasting','врожденные заклинания':'innate spellcasting','легендарная устойчивость':'legendary resistance','легендарное сопротивление':'legendary resistance','устойчивость к магии':'magic resistance','магическое оружие':'magic weapons','аура страха':'fear aura','наследие фей':'fey ancestry','чувствительность к солнцу':'sunlight sensitivity','чувствительность к солнечному свету':'sunlight sensitivity','особое снаряжение':'special equipment','божественное пламя':'divine flame','изменчивая благосклонность лолт':"lolth's fickle favor",'изменчивая благосклонность лолс':"lolth's fickle favor",'призыв слуги':'summon servant','подчинение демона':'compel demon','сотворение заклинания':'cast a spell','наложение заклинания':'cast a spell','демонический посох':'demon staff','скипетр щупалец':'tentacle rod','жезл из щупалец':'tentacle rod','паучьи лапы':'spider climb','регенерация':'regeneration','перевертыш':'shapechanger','туманный побег':'misty escape','слабости вампира':'vampire weaknesses','очарование':'charm','дети ночи':'children of the night','призыв дьявола':'summon devil','призыв демона':'summon demon'}
byname=collections.defaultdict(list)
for m in source:byname[m['name'].lower()].append(m)
pairs=[];unmatched=[]
for m in local:
 candidates=[s for s in byname[english(m)] if str(s.get('cr'))==str(m['cr']) and s.get('hp')==m['hp'] and s['stats']==[m['stats'][k]['score'] for k in ['str','dex','con','int','wis','cha']]]
 # Same numeric version with different source structures is ambiguous; prefer MPMM
 # only where local spellcasting explicitly says one spell from a daily list.
 if len(candidates)>1:
  unique={json.dumps([(e['section'],e['name']) for e in s['entries']]+s['spellcasting'],sort_keys=True) for s in candidates}
  if len(unique)>1:
   ranked=sorted(candidates,key=lambda s:sum(signature(e)==srcsig(se) for k in sections for e in m.get(k,[]) for se in s['entries'] if signature(e)[0] or len(signature(e)[2])+len(signature(e)[3])>=2),reverse=True)
   if len(ranked)>1 and ranked[0]['source']!='MPMM':unmatched.append({'name':m['name'],'reason':'ambiguous source versions'});continue
   candidates=ranked[:1]
 if not candidates:unmatched.append({'name':m['name'],'reason':'no exact source/stat match'});continue
 pairs.append((m,candidates[0]))
# Learn bilingual names only from unique rich mechanical signatures.
votes=collections.defaultdict(set)
for m,s in pairs:
 for k in sections:
  for e in m.get(k,[]):
   sig=signature(e)
   if not(sig[0] and sig[1] or len(sig[2])+len(sig[3])>=2):continue
   found=[se for se in s['entries'] if srcsig(se)==sig]
   if len(found)==1:votes[norm(e['name'])].add(norm(found[0]['name']))
for ru,en in votes.items():
 if len(en)==1 and ru not in aliases:aliases[ru]=next(iter(en))
output=[];changes=[];unknownentries=[]
for m,s in pairs:
 rules=[]
 for k in sections:
  for e in m.get(k,[]):
   name=norm(e['name']);sig=signature(e);en=aliases.get(name)
   if en in ['spellcasting','innate spellcasting'] and s['spellcasting']:
    sc=s['spellcasting'][0];rules.append({'name':e['name'],'attack':False,'section':sc['section'],'spellAbility':sc['ability'],'spellDC':sc['dc']});
    if k!=sc['section']:changes.append({'monster':m['name'],'entry':e['name'],'from':k,'to':sc['section']})
    continue
   found=[se for se in s['entries'] if en and norm(se['name'])==en and se['attack']==sig[0]]
   if len(found)!=1:
    found=[se for se in s['entries'] if srcsig(se)==sig] if sig[0] and sig[1] or len(sig[2])+len(sig[3])>=2 else []
   if len(found)==1:
    se=found[0];rules.append({'name':e['name'],'attack':sig[0],'section':se['section'],'cost':se.get('cost') or (1 if se['section']=='legendary_actions' else None),'creatures':se['creatures']})
    if k!=se['section']:changes.append({'monster':m['name'],'entry':e['name'],'from':k,'to':se['section']})
   elif not name.startswith('логово:') and name not in ['легендарные действия','действия логова']:
    unknownentries.append({'monster':m['name'],'entry':e['name'],'section':k})
 output.append({'name':m['name'],'source':s['source'],'cr':m['cr'],'hp':m['hp'],'stats':s['stats'],'rules':rules,'legendaryCount':s['legendaryCount'],'senses':s.get('senses',[]),'passive':s.get('passive'),'skill':s.get('skill',{}),'save':s.get('save',{}),'speed':s.get('speed',{}),'languages':s.get('languages',[])})
(root/'bestiary-structure.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')))
(root/'bestiary-structure-audit.json').write_text(json.dumps({'total':len(local),'sourceMatched':len(pairs),'entriesResolved':sum(len(m['rules']) for m in output),'sectionChanges':len(changes),'changes':changes,'unresolvedEntries':unknownentries,'unmatchedMonsters':unmatched},ensure_ascii=False,indent=2))
print({'sourceMatched':len(pairs),'entriesResolved':sum(len(m['rules']) for m in output),'sectionChanges':len(changes),'unresolvedEntries':len(unknownentries),'unmatchedMonsters':len(unmatched)})
for m in output:
 if english(m) in ['drow matron mother','pit fiend']:print(m['name'],[(r['name'],r['section']) for r in m['rules']])
