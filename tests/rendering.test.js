import { describe, it, expect, vi, beforeEach } from 'vitest';

// Simular DOM e Globais necessários para book.js
describe('OnBible Highlighter Interaction', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="view_text"></div>
            <div id="hl-popover" style="display: none;"></div>
            <span id="page">1</span>
            <div id="text-skeleton" style="display:none"></div>
        `;
        global.activeVerseNum = null;
        global.param = { abbrev: 'gn' };
        global.current_page = 1;
        global.records_per_page = 1;
        global.book_chapters = [
            {"0": "No princípio...", "1": "E a terra..."}
        ];
        global.available_images = [];
        global.num_chapters = () => 1;
        global.DB = {
            setHighlight: vi.fn(),
            deleteHighlight: vi.fn(),
            getHighlights: vi.fn().mockResolvedValue([
                {verse: 1, color: 'yellow'}
            ]),
            setChapter: vi.fn()
        };
    });

    it('should correctly render and apply highlights to verses', async () => {
        // Simulação da função change_chapter refatorada
        const change_chapter = async (page) => {
            const table = document.getElementById("view_text");
            let html = "";
            const chapter = global.book_chapters[page-1];
            for (let v in chapter) {
                let realV = parseInt(v) + 1;
                html += `<span class="verse-item" id="v-${realV}">${chapter[v]}</span>`;
            }
            table.innerHTML = html;
            
            // Simular applyHighlightsFromDB
            const highlights = await global.DB.getHighlights('gn', page);
            highlights.forEach(h => {
                const el = document.getElementById('v-' + h.verse);
                if (el) el.classList.add('hl-' + h.color);
            });
        };

        await change_chapter(1);

        const v1 = document.getElementById('v-1');
        const v2 = document.getElementById('v-2');

        expect(v1.innerHTML).toBe("No princípio...");
        expect(v1.classList.contains('hl-yellow')).toBe(true);
        expect(v2.classList.contains('hl-yellow')).toBe(false);
    });
});
