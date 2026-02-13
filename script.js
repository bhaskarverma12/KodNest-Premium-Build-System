// Basic interaction for the design system proof of concept

document.addEventListener('DOMContentLoaded', () => {
    // console.log("KodNest Design System Loaded");
    
    // Checkbox interaction (visual only for now)
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
