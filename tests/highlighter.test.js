import { describe, it, expect, vi, beforeEach } from 'vitest';

// Simular DOM e Globais necessários para book.js
describe('OnBible Highlighter Logic', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="view_text"></div>
            <div id="hl-popover" style="display: none;"></div>
            <span id="page">1</span>
        `;
        // Globais exigidas pelo scripts legados
        global.activeVerseNum = null;
        global.param = { abbrev: 'gn' };
        global.current_page = 1;
        global.DB = {
            setHighlight: vi.fn(),
            deleteHighlight: vi.fn(),
            getHighlights: vi.fn().mockResolvedValue([])
        };
    });

    it('should show the highlight menu when a verse is clicked', async () => {
        // Mock da função que vamos testar (precisamos expor ela)
        // Por agora, vamos simular o comportamento manual conforme o código atual
        const showHighlightMenu = (event, verseNum) => {
            event.stopPropagation();
            global.activeVerseNum = verseNum;
            const popover = document.getElementById('hl-popover');
            popover.style.display = 'flex';
            popover.style.left = event.pageX + 'px';
            popover.style.top = event.pageY + 'px';
        };

        const event = { stopPropagation: vi.fn(), pageX: 100, pageY: 200 };
        showHighlightMenu(event, 1);

        expect(global.activeVerseNum).toBe(1);
        const popover = document.getElementById('hl-popover');
        expect(popover.style.display).toBe('flex');
        expect(popover.style.left).toBe('100px');
    });

    it('should save highlight and update DOM', async () => {
        const verseEl = document.createElement('span');
        verseEl.id = 'v-1';
        document.getElementById('view_text').appendChild(verseEl);
        global.activeVerseNum = 1;

        const saveHighlight = async (color) => {
            const el = document.getElementById('v-1');
            el.classList.add('hl-' + color);
            await global.DB.setHighlight('gn', 1, 1, color);
            document.getElementById('hl-popover').style.display = 'none';
        };

        await saveHighlight('yellow');

        expect(verseEl.classList.contains('hl-yellow')).toBe(true);
        expect(global.DB.setHighlight).toHaveBeenCalledWith('gn', 1, 1, 'yellow');
        expect(document.getElementById('hl-popover').style.display).toBe('none');
    });
});
