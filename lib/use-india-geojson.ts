import { useState, useEffect } from 'react'
import * as topojson from 'topojson-client'

const CACHE_KEY = 'india-geojson-v2'
const GEOJSON_URL = '/india_v2.json'

export interface GeoJSONFeature {
    type: 'Feature'
    properties: {
        name: string
        [key: string]: any
    }
    geometry: any
}

function normalizeStateName(name: string) {
    if (name === 'Orissa' || name === 'Orrisa') return 'Odisha'
    return name
}


export function useIndiaGeoJSON() {
    const [data, setData] = useState<GeoJSONFeature[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Check localStorage cache
                const cached = localStorage.getItem(CACHE_KEY)
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached)
                        setData(parsed)
                        setLoading(false)
                        return
                    } catch (e) {
                        console.warn('Failed to parse cached GeoJSON', e)
                        localStorage.removeItem(CACHE_KEY)
                    }
                }

                // 2. Fetch from network
                const response = await fetch(GEOJSON_URL, {
                    cache: 'force-cache'
                })

                if (!response.ok) throw new Error(`Failed to load map data: ${response.statusText}`)

                const topology = await response.json()

                // 3. Convert TopoJSON to GeoJSON
                // The object key in india.json is 'india_telengana'
                const objectName = 'india_telengana'
                if (!topology.objects || !topology.objects[objectName]) {
                    // Fallback or try to find the first object key
                    const keys = Object.keys(topology.objects || {})
                    if (keys.length > 0) {
                        const geojson = topojson.feature(topology, topology.objects[keys[0]]) as any
                        const features = geojson.features


                        // Cache and set state
                        try {
                            localStorage.setItem(CACHE_KEY, JSON.stringify(features))
                        } catch (e) {
                            // Quota exceeded or other error, ignore
                            console.warn('Failed to cache GeoJSON in localStorage', e)
                        }

                        setData(features)
                        return
                    }
                    throw new Error('Invalid TopoJSON format: missing objects')
                }

                const geojson = topojson.feature(topology, topology.objects[objectName]) as any
                const features = geojson.features.map((f: any) => ({
                    ...f,
                    properties: {
                        ...f.properties,
                        name: normalizeStateName(f.properties?.name)
                    }
                }))


                // 4. Cache result
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(features))
                } catch (e) {
                    console.warn('Failed to cache GeoJSON in localStorage', e)
                }

                setData(features)
            } catch (err) {
                console.error('Error loading India map:', err)
                setError(err instanceof Error ? err.message : 'Unknown error loading map')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    return { data, loading, error }
}
