-- ---------------------------------------------------------------------------
-- Showreel: drop the old third-party promo clip.
--
-- The band's default film is now `public/video/corporate-gifting-reel.mp4`
-- (see public/video/CREDITS.md). Any HomeBanner row still pointing at the
-- removed `procter-promo-video.mp4` is reset to NULL so it falls back to the
-- new default — an admin can set their own YouTube/Vimeo link at any time.
-- Data-only: no schema change. The poster artwork keeps its path
-- (/images/video-poster.jpg) and has simply been replaced on disk.
-- ---------------------------------------------------------------------------

UPDATE `HomeBanner`
   SET `videoUrl` = NULL
 WHERE `videoUrl` LIKE '%procter-promo-video%';

-- Rows that stored the bundled path as if it were a custom value lose it too,
-- so nobody silently keeps a film that no longer exists on disk.
UPDATE `HomeBanner`
   SET `videoUrl` = NULL
 WHERE `videoUrl` LIKE '/video/%' AND `videoUrl` NOT LIKE '/video/corporate-gifting-reel.mp4';
