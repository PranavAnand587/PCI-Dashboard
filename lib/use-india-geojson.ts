import { useState, useEffect } from 'react'
import * as topojson from 'topojson-client'

const CACHE_KEY = 'india-geojson-v2'
const GEOJSON_URL = '/india_v2.json?v=2'

export interface GeoJSONFeature {
    type: 'Feature'
    properties: {
        name: string
        [key: string]: any
    }
    geometry: any
}

function normalizeStateName(name: string) {
    if (!name) return name
    if (name === 'Orissa' || name === 'Orrisa') return 'Odisha'
    if (name === 'Uttaranchal') return 'Uttarakhand'
    return name
}

export function useIndiaGeoJSON() {
    const [data, setData] = useState<GeoJSONFeature[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetch(GEOJSON_URL, {
                    cache: 'no-store'
                })

                if (!response.ok) {
                    throw new Error(`Failed to load map data: ${response.statusText}`)
                }

                const json = await response.json()

                let features: any[] | undefined

                // ✅ CASE 1: Pure GeoJSON
                if (json.type === 'FeatureCollection' && json.features) {
                    features = json.features
                }

                // ✅ CASE 2: TopoJSON
                else if (json.type === 'Topology' && json.objects) {
                    const keys = Object.keys(json.objects)

                    if (keys.length === 0) {
                        throw new Error('Invalid TopoJSON: no objects found')
                    }

                    const geojson = topojson.feature(
                        json,
                        json.objects[keys[0]]
                    ) as any

                    features = geojson.features
                }

                if (!features) {
                    throw new Error('Invalid map format: could not extract features')
                }

                // Normalize state names
                const normalized = features.map((f: any) => ({
                    ...f,
                    properties: {
                        ...f.properties,
                        name: normalizeStateName(
                            f.properties?.name || f.properties?.st_nm
                        )
                    }
                }))

                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(normalized))
                } catch (e) {
                    console.warn('Failed to cache GeoJSON', e)
                }

                setData(normalized)
            } catch (err) {
                console.error('Error loading India map:', err)
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unknown error loading map'
                )
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    return { data, loading, error }
}


// import { useState, useEffect } from 'react'
// import * as topojson from 'topojson-client'

// const CACHE_KEY = 'india-geojson-v2'
// // Added version parameter to force cache refresh as requested
// const GEOJSON_URL = '/india_v2.json?v=2'

// export interface GeoJSONFeature {
//     type: 'Feature'
//     properties: {
//         name: string
//         [key: string]: any
//     }
//     geometry: any
// }

// function normalizeStateName(name: string) {
//     if (name === 'Orissa' || name === 'Orrisa') return 'Odisha'
//     if (name === 'Uttaranchal') return 'Uttarakhand'
//     return name
// }


// export function useIndiaGeoJSON() {
//     const [data, setData] = useState<GeoJSONFeature[] | null>(null)
//     const [loading, setLoading] = useState(true)
//     const [error, setError] = useState<string | null>(null)

//     useEffect(() => {
//         const loadData = async () => {
//             try {
//                 // 1. Check localStorage cache
//                 // Commented out cache check to force reload for now as per user request to update map data
//                 // const cached = localStorage.getItem(CACHE_KEY)
//                 // if (cached) {
//                 //     try {
//                 //         const parsed = JSON.parse(cached)
//                 //         setData(parsed)
//                 //         setLoading(false)
//                 //         return
//                 //     } catch (e) {
//                 //         console.warn('Failed to parse cached GeoJSON', e)
//                 //         localStorage.removeItem(CACHE_KEY)
//                 //     }
//                 // }

//                 // 2. Fetch from network
//                 const response = await fetch(GEOJSON_URL, {
//                     cache: 'no-store' // Changed from force-cache to no-store for immediate update
//                 })

//                 if (!response.ok) throw new Error(`Failed to load map data: ${response.statusText}`)

//                 const topology = await response.json()

//                 // 3. Convert TopoJSON to GeoJSON
//                 // The object key in india.json is 'india_telengana'
//                 const objectName = 'india_telengana'

//                 let features;
//                 if (!topology.objects || !topology.objects[objectName]) {
//                     // Fallback or try to find the first object key
//                     const keys = Object.keys(topology.objects || {})
//                     if (keys.length > 0) {
//                         const geojson = topojson.feature(topology, topology.objects[keys[0]]) as any
//                         features = geojson.features
//                     } else {
//                         throw new Error('Invalid TopoJSON format: missing objects')
//                     }
//                 } else {
//                     const geojson = topojson.feature(topology, topology.objects[objectName]) as any
//                     features = geojson.features
//                 }

//                 // Validate features
//                 if (!features) throw new Error('No features found in GeoJSON')

//                 // Normalize
//                 features = features.map((f: any) => ({
//                     ...f,
//                     properties: {
//                         ...f.properties,
//                         name: normalizeStateName(f.properties?.st_nm || f.properties?.name)
//                     }
//                 }))


//                 // 4. Cache result
//                 try {
//                     localStorage.setItem(CACHE_KEY, JSON.stringify(features))
//                 } catch (e) {
//                     console.warn('Failed to cache GeoJSON in localStorage', e)
//                 }

//                 setData(features)
//             } catch (err) {
//                 console.error('Error loading India map:', err)
//                 setError(err instanceof Error ? err.message : 'Unknown error loading map')
//             } finally {
//                 setLoading(false)
//             }
//         }

//         loadData()
//     }, [])

//     return { data, loading, error }
// }
