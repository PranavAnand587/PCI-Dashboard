# Real Data Integration - Summary

## What Changed

I've updated your PCI dashboard to use **real data from the FastAPI backend** instead of mock data.

### Files Modified:

1. **`lib/data-loader.ts`** (NEW)
   - Fetches real data from FastAPI backend at `http://localhost:8000`
   - Transforms backend data format to match dashboard's expected format
   - Handles both "by" and "against" complaint tables
   - Combines data from both tables into a unified dataset

2. **`app/page.tsx`** (UPDATED)
   - Replaced `generateMockData()` with `fetchAllComplaints()`
   - Added loading state with spinner
   - Added error handling with helpful troubleshooting tips
   - Data now loads asynchronously on component mount

### Data Transformation

The backend returns data in this format:
```json
{
  "data": [
    {
      "Complainant": "...",
      "Against": "...",
      "Complaint": "...",
      "ComplaintType": "...",
      "Decision": "...",
      "Date": "...",
      "State": "...",
      "ReportName": "AnnualReport2023",
      "c_aff_resolved": "...",
      "a_aff_resolved": "...",
      ...
    }
  ]
}
```

The dashboard expects this format:
```typescript
{
  id: string
  complainant: string
  against: string
  complaint: string
  complaintType: string
  decision: string
  date: string
  year: number
  state: string
  complainantAffiliation: string
  accusedAffiliation: string
  complaintDirection: "by_press" | "against_press"
  ...
}
```

The `data-loader.ts` handles this transformation automatically.

## How to Use

### 1. Start the FastAPI Backend

Make sure your FastAPI backend is running:

```bash
cd d:\Projects\mphasis\pci_project_all\api_dev
python -m uvicorn main:app --reload
```

The backend should be accessible at `http://localhost:8000`

### 2. Start the Next.js Dashboard

```bash
cd d:\Projects\mphasis\pci-dash
npm run dev
```

The dashboard will automatically:
- Fetch data from both `/complaints/list?table=by` and `/complaints/list?table=against`
- Combine and transform the data
- Display it in all visualizations

### 3. What You'll See

**Loading State:**
- Spinner with "Loading PCI complaints data..."
- Shows while fetching from API

**Success State:**
- Full dashboard with real data
- All filters and visualizations work with actual database records

**Error State:**
- Warning message if backend is not running
- Troubleshooting tips
- Retry button

## API Endpoints Used

The dashboard now uses these FastAPI endpoints:

- `GET /complaints/list?table=by` - Complaints filed BY the press
- `GET /complaints/list?table=against` - Complaints filed AGAINST the press

Both are fetched in parallel and combined into a single dataset.

## Benefits of Real Data

✅ **Accurate insights** - Based on actual PCI records
✅ **Real complaint types** - Actual categories from the database
✅ **Genuine affiliations** - Real complainant and accused affiliations
✅ **Historical data** - Years extracted from actual ReportName field
✅ **State distribution** - Actual geographic distribution of complaints

## Fallback Behavior

If the API is not available:
- Dashboard shows a clear error message
- Provides troubleshooting steps
- Allows user to retry
- Console logs detailed error information

## Environment Variables (Optional)

You can set a custom API URL:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Default is `http://localhost:8000` if not specified.

## Testing

To verify it's working:

1. Open browser console (F12)
2. Look for: `"Loaded X complaints from API (Y by press, Z against press)"`
3. Check Network tab for API calls to `/complaints/list`

## Next Steps

- ✅ Mock data removed
- ✅ Real API integration complete
- ✅ Loading states added
- ✅ Error handling implemented
- 🔄 Make sure FastAPI backend is running
- 🔄 Test all visualizations with real data
- 🔄 Verify filters work correctly

## Troubleshooting

**"No data received from API"**
- Check if FastAPI is running: `http://localhost:8000/docs`
- Verify database file exists
- Check CORS settings in FastAPI

**"Failed to fetch complaints"**
- Check browser console for detailed errors
- Verify network connectivity
- Check if ports are not blocked

**Empty visualizations**
- Data might be loading
- Check if database has records
- Verify table names are correct ("by" and "against")
