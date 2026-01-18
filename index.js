import { eventSource, event_types, this_chid, characters, chat_metadata } from '../../../../script.js';
import { world_info, selected_world_info } from '../../../world-info.js';
import { power_user } from '../../../power-user.js';
import { getCharaFilename } from '../../../utils.js';
import { Popup } from '../../../popup.js';

(function() {
    const getDetailedLorebooks = () => {
        const details = {
            "Globally Selected": [],
            "Character Primary Book": [],
            "Character Extra/Aux Books": [],
            "Chat-bound Book": [],
            "Persona-bound Book": []
        };
        
        const uniqueTotal = new Set();
        const filter = (name) => name && !name.includes('CozyWI');

        // 1. Global
        if (Array.isArray(selected_world_info)) {
            selected_world_info.filter(filter).forEach(b => {
                details["Globally Selected"].push(b);
                uniqueTotal.add(b);
            });
        }

        // 2. Character Primary
        const charPrimary = characters[this_chid]?.data?.extensions?.world;
        if (filter(charPrimary)) {
            details["Character Primary Book"].push(charPrimary);
            uniqueTotal.add(charPrimary);
        }

        // 3. Character Extra
        const charFile = getCharaFilename(this_chid);
        const extraEntry = world_info.charLore?.find(e => e.name === charFile);
        if (extraEntry?.extraBooks) {
            extraEntry.extraBooks.filter(filter).forEach(b => {
                details["Character Extra/Aux Books"].push(b);
                uniqueTotal.add(b);
            });
        }

        // 4. Chat
        const chatBook = chat_metadata['world_info'];
        if (filter(chatBook)) {
            details["Chat-bound Book"].push(chatBook);
            uniqueTotal.add(chatBook);
        }

        // 5. Persona
        const personaBook = power_user?.persona_description_lorebook;
        if (filter(personaBook)) {
            details["Persona-bound Book"].push(personaBook);
            uniqueTotal.add(personaBook);
        }

        return { details, count: uniqueTotal.size, allNames: Array.from(uniqueTotal) };
    };

    const updateCounter = () => {
        setTimeout(() => {
            const icon = document.querySelector('#WIDrawerIcon');
            const parent = document.querySelector('#WI-SP-button .drawer-toggle');
            
            if (!icon || !parent) return;

            let badge = document.querySelector('#st-wi-counter-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.id = 'st-wi-counter-badge';
                parent.appendChild(badge);

                badge.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    const data = getDetailedLorebooks();
                    if (data.count === 0) return;

                    // Build Detailed HTML for Popup
                    let html = `<div style="text-align:left;">`;
                    for (const [category, books] of Object.entries(data.details)) {
                        if (books.length > 0) {
                            html += `<div style="margin-bottom:10px;">
                                        <b style="color:var(--SmartThemeQuoteColor); text-decoration:underline;">${category}</b><br>
                                        ${books.map(b => `• ${b}`).join('<br>')}
                                     </div>`;
                        }
                    }
                    html += `</div>`;
                    
                    Popup.show.text("Active Lorebooks Detail", html);
                });
            }

            const data = getDetailedLorebooks();

            if (data.count > 0) {
                badge.textContent = data.count;
                badge.classList.add('show-badge');
                icon.title = `Active Lorebooks (${data.count}):\n${data.allNames.join('\n')}`;
            } else {
                badge.textContent = "";
                badge.classList.remove('show-badge');
                icon.title = "World Info";
            }
        }, 200); 
    };

    eventSource.on(event_types.WORLDINFO_SETTINGS_UPDATED, updateCounter);
    eventSource.on(event_types.SETTINGS_UPDATED, updateCounter);
    eventSource.on(event_types.CHAT_CHANGED, updateCounter);
    eventSource.on(event_types.APP_READY, updateCounter);
    $(document).on('change', '#world_info', updateCounter);

    updateCounter();
})();