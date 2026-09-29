# Personal inflation calculator

This frontend interactive estimates how price changes affect a household's spending basket. Users can enter spending in a detailed set of categories or use a shorter quick calculator. The results show an estimated personal inflation rate, the change in monthly cost, category contributions, and a five-year comparison with the UK headline CPIH annual rate.

## Data

- Category annual inflation rates come from [personal-inflation-calculator-data](https://github.com/ONSdigital/personal-inflation-calculator-data/blob/main/data/data.json). The frontend uses the latest 60 monthly observations, in newest-first order. Some spending inputs share a pre-aggregated source category.
- The headline CPIH annual rate comes separately from the [ONS L55O time series](https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/l55o/mm23/data). It is used for comparison, not to calculate the personal rate.
- [calculator/inflation_data.js](calculator/inflation_data.js) defines the spending inputs and their descriptions; [calculator/deciles.csv](calculator/deciles.csv) supplies comparison spending by household income group. The date displayed as "Inflation data last updated" comes from the category JSON's `metadata.generatedAt` timestamp.

## How the estimate is calculated

The calculator converts each entered amount to a monthly spend according to its selected payment frequency. For a category $c$ in month $t$, let $S_c$ be the current monthly spend and $r_{c,t}$ be that category's **annual** inflation rate (a percentage, not its price-index level). It estimates what the same basket would have cost a year earlier and the resulting change:

$$
P_{c,t} = \frac{S_c}{1 + r_{c,t}/100}, \qquad \Delta_{c,t} = S_c - P_{c,t}.
$$

The personal inflation rate for that month is the total change divided by the estimated cost a year earlier:

$$
\mathrm{PIR}_t = 100 \times \frac{\sum_c \Delta_{c,t}}{\sum_c P_{c,t}}.
$$

The latest month is the headline result. The same entered spending amounts are applied to each of the preceding 59 months to draw the historical series; the calculator does not ask for historical household spending. Category contributions in the results use each category's share of the total change, multiplied by the personal inflation rate.

In detailed mode, the calculation uses the amounts entered for each category. In quick mode, it uses entered amounts for the visible quick categories and fills the remaining categories (except "other") with comparison spending. Comparison spending is the UK average unless the user supplies household income, in which case an income group is selected; rent and owner-occupier housing comparisons are set to zero where they do not apply to the chosen housing situation. Income changes the comparison spending used for quick-mode estimates, **not** the category inflation rates.

This is an indicative estimate for a fixed basket based on current spending. It is not a record of the household's actual spending over time, and the headline CPIH series is a separate national benchmark.
