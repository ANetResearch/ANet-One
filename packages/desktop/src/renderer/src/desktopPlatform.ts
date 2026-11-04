import { recordArmsCustomEventForE2E } from "@anet/ui";
import {
  DesktopCommandIds,
  buildLocalMediaPreviewUrl,
  unwrapRemoteWorkspaceBindResult,
  type IPlatformService,
} from "@anet/shared";

import { desktopBrowserPlatformBridge } from "./desktopBrowserPlatformBridge.js";
import { createDesktopPluginSandboxPlatform } from "./plugin-sandbox/desktopPluginSandboxPlatform.js";

export function createDesktopPlatform(options: {
  isLocalDevelopmentRuntime: boolean;
}): IPlatformService {
  return {
    canSelectFilePath: true,
    canOpenLocalFiles: true,
    pluginSandbox: createDesktopPluginSandboxPlatform(),
    createLocalMediaPreviewUrl: buildLocalMediaPreviewUrl,
    isLocalDevelopmentRuntime: options.isLocalDevelopmentRuntime,
    selectDirectory: () => window.anet.selectDirectory(),
    selectDirectories: () => window.anet.selectDirectories(),
    selectFile: () => window.anet.selectFile(),
    selectFiles: () => window.anet.selectFiles?.() ?? Promise.resolve([]),
    createTempTextAttachment: (payload) => window.anet.createTempTextAttachment(payload),
    materializeWorkflowArtifactFile: (payload) =>
      window.anet.materializeWorkflowArtifactFile(payload),
    onRemoteConnectionLog: (handler) => window.anet.onRemoteConnectionLog(handler),
    onRemoteSessionClosed: (handler) => window.anet.onRemoteSessionClosed(handler),
    // Source 自动重连会替换 logical session；统一由 preload bridge 转发换代事件。
    onRemoteSessionReconnected: (handler) =>
      window.anet.onRemoteSessionReconnected?.(handler) ?? (() => {}),
    activateOrSetWorkspace: (path) =>
      window.anet.activateOrSetWorkspace?.(path) ?? Promise.resolve({ activated: false }),
    connectRemote: (remoteOptions, requestId, context) =>
      window.anet.connectRemote(remoteOptions, requestId, context),
    requestSourceSettingsAttachment: (sourceServerId) =>
      window.anet.requestSourceSettingsAttachment?.(sourceServerId) ??
      Promise.reject(new Error("Source settings attachment bridge unavailable")),
    cancelPendingRemoteConnection: (requestId) =>
      window.anet.cancelPendingRemoteConnection?.(requestId) ?? Promise.resolve(),
    bindRemoteWorkspaceSessionContext: async (context) => {
      if (!window.anet.bindRemoteWorkspaceSessionContext) {
        throw new Error("Desktop bindRemoteWorkspaceSessionContext bridge unavailable");
      }
      // preload 返回结构化结果，在页面一侧还原错误才能保留 code/retryable。
      return unwrapRemoteWorkspaceBindResult(
        await window.anet.bindRemoteWorkspaceSessionContext(context),
      );
    },
    startWebRemoteControl: (context) => window.anet.startWebRemoteControl(context),
    stopWebRemoteControl: () => window.anet.stopWebRemoteControl(),
    getWebRemoteControlStatus: () => window.anet.getWebRemoteControlStatus(),
    onWebRemoteControlStatusChanged: (handler) =>
      window.anet.onWebRemoteControlStatusChanged?.(handler) ?? (() => {}),
    disposeRemoteSession: (sessionId) => window.anet.disposeRemoteSession(sessionId),
    isDockerAvailable: () => window.anet.isDockerAvailable(),
    listWSLDistros: () => window.anet.listWSLDistros(),
    listDockerContainers: () => window.anet.listDockerContainers(),
    listSSHConfigAliases: () => window.anet.listSSHConfigAliases(),
    loadMcpFromUserDirectory: (payload) => window.anet.loadMcpFromUserDirectory(payload),
    saveMcpToUserDirectory: (payload) => window.anet.saveMcpToUserDirectory(payload),
    migrateLegacyCommonMcp: (payload) => window.anet.migrateLegacyCommonMcp(payload),
    openExternal: (url) => window.anet.openExternal(url),
    openFeedback: () => window.anet.executeDesktopCommand(DesktopCommandIds.OpenFeedback),
    openCommunity: () => window.anet.executeDesktopCommand(DesktopCommandIds.OpenCommunity),
    canOpenCommunity: (locale) => window.anet.canOpenCommunity(locale),
    openInFileManager: (path) => window.anet.openInFileManager(path),
    openExternalFile: (path) => window.anet.openExternalFile(path),
    openCuaPermissionOnboarding: window.anet.openCuaPermissionOnboarding
      ? (permissionOptions) =>
          window.anet.openCuaPermissionOnboarding?.(permissionOptions) ??
          Promise.resolve({ success: false, error: "not_supported" })
      : undefined,
    prepareCuaHelperPermissionDrag: window.anet.prepareCuaHelperPermissionDrag
      ? () =>
          window.anet.prepareCuaHelperPermissionDrag?.() ??
          Promise.resolve({ success: false, error: "not_supported" })
      : undefined,
    startCuaHelperPermissionDrag: window.anet.startCuaHelperPermissionDrag
      ? () => window.anet.startCuaHelperPermissionDrag?.()
      : undefined,
    notifyWebRemoteControlAuthStateChanged: (change) =>
      window.anet.notifyWebRemoteControlAuthStateChanged(change),
    registerOAuthState: (payload) => window.anet.registerOAuthState(payload),
    onOAuthCallback: (callback) => window.anet.onOAuthCallback(callback),
    onPaymentCallback: (callback) => window.anet.onPaymentCallback(callback),
    onShareImport: (callback) => window.anet.onShareImport?.(callback) ?? (() => {}),
    notifyRendererReady: () => window.anet.notifyRendererReady(),
    syncTelemetryContext: (context) => window.anet.syncTelemetryContext(context),
    reportTelemetryEvent: (payload) => window.anet.reportTelemetryEvent(payload),
    reportArmsCustomEvent: (payload) => {
      recordArmsCustomEventForE2E(payload);
      return window.anet.reportArmsCustomEvent(payload);
    },
    getRendererActionTraceConfig: window.anet.getRendererActionTraceConfig
      ? () => window.anet.getRendererActionTraceConfig!()
      : undefined,
    onRendererActionTraceConfigChanged: window.anet.onRendererActionTraceConfigChanged
      ? (callback) => window.anet.onRendererActionTraceConfigChanged!(callback)
      : undefined,
    reportLocalTtftBatch: (batch) => window.anet.reportLocalTtftBatch(batch),
    reportRendererActionTraceBatch: window.anet.reportRendererActionTraceBatch
      ? (batch) => window.anet.reportRendererActionTraceBatch!(batch)
      : undefined,
    reportRendererHeapSample: window.anet.reportRendererHeapSample
      ? (sample) => window.anet.reportRendererHeapSample!(sample)
      : undefined,
    showTaskNotification: (payload) => window.anet.showTaskNotification(payload),
    syncWindowTabs: (paths) => window.anet.syncWindowTabs(paths),
    syncWebRemoteControlWorkspaces: (workspaces) =>
      window.anet.syncWebRemoteControlWorkspaces?.(workspaces),
    onWebRemoteControlReconnectWorkspace: (handler) =>
      window.anet.onWebRemoteControlReconnectWorkspace?.(handler) ?? (() => {}),
    onWebRemoteControlRendererAction: (handler) =>
      window.anet.onWebRemoteControlRendererAction?.(handler) ?? (() => {}),
    syncWindowUnreadCount: (count) => window.anet.syncWindowUnreadCount(count),
    syncActiveTaskSession: (sessionId) => window.anet.syncActiveTaskSession(sessionId),
    syncAppSettings: (patch) => window.anet.syncAppSettings?.(patch),
    // 桥缺失（旧 preload 升级窗口）时按 supported 兜底，与 Windows 现状一致，设置开关可用。
    getCloseToTrayCapability: () =>
      window.anet.getCloseToTrayCapability?.() ??
      Promise.resolve({ supported: true, gnomeLikeWithoutTray: false }),
    setShortcutRecordingActive: (active) => window.anet.setShortcutRecordingActive?.(active),
    onFocusTab: (handler) => window.anet.onFocusTab(handler),
    onNewTab: (handler) => window.anet.onNewTab(handler),
    onCloseActiveContextRequest: (handler) =>
      window.anet.onCloseActiveContextRequest?.(handler) ?? (() => {}),
    onOpenBrowserUrl: (handler) => window.anet.onOpenBrowserUrl?.(handler) ?? (() => {}),
    onEmbeddedBrowserPermissionPrompt: (handler) =>
      window.anet.onEmbeddedBrowserPermissionPrompt?.(handler) ?? (() => {}),
    resolveEmbeddedBrowserPermissionPrompt: (request) =>
      window.anet.resolveEmbeddedBrowserPermissionPrompt?.(request),
    getEmbeddedBrowserSitePermissions: () =>
      window.anet.getEmbeddedBrowserSitePermissions?.() ?? Promise.resolve({}),
    setEmbeddedBrowserSitePermission: (request) =>
      window.anet.setEmbeddedBrowserSitePermission?.(request) ?? Promise.resolve({}),
    clearEmbeddedBrowserSitePermissions: () =>
      window.anet.clearEmbeddedBrowserSitePermissions?.() ?? Promise.resolve({}),
    resetEmbeddedBrowserSitePermission: (request) =>
      window.anet.resetEmbeddedBrowserSitePermission?.(request) ?? Promise.resolve({}),
    onBrowserViewScreenshotSurfacePrepare: (handler) =>
      window.anet.onBrowserViewScreenshotSurfacePrepare?.(handler) ?? (() => {}),
    onBrowserViewScreenshotSurfaceRelease: (handler) =>
      window.anet.onBrowserViewScreenshotSurfaceRelease?.(handler) ?? (() => {}),
    browserViewScreenshotSurfaceReady: (payload) =>
      window.anet.browserViewScreenshotSurfaceReady?.(payload),
    ...desktopBrowserPlatformBridge,
    onNewTask: (handler) => window.anet.onNewTask(handler),
    onOpenWorkspace: (handler) => {
      // 开发态或升级后的旧窗口可能仍运行未暴露 onOpenWorkspace 的 preload，
      // renderer 直接调用会在启动时崩溃。这里和 activateOrSetWorkspace 一样做兼容兜底，
      // 缺少该 bridge 时只禁用原生菜单回调，不影响应用继续打开。
      return window.anet.onOpenWorkspace?.(handler) ?? (() => {});
    },
    onOpenWorkspacePath: (handler) => window.anet.onOpenWorkspacePath?.(handler) ?? (() => {}),
    onOpenFeedbackDialog: (handler) => window.anet.onOpenFeedbackDialog?.(handler) ?? (() => {}),
    onOpenTicketsPanel: (handler) => window.anet.onOpenTicketsPanel?.(handler) ?? (() => {}),
    onWindowFullscreenChanged: (handler) => window.anet.onWindowFullscreenChanged(handler),
    getDesktopWindowChromeState: window.anet.getDesktopWindowChromeState
      ? () => window.anet.getDesktopWindowChromeState!()
      : undefined,
    onDesktopWindowChromeStateChanged: window.anet.onDesktopWindowChromeStateChanged
      ? (handler) => window.anet.onDesktopWindowChromeStateChanged!(handler)
      : undefined,
    getWindowControlsOverlayMetrics: () => window.anet.getWindowControlsOverlayMetrics?.() ?? null,
    onWindowControlsOverlayChanged: (handler) =>
      window.anet.onWindowControlsOverlayChanged?.(handler) ?? (() => {}),
    getDesktopZoomLevel: () =>
      window.anet.getDesktopZoomLevel?.() ?? Promise.resolve({ zoomLevel: 0 }),
    onDesktopZoomLevelChanged: (handler) =>
      window.anet.onDesktopZoomLevelChanged?.(handler) ?? (() => {}),
    onTaskNotificationClick: (handler) => window.anet.onTaskNotificationClick(handler),
    exportLogs: () => window.anet.exportLogs(),
    captureWindowScreenshot: () => window.anet.captureWindowScreenshot?.() ?? Promise.resolve(null),
    onUpdateReady: (callback) => window.anet.onUpdateReady(callback),
    onUpdateCheckResult: (callback) => window.anet.onUpdateCheckResult(callback),
    onUpdateStateChanged: (callback) => window.anet.onUpdateStateChanged?.(callback) ?? (() => {}),
    getUpdateState: () =>
      window.anet.getUpdateState?.() ?? Promise.resolve({ kind: "idle", enabled: true }),
    downloadUpdate: () => window.anet.downloadUpdate?.() ?? Promise.resolve(),
    cancelUpdateDownload: () => window.anet.cancelUpdateDownload?.() ?? Promise.resolve(),
    openUpdateStatusWindow: () => window.anet.openUpdateStatusWindow?.() ?? Promise.resolve(),
    getAutoUpdatePreferences: () =>
      window.anet.getAutoUpdatePreferences?.() ??
      Promise.resolve({ autoDownloadAndInstallUpdates: false }),
    setAutoDownloadAndInstallUpdates: (enabled) =>
      window.anet.setAutoDownloadAndInstallUpdates?.(enabled) ?? Promise.resolve(),
    getDesktopSessionActivity: () =>
      window.anet.getDesktopSessionActivity?.() ?? Promise.resolve({ runningAgentSessionCount: 0 }),
    getANetStdioTapDevState: () =>
      window.anet.getANetStdioTapDevState?.() ??
      Promise.resolve({ enabled: false, visible: false, logDir: "", statePath: "" }),
    onSettingsChanged: (callback) => window.anet.onSettingsChanged?.(callback) ?? (() => {}),
    onApplicationLocaleChanged: (callback) =>
      window.anet.onApplicationLocaleChanged?.(callback) ?? (() => {}),
    onPostUpdateReleaseNotes: (callback) => window.anet.onPostUpdateReleaseNotes(callback),
    acknowledgePostUpdateReleaseNotes: (version) =>
      window.anet.acknowledgePostUpdateReleaseNotes(version),
    skipUpdateVersion: (version) => window.anet.skipUpdateVersion?.(version) ?? Promise.resolve(),
    quitAndInstallUpdate: () => window.anet.quitAndInstallUpdate(),
    getInstalledEditors: (filePath) => window.anet.getInstalledEditors(filePath),
    getFileApplications: (target) => window.anet.getFileApplications(target),
    openFileWithApplication: (applicationId, target) =>
      window.anet.openFileWithApplication(applicationId, target),
    getApplicationIcon: (bundleId) =>
      window.anet.getApplicationIcon?.(bundleId) ?? Promise.resolve(null),
    openInEditor: (editorId, path, editorOptions) =>
      window.anet.openInEditor(editorId, path, editorOptions),
    executeDesktopCommand: (command) => window.anet.executeDesktopCommand(command),
    setApplicationLocale: (locale) => window.anet.setApplicationLocale(locale),
    getSystemLocale: () =>
      window.anet.getSystemLocale?.() ??
      Promise.resolve(navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US"),
    setTitleBarTheme: (theme) => window.anet.setTitleBarTheme(theme),
    getDeviceId: () =>
      (window as Window & { __ANET_DEVICE_ID__?: string }).__ANET_DEVICE_ID__ ?? "",
  };
}
