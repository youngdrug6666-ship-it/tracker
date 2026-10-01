Structured movement, senses and proficiency data: https://github.com/5e-bits/5e-database/tree/main/src/2014/en (2014 SRD). Metadata only is used; Russian descriptions remain from the project's existing sources. Match requires English name, challenge rating and all six ability scores. This does not certify every description or custom creature.

Vecna metadata and action sections: https://5e14.dnd.su/bestiary/7943-vecna-the-archlich/

White dragon reference: https://5e14.dnd.su/bestiary/111-ancient-white-dragon/

MIT License

Copyright (c) [2018-2020] [Adrian Padua, Christopher Ward]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## Spell metadata and Strahd corrections
Spell components and class lists: 5e-bits/5e-database, src/2014/en/5e-SRD-Spells.json (MIT). English-name matching; missing metadata is left unknown. Extended Web and Bigby class/subclass lists checked against https://dnd.su/spells/227-web/ and https://dnd.su/spells/57-bigbys-hand/. Strahd section assignments and senses checked against https://dnd.su/bestiary/960-strahd-von-zarovich/. Descriptions remain from the existing exports.

## 2014 spell access audit
Replaced generic SRD subclass associations with filtered explicit 2014 spell-source lookup links from https://github.com/5etools-mirror-3/5etools-src/blob/main/data/generated/gendata-spell-source-lookup.json . 2024/UA sources, Magical Secrets, and broad wizard-list access are excluded. Divine Soul general cleric-list choice is excluded except its five named alignment spells. Circle of the Land terrain and Genie elemental patrons are preserved. All 1123 local spells are audited; 519 source/name pairs resolve, others remain explicitly unknown. No 2024 fallback or cross-book name-only match. Rebuild: python scripts/build-spell-access.py . The filtered source snapshot contains metadata only, no spell descriptions.

## Structural bestiary audit
Added compact metadata from 23 pre-2024 bestiary sources in 5etools-src/data/bestiary. Match requires English name, CR, HP and six scores. Russian entry matching uses curated bilingual names and unique mechanical signatures; unresolved entries remain in bestiary-structure-audit.json. This is a partial repair, not a guarantee of complete source fidelity. 1142 exported records match source stat blocks, 4333 entries map to explicit sections, 829 original section assignments differ. Optional MM Summon Devil variants are actions. Shared regular/legendary attack names are disambiguated by attack text. Examples cross-checked: https://dnd.su/multiverse/bestiary/6703-drow-matron-mother/ and https://dnd.su/bestiary/86-pit-fiend/.

A full read-only Foundry compendium exporter is provided in tools/foundry-export-tracker.js. Raw activation/activity records and embedded UUIDs should replace heuristic matching when provided. Foundry API references: https://foundryvtt.com/api/v13/classes/foundry.documents.collections.CompendiumCollection.html and https://foundryvtt.com/api/v13/classes/foundry.ClientDocument.html.
