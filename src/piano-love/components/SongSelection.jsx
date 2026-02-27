import * as React from 'react';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .ss-root {
    --bg:        #f5f4f0;
    --surface:   #ffffff;
    --border:    #e2deda;
    --accent:    #5c4ee5;
    --accent-lt: rgba(92,78,229,0.08);
    --accent2:   #e05252;
    --text:      #1a1825;
    --text2:     #6b6478;
    --muted:     #a09aad;
    --radius:    14px;
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    width: 100%;
    max-width: 100%;
    overflow-x: clip;
    padding: 0;
    margin: 0;
  }

  /* ── Sticky search bar at very top ── */
  .ss-sticky {
    position: sticky;
    top: 0;
    z-index: 50;
    background: var(--bg);
    padding: 0;
    border-bottom: 1px solid var(--border);
  }

  .ss-sticky-inner {
    width: 100%;
    padding: 10px 16px 8px;
  }

  .ss-input-row {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 12px;
    padding: 0 12px;
    transition: border-color .2s, box-shadow .2s;
    box-shadow: 0 1px 4px rgba(0,0,0,.06);
  }
  .ss-input-row:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(92,78,229,.1);
  }
  .ss-input-icon { color: var(--muted); flex-shrink: 0; }
  .ss-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    padding: 12px 0;
  }
  .ss-input::placeholder { color: var(--muted); }

  .ss-search-btn {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 7px 16px;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    flex-shrink: 0;
    transition: opacity .15s, transform .1s;
    display: flex; align-items: center; gap: 5px;
  }
  .ss-search-btn:hover:not(:disabled) { opacity: .88; transform: scale(1.02); }
  .ss-search-btn:disabled { opacity: .4; cursor: not-allowed; }

  /* ── Error ── */
  .ss-error {
    margin-top: 7px;
    font-size: 12px;
    color: var(--accent2);
  }

  /* ── Category chips ── */
  .ss-chips {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 2px;
    margin-top: 10px;
    scrollbar-width: none;
  }
  .ss-chips::-webkit-scrollbar { display: none; }
  .ss-chip {
    background: var(--surface);
    border: 1.5px solid var(--border);
    color: var(--text2);
    border-radius: 99px;
    padding: 5px 13px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: all .18s;
    flex-shrink: 0;
  }
  .ss-chip:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-lt);
  }
  .ss-chip.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
    font-weight: 600;
  }

  /* ── Body ── */
  .ss-body {
    padding: 16px 16px 80px;
    max-width: 520px;
    margin: 0 auto;
  }

  .ss-fullscreen .ss-sticky-inner {
    padding-left: max(12px, env(safe-area-inset-left));
    padding-right: max(12px, env(safe-area-inset-right));
  }

  .ss-fullscreen .ss-body {
    max-width: 100%;
    margin: 0;
    padding-left: max(12px, env(safe-area-inset-left));
    padding-right: max(12px, env(safe-area-inset-right));
    padding-top: 12px;
  }

  /* ── Results header ── */
  .ss-results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    padding: 0 2px;
  }
  .ss-results-label {
    font-family: 'Syne', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .13em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .ss-results-count {
    font-size: 11px;
    color: var(--muted);
  }

  /* ── Song list ── */
  .ss-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .ss-item {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: border-color .18s, box-shadow .18s, transform .12s;
  }
  .ss-item:hover {
    border-color: #cbc5f5;
    box-shadow: 0 2px 10px rgba(92,78,229,.08);
    transform: translateY(-1px);
  }
  .ss-item.selected {
    border-color: var(--accent);
    background: var(--accent-lt);
    box-shadow: 0 2px 12px rgba(92,78,229,.12);
  }

  .ss-item-num {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    width: 20px;
    flex-shrink: 0;
    text-align: center;
  }
  .ss-item.selected .ss-item-num { color: var(--accent); }

  .ss-item-body { flex: 1; min-width: 0; }
  .ss-item-title {
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 0 2px;
  }
  .ss-item-artist {
    font-size: 12px;
    color: var(--text2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
  }

  .ss-item-check {
    flex-shrink: 0;
    color: var(--accent);
    opacity: 0;
    transition: opacity .18s;
  }
  .ss-item.selected .ss-item-check { opacity: 1; }

  /* ── Empty / loading ── */
  .ss-empty {
    text-align: center;
    padding: 48px 0;
    color: var(--muted);
  }
  .ss-empty p { font-size: 14px; margin: 8px 0 0; }

  .ss-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 44px 0;
    gap: 10px;
    color: var(--muted);
    font-size: 13px;
  }
  .ss-spin { animation: ss-rotate .9s linear infinite; color: var(--accent); }
  @keyframes ss-rotate { to { transform: rotate(360deg); } }

  /* ── Selected banner (bottom pill) ── */
  .ss-selected-banner {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--accent);
    color: #fff;
    padding: 11px 20px;
    border-radius: 99px;
    display: flex; align-items: center; gap: 8px;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 8px 28px rgba(92,78,229,.30);
    max-width: calc(100vw - 40px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    z-index: 100;
    animation: ss-pop .22s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes ss-pop {
    from { opacity: 0; transform: translateX(-50%) scale(.88) translateY(8px); }
    to   { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
  }
  .ss-banner-dot {
    width: 6px; height: 6px;
    background: rgba(255,255,255,.6);
    border-radius: 50%; flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .ss-sticky {
      top: 0;
    }
  }
`;

const CATEGORIES = ["Top Picks", "Pop", "Classical", "Movies", "Anime", "Love"];

const chipToCategoryKey = (chip) => {
    const raw = String(chip || '').trim().toLowerCase();
    if (!raw) return '';
    if (raw === 'top picks') return '';
    if (raw === 'movie' || raw === 'movies') return 'movies';
    return raw;
};

const SongSelection = ({
    query,
    setQuery,
    searchResults,
    suggestedSongs,
    isLoadingSuggestions,
    isSearching,
    selectedSong,
    handleSelectSong,
    runSearch
}) => {
    const [activeChip, setActiveChip] = React.useState("Top Picks");
    const [isTopPicksFallback, setIsTopPicksFallback] = React.useState(false);

    const handleChip = (cat) => {
        setActiveChip(cat);
        setIsTopPicksFallback(false);
        if (cat === "Top Picks") {
            setQuery("");
            return;
        } else {
            const categoryKey = chipToCategoryKey(cat);
            setQuery('');
            runSearch(categoryKey);
        }
    };

    // Called when user presses Search button or hits Enter
    const handleSearch = () => {
        if (!query.trim()) return;
        setActiveChip('');         // deselect all chips → displayList uses searchResults
        setIsTopPicksFallback(false);
        runSearch(query);
    };

    // When search returns results that are fallback top picks, detect it
    React.useEffect(() => {
        if (searchResults.length > 0 && searchResults[0]?.isTopPicksFallback) {
            setIsTopPicksFallback(true);
        } else {
            setIsTopPicksFallback(false);
        }
    }, [searchResults]);

    // Display list logic:
    //  "Top Picks" chip → suggestedSongs
    //  category chip / text search → searchResults (fallback to suggestedSongs if empty)
    const displayList = activeChip === 'Top Picks'
        ? suggestedSongs
        : searchResults.length > 0
            ? searchResults
            : (!isSearching ? suggestedSongs : []);
    const showAsTopPicksFallback = activeChip !== 'Top Picks' && searchResults.length === 0 && !isSearching;
    const showLoading = isSearching || isLoadingSuggestions;

    return (
        <>
            <style>{STYLES}</style>
            <div className="ss-root">

                {/* ── Sticky top: search + chips ── */}
                <div className="ss-sticky">
                    <div className="ss-sticky-inner">
                        <div className="ss-input-row">
                            <Search size={15} className="ss-input-icon" />
                            <input
                                id="song-search"
                                className="ss-input"
                                type="text"
                                placeholder="Artist or song title…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                            <button
                                className="ss-search-btn"
                                type="button"
                                onClick={handleSearch}
                                disabled={isSearching}
                            >
                                {isSearching
                                    ? <><Loader2 size={13} className="ss-spin" /> Searching</>
                                    : "Search"
                                }
                            </button>
                        </div>

                        <div className="ss-chips">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`ss-chip${activeChip === cat ? " active" : ""}`}
                                    onClick={() => handleChip(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Scrollable results ── */}
                <div className="ss-body">
                    <div className="ss-results-header">
                        <span className="ss-results-label">
                            {activeChip === 'Top Picks'
                                ? 'Top Picks'
                                : activeChip === ''
                                    ? (isTopPicksFallback ? 'Top Picks' : 'Search Results')
                                    : (showAsTopPicksFallback || isTopPicksFallback ? 'Top Picks' : activeChip)}
                        </span>
                        {!showLoading && displayList.length > 0 && (
                            <span className="ss-results-count">{displayList.length} songs</span>
                        )}
                    </div>
                    {(showAsTopPicksFallback || isTopPicksFallback) && (
                        <p style={{ fontSize: '12px', color: 'var(--text2)', padding: '0 2px 8px', margin: 0 }}>
                            No exact match — showing popular picks instead
                        </p>
                    )}

                    <div className="ss-list">
                        {showLoading ? (
                            <div className="ss-loading">
                                <Loader2 size={26} className="ss-spin" />
                                <span>Finding songs…</span>
                            </div>
                        ) : displayList.length === 0 ? (
                            <div className="ss-empty">
                                <p>No songs found.</p>
                            </div>
                        ) : (
                            displayList.map((item, i) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`ss-item${selectedSong?.id === item.id ? " selected" : ""}`}
                                    onClick={() => handleSelectSong(item)}
                                >
                                    <span className="ss-item-num">{i + 1}</span>
                                    <div className="ss-item-body">
                                        <p className="ss-item-title">{item.title}</p>
                                        <p className="ss-item-artist">{item.artist || "Unknown Artist"}</p>
                                    </div>
                                    <CheckCircle2 size={17} className="ss-item-check" />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Floating selected pill ── */}
                {selectedSong && (
                    <div className="ss-selected-banner">
                        <span className="ss-banner-dot" />
                        {selectedSong.title} · {selectedSong.artist || "Unknown"}
                    </div>
                )}
            </div>
        </>
    );
};

export default SongSelection;
