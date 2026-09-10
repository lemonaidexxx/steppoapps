# Dropdown configuration and provenance

FormOptions has List Name, Option Key, Label, Enabled and Display Order. AddressOptions has Geographic Key, Level, Parent Key, Label, Enabled, Display Order and Source Code. Both tabs contain public choices only. Never put participant information in these tabs.

Staff may edit labels and order, or disable choices. Keep stable keys unchanged; disable rather than delete referenced choices. Category keys member/family, Sex keys male/female and relationship keys parent/child/sibling/spouse control approved behavior and cannot be extended without code changes. The goal-other key enables the explanation field. Other lists accept new unique keys. Enabled is a boolean checkbox; order is numeric. All lists must retain at least one enabled option. Address levels are region, province and city, with parents in the preceding level. Disable an ancestor to remove its branch from public choices.

The server validates keys and relationships using current Sheet contents, returns enabled choices and a configuration hash, and stores current labels alongside submitted keys. A stale disabled selection requires correction; other answers remain. Existing application labels and consent evidence are never rewritten. The migration seeds only empty tables and preserves populated staff configuration.

## Seed sources

- Country labels: the supplied 250-line list in data/countries.txt, preserved exactly in order with Seabased OFW first. FormOptions has 269 initial rows across six lists.
- Geography: PSA PSGC Q2 2026, as of June 30, 2026, published July 13, 2026: https://psa.gov.ph/classification/psgc . The official workbook download was blocked by its web challenge during this implementation.
- Import transport: the public yng-me/psgc R dataset at pinned commit 83f506a7f5c89b7fd2f84fbebb9a0bfd275f0bc0: https://github.com/yng-me/psgc/tree/83f506a7f5c89b7fd2f84fbebb9a0bfd275f0bc0 . Its Q2_2026 release was extracted from R/sysdata.rda with rdata 1.1.0. The retained region/province/city/municipality subset is data/psgc-source.json. No mirror code is bundled. The seed records the source-subset SHA-256 and pinned URL.
- The retained release has 18 regions, 82 provinces, 149 cities and 1,493 municipalities. The importer checks these counts. Region labels follow the user-supplied list.

AddressOptions contains 1,744 rows: 18 regions, 84 province/area groups and 1,642 cities/municipalities. NCR has one synthetic Metro Manila group with all 17 localities. NIR includes Negros Occidental, Negros Oriental and Siquijor; Bacolod groups with Negros Occidental using PSA correspondence codes. Independent cities use same-region PSA correspondence grouping. BARMM localities without a province grouping use an explicitly labeled independent-city/special-area group. Synthetic groups have blank Source Code; real places retain the PSA code as text.

Run `node scripts/import-options.mjs` to regenerate seeds from the checked-in inputs. This never writes to Google. Updating a release requires reviewing geographic changes and stable-key implications before explicitly editing the live table; do not replace staff configuration wholesale. The Sheet Settings rows AddressSourceRelease, AddressSourceURL and AddressSourceMirror record the installed seed provenance.
