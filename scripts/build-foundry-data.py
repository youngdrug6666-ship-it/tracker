"""Build small browser data from the full, read-only Foundry export.
Usage: python scripts/build-foundry-data.py /path/to/export-directory
Raw exports stay outside the repository; generated data retains provenance.
"""
import json,re,sys,gzip,base64,collections,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
paths=list(Path(sys.argv[1]).glob('tracker-foundry-full-*.json'))
parts=[json.loads(p.read_text()) for p in paths];parts.sort(key=lambda p:p['part'])
assert parts and [p['part'] for p in parts]==list(range(1,parts[0]['parts']+1))
assert len({p['exportedAt'] for p in parts})==1 and all(not p['errors'] for p in parts)
records=[r for p in parts for r in p['records']]
index={};issues=[]
def norm(s):return re.sub(r'\s*\([^)]*\)','',s.lower().replace('ё','е')).strip()
def uid(s):return re.sub(r'\.(Item|Actor)\.', '.',s)
for r in records:
 index[uid(r['uuid'])]=r['document']
 index[uid('Compendium.'+r['pack']+'.'+r['document']['_id'])]=r['document']
local=json.loads((root/'monsters_full_export.json').read_text());old={x['name'].lower():x for x in local}
verified={x['name'].lower():x for x in json.loads((root/'bestiary-structure.json').read_text())}
abilities=['str','dex','con','int','wis','cha'];alabel=dict(zip(abilities,['Сила','Ловкость','Телосложение','Интеллект','Мудрость','Харизма']))
skills=dict(zip(['acr','ani','arc','ath','dec','his','ins','itm','inv','med','nat','prc','prf','per','rel','slt','ste','sur'],['Акробатика','Уход за животными','Магия','Атлетика','Обман','История','Проницательность','Запугивание','Анализ','Медицина','Природа','Восприятие','Выступление','Убеждение','Религия','Ловкость рук','Скрытность','Выживание']))
modes={'walk':'Ходьба','fly':'Полёт','swim':'Плавание','burrow':'Копание','climb':'Лазание'}
senses={'darkvision':'Тёмное зрение','blindsight':'Слепое зрение','tremorsense':'Чувство вибрации','truesight':'Истинное зрение'}
damage=dict(zip(['acid','cold','fire','force','lightning','necrotic','poison','psychic','radiant','thunder','bludgeoning','piercing','slashing'],['кислота','холод','огонь','силовое поле','электричество','некротический','яд','психический','излучение','звук','дробящий','колющий','рубящий']))
conditions=dict(zip(['blinded','charmed','deafened','exhaustion','frightened','grappled','incapacitated','invisible','paralyzed','petrified','poisoned','prone','restrained','stunned','unconscious'],['ослепление','очарование','глухота','истощение','испуг','захват','недееспособность','невидимость','паралич','окаменение','отравление','сбивание с ног','опутывание','ошеломление','бессознательность']))
sections=['features','actions','bonus_actions','reactions','legendary_actions','lair_actions','regional_effects']
sectiontypes={'action':'actions','bonus':'bonus_actions','reaction':'reactions','legendary':'legendary_actions','lair':'lair_actions','special':'features','':'features'}
def num(v):
 try:return float(v or 0)
 except (ValueError,TypeError):return None
def signed(v):return ('+' if v>=0 else '')+str(int(v) if int(v)==v else v)
def refs(text,embedded=None):
 def sub(m):
  id,label=m.group(1),m.group(2);x=(embedded or {}).get(id.lstrip('.')) if id.startswith('.') else index.get(uid(id))
  if not x:
   if not label:issues.append({'kind':'unresolvedReference','uuid':id})
   return label or ''
  if x['type']=='spell':return '@UUID[Compendium.laaru-dnd5-hw.spells.'+x['_id']+']{'+(label or x['name'].split(' / ')[0])+'}'
  if x['type']=='npc':return '@UUID['+id+']{'+(label or x['name'].split(' / ')[0])+'}'
  return label or x['name'].split(' / ')[0]
 return re.sub(r'@(?:UUID|Compendium)\[([^\]]+)\](?:\{([^}]+)\})?',sub,text or '')
def text(value,embedded=None):
 s=refs(value,embedded)
 s=re.sub(r'<div id="gtx-trans"[\s\S]*$','',s)
 s=re.sub(r'</(?:p|div|li|h[1-6])\s*>|<br\s*/?>','\n',s,flags=re.I)
 s=re.sub(r'<[^>]*>','',s)
 return re.sub(r'\n\s*\n+','\n',s).strip()
def defense(t,labels):
 vals=list(t.get('value',[]));physical=[x for x in vals if x in ['bludgeoning','piercing','slashing']];other=[labels.get(x,x) for x in vals if x not in physical];b=t.get('bypasses',[])
 if physical:
  p=', '.join(labels[x] for x in physical)
  if 'mgc' in b:p+=' от немагических атак'
  if 'sil' in b:p+=' (кроме посеребрённого оружия)'
  if 'ada' in b:p+=' (кроме адамантинового оружия)'
  other.append(p)
 if t.get('custom'):other.append(t['custom'])
 return '; '.join(other)
output=[];section_changes=0;matched=0
for r in records:
 x=r['document']
 if r['kind']!='actor':continue
 s=x['system'];a=s.get('attributes',{});details=s.get('details',{});traits=s.get('traits',{});previous=old.get(x['name'].lower(),{});cr=num(details.get('cr')) or 0;prof=max(2,2+int(max(0,cr-1)//4));stats={k:{'score':s['abilities'][k]['value'],'mod':(s['abilities'][k]['value']-10)//2} for k in abilities};source=s.get('source',{})
 m={'name':x['name'],'uuid':r['uuid'],'source':source,'hp':a.get('hp',{}).get('max'),'cr':cr,'profBonus':prof,'stats':stats,'_foundryRaw':True,'_sensesUnverified':False,'legendaryCount':num(s.get('resources',{}).get('legact',{}).get('max')) or None}
 if num(a.get('ac',{}).get('flat')) is not None and a.get('ac',{}).get('flat') is not None:m['ac']=num(a['ac']['flat'])
 else:issues.append({'kind':'computedAC','monster':x['name']})
 movement=a.get('movement',{});unit='фт.' if movement.get('units')=='ft' else 'м' if movement.get('units')=='m' else (movement.get('units') or 'фт.')
 m['speed']=', '.join(modes[k]+' '+str(movement[k])+' '+unit for k in modes if (num(movement.get(k)) or 0)>0)+(' (парение)' if movement.get('hover') else '')
 sense=a.get('senses',{});ranges=sense.get('ranges',sense);m['senses']=', '.join(senses[k]+' '+str(ranges[k])+' '+('м' if sense.get('units')=='m' else 'фт.') for k in senses if (num(ranges.get(k)) or 0)>0)
 if sense.get('special'):m['senses']+=(', ' if m['senses'] else '')+sense['special']
 trained=[];passive=10+stats['wis']['mod'];saves=[]
 for k,v in s.get('skills',{}).items():
  p=num(v.get('value')) or 0;bonus=num(v.get('bonuses',{}).get('check'));ab=v.get('ability','wis');score=stats.get(ab,stats['wis'])['mod']+prof*p+(bonus or 0)
  if bonus is None:issues.append({'kind':'skillFormula','monster':x['name'],'skill':k});continue
  if p or bonus:trained.append(skills.get(k,k)+' '+signed(score))
  if k=='prc':passive=10+score+(num(v.get('bonuses',{}).get('passive')) or 0)
 for k,v in s['abilities'].items():
  p=num(v.get('proficient')) or 0;bonus=num(v.get('bonuses',{}).get('save'))
  if bonus is None:issues.append({'kind':'saveFormula','monster':x['name'],'ability':k});continue
  if p or bonus:saves.append(alabel[k]+' '+signed(stats[k]['mod']+prof*p+(bonus or 0)))
 m['skills']=', '.join(trained);m['saves']=', '.join(saves);m['passivePerception']=passive
 m['damage_resistances']=defense(traits.get('dr',{}),damage);m['damage_immunities']=defense(traits.get('di',{}),damage);m['damage_vulnerabilities']=defense(traits.get('dv',{}),damage);m['condition_immunities']=defense(traits.get('ci',{}),conditions)
 lang=traits.get('languages',{});m['languages']=', '.join(lang.get('value',[])+([lang['custom']] if lang.get('custom') else []))
 v=verified.get(x['name'].lower());usev=bool(v and v['hp']==m['hp'] and v['stats']==[stats[k]['score'] for k in abilities] and str(v['source']).lower()==str(source.get('book','')).lower())
 embedded={i['_id']:i for i in x.get('items',[])}
 for section in sections:m[section]=[]
 m['spells']=[i['name'] for i in x.get('items',[]) if i['type']=='spell']
 for i in x.get('items',[]):
  z=i.get('system',{});raw=z.get('description',{}).get('value','')
  if i['type']=='spell':continue
  if not raw:
   if re.match('Легендарн(?:ая устойчивость|ое сопротивление)',i['name'],re.I):raw='Если существо проваливает спасбросок, оно может вместо этого преуспеть. Использований в день: '+str(int(num(s.get('resources',{}).get('legres',{}).get('max')) or 0))+'.'
   else:continue
  if i['type'] not in ['feat','weapon']:continue
  desc=text(raw,embedded);activities=list(z.get('activities',{}).values());activation=activities[0].get('activation',{}).get('type','') if activities else z.get('activation',{}).get('type','');section=sectiontypes.get(activation,'features');name=i['name'];cost=None
  if section=='legendary_actions':cost=num(activities[0].get('activation',{}).get('value')) or 1
  # Source verification can correct automation activities on passive features.
  rule=next((rr for rr in v['rules'] if norm(rr['name'])==norm(name) and rr['attack']==bool(re.search('атака (?:оружием|заклинанием)|(?:рукопашная|дистанционная) атака',desc,re.I))),None) if usev else None
  if rule:
   if section!=rule['section']:section_changes+=1
   section=rule['section'];cost=rule.get('cost') or cost
   if rule.get('spellAbility'):
    spelllabel={'int':'Интеллект','wis':'Мудрость','cha':'Харизму'}.get(rule['spellAbility'])
    if spelllabel:desc=re.sub(r'(используя\s+)(?:Интеллект|Мудрость|Харизму|Харизма)(\s+в качестве)',r'\g<1>'+spelllabel+r'\g<2>',desc,flags=re.I)
  if re.match('Легендарные действия$',name,re.I):section='legendary_actions'
  if re.match('Легендарн(?:ая устойчивость|ое сопротивление)',name,re.I):section='features'
  if re.match('Логово:|Действия логова',name,re.I):section='lair_actions'
  if re.match('Региональные эффекты|Эффекты местности|Местные эффекты',name,re.I):section='regional_effects'
  if re.match('^(?:Заклинания|Врождённые заклинания|Врожденные заклинания)$',name,re.I) and not activation:
   # Modern monster spellcasting used as an action is stated in its own text.
   if re.search('творит одно|сотворяет одно|накладывает одно',desc,re.I):section='actions'
  uses=z.get('uses',{});recovery=uses.get('recovery',[]);recharge=next((rec for rec in recovery if rec.get('period')=='recharge'),None)
  if recharge and not re.search('перезарядка',name,re.I):
   threshold=num(recharge.get('formula'))
   if threshold:name+=' (перезарядка '+str(int(threshold))+('–6' if threshold<6 else '')+')'
  entry={'name':name,'description':desc,'_rawSection':True}
  if cost:entry['cost']=cost
  if rule and rule.get('creatures'):entry['creatureRefs']=rule['creatures']
  m[section].append(entry)
 output.append(m)
# Parameters come from spells, not inherited activity defaults (self/inst).
spellout=[]
for r in records:
 x=r['document']
 if x['type']!='spell':continue
 s=x['system'];p=s.get('properties',[]);spellout.append({'name':x['name'],'uuid':r['uuid'],'source':s.get('source',{}),'activation':s.get('activation',{}),'duration':s.get('duration',{}),'range':s.get('range',{}),'materials':s.get('materials',{}),'properties':p,'level':s.get('level'),'school':s.get('school'),'description':s['description']['value']})
# Only explicit non-optional grants imply a special subclass spell list.
access=collections.defaultdict(set);unresolved_grants=[]
for r in records:
 x=r['document']
 if x['type']!='subclass':continue
 s=x['system'];adv=s.get('advancement',{});adv=adv.values() if isinstance(adv,dict) else adv
 label=x['name']+(' ('+s['classIdentifier']+')' if s.get('classIdentifier') else '')
 for a in adv:
  if a.get('type')!='ItemGrant':continue
  cfg=a.get('configuration',{})
  if cfg.get('optional'):continue
  for it in cfg.get('items',[]):
   if it.get('optional'):continue
   target=index.get(uid(it.get('uuid','')))
   if target and target['type']=='spell':access[target['name']].add(label)
   elif not target:unresolved_grants.append({'subclass':x['name'],'uuid':it.get('uuid')})
# Translate parent identifiers to readable class names where available.
classnames={r['document']['system'].get('identifier'):r['document']['name'] for r in records if r['document']['type']=='class'}
for sp in spellout:
 sp['grantedSubclasses']=sorted(re.sub(r'\(([^)]+)\)$',lambda m:'('+classnames.get(m[1],m[1])+')',v) for v in access.get(sp['name'],[]))
payload={'monsters':output,'spells':spellout}
raw=json.dumps(payload,ensure_ascii=False,separators=(',',':')).encode();packed=base64.b64encode(gzip.compress(raw,mtime=0)).decode()
# Base64 ASCII parts remain small enough for connector uploads.
chunks=[packed[i:i+180000] for i in range(0,len(packed),180000)]
for p in (root/'data').glob('foundry-*.b64'):p.unlink()
for i,c in enumerate(chunks):(root/'data'/f'foundry-{i+1:02}.b64').write_text(c)
manifest={'version':1,'exportedAt':parts[0]['exportedAt'],'system':parts[0]['system'],'files':[f'data/foundry-{i+1:02}.b64' for i in range(len(chunks))],'sha256':hashlib.sha256(raw).hexdigest(),'monsters':len(output),'spells':len(spellout)}
(root/'foundry-data.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
report={'parts':len(parts),'records':len(records),'monsters':len(output),'spells':len(spellout),'subclassSpells':len(access),'explicitSubclassLinks':sum(map(len,access.values())),'verifiedSectionCorrections':section_changes,'issuesByKind':dict(collections.Counter(i['kind'] for i in issues)),'issues':issues,'unresolvedGrants':unresolved_grants}
(root/'foundry-data-audit.json').write_text(json.dumps(report,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['issues','unresolvedGrants']},ensure_ascii=False));print('payload bytes',len(raw),'gzip+base64',len(packed),'chunks',len(chunks))
