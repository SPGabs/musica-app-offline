import { Capacitor } from "@capacitor/core";

export type HapticKind = "light" | "medium" | "heavy" | "success" | "warning";

export async function haptic(kind: HapticKind = "light"): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
      if (kind === "success") {
        await Haptics.notification({ type: NotificationType.Success });
        return;
      }
      if (kind === "warning") {
        await Haptics.notification({ type: NotificationType.Warning });
        return;
      }
      const style =
        kind === "heavy" ? ImpactStyle.Heavy : kind === "medium" ? ImpactStyle.Medium : ImpactStyle.Light;
      await Haptics.impact({ style });
      return;
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(kind === "medium" || kind === "heavy" ? 14 : 8);
    }
  } catch {
    /* haptics are optional */
  }
}
