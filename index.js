import { eventSource, event_types, this_chid, characters, chat_metadata } from '../../../../script.js';
import { world_info, selected_world_info } from '../../../world-info.js';
import { power_user } from '../../../power-user.js';
import { getCharaFilename, delay } from '../../../utils.js';

const MODULE_NAME = 'CT-WorldInfoBooksCount';

const init = () => {
    const leftSendForm = document.getElementById('leftSendForm');
    if (!leftSendForm) {
        console.error(`[${MODULE_NAME}] Could not find #leftSendForm element`);
        return;
    }

    // Create trigger button
    const trigger = document.createElement('div');
    {
        trigger.id = 'stwbc--trigger';
        trigger.classList.add('stwbc--trigger');
        trigger.classList.add('fa-solid', 'fa-fw', 'fa-book-atlas');
        trigger.classList.add('interactable');
        trigger.tabIndex = 0;
        trigger.title = 'Active World Info Books';
        trigger.addEventListener('click', () => {
            panel.classList.toggle('stwbc--isActive');
        });
        leftSendForm.append(trigger);
    }

    // Create panel for displaying books list
    const panel = document.createElement('div');
    {
        panel.id = 'stwbc--panel';
        panel.classList.add('stwbc--panel');
        panel.innerHTML = 'Loading...';
        document.body.append(panel);
    }

    let count = -1;
    let previousBooks = [];
    let isUpdating = false;

    /**
     * Get detailed lorebooks information
     * @returns {{details: Object, count: number, allNames: string[]}}
     */
    const getDetailedLorebooks = () => {
        const details = {
            'Globally Selected Book': [],
            'Character Primary Book': [],
            'Character Extra/Aux Books': [],
            'Chat-bound Book': [],
            'Persona-bound Book': [],
        };

        const uniqueTotal = new Set();
        const filter = (name) => name && !name.includes('CozyWI');

        // 1. Global
        if (Array.isArray(selected_world_info)) {
            selected_world_info.filter(filter).forEach((b) => {
                details['Globally Selected Book'].push(b);
                uniqueTotal.add(b);
            });
        }

        // 2. Character Primary
        const charPrimary = characters[this_chid]?.data?.extensions?.world;
        if (filter(charPrimary)) {
            details['Character Primary Book'].push(charPrimary);
            uniqueTotal.add(charPrimary);
        }

        // 3. Character Extra
        const charFile = getCharaFilename(this_chid);
        const extraEntry = world_info.charLore?.find((e) => e.name === charFile);
        if (extraEntry?.extraBooks) {
            extraEntry.extraBooks.filter(filter).forEach((b) => {
                details['Character Extra/Aux Books'].push(b);
                uniqueTotal.add(b);
            });
        }

        // 4. Chat
        const chatBook = chat_metadata['world_info'];
        if (filter(chatBook)) {
            details['Chat-bound Book'].push(chatBook);
            uniqueTotal.add(chatBook);
        }

        // 5. Persona
        const personaBook = power_user?.persona_description_lorebook;
        if (filter(personaBook)) {
            details['Persona-bound Book'].push(personaBook);
            uniqueTotal.add(personaBook);
        }

        return { details, count: uniqueTotal.size, allNames: Array.from(uniqueTotal) };
    };

    /**
     * Update the badge count with animations
     * @param {number} newCount - New count to display
     * @param {string[]} newBooks - Array of book names
     */
    const updateBadge = async (newCount, newBooks) => {
        // Prevent race conditions from multiple simultaneous updates
        if (isUpdating) return;
        isUpdating = true;

        try {
            if (count !== newCount) {
                if (newCount === 0) {
                    // Animating out
                    trigger.classList.add('stwbc--badge-out');
                    await delay(510);
                    trigger.setAttribute('data-stwbc--badge-count', newCount.toString());
                    trigger.classList.remove('stwbc--badge-out');
                } else if (count === 0 || count === -1) {
                    // Animating in (or first load)
                    trigger.setAttribute('data-stwbc--badge-count', newCount.toString());
                    trigger.classList.add('stwbc--badge-in');
                    await delay(510);
                    trigger.classList.remove('stwbc--badge-in');
                } else {
                    // Bounce animation for count change
                    trigger.setAttribute('data-stwbc--badge-count', newCount.toString());
                    trigger.classList.add('stwbc--badge-bounce');
                    await delay(1010);
                    trigger.classList.remove('stwbc--badge-bounce');
                }
                count = newCount;
            } else if (newBooks.length > 0) {
                // Check if books changed even if count is the same
                const newSet = new Set(newBooks);
                const oldSet = new Set(previousBooks);
                const hasChanges = newBooks.some((b) => !oldSet.has(b)) || previousBooks.some((b) => !newSet.has(b));
                if (hasChanges) {
                    trigger.classList.add('stwbc--badge-bounce');
                    await delay(1010);
                    trigger.classList.remove('stwbc--badge-bounce');
                }
            }
            previousBooks = [...newBooks];
        } finally {
            isUpdating = false;
        }
    };

    /**
     * Update the panel content with book list
     * @param {Object} details - Categorized book details
     * @param {number} totalCount - Total unique book count
     */
    const updatePanel = (details, totalCount) => {
        panel.innerHTML = '';

        if (totalCount === 0) {
            panel.innerHTML = '<div class="stwbc--empty">No active lorebooks</div>';
            return;
        }

        for (const [category, books] of Object.entries(details)) {
            if (books.length === 0) continue;

            const categoryEl = document.createElement('div');
            categoryEl.classList.add('stwbc--category');
            categoryEl.textContent = category;
            panel.append(categoryEl);

            for (const book of books) {
                const bookEl = document.createElement('div');
                bookEl.classList.add('stwbc--book');

                const icon = document.createElement('div');
                icon.classList.add('stwbc--icon');
                icon.classList.add('fa-solid', 'fa-fw', 'fa-book-atlas');
                bookEl.append(icon);

                const title = document.createElement('div');
                title.classList.add('stwbc--title');
                title.textContent = book;
                title.title = book;
                bookEl.append(title);

                panel.append(bookEl);
            }
        }
    };

    /**
     * Main update function
     */
    const updateCounter = () => {
        setTimeout(() => {
            const data = getDetailedLorebooks();

            // Update trigger title
            if (data.count > 0) {
                trigger.title = `Active Lorebooks (${data.count}):\n${data.allNames.join('\n')}`;
            } else {
                trigger.title = 'World Info Books';
            }

            // Update badge and panel
            updateBadge(data.count, data.allNames);
            updatePanel(data.details, data.count);
        }, 200);
    };

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !trigger.contains(e.target)) {
            panel.classList.remove('stwbc--isActive');
        }
    });

    // Register event listeners
    eventSource.on(event_types.WORLDINFO_SETTINGS_UPDATED, updateCounter);
    eventSource.on(event_types.SETTINGS_UPDATED, updateCounter);
    eventSource.on(event_types.CHAT_CHANGED, updateCounter);
    eventSource.on(event_types.APP_READY, updateCounter);

    // Also listen for world info dropdown changes
    $(document).on('change', '#world_info', updateCounter);

    // Initial update
    updateCounter();

    console.log(`[${MODULE_NAME}] Extension loaded`);
};

init();
