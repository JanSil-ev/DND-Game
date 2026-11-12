import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, MouseEvent as ReactMouseEvent } from "react";

import { ActionIcon, Group, Loader, Text, Title } from "@mantine/core";
import { useFocusTrap, useMediaQuery, useReducedMotion } from "@mantine/hooks";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { Link, useSearchParams } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks';
import { routes } from '../../../../app/router/routes';
import { mapLocationsSaved, mapLocationsSaveFailed, selectMapLocations } from '../../model/mapLocationsSlice';
import { priorities } from '../../../notes/model/notesSlice';

import { locationTypes } from "../../model/location";
import type { MapLocation, MapLocationType } from "../../model/types";
import { saveUserLocations } from "../../model/userLocations";

import styles from "./CityMap.module.scss";

interface PendingLocation {
  x: number;
  y: number;
}

type MarkerStyle = CSSProperties & {
  "--marker-scale": number;
  "--marker-hit-size": string;
  "--marker-border-width": string;
  "--marker-shadow-offset": string;
  "--marker-shadow-blur": string;
};

type PendingMarkerStyle = CSSProperties & {
  "--pending-scale": number;
};

const BASE_URL = import.meta.env.BASE_URL;

const MAP_IMAGE = `${BASE_URL}maps/waterdeep.svg`;
const MARKERS_PATH = `${BASE_URL}icon/markers/`;

const MIN_SCALE = 1;
const MAX_SCALE = 80;

const MARKER_BASE_SIZE = 40;
const MARKER_MIN_SIZE = 28;
const MARKER_HIT_SIZE = 44;

function getMarkerIcon(type: MapLocationType): string {
  return `${MARKERS_PATH}${locationTypes[type].icon}`;
}

function getMarkerStyle(location: MapLocation, mapScale: number): MarkerStyle {
  const scale = Math.max(mapScale, MIN_SCALE);

  const screenSize = Math.max(MARKER_MIN_SIZE, MARKER_BASE_SIZE - 2 * Math.log2(scale));

  const markerScale = screenSize / (MARKER_BASE_SIZE * scale);

  const decorationScale = MARKER_BASE_SIZE / screenSize;

  const hitSize = Math.max(MARKER_HIT_SIZE, screenSize) / (markerScale * scale);

  return {
    left: `${location.x}%`,
    top: `${location.y}%`,

    "--marker-scale": markerScale,
    "--marker-hit-size": `${hitSize}px`,
    "--marker-border-width": `${2 * decorationScale}px`,
    "--marker-shadow-offset": `${2 * decorationScale}px`,
    "--marker-shadow-blur": `${6 * decorationScale}px`,
  };
}

function getPendingMarkerStyle(location: PendingLocation, mapScale: number): PendingMarkerStyle {
  return {
    left: `${location.x}%`,
    top: `${location.y}%`,
    "--pending-scale": 1 / Math.max(mapScale, MIN_SCALE),
  };
}

export function CityMap() {
  const dispatch = useAppDispatch();
  const userLocationsState = useAppSelector((state) => state.mapLocations);
  const allLocations = useAppSelector(selectMapLocations);
  const notes = useAppSelector((state) => state.notes.items);
  const notesReadOnly = useAppSelector((state) => state.notes.readOnly);
  const [params] = useSearchParams();
  const requestedPlace = params.get('place');
  const focusedPlace = useRef<string | null>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fullscreenButtonRef = useRef<HTMLButtonElement>(null);
  const panelButtonRef = useRef<HTMLButtonElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const compact = useMediaQuery('(max-width: 767px), (max-width: 1100px) and (orientation: portrait)');
  const reducedMotion = useReducedMotion();
  const fullscreenTrap = useFocusTrap(isExpanded);
  const panelTrap = useFocusTrap(Boolean(compact && panelOpen));
  const [selected, setSelected] = useState<MapLocation | null>(null);

  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<MapLocationType | "all">("all");

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageRetry, setImageRetry] = useState(0);

  const [mapScale, setMapScale] = useState(1);

  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<PendingLocation | null>(null);

  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationDescription, setNewLocationDescription] = useState("");
  const [newLocationType, setNewLocationType] = useState<MapLocationType>("other");

  const linkedNotes = useMemo(() => notes.filter((note) => note.locationId === selected?.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [notes, selected?.id]);

  const commitLocations = (next: MapLocation[]) => {
    try {
      saveUserLocations(next);
      dispatch(mapLocationsSaved(next));
      return true;
    } catch (error) {
      console.error("Не удалось сохранить метки:", error);

      dispatch(mapLocationsSaveFailed("Не удалось сохранить изменения в этом браузере. Попробуйте ещё раз; прежние метки сохранены."));
      return false;
    }
  };

  const lockPage = isExpanded || Boolean(compact && panelOpen);
  useEffect(() => {
    if (!lockPage) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [lockPage]);

  const closePanel = () => {
    setPanelOpen(false);
    panelButtonRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (panelOpen && compact) {
        setPanelOpen(false);
        panelButtonRef.current?.focus({ preventScroll: true });
      } else if (isExpanded) {
        setIsExpanded(false);
        fullscreenButtonRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [isExpanded, panelOpen, compact]);

  const focusLocation = useCallback((location: Pick<MapLocation, 'x' | 'y'>) => {
    const map = mapRef.current;
    const viewport = viewportRef.current;
    const api = transformRef.current;
    if (!map || !viewport || !api || imageLoading || imageError) return;
    const scale = Math.max(4, api.state.scale);
    void api.setTransform(
      viewport.clientWidth / 2 - location.x / 100 * map.offsetWidth * scale,
      viewport.clientHeight / 2 - location.y / 100 * map.offsetHeight * scale,
      scale, reducedMotion ? 0 : 350,
    );
  }, [imageLoading, imageError, reducedMotion]);

  useEffect(() => {
    if (!requestedPlace) { focusedPlace.current = null; return; }
    if (imageLoading || imageError || focusedPlace.current === requestedPlace) return;
    const place = allLocations.find((location) => location.id === requestedPlace);
    if (!place) return;
    const frame = requestAnimationFrame(() => {
      focusedPlace.current = requestedPlace;
      setSelected(place);
      setQuery(''); setActiveType('all');
      focusLocation(place);
      viewportRef.current?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [requestedPlace, allLocations, imageLoading, imageError, focusLocation, reducedMotion]);

  const filteredLocations = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("ru");

    return allLocations.filter((location) => {
      const matchesType = activeType === "all" || location.type === activeType;

      const matchesSearch =
        !search ||
        `${location.name} ${location.description}`.toLocaleLowerCase("ru").includes(search);

      return matchesType && matchesSearch;
    });
  }, [allLocations, activeType, query]);

  const availableTypes = useMemo(
    () => [...new Set(allLocations.map((location) => location.type))],
    [allLocations],
  );

  const handleRetryImage = () => {
    setImageLoading(true);
    setImageError(false);
    setImageRetry((current) => current + 1);
  };

  const handleSelectLocation = (location: MapLocation) => {
    if (isAddingLocation || pendingLocation) return;

    setPendingLocation(null);
    setSelected(location);
    focusLocation(location);
    setPanelOpen(false);
    if (compact) viewportRef.current?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' });
  };

  const handleMapClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isAddingLocation || imageError || imageLoading || dragged.current) return;

    if (event.target instanceof Element && event.target.closest("button")) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    if (bounds.width === 0 || bounds.height === 0) return;

    const x = ((event.clientX - bounds.left) / bounds.width) * 100;

    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    setPendingLocation({
      x: Math.min(100, Math.max(0, Number(x.toFixed(2)))),
      y: Math.min(100, Math.max(0, Number(y.toFixed(2)))),
    });

    if (!editingId && !pendingLocation) {
      setNewLocationName("");
      setNewLocationDescription("");
      setNewLocationType("other");
    }
    setIsAddingLocation(false);
    setPanelOpen(true);
  };

  const handleCreateLocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!pendingLocation || !userLocationsState.ready) return;

    const name = newLocationName.trim();

    if (!name) return;

    const newLocation: MapLocation = {
      id: editingId ?? `user-${crypto.randomUUID()}`,
      name,
      description: newLocationDescription.trim(),
      ...pendingLocation,
      type: newLocationType,
      source: "user",
    };

    const next = editingId
      ? userLocationsState.locations.map((location) => location.id === editingId ? newLocation : location)
      : [...userLocationsState.locations, newLocation];
    if (!commitLocations(next)) return;

    setSelected(newLocation);
    setPendingLocation(null);
    setIsAddingLocation(false);
    setEditingId(null);
    setQuery("");
    setActiveType("all");
  };

  const handleDeleteLocation = (id: string) => {
    if (!commitLocations(userLocationsState.locations.filter((location) => location.id !== id))) return;

    setSelected(null);
  };

  const handleEditLocation = (location: MapLocation) => {
    setEditingId(location.id);
    setPendingLocation({ x: location.x, y: location.y });
    setNewLocationName(location.name);
    setNewLocationDescription(location.description);
    setNewLocationType(location.type);
    setIsAddingLocation(false);
    setPanelOpen(true);
  };

  const cancelEditing = () => {
    setPendingLocation(null);
    setEditingId(null);
    setIsAddingLocation(false);
  };

  const handleToggleAdding = () => {
    setIsAddingLocation((current) => !current);
    setPendingLocation(null);
    setSelected(null);
    setEditingId(null);
    setPanelOpen(false);
    if (compact) viewportRef.current?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'instant' : 'smooth' });
  };

  return (
    <section ref={fullscreenTrap} className={styles.layout} data-expanded={isExpanded}
      role={isExpanded ? 'dialog' : undefined} aria-modal={isExpanded || undefined}
      aria-label="Интерактивная карта Вотердипа">
      {requestedPlace && !allLocations.some((location) => location.id === requestedPlace) &&
        <p className={styles.missingPlace} role="status">Место удалено или недоступно в этом браузере. Другие места карты доступны.</p>}
      <TransformWrapper
        ref={transformRef}
        initialScale={MIN_SCALE}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        centerOnInit
        limitToBounds
        panning={{ excluded: ['button', 'input', 'select', 'textarea'] }}
        doubleClick={{ disabled: isAddingLocation, excluded: ['button'] }}
        onPinchStart={() => { dragged.current = true; }}
        onTransform={(_, state) => {
          setMapScale(state.scale);
        }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <div className={styles.viewer}>
            <div className={styles.mapToolbar}>
              <div>
                <p className={styles.mapEyebrow}>Картографический атлас</p>
                <p className={styles.mapTitle}>План города</p>
              </div>

              <div className={styles.toolbarActions}>
                <button ref={panelButtonRef} className={styles.placesButton} type="button" aria-expanded={panelOpen}
                  aria-controls="map-places-panel" onClick={() => setPanelOpen((current) => !current)}>
                  Места · {allLocations.length}
                </button>
                <Group className={styles.controls} gap={6}>
                  <ActionIcon
                    className={styles.control}
                    onClick={() => zoomOut(0.5)}
                    aria-label="Отдалить карту"
                    title="Отдалить"
                  >
                    −
                  </ActionIcon>
                  <ActionIcon ref={fullscreenButtonRef} className={styles.control}
                    onClick={() => setIsExpanded((current) => !current)}
                    aria-label={isExpanded ? 'Свернуть карту' : 'Развернуть карту на весь экран'}
                    title={isExpanded ? 'Свернуть (Esc)' : 'На весь экран'} aria-pressed={isExpanded}>
                    {isExpanded ? '⤡' : '⤢'}
                  </ActionIcon>

                  <ActionIcon
                    className={styles.control}
                    onClick={() => zoomIn(0.5)}
                    aria-label="Приблизить карту"
                    title="Приблизить"
                  >
                    +
                  </ActionIcon>

                  <ActionIcon
                    className={styles.control}
                    onClick={() => resetTransform()}
                    aria-label="Сбросить масштаб"
                    title="Сбросить"
                  >
                    ⌖
                  </ActionIcon>
                </Group>
              </div>
            </div>

            <div ref={viewportRef} className={styles.mapViewport}>
              {imageLoading && !imageError && (
                <div className={styles.mapLoading} role="status">
                  <Loader color="yellow" size="lg" />
                  <Text c="white" size="sm">
                    Загружаем карту Вотердипа...
                  </Text>
                </div>
              )}

              {imageError && (
                <div className={styles.mapError} role="alert">
                  <strong>Не удалось загрузить карту</strong>
                  <span>Проверь файл public/maps/waterdeep.svg</span>

                  <button type="button" className={styles.retryButton} onClick={handleRetryImage}>
                    Повторить загрузку
                  </button>
                </div>
              )}

              <TransformComponent wrapperClass={styles.mapWrapper} contentClass={styles.mapContent}>
                <div
                  ref={mapRef}
                  className={styles.map}
                  data-error={imageError}
                  data-adding={isAddingLocation}
                  onClick={handleMapClick}
                  onPointerDown={(event) => {
                    if (!event.isPrimary) { dragged.current = true; return; }
                    pointerStart.current = { x: event.clientX, y: event.clientY };
                    dragged.current = false;
                  }}
                  onPointerMove={(event) => {
                    const start = pointerStart.current;
                    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) dragged.current = true;
                  }}
                  onPointerUp={() => { pointerStart.current = null; }}
                  onPointerCancel={() => { dragged.current = true; pointerStart.current = null; }}
                >
                  <img
                    key={imageRetry}
                    src={`${MAP_IMAGE}?attempt=${imageRetry}`}
                    alt="Подробная карта города Вотердип"
                    className={styles.image}
                    draggable={false}
                    onLoad={() => {
                      setImageLoading(false);
                      setImageError(false);
                    }}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />

                  {!imageError &&
                    !imageLoading &&
                    filteredLocations.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        className={styles.marker}
                        data-type={location.type}
                        data-selected={selected?.id === location.id}
                        style={getMarkerStyle(location, mapScale)}
                        aria-label={`${location.name}, ${locationTypes[location.type].label}`}
                        aria-pressed={selected?.id === location.id}
                        onClick={() => handleSelectLocation(location)}
                      >
                        <img
                          src={getMarkerIcon(location.type)}
                          alt=""
                          aria-hidden="true"
                          className={styles.markerIcon}
                          draggable={false}
                        />
                      </button>
                    ))}

                  {pendingLocation && (
                    <span
                      className={styles.pendingMarker}
                      style={getPendingMarkerStyle(pendingLocation, mapScale)}
                    />
                  )}
                </div>
              </TransformComponent>
            </div>

            <p className={styles.mapHint}>
              {isAddingLocation
                ? editingId ? "Выберите новое положение метки. Перетаскивание карты не меняет её положение." : "Коснитесь карты, чтобы выбрать место для новой метки."
                : "Перетаскивайте карту и изменяйте масштаб."}
              {isAddingLocation && <button className={styles.cancelPicking} type="button" onClick={cancelEditing}>Отмена</button>}
            </p>
            {selected && !pendingLocation && <button type="button" className={styles.selectedPlace}
              onClick={() => setPanelOpen(true)} aria-controls="map-places-panel">
              {selected.name} <span>Подробнее ›</span>
            </button>}
          </div>
        )}
      </TransformWrapper>

      {compact && panelOpen && <button type="button" className={styles.panelBackdrop} aria-label="Закрыть список мест" onClick={closePanel} />}
      <aside ref={panelTrap} id="map-places-panel" className={styles.sidebar} data-open={panelOpen}
        role={compact && panelOpen ? 'dialog' : undefined} aria-modal={compact && panelOpen || undefined} aria-label="Места на карте">
        <div className={styles.sidebarHeader}>
          <div>
            <p className={styles.sidebarEyebrow}>Путеводитель</p>
            <Title className={styles.sidebarTitle} order={2}>
              Известные места
            </Title>
          </div>

          <span className={styles.locationCount} aria-label={`Мест: ${filteredLocations.length}`}>
            {filteredLocations.length}
          </span>
          <button type="button" className={styles.panelClose} onClick={closePanel} aria-label="Закрыть места">×</button>
        </div>

        <button
          className={styles.sidebarAddButton}
          data-active={isAddingLocation}
          disabled={!userLocationsState.ready}
          onClick={handleToggleAdding}
          type="button"
        >
          {isAddingLocation ? "Отменить добавление" : "＋ Поставить метку на карте"}
        </button>

        {userLocationsState.error && (
          <p className={styles.storageError} role="status">
            {userLocationsState.error}
          </p>
        )}

        <label className={styles.searchLabel} htmlFor="map-location-search">
          Найти место
        </label>

        <input
          id="map-location-search"
          className={styles.search}
          type="search"
          placeholder="Название или описание"
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setSelected(null);
          }}
        />

        <div className={styles.filters} role="group" aria-label="Фильтр по типу места">
          <button
            className={styles.filter}
            data-active={activeType === "all"}
            onClick={() => {
              setActiveType("all");
              setSelected(null);
            }}
            type="button"
          >
            Все места
          </button>

          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={styles.filter}
              data-active={activeType === type}
              onClick={() => {
                setActiveType(type);
                setSelected(null);
              }}
            >
              {locationTypes[type].label}
            </button>
          ))}
        </div>

        <div className={styles.locationList} aria-live="polite">
          {filteredLocations.length > 0 ? (
            filteredLocations.map((location) => (
              <button
                key={location.id}
                className={styles.locationItem}
                data-selected={selected?.id === location.id}
                onClick={() => handleSelectLocation(location)}
                type="button"
              >
                <span className={styles.locationGlyph} aria-hidden="true">
                  <img
                    src={getMarkerIcon(location.type)}
                    alt=""
                    className={styles.locationGlyphIcon}
                  />
                </span>

                <span className={styles.locationCopy}>
                  <span className={styles.locationName}>{location.name}</span>

                  <span className={styles.locationType}>{locationTypes[location.type].label}</span>
                </span>

                <span className={styles.locationArrow} aria-hidden="true">
                  ›
                </span>
              </button>
            ))
          ) : (
            <Text className={styles.emptyState} size="sm">
              Места по этому запросу не найдены.
            </Text>
          )}
        </div>

        <div className={styles.detailPanel} aria-live="polite">
          {pendingLocation ? (
            <form className={styles.locationForm} onSubmit={handleCreateLocation}>
              <div className={styles.detailTopline}>
                <span className={styles.detailType}>{editingId ? 'Редактирование метки' : 'Новая метка'}</span>

                <ActionIcon
                  className={styles.closeButton}
                  onClick={cancelEditing}
                  aria-label="Отменить выбор точки"
                  title="Отменить"
                  type="button"
                >
                  ×
                </ActionIcon>
              </div>

              <label className={styles.formLabel} htmlFor="map-location-name">
                Название
              </label>

              <input
                autoFocus
                required
                maxLength={80}
                id="map-location-name"
                className={styles.search}
                value={newLocationName}
                onChange={(event) => setNewLocationName(event.currentTarget.value)}
                placeholder="Например, Улица Фонарей"
              />

              <label className={styles.formLabel} htmlFor="map-location-type">
                Тип места
              </label>

              <select
                id="map-location-type"
                className={styles.search}
                value={newLocationType}
                onChange={(event) => {
                  const type = event.currentTarget.value;

                  if (type in locationTypes) {
                    setNewLocationType(type as MapLocationType);
                  }
                }}
              >
                {Object.entries(locationTypes).map(([type, category]) => (
                  <option key={type} value={type}>
                    {category.label}
                  </option>
                ))}
              </select>

              <label className={styles.formLabel} htmlFor="map-location-description">
                Заметка
              </label>

              <textarea
                id="map-location-description"
                className={styles.textarea}
                rows={3}
                maxLength={300}
                value={newLocationDescription}
                onChange={(event) => setNewLocationDescription(event.currentTarget.value)}
                placeholder="Что важно помнить об этом месте?"
              />

              <button className={styles.saveLocationButton} type="submit">
                {editingId ? 'Сохранить изменения' : 'Сохранить метку'}
              </button>
              <p className={styles.coordinates}>Точка: {pendingLocation.x}% · {pendingLocation.y}%</p>
              <button className={styles.editLocationButton} type="button" onClick={() => {
                setIsAddingLocation(true); setPanelOpen(false);
                if (compact) viewportRef.current?.scrollIntoView({ block: 'nearest' });
              }}>Выбрать другое место на карте</button>
            </form>
          ) : selected ? (
            <>
              <div className={styles.detailTopline}>
                <span className={styles.detailType}>{locationTypes[selected.type].label}</span>

                <ActionIcon
                  className={styles.closeButton}
                  onClick={() => setSelected(null)}
                  aria-label="Снять выбор места"
                  title="Снять выбор"
                >
                  ×
                </ActionIcon>
              </div>

              <h3 className={styles.detailTitle}>{selected.name}</h3>

              <p className={styles.detailDescription}>{selected.description}</p>

              <section className={styles.linkedNotes} aria-label="Заметки об этом месте">
                <h4>Заметки о месте · {linkedNotes.length}</h4>
                {linkedNotes.length > 0 ? <ul>
                  {linkedNotes.slice(0, 3).map((note) => <li key={note.id}>
                    <Link to={`${routes.notes}?place=${encodeURIComponent(selected.id)}&note=${encodeURIComponent(note.id)}`}>
                      <span className={styles.notePriority} data-priority={note.priority} aria-label={`${priorities[note.priority]} приоритет`} />
                      {note.title}
                    </Link>
                  </li>)}
                </ul> : <p>Здесь пока нет записей.</p>}
                <div className={styles.linkedNoteActions}>
                  {!notesReadOnly && <Link to={`${routes.notes}?place=${encodeURIComponent(selected.id)}&new=1`}>＋ Добавить запись</Link>}
                  {linkedNotes.length > 0 && <Link to={`${routes.notes}?place=${encodeURIComponent(selected.id)}`}>Все записи →</Link>}
                </div>
              </section>

              {selected.source === "user" && userLocationsState.ready && (
                <div className={styles.detailActions}>
                <button className={styles.editLocationButton} onClick={() => handleEditLocation(selected)} type="button">Редактировать метку</button>
                <button
                  className={styles.deleteLocationButton}
                  onClick={() => handleDeleteLocation(selected.id)}
                  type="button"
                >
                  Удалить мою метку
                </button>
                </div>
              )}
            </>
          ) : (
            <p className={styles.detailPrompt}>
              {isAddingLocation
                ? "Коснитесь карты в нужном месте. Название можно добавить по-русски."
                : "Выберите отметку на карте или место из списка."}
            </p>
          )}
        </div>
      </aside>
    </section>
  );
}
