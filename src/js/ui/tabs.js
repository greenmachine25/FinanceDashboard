/**
 * Tab Navigation & Mobile Swipe Gestures
 */

export const tabList = ["overview", "dashboard", "goals", "rent", "loan", "interest"];
let currentActiveTab = "overview";

export function getActiveTab() {
  return currentActiveTab;
}

export function switchTab(tabId, onTabSwitched) {
  if (!tabList.includes(tabId)) return;
  currentActiveTab = tabId;

  // Toggle Tab Panels
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.remove("active");
  });
  const targetPanel = document.getElementById(tabId);
  if (targetPanel) {
    targetPanel.classList.add("active");
  }

  // Toggle Desktop Tab Buttons
  document.querySelectorAll(".nav-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  // Toggle Mobile Bottom Nav Buttons
  document.querySelectorAll(".mobile-nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (typeof onTabSwitched === "function") {
    onTabSwitched(tabId);
  }
}

export function initSwipeNavigation(containerEl, onSwipe) {
  if (!containerEl) return;
  let touchStartX = 0;
  let touchEndX = 0;

  containerEl.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );

  containerEl.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (window.innerWidth >= 960) return;

      const swipeDist = touchEndX - touchStartX;
      const currentIndex = tabList.indexOf(currentActiveTab);

      if (swipeDist < -75 && currentIndex < tabList.length - 1) {
        switchTab(tabList[currentIndex + 1], onSwipe);
      } else if (swipeDist > 75 && currentIndex > 0) {
        switchTab(tabList[currentIndex - 1], onSwipe);
      }
    },
    { passive: true }
  );
}
