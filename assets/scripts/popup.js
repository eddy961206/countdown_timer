
let totalSeconds = 0;
let isPaused = false;
let alarmTime = null;
let targetTime = null; // 타이머 종료 시간

$(document).ready(function () {
    loadState();

    // 매 초마다 현재 시각 업데이트
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();

    // 매 초마다 남은 시간 업데이트
    setInterval(updateRemainingTime, 1000);

    // 이벤트 리스너들
    $('#start').click(function () {
        const hours = parseInt($('#hours').val()) || 0;
        const minutes = parseInt($('#minutes').val()) || 0;
        const seconds = parseInt($('#seconds').val()) || 0;
        totalSeconds = hours * 3600 + minutes * 60 + seconds;

        if (totalSeconds <= 0) {
            alert('Please enter a valid time.'); // 유효하지 않은 시간 입력 시 알림
            return;
        }

        isPaused = false;
        startTimer();
        saveState(); // 상태 저장

        // 버튼 상태 업데이트
        $(this).addClass('active');
        $('#pause').removeClass('active');
    });

    $('#pause').click(function () {
        if (!isPaused) {
            pauseTimer();
            saveState(); // 상태 저장

            // 버튼 상태 업데이트
            $(this).addClass('active');
            $('#start').removeClass('active');
        }
    });

    $('#reset').click(function () {
        resetTimer();
    });

    // 알람 시각 설정 버튼
    $('#set-alarm').click(function () {
        const selectedTime = $('#alarm-time').val();
        if (selectedTime) {
            setAlarm(selectedTime);
            saveState(); // 상태 저장
        }
    });

    // 알람 취소 버튼
    $('#cancel-alarm').click(function () {
        cancelAlarm();
    });

    // 숫자 입력 필드 제한
    $('.number-input').on('wheel', function (e) {
        e.preventDefault(); // 기본 스크롤 동작 방지
        let currentValue = parseInt($(this).val()) || 0;
        const id = $(this).attr('id');
        const min = parseInt($(this).attr('min')) || 0;
        const max = parseInt($(this).attr('max')) || 99;

        if (e.originalEvent.deltaY < 0) {
            // 휠을 위로 스크롤 시 값 증가
            currentValue = Math.min(currentValue + 1, max);
        } else {
            // 휠을 아래로 스크롤 시 값 감소
            currentValue = Math.max(currentValue - 1, min);
        }

        $(this).val(String(currentValue).padStart(2, '0'));
        $(this).trigger('input'); // 입력 이벤트 트리거
    });
});

// 현재 시각 표시
function updateCurrentTime() {
    const now = new Date();
    $('#current-time').text(`${formatTime(now)}`);
}

// 남은 시간 업데이트
function updateRemainingTime() {
    if (targetTime && !isPaused) {
        const now = Date.now();
        const remainingSeconds = Math.max(0, Math.floor((targetTime - now) / 1000));
        if (remainingSeconds <= 0) {
            // 타이머 종료 시 처리
            resetTimer();
            showNotification('Timer', 'The timer has ended!');
            playAlarmSound();
        }
        updateDisplay(remainingSeconds);
    }
}

// 시간 포맷팅 함수
function formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 타이머 화면 표시 업데이트
function updateDisplay(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    $('#time-display').text(
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    );
}

// 상태 저장
function saveState() {
    chrome.storage.local.set({
        totalSeconds: totalSeconds,
        isPaused: isPaused,
        alarmTime: alarmTime,
        targetTime: targetTime
    });


    
}

// 상태 로드
function loadState() {
    chrome.storage.local.get(['totalSeconds', 'isPaused', 'alarmTime', 'targetTime'], (result) => {
        totalSeconds = result.totalSeconds || 0;
        isPaused = result.isPaused || false;
        alarmTime = result.alarmTime || null;
        targetTime = result.targetTime || null;

        // 타이머 설정되어 있을 때
        if (targetTime && !isPaused) {
            updateRemainingTime();
        } else {
            updateDisplay(totalSeconds);
        }

        // 알람 설정되어 있을 때
        if (alarmTime) {
            const alarmDate = new Date(alarmTime);
            const formattedAlarmTime = formatTime(alarmDate);
            $('#alarm-time').val(formattedAlarmTime);
            $('.alarm-indicator').show();
        }
    });
}

// 타이머 시작
function startTimer() {
    targetTime = Date.now() + totalSeconds * 1000;

    // background script에 메시지 전송하여 타이머 설정
    chrome.runtime.sendMessage({
        type: 'SET_TIMER',
        targetTime: targetTime
    });

    // 아이콘 배지 텍스트 ON 표시
    chrome.action.setBadgeText({ text: 'ON' });
}

// 타이머 일시정지
function pauseTimer() {
    isPaused = true;

    // 남은 시간 계산하여 totalSeconds 업데이트
    const now = Date.now();
    totalSeconds = Math.max(0, Math.floor((targetTime - now) / 1000));

    // 타이머 알람 취소
    chrome.runtime.sendMessage({
        type: 'CANCEL_TIMER'
    });

    targetTime = null;

    // 아이콘 배지 텍스트 OFF 표시
    chrome.action.setBadgeText({ text: '' });
}

// 타이머 리셋
function resetTimer() {
    isPaused = false;
    totalSeconds = 0;
    targetTime = null;
    updateDisplay(totalSeconds);
    $('#hours').val('');
    $('#minutes').val('');
    $('#seconds').val('');
    chrome.runtime.sendMessage({
        type: 'CANCEL_TIMER'
    });
    saveState(); // 상태 저장

    // 버튼 상태 초기화
    $('.control-btn').removeClass('active');

    // 아이콘 배지 텍스트 초기화
    chrome.action.setBadgeText({ text: '' });
}

// 알람 설정
function setAlarm(time) {
    const [hours, minutes] = time.split(':');
    const alarmDate = new Date();
    alarmDate.setHours(hours);
    alarmDate.setMinutes(minutes);
    alarmDate.setSeconds(0);
    alarmDate.setMilliseconds(0);

    // 만약 설정한 시간이 현재 시간보다 이전이면 다음 날로 설정
    if (alarmDate <= new Date()) {
        alarmDate.setDate(alarmDate.getDate() + 1);
    }

    // background script에 메시지 전송
    chrome.runtime.sendMessage({
        type: 'SET_ALARM',
        alarmTime: alarmDate.getTime()
    });

    // UI 업데이트
    alarmTime = alarmDate.getTime();
    $('.alarm-indicator').show();
    $('#alarm-time').val(time);

    // 아이콘 배지 텍스트 ON 표시
    chrome.action.setBadgeText({ text: 'ON' });
}

// 알람 취소
function cancelAlarm() {
    // background script에 메시지 전송
    chrome.runtime.sendMessage({ type: 'CANCEL_ALARM' });

    // UI 업데이트
    alarmTime = null;
    $('#alarm-time').val('');
    $('.alarm-indicator').hide();

    // 아이콘 배지 텍스트 초기화
    chrome.action.setBadgeText({ text: '' });

    // 상태 저장
    saveState();
}

// 알림 표시
function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: '/assets/images/icon2.png',
        title: title,
        message: message
    });
}

// 알람 소리 재생 (팝업이 열려 있을 때만 가능)
function playAlarmSound() {
    const audio = new Audio(chrome.runtime.getURL('/assets/sounds/alarm.mp3'));
    audio.play();
}
