"""Build 2014 spell access metadata from explicit spell-source lookup links.
Input: spell-access-source.json downloaded from 5etools-src data/generated.
General spell selection (Magical Secrets, wizard-list subclasses) is excluded.
"""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
lookup=json.loads((root/'spell-access-source.json').read_text())
allowed={s.lower() for s in 'PHB TCE XGE SCAG DMG FTD EGW VRGR GGR ERLW SCC AI BGG IDRotF BMT AAG TDCSR SatO LLK'.split()}
classes=dict(zip('Wizard Sorcerer Warlock Cleric Druid Bard Paladin Ranger Artificer Barbarian Monk Fighter Rogue'.split(),'Волшебник Чародей Колдун Жрец Друид Бард Паладин Следопыт Изобретатель Варвар Монах Воин Плут'.split()))
labels={
'Divine Soul':'Божественная душа','Arcana Domain':'Домен магии','Peace Domain':'Домен мира','Clockwork Soul':'Заводная душа','Oath of the Watchers':'Клятва смотрителей','Circle of the Moon':'Круг луны','Nature Domain':'Домен природы','Death Domain':'Домен смерти','Circle of Spores':'Круг спор','Oathbreaker':'Клятвопреступник','Forge Domain':'Домен кузни','Grave Domain':'Домен упокоения','The Undead':'Нежить','Knowledge Domain':'Домен знаний','Swarmkeeper':'Хранитель роя','Oath of Conquest':'Клятва покорения','Aberrant Mind':'Аберрантный разум','Path of the Ancestral Guardian':'Путь предков','Twilight Domain':'Домен сумерек','Circle of Wildfire':'Круг дикого огня','The Undying':'Бессмертный','Battle Smith':'Боевой кузнец','Oath of the Crown':'Клятва короны','Oath of Vengeance':'Клятва мести','The Hexblade':'Ведьмовской клинок','Horizon Walker':'Странник горизонта','Monster Slayer':'Убийца монстров','Circle of the Land':'Круг земли','Life Domain':'Домен жизни','Oath of Devotion':'Клятва преданности','Path of the Totem Warrior':'Путь тотемного воина','The Fathomless':'Бездонный','Alchemist':'Алхимик','The Fiend':'Исчадие','Trickery Domain':'Домен обмана','The Archfey':'Архифея','The Genie':'Гений','Light Domain':'Домен света','Way of the Sun Soul':'Путь солнечной души','Tempest Domain':'Домен бури','Oath of Redemption':'Клятва искупления','Fey Wanderer':'Странник фей','The Great Old One':'Великий Древний','College of Glamour':'Коллегия очарования','Order Domain':'Домен порядка','Oath of Glory':'Клятва славы','Oath of the Ancients':'Клятва древних','Artillerist':'Артиллерист','War Domain':'Домен войны','The Celestial':'Небожитель','Way of Shadow':'Путь тени','Shadow Magic':'Теневая магия','Gloom Stalker':'Сумрачный охотник','Path of the Giant':'Путь великана','Arcane Archer':'Мистический лучник','Armorer':'Бронник','College of Spirits':'Коллегия духов','Circle of Stars':'Круг звёзд','School of Illusion':'Школа иллюзии','Way of the Open Hand':'Путь открытой ладони','Psi Warrior':'Пси-воин','Drakewarden':'Наездник на драконах','Chronurgy Magic':'Магия хронургии','Graviturgy Magic':'Магия гравитургии'}
variants={'Arctic':'Арктика','Coast':'Побережье','Desert':'Пустыня','Forest':'Лес','Grassland':'Луга','Mountain':'Горы','Swamp':'Болото','Underdark':'Подземье','Dao':'Дао','Djinni':'Джинн','Efreeti':'Ифрит','Marid':'Марид'}
old=json.loads((root/'spell-metadata.json').read_text());components={x['name'].lower().replace('’',"'"):x['components'] for x in old if 'components' in x}
result=[];unmatched=[]
for spell in json.loads((root/'spells_full.json').read_text()):
 name=spell['name'].split('/')[-1].strip();key=name.lower().replace('’',"'");book=spell.get('source',{}).get('book','').lower()
 entry=lookup.get(book,{}).get(key)
 # SRD aliases are allowed only for spells in the original PHB export.
 alias={'arcane hand':"bigby's hand",'arcane eye':'arcane eye','secret chest':"leomund's secret chest",'tiny hut':"leomund's tiny hut",'faithful hound':"mordenkainen's faithful hound",'magnificent mansion':"mordenkainen's magnificent mansion",'private sanctum':"mordenkainen's private sanctum",'floating disk':"tenser's floating disk",'acid arrow':"melf's acid arrow",'arcanist\'s magic aura':"nystul's magic aura"}
 if entry is None and book=='phb':entry=lookup.get(book,{}).get(alias.get(key,key))
 record={'name':name,'source':book.upper(),'classes':[],'subclasses':[],'accessKnown':entry is not None}
 if key in components:record['components']=components[key]
 if entry:
  for cs,values in entry.get('class',{}).items():
   if cs.lower() in allowed:
    record['classes'] += [classes[c] for c in values if c in classes]
  for cs,values in entry.get('classVariant',{}).items():
   if cs.lower() in allowed:
    for c,m in values.items():
     if c in classes and any(s.lower() in allowed for s in m.get('definedInSources',[])):record['classes'].append(classes[c]+' (TCE)')
  for cs,class_entries in entry.get('subclass',{}).items():
   if cs.lower() not in allowed:continue
   for c,sources in class_entries.items():
    for ss,subs in sources.items():
     if ss.lower() not in allowed:continue
     for short,m in subs.items():
      if short in ['Lore','Eldritch Knight','Arcane Trickster']:continue
      if m['name']=='Divine Soul' and key not in ['cure wounds','inflict wounds','bless','bane','protection from evil and good']:continue
      if m['name'] not in labels:raise ValueError('Untranslated subclass '+m['name'])
      label=labels[m['name']]+' ('+classes[c].lower()+')'
      if m.get('subSubclasses'):label+=' · '+', '.join(variants.get(v,v) for v in m['subSubclasses'])
      record['subclasses'].append(label)
 else:unmatched.append(spell['name'])
 record['classes']=sorted(set(record['classes']));record['subclasses']=sorted(set(record['subclasses']));result.append(record)
(root/'spell-metadata.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
(root/'spell-access-audit.json').write_text(json.dumps({'total':len(result),'matched':sum(x['accessKnown'] for x in result),'unknown':unmatched},ensure_ascii=False,indent=2))
print('Access matched:',sum(x['accessKnown'] for x in result),'/',len(result))
