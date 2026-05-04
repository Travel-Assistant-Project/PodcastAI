/**
 * PodcastDetailScreen altındaki Listen şeridinin yüksekliği (stickyPlayer + stickyPlayBtn).
 * MiniPlayerBar bu ekranda tam bu şeridin üst çizgisine oturmalı — StyleSheet ile senkron tut.
 *
 * borderTop 1 + paddingTop 8 + padBottom 16 + playBtn (padV 15×2 + satır ~28) = 83
 */
export const PODCAST_LISTEN_STICKY_HEIGHT = 1 + 8 + 16 + 15 + 15 + 28;
