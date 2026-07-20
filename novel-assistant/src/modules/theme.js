// theme.js - 테마 및 폰트 설정
export function initTheme() {
    const savedTheme = localStorage.getItem('novelWriter_theme') || 'dark';
    const savedFont = localStorage.getItem('novelWriter_font') || 'nanum';
    
    setTheme(savedTheme);
    setFont(savedFont);
    
    document.getElementById('fontSelect').value = savedFont;
    
    // 이벤트 리스너
    document.getElementById('btnDark').addEventListener('click', () => setTheme('dark'));
    document.getElementById('btnLight').addEventListener('click', () => setTheme('light'));
    document.getElementById('fontSelect').addEventListener('change', (e) => setFont(e.target.value));
}

export function setTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light');
        document.getElementById('btnLight').classList.add('active');
        document.getElementById('btnDark').classList.remove('active');
    } else {
        document.body.classList.remove('light');
        document.getElementById('btnDark').classList.add('active');
        document.getElementById('btnLight').classList.remove('active');
    }
    localStorage.setItem('novelWriter_theme', theme);
}

export function setFont(font) {
    document.body.classList.remove('font-nanum', 'font-gungseo', 'font-malgun', 'font-batang');
    document.body.classList.add('font-' + font);
    localStorage.setItem('novelWriter_font', font);
}
