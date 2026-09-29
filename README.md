# Personal inflation calculator

This frontend interactive estimates how price changes affect a household's spending basket. Users can enter spending in a detailed set of categories or use a shorter quick calculator. The results show an estimated personal inflation rate, the change in monthly cost, category contributions, and a five-year comparison with the UK headline CPIH annual rate.

## Data

- Category annual inflation rates come from [personal-inflation-calculator-data](https://github.com/ONSdigital/personal-inflation-calculator-data/blob/main/data/data.json). The frontend uses the latest 60 monthly observations, in newest-first order. Some spending inputs share a pre-aggregated source category.
- The headline CPIH annual rate comes separately from the [ONS L55O time series](https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/l55o/mm23/data). It is used for comparison, not to calculate the personal rate.
- [inflation_data.js](inflation_data.js) defines the spending inputs and their descriptions; [deciles.csv](deciles.csv) supplies comparison spending by household income group. The date displayed as "Inflation data last updated" comes from the category JSON's `metadata.generatedAt` timestamp.

## How the estimate is calculated

The calculator first converts spending entered weekly, monthly or yearly into monthly amounts. It then uses the annual price change for each spending category to estimate what the same purchases would have cost a year earlier. Adding those amounts across categories gives an estimated previous monthly cost. The difference between that and today's monthly cost gives the estimated increase or decrease in spending; comparing the two totals gives the personal inflation rate. Categories where a household spends more generally have a greater effect on its result.

The quick calculator asks for spending in a smaller set of categories. For the others, apart from "other", it uses indicative average spending for UK households, or for households with a similar income if income is provided. Housing comparisons that do not apply to the selected living situation are set to zero. The detailed calculator lets users enter their own spending across the categories. Income affects estimated spending for categories not entered in quick mode, not the price changes applied to them.

The headline result uses the latest available month. The historical chart applies the same entered spending to price changes from earlier months; it does not reconstruct what the household actually bought or paid then. The separate headline CPIH rate provides a national comparison and need not match a household's personal rate.

The result is an indication, not a forecast. It cannot account for changes in spending habits or differences in prices within a category, such as choosing cheaper or more expensive groceries. Spending on large one-off purchases or fixed repayments may not change in the way the category's price index suggests. The tool uses mortgage spending as a proxy for owner-occupier housing costs; this is not a measure of changes in house prices. For more background, see the [ONS explanation of the calculator](https://www.ons.gov.uk/economy/inflationandpriceindices/articles/howisinflationaffectingyourhouseholdcosts/2022-03-23).

## GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) publishes the static site from the repository root (including `index.html`, `lib/`, `images/` and `deciles.csv`) on pushes to `main`. No build is needed.

To enable it, set **Settings > Pages > Build and deployment > Source** to **GitHub Actions** in the GitHub repository, then merge or push the changes to `main`. You can also run the workflow manually from the **Actions** tab. Once deployment completes, open https://onsdigital.github.io/personal-inflation-calculator/.

The page requests category data, CPIH data, and some scripts from external hosts at runtime; those endpoints must be available for the calculator to work.

A previewable version of this repo is available [here](https://onsdigital.github.io/personal-inflation-calculator/)