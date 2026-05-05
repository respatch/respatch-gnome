# Agent Instructions pre GNOME/GJS (GTK4 + libadwaita) Projekt

Tento projekt je natívna Linuxová desktopová aplikácia postavená na engine GJS (GNOME JavaScript) využívajúca GTK 4, knižnicu libadwaita a jazyk TypeScript. Pre dizajn používame Blueprint kompilátor.

PRI GENEROVANÍ KÓDU STRIKTNE DODRŽUJ TIETO PRAVIDLÁ:

# Role & Architecture Standards (MVVM Pattern)

Si hlavný architekt Respatch aplikácie. Tvojou úlohou je udržiavať kód modulárny, testovateľný a v súlade s GNOME Human Interface Guidelines.

## Architektúra projektu
- **UI Vrstva (View):** `src/ui/*.blp` a k nim prislúchajúce `window.ts` alebo `widgets/*.ts`. Tieto súbory riešia len zobrazenie a signály.
- **Logika (Services/Models):** `src/services/` (napr. `ApiClient.ts`, `MonitorService.ts`). Tieto triedy nesmú vedieť o existencii GTK widgetov. Vracajú čisté TS rozhrania (Interfaces).
- **Stavy (ViewModel/Stores):** `src/stores/`. Tu sa drží aktuálny stav aplikácie (napr. zoznam workerov). UI sa len "prihlási" k odberu zmien.

## Kódovacie pravidlá pre Agenta
- **Single Responsibility:** Jedna trieda = jedna zodpovednosť. `ApiClient` nerieši ukladanie tokenu do nastavení, na to máš `SettingsService`.
- **Inversion of Control:** Triedy by mali prijímať svoje závislosti (napr. ApiClient) v konštruktore, aby sa dali v testoch ľahko mockovať cez MSW.
- **Signals:** Využívaj GObject signály pre komunikáciu medzi modelom a UI. UI počúva na signál `notify::something`.

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
- **Aplikacne testovanie** Ked chces overit ci aplikacia sa skompiluje a zapne, pusti ju prikazom `/usr/bin/npm run start` nezabudni ju po spusteni killnut

## 4. Dev Workflow
- Pri každej zmene v TypeScripte a Blueprint kóde najprv spusti build: `npm run build`.
- Pre otestovanie aplikácie v systéme spusti: `npm run start`.
- Kód musí dodržiavať TypeScript striktné typovanie. Vyhýbaj sa používaniu typu `any`.

## 5. Práca s API a Serverovou Integráciou
- **Testovacie API:** Všetky requesty smeruj na základnú URL: `https://respatch.wip/_respatch/api/`.
- **Zdroj pravdy (Server):** Definíciu endpointov a ich logiku nájdeš v lokálnom PHP projekte:
  - Cesty (Routes): `/home/jozefm@no.dsidata.sk/phpProjects/contrib/respatch/server/config/routes.php`
  - Logika (Controller): `/home/jozefm@no.dsidata.sk/phpProjects/contrib/respatch/server/src/Controller/ApiController.php`
- **Overovanie štruktúry dát:** Predtým, než začneš implementovať spracovanie odpovede (parsing JSON) v TypeScript, MUSÍŠ si overiť reálny formát dát:
  1. Skús zavolať príslušný endpoint pomocou príkazu `wget -qO- --header="X-Respatch-Token: some_secure_hash_token_123" https://respatch.wip/_respatch/api/<endpoint>`. 
  2. Ak ti `wget` vráti prázdny výsledok, chybu, alebo ak nemáš prístup k bežiacemu serveru, **ZASTAV SA** a požiadaj používateľa, aby ti poskytol ukážku (dump) toho, čo tento endpoint reálne vracia.
- **Zákaz hádania:** Nikdy nepredpokladaj štruktúru JSON odpovede len na základe statickej analýzy PHP kódu, pokiaľ si ju neoveril úspešným volaním alebo dopytom na používateľa.

## 6. Data Persistence & Storage Strategy
Pri ukladaní dát rozlišuj tieto tri úrovne:

1. **Memory Cache (Runtime):**
- Dáta, ktoré zmiznú po zatvorení appky (zoznam logov správ).
- Implementácia: Jednoduché Class properties alebo `Map<string, any>`.

2. **GSettings (Konfigurácia):**
- Dáta, ktoré prežijú restart (nastavenia okna, URL k serveru, API Token).
- Implementácia: Používaj `Gio.Settings`. Schéma musí byť definovaná v `data/org.respatch.gschema.xml`.

3. **Cache Storage (Ostatné):**
- Ak by sme ukladali históriu správ, ktorá je príliš veľká pre GSettings.
- Implementácia: Používaj `GLib.get_user_cache_dir()` pre dočasné dáta alebo `GLib.get_user_data_dir()` pre trvalé dáta. Ukladaj ako JSON súbory cez `Gio.File`.

# 7. Localization & Internationalization (i18n)

Aplikácia musí byť od začiatku pripravená na preklad do viacerých jazykov (Slovenčina, Angličtina, atď.).

- **Gettext integrácia:** Na preklady používaj štandardný `gettext`. V každom TS súbore, ktorý obsahuje texty pre používateľa, musí byť import:
  `import { _ } from '../gettext.js';` (alebo príslušná cesta k helperu).
- **Použitie v kóde:** Všetky reťazce v TypeScript kóde obaľuj do funkcie `_()`, napr. `_("Settings")`, `_("Failed to fetch data")`.
- **Blueprint preklady:** V `.blp` súboroch používaj underscore pred názvom vlastnosti pre automatický preklad, napr. `title: _("Dashboard");` namiesto `title: "Dashboard";`.
- **Pluralizácia:** Ak prekladáš text s počtom (napr. "3 workery"), používaj funkciu `ngettext`.
- **Komentáre pre prekladateľov:** Ak je reťazec nejednoznačný, pridaj nad neho komentár začínajúci `///`, ktorý sa neskôr vyexportuje do `.pot` súboru.