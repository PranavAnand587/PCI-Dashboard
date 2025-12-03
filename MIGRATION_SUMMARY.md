# Migration Summary: Legacy Endpoints & UI Restructuring

## Overview
We have successfully migrated the legacy Python endpoints to the current FastAPI backend and restructured the Next.js frontend to accommodate these new research visualizations.

## Backend Changes
1. **New Router**: Created `api_dev/routers/research.py` containing all the migrated endpoints:
   - `/research/cases_per_state_year`
   - `/research/cases_per_state`
   - `/research/wordcloud`
   - `/research/india_map`
   - `/research/stacked_histogram`
   - `/research/cdf_lineplot`
   - `/research/freq_line_plot`
   - `/research/visualize_press`
   - `/research/bubble_topk_press`

2. **Main Application**: Updated `api_dev/main.py` to include the new `research` router.

3. **Dependencies**: Installed required Python libraries:
   - `geopandas`
   - `wordcloud`
   - `rapidfuzz`
   - `matplotlib`
   - `pandas`

## Frontend Changes
1. **New Component**: Created `components/research-findings.tsx`.
   - Features a control panel for filtering (Table, Year Range, State, Column, Chart Type).
   - Displays visualizations in tabs (Map, Word Cloud, Histogram, CDF, Frequency, Press Viz, Bubble Plot).
   - Handles dynamic image loading from the API.

2. **Dashboard Restructuring**: Updated `app/page.tsx`.
   - Introduced a top-level **Tabs** system.
   - **Tab 1: General Analytics**: Contains the existing dashboard (Statistics, Filter Panel, Map, and the 6 analysis tabs).
   - **Tab 2: Research Findings**: Contains the new `ResearchFindings` component with the migrated visualizations.

## How to Test
1. **Restart Backend**: The FastAPI server should auto-reload, but if you see errors, restart it:
   ```bash
   cd api_dev
   uvicorn main:app --reload
   ```
2. **Restart Frontend**: The Next.js server should auto-reload.
3. **Navigate to Dashboard**:
   - You will see two main tabs at the top: "General Analytics" and "Research Findings".
   - Click "Research Findings".
   - Adjust the parameters (e.g., change "Against Press" to "By Press", change State to "Maharashtra").
   - Click "Generate Visualizations" (or just switch tabs, images load dynamically).

## Notes
- The `india_map` endpoint requires `india_states.geojson` to be present in the `api_dev` directory.
- The visualizations are generated as PNG images on the server and displayed in the frontend.
