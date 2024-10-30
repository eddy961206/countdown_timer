$(document).ready(function () {
    let timer;
    let totalSeconds = 0;
    let isPaused = false;
    let alarmTime = null;

    // 시간 포맷팅 함수
    function formatTime(date) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    // 현재 시각 표시 업데이트
    function updateCurrentTime() {
        const now = new Date();
        $('#current-time').text(formatTime(now));
    }

    // 매 초마다 현재 시각 업데이트
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();

    function updateDisplay(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        $('#time-display').text(
            `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
    }

    function startTimer() {
        if (timer) return;
        timer = setInterval(function () {
            if (totalSeconds > 0) {
                totalSeconds--;
                updateDisplay(totalSeconds);
            } else {
                clearInterval(timer);
                timer = null;
                playAlarmSound();
                showNotification('Timer Complete', 'Your countdown timer has finished!');
            }
        }, 1000);
    }

    function playAlarmSound() {
        const audio = new Audio(chrome.runtime.getURL('assets/sounds/alarm.mp3'));
        audio.play();
    }

    function showNotification(title, message) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'assets/icons/icon48.png',
            title: title,
            message: message
        });
    }

    function checkAlarm() {
        if (!alarmTime) return;

        const now = new Date();
        const currentTime = formatTime(now);

        if (currentTime === alarmTime) {
            playAlarmSound();
            showNotification('Alarm', 'Your scheduled alarm time has been reached!');
            alarmTime = null;
            $('#alarm-time').val('');
            $('.alarm-indicator').hide();
        }
    }

    // 매 분마다 알람 체크
    setInterval(checkAlarm, 1000);

    // 이벤트 리스너들
    $('#start').click(function () {
        if (!isPaused) {
            const hours = parseInt($('#hours').val()) || 0;
            const minutes = parseInt($('#minutes').val()) || 0;
            const seconds = parseInt($('#seconds').val()) || 0;
            totalSeconds = hours * 3600 + minutes * 60 + seconds;
            updateDisplay(totalSeconds);
        }
        isPaused = false;
        startTimer();

        // 버튼 상태 업데이트
        $(this).addClass('active');
        $('#pause').removeClass('active');
    });

    $('#pause').click(function () {
        if (timer) {
            clearInterval(timer);
            timer = null;
            isPaused = true;

            // 버튼 상태 업데이트
            $(this).addClass('active');
            $('#start').removeClass('active');
        }
    });

    $('#reset').click(function () {
        clearInterval(timer);
        timer = null;
        isPaused = false;
        totalSeconds = 0;
        updateDisplay(totalSeconds);
        $('#hours').val('');
        $('#minutes').val('');
        $('#seconds').val('');

        // 버튼 상태 초기화
        $('.control-btn').removeClass('active');
    });

    // 알람 시각 설정
    $('#alarm-time').on('change', function () {
        const selectedTime = $(this).val();
        if (selectedTime) {
            alarmTime = selectedTime;
            $('.alarm-indicator').show();
            showNotification('Alarm Set', `Alarm has been set for ${selectedTime}`);
        } else {
            alarmTime = null;
            $('.alarm-indicator').hide();
        }
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