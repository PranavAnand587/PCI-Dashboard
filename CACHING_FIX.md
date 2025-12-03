# Next.js Caching Fix for PCI Dashboard

## Problem
When filtering by "by_press" (or any other filter), the graphs and charts were not displaying data even though:
- The filter was being applied correctly
- Data was being sent to the backend
- Data was being received successfully
- Tooltips were showing on hover

The root cause was **Next.js's aggressive fetch caching** which was caching API responses and preventing fresh data from being displayed when filters changed.

## Solution
We've implemented a comprehensive caching fix across multiple files:

### 1. `next.config.ts`
Added cache control headers to prevent caching of API routes:
```typescript
{
  source: '/api/:path*',
  headers: [
    { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
    { key: 'Pragma', value: 'no-cache' },
    { key: 'Expires', value: '0' },
  ],
}
```

### 2. `lib/data-loader.ts`
Added `{ cache: 'no-store' }` to all fetch calls:
- `fetchAllComplaints()` - both "by" and "against" table fetches
- `fetchFilteredComplaints()` - filtered data fetch

### 3. `lib/api.ts`
Added `{ cache: 'no-store' }` to all API function fetch calls:
- `getFilters()`
- `getComplaintsList()`
- `getComplaintsStats()`
- `getLocationStates()`
- `getTopMedia()`
- `getMediaTrends()`
- `getWordCloud()`
- `getNetworkData()`

## How It Works
The `{ cache: 'no-store' }` option tells Next.js to:
1. **Never cache** the fetch response
2. **Always make a fresh request** to the API
3. **Bypass** Next.js's built-in Data Cache

This ensures that when you apply filters (like "by_press"), the dashboard:
1. Makes a fresh API request
2. Gets the latest filtered data
3. Re-renders all charts and graphs with the new data
4. Displays the correct visualizations immediately

## Testing
After restarting the dev server, you should now see:
1. Charts and graphs update immediately when filters are applied
2. "By Press" filter shows threat data correctly
3. "Against Press" filter shows complaint data correctly
4. All visualizations render with the filtered data
5. No stale cached data

## Next Steps
1. Restart the Next.js dev server: `npm run dev`
2. Clear your browser cache (Ctrl+Shift+Delete)
3. Test the "By Press" filter
4. Verify that charts and graphs display correctly
5. Test other filters to ensure everything works

## Additional Notes
- The GeoJSON file (`india.json`) is still cached with `max-age=31536000` since it's a static asset that doesn't change
- All API responses are now completely uncached
- This fix applies to both development and production builds
