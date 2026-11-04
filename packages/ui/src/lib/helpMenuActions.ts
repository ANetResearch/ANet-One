import type { IPlatformService } from "@anet/shared";
import type { IntlInstance } from "@/i18n/IntlProvider.js";
import type { FeedbackSubmitDraft } from "@/feedback/feedbackStore.js";
import { runExportLogsAction } from "@/lib/exportLogsAction.js";
import { ANET_PRODUCT_DOCS_URL_LEGACY } from "@/lib/productDocs.js";

export interface HelpMenuActionHandlers {
  openIssueReport: () => Promise<void>;
  openProductDocs: () => void;
  exportLogs: () => void;
}

export function createHelpMenuActionHandlers({
  platform,
  intl,
  openSubmit,
}: {
  platform: Pick<IPlatformService, "captureWindowScreenshot" | "exportLogs" | "openExternal">;
  intl: IntlInstance;
  openSubmit: (draft?: FeedbackSubmitDraft) => void;
}): HelpMenuActionHandlers {
  return {
    openIssueReport: async () => {
      openSubmit({
        type: "bug",
        module: "其它",
        severity: "P2-中",
        includeLogs: true,
        screenshots: [],
      });
    },
    openProductDocs: () => {
      platform.openExternal(ANET_PRODUCT_DOCS_URL_LEGACY);
    },
    exportLogs: () => {
      void runExportLogsAction(platform, intl);
    },
  };
}
