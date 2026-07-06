// The label for an action button that moves through three states: idle →
// pending (while the action runs) → done (after it completes). Flat by design
// so we never need a nested ternary at the call site.
export function actionButtonLabel(
  done: boolean,
  pending: boolean,
  labels: { done: string; pending: string; idle: string },
): string {
  if (done) return labels.done;
  if (pending) return labels.pending;
  return labels.idle;
}
