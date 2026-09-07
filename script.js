/**
 * SORS 2026 Flipbook Viewer
 * Perfectly fitted, centered single covers & silent soft page flips.
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

    // --- 1. Compute Exact Screen Fit Dimensions ---
    function computeBookDimensions() {
        const stageW = Math.max(mainStage.clientWidth - 130, 300); // space for side navigation arrows
        const stageH = Math.max(mainStage.clientHeight - 24, 200); // space for vertical margins

        const spreadAspect = (1749 * 2) / 2481; // 1.4099 standard 2-page A4 spread

        let finalW, finalH;

        if (stageW / stageH > spreadAspect) {
            // Height constrained
            finalH = stageH;
            finalW = finalH * spreadAspect;
        } else {
            // Width constrained
            finalW = stageW;
            finalH = finalW / spreadAspect;
        }

        const singlePageW = Math.round(finalW / 2);
        const singlePageH = Math.round(finalH);

        return {
            singlePageWidth: singlePageW,
            singlePageHeight: singlePageH,
            spreadWidth: singlePageW * 2,
            spreadHeight: singlePageH
        };
    }

    const initialDims = computeBookDimensions();
    bookContainer.style.width = initialDims.spreadWidth + 'px';
    bookContainer.style.height = initialDims.spreadHeight + 'px';

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
        minWidth: 150,
        maxWidth: 1600,
        minHeight: 200,
        maxHeight: 2000,
        maxShadowOpacity: 0.25,
        showCover: true,      // Page 1 is single cover, Pages 12 & 13 form the final 2-page spread
        usePortrait: false,   // Keeps 2-page landscape spread on desktop
        mobileScrollSupport: false,
        startPage: initialPage,
        flippingTime: 650,
        useMouseEvents: true,
        swipeDistance: 30,
        showPageCorners: true
    });

    pageFlip.loadFromHTML(document.querySelectorAll('.page'));

    // Handle responsive window resize
    window.addEventListener('resize', () => {
        const dims = computeBookDimensions();
        bookContainer.style.width = dims.spreadWidth + 'px';
        bookContainer.style.height = dims.spreadHeight + 'px';
    });

    // --- 3. UI State & Cover Centering Updater ---
    function updateUI(pageIndex) {
        const currentPage = pageIndex + 1;
        
        // 1. Center single Front Cover / Back Cover and hide empty half
        if (pageIndex === 0) {
            bookContainer.classList.add('is-front-cover');
            bookContainer.classList.remove('is-back-cover');
            counterEl.innerText = `page 1 of ${totalPages}`;
        } else if (pageIndex >= totalPages - 1 && totalPages % 2 === 0) {
            // When totalPages is even, the final page is an isolated single back cover
            bookContainer.classList.remove('is-front-cover');
            bookContainer.classList.add('is-back-cover');
            counterEl.innerText = `page ${totalPages} of ${totalPages}`;
        } else {
            bookContainer.classList.remove('is-front-cover');
            bookContainer.classList.remove('is-back-cover');
            const rightPage = Math.min(pageIndex + 2, totalPages);
            counterEl.innerText = `pages ${pageIndex + 1} - ${rightPage} of ${totalPages}`;
        }

        // 2. Prev & First buttons visibility
        const isFirst = pageIndex === 0;
        if (btnPrev) {
            btnPrev.style.opacity = isFirst ? '0' : '1';
            btnPrev.style.pointerEvents = isFirst ? 'none' : 'auto';
        }
        if (btnFirst) {
            btnFirst.style.opacity = isFirst ? '0' : '1';
            btnFirst.style.pointerEvents = isFirst ? 'none' : 'auto';
        }

        // 3. Next & Last buttons visibility
        // For odd totalPages (e.g. 13), the final spread contains (totalPages - 1) and totalPages (pages 12 and 13)
        const isLast = (pageIndex >= totalPages - 1) || (pageIndex + 2 >= totalPages);
        if (btnNext) {
            btnNext.style.opacity = isLast ? '0' : '1';
            btnNext.style.pointerEvents = isLast ? 'none' : 'auto';
        }
        if (btnLast) {
            btnLast.style.opacity = isLast ? '0' : '1';
            btnLast.style.pointerEvents = isLast ? 'none' : 'auto';
        }

        history.replaceState(null, null, `#page=${currentPage}`);
    }

    pageFlip.on('flip', (e) => {
        updateUI(e.data);
    });

    pageFlip.on('init', () => {
        updateUI(pageFlip.getCurrentPageIndex());
    });

    updateUI(pageFlip.getCurrentPageIndex());
    setTimeout(() => {
        updateUI(pageFlip.getCurrentPageIndex());
    }, 150);

    // --- 4. Navigation Events ---
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
            const isLast = (currentIdx >= totalPages - 1) || (currentIdx + 2 >= totalPages);
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