document.addEventListener('DOMContentLoaded', () => {

    // --- Router Logic ---
    const views = {
        'dashboard': document.getElementById('view-dashboard'),
        'saved': document.getElementById('view-saved'),
        'digest': document.getElementById('view-digest'),
        'settings': document.getElementById('view-settings'),
        'proof': document.getElementById('view-proof'),
        '404': document.getElementById('view-404')
    };

    const navItems = document.querySelectorAll('.nav-item');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');

    function router() {
        // Get current hash or default to 'dashboard'
        const hash = window.location.hash.slice(1) || 'dashboard';

        // Determine active route
        let activeRoute = '404';
        if (views[hash]) {
            activeRoute = hash;
        } else if (hash === '') {
            activeRoute = 'dashboard';
        }

        // 1. Update Views
        Object.values(views).forEach(view => {
            if (view) view.classList.add('hidden');
        });

        if (views[activeRoute]) {
            views[activeRoute].classList.remove('hidden');
        }

        // 2. Update Active State (Desktop)
        navItems.forEach(item => {
            if (item.dataset.route === activeRoute) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 3. Update Active State (Mobile)
        mobileNavItems.forEach(item => {
            if (item.dataset.route === activeRoute) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 4. Update Header Title (Optional, if we want dynamic header text outside views)
        // For now, each view has its own header.
    }

    // Listen for hash changes
    window.addEventListener('hashchange', router);

    // Initial call
    router();


    // --- Mobile Menu Logic ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileOverlay = document.querySelector('.mobile-nav-overlay');

    function toggleMenu() {
        const isActive = mobileNav.classList.contains('active');
        if (isActive) {
            mobileNav.classList.remove('active');
            mobileOverlay.classList.remove('active');
        } else {
            mobileNav.classList.add('active');
            mobileOverlay.classList.add('active');
        }
    }

    if (mobileBtn) {
        mobileBtn.addEventListener('click', toggleMenu);
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', toggleMenu);
    }

    // Close menu when a link is clicked
    mobileNavItems.forEach(item => {
        item.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            mobileOverlay.classList.remove('active');
        });
    });


    // --- Existing Proof-of-Concept Logic (Preserved) ---
    const checkboxes = document.querySelectorAll('.proof-checklist input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const label = e.target.parentElement;
            if (e.target.checked) {
                label.style.color = 'var(--success-color)';
                label.style.fontWeight = '600';
            } else {
                label.style.color = 'inherit';
                label.style.fontWeight = 'normal';
            }
        });
    });
});
