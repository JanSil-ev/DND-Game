import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@mantine/hooks";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import type { Room } from "../model/clubSlice";
import { manorFloors, manorRooms } from "../model/manorPlan";
import type { ManorFloor } from "../model/manorPlan";
import styles from "./ManorMap.module.scss";

export function ManorMap({
  rooms,
  selectedId,
  disabled,
  onSelect,
}: {
  rooms: Room[];
  selectedId: string;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const api = useRef<ReactZoomPanPinchRef>(null);
  const imageContainer = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [floor, setFloor] = useState<ManorFloor | "all">("all");
  const [scale, setScale] = useState(1);
  const [minimumScale, setMinimumScale] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 0 : 300;
  const fit = () => {
    void api.current?.fitToView({ animationTime: duration });
  };
  useEffect(() => {
    const map = imageContainer.current,
      view = viewport.current;
    if (!loaded || error || !map || !view) return;
    const measure = () => {
      if (!map.offsetWidth || !map.offsetHeight || !view.clientWidth || !view.clientHeight) return;
      setMinimumScale(
        Math.min(view.clientWidth / map.offsetWidth, view.clientHeight / map.offsetHeight, 8),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(map);
    observer.observe(view);
    return () => observer.disconnect();
  }, [loaded, error]);
  useEffect(() => {
    if (!loaded || error || minimumScale === null) return;
    void api.current?.fitToView({
      minScale: minimumScale,
      maxScale: minimumScale,
      animationTime: 0,
    });
  }, [loaded, error, minimumScale]);
  const focus = (x: number, y: number, targetScale = 2) => {
    const map = imageContainer.current,
      view = viewport.current;
    if (!map || !view || !loaded || error) return;
    targetScale = Math.max(targetScale, minimumScale ?? 0.25);
    void api.current?.setTransform(
      view.clientWidth / 2 - (x / 100) * map.offsetWidth * targetScale,
      view.clientHeight / 2 - (y / 100) * map.offsetHeight * targetScale,
      targetScale,
      duration,
    );
  };
  const selectFloor = (next: ManorFloor | "all") => {
    setFloor(next);
    if (next === "all") {
      fit();
      return;
    }
    const points = manorRooms.filter((room) => room.floor === next);
    const xs = points.map((point) => point.x),
      ys = points.map((point) => point.y);
    focus((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, 1.6);
  };
  const visible = manorRooms.filter((room) => floor === "all" || room.floor === floor);
  return (
    <div className={styles.layout}>
      <div className={styles.floors} role="group" aria-label="Этажи особняка">
        <button type="button" aria-pressed={floor === "all"} onClick={() => selectFloor("all")}>
          Весь план
        </button>
        {(Object.entries(manorFloors) as [ManorFloor, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={floor === key}
            onClick={() => selectFloor(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <TransformWrapper
        ref={api}
        minScale={minimumScale ?? 0.25}
        maxScale={8}
        centerOnInit
        limitToBounds
        disablePadding
        panning={{ excluded: ["button"] }}
        doubleClick={{ excluded: ["button"] }}
        onTransform={(_, state) => setScale(state.scale)}
      >
        {({ zoomIn, zoomOut }) => (
          <>
            <div className={styles.controls}>
              <span>Приближайте и перемещайте план</span>
              <button
                type="button"
                disabled={!loaded || error || scale <= (minimumScale ?? 0.25) + 0.001}
                aria-label="Отдалить план"
                onClick={() => {
                  void zoomOut(0.3, duration);
                }}
              >
                −
              </button>
              <button
                type="button"
                disabled={!loaded || error}
                aria-label="Приблизить план"
                onClick={() => {
                  void zoomIn(0.3, duration);
                }}
              >
                +
              </button>
              <button type="button" disabled={!loaded || error} onClick={fit} aria-label="Вписать план целиком" title="Вписать план целиком">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'block' }}>
                  <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
                  <rect x="7" y="7" width="10" height="10" rx="1" />
                </svg>
              </button>
            </div>
            <div
              ref={viewport}
              className={styles.viewport}
              aria-label="Карта помещений особняка Тролльего Черепа"
            >
              {!loaded && !error && (
                <p className={styles.message} role="status">
                  Загружаем план…
                </p>
              )}
              {error && (
                <p className={styles.message} role="alert">
                  Не удалось загрузить план. Помещение можно выбрать в списке ниже.
                </p>
              )}
              <TransformComponent wrapperClass={styles.wrapper} contentClass={styles.content}>
                <div className={styles.photo} ref={imageContainer}>
                  <img
                    src={`${import.meta.env.BASE_URL}maps/trollskull-manor.svg`}
                    alt="План особняка Тролльего Черепа: первый, второй, третий этажи, мансарды и подвал"
                    draggable={false}
                    onLoad={() => {
                      setLoaded(true);
                      setError(false);
                    }}
                    onError={() => {
                      setError(true);
                      setLoaded(false);
                    }}
                  />
                  {loaded &&
                    !error &&
                    visible.map((point) => {
                      const room = rooms.find((entry) => entry.id === point.id);
                      if (!room) return null;
                      const number = manorRooms.indexOf(point) + 1;
                      return (
                        <button
                          key={point.id}
                          className={styles.marker}
                          type="button"
                          disabled={disabled}
                          style={{
                            left: `${point.x}%`,
                            top: `${point.y}%`,
                            transform: `translate(-50%, -50%) scale(${1 / scale})`,
                          }}
                          aria-pressed={selectedId === point.id}
                          aria-label={`${number}. ${room.name}, ${manorFloors[point.floor]}`}
                          title={`${room.name} · ${manorFloors[point.floor]}`}
                          aria-controls="club-room-details"
                          onClick={() => onSelect(point.id)}
                        >
                          {number}
                        </button>
                      );
                    })}
                </div>
              </TransformComponent>
            </div>
          </>
        )}
      </TransformWrapper>
      <label className={styles.roomSelect}>
        Выбрать помещение
        <select
          value={selectedId}
          disabled={disabled}
          onChange={(event) => {
            onSelect(event.target.value);
            const point = manorRooms.find((entry) => entry.id === event.target.value);
            if (point) {
              setFloor(point.floor);
              focus(point.x, point.y);
            }
          }}
        >
          {Object.entries(manorFloors).map(([key, label]) => (
            <optgroup key={key} label={label}>
              {manorRooms
                .filter((point) => point.floor === key)
                .map((point) => (
                  <option key={point.id} value={point.id}>
                    {manorRooms.indexOf(point) + 1}.{" "}
                    {rooms.find((room) => room.id === point.id)?.name ?? point.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
    </div>
  );
}
