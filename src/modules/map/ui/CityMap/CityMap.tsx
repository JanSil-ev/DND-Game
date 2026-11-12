import { useEffect, useMemo, useState } from "react";
import type { FormEvent, MouseEvent as ReactMouseEvent } from "react";
import type { CSSProperties } from "react";
import { ActionIcon, Group, Text, Title } from "@mantine/core";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { locationTypes, locations } from "../../model/location";
import type { MapLocation, MapLocationType } from "../../model/types";
import { readUserLocations, saveUserLocations } from "../../model/userLocations";
import styles from "./CityMap.module.scss";

interface PendingLocation {
  x: number;
  y: number;
}

interface UserLocationsState {
  locations: MapLocation[];
  ready: boolean;
  error: string | null;
}


const markerIcons: Record<MapLocationType, string> = {
  city: "M2 21V9l3-2V3h3v3l4-3 4 3V3h3v4l3 2v12h-8v-6h-4v6H2zm3-2h3v-4H5v4zm0-7h3V9H5v3zm11 7h3v-4h-3v4zm0-7h3V9h-3v3zm-6 0h4V8h-4v4z",
  club: "M12 2 3 6v6c0 5.2 3.5 8.5 9 10 5.5-1.5 9-4.8 9-10V6l-9-4zm0 2.2 7 3.1V12c0 4-2.5 6.6-7 8-4.5-1.4-7-4-7-8V7.3l7-3.1zM7 7l10 10-1.5 1.5-10-10L7 7zm10 0 1.5 1.5-10 10L7 17 17 7z",
  shop: "M8 2h8l-2 4 2 2c3.2 2.5 5 5.5 5 9a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5c0-3.5 1.8-6.5 5-9l2-2-2-4zm2.5 2 1 2h1l1-2h-3zM12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-1 1h2v1h1v2h-1v-1h-2v1h2a2 2 0 0 1 0 4h-1v1h-2v-1H9v-2h2v1h2v-1h-2a2 2 0 0 1 0-4v-1z",
  quest: "M11 2h2v11l2 2-2 2v4l-1 2-1-2v-4l-2-2 2-2V2zM5 13h14v3H5v-3zm5-11h4l-1 10h-2L10 2z",
  dungeon: "M2 21V10l4-6 4 3 3-5 4 5 3-2 2 5v11H2zm3-2h3v-5l4-5 4 5v5h3v-8l-2-3-4 3-3-4-3 3-2-1v10zm5 0h4v-5l-2-2-2 2v5z",
  temple: "M12 1l2 4v3l6 4v9H4v-9l6-4V5l2-4zm0 4-1 2v2l-5 4v6h4v-5a2 2 0 0 1 4 0v5h4v-6l-5-4V7l-1-2zm-1 5h2v2h-2v-2zM2 21h20v2H2v-2z",
  tavern: "M5 6c0-2 2-3 3-2 1-2 4-2 5 0 2-1 4 0 4 2h2a3 3 0 0 1 3 3v5a4 4 0 0 1-4 4h-1v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6zm2 2v12h8V8H7zm10 1v7h1a2 2 0 0 0 2-2V9h-3zM9 10h2v8H9v-8zm4 0h1v8h-1v-8z",
  other: "M8 2h8l6 7-10 13L2 9l6-7zm1 2L5 9h5l1-5H9zm4 0 1 5h5l-4-5h-2zM5 11l7 9-2-9H5zm7 9 7-9h-5l-2 9z",
};


function loadUserLocations(): UserLocationsState {
  try {
    return { locations: readUserLocations(), ready: true, error: null };
  } catch (error) {
    console.error("Не удалось загрузить сохранённые метки карты.", error);
    return {
      locations: [],
      ready: false,
      error: "Не удалось прочитать сохранённые метки. Они не будут перезаписаны.",
    };
  }
}

export function CityMap() {
  const [selected, setSelected] = useState<MapLocation | null>(null);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<MapLocationType | "all">("all");
  const [imageError, setImageError] = useState(false);
  const [imageRetry, setImageRetry] = useState(0);
  const [mapScale, setMapScale] = useState(1);
  const [userLocationsState, setUserLocationsState] = useState(loadUserLocations);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<PendingLocation | null>(null);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationDescription, setNewLocationDescription] = useState("");
  const [newLocationType, setNewLocationType] = useState<MapLocationType>("other");

  const allLocations = useMemo(
    () => [...locations, ...userLocationsState.locations],
    [userLocationsState.locations],
  );

  useEffect(() => {
    if (!userLocationsState.ready) return;

    try {
      saveUserLocations(userLocationsState.locations);
    } catch (error) {
      console.error("Не удалось сохранить пользовательские метки карты.", error);
      setUserLocationsState((state) => ({
        ...state,
        ready: false,
        error: "Не удалось сохранить метки в этом браузере.",
      }));
    }
  }, [userLocationsState.locations, userLocationsState.ready]);

  const filteredLocations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru");

    return allLocations.filter((location) => {
      const matchesType = activeType === "all" || location.type === activeType;
      const matchesQuery =
        !normalizedQuery ||
        `${location.name} ${location.description}`
          .toLocaleLowerCase("ru")
          .includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [activeType, allLocations, query]);

  const availableTypes = useMemo(
    (): MapLocationType[] => [...new Set(allLocations.map((location) => location.type))],
    [allLocations],
  );

  const markerSize = Math.max(0.1, 2 - (mapScale - 1) * 0.4);

  const handleMapClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isAddingLocation || imageError) return;
    if (event.target instanceof Element && event.target.closest("button")) return;

    const mapBounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - mapBounds.left) / mapBounds.width) * 100;
    const y = ((event.clientY - mapBounds.top) / mapBounds.height) * 100;

    setPendingLocation({
      x: Math.min(100, Math.max(0, Number(x.toFixed(2)))),
      y: Math.min(100, Math.max(0, Number(y.toFixed(2)))),
    });
    setNewLocationName("");
    setNewLocationDescription("");
    setNewLocationType("other");
  };

  const handleCreateLocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingLocation) return;

    const newLocation: MapLocation = {
      id: `user-${crypto.randomUUID()}`,
      name: newLocationName.trim(),
      description: newLocationDescription.trim(),
      ...pendingLocation,
      type: newLocationType,
      source: "user",
    };

    setUserLocationsState((state) => ({
      ...state,
      locations: [...state.locations, newLocation],
    }));
    setSelected(newLocation);
    setPendingLocation(null);
    setIsAddingLocation(false);
    setQuery("");
    setActiveType("all");
  };

  const handleDeleteLocation = (id: string) => {
    setUserLocationsState((state) => ({
      ...state,
      locations: state.locations.filter((location) => location.id !== id),
    }));
    setSelected(null);
  };

  return (
    <section className={styles.layout} aria-label="Интерактивная карта">
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={5}
        centerOnInit
        limitToBounds
        onTransform={(_, state) => setMapScale(state.scale)}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <div className={styles.viewer}>
            <div className={styles.mapToolbar}>
              <div>
                <p className={styles.mapEyebrow}>Картографический атлас</p>
                <p className={styles.mapTitle}>План города</p>
              </div>
              <div className={styles.toolbarActions}>
                <Group className={styles.controls} gap={6}>
                  <ActionIcon
                    className={styles.control}
                    onClick={() => zoomOut()}
                    aria-label="Отдалить карту"
                    title="Отдалить"
                  >
                    −
                  </ActionIcon>
                  <ActionIcon
                    className={styles.control}
                    onClick={() => zoomIn()}
                    aria-label="Приблизить карту"
                    title="Приблизить"
                  >
                    +
                  </ActionIcon>
                  <ActionIcon
                    className={styles.control}
                    onClick={() => resetTransform()}
                    aria-label="Сбросить масштаб и положение карты"
                    title="Сбросить"
                  >
                    ⌖
                  </ActionIcon>
                </Group>
              </div>
            </div>

            <div className={styles.mapViewport}>
              {imageError && (
                <div className={styles.mapError} role="alert">
                  <strong>Не удалось загрузить карту</strong>
                  <span>Проверьте, что файл доступен в public/maps/waterdeep.jpg.</span>
                  <button
                    className={styles.retryButton}
                    onClick={() => setImageRetry((attempt) => attempt + 1)}
                    type="button"
                  >
                    Повторить загрузку
                  </button>
                </div>
              )}

              <TransformComponent wrapperClass={styles.mapWrapper} contentClass={styles.mapContent}>
                <div
                  className={styles.map}
                  data-error={imageError}
                  data-adding={isAddingLocation}
                  onClick={handleMapClick}
                >
                  <img
                    key={imageRetry}
                    src={`/maps/waterdeep.jpg?attempt=${imageRetry}`}
                    alt="Подробная карта города Вотердип"
                    className={styles.image}
                    draggable={false}
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />

                  {!imageError &&
                    filteredLocations.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        className={styles.marker}
                        data-type={location.type}
                        data-selected={selected?.id === location.id}
                        style={
                          {
                            left: `${location.x}%`,
                            top: `${location.y}%`,
                            width: `${markerSize}rem`,
                            height: `${markerSize}rem`,
                            color: locationTypes[location.type].color,
                            "--marker-hit-size": `${3.5 / mapScale}rem`,
                          } as CSSProperties & { "--marker-hit-size": string }
                        }
                        aria-label={`${location.name}, ${locationTypes[location.type].label}`}
                        aria-pressed={selected?.id === location.id}
                        onClick={() => setSelected(location)}
                      >
                        <svg className={styles.markerIcon} viewBox="0 0 24 24" aria-hidden="true">
                          <path d={markerIcons[location.type]} />
                        </svg>
                      </button>
                    ))}
                  {pendingLocation && (
                    <span
                      className={styles.pendingMarker}
                      aria-label="Новая метка"
                      style={{
                        left: `${pendingLocation.x}%`,
                        top: `${pendingLocation.y}%`,
                      }}
                    />
                  )}
                </div>
              </TransformComponent>
            </div>
            <p className={styles.mapHint}>
              {isAddingLocation
                ? "Нажмите или коснитесь карты, чтобы выбрать место для новой метки."
                : "Перетаскивайте карту, используйте масштаб или включите добавление метки."}
            </p>
          </div>
        )}
      </TransformWrapper>

      <aside className={styles.sidebar} aria-label="Места на карте">
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
        </div>

        <button
          className={styles.sidebarAddButton}
          data-active={isAddingLocation}
          onClick={() => {
            setIsAddingLocation((adding) => !adding);
            setPendingLocation(null);
            setSelected(null);
          }}
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
              className={styles.filter}
              data-active={activeType === type}
              key={type}
              onClick={() => {
                setActiveType(type);
                setSelected(null);
              }}
              type="button"
            >
              {locationTypes[type].label}
            </button>
          ))}
        </div>

        <div className={styles.locationList} aria-live="polite">
          {filteredLocations.length > 0 ? (
            filteredLocations.map((location) => (
              <button
                className={styles.locationItem}
                data-selected={selected?.id === location.id}
                key={location.id}
                onClick={() => setSelected(location)}
                type="button"
              >
                <span
                  className={styles.locationGlyph}
                  data-type={location.type}
                  style={{ backgroundColor: locationTypes[location.type].color }}
                  aria-hidden="true"
                >
                  ✦
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
                <span className={styles.detailType}>Новая метка</span>
                <ActionIcon
                  className={styles.closeButton}
                  onClick={() => setPendingLocation(null)}
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
                  if (type in locationTypes) setNewLocationType(type as MapLocationType);
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
                Сохранить метку
              </button>
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
              {selected.source === "user" && (
                <button
                  className={styles.deleteLocationButton}
                  onClick={() => handleDeleteLocation(selected.id)}
                  type="button"
                >
                  Удалить мою метку
                </button>
              )}
            </>
          ) : (
            <p className={styles.detailPrompt}>
              {isAddingLocation
                ? "Коснитесь карты в нужном месте. Название улицы или точки можно добавить по-русски."
                : "Выберите отметку на карте или место из списка."}
            </p>
          )}
        </div>
      </aside>
    </section>
  );
}
