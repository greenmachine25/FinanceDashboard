/**
 * Toast Notification System
 */

import { refreshIcons } from "../utils.js";

let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toastContainer";
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

export function showToast(message, isError = false, customIcon = null) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  const isSuccess = !isError && customIcon !== "info";
  
  toast.className = `toast ${isError ? "toast-error" : isSuccess ? "toast-success" : ""}`;
  const iconName = customIcon || (isError ? "alert-circle" : "check-circle-2");

  toast.innerHTML = `
    <i data-lucide="${iconName}" style="width: 1.25rem; height: 1.25rem; flex-shrink: 0;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  refreshIcons();

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
