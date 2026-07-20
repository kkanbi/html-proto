// pomodoro.js - 포모도로 타이머 (25분 작성 / 5분 휴식)
let pomodoroInterval = null;
let remainingSeconds = 25 * 60; // 25분
let isWorkSession = true;
let isPaused = true;
let timerElement = null;

export function initPomodoro() {
    // 집중 모드에서만 타이머 표시
    createTimerUI();
}

function createTimerUI() {
    timerElement = document.createElement('div');
    timerElement.className = 'pomodoro-timer';
    timerElement.innerHTML = `
        <div class="pomodoro-display" id="pomodoroDisplay">25:00</div>
        <div class="pomodoro-controls">
            <button class="pomodoro-btn" id="pomodoroStart">▶</button>
            <button class="pomodoro-btn" id="pomodoroReset">↻</button>
        </div>
        <div class="pomodoro-label">${isWorkSession ? '작성 시간' : '휴식 시간'}</div>
    `;
    timerElement.style.display = 'none'; // 기본은 숨김
    document.body.appendChild(timerElement);

    document.getElementById('pomodoroStart').addEventListener('click', toggleTimer);
    document.getElementById('pomodoroReset').addEventListener('click', resetTimer);
}

export function showPomodoro() {
    if (timerElement) {
        timerElement.style.display = 'block';
    }
}

export function hidePomodoro() {
    if (timerElement) {
        timerElement.style.display = 'none';
    }
    if (pomodoroInterval) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
    }
}

function toggleTimer() {
    isPaused = !isPaused;
    const btn = document.getElementById('pomodoroStart');

    if (isPaused) {
        btn.textContent = '▶';
        if (pomodoroInterval) {
            clearInterval(pomodoroInterval);
            pomodoroInterval = null;
        }
    } else {
        btn.textContent = '⏸';
        startTimer();
    }
}

function startTimer() {
    if (pomodoroInterval) return;

    pomodoroInterval = setInterval(() => {
        remainingSeconds--;

        if (remainingSeconds <= 0) {
            // 세션 전환
            isWorkSession = !isWorkSession;
            remainingSeconds = isWorkSession ? 25 * 60 : 5 * 60;

            // 알림
            const message = isWorkSession ? '휴식 완료! 다시 작성 시작!' : '25분 완료! 5분 휴식하세요!';
            showNotification(message);

            // 레이블 업데이트
            const label = timerElement.querySelector('.pomodoro-label');
            label.textContent = isWorkSession ? '작성 시간' : '휴식 시간';

            // 자동 정지
            toggleTimer();
        }

        updateDisplay();
    }, 1000);
}

function resetTimer() {
    isPaused = true;
    isWorkSession = true;
    remainingSeconds = 25 * 60;

    if (pomodoroInterval) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
    }

    document.getElementById('pomodoroStart').textContent = '▶';
    timerElement.querySelector('.pomodoro-label').textContent = '작성 시간';
    updateDisplay();
}

function updateDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('pomodoroDisplay').textContent = display;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'pomodoro-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    // 소리 (선택적)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98N6XT');
        audio.volume = 0.3;
        audio.play();
    } catch (e) {}

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
