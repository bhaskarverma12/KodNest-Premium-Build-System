document.addEventListener('DOMContentLoaded', () => {

    // --- Router Logic ---
    const views = {
        'home': document.getElementById('view-home'),
        'dashboard': document.getElementById('view-dashboard'),
        'saved': document.getElementById('view-saved'),
        'digest': document.getElementById('view-digest'),
        'settings': document.getElementById('view-settings'),
        'proof': document.getElementById('view-proof'),
        '404': document.getElementById('view-404')
    };

    const navItems = document.querySelectorAll('.nav-item');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const appContainer = document.querySelector('.app-container');

    function router() {
        // Get current hash or default to 'home'
        const hash = window.location.hash.slice(1) || 'home';

        // Determine active route
        let activeRoute = '404';
        if (views[hash]) {
            activeRoute = hash;
        } else if (hash === '') {
            activeRoute = 'home';
        }

        // 1. Update Views
        Object.values(views).forEach(view => {
            if (view) view.classList.add('hidden');
        });

        if (views[activeRoute]) {
            views[activeRoute].classList.remove('hidden');
        }

        // 2. Toggle Navigation Visibility
        const topBarNav = document.querySelector('.top-bar .nav-links');
        const brandName = document.querySelector('.brand-name');

        if (activeRoute === 'home') {
            if (topBarNav) topBarNav.style.display = 'none';
            if (brandName) brandName.style.cursor = 'default';
        } else {
            if (topBarNav) topBarNav.style.display = 'flex';
            if (brandName) {
                brandName.style.cursor = 'pointer';
                brandName.onclick = () => window.location.hash = '#home';
            }
        }

        // 3. Update Active State (Desktop)
        navItems.forEach(item => {
            if (item.dataset.route === activeRoute) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 4. Update Active State (Mobile)
        mobileNavItems.forEach(item => {
            if (item.dataset.route === activeRoute) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Refresh Saved jobs when entering Saved view
        if (activeRoute === 'saved') {
            renderSavedJobs();
        }
    }

    // --- Job Data & Rendering Logic ---
    let savedJobs = JSON.parse(localStorage.getItem('jobTracker_saved')) || [];

    // DOM Elements
    const jobListEl = document.getElementById('job-list');
    const savedJobListEl = document.getElementById('saved-job-list');

    // Filters
    const filterSearch = document.getElementById('filter-search');
    const filterLocation = document.getElementById('filter-location');
    const filterMode = document.getElementById('filter-mode');
    const filterExperience = document.getElementById('filter-experience');
    const filterSource = document.getElementById('filter-source');
    const filterSort = document.getElementById('filter-sort');

    // Modal Elements
    const modal = document.getElementById('job-modal');
    const modalCloseBtn = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');

    function initJobs() {
        if (typeof jobs === 'undefined') {
            console.error("Jobs data not loaded!");
            return;
        }

        // Initial Render
        filterAndRenderJobs();
        renderSavedJobs(); // Initial functionality check

        // Setup Filter Listeners
        const filters = [filterSearch, filterLocation, filterMode, filterExperience, filterSource, filterSort];
        filters.forEach(filter => {
            if (filter) filter.addEventListener('input', filterAndRenderJobs);
        });
    }

    function createJobCard(job) {
        const isSaved = savedJobs.includes(job.id);
        const card = document.createElement('div');
        card.className = 'job-card';

        card.innerHTML = `
            <div class="job-card-header">
                <div class="job-title">${job.title}</div>
                <div class="job-company">${job.company}</div>
            </div>
            <div class="job-meta-tags">
                <span class="meta-tag">${job.location}</span>
                <span class="meta-tag">${job.mode}</span>
                <span class="meta-tag">${job.experience}</span>
                <span class="meta-tag">${job.salaryRange}</span>
            </div>
            <div class="job-footer">
                <div class="job-posted">${job.postedDaysAgo === 0 ? 'Today' : job.postedDaysAgo + 'd ago'}</div>
                <span class="job-source">${job.source}</span>
                <div class="job-actions">
                    <button class="btn btn-secondary btn-sm view-btn" data-id="${job.id}">View</button>
                    <button class="btn btn-secondary btn-sm save-btn" data-id="${job.id}" style="${isSaved ? 'color: var(--accent-color); border-color: var(--accent-color);' : ''}">
                        ${isSaved ? 'Saved' : 'Save'}
                    </button>
                    <button class="btn btn-primary btn-sm apply-btn" data-id="${job.id}">Apply</button>
                </div>
            </div>
        `;

        // Add Listeners
        card.querySelector('.view-btn').addEventListener('click', () => openModal(job));
        card.querySelector('.save-btn').addEventListener('click', (e) => toggleSave(job.id, e.target));
        card.querySelector('.apply-btn').addEventListener('click', () => window.open(job.applyUrl, '_blank'));

        return card;
    }

    function filterAndRenderJobs() {
        if (!jobListEl) return;

        const searchTerm = filterSearch.value.toLowerCase();
        const loc = filterLocation.value;
        const mode = filterMode.value;
        const exp = filterExperience.value;
        const src = filterSource.value;
        const sort = filterSort.value;

        let filtered = jobs.filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(searchTerm) ||
                job.company.toLowerCase().includes(searchTerm) ||
                job.skills.some(s => s.toLowerCase().includes(searchTerm));
            const matchesLoc = loc === '' || job.location.includes(loc); // Loose match for multi-location
            const matchesMode = mode === '' || job.mode === mode;
            const matchesExp = exp === '' || job.experience === exp;
            const matchesSrc = src === '' || job.source === src;

            return matchesSearch && matchesLoc && matchesMode && matchesExp && matchesSrc;
        });

        // Sort
        if (sort === 'latest') {
            filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
        } else {
            filtered.sort((a, b) => b.postedDaysAgo - a.postedDaysAgo);
        }

        // Render
        jobListEl.innerHTML = '';
        if (filtered.length === 0) {
            jobListEl.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <h2>No jobs found.</h2>
                    <p>Try adjusting your search filters.</p>
                </div>`;
        } else {
            filtered.forEach(job => {
                jobListEl.appendChild(createJobCard(job));
            });
        }
    }

    function renderSavedJobs() {
        if (!savedJobListEl) return;
        savedJobListEl.innerHTML = '';

        const savedData = jobs.filter(job => savedJobs.includes(job.id));

        if (savedData.length === 0) {
            savedJobListEl.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <h2>Your library is empty.</h2>
                    <p>Saved jobs will appear here for easy access.</p>
                </div>`;
        } else {
            savedData.forEach(job => {
                savedJobListEl.appendChild(createJobCard(job));
            });
        }
    }

    function toggleSave(id, btnElement) {
        const index = savedJobs.indexOf(id);
        if (index === -1) {
            savedJobs.push(id);
            if (btnElement) {
                btnElement.textContent = 'Saved';
                btnElement.style.color = 'var(--accent-color)';
                btnElement.style.borderColor = 'var(--accent-color)';
            }
        } else {
            savedJobs.splice(index, 1);
            if (btnElement) {
                btnElement.textContent = 'Save';
                btnElement.style.color = '';
                btnElement.style.borderColor = '';
            }
        }
        localStorage.setItem('jobTracker_saved', JSON.stringify(savedJobs));

        // Verify we are in the saved view to trigger immediate re-render of removal
        if (window.location.hash === '#saved') {
            renderSavedJobs();
        }
    }

    function openModal(job) {
        document.getElementById('modal-title').textContent = job.title;
        document.getElementById('modal-company').textContent = job.company;
        document.getElementById('modal-location').textContent = job.location;
        document.getElementById('modal-mode').textContent = job.mode;
        document.getElementById('modal-experience').textContent = job.experience;
        document.getElementById('modal-salary').textContent = job.salaryRange;
        document.getElementById('modal-description').textContent = job.description;

        const skillsContainer = document.getElementById('modal-skills');
        skillsContainer.innerHTML = job.skills.map(s => `<span class="skill-pill">${s}</span>`).join('');

        const saveBtn = document.getElementById('modal-save-btn');
        const applyBtn = document.getElementById('modal-apply-btn');

        applyBtn.href = job.applyUrl;

        // Modal Save Button Logic
        const isSaved = savedJobs.includes(job.id);
        saveBtn.textContent = isSaved ? 'Saved' : 'Save Job';
        saveBtn.onclick = () => {
            toggleSave(job.id, null);
            const newStatus = savedJobs.includes(job.id);
            saveBtn.textContent = newStatus ? 'Saved' : 'Save Job';
            // Re-render background lists
            filterAndRenderJobs();
            renderSavedJobs();
        };

        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    // Modal Events
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });


    // Listen for hash changes
    window.addEventListener('hashchange', router);

    // Initial call
    router();
    initJobs();


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
