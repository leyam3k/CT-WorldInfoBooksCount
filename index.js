import { eventSource, event_types, this_chid, characters, chat_metadata } from '../../../../script.js';
import { world_info, selected_world_info, getSortedEntries } from '../../../world-info.js';
import { power_user } from '../../../power-user.js';
import { getCharaFilename, delay, debounce } from '../../../utils.js';

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
            if (panel.classList.contains('stwbc--isActive')) {
                updateCounter(true);
            }
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

    let currentBadgeValue = '';
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
     * Parse regex from string key if applicable
     * @param {string} key 
     * @returns {RegExp|null}
     */
    const getRegexFromKey = (key) => {
        if (typeof key === 'string' && key.startsWith('/') && key.lastIndexOf('/') > 0) {
            const lastSlashIndex = key.lastIndexOf('/');
            const pattern = key.slice(1, lastSlashIndex);
            const flags = key.slice(lastSlashIndex + 1);
            try {
                return new RegExp(pattern, flags);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Get constant and triggered entries
     */
    const getEntriesDetails = async () => {
        const sortedEntries = await getSortedEntries();
        const constantMap = {};
        const triggerMap = {};
        const input = document.getElementById('send_textarea')?.value || '';
        const lowerInput = input.toLowerCase();

        for (const entry of sortedEntries) {
            if (entry.disable) continue;
            if (entry.world && entry.world.includes('CozyWI')) continue;

            // Constant entries
            if (entry.constant) {
                if (!constantMap[entry.world]) constantMap[entry.world] = [];
                constantMap[entry.world].push(entry);
            } 
            // Triggered entries
            else {
                let isMatch = false;
                let matchKey = '';
                
                if (Array.isArray(entry.key)) {
                    for (const key of entry.key) {
                        const regex = getRegexFromKey(key);
                        if (regex) {
                            if (regex.test(input)) {
                                isMatch = true;
                                matchKey = key;
                                break;
                            }
                        } else if (typeof key === 'string') {
                            if (lowerInput.includes(key.toLowerCase())) {
                                isMatch = true;
                                matchKey = key;
                                break;
                            }
                        }
                    }
                }

                if (isMatch) {
                    if (!triggerMap[entry.world]) triggerMap[entry.world] = [];
                    // Store the matched key for display
                    entry._matchedKey = matchKey;
                    triggerMap[entry.world].push(entry);
                }
            }
        }

        return { constantMap, triggerMap };
    };

    /**
     * Update the badge label with animations
     * @param {string} newValue - New string to display (e.g. "2" or "2-4")
     * @param {string[]} newBooks - Array of book names
     */
    const updateBadge = async (newValue, newBooks) => {
        if (isUpdating) return;
        isUpdating = true;

        try {
            const isNoBooks = newValue.startsWith('0');
            
            if (currentBadgeValue !== newValue) {
                if (isNoBooks) {
                    trigger.classList.add('stwbc--badge-out');
                    await delay(510);
                    trigger.setAttribute('data-stwbc--badge-count', newValue);
                    trigger.classList.remove('stwbc--badge-out');
                } else if (currentBadgeValue === '' || currentBadgeValue.startsWith('0')) {
                    trigger.setAttribute('data-stwbc--badge-count', newValue);
                    trigger.classList.add('stwbc--badge-in');
                    await delay(510);
                    trigger.classList.remove('stwbc--badge-in');
                } else {
                    trigger.setAttribute('data-stwbc--badge-count', newValue);
                    trigger.classList.add('stwbc--badge-bounce');
                    await delay(1010);
                    trigger.classList.remove('stwbc--badge-bounce');
                }
                currentBadgeValue = newValue;
            } else if (newBooks.length > 0) {
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
     * Create entries list HTML
     * @param {string} title
     * @param {Object} entriesMap
     * @param {boolean} showMatch
     */
    const renderEntriesSection = (title, entriesMap, showMatch = false) => {
        const container = document.createDocumentFragment();
        const header = document.createElement('div');
        header.classList.add('stwbc--section-header');
        header.textContent = title;
        container.append(header);

        const books = Object.keys(entriesMap).sort();
        if (books.length === 0) {
            const empty = document.createElement('div');
            empty.classList.add('stwbc--empty');
            empty.textContent = 'None';
            container.append(empty);
            return container;
        }

        for (const book of books) {
            const group = document.createElement('div');
            group.classList.add('stwbc--book-group');
            
            const bookName = document.createElement('div');
            bookName.classList.add('stwbc--book-name');
            bookName.innerHTML = `<div class="stwbc--icon fa-solid fa-fw fa-book"></div> ${book}`;
            group.append(bookName);

            for (const entry of entriesMap[book]) {
                const entryEl = document.createElement('div');
                entryEl.classList.add('stwbc--entry');
                let text = entry.comment || entry.content || 'Untitled';
                if (showMatch && entry._matchedKey) {
                    const matchSpan = `<span class="stwbc--match-preview">[${entry._matchedKey}]</span>`;
                    entryEl.innerHTML = `${matchSpan} ${text}`;
                } else {
                    entryEl.textContent = text;
                }
                entryEl.title = entry.content;
                group.append(entryEl);
            }
            container.append(group);
        }
        return container;
    };

    /**
     * Update the panel content with book list
     * @param {Object} details - Categorized book details
     * @param {Object} constantEntries
     * @param {Object} triggeredEntries
     */
    const updatePanel = (details, constantEntries, triggeredEntries) => {
        panel.innerHTML = '';

        // 1. Active Lorebooks Summary
        const activeContainer = document.createElement('div');
        const activeHeader = document.createElement('div');
        activeHeader.classList.add('stwbc--section-header');
        activeHeader.textContent = 'Active Books';
        activeHeader.style.marginTop = '0';
        activeHeader.style.borderTop = 'none';
        activeContainer.append(activeHeader);

        let hasActiveBooks = false;
        for (const [category, books] of Object.entries(details)) {
            if (books.length === 0) continue;
            hasActiveBooks = true;

            const categoryEl = document.createElement('div');
            categoryEl.classList.add('stwbc--category');
            categoryEl.textContent = category;
            activeContainer.append(categoryEl);

            for (const book of books) {
                const bookEl = document.createElement('div');
                bookEl.classList.add('stwbc--book');
                bookEl.innerHTML = `<div class="stwbc--icon fa-solid fa-fw fa-book-atlas"></div><div class="stwbc--title" title="${book}">${book}</div>`;
                activeContainer.append(bookEl);
            }
        }

        if (!hasActiveBooks) {
             const empty = document.createElement('div');
             empty.classList.add('stwbc--empty');
             empty.textContent = 'No active lorebooks';
             activeContainer.append(empty);
        }
        panel.append(activeContainer);

        // 2. Constant Entries
        panel.append(renderEntriesSection('Constant Entries', constantEntries));

        // 3. Preview Triggers
        panel.append(renderEntriesSection('Preview Triggers', triggeredEntries, true));
    };

    /**
     * Main update function
     * @param {boolean} forcePanelUpdate
     */
    const updateCounter = async (forcePanelUpdate = false) => {
        const bookData = getDetailedLorebooks();
        const { constantMap, triggerMap } = await getEntriesDetails();

        const triggerCount = Object.values(triggerMap).flat().length;
        const badgeLabel = triggerCount > 0 ? `${bookData.count}-${triggerCount}` : `${bookData.count}`;

        // Update trigger title
        if (bookData.count > 0 || triggerCount > 0) {
            trigger.title = `Active Lorebooks (${bookData.count})${triggerCount > 0 ? ` + Triggers (${triggerCount})` : ''}:\n${bookData.allNames.join('\n')}`;
        } else {
            trigger.title = 'World Info Books';
        }

        updateBadge(badgeLabel, bookData.allNames);

        if (panel.classList.contains('stwbc--isActive') || forcePanelUpdate) {
            updatePanel(bookData.details, constantMap, triggerMap);
        }
    };

    const debouncedUpdate = debounce(() => updateCounter(true), 300);

    // Monitor textarea
    const monitorTextarea = () => {
        const textarea = document.getElementById('send_textarea');
        if (textarea) {
            textarea.removeEventListener('input', debouncedUpdate);
            textarea.addEventListener('input', debouncedUpdate);
        }
    };

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !trigger.contains(e.target)) {
            panel.classList.remove('stwbc--isActive');
        }
    });

    // Register event listeners
    eventSource.on(event_types.WORLDINFO_SETTINGS_UPDATED, () => updateCounter(false));
    eventSource.on(event_types.SETTINGS_UPDATED, () => updateCounter(false));
    eventSource.on(event_types.CHAT_CHANGED, () => updateCounter(false));
    eventSource.on(event_types.APP_READY, () => {
        updateCounter(false);
        monitorTextarea();
    });

    $(document).on('change', '#world_info', () => updateCounter(false));

    monitorTextarea();
    updateCounter(false);

    console.log(`[${MODULE_NAME}] Extension loaded`);
};

init();