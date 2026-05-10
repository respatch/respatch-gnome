# Flathub Requirements Audit — sk.mostka.Respatch
**Dátum auditu:** 2025-05-10  
**Verzia aplikácie:** 1.0.0  
**Zdroj požiadaviek:** `02-requirements.md` (Flathub Requirements)

---

## Legenda
- ✅ **SPLNENÉ** — požiadavka je splnená
- ⚠️ **UPOZORNENIE** — potenciálny problém, treba riešiť alebo zdôvodniť
- ❌ **BLOKER** — kritická požiadavka, ktorá nie je splnená a musí byť opravená pred submission

---

## 1. Inclusion Policy

### 1.1 Functional scope
✅ Aplikácia má jasný funkčný rozsah: monitoring Symfony Messenger transportov, správa failed messages, desktop notifikácie.

### 1.2 Console software
✅ Nie je konzolová aplikácia — má plné GTK4/libadwaita GUI.

### 1.3 Minimal submissions / thin wrapper
✅ Nie je thin wrapper — obsahuje vlastnú logiku (polling, notifikácie, správa projektov, MVVM architektúra).

### 1.4 Tray-only
✅ Má plné hlavné okno, nie je tray-only.

### 1.5 Host-dependent applications
⚠️ **POTENCIÁLNY BLOKER — vyžaduje diskusiu s reviewermi**

Požiadavka hovorí: *"Applications that rely on host components or complicated post installation setups for core functionality will not be accepted. Exceptions to this can be considered on a case by case basis."*

Respatch vyžaduje bežiaci Symfony Messenger server s nainštalovaným Respatch endpointom. Bez servera aplikácia zobrazí len welcome screen a nie je plne funkčná.

**Argumenty pre akceptáciu (exception):**
- Aplikácia je klient-server nástroj (podobne ako Postman, Insomnia, alebo databázoví klienti) — tieto sú na Flathub bežne akceptované
- Server nie je "host component" — je to vzdialený server, nie lokálna závislosť
- Post-installation setup nie je "complicated" — server-side inštalácia je štandardná Symfony bundle
- Metainfo obsahuje jasné upozornenie v prvom `<p>` tagu description
- Aplikácia je plne funkčná v rámci svojho use-case (monitoring existujúceho servera)

**Odporúčanie:** Pred submission sa opýtať reviewerov cez GitHub Issues, či je tento typ klient-server aplikácie akceptovateľný.

### 1.6 Generative AI policy
⚠️ **DÔLEŽITÉ UPOZORNENIE**

Flathub explicitne zakazuje:
- PR otvorené alebo automatizované AI nástrojmi
- Kód napísaný prevažne AI bez zmysluplného ľudského review
- Automatické Copilot review

**Stav:** Väčšina kódu bola generovaná AI agentom (Junie). Toto je potenciálne porušenie politiky.

**Odporúčanie:**
1. Používateľ musí osobne review-ovať každý commit a PR
2. PR otvoriť manuálne, vlastnými slovami
3. Vypnúť Copilot review: https://github.com/settings/copilot/coding_agent
4. Byť pripravený zdôvodniť každú časť kódu reviewerom

---

## 2. Application ID

### 2.1 Formát ID
✅ `sk.mostka.Respatch` — 3 komponenty, reverse-DNS formát, nepresahuje 255 znakov.

### 2.2 Povolené znaky
⚠️ **UPOZORNENIE — uppercase v poslednom komponente**

Požiadavka: *"Each component must contain only the characters `[A-Z][a-z][0-9]_`"* — uppercase je technicky povolené.

Avšak požiadavka tiež hovorí: *"The domain portion must be in lowercase"* — `sk.mostka` je lowercase ✅. Posledný komponent `Respatch` má uppercase prvé písmeno, čo je GNOME konvencia (PascalCase) a je technicky povolené podľa pravidiel.

`appstreamcli validate --pedantic` vydáva warning o uppercase — nie je to error, ale revieweri môžu upozorniť.

**Odporúčanie:** Ak revieweri požiadajú o zmenu, zvážiť `sk.mostka.respatch` (lowercase).

### 2.3 Doménová kontrola
✅ `mostka.sk` je doména vo vlastníctve autora, dostupná cez HTTPS.

### 2.4 Zhoda ID v metainfo
✅ `<id>sk.mostka.Respatch</id>` v metainfo.xml zhodné s manifestom.

### 2.5 Najnovší runtime
✅ Manifest používa `runtime-version: '50'` — najnovší stabilný GNOME runtime (GNOME 50.1 podľa release.gnome.org/calendar).

---

## 3. License

### 3.1 Licencia v metainfo
✅ `<project_license>MIT</project_license>` v metainfo.xml.

### 3.2 Zhoda licencie so zdrojom
✅ `package.json` deklaruje `"license": "MIT"`, zhodné s `<project_license>MIT</project_license>` v metainfo.xml.

### 3.3 Inštalácia license súborov
✅ License súbory sú inštalované pre všetky 3 moduly:
- `respatch/LICENSE` — cez `data/meson.build`
- `blueprint-compiler/COPYING` — cez `post-install` v manifeste
- `esbuild/LICENSE.md` — cez `build-commands` v manifeste

---

## 4. Permissions (finish-args)

Aktuálne finish-args:
```yaml
- --share=network
- --share=ipc
- --socket=fallback-x11
- --socket=wayland
- --device=dri
- --talk-name=org.freedesktop.Notifications
```

### 4.1 `--share=network`
✅ Oprávnené — aplikácia komunikuje so vzdialeným Symfony serverom cez HTTP/HTTPS.

### 4.2 `--share=ipc`
✅ Štandardné pre GTK aplikácie s X11 fallback.

### 4.3 `--socket=fallback-x11` + `--socket=wayland`
✅ Štandardné pre moderné GTK4 aplikácie.

### 4.4 `--device=dri`
✅ Potrebné pre GPU akceleráciu v GTK4.

### 4.5 `--talk-name=org.freedesktop.Notifications`
✅ Potrebné pre desktop notifikácie — aplikácia ich explicitne používa.

### 4.6 Chýbajúce oprávnenia
✅ Žiadne zbytočné oprávnenia (`--filesystem`, `--system-talk-name`, atď.) nie sú prítomné.

---

## 5. No network access during build

✅ Manifest nepoužíva `--share=network` v `build-args`.
✅ `generated-sources.json` (202KB, 356 npm sources) je prítomný pre offline npm build.
✅ esbuild je buildovaný zo zdrojov (Go source tarball + vendored deps).
✅ blueprint-compiler je buildovaný z git source.

---

## 6. Building from source

✅ Všetky moduly sú buildované zo zdrojov:
- `blueprint-compiler` — git source z GNOME GitLab
- `esbuild` — Go source tarball z GitHub + vendored `golang.org/x/sys`
- `respatch` — git source z `github.com/mostka-sk/respatch-gnome`

---

## 7. Localisation policy

✅ Aplikácia má anglickú lokalizáciu (všetky UI texty sú v angličtine).
✅ SK preklad existuje v `po/sk.po`.
⚠️ Chýba anglický `.po` súbor (`po/en.po`) — nie je striktne vyžadovaný ak je angličtina default, ale niektorí revieweri môžu upozorniť.

---

## 8. Stable releases

✅ Verzia `1.0.0` — žiadne beta/alpha/nightly označenie.
✅ `<release version="1.0.0" date="2026-05-10">` v metainfo — dátum je správny (aktuálny dátum je 2026-05-10).

---

## 9. Required files

### 9.1 Manifest
✅ `sk.mostka.Respatch.yml` je na top-level Flathub submission priečinka.

### 9.2 flathub.json
✅ Nie je potrebný — build prebieha pre obe architektúry (x86_64 + aarch64) čo je default.

### 9.3 Dependency manifest
✅ `generated-sources.json` existuje a je referencovaný v manifeste.

---

## 10. Required metadata

### 10.1 Metainfo (AppStream)
✅ `data/sk.mostka.Respatch.metainfo.xml` existuje a je inštalovaný.
✅ `appstreamcli validate --pedantic --no-net` prechádza (len warning o uppercase ID).

### 10.2 Host-dependent disclosure v description
✅ Prvý `<p>` tag obsahuje upozornenie o požiadavke na Symfony server.

### 10.3 Desktop file
✅ `data/sk.mostka.Respatch.desktop` existuje a je inštalovaný.

### 10.4 Icon
✅ SVG ikona: `data/icons/hicolor/scalable/apps/sk.mostka.Respatch.svg`
✅ PNG ikony vo všetkých veľkostiach (16x16 až 512x512)

---

## 11. Screenshots / Video

✅ Screenshot `main-screen.png` je referencovaný v metainfo.
✅ Screencast `screencast.webm` (VP9/WebM) je referencovaný v metainfo.
⚠️ URLs odkazujú na `raw.githubusercontent.com/mostka-sk/respatch-gnome/main/data/` — treba overiť, že súbory sú skutočne dostupné na GitHube po push.

---

## Zhrnutie — Kritické blokery pred submission

| # | Problém | Závažnosť | Oprava |
|---|---------|-----------|--------|
| 1 | ~~Runtime verzia 47~~ | ✅ OPRAVENÉ | runtime-version: '50', blueprint-compiler v0.20.4, build OK |
| 2 | ~~Dátum release v budúcnosti~~ | ✅ OK | Dátum 2026-05-10 je správny (aktuálny dátum) |
| 3 | ~~package.json license: ISC~~ | ✅ OPRAVENÉ | package.json license: MIT |
| 4 | **Host-dependent charakter aplikácie** | ⚠️ RIZIKO | Opýtať sa reviewerov pred submission; mať pripravené argumenty |
| 5 | **AI policy — kód generovaný AI agentom** | ⚠️ RIZIKO | PR otvoriť manuálne, vlastnými slovami; vypnúť Copilot review; byť pripravený zdôvodniť kód |

---

## Odporúčaný postup pred submission

1. **Opraviť 3 blokery** (runtime, dátum, licencia) — rýchle zmeny
2. **Otestovať build** s novým runtime 47→49: `flatpak-builder --user --install --force-clean build-dir sk.mostka.Respatch.yml`
3. **Overiť dostupnosť** screenshot a screencast URL na GitHube
4. **Opýtať sa reviewerov** cez [GitHub Issues](https://github.com/flathub/flathub/issues) na host-dependent charakter aplikácie
5. **PR otvoriť manuálne** — vlastnými slovami, bez AI generovania PR textu
