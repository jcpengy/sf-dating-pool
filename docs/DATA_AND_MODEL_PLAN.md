# Data and model plan

## 1. Define the population

The default denominator is all San Francisco residents age 21 and older. The interface may offer a user-selected age range. Age 21 is a product choice for a post-college-and-beyond audience, not evidence that younger adults are inactive in dating.

The model estimates demographic matches among residents. It does not estimate active dating-app users or people willing to date the user.

## 1a. Add SF-specific traits in a second release

ACS PUMS supports several traits that feel specific to life in San Francisco and can remain jointly modeled with age, income, and household characteristics:

- occupation and industry, including separately defined technology-industry and technology-occupation measures;
- work from home and commute mode;
- educational attainment and field of degree;
- mobility and when the person moved into their current home;
- household composition and housing tenure;
- place of birth, citizenship, and year of entry; and
- language spoken at home.

Publish the precise code list behind any friendly label. In particular, never use a single unexplained “works in tech” flag: industry identifies the employer's activity, while occupation identifies the work a person performs.

Activity datasets require a different treatment. The SF City Survey can estimate certain uses of parks, libraries, Muni, and other city services. AskCHIS can estimate some health behaviors at county level. Recreation registrations, event attendance, and library usage are administrative counts and may include repeat participation or exclude non-users; they should appear as contextual SF facts, not as representative filters in the core pool calculation. Do not attempt record-level linkage across these sources.

## 2. Build the ACS base

Use the latest validated ACS 1-year PUMS person and household files and retain records in the PUMAs covering San Francisco. Apply person weights for person-level estimates and join household fields only where needed.

Candidate variables include:

- `AGEP`: age;
- `SEX`: Census sex variable;
- `MAR`: marital status;
- `PINCP`: total person income;
- `PWGTP`: person weight; and
- household/parent indicators such as `NOC`, `PAOC`, or the best documented current equivalent.

Before implementation, confirm every variable against the selected year's [PUMS data dictionary](https://api.census.gov/data/2024/acs/acs1/pums/variables.html).

Filters should operate on the same weighted records. Do not estimate intersections by multiplying marginal percentages.

## 3. Add gender identity and sexual orientation carefully

ACS PUMS does not provide the gender-identity and sexual-orientation detail needed by the product. Use the weighted SF City Survey as the primary local calibration source and AskCHIS as a comparison source.

Recommended sequence:

1. Measure the univariate and safely supported conditional distributions in each source.
2. Inspect effective sample sizes and missingness.
3. Group categories only when statistically necessary and explain the grouping.
4. Calibrate the weighted ACS base with iterative proportional fitting or multiple imputation.
5. Run repeated draws so the UI can show an uncertainty interval, not a single false-precision number.
6. Suppress estimates whose sample support falls below a predeclared threshold.

The model must keep three concepts separate:

- the Census sex variable;
- a person's gender identity; and
- the gender(s) a person is open to dating.

The public sources may not support a complete joint distribution among all three. If they do not, the MVP should use broader categories or omit the unsupported calculation.

## 4. Treat height as a scenario assumption

No credible, representative SF-local measured-height source has been identified. NHANES can provide a national measured distribution, but localizing it would introduce assumptions.

If height is included:

- make the control optional;
- call it a national model;
- expose the source and survey period beside the estimate;
- include its modeling uncertainty; and
- allow the final result to be viewed with height excluded.

## 5. Quantify uncertainty

Use replicate weights where the source provides them. For calibrated or imputed attributes, repeat the modeling process across multiple draws. Report a rounded central estimate and, ideally, an 80% or 95% interval.

Example display language:

> About 42,000 SF adults match these demographic filters (estimated range: 34,000–51,000).

Avoid language such as “You have a 7% chance of meeting someone.”

## 6. Protect against false precision

- Round counts to a scale appropriate to the uncertainty.
- Do not expose row-level survey records to the client.
- Ship only aggregate cells or a privacy-safe synthetic representation.
- Set a minimum estimated-count and effective-sample threshold.
- Combine or suppress rare intersections.
- Version each processed artifact with source date and transformation code.

## 7. Validate

For every release:

- reconcile the ACS base against published SF totals;
- test weighted and unweighted counts;
- test empty, tiny, and contradictory filter combinations;
- compare broad City Survey/AskCHIS marginals;
- review the wording of sensitive characteristics;
- test Monte Carlo stability; and
- publish a short methodology note and known limitations.

## 8. Suggested repository structure

```text
data/
  raw/                 # ignored; source downloads and checksums
  processed/           # versioned aggregates safe for the browser
scripts/
  download/
  transform/
  validate/
src/
  components/
  model/
  content/
  styles/
docs/
  DATA_AND_MODEL_PLAN.md
  METHODOLOGY.md
```

Raw microdata should remain out of Git. Commit download scripts, source manifests, checksums, processed public aggregates, and documentation instead.

