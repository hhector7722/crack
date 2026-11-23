"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PinnedItemTile } from "@/components/item-list-row";
import type { Item } from "@/lib/types";

type PendingDrag = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  scrolling: boolean;
  timer: ReturnType<typeof setTimeout> | null;
};

type ActiveDrag = {
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
  const pendingDrag = useRef<PendingDrag | null>(null);
  const activeDrag = useRef<ActiveDrag | null>(null);
  const suppressClick = useRef(false);
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
      const differenceX = previous ? previous.left - rect.left : 0;
      const differenceY = previous ? previous.top - rect.top : 0;
      if ((Math.abs(differenceX) > 1 || Math.abs(differenceY) > 1) && id !== draggedId) {
        element.animate(
          [
            { transform: "translate(" + differenceX + "px, " + differenceY + "px)" },
            { transform: "translate(0, 0)" },
          ],
          { duration: 190, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
      }
      nextRects.set(id, rect);
    }
    lastRects.current = nextRects;
  }, [order, draggedId]);

  useEffect(() => {
    return () => {
      if (pendingDrag.current?.timer) clearTimeout(pendingDrag.current.timer);
      activeDrag.current?.ghost.remove();
    };
  }, []);

  function clearPending() {
    if (pendingDrag.current?.timer) clearTimeout(pendingDrag.current.timer);
    pendingDrag.current = null;
  }

  function beginDrag(id: string, pointerId: number, clientX: number, clientY: number, surface: HTMLDivElement) {
    if (activeDrag.current) return;
    const source = tilesRef.current.get(id);
    if (!source) return;
    const rect = source.getBoundingClientRect();
    const ghost = source.cloneNode(true) as HTMLElement;
    ghost.setAttribute("aria-hidden", "true");
    ghost.inert = true;
    Object.assign(ghost.style, {
      position: "fixed",
      left: rect.left + "px",
      top: rect.top + "px",
      width: rect.width + "px",
      height: rect.height + "px",
      zIndex: "2000",
      pointerEvents: "none",
      opacity: "0.97",
      transform: "scale(1.045)",
      boxShadow: "0 18px 36px rgba(0, 7, 23, .56)",
      borderRadius: "15px",
    });
    document.body.appendChild(ghost);
    activeDrag.current = {
      id,
      pointerId,
      startOrder: [...orderRef.current],
      ghost,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
    };
    clearPending();
    surface.setPointerCapture(pointerId);
    setDraggedId(id);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>, id: string) {
    if (activeDrag.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    clearPending();
    const pending: PendingDrag = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      scrolling: false,
      timer: null,
    };
    pendingDrag.current = pending;
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      const surface = event.currentTarget;
      pending.timer = setTimeout(() => {
        if (pendingDrag.current === pending) {
          beginDrag(id, pending.pointerId, pending.startX, pending.startY, surface);
        }
      }, 280);
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const session = activeDrag.current;
    if (session && session.pointerId === event.pointerId) {
      event.preventDefault();
      session.ghost.style.left = event.clientX - session.offsetX + "px";
      session.ghost.style.top = event.clientY - session.offsetY + "px";

      const scroller = scrollRef.current;
      if (scroller) {
        const bounds = scroller.getBoundingClientRect();
        if (event.clientX > bounds.right - 28) scroller.scrollLeft += 14;
        else if (event.clientX < bounds.left + 28) scroller.scrollLeft -= 14;
      }

      const current = orderRef.current;
      const remaining = current.filter((id) => id !== session.id);
      let nearestIndex = -1;
      let nearestRect: DOMRect | null = null;
      let shortestDistance = Infinity;
      remaining.forEach((id, index) => {
        const rect = tilesRef.current.get(id)?.getBoundingClientRect();
        if (!rect) return;
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const distance = dx * dx + dy * dy;
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestIndex = index;
          nearestRect = rect;
        }
      });
      let destination = remaining.length;
      if (nearestIndex >= 0 && nearestRect) {
        const rect: DOMRect = nearestRect;
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const after = Math.abs(dx) > Math.abs(dy) ? dx > 0 : dy > 0;
        destination = nearestIndex + (after ? 1 : 0);
      }
      const next = [...remaining];
      next.splice(destination, 0, session.id);
      if (next.some((id, index) => id !== current[index])) {
        orderRef.current = next;
        setOrder(next);
      }
      return;
    }

    const pending = pendingDrag.current;
    if (!pending || pending.pointerId !== event.pointerId) return;
    if (pending.scrolling) {
      event.preventDefault();
      if (scrollRef.current) scrollRef.current.scrollLeft -= event.clientX - pending.lastX;
      pending.lastX = event.clientX;
      return;
    }
    const distance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
    if (distance < 7) return;
    if (event.pointerType === "mouse") {
      event.preventDefault();
      beginDrag(pending.id, pending.pointerId, pending.startX, pending.startY, event.currentTarget);
      handlePointerMove(event);
    } else {
      // Deslizar desplaza la cuadrícula; mantener pulsado y mover reordena.
      if (pending.timer) clearTimeout(pending.timer);
      pending.timer = null;
      pending.scrolling = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
      if (scrollRef.current) scrollRef.current.scrollLeft -= event.clientX - pending.lastX;
      pending.lastX = event.clientX;
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>, cancelled = false) {
    const session = activeDrag.current;
    if (!session || session.pointerId !== event.pointerId) {
      if (pendingDrag.current?.pointerId === event.pointerId) {
        if (pendingDrag.current.scrolling) {
          suppressClick.current = true;
          setTimeout(() => { suppressClick.current = false; }, 0);
        }
        clearPending();
      }
      return;
    }
    event.preventDefault();
    session.ghost.remove();
    activeDrag.current = null;
    setDraggedId(null);
    suppressClick.current = true;
    setTimeout(() => { suppressClick.current = false; }, 0);

    if (cancelled) {
      orderRef.current = session.startOrder;
      setOrder(session.startOrder);
      return;
    }
    const next = orderRef.current;
    if (next.some((id, index) => id !== session.startOrder[index])) {
      void onReorder(next).catch(() => {
        orderRef.current = session.startOrder;
        setOrder(session.startOrder);
      });
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
    void onReorder(next).catch(() => {
      orderRef.current = current;
      setOrder(current);
    });
  }

  const byId = new Map(items.map((item) => [item.id, item]));

  return (
    <div
      ref={scrollRef}
      className="no-scrollbar -mx-3 overflow-x-auto px-3 pb-3 pt-1"
      aria-label="Fijados. Mantén pulsado y arrastra para cambiar el orden."
    >
      <div
        className="grid w-max grid-flow-col grid-rows-2 gap-2.5"
        style={{ gridAutoColumns: "clamp(9.5rem, 43vw, 12.5rem)" }}
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
              className="relative min-w-0 select-none"
              data-pinned-id={id}
              style={{
                opacity: draggedId === id ? 0.25 : 1,
                touchAction: "none",
              }}
              onPointerDown={(event) => handlePointerDown(event, id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={(event) => handlePointerUp(event, true)}
              onClickCapture={(event) => {
                if (suppressClick.current) {
                  event.preventDefault();
                  event.stopPropagation();
                  suppressClick.current = false;
                }
              }}
              onKeyDown={(event) => {
                const directions: Record<string, number> = {
                  ArrowLeft: -2,
                  ArrowRight: 2,
                  ArrowUp: -1,
                  ArrowDown: 1,
                };
                const direction = directions[event.key];
                if (direction !== undefined) {
                  event.preventDefault();
                  keyboardReorder(id, direction);
                }
              }}
            >
              <PinnedItemTile item={item} onOpen={() => onOpen(item)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
