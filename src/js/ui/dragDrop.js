/**
 * SortableJS Integration for Card Drag & Drop Reordering
 */

import { getState, setState } from "../state.js";

export function initSortableContainer(containerId, listType, onReordered) {
  if (typeof Sortable === "undefined") return;
  const el = document.getElementById(containerId);
  if (!el) return;

  if (el._sortableInstance) {
    el._sortableInstance.destroy();
  }

  el._sortableInstance = Sortable.create(el, {
    handle: ".drag-handle",
    animation: 180,
    ghostClass: "sortable-ghost",
    onEnd: (evt) => {
      if (evt.oldIndex === evt.newIndex) return;

      const state = getState();
      let targetArray = null;

      if (listType === "dashboard") targetArray = state.dashboards;
      else if (listType === "loan") targetArray = state.loans;
      else if (listType === "rent") targetArray = state.rents;
      else if (listType === "goal") targetArray = state.goals;
      else if (listType === "interest") targetArray = state.investments;

      if (targetArray && targetArray[evt.oldIndex]) {
        const [movedItem] = targetArray.splice(evt.oldIndex, 1);
        targetArray.splice(evt.newIndex, 0, movedItem);
        setState({ ...state }, listType);

        if (typeof onReordered === "function") {
          onReordered(listType);
        }
      }
    },
  });
}
