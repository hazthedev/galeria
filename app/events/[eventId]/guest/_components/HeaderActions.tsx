import { Trophy, Download, Share2 } from 'lucide-react';

export interface HeaderActionsProps {
  luckyDrawEnabled: boolean;
  canDownload: boolean;
  selectedCount: number;
  guestName: string;
  isAnonymous: boolean;
  themeSecondary: string;
  secondaryText: string;
  surfaceText: string;
  surfaceBorder: string;
  onDownloadSelectedIndividually: () => void;
  onDownloadSelected: () => void;
  onDownloadAll: () => void;
  onEditName: () => void;
  onShare: () => void;
}

export function HeaderActions({
  luckyDrawEnabled,
  canDownload,
  selectedCount,
  guestName,
  isAnonymous,
  themeSecondary,
  secondaryText,
  surfaceText,
  surfaceBorder,
  onDownloadSelectedIndividually,
  onDownloadSelected,
  onDownloadAll,
  onEditName,
  onShare,
}: HeaderActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:justify-end">
      {luckyDrawEnabled && (
        <a
          href="#lucky-draw"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium"
          style={{
            backgroundColor: themeSecondary,
            color: secondaryText,
            borderColor: surfaceBorder,
          }}
        >
          <Trophy className="h-4 w-4" />
          Lucky Draw
        </a>
      )}
      {canDownload && (
        <>
          {selectedCount > 0 && (
            <>
              <button
                onClick={onDownloadSelectedIndividually}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium"
                style={{
                  backgroundColor: themeSecondary,
                  color: secondaryText,
                  borderColor: surfaceBorder,
                }}
              >
                <Download className="h-4 w-4" />
                Download selected ({selectedCount})
              </button>
              <button
                onClick={onDownloadSelected}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium"
                style={{ color: surfaceText, borderColor: surfaceBorder }}
              >
                <Download className="h-4 w-4" />
                Download ZIP ({selectedCount})
              </button>
            </>
          )}
          <button
            onClick={onDownloadAll}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium"
            style={{ color: surfaceText, borderColor: surfaceBorder }}
          >
            <Download className="h-4 w-4" />
            Download all
          </button>
        </>
      )}
      <button
        onClick={onEditName}
        className="inline-flex items-center rounded-lg border px-3 py-2 text-xs font-medium"
        style={{ color: surfaceText, borderColor: themeSecondary }}
      >
        {isAnonymous || !guestName ? 'Add name' : 'Edit name'}
      </button>
      <button
        onClick={onShare}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white sm:w-auto"
        style={{ backgroundColor: themeSecondary, color: secondaryText }}
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
    </div>
  );
}
