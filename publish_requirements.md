# Flathub Publication Requirements Audit
## Aplikácia: `sk.tito10047.respatch`
**Dátum auditu:** 2026-05-10  
**Zdroj požiadaviek:** https://docs.flathub.org/docs/for-app-authors/requirements

---

## Legenda
- ✅ **SPLNENÉ** — požiadavka je splnená
- ⚠️ **UPOZORNENIE** — čiastočne splnené alebo riziko
- ❌ **KRITICKÉ** — požiadavka nie je splnená, blokuje publikáciu

---

## 1. Inclusion Policy (Politika zahrnutia)

| # | Požiadavka | Stav | Poznámka |
|---|-----------|------|----------|
| 1.1 | Aplikácia musí byť funkčná a bez viditeľných chýb | ✅ | Aplikácia sa spúšťa, zobrazuje hlavné okno |
| 1.2 | Nie je to konzolová aplikácia | ✅ | GTK4/libadwaita grafická aplikácia |
| 1.3 | Nie je to minimálna/wrapper aplikácia | ✅ | Plnohodnotná monitoring aplikácia |
| 1.4 | Nie je to shell/DE extension | ✅ | Samostatná aplikácia |
| 1.5 | Nie je to tray-only aplikácia | ✅ | Má plné okno UI |
| 1.6 | Nie je to systémový nástroj pre host | ✅ | Monitoring nástroj pre Symfony |
| 1.7 | Nie je environment-locked | ⚠️ | Vyžaduje bežiaci Symfony Messenger server — je to **host-dependent** aplikácia. Revieweri môžu namietať, že bez servera je aplikácia nefunkčná. Treba to jasne uviesť v popise. |
| 1.8 | Nie je duplicate/conflicting submission | ✅ | Unikátna aplikácia |
| 1.9 | Nie je Windows/Wine emulácia | ✅ | Natívna Linux aplikácia |

---

## 2. Application ID

| # | Požiadavka | Stav | Poznámka |
|---|-----------|------|----------|
| 2.1 | Reverse-DNS formát `{tld}.{vendor}.{product}` | ✅ | `sk.tito10047.respatch` |
| 2.2 | Max 255 znakov, min 3 komponenty, max 5 komponentov | ✅ | 3 komponenty |
| 2.3 | Komponenty obsahujú len `[A-Z][a-z][0-9]_`, dash len v poslednom | ✅ | Všetky komponenty valídne |
| 2.4 | Domain portion v lowercase | ✅ | `sk.tito10047` |
| 2.5 | ID nekončí `.desktop`, `.app`, `.linux` | ✅ | Končí `.respatch` |
| 2.6 | ID sa zhoduje s `<id>` tagom v Metainfo | ✅ | Zhoduje sa |
| 2.7 | Kontrola nad doménou `tito10047.sk` | ⚠️ | **RIZIKO:** Treba overiť, či autor vlastní/kontroluje doménu `tito10047.sk`. Ak nie, Flathub verification nebude možná. Doména musí byť dostupná cez HTTPS. |
| 2.8 | Nepoužíva chránené prefixy (`org.gnome.`, `org.kde.`) | ✅ | Používa `sk.` prefix |

---

## 3. License (Licencia)

| # | Požiadavka | Stav | Poznámka |
|---|-----------|------|----------|
| 3.1 | Licencia umožňuje redistribúciu | ✅ | MIT licencia |
| 3.2 | Licencia správne uvedená v MetaInfo | ✅ | `<project_license>MIT</project_license>` |
| 3.3 | Licencia sa zhoduje so zdrojovým kódom | ✅ | MIT v repozitári |
| 3.4 | **License súbory nainštalované** pre každý modul do `$FLATPAK_DEST/share/licenses/$FLATPAK_ID` | ❌ | **KRITICKÉ:** V manifeste chýba inštalácia licenčných súborov pre moduly `blueprint-compiler`, `esbuild` a `respatch`. Flatpak builder to môže urobiť automaticky, ale len ak je LICENSE súbor v root adresári zdroja. Treba overiť a prípadne pridať manuálne. |

---

## 4. Permissions (Oprávnenia)

| # | Požiadavka | Stav | Poznámka |
|---|-----------|------|----------|
| 4.1 | Minimálne statické oprávnenia | ✅ | Len sieť, IPC, wayland/x11, dri, notifikácie |
| 4.2 | `--share=network` — odôvodnené? | ✅ | Aplikácia komunikuje so Symfony serverom — sieť je nevyhnutná |
| 4.3 | `--device=dri` — odôvodnené? | ⚠️ | Potrebné pre GPU rendering GTK4. Akceptovateľné, ale revieweri môžu pýtať zdôvodnenie. |
| 4.4 | `--talk-name=org.freedesktop.Notifications` | ✅ | Aplikácia posiela desktop notifikácie — odôvodnené |
| 4.5 | Žiadne `--filesystem=host` alebo nadmerné oprávnenia | ✅ | Žiadne |

---

## 5. No Network Access During Build

| # | Požiadavka | Stav | Poznámka |
|---|-----------|------|----------|
| 5.1 | Žiadny `--share=network` v `build-args` | ✅ | Nie je použité |
| 5.2 | Všetky závislosti sú v manifeste ako sources | ⚠️ | Pozri bod 6 — esbuild je precompiled binary |

---

## 6. Building from Source (Buildovanie zo zdrojov)

| # | Požiadavka | Stav | Poznámka |
|---|-----------|------|----------|
| 6.1 | Hlavná aplikácia buildovaná zo zdrojov | ✅ | `respatch` modul buildovaný cez meson |
| 6.2 | Všetky runtime závislosti buildované zo zdrojov | ❌ | **KRITICKÉ:** `esbuild` je **precompiled binary** stiahnutý z NPM registry (`linux-x64-0.21.1.tgz`). Toto porušuje "Building from source" požiadavku. Výnimka môže byť udelená pre well-known vendors, ale esbuild nie je garantovaná výnimka. **Riešenie:** Požiadať o výnimku v PR, alebo použiť esbuild zo GNOME SDK (ak je dostupný), alebo prebuildovať esbuild zo zdrojov. |

---

## 7. Localisation Policy (Lokalizácia)

| # | Požiadavka | Stav | Poznámka |
|---|-----------|------|----------|
| 7.1 | Kompletná anglická lokalizácia UI | ⚠️ | Aplikácia má gettext infraštruktúru (`po/` adresár), ale treba overiť, či sú **všetky** UI texty preložené do angličtiny a či je `.pot` súbor aktuálny. |
| 7.2 | Desktop file v angličtine | ✅ | `Name=Respatch`, `Comment=Symfony Messenger Monitor` |
| 7.3 | MetaInfo v angličtine | ✅ | Celý metainfo.xml je v angličtine |

---

## 8. Stable Releases (Stabilné vydania)

| # | Požiadavka | Stav | Poznámka |
|---|-----------|------|----------|
| 8.1 | Flathub stable repo — len stabilný softvér | ❌ | **KRITICKÉ:** Verzia `0.1.0-beta` a `0.1.1-beta` obsahuje slovo **"beta"**. Flathub stable repo neprijíma beta softvér. Beta repo neprijíma nové submissions. **Riešenie:** Vydať stabilnú verziu napr. `0.1.0` alebo `1.0.0` bez "beta" suffixu. |
| 8.2 | Žiadne nightly/dev snapshots | ✅ | Nie je nightly |

---

## 9. Required Files (Povinné súbory)

| # | Požiadavka | Stav | Poznámka |
|---|-----------|------|----------|
| 9.1 | Manifest na top-level, pomenovaný podľa App ID | ✅ | `sk.tito10047.respatch.yml` na top-level |
| 9.2 | Runtime hostovaný na Flathub, najnovšia verzia | ⚠️ | `org.gnome.Platform` verzia `46` — treba overiť, či je to najnovšia verzia v čase submission. Aktuálne GNOME runtime je **47** (GNOME 47). **Odporúčanie:** Aktualizovať na `runtime-version: '47'`. |
| 9.3 | `flathub.json` pre obmedzenie architektúry | ❌ | **KRITICKÉ:** esbuild binary je len pre `linux-x64` (x86_64). Flathub builduje aj pre `aarch64`. Build pre aarch64 zlyhá. **Riešenie:** Pridať `flathub.json` s `{"only-arches": ["x86_64"]}` alebo zabezpečiť aarch64 verziu esbuild. |
| 9.4 | Dependency manifest pre npm/yarn závislosti | ❌ | **KRITICKÉ:** Aplikácia používa npm závislosti (TypeScript, esbuild atď.), ale tieto nie sú v manifeste ako sources. Flathub nemá sieťový prístup počas buildu. Treba použiť `flatpak-node-generator` na vygenerovanie `generated-sources.json`. |

---

## 10. Required Metadata (Povinné metadáta)

| # | Požiadavka | Stav | Poznámka |
|---|-----------|------|----------|
| 10.1 | MetaInfo súbor prechádza validáciou | ✅ | `appstreamcli validate --pedantic --no-net` prechádza |
| 10.2 | Desktop súbor | ✅ | `sk.tito10047.respatch.desktop` existuje |
| 10.3 | Ikona — SVG alebo min 256x256 PNG | ✅ | SVG ikona + PNG vo všetkých veľkostiach vrátane 256x256 |
| 10.4 | Ikona správne pomenovaná a nainštalovaná | ✅ | `sk.tito10047.respatch.svg/png` v správnych adresároch |
| 10.5 | `<developer id="...">` tag v MetaInfo | ✅ | `<developer id="sk.tito10047"><name>Jozef Môstka</name></developer>` |
| 10.6 | `<launchable>` tag | ✅ | `<launchable type="desktop-id">sk.tito10047.respatch.desktop</launchable>` |
| 10.7 | `<content_rating>` OARS tag | ✅ | `<content_rating type="oars-1.1" />` |
| 10.8 | `<releases>` s aspoň jedným vydaním | ✅ | Verzia `0.1.1-beta` s dátumom `2025-05-10` |
| 10.9 | Screenshot alebo video | ✅ | Screenshot + WebM screencast |
| 10.10 | Žiadne trademark violations v názve/ikone | ✅ | "Respatch" je originálny názov |

---

## 11. Generative AI Policy

| # | Požiadavka | Stav | Poznámka |
|---|-----------|------|----------|
| 11.1 | PR nesmie byť otvorený/generovaný AI agentom | ⚠️ | **UPOZORNENIE:** Časť kódu a PR správa bola generovaná s pomocou AI (Junie). Flathub explicitne zakazuje PR otvorené AI agentmi. **PR musí otvoriť ľudský autor manuálne.** Kód musí byť zmysluplne reviewovaný a upravený človekom. |

---

## Súhrn kritických problémov (blokkery)

| Priorita | Problém | Riešenie |
|----------|---------|----------|
| 🔴 KRITICKÉ | **Beta verzia** — `0.1.0-beta` nie je akceptovaná v stable repo | Vydať `0.1.0` bez beta suffixu |
| 🔴 KRITICKÉ | **esbuild je precompiled binary** — porušuje "build from source" | Požiadať o výnimku v PR alebo riešiť inak |
| 🔴 KRITICKÉ | **Chýba `flathub.json`** — build zlyhá na aarch64 | Pridať `{"only-arches": ["x86_64"]}` |
| 🔴 KRITICKÉ | **Chýba dependency manifest** pre npm závislosti | Spustiť `flatpak-node-generator` |
| 🔴 KRITICKÉ | **Chýbajú license súbory** v `$FLATPAK_DEST/share/licenses/` | Pridať inštaláciu LICENSE do každého modulu |
| 🟡 UPOZORNENIE | **Runtime verzia 46** — možno nie je najnovšia | Aktualizovať na `47` |
| 🟡 UPOZORNENIE | **Kontrola nad doménou** `tito10047.sk` | Overiť vlastníctvo domény pre verification |
| 🟡 UPOZORNENIE | **Host-dependent** — vyžaduje Symfony server | Jasne uviesť v popise aplikácie |
| 🟡 UPOZORNENIE | **AI policy** — PR nesmie otvoriť AI | PR otvoriť manuálne ľudský autor |

---

## Odporúčaný postup pred submission

1. **Vydať stabilnú verziu** — odstrániť "beta" zo všetkých verzií, vydať `v0.1.0`
2. **Pridať `flathub.json`** — obmedziť build na `x86_64` kvôli esbuild binary
3. **Vygenerovať npm dependency manifest** — použiť `flatpak-node-generator npm package-lock.json -o generated-sources.json`
4. **Pridať license súbory** — do každého modulu v manifeste pridať inštaláciu LICENSE
5. **Aktualizovať runtime** na `runtime-version: '47'`
6. **Overiť doménu** `tito10047.sk` — či je dostupná a pod kontrolou autora
7. **PR otvoriť manuálne** — nie cez AI agenta
8. **Požiadať o výnimku pre esbuild** — v PR popísať prečo je precompiled binary nevyhnutný
