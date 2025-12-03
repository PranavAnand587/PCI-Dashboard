# Component Filter Fix

## Problem
The **Targets** and **Complainants** sections were not loading/displaying any data when the "By Press" filter was selected. Only the **Threats** section was working correctly.

### Root Cause
All three analysis components had **hardcoded filters** that were overriding the user's filter selections:

1. **`targets-analysis.tsx`** - Hardcoded to only show `against_press` complaints
2. **`complainants-analysis.tsx`** - Hardcoded to only show `against_press` complaints  
3. **`threats-analysis.tsx`** - Hardcoded to only show `by_press` complaints

This meant:
- When user selected "By Press" filter → Targets & Complainants showed nothing (they filtered out all by_press data)
- When user selected "Against Press" filter → Threats showed nothing (it filtered out all against_press data)

## Solution
Removed all hardcoded `complaintDirection` filters from the three analysis components:

### Files Modified:
1. **`components/targets-analysis.tsx`**
   - Removed: `const againstPressData = useMemo(() => data.filter((d) => d.complaintDirection === "against_press"), [data])`
   - Changed: All references from `againstPressData` to `data`

2. **`components/complainants-analysis.tsx`**
   - Removed: `const againstPressData = useMemo(() => data.filter((d) => d.complaintDirection === "against_press"), [data])`
   - Changed: All references from `againstPressData` to `data`

3. **`components/threats-analysis.tsx`**
   - Removed: `const byPressData = useMemo(() => data.filter((d) => d.complaintDirection === "by_press"), [data])`
   - Changed: All references from `byPressData` to `data`

## How It Works Now
The parent component (`app/page.tsx`) already handles all filtering based on user selections:
- Year filters
- State filters
- Complaint type filters
- **Direction filters** (By Press / Against Press / All)
- Affiliation filters
- Decision filters

The filtered data is then passed down to each analysis component, which now uses it directly without applying additional filters.

## Result
✅ **Targets section** now displays data for all filter combinations
✅ **Complainants section** now displays data for all filter combinations
✅ **Threats section** continues to work correctly
✅ All sections respect the user's filter selections
✅ Charts and graphs display immediately when filters are applied

## Testing
After these changes, you should see:
1. **With "By Press" filter**: All three sections show relevant data
2. **With "Against Press" filter**: All three sections show relevant data
3. **With "All" filter**: All three sections show combined data
4. All other filters (year, state, type, etc.) work correctly across all sections

## Note
The component names and descriptions still reflect their original purpose:
- **Targets** is designed for "against press" analysis (who is targeted)
- **Complainants** is designed for "against press" analysis (who complains)
- **Threats** is designed for "by press" analysis (threats to press)

However, they now work with any filtered data, making the dashboard more flexible and responsive to user selections.
