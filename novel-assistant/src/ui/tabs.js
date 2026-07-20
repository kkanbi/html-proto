// tabs.js - 탭 전환 공통 로직

/**
 * 탭 시스템 초기화 (공통 로직 추상화)
 * @param {string} tabSelector - 탭 버튼 셀렉터
 * @param {string} contentSelector - 컨텐츠 셀렉터
 * @param {string} activeClass - 활성화 클래스명
 */
export function setupTabs(tabSelector, contentSelector, activeClass = 'active') {
    const tabs = document.querySelectorAll(tabSelector);
    const contents = document.querySelectorAll(contentSelector);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 모든 탭 비활성화
            tabs.forEach(t => t.classList.remove(activeClass));
            contents.forEach(c => c.classList.remove(activeClass));

            // 클릭한 탭 활성화
            tab.classList.add(activeClass);

            // 해당 컨텐츠 활성화
            const targetId = tab.dataset.mainTab || tab.dataset.subTab || tab.dataset.coreTab || tab.dataset.charTab;
            const targetContent = document.querySelector(`[data-main-content="${targetId}"], [data-sub-content="${targetId}"], [data-core-content="${targetId}"], [data-char-content="${targetId}"]`);

            if (targetContent) {
                targetContent.classList.add(activeClass);
            }
        });
    });
}

/**
 * 모든 탭 시스템 초기화
 */
export function initAllTabs() {
    // 메인 탭 (설정/작품배경/퇴고)
    setupTabs('.main-tab', '.main-tab-content');

    // 서브 탭 (코어/캐릭터/세계관/트리트먼트)
    setupTabs('.sub-tab', '.sub-tab-content');

    // 코어 탭 (작품개요/주제/전권줄거리/권별줄거리)
    setupTabs('.core-tab', '.core-tab-content');

    // 캐릭터 모달 탭
    setupTabs('.character-modal-tab', '.character-tab-content');
}
