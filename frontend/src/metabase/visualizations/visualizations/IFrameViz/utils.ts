import { isSafeUrl } from "metabase/lib/formatting/link";

export const prepareIFrameOrUrl = (
  iframeOrUrl: string | undefined,
  width: number,
  height: number,
) => {
  if (!iframeOrUrl) {
    return "";
  }
  iframeOrUrl = iframeOrUrl.trim();

  if (!iframeOrUrl.startsWith("<iframe") && isSafeUrl(iframeOrUrl)) {
    iframeOrUrl = `<iframe src="${iframeOrUrl}" />`;
  }

  if (iframeOrUrl.includes("<iframe")) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(iframeOrUrl, "text/html");
    const iframeEl = doc.querySelector("iframe");

    if (iframeEl) {
      if (!iframeEl.width) {
        iframeEl.width = `${width}`;
      }
      if (!iframeEl.height) {
        iframeEl.height = `${height}`;
      }
      iframeEl.frameBorder = "0";
      return iframeEl.outerHTML;
    }
  }

  return "";
};
