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
    let preferences = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || null;
    // Status Tracking Data
    let jobStatuses = JSON.parse(localStorage.getItem('jobTrackerStatus')) || {};
    let statusLog = JSON.parse(localStorage.getItem('jobTrackerStatusLog')) || [];

    // DOM Elements
    const jobListEl = document.getElementById('job-list');
    const savedJobListEl = document.getElementById('saved-job-list');

    // Filters & Controls
    const filterSearch = document.getElementById('filter-search');
    const filterLocation = document.getElementById('filter-location');
    const filterMode = document.getElementById('filter-mode');
    const filterExperience = document.getElementById('filter-experience');
    const filterSource = document.getElementById('filter-source');
    const filterSort = document.getElementById('filter-sort');
    const filterStatus = document.getElementById('filter-status');
    const toggleMatchOnly = document.getElementById('toggle-match-only');
    const bannerNoPrefs = document.getElementById('banner-no-prefs');

    // Settings Form Elements
    const prefRole = document.getElementById('pref-role');
    const prefSkills = document.getElementById('pref-skills');
    const prefLocation = document.getElementById('pref-location');
    const prefExperience = document.getElementById('pref-experience');
    const prefThreshold = document.getElementById('pref-threshold');
    const ThresholdVal = document.getElementById('threshold-val');
    const savePrefsBtn = document.getElementById('save-prefs-btn');
    const saveMsg = document.getElementById('save-msg');


    // Modal Elements
    const modal = document.getElementById('job-modal');
    const modalCloseBtn = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');

    function initJobs() {
        if (typeof jobs === 'undefined') {
            console.error("Jobs data not loaded!");
            return;
        }

        loadPreferences();

        // Initial Render
        filterAndRenderJobs();
        renderSavedJobs(); // Initial functionality check

        // Setup Filter Listeners
        const filters = [filterSearch, filterLocation, filterMode, filterExperience, filterSource, filterSort, filterStatus];
        filters.forEach(filter => {
            if (filter) filter.addEventListener('input', filterAndRenderJobs);
        });

        if (toggleMatchOnly) {
            toggleMatchOnly.addEventListener('change', filterAndRenderJobs);
        }

        // Setup Settings Listeners
        if (prefThreshold) {
            prefThreshold.addEventListener('input', (e) => {
                if (ThresholdVal) ThresholdVal.textContent = e.target.value;
            });
        }


        if (savePrefsBtn) {
            savePrefsBtn.addEventListener('click', savePreferences);
        }

        initDigest(); // Initialize Digest Logic
    }

    function loadPreferences() {
        if (!preferences) {
            if (bannerNoPrefs) bannerNoPrefs.classList.remove('hidden');
            return;
        }

        if (bannerNoPrefs) bannerNoPrefs.classList.add('hidden');

        // Pre-fill form
        if (prefRole) prefRole.value = preferences.roleKeywords.join(', ');
        if (prefSkills) prefSkills.value = preferences.skills.join(', ');
        if (prefExperience) prefExperience.value = preferences.experienceLevel;
        if (prefThreshold) {
            prefThreshold.value = preferences.minMatchScore;
            if (ThresholdVal) ThresholdVal.textContent = preferences.minMatchScore;
        }

        // Multi-select Location
        if (prefLocation) {
            Array.from(prefLocation.options).forEach(opt => {
                if (preferences.preferredLocations.includes(opt.value)) {
                    opt.selected = true;
                }
            });
        }

        // Checkboxes Mode
        if (preferences.preferredMode.includes('Remote')) document.getElementById('pref-mode-remote').checked = true;
        if (preferences.preferredMode.includes('Hybrid')) document.getElementById('pref-mode-hybrid').checked = true;
        if (preferences.preferredMode.includes('Onsite')) document.getElementById('pref-mode-onsite').checked = true;
    }

    function savePreferences() {
        const roles = prefRole.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const skills = prefSkills.value.split(',').map(s => s.trim()).filter(s => s.length > 0);

        const locs = Array.from(prefLocation.selectedOptions).map(opt => opt.value);

        const modes = [];
        if (document.getElementById('pref-mode-remote').checked) modes.push('Remote');
        if (document.getElementById('pref-mode-hybrid').checked) modes.push('Hybrid');
        if (document.getElementById('pref-mode-onsite').checked) modes.push('Onsite');

        const newPrefs = {
            roleKeywords: roles,
            skills: skills,
            preferredLocations: locs,
            preferredMode: modes,
            experienceLevel: prefExperience.value,
            minMatchScore: parseInt(prefThreshold.value)
        };

        localStorage.setItem('jobTrackerPreferences', JSON.stringify(newPrefs));
        preferences = newPrefs;

        // Update UI feedback
        loadPreferences(); // Hide banner if present
        if (saveMsg) {
            saveMsg.style.opacity = '1';
            setTimeout(() => { saveMsg.style.opacity = '0'; }, 3000);
        }

        // Re-calculate scores and render
        filterAndRenderJobs();
    }

    function calculateMatchScore(job) {
        if (!preferences) return 0;

        let score = 0;

        // 1. Role Keyword match (+25 Tile, +15 Desc)
        const jobTitle = job.title.toLowerCase();
        const jobDesc = job.description.toLowerCase();

        const roleMatchesTitle = preferences.roleKeywords.some(k => jobTitle.includes(k.toLowerCase()));
        if (roleMatchesTitle) score += 25;

        const roleMatchesDesc = preferences.roleKeywords.some(k => jobDesc.includes(k.toLowerCase()));
        if (roleMatchesDesc) score += 15;

        // 2. Location (+15)
        // Check if job location matches ANY preferred location
        // Note: Job location might be specific ("Bangalore"), prefs might have ["Bangalore", "Remote"]
        const locMatch = preferences.preferredLocations.some(l => job.location.includes(l));
        if (locMatch) score += 15;

        // 3. Mode (+10)
        if (preferences.preferredMode.includes(job.mode)) score += 10;

        // 4. Experience (+10)
        if (preferences.experienceLevel === job.experience || preferences.experienceLevel === 'Any') score += 10;

        // 5. Skills Overlap (+15)
        const jobSkillsLower = job.skills.map(s => s.toLowerCase());
        const prefSkillsLower = preferences.skills.map(s => s.toLowerCase());
        const hasSkillOverlap = prefSkillsLower.some(s => jobSkillsLower.includes(s));
        if (hasSkillOverlap) score += 15;

        // 6. Recency (+5)
        if (job.postedDaysAgo <= 2) score += 5;

        // 7. Source (+5)
        if (job.source === 'LinkedIn') score += 5;

        return Math.min(score, 100);
    }

    function getMatchBadgeHTML(score) {
        if (!preferences) return '';

        let badgeClass = 'match-none';
        if (score >= 80) badgeClass = 'match-high';
        else if (score >= 60) badgeClass = 'match-medium';
        else if (score >= 40) badgeClass = 'match-low';

        return `<div class="match-badge ${badgeClass}">${score}% Match</div>`;
    }

    function createJobCard(job) {
        const isSaved = savedJobs.includes(job.id);
        const matchBadge = getMatchBadgeHTML(job.matchScore || 0);

        // Status Handling
        const currentStatus = jobStatuses[job.id] || 'Not Applied';
        let statusBadgeClass = 'not-applied';
        if (currentStatus === 'Applied') statusBadgeClass = 'applied';
        if (currentStatus === 'Rejected') statusBadgeClass = 'rejected';
        if (currentStatus === 'Selected') statusBadgeClass = 'selected';

        const statusBadge = currentStatus !== 'Not Applied' ?
            `<span class="status-badge ${statusBadgeClass}">${currentStatus}</span>` : '';

        const card = document.createElement('div');
        card.className = 'job-card';

        // Status Button Group Generation
        const statuses = ['Not Applied', 'Applied', 'Rejected', 'Selected'];
        const statusButtonsHTML = statuses.map(s => {
            const isActive = s === currentStatus ? 'active' : '';
            return `<button class="status-btn ${isActive}" data-status="${s}" data-id="${job.id}">${s}</button>`;
        }).join('');

        card.innerHTML = `
            <div class="job-card-header">
                <div style="display:flex; gap:8px;">
                    ${matchBadge}
                    ${statusBadge}
                </div>
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
            <!-- Status Control -->
            <div class="status-btn-group">
                ${statusButtonsHTML}
            </div>
        `;

        // Add Listeners
        card.querySelector('.view-btn').addEventListener('click', () => openModal(job));
        card.querySelector('.save-btn').addEventListener('click', (e) => toggleSave(job.id, e.target));
        card.querySelector('.apply-btn').addEventListener('click', () => window.open(job.applyUrl, '_blank'));

        // Status Button Listeners
        card.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newStatus = e.target.dataset.status;
                const jobId = parseInt(e.target.dataset.id);
                updateJobStatus(jobId, newStatus, job);
            });
        });

        return card;
    }

    function updateJobStatus(jobId, newStatus, job) {
        // 1. Update State
        if (newStatus === 'Not Applied') {
            delete jobStatuses[jobId];
        } else {
            jobStatuses[jobId] = newStatus;
        }
        localStorage.setItem('jobTrackerStatus', JSON.stringify(jobStatuses));

        // 2. Log History
        const logEntry = {
            jobId: jobId,
            title: job.title,
            company: job.company,
            status: newStatus,
            date: new Date().toISOString()
        };
        statusLog.unshift(logEntry); // Add to beginning
        if (statusLog.length > 50) statusLog.pop(); // Limit log size
        localStorage.setItem('jobTrackerStatusLog', JSON.stringify(statusLog));

        // 3. Notification
        showToast(`Status updated: ${newStatus}`, newStatus === 'Selected' ? 'success' : 'info');

        // 4. Re-render
        // We re-render specifically to update the UI visuals without losing scroll position if possible,
        // but for now full re-render is safer for consistency.
        filterAndRenderJobs();
        renderSavedJobs(); // In case we are in saved view
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;

        container.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function filterAndRenderJobs() {
        if (!jobListEl) return;

        const searchTerm = filterSearch.value.toLowerCase();
        const loc = filterLocation.value;
        const mode = filterMode.value;
        const exp = filterExperience.value;
        const src = filterSource.value;
        const sort = filterSort.value;
        const statusFilter = filterStatus ? filterStatus.value : 'All';
        const showMatchesOnly = toggleMatchOnly ? toggleMatchOnly.checked : false;

        // 1. Calculate Scores & Map
        let processedJobs = jobs.map(job => {
            return {
                ...job,
                matchScore: calculateMatchScore(job),
                status: jobStatuses[job.id] || 'Not Applied'
            };
        });

        // 2. Filter
        let filtered = processedJobs.filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(searchTerm) ||
                job.company.toLowerCase().includes(searchTerm) ||
                job.skills.some(s => s.toLowerCase().includes(searchTerm));
            const matchesLoc = loc === '' || job.location.includes(loc);
            const matchesMode = mode === '' || job.mode === mode;
            const matchesExp = exp === '' || job.experience === exp;
            const matchesSrc = src === '' || job.source === src;

            // Status Filter
            const matchesStatus = statusFilter === 'All' || job.status === statusFilter;

            // Match Threshold Filter
            const matchesThreshold = !showMatchesOnly || (preferences && job.matchScore >= preferences.minMatchScore);

            return matchesSearch && matchesLoc && matchesMode && matchesExp && matchesSrc && matchesThreshold && matchesStatus;
        });

        // 3. Sort
        if (sort === 'latest') {
            filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
        } else if (sort === 'oldest') {
            filtered.sort((a, b) => b.postedDaysAgo - a.postedDaysAgo);
        } else if (sort === 'match') {
            filtered.sort((a, b) => b.matchScore - a.matchScore);
        } else if (sort === 'salary') {
            // Simple sort based on first number found in string
            filtered.sort((a, b) => {
                const getSal = (s) => parseInt(s.replace(/[^0-9]/g, '')) || 0;
                return getSal(b.salaryRange) - getSal(a.salaryRange);
            });
        }

        // 4. Render
        jobListEl.innerHTML = '';
        if (filtered.length === 0) {
            jobListEl.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <h2>No jobs found.</h2>
                    <p>Try adjusting your search filters or lowering your match threshold.</p>
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


    // --- Daily Digest Logic ---
    const digestGenerator = document.getElementById('digest-generator');
    const digestContent = document.getElementById('digest-content');
    const digestNoPrefs = document.getElementById('digest-no-prefs');
    const digestNoMatches = document.getElementById('digest-no-matches');
    const btnGenerateDigest = document.getElementById('btn-generate-digest');
    const btnCopyDigest = document.getElementById('btn-copy-digest');
    const btnEmailDigest = document.getElementById('btn-email-digest');
    const digestDateDisplay = document.getElementById('digest-date-display');
    const digestJobList = document.getElementById('digest-job-list');

    function initDigest() {
        if (!preferences) {
            showDigestState('no-prefs');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const savedDigest = localStorage.getItem(`jobTrackerDigest_${today}`);

        if (savedDigest) {
            const digestData = JSON.parse(savedDigest);
            renderDigest(digestData);
            showDigestState('content');
        } else {
            showDigestState('generator');
        }

        setupDigestListeners();
    }

    function setupDigestListeners() {
        if (btnGenerateDigest) btnGenerateDigest.onclick = generateDigest;
        if (btnCopyDigest) btnCopyDigest.onclick = handleCopyDigest;
        if (btnEmailDigest) btnEmailDigest.onclick = handleEmailDigest;
    }

    function showDigestState(state) {
        if (digestGenerator) digestGenerator.classList.add('hidden');
        if (digestContent) digestContent.classList.add('hidden');
        if (digestNoPrefs) digestNoPrefs.classList.add('hidden');
        if (digestNoMatches) digestNoMatches.classList.add('hidden');

        if (state === 'generator' && digestGenerator) digestGenerator.classList.remove('hidden');
        if (state === 'content' && digestContent) digestContent.classList.remove('hidden');
        if (state === 'no-prefs' && digestNoPrefs) digestNoPrefs.classList.remove('hidden');
        if (state === 'no-matches' && digestNoMatches) digestNoMatches.classList.remove('hidden');
    }

    function generateDigest() {
        if (!preferences) return;

        // 1. Calculate Scores
        let processedJobs = jobs.map(job => ({
            ...job,
            matchScore: calculateMatchScore(job)
        }));

        // 2. Filter & Sort
        // Logic: Must match prefs (min score), sorted by Score DESC, then Date NEWEST
        let qualifiedJobs = processedJobs.filter(job => job.matchScore >= preferences.minMatchScore);

        qualifiedJobs.sort((a, b) => {
            if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
            return a.postedDaysAgo - b.postedDaysAgo; // Lower days ago is newer
        });

        // 3. Take Top 10
        const top10 = qualifiedJobs.slice(0, 10);

        if (top10.length === 0) {
            showDigestState('no-matches');
            return;
        }

        // 4. Persist
        const today = new Date().toISOString().split('T')[0];
        const digestData = {
            date: today,
            jobs: top10
        };
        localStorage.setItem(`jobTrackerDigest_${today}`, JSON.stringify(digestData));

        // 5. Render
        renderDigest(digestData);
        showDigestState('content');
    }

    function renderDigest(digestData) {
        if (!digestJobList || !digestDateDisplay) return;

        // Format Date
        const dateObj = new Date(digestData.date);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        digestDateDisplay.textContent = dateObj.toLocaleDateString('en-US', options);

        digestJobList.innerHTML = '';

        digestData.jobs.forEach(job => {
            const item = document.createElement('div');
            item.className = 'digest-item';
            item.innerHTML = `
                <div class="digest-item-content">
                    <div class="digest-job-title">${job.title}</div>
                    <div class="digest-job-company">${job.company}</div>
                    <div class="digest-job-meta">
                        <span>📍 ${job.location}</span>
                        <span>💼 ${job.experience}</span>
                        <span>💰 ${job.salaryRange}</span>
                    </div>
                </div>
                <div class="digest-item-actions">
                    <span class="digest-match-score">${job.matchScore}% Match</span>
                    <a href="${job.applyUrl}" target="_blank" class="btn btn-primary btn-sm" style="padding: 4px 12px; font-size: 12px;">Apply</a>
                </div>
            `;
            digestJobList.appendChild(item);
        });
        renderDigestUpdates();
    }

    function renderDigestUpdates() {
        const container = document.getElementById('digest-updates-list');
        const section = document.getElementById('digest-updates-section');
        if (!container || !section) return;

        if (statusLog.length === 0) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        container.innerHTML = '';

        // Show last 5 updates
        statusLog.slice(0, 5).forEach(log => {
            const date = new Date(log.date).toLocaleDateString();
            const item = document.createElement('div');
            item.className = 'digest-update-item';

            let statusColor = '#666';
            if (log.status === 'Applied') statusColor = '#1976D2';
            if (log.status === 'Rejected') statusColor = '#D32F2F';
            if (log.status === 'Selected') statusColor = '#388E3C';

            item.innerHTML = `
                <div>
                    <strong>${log.title}</strong> at ${log.company}
                </div>
                <div>
                    <span style="color:${statusColor}; font-weight:600;">${log.status}</span>
                    <span style="font-size:0.8rem; color:#999; margin-left:8px;">${date}</span>
                </div>
            `;
            container.appendChild(item);
        });
    }

    function handleCopyDigest() {
        const today = new Date().toISOString().split('T')[0];
        const savedDigest = JSON.parse(localStorage.getItem(`jobTrackerDigest_${today}`));
        if (!savedDigest) return;

        let text = `📅 Job Digest - ${savedDigest.date}\n\n`;
        savedDigest.jobs.forEach((job, index) => {
            text += `${index + 1}. ${job.title} at ${job.company}\n`;
            text += `   📍 ${job.location} | Match: ${job.matchScore}%\n`;
            text += `   🔗 Apply: ${job.applyUrl}\n\n`;
        });
        text += `Generated by Job Notification Tracker`;

        navigator.clipboard.writeText(text).then(() => {
            if (btnCopyDigest) {
                const originalText = btnCopyDigest.textContent;
                btnCopyDigest.textContent = "✅ Copied!";
                setTimeout(() => btnCopyDigest.textContent = originalText, 2000);
            }
        });
    }

    function handleEmailDigest() {
        const today = new Date().toISOString().split('T')[0];
        const savedDigest = JSON.parse(localStorage.getItem(`jobTrackerDigest_${today}`));
        if (!savedDigest) return;

        const subject = encodeURIComponent(`My 9AM Job Digest - ${savedDigest.date}`);
        let body = `Here are your top job matches for today:\n\n`;

        savedDigest.jobs.forEach((job, index) => {
            body += `${index + 1}. ${job.title} at ${job.company}\n`;
            body += `Location: ${job.location}\n`;
            body += `Match Score: ${job.matchScore}%\n`;
            body += `Link: ${job.applyUrl}\n\n`;
        });

        window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
    }


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
