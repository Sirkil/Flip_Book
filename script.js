/**
 * Global Allergy Connect - Flipbook Viewer
 * Responsive: Single-page mobile view (like FlippingBook) & 2-page desktop spread.
 */

document.addEventListener('DOMContentLoaded', function () {
    const mainStage = document.getElementById('main-stage');
    const bookContainer = document.getElementById('book-container');
    const flipbookEl = document.getElementById('flipbook');
    const counterEl = document.getElementById('page-counter');

    // Navigation buttons
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnFirst = document.getElementById('btn-first');
    const btnLast = document.getElementById('btn-last');

    const totalPages = flipbookEl.querySelectorAll('.page').length;

    const PAGE_ORIGINAL_W = 1749;
    const PAGE_ORIGINAL_H = 2481;
    const PAGE_ASPECT = PAGE_ORIGINAL_W / PAGE_ORIGINAL_H; // ~0.7049576
    const SPREAD_ASPECT = (PAGE_ORIGINAL_W * 2) / PAGE_ORIGINAL_H; // ~1.409915

    // Helper: Determine if we should be in single-page mobile mode
    function isMobileMode() {
        return window.innerWidth <= 768 || (window.innerWidth < window.innerHeight && window.innerWidth <= 900);
    }

    // --- 1. Compute Dimensions for Current Screen Mode ---
    function computeBookDimensions() {
        const isPortrait = isMobileMode();

        if (isPortrait) {
            // Mobile view: single page filling the screen width cleanly
            // Minimal margins for maximum readability like FlippingBook
            const stageW = Math.max(window.innerWidth - 20, 260);
            const stageH = Math.max(mainStage.clientHeight - 20, 300);

            let finalW, finalH;

            if (stageW / stageH > PAGE_ASPECT) {
                // Height constrained
                finalH = stageH;
                finalW = Math.round(finalH * PAGE_ASPECT);
            } else {
                // Width constrained
                finalW = stageW;
                finalH = Math.round(finalW / PAGE_ASPECT);
            }

            return {
                isPortrait: true,
                singlePageWidth: finalW,
                singlePageHeight: finalH,
                containerWidth: finalW,
                containerHeight: finalH
            };
        } else {
            // Desktop view: 2-page landscape spread
            const stageW = Math.max(mainStage.clientWidth - 130, 400); // space for side arrows
            const stageH = Math.max(mainStage.clientHeight - 24, 200);

            let finalW, finalH;

            if (stageW / stageH > SPREAD_ASPECT) {
                // Height constrained
                finalH = stageH;
                finalW = Math.round(finalH * SPREAD_ASPECT);
            } else {
                // Width constrained
                finalW = stageW;
                finalH = Math.round(finalW / SPREAD_ASPECT);
            }

            const singlePageW = Math.round(finalW / 2);
            const singlePageH = Math.round(finalH);

            return {
                isPortrait: false,
                singlePageWidth: singlePageW,
                singlePageHeight: singlePageH,
                containerWidth: singlePageW * 2,
                containerHeight: singlePageH
            };
        }
    }

    const initialDims = computeBookDimensions();
    bookContainer.style.width = initialDims.containerWidth + 'px';
    bookContainer.style.height = initialDims.containerHeight + 'px';

    if (initialDims.isPortrait) {
        bookContainer.classList.add('is-portrait');
        bookContainer.classList.remove('is-landscape');
    } else {
        bookContainer.classList.remove('is-portrait');
        bookContainer.classList.add('is-landscape');
    }

    // --- 2. Initialize St.PageFlip ---
    let initialPage = 0;
    const hashMatch = window.location.hash.match(/page=(\d+)/);
    if (hashMatch) {
        const pNum = parseInt(hashMatch[1], 10);
        if (pNum >= 1 && pNum <= totalPages) {
            initialPage = pNum - 1;
        }
    }

    const pageFlip = new St.PageFlip(flipbookEl, {
        width: initialDims.singlePageWidth,
        height: initialDims.singlePageHeight,
        size: "stretch",
        minWidth: initialDims.isPortrait ? Math.round(initialDims.singlePageWidth * 0.75) : 200,
        maxWidth: 2400,
        minHeight: 200,
        maxHeight: 3200,
        maxShadowOpacity: 0.25,
        showCover: true,
        usePortrait: true,        // Enable portrait mode on mobile
        mobileScrollSupport: true, // Enable swipe on mobile without scroll conflict
        startPage: initialPage,
        flippingTime: 550,
        useMouseEvents: true,
        swipeDistance: 25,
        showPageCorners: true
    });

    pageFlip.loadFromHTML(document.querySelectorAll('.page'));

    // --- 3. UI State & Page Counter Updater ---
    function updateUI(pageIndex) {
        if (pageIndex === undefined || pageIndex === null) {
            pageIndex = pageFlip.getCurrentPageIndex();
        }

        const currentPage = pageIndex + 1;
        const currentOrientation = pageFlip.getOrientation ? pageFlip.getOrientation() : (isMobileMode() ? 'portrait' : 'landscape');
        const isPortrait = currentOrientation === 'portrait' || isMobileMode();

        if (isPortrait) {
            // Mobile: Single page mode - every page shown separate
            bookContainer.classList.remove('is-front-cover');
            bookContainer.classList.remove('is-back-cover');
            if (counterEl) {
                counterEl.innerText = `page ${currentPage} of ${totalPages}`;
            }

            const isFirst = pageIndex === 0;
            const isLast = pageIndex >= totalPages - 1;

            if (btnPrev) {
                btnPrev.style.opacity = isFirst ? '0' : '1';
                btnPrev.style.pointerEvents = isFirst ? 'none' : 'auto';
            }
            if (btnFirst) {
                btnFirst.style.opacity = isFirst ? '0' : '1';
                btnFirst.style.pointerEvents = isFirst ? 'none' : 'auto';
            }
            if (btnNext) {
                btnNext.style.opacity = isLast ? '0' : '1';
                btnNext.style.pointerEvents = isLast ? 'none' : 'auto';
            }
            if (btnLast) {
                btnLast.style.opacity = isLast ? '0' : '1';
                btnLast.style.pointerEvents = isLast ? 'none' : 'auto';
            }
        } else {
            // Desktop: 2-page spread mode
            if (pageIndex === 0) {
                bookContainer.classList.add('is-front-cover');
                bookContainer.classList.remove('is-back-cover');
                if (counterEl) counterEl.innerText = `page 1 of ${totalPages}`;
            } else if (pageIndex >= totalPages - 1 && totalPages % 2 === 0) {
                bookContainer.classList.remove('is-front-cover');
                bookContainer.classList.add('is-back-cover');
                if (counterEl) counterEl.innerText = `page ${totalPages} of ${totalPages}`;
            } else {
                bookContainer.classList.remove('is-front-cover');
                bookContainer.classList.remove('is-back-cover');
                const rightPage = Math.min(pageIndex + 2, totalPages);
                if (counterEl) counterEl.innerText = `pages ${pageIndex + 1} - ${rightPage} of ${totalPages}`;
            }

            const isFirst = pageIndex === 0;
            const isLast = (pageIndex >= totalPages - 1) || (pageIndex + 2 >= totalPages);

            if (btnPrev) {
                btnPrev.style.opacity = isFirst ? '0' : '1';
                btnPrev.style.pointerEvents = isFirst ? 'none' : 'auto';
            }
            if (btnFirst) {
                btnFirst.style.opacity = isFirst ? '0' : '1';
                btnFirst.style.pointerEvents = isFirst ? 'none' : 'auto';
            }
            if (btnNext) {
                btnNext.style.opacity = isLast ? '0' : '1';
                btnNext.style.pointerEvents = isLast ? 'none' : 'auto';
            }
            if (btnLast) {
                btnLast.style.opacity = isLast ? '0' : '1';
                btnLast.style.pointerEvents = isLast ? 'none' : 'auto';
            }
        }

        history.replaceState(null, null, `#page=${currentPage}`);
    }

    pageFlip.on('flip', (e) => {
        updateUI(e.data);
    });

    pageFlip.on('changeOrientation', () => {
        updateUI(pageFlip.getCurrentPageIndex());
    });

    pageFlip.on('init', () => {
        updateUI(pageFlip.getCurrentPageIndex());
    });

    updateUI(pageFlip.getCurrentPageIndex());
    setTimeout(() => {
        updateUI(pageFlip.getCurrentPageIndex());
    }, 200);

    // --- 4. Responsive Window Resize Handler ---
    let resizeTimer = null;
    function handleResize() {
        const dims = computeBookDimensions();
        bookContainer.style.width = dims.containerWidth + 'px';
        bookContainer.style.height = dims.containerHeight + 'px';

        if (dims.isPortrait) {
            bookContainer.classList.add('is-portrait');
            bookContainer.classList.remove('is-landscape');
            pageFlip.getSettings().minWidth = Math.round(dims.singlePageWidth * 0.75);
        } else {
            bookContainer.classList.remove('is-portrait');
            bookContainer.classList.add('is-landscape');
            pageFlip.getSettings().minWidth = 200;
        }

        pageFlip.update();
        updateUI(pageFlip.getCurrentPageIndex());
    }

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 150);
    });

    // Also listen to orientationchange for mobile devices
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 250);
    });

    // --- 5. Navigation Events ---
    if (btnPrev) btnPrev.addEventListener('click', () => pageFlip.flipPrev());
    if (btnNext) btnNext.addEventListener('click', () => pageFlip.flipNext());
    if (btnFirst) btnFirst.addEventListener('click', () => pageFlip.turnToPage(0));
    if (btnLast) btnLast.addEventListener('click', () => pageFlip.turnToPage(totalPages - 1));

    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            pageFlip.flipPrev();
        } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
            e.preventDefault();
            const currentIdx = pageFlip.getCurrentPageIndex();
            const isPortrait = pageFlip.getOrientation ? pageFlip.getOrientation() === 'portrait' : isMobileMode();
            const isLast = isPortrait ? (currentIdx >= totalPages - 1) : ((currentIdx >= totalPages - 1) || (currentIdx + 2 >= totalPages));
            if (!isLast) {
                pageFlip.flipNext();
            }
        } else if (e.key === 'Home') {
            e.preventDefault();
            pageFlip.turnToPage(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            pageFlip.turnToPage(totalPages - 1);
        }
    });
});