# TOP Speaker

Klikací koncept aplikace pro workshop TOP Speaker (Jakub Stejskal, PromoPeople).

- `public/index.html`: celá stránka v jednom souboru (rozcestník, beta appka, pracovní list, přehled pro lektora, Jak to bude fungovat, Konfigurátor aplikace, Nápady).
- `src/worker.js`: servíruje stránku (adresy bez `#`, např. `/konfigurator`) a ukládá odpovědi z konfigurátoru do KV `topspeaker-konfigurace` pod klíčem `konfigurace:<id>`.
- Heslo pro vstup: `topspeaker` nebo `Jakub Stejskal`. Je to jen zámek prototypu.

Návrh: [vojtechsvoboda.cz](https://vojtechsvoboda.cz)
