"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { PinnedItemTile } from "@/components/item-list-row";
import type { Item } from "@/lib/types";

type DragSession = {
  id: string;
  pointerId: number;
  startOrder: string[];
  ghost: HTMLElement;
  offsetX: number;
  offsetY: number;
};

export function PinnedCarousel({
  items,
  onOpen,
  onReorder,
}: {
  items: Item[];
  onOpen: (item: Item) => void;
  onReorder: (ids: string[]) => Promise<void>;
}) {
  const incomingIds = items.map((item) => item.id).join(",");
  const [order, setOrder] = useState<string[]>(() => items.map((item) => item.id));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const orderRef = useRef(order);
  const activeDrag = useRef<DragSession | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef(new Map<string, HTMLDivElement>());
  const lastRects = useRef(new Map<string, DOMRect>());

  useEffect(() => {
    if (activeDrag.current) return;
    const next = incomingIds ? incomingIds.split(",") : [];
    orderRef.current = next;
    setOrder(next);
  }, [incomingIds]);

  useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>();
    for (const id of order) {
      const element = tilesRef.current.get(id);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      const previous = lastRects.current.get(id);
      const difference = previous ? previous.left - rect.left : 0;
      if (Math.abs(difference) > 1 && id !== draggedId) {
        element.animate(
          [{ transform: `translateX(${difference}px)` }, { transform: "translateX(0px)" }],
          { duration: 190, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
      }
      nextRects.set(id, rect);
    }
    lastRects.current = nextRects;
  }, [order, draggedId]);

  useEffect(() => {
    return () => {
      activeDrag.current?.ghost.remove();
      activeDrag.current = null;
    };
  }, []);

  function beginDrag(event: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (activeDrag.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    const source = tilesRef.current.get(id);
    if (!source) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const rect = source.getBoundingClientRect();
    const ghost = source.cloneNode(true) as HTMLElement;
    ghost.setAttribute("aria-hidden", "true");
    ghost.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;z-index:2000;pointer-events:none;opacity:.96;transform:scale(1.055);box-shadow:0 14px 35px rgba(0,0,0,.5);border-radius:12px;`;
    document.body.appendChild(ghost);

    activeDrag.current = {
      id,
      pointerId: event.pointerId,
      startOrder: [...orderRef.current],
      ghost,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    setDraggedId(id);
  }

  function moveDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const session = activeDrag.current;
    if (!session || session.pointerId !== event.pointerId) return;
    event.preventDefault();

    session.ghost.style.left = `${event.clientX - session.offsetX}px`;
    session.ghost.style.top = `${event.clientY - session.offsetY}px`;

    const scroller = scrollRef.current;
    if (scroller) {
      const bounds = scroller.getBoundingClientRect();
      if (event.clientX > bounds.right - 28) scroller.scrollLeft += 16;
      else if (event.clientX < bounds.left + 28) scroller.scrollLeft -= 16;
    }

    const current = orderRef.current;
    const remaining = current.filter((id) => id !== session.id);
    let destination = remaining.length;
    for (let i = 0; i < remaining.length; i += 1) {
      const target = tilesRef.current.get(remaining[i]);
      if (target && event.clientX < target.getBoundingClientRect().left + target.offsetWidth / 2) {
        destination = i;
        break;
      }
    }
    const next = [...remaining];
    next.splice(destination, 0, session.id);
    if (next.some((id, index) => id !== current[index])) {
      orderRef.current = next;
      setOrder(next);
    }
  }

  function finishDrag(event: React.PointerEvent<HTMLButtonElement>, cancelled = false) {
    const session = activeDrag.current;
    if (!session || session.pointerId !== event.pointerId) return;
    event.stopPropagation();
    session.ghost.remove();
    activeDrag.current = null;
    setDraggedId(null);

    if (cancelled) {
      orderRef.current = session.startOrder;
      setOrder(session.startOrder);
      return;
    }

    const next = orderRef.current;
    if (next.some((id, index) => id !== session.startOrder[index])) {
      void onReorder(next);
    }
  }

  function keyboardReorder(id: string, direction: number) {
    const current = orderRef.current;
    const position = current.indexOf(id);
    const destination = position + direction;
    if (position < 0 || destination < 0 || destination >= current.length) return;
    const next = [...current];
    next.splice(position, 1);
    next.splice(destination, 0, id);
    orderRef.current = next;
    setOrder(next);
    void onReorder(next);
  }

  const byId = new Map(items.map((item) => [item.id, item]));

  return (
    <div
      ref={scrollRef}
      className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-1"
      aria-label="Fijados; arrastra el tirador para cambiar el orden"
    >
      {order.map((id) => {
        const item = byId.get(id);
        if (!item) return null;
        return (
          <div
            key={id}
            ref={(element) => {
              if (element) tilesRef.current.set(id, element);
              else tilesRef.current.delete(id);
            }}
            className="relative shrink-0"
            data-pinned-id={id}
            style={{ opacity: draggedId === id ? 0.28 : 1 }}
          >
            <PinnedItemTile item={item} onOpen={() => onOpen(item)} />
            <button
              type="button"
              aria-label={`Reordenar fijado: ${item.title ?? "Sin título"}. Arrastra o usa las flechas izquierda y derecha.`}
              className="absolute right-1 top-1 z-10 flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-lg bg-black/55 text-zinc-300 backdrop-blur-sm active:cursor-grabbing active:bg-zinc-700"
              onPointerDown={(event) => beginDrag(event, id)}
              onPointerMove={moveDrag}
              onPointerUp={finishDrag}
              onPointerCancel={(event) => finishDrag(event, true)}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                  event.preventDefault();
                  keyboardReorder(id, event.key === "ArrowLeft" ? -1 : 1);
                }
              }}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
