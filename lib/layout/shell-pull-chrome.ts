/** Raíz del translate del pull. Nunca `html`: un transform ahí rompe `position:fixed` de la TabBar en `body`. */
export function clearDocumentElementPullTransform(): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.transition = "";
  document.documentElement.style.transform = "";
}
