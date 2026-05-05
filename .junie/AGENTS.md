# Agent Instructions pre GNOME/GJS (GTK4 + libadwaita) Projekt

Tento projekt je natívna Linuxová desktopová aplikácia postavená na engine GJS (GNOME JavaScript) využívajúca GTK 4, knižnicu libadwaita a jazyk TypeScript. Pre dizajn používame Blueprint kompilátor.

PRI GENEROVANÍ KÓDU STRIKTNE DODRŽUJ TIETO PRAVIDLÁ:

## 1. Architektúra a GJS Špecifiká (VEĽMI DÔLEŽITÉ)
- **Toto NIE JE Node.js:** Aplikácia beží v GJS (SpiderMonkey). Absolútne NIKDY nepoužívaj Node.js moduly ako `fs`, `path`, `os`, `net`, `http`.
- **Správa súborov:** Pre prácu so súbormi a systémom používaj výhradne GNOME knižnice: `import Gio from 'gi://Gio';` a `import GLib from 'gi://GLib';`.
- **API a Sieť:** Na volanie HTTP requestov používaj štandardný webový `fetch()` (moderné GJS ho podporuje). Nepoužívaj `axios` ani `Soup`, aby bol kód kompatibilný s našimi Vitest/MSW testami.
- **Importy a Typy:** Vždy importuj explicitne verzie knižníc, napr. `import Gtk from 'gi://Gtk?version=4.0';` a `import Adw from 'gi://Adw?version=1';`.

## 2. Používateľské rozhranie (GTK4 & libadwaita)
- **Blueprint jazyk:** Všetky UI súbory sa píšu v adresári `src/ui/` do `.blp` súborov. Nikdy nepíš priamo XML (`.ui`). Ak meníš Blueprint súbor, pripomeň používateľovi, že sa kompiluje cez `npm run build:ui`.
- **GTK4 Konvencie:** Pamätaj, že toto je GTK4, nie GTK3. Widgety ako `Gtk.Box` nemajú vlastnosť `padding` (použi `margin-top`, `margin-start`, atď. a `spacing`).
- **Moderné Komponenty (libadwaita):** Vždy preferuj `Adw` widgety pred čistými `Gtk` widgetmi.
    - Namiesto tabuliek používaj `.boxed-list` (Gtk.ListBox) s `Adw.ActionRow`.
    - Na vycentrovanie obsahu používaj `Adw.Clamp`.
    - Na usporiadanie nastavení/zoznamov používaj `Adw.PreferencesGroup`.
    - Tlačidlá styluj pomocou vstavaných CSS tried, napr. `styles ["suggested-action", "pill"]`.

## 3. Testovanie (Vitest + MSW)
- **Beh testov:** Testy sa spúšťajú vo Viteste (čo je Node.js prostredie). Spúšťaj ich cez `npm run test`.
- **Mockovanie API:** Pre testovanie sieťových požiadaviek používame MSW (Mock Service Worker). Nikdy neprepísuj globálny `fetch` cez `vi.fn()`. Namiesto toho definuj odpovede v `tests/mocks/handlers.ts`.
- **Izolácia logiky:** UI kód (GJS) a aplikačná logika (API Client, spracovanie dát) musia byť oddelené. Logika musí byť testovateľná mimo bežiaceho GTK okna. Ak dopĺňaš funkcionalitu do `src/ApiClient.ts`, VŽDY pre ňu napíš test do `tests/`.

## 4. Dev Workflow
- Pri každej zmene v TypeScripte a Blueprint kóde najprv spusti build: `npm run build`.
- Pre otestovanie aplikácie v systéme spusti: `npm run start`.
- Kód musí dodržiavať TypeScript striktné typovanie. Vyhýbaj sa používaniu typu `any`.