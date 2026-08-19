import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export default function SaveMapView() {
  const map = useMap()

  useEffect(() => {
    const save = () => {
      const center = map.getCenter()

      sessionStorage.setItem(
        'home_map_view',
        JSON.stringify({
          lat: center.lat,
          lng: center.lng,
          zoom: map.getZoom(),
        }),
      )
    }

    map.on('moveend', save)
    map.on('zoomend', save)

    return () => {
      map.off('moveend', save)
      map.off('zoomend', save)
    }
  }, [map])

  return null
}