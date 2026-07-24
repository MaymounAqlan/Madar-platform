import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, LocateFixed, Map as MapIcon, MapPin, RefreshCw, Satellite, X } from 'lucide-react';
import type { Map as MapLibreMap, Marker as MapLibreMarker, StyleSpecification } from 'maplibre-gl';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface StudentLocationValue {
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAddress?: string;
  initialCoordinates?: { lat: number; lng: number } | null;
  onConfirm: (value: StudentLocationValue) => void;
}

type MapType = 'roadmap' | 'satellite' | 'hybrid';
type MapProvider = 'google' | 'fallback';
type MapsRuntimeWindow = Window &
  Record<string, unknown> & {
    gm_authFailure?: () => void;
  };

const YEMEN_CENTER = { lat: 15.5527, lng: 48.5164 };
let googleMapsPromise: Promise<void> | null = null;
let mapLibrePromise: Promise<typeof import('maplibre-gl')> | null = null;

const ROAD_TILES = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
];
const SATELLITE_TILES = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
];
const LABEL_TILES = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
];

function createFallbackStyle(mapType: MapType): StyleSpecification {
  const isRoadmap = mapType === 'roadmap';
  const sources: StyleSpecification['sources'] = {
    base: {
      type: 'raster',
      tiles: isRoadmap ? ROAD_TILES : SATELLITE_TILES,
      tileSize: 256,
      attribution: isRoadmap
        ? 'Tiles &copy; Esri, HERE, Garmin, FAO, NOAA, USGS'
        : 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
    },
  };
  const layers: StyleSpecification['layers'] = [{ id: 'base', type: 'raster', source: 'base' }];

  if (mapType === 'hybrid') {
    sources.labels = {
      type: 'raster',
      tiles: LABEL_TILES,
      tileSize: 256,
      attribution: 'Reference &copy; Esri',
    };
    layers.push({ id: 'labels', type: 'raster', source: 'labels' });
  }

  return { version: 8, sources, layers };
}

function loadMapLibre() {
  if (!mapLibrePromise) {
    mapLibrePromise = Promise.all([
      import('maplibre-gl'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ]).then(([module]) => module);
  }
  return mapLibrePromise;
}

function loadGoogleMaps(apiKey: string, language: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;
  const runtimeWindow = window as unknown as MapsRuntimeWindow;

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = `madarGoogleMapsReady_${Date.now()}`;
    const timeout = window.setTimeout(() => {
      delete runtimeWindow[callbackName];
      script.remove();
      googleMapsPromise = null;
      reject(new Error('Google Maps loading timed out'));
    }, 15000);

    runtimeWindow[callbackName] = () => {
      window.clearTimeout(timeout);
      delete runtimeWindow[callbackName];
      resolve();
    };

    const script = document.createElement('script');
    document.getElementById('madar-google-maps-script')?.remove();
    script.id = 'madar-google-maps-script';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=${encodeURIComponent(language)}&region=YE&v=weekly&loading=async&callback=${callbackName}`;
    script.onerror = () => {
      window.clearTimeout(timeout);
      delete runtimeWindow[callbackName];
      script.remove();
      googleMapsPromise = null;
      reject(new Error('Google Maps could not be loaded'));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export default function StudentLocationPicker({
  open,
  onOpenChange,
  initialAddress = '',
  initialCoordinates,
  onConfirm,
}: Props) {
  const { t, isRTL } = useLanguage();
  const apiKey = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const initialLat = Number.isFinite(initialCoordinates?.lat) ? Number(initialCoordinates?.lat) : null;
  const initialLng = Number.isFinite(initialCoordinates?.lng) ? Number(initialCoordinates?.lng) : null;
  const hasInitialCoordinates = initialLat !== null && initialLng !== null;
  const mapElementRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleMarkerRef = useRef<google.maps.Marker | null>(null);
  const googleGeocoderRef = useRef<google.maps.Geocoder | null>(null);
  const googleClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const fallbackMapRef = useRef<MapLibreMap | null>(null);
  const fallbackMarkerRef = useRef<MapLibreMarker | null>(null);
  const mapLibreRuntimeRef = useRef<typeof import('maplibre-gl') | null>(null);
  const geocodeRequestRef = useRef<AbortController | null>(null);

  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialCoordinates || null,
  );
  const [mapType, setMapType] = useState<MapType>('roadmap');
  const [provider, setProvider] = useState<MapProvider>(apiKey ? 'google' : 'fallback');
  const [loadingMap, setLoadingMap] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');
  const [mapAttempt, setMapAttempt] = useState(0);

  const updateMarker = useCallback((position: { lat: number; lng: number }) => {
    if (googleMapRef.current && window.google?.maps) {
      if (!googleMarkerRef.current) {
        googleMarkerRef.current = new google.maps.Marker({
          map: googleMapRef.current,
          position,
          title: t('الموقع المحدد', 'Selected location'),
          animation: google.maps.Animation.DROP,
        });
      } else {
        googleMarkerRef.current.setPosition(position);
        googleMarkerRef.current.setMap(googleMapRef.current);
      }
      return;
    }

    if (fallbackMapRef.current && mapLibreRuntimeRef.current) {
      if (!fallbackMarkerRef.current) {
        const markerElement = document.createElement('div');
        markerElement.className = 'madar-location-marker';
        markerElement.setAttribute('aria-label', t('الموقع المحدد', 'Selected location'));
        markerElement.style.width = '24px';
        markerElement.style.height = '24px';
        markerElement.style.border = '4px solid #ffffff';
        markerElement.style.borderRadius = '9999px';
        markerElement.style.background = '#1ba442';
        markerElement.style.boxShadow = '0 2px 8px rgba(14, 15, 12, 0.28)';
        fallbackMarkerRef.current = new mapLibreRuntimeRef.current.Marker({ element: markerElement })
          .setLngLat([position.lng, position.lat])
          .addTo(fallbackMapRef.current);
      } else {
        fallbackMarkerRef.current.setLngLat([position.lng, position.lat]);
      }
    }
  }, [t]);

  const reverseGeocode = useCallback(async (position: { lat: number; lng: number }) => {
    setResolving(true);
    setMessage('');

    if (googleGeocoderRef.current && window.google?.maps) {
      googleGeocoderRef.current.geocode({ location: position }, (results, status) => {
        setResolving(false);
        if (status === google.maps.GeocoderStatus.OK && results?.[0]?.formatted_address) {
          setAddress(results[0].formatted_address);
          return;
        }
        setMessage(
          t(
            'تم تحديد الموقع. يمكنك كتابة اسم العنوان يدوياً.',
            'Location selected. You can enter the address name manually.',
          ),
        );
      });
      return;
    }

    geocodeRequestRef.current?.abort();
    const controller = new AbortController();
    geocodeRequestRef.current = controller;
    try {
      const language = isRTL ? 'AR' : 'EN';
      const response = await fetch(
        `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${position.lng},${position.lat}&f=json&langCode=${language}`,
        { signal: controller.signal, headers: { Accept: 'application/json' } },
      );
      if (!response.ok) throw new Error('Reverse geocoding failed');
      const result = (await response.json()) as {
        address?: { LongLabel?: string; Match_addr?: string };
      };
      const formattedAddress = result.address?.LongLabel || result.address?.Match_addr;
      if (formattedAddress) {
        setAddress(formattedAddress);
      } else {
        throw new Error('Address not found');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setMessage(
          t(
            'تم تحديد الموقع. يمكنك كتابة اسم العنوان يدوياً.',
            'Location selected. You can enter the address name manually.',
          ),
        );
      }
    } finally {
      if (!controller.signal.aborted) setResolving(false);
    }
  }, [isRTL, t]);

  const selectCoordinates = useCallback((lat: number, lng: number, centerMap = false) => {
    const next = { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
    setCoordinates(next);
    setAddress(`${next.lat}, ${next.lng}`);
    updateMarker(next);

    if (centerMap) {
      if (googleMapRef.current) {
        googleMapRef.current.panTo(next);
        googleMapRef.current.setZoom(16);
      }
      fallbackMapRef.current?.flyTo({ center: [next.lng, next.lat], zoom: 16 });
    }

    void reverseGeocode(next);
  }, [reverseGeocode, updateMarker]);

  useEffect(() => {
    if (!open) return;
    setAddress(initialAddress);
    setCoordinates(hasInitialCoordinates ? { lat: initialLat, lng: initialLng } : null);
    setMessage('');
    setMapError('');
    setMapType('roadmap');
    setMapReady(false);
  }, [hasInitialCoordinates, initialAddress, initialLat, initialLng, open]);

  useEffect(() => {
    if (!open || !mapElementRef.current) return;

    let cancelled = false;
    let fallbackStarted = false;
    let resizeObserver: ResizeObserver | null = null;
    const resizeTimers: number[] = [];
    let readinessTimer: number | null = null;
    const initialPoint = hasInitialCoordinates ? { lat: initialLat, lng: initialLng } : null;
    const center = initialPoint || YEMEN_CENTER;
    const runtimeWindow = window as unknown as MapsRuntimeWindow;
    const previousAuthFailure = runtimeWindow.gm_authFailure;

    const startFallbackMap = async (reason?: string) => {
      if (cancelled || fallbackStarted || !mapElementRef.current) return;
      fallbackStarted = true;
      resizeObserver?.disconnect();
      if (readinessTimer !== null) {
        window.clearTimeout(readinessTimer);
        readinessTimer = null;
      }
      googleClickListenerRef.current?.remove();
      googleClickListenerRef.current = null;
      googleMarkerRef.current?.setMap(null);
      googleMarkerRef.current = null;
      googleMapRef.current = null;
      googleGeocoderRef.current = null;
      mapElementRef.current.replaceChildren();

      setProvider('fallback');
      setMapError('');
      if (reason) setMessage(reason);

      try {
        const maplibre = await loadMapLibre();
        if (cancelled || !mapElementRef.current) return;
        mapLibreRuntimeRef.current = maplibre;
        const map = new maplibre.Map({
          container: mapElementRef.current,
          style: createFallbackStyle('roadmap'),
          center: [center.lng, center.lat],
          zoom: initialPoint ? 15 : 5.4,
        });
        fallbackMapRef.current = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), isRTL ? 'top-left' : 'top-right');
        map.addControl(new maplibre.FullscreenControl(), isRTL ? 'top-left' : 'top-right');
        map.on('click', (event) => selectCoordinates(event.lngLat.lat, event.lngLat.lng));
        setLoadingMap(false);
        setMapReady(true);
        map.once('load', () => {
          if (cancelled) return;
          setLoadingMap(false);
          setMapReady(true);
          if (initialPoint) updateMarker(initialPoint);
          resizeTimers.push(window.setTimeout(() => map.resize(), 0));
        });
        map.on('error', (event) => {
          if (!map.loaded() && event.error) {
            setMapError(
              t(
                'تعذر تحميل طبقات الخريطة. تحقق من اتصال الإنترنت ثم أعد المحاولة.',
                'Map layers could not be loaded. Check your internet connection and try again.',
              ),
            );
            setLoadingMap(false);
          }
        });
        resizeObserver = new ResizeObserver(() => map.resize());
        resizeObserver.observe(mapElementRef.current);
        [0, 150, 350].forEach((delay) => {
          resizeTimers.push(window.setTimeout(() => map.resize(), delay));
        });
        readinessTimer = window.setTimeout(() => {
          if (cancelled || map.loaded()) return;
          setMapError(
            t(
              'تعذر تحميل طبقات الخريطة. تحقق من اتصال الإنترنت ثم أعد المحاولة.',
              'Map layers could not be loaded. Check your internet connection and try again.',
            ),
          );
        }, 12000);
      } catch {
        if (cancelled) return;
        setMapError(
          t(
            'تعذر تشغيل الخريطة. تحقق من اتصال الإنترنت ثم أعد فتح النافذة.',
            'The map could not be started. Check your internet connection and reopen the dialog.',
          ),
        );
        setLoadingMap(false);
      }
    };

    const startGoogleMap = async () => {
      if (!apiKey) {
        await startFallbackMap();
        return;
      }

      runtimeWindow.gm_authFailure = () => {
        void startFallbackMap(
          t(
            'تعذر اعتماد مفتاح Google Maps، لذلك تم تشغيل الخريطة الاحتياطية.',
            'The Google Maps key could not be authenticated, so the fallback map is active.',
          ),
        );
      };

      try {
        await loadGoogleMaps(apiKey, isRTL ? 'ar' : 'en');
        if (cancelled || fallbackStarted || !mapElementRef.current) return;

        const map = new google.maps.Map(mapElementRef.current, {
          center,
          zoom: initialPoint ? 15 : 6,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
        });
        googleMapRef.current = map;
        googleGeocoderRef.current = new google.maps.Geocoder();
        googleClickListenerRef.current = map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) selectCoordinates(event.latLng.lat(), event.latLng.lng());
        });
        google.maps.event.addListenerOnce(map, 'idle', () => {
          if (cancelled || fallbackStarted) return;
          setProvider('google');
          setLoadingMap(false);
          setMapReady(true);
          if (initialPoint) updateMarker(initialPoint);
        });
        resizeObserver = new ResizeObserver(() => {
          google.maps.event.trigger(map, 'resize');
          map.setCenter(center);
        });
        resizeObserver.observe(mapElementRef.current);
        [0, 150, 350].forEach((delay) => {
          resizeTimers.push(window.setTimeout(() => {
            google.maps.event.trigger(map, 'resize');
            map.setCenter(center);
          }, delay));
        });
        readinessTimer = window.setTimeout(() => {
          if (cancelled || fallbackStarted || !googleMapRef.current) return;
          setProvider('google');
          setLoadingMap(false);
          setMapReady(true);
        }, 10000);
      } catch {
        await startFallbackMap(
          t(
            'تعذر الاتصال بخدمة Google Maps، لذلك تم تشغيل الخريطة الاحتياطية.',
            'Google Maps could not be reached, so the fallback map is active.',
          ),
        );
      }
    };

    setMapError('');
    setMapReady(false);
    setLoadingMap(true);
    void startGoogleMap();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      resizeTimers.forEach((timer) => window.clearTimeout(timer));
      if (readinessTimer !== null) window.clearTimeout(readinessTimer);
      geocodeRequestRef.current?.abort();
      googleClickListenerRef.current?.remove();
      googleClickListenerRef.current = null;
      googleMarkerRef.current?.setMap(null);
      googleMarkerRef.current = null;
      googleMapRef.current = null;
      googleGeocoderRef.current = null;
      fallbackMarkerRef.current?.remove();
      fallbackMarkerRef.current = null;
      fallbackMapRef.current?.remove();
      fallbackMapRef.current = null;
      mapLibreRuntimeRef.current = null;
      runtimeWindow.gm_authFailure = previousAuthFailure;
    };
  }, [apiKey, hasInitialCoordinates, initialLat, initialLng, isRTL, mapAttempt, open, selectCoordinates, t, updateMarker]);

  const changeMapType = (nextType: MapType) => {
    setMapType(nextType);
    googleMapRef.current?.setMapTypeId(nextType);
    fallbackMapRef.current?.setStyle(createFallbackStyle(nextType));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage(t('تحديد الموقع غير مدعوم في هذا المتصفح.', 'Location is not supported by this browser.'));
      return;
    }

    setLocating(true);
    setMessage('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        selectCoordinates(coords.latitude, coords.longitude, true);
      },
      () => {
        setLocating(false);
        setMessage(
          t(
            'تعذر الوصول إلى موقع الجهاز. تحقق من إذن الموقع أو اختر نقطة على الخريطة.',
            'Could not access your device location. Check location permission or select a point on the map.',
          ),
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  const confirmSelection = () => {
    if (!coordinates || !address.trim()) return;
    onConfirm({ address: address.trim(), ...coordinates });
    onOpenChange(false);
  };

  const mapTypes: Array<{ value: MapType; label: string; icon: typeof MapIcon }> = [
    { value: 'roadmap', label: t('خريطة', 'Map'), icon: MapIcon },
    { value: 'satellite', label: t('قمر صناعي', 'Satellite'), icon: Satellite },
    { value: 'hybrid', label: t('هجين', 'Hybrid'), icon: MapPin },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        dir={isRTL ? 'rtl' : 'ltr'}
        className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-4xl gap-0 overflow-hidden rounded-2xl border-[#dfe1dd] p-0 sm:rounded-3xl"
      >
        <DialogHeader className="relative border-b border-[#dfe1dd] px-4 py-5 pe-16 text-start sm:px-6">
          <DialogTitle className="text-lg font-bold text-[#0e0f0c]">
            {t('تحديد العنوان على الخريطة', 'Select address on the map')}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#5b5e5a]">
            {t(
              'اختر نوع الخريطة ثم انقر على الموقع المطلوب أو استخدم موقع جهازك.',
              'Choose a map type, then click the required location or use your device location.',
            )}
          </DialogDescription>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t('إغلاق', 'Close')}
            className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#dfe1dd] bg-white text-[#5b5e5a] hover:bg-[#f0f1ee] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/40"
          >
            <X size={19} />
          </button>
        </DialogHeader>

        <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto p-4 sm:p-6">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f0f1ee] p-1" role="group" aria-label={t('نوع الخريطة', 'Map type')}>
              {mapTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeMapType(value)}
                  disabled={!mapReady}
                  className={cn(
                    'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition disabled:opacity-50',
                    mapType === value ? 'bg-white text-[#0e0f0c] shadow-sm' : 'text-[#5b5e5a] hover:text-[#0e0f0c]',
                  )}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating || resolving || !mapReady}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] transition hover:border-[#9fe870] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/40 disabled:opacity-50"
            >
              {locating ? <Loader2 size={17} className="animate-spin" /> : <LocateFixed size={17} />}
              {t('استخدام موقعي الحالي', 'Use my current location')}
            </button>
          </div>

          <div className="relative h-[min(52dvh,460px)] min-h-80 w-full overflow-hidden rounded-2xl border border-[#dfe1dd] bg-[#f0f1ee]">
            <div
              ref={mapElementRef}
              className="h-full w-full"
              aria-label={t('خريطة لاختيار الموقع', 'Map for selecting a location')}
              data-map-provider={provider}
              data-map-ready={mapReady ? 'true' : 'false'}
            />
            {loadingMap && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f0f1ee] text-center">
                <Loader2 size={30} className="animate-spin text-[#1ba442]" />
                <p className="mt-3 text-sm font-semibold text-[#0e0f0c]">
                  {t('جاري تحميل الخريطة...', 'Loading map...')}
                </p>
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f0f1ee] p-6 text-center">
                <MapIcon size={28} className="text-[#5b5e5a]" />
                <p className="mt-3 max-w-md text-sm font-semibold text-[#0e0f0c]">{mapError}</p>
                <button
                  type="button"
                  onClick={() => setMapAttempt((attempt) => attempt + 1)}
                  className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#9fe870] px-4 text-sm font-semibold text-[#0e0f0c] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/40"
                >
                  <RefreshCw size={16} />
                  {t('إعادة تحميل الخريطة', 'Reload map')}
                </button>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-[#828782]">
            <span>
              {provider === 'google'
                ? t('مزود الخريطة: Google Maps', 'Map provider: Google Maps')
                : apiKey
                  ? t('تم تشغيل الخريطة الاحتياطية لتعذر Google Maps', 'Fallback map is active because Google Maps is unavailable')
                  : t('الخريطة الاحتياطية فعالة - مفتاح Google Maps غير مهيأ', 'Fallback map active - Google Maps key is not configured')}
            </span>
            <span>{t('انقر على الخريطة لتحديد الموقع', 'Click the map to select a location')}</span>
          </div>

          <div className="mt-4">
            <label htmlFor="student-map-address" className="mb-2 block text-xs font-semibold text-[#5b5e5a]">
              {t('العنوان', 'Address')}
            </label>
            <div className="relative">
              <MapPin size={17} className="pointer-events-none absolute start-3 top-3.5 text-[#828782]" />
              <textarea
                id="student-map-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-[#dfe1dd] bg-white py-3 pe-10 ps-10 text-sm text-[#0e0f0c] outline-none focus:border-[#9fe870] focus:ring-4 focus:ring-[#9fe870]/20"
                placeholder={t('اكتب العنوان أو حدده من الخريطة', 'Enter an address or select it from the map')}
              />
              {resolving && <Loader2 size={17} className="absolute end-3 top-3.5 animate-spin text-[#1ba442]" />}
            </div>
            {coordinates && (
              <p className="mt-2 text-xs text-[#5b5e5a]" dir="ltr">
                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            )}
            {message && <p className="mt-2 text-xs leading-5 text-amber-800">{message}</p>}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="min-h-11 rounded-xl border border-[#dfe1dd] bg-white px-5 text-sm font-semibold text-[#5b5e5a] hover:bg-[#f0f1ee]"
            >
              {t('إلغاء', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={confirmSelection}
              disabled={!coordinates || !address.trim() || resolving}
              className="min-h-11 rounded-xl bg-[#9fe870] px-5 text-sm font-semibold text-[#0e0f0c] hover:bg-[#8ed760] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('استخدام هذا العنوان', 'Use this address')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
