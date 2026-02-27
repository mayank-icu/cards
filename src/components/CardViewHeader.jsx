import { useMemo, useState } from 'react';
import { Copy, ExternalLink, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';

import './CardViewHeader.css';

const CardViewHeader = ({
  cardType,
  cardId,
  title,
  subtitle,
  previewUrl,
  showPreviewByDefault = false,
  showBranding = true,
}) => {
  const { isEmbedded, toolsEnabled } = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      const params = new URLSearchParams(window.location.search);
      return {
        isEmbedded: params.get('embed') === '1',
        toolsEnabled: params.get('tools') === '1',
      };
    } catch {
      return { isEmbedded: false, toolsEnabled: false };
    }
  }, []);

  const shouldHideHeader = isEmbedded || !toolsEnabled;

  const [showPreview, setShowPreview] = useState(showPreviewByDefault);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const shareUrl = useMemo(() => {
    if (previewUrl) return previewUrl;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    return `${origin}${path}`;
  }, [previewUrl]);

  const createRoute = useMemo(() => {
    const map = {
      valentine: '/valentine/create',
      birthday: '/birthday/create',
      'wish-jar': '/wish-jar/create',
      crush: '/crush/create',
      apology: '/apology/create',
      'long-distance': '/long-distance/create',
      invite: '/invite/create',
      capsule: '/capsule/create',
      anniversary: '/anniversary/create',
      'thank-you': '/thank-you/create',
      congratulations: '/congratulations/create',
      'get-well': '/get-well/create',
      graduation: '/graduation/create',
      wedding: '/wedding/create',
      'new-baby': '/new-baby/create',
      sympathy: '/sympathy/create',
      'missing-you': '/missing-you/create',
      christmas: '/christmas/create',
      'new-year': '/new-year/create',
      easter: '/easter/create',
      halloween: '/halloween/create',
      'good-luck': '/good-luck/create',
      retirement: '/retirement/create',
      'thinking-of-you': '/thinking-of-you/create',
      'cat-lovers': '/cat-lovers/create',
      'balloon-celebration': '/balloon-celebration/create',
      housewarming: '/housewarming/create',
      'self-care': '/self-care/create',
      friendship: '/friendship/create',
      'bon-voyage': '/bon-voyage/create',
      'just-because': '/just-because/create',
    };

    return cardType ? map[cardType] : undefined;
  }, [cardType]);

  const previewTargetUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';

    const origin = window.location.origin;
    const base = createRoute ? `${origin}${createRoute}` : shareUrl;

    try {
      const u = new URL(base);
      u.searchParams.set('embed', '1');
      return u.toString();
    } catch {
      const joiner = base.includes('?') ? '&' : '?';
      return `${base}${joiner}embed=1`;
    }
  }, [createRoute, shareUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleTogglePreview = () => {
    setShowPreview((v) => {
      const next = !v;
      if (next) {
        setIframeLoaded(false);
        setIframeError(false);
      }
      return next;
    });
  };

  return (
    <>
      {!shouldHideHeader && (
        <div className="card-view-header-root">
          <div className="card-view-header-bar">
            <div className="card-view-header-left">
              <div className="card-view-header-title">{title || 'Card'}</div>
              <div className="card-view-header-subtitle">
                {subtitle || (cardType ? `${cardType}${cardId ? ` � ${cardId}` : ''}` : (cardId || ''))}
              </div>
            </div>

            <div className="card-view-header-actions">
              <button
                className="card-view-header-btn"
                type="button"
                onClick={handleTogglePreview}
                aria-pressed={showPreview}
              >
                {showPreview ? <X size={16} /> : <Eye size={16} />}
                {showPreview ? 'Hide preview' : 'Preview'}
              </button>

              <button className="card-view-header-btn" type="button" onClick={handleCopy}>
                <Copy size={16} />
                Copy link
              </button>

              <a
                className="card-view-header-btn"
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={16} />
                Open
              </a>
            </div>
          </div>

          {showPreview && (
            <div className="card-view-header-preview">
              <div className="card-view-header-preview-top">
                <div className="card-view-header-preview-url" title={previewTargetUrl}>{previewTargetUrl}</div>
              </div>

              <div className="card-view-header-preview-shell">
                {!iframeLoaded && !iframeError && (
                  <div className="card-view-header-preview-loading">Loading preview...</div>
                )}
                {iframeError && (
                  <div className="card-view-header-preview-error">Preview failed to load.</div>
                )}

                <iframe
                  className={`card-view-header-iframe ${iframeLoaded ? 'is-loaded' : ''}`}
                  src={previewTargetUrl}
                  title="Card preview"
                  loading="lazy"
                  onLoad={() => setIframeLoaded(true)}
                  onError={() => setIframeError(true)}
                />
              </div>
            </div>
          )}
        </div>
      )}


    </>
  );
};

export default CardViewHeader;
