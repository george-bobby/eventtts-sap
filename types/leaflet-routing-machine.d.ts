declare module 'leaflet-routing-machine' {
  import * as L from 'leaflet';

  namespace Routing {
    interface LineOptions {
      styles?: L.PathOptions[];
      extendToWaypoints?: boolean;
      missingRouteTolerance?: number;
      addWaypoints?: boolean;
    }

    interface RoutingControlOptions extends L.ControlOptions {
      waypoints?: L.LatLng[];
      lineOptions?: Partial<LineOptions>; // ✅ Fix: make it Partial
      routeWhileDragging?: boolean;
      showAlternatives?: boolean;
      fitSelectedRoutes?: boolean;
      createMarker?: (i: number, wp: L.LatLng) => L.Marker | null;
    }

    class Control extends L.Control {
      getPlan(): any;
      setWaypoints(waypoints: L.LatLng[]): void;
    }

    function control(options?: RoutingControlOptions): Control;
  }

  const Routing: typeof Routing;
  export = Routing;
}
