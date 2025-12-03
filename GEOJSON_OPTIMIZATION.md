# GeoJSON Optimization Guide for India Map

## Problem
A detailed India GeoJSON file can be 13MB+, causing slow load times and poor performance.

## Solutions (Ranked by Effectiveness)

### 🏆 Option 1: Simplify the GeoJSON (Best)

**Use Mapshaper to reduce file size by 90%+**

1. **Online Tool** (Easiest):
   - Go to https://mapshaper.org/
   - Upload your 13MB GeoJSON
   - Run command: `simplify 5% keep-shapes`
   - Export as GeoJSON
   - Result: ~500KB-1MB file with minimal visual difference

2. **Command Line** (For automation):
   ```bash
   npm install -g mapshaper
   mapshaper india.geojson -simplify 5% keep-shapes -o india-simplified.geojson
   ```

3. **What it does**:
   - Removes unnecessary coordinate points
   - Keeps overall shape accurate
   - Reduces from 13MB → ~500KB-1MB
   - No visible difference at typical zoom levels

**Recommended settings:**
- `5%` for state-level maps (good balance)
- `2%` for district-level maps (more detail)
- `10%` for country-level overview (maximum simplification)

---

### 🥈 Option 2: Use TopoJSON Instead

**TopoJSON is 80% smaller than GeoJSON**

```bash
# Install topojson
npm install topojson-client topojson-server

# Convert GeoJSON to TopoJSON
npx geo2topo states=india.geojson > india.topojson

# In your React component
import * as topojson from 'topojson-client'

const topology = await fetch('/india.topojson').then(r => r.json())
const geojson = topojson.feature(topology, topology.objects.states)
```

**Benefits:**
- 13MB GeoJSON → ~2-3MB TopoJSON
- Eliminates duplicate borders between states
- Better for multi-layer maps

---

### 🥉 Option 3: Lazy Load with Code Splitting

**Load the map only when needed**

```typescript
// components/india-map-loader.tsx
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const IndiaMap = dynamic(() => import('./india-map'), {
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Loading map...</span>
    </div>
  ),
  ssr: false // Don't load on server
})

export default IndiaMap
```

---

### 🎯 Option 4: Progressive Loading

**Load simplified version first, then detailed version**

```typescript
const [mapData, setMapData] = useState(null)
const [isDetailed, setIsDetailed] = useState(false)

useEffect(() => {
  // Load simplified version first (fast)
  fetch('/india-simple.geojson')
    .then(r => r.json())
    .then(setMapData)
  
  // Load detailed version in background
  fetch('/india-detailed.geojson')
    .then(r => r.json())
    .then(detailed => {
      setMapData(detailed)
      setIsDetailed(true)
    })
}, [])
```

---

### 💾 Option 5: Use CDN + Caching

**Serve from CDN with aggressive caching**

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/geojson/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

Put GeoJSON in `public/geojson/` folder.

---

### ⚡ Option 6: Use Vector Tiles (Advanced)

**For very large datasets or zoom-dependent detail**

Use Mapbox Vector Tiles or PMTiles:
- Only loads visible area
- Scales with zoom level
- Best for pan/zoom interactions

```bash
npm install pmtiles
```

---

## 🎯 Recommended Approach

**For your India state map:**

1. **Simplify the GeoJSON** using Mapshaper (5% setting)
   - 13MB → ~500KB
   - Takes 5 minutes
   - No code changes needed

2. **Add to Next.js public folder**
   ```
   public/
     geojson/
       india-states.geojson  (simplified)
   ```

3. **Fetch with caching**
   ```typescript
   const geoData = await fetch('/geojson/india-states.geojson', {
     cache: 'force-cache'
   }).then(r => r.json())
   ```

4. **Optional: Convert to TopoJSON** for additional 60% reduction
   - 500KB GeoJSON → 200KB TopoJSON

---

## 📊 Size Comparison

| Method | File Size | Load Time (3G) | Visual Quality |
|--------|-----------|----------------|----------------|
| Original | 13 MB | ~40s | Perfect |
| Simplified 5% | 500 KB | ~2s | Excellent |
| TopoJSON | 200 KB | <1s | Excellent |
| Vector Tiles | 50-100 KB | <1s | Perfect |

---

## 🛠️ Quick Implementation

### Step 1: Simplify Your GeoJSON

```bash
# Online: https://mapshaper.org/
# 1. Upload india.geojson
# 2. Console: simplify 5% keep-shapes
# 3. Export → GeoJSON
# 4. Save as india-simplified.geojson
```

### Step 2: Add to Your Project

```
pci-dash/
  public/
    geojson/
      india-states.geojson  ← Put simplified file here
```

### Step 3: Load in Component

```typescript
// components/india-map.tsx
import { useEffect, useState } from 'react'

export function IndiaMap() {
  const [geoData, setGeoData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/geojson/india-states.geojson')
      .then(r => r.json())
      .then(data => {
        setGeoData(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading map...</div>

  // Render your map with geoData
  return <svg>...</svg>
}
```

---

## 🎨 Best Practices

1. ✅ **Always simplify** - 5% is usually perfect
2. ✅ **Use TopoJSON** for multi-layer maps
3. ✅ **Enable caching** - Set long cache headers
4. ✅ **Lazy load** - Use Next.js dynamic imports
5. ✅ **Show loading state** - Better UX
6. ❌ **Don't load on server** - Use `ssr: false`
7. ❌ **Don't fetch repeatedly** - Cache in state/context

---

## 🔗 Useful Tools

- **Mapshaper**: https://mapshaper.org/ (Simplification)
- **GeoJSON.io**: https://geojson.io/ (Viewing/Editing)
- **TopoJSON**: https://github.com/topojson/topojson
- **India GeoJSON**: https://github.com/geohacker/india (Pre-simplified)

---

## 📝 Example: Complete Implementation

```typescript
// components/optimized-india-map.tsx
'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface GeoJSONFeature {
  type: string
  properties: { name: string; [key: string]: any }
  geometry: any
}

export function OptimizedIndiaMap() {
  const [geoData, setGeoData] = useState<GeoJSONFeature[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMap = async () => {
      try {
        const response = await fetch('/geojson/india-states.geojson', {
          cache: 'force-cache' // Cache for performance
        })
        
        if (!response.ok) throw new Error('Failed to load map')
        
        const data = await response.json()
        setGeoData(data.features)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map')
      } finally {
        setLoading(false)
      }
    }

    loadMap()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading India map...</span>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  // Render your map with geoData
  return <div>Map rendered with {geoData?.length} states</div>
}
```

---

## 🚀 Performance Metrics

After optimization:
- **Initial load**: <1 second
- **File size**: 200KB-500KB (vs 13MB)
- **Parse time**: <100ms (vs 2-3 seconds)
- **Memory usage**: ~5MB (vs 50MB+)

---

## 💡 Pro Tip

For India specifically, use this pre-optimized source:
```
https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson
```
Already simplified and only ~300KB!
