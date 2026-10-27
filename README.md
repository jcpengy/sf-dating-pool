# SF Dating Pool

An interactive, privacy-safe simulation showing how preferences narrow San Francisco's adult population.

The experience will borrow the clarity and rhythm of a swipe-based dating app without copying Hinge's branding, interface, or real profiles. Each card introduces one preference; after every choice, the estimate of the remaining pool updates.

## What the result means

The product will report:

- the estimated share of SF adults matching the selected characteristics;
- a rounded estimated population count; and
- an uncertainty range with visible source notes.

It will **not** call this the user's chance of meeting a match. Public demographic data cannot establish whether someone is single, looking to date, uses an app, is mutually interested, or is otherwise compatible.

## Proposed experience

1. Begin with San Francisco residents age 21 and older.
2. Show one preference per portrait-format card.
3. Let the user accept, skip, or set a range for that criterion.
4. Keep a persistent counter showing the estimated pool remaining.
5. Animate the change after each choice and explain the biggest reduction.
6. End with a compact funnel showing how every preference changed the estimate.
7. Offer an assumptions panel with data vintage, geography, definitions, and uncertainty.

The first release should include:

- age range;
- gender(s) the user is open to dating;
- personal income range;
- currently married / not currently married;
- own children living in the household / none living in the household;
- sexual orientation where the survey sample supports a responsible estimate; and
- height as an optional, explicitly national model—not an SF-local statistic.

After the core model is validated, an **SF life** expansion could add traits available on the same Census records:

- works in a technology industry or computer/mathematical occupation;
- educational attainment and field of degree;
- recently moved to San Francisco or has lived in the same home for a longer period;
- lives alone, with roommates, with a partner, or in another household arrangement;
- place of birth, citizenship, and year of arrival in the United States; and
- language spoken at home.

“Works in tech” needs two separate, visible definitions: **tech industry** describes the employer's business, while **tech occupation** describes the person's job. A designer at a software company and a software engineer at a hospital should not be silently classified the same way.

Activity preferences are less suitable as population filters. The SF City Survey measures use of services such as parks, libraries, and Muni, and AskCHIS includes some health behaviors. Recreation registrations and library activity can add citywide context, but they are administrative participation counts—not representative percentages of residents—and generally cannot be joined to the Census population model.

## Data strategy

The model should preserve relationships between traits instead of multiplying independent citywide percentages. For example, age, income, marital status, and children should be filtered jointly on the same weighted Census microdata records.

| Topic | Proposed source | Geographic strength | Important limitation |
| --- | --- | --- | --- |
| Adult population, age, sex, income, marital status, children in household | [2024 ACS 1-year PUMS](https://www.census.gov/programs-surveys/acs/microdata/documentation.html) | SF Public Use Microdata Areas | `SEX` is not gender identity; children means own children in the household; marital status is not dating availability |
| Sexual orientation and gender identity | [2026 San Francisco City Survey](https://data.sfgov.org/City-Management-and-Ethics/San-Francisco-City-Survey-Data/nufj-bfbw) | Weighted citywide survey | Small subgroups require wide uncertainty, grouping, or suppression |
| Cross-check for orientation, gender identity, income, and family status | [AskCHIS](https://healthpolicy.ucla.edu/our-work/askchis?language=en) | County-level estimates where available | Some combinations will be unavailable or suppressed |
| Height | [CDC NHANES examination data](https://wwwn.cdc.gov/nchs/nhanes/Search/DataPage.aspx?Component=Examination) | National measured sample | Not SF-specific; should be optional and labeled as modeled |

See [docs/DATA_AND_MODEL_PLAN.md](docs/DATA_AND_MODEL_PLAN.md) for the statistical and implementation plan.

## Product design

- Warm, editorial visual system with original typography, colors, and components.
- A stacked-card interaction inspired by dating apps, with buttons and keyboard controls in addition to gestures.
- Abstract illustrations or clearly synthetic personas; no real names or profile photos.
- The remaining-pool estimate stays visible on every screen.
- A short explanation accompanies every estimate so the uncertainty never disappears behind the animation.
- Responsive, single-column mobile layout and accessible reduced-motion behavior.

## Technical approach

- React, TypeScript, and Vite
- A reducer or state machine for the preference sequence
- Reproducible preprocessing scripts for survey downloads, cleaning, weighting, and validation
- A small pre-aggregated dataset or privacy-safe weighted synthetic sample shipped to the browser
- SVG-based counter and funnel graphics
- Static deployment on Vercel for the MVP; no backend or personal-data collection required

## First prototype

The first working version intentionally includes only five compact filters: age, personal income, related children in the household, current marital status, and a documented tech-work definition. It uses a privacy-safe aggregate cube generated from weighted 2024 ACS PUMS records and calculates ACS replicate-weight uncertainty in the browser.

```bash
npm install
npm run data:build -- /path/to/psam_p06.csv /path/to/psam_h06.csv
npm run dev
```

The raw California PUMS files are not committed. Download the 2024 1-year person and housing CSV files from the Census Bureau, then run the reproducible build script above.

## Delivery phases

### 0. Data audit

- Download the latest source files and data dictionaries.
- Confirm SF geography, sample sizes, variable definitions, and licenses.
- Define suppression and rounding rules before building the UI.

### 1. Core demographic model

- Build the weighted ACS population base.
- Implement joint filters for age, Census sex, income, marital status, and children in household.
- Validate totals against published ACS tables.

### 2. Interaction prototype

- Build the original swipe-card flow.
- Add persistent estimates, undo, restart, and a final funnel.
- Test mobile layout, keyboard navigation, and screen-reader labels.

### 3. Sexual orientation and gender identity

- Evaluate usable City Survey and AskCHIS sample sizes.
- Add broad calibration only where defensible.
- Use uncertainty intervals and suppress unstable combinations.

### 4. Optional height model

- Fit a national NHANES height distribution by defensible demographic groups.
- Label it as a national assumption everywhere it appears.
- Let users exclude height from the simulation.

### 5. Validation and launch

- Publish methodology, source links, versions, and limitations.
- Review language with a statistician or survey-methods expert.
- Add automated data checks, usability testing, and deploy previews.

## Guardrails

- Never represent estimates as identifiable people or actual app users.
- Never rank groups or calculate a person's desirability.
- Do not infer gender identity from the ACS sex variable.
- Do not equate “not currently married” with single or available.
- Do not equate “no own children in household” with never having children.
- Round small estimates, show uncertainty, and suppress unreliable cells.
- Avoid neighborhood-level sexual-orientation or gender-identity claims unless the sample genuinely supports them.
- Keep all criteria optional and explain how sensitive attributes are modeled.

## Success criterion

The user should leave understanding how filters compound—and how uncertain the estimate is—rather than believing the tool found an exact number of “perfect matches.”

