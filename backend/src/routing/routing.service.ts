import {
  Injectable,
  BadRequestException,
} from '@nestjs/common'

type RouteResult = {
  distanceMeters: number
  durationSeconds: number
}

@Injectable()
export class RoutingService {
  async getDrivingRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ): Promise<RouteResult> {
    const baseUrl = 'https://router.project-osrm.org'

    const url =
      `${baseUrl}/route/v1/driving/` +
      `${fromLng},${fromLat};${toLng},${toLat}` +
      `?overview=false`

    const controller = new AbortController()

    const timeout = setTimeout(() => {
      controller.abort()
    }, 10_000)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new BadRequestException(
          'Unable to calculate delivery route',
        )
      }

      const data = await response.json()

      if (
        data.code !== 'Ok' ||
        !data.routes?.length
      ) {
        throw new BadRequestException(
          'Unable to find driving route',
        )
      }

      const route = data.routes[0]

      return {
        distanceMeters: route.distance,
        durationSeconds: route.duration,
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }

      throw new BadRequestException(
        'Unable to calculate delivery route',
      )
    } finally {
      clearTimeout(timeout)
    }
  }
}