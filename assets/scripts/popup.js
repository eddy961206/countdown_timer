
let timer;
let totalSeconds = 0;
let isPaused = false;
let alarmTime = null;
let startTime = null; // 타이머 시작 시간

$(document).ready(function () {
    loadState();

    // 매 초마다 현재 시각 업데이트
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();

    // 매 초마다 알람 체크
    // setInterval(checkAlarm, 1000);

    // 이벤트 리스너들
    $('#start').click(function () {
        if (!isPaused) {
            const hours = parseInt($('#hours').val()) || 0;
            const minutes = parseInt($('#minutes').val()) || 0;
            const seconds = parseInt($('#seconds').val()) || 0;
            totalSeconds = hours * 3600 + minutes * 60 + seconds;
            startTime = Date.now(); // 타이머 시작 시간 저장
            updateDisplay(totalSeconds);
        }
        isPaused = false;
        startTimer();
        saveState(); // 상태 저장

        // 버튼 상태 업데이트
        $(this).addClass('active');
        $('#pause').removeClass('active');
    });

    $('#pause').click(function () {
        if (timer) {
            clearInterval(timer);
            timer = null;
            isPaused = true;
            saveState(); // 상태 저장

            // 버튼 상태 업데이트
            $(this).addClass('active');
            $('#start').removeClass('active');
        }
    });

    $('#reset').click(function () {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        isPaused = false;
        totalSeconds = 0;
        startTime = null; // 시작 시간 초기화
        updateDisplay(totalSeconds);
        $('#hours').val('');
        $('#minutes').val('');
        $('#seconds').val('');
        saveState(); // 상태 저장

        // 버튼 상태 초기화
        $('.control-btn').removeClass('active');

        // 아이콘 배지 텍스트 초기화
        chrome.action.setBadgeText({ text: '' });
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
    $('.number-input').on('input', function () {
        let value = $(this).val();
        if (value.length > 2) {
            $(this).val(value.slice(0, 2));
        }
        value = parseInt(value);
        if ($(this).attr('id') === 'hours' && value > 23) {
            $(this).val('23');
        } else if (value > 59) {
            $(this).val('59');
        }
    });
});


// 시간 포맷팅 함수
function formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 현재 시각 표시
function updateCurrentTime() {
    const now = new Date();
    $('#current-time').text(`now - ${formatTime(now)}`);
}


function updateDisplay(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    $('#time-display').text(
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    );
}

function saveState() {
    chrome.storage.local.set({
        totalSeconds: totalSeconds,
        isPaused: isPaused,
        alarmTime: alarmTime,
        startTime: startTime
    });
}

function loadState() {
    chrome.storage.local.get(['totalSeconds', 'isPaused', 'alarmTime', 'startTime'], (result) => {
        totalSeconds = result.totalSeconds || 0;
        isPaused = result.isPaused || false;
        alarmTime = result.alarmTime || null;
        startTime = result.startTime || null;

        // 타이머 설정 돼있을 때
        if (startTime && !isPaused) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            totalSeconds = Math.max(0, totalSeconds - elapsed);
            if (totalSeconds > 0) {
                startTimer(); // 상태 로딩 시 타이머 재개
            } else {
                totalSeconds = 0;
            }
        }
        updateDisplay(totalSeconds);

        // 알람 설정 돼있을 때
        if (alarmTime) {
            const alarmDate = new Date(alarmTime);
            const formattedAlarmTime = formatTime(alarmDate);
            $('#alarm-time').val(formattedAlarmTime);
            $('.alarm-indicator').show();
            $('#current-alarm-time').text(`Set Alarm Time: ${formattedAlarmTime}`);
        } else {
            $('#current-alarm-time').text('');
        }
    });
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
    // 현재 알람 시각 표시
    $('#current-alarm-time').text(`Set Alarm Time: ${time}`);

    // 아이콘 배지 텍스트 ON 표시
    chrome.action.setBadgeText({ text: 'ON' });
}

// 알람 취소 함수
function cancelAlarm() {
    // background script에 메시지 전송
    chrome.runtime.sendMessage({ type: 'CANCEL_ALARM' });

    // UI 업데이트
    alarmTime = null;
    $('#alarm-time').val('');
    $('.alarm-indicator').hide();
    $('#current-alarm-time').text('');

    // 아이콘 배지 텍스트 초기화
    chrome.action.setBadgeText({ text: '' });

    // 상태 저장
    saveState();
}

// 타이머 시작 함수 수정
function startTimer() {
    if (!isPaused && totalSeconds > 0) {
        // background script에 메시지 전송
        chrome.runtime.sendMessage({
            type: 'SET_TIMER',
            seconds: totalSeconds
        });

        // 타이머 카운트다운 시작
        timer = setInterval(function () {
            if (!isPaused) {
                if (totalSeconds > 0) {
                    totalSeconds--;
                    updateDisplay(totalSeconds);
                    saveState();
                } else {
                    clearInterval(timer);
                    timer = null;
                    // 타이머 종료 시 알림 및 상태 초기화
                    showNotification('Timer', 'The timer has ended!');
                    chrome.action.setBadgeText({ text: '' });
                }
            }
        }, 1000);

        // 아이콘 배지 텍스트 ON 표시
        chrome.action.setBadgeText({ text: 'ON' });
    }
}

function playAlarmSound() {
    const audio = new Audio(chrome.runtime.getURL('/assets/sounds/alarm.mp3'));
    audio.play();
}

function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: '/assets/images/icon2.png',
        title: title,
        message: message
    });
}

function checkAlarm() {
    if (!alarmTime) return; // 알람 시간이 설정되지 않은 경우 종료

    const now = new Date();
    const currentTime = formatTime(now); // 현재 시간을 포맷팅
    const alarmDate = new Date(alarmTime);
    const formattedAlarmTime = formatTime(alarmDate);

    if (currentTime === formattedAlarmTime) { // 현재 시간이 알람 시간과 일치하는지 확인
        playAlarmSound(); // 알람 소리 재생
        showNotification('Alarm', 'Your scheduled alarm time has been reached!'); // 알람 알림 표시
        alarmTime = null; // 알람 시간 초기화
        $('#alarm-time').val(''); // 입력 필드 초기화
        $('.alarm-indicator').hide(); // 알람 인디케이터 숨기기
        chrome.action.setBadgeText({ text: '' });
        saveState();
    }
}