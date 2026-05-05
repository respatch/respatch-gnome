# Respatch

Respatch je vývojársky nástroj na monitorovanie Symfony Messenger front, postavený ako natívna GNOME desktopová aplikácia s využitím TypeScriptu, GJS, GTK4, Libadwaita a Blueprint.

## Požiadavky (Prerekvizity)

Pre správne zostavenie a spustenie aplikácie musíš mať na systéme nainštalované nasledujúce závislosti:
- **Node.js** a **npm**
- **gjs** (GNOME JavaScript bindings)
- **blueprint-compiler** (pre kompiláciu `.blp` súborov na `.ui`)

## Ako spustiť aplikáciu na otestovanie

Závislosti projektu nainštaluješ pomocou príkazu:

```bash
npm install
```

Pre skompilovanie TypeScriptu, Blueprint súborov a okamžité spustenie aplikácie použi príkaz:

```bash
npm run start
```

Tento príkaz automaticky spustí `npm run build` (ktorý najskôr cez `blueprint-compiler` vytvorí `.ui` súbory v priečinku `dist/ui` a následne skompiluje TypeScript do `dist/main.js`) a spustí výslednú aplikáciu.

Ak chceš len zostaviť aplikáciu bez jej spustenia, použi:

```bash
npm run build
```

## Ako spúšťať testy

Projekt používa testovací framework [Vitest](https://vitest.dev/). Na spustenie všetkých testov použi príkaz:

```bash
npm run test
```

Testy sa nachádzajú v priečinku `tests/`.

## Vývoj

- **UI Blueprinty:** Užívateľské rozhranie definujeme v priečinku `src/ui/` pomocou `.blp` (Blueprint) súborov, ktoré sú modernou a jednoduchšou alternatívou k XML `.ui` súborom od GTK.
- **Hlavný kód:** Aplikačná logika sa nachádza v `src/main.ts`.
