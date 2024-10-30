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
        $('#current-time').text(`now - ${formatTime(now)}`);
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

    // 알람 설정 함수 수정
    function setAlarm(time) {
        const [hours, minutes] = time.split(':');
        const alarmTime = new Date();
        alarmTime.setHours(hours);
        alarmTime.setMinutes(minutes);
        alarmTime.setSeconds(0);

        // 만약 설정한 시간이 현재 시간보다 이전이면 다음 날로 설정
        if (alarmTime < new Date()) {
            alarmTime.setDate(alarmTime.getDate() + 1);
        }

        // background script에 메시지 전송
        chrome.runtime.sendMessage({
            type: 'SET_ALARM',
            alarmTime: alarmTime.getTime()
        });

        // UI 업데이트
        $('.alarm-indicator').show();
    }

    // 타이머 시작 함수 수정
    function startTimer() {
        if (!isPaused && totalSeconds > 0) {
            // background script에 메시지 전송
            chrome.runtime.sendMessage({
                type: 'SET_TIMER',
                seconds: totalSeconds
            });
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

        if (currentTime === alarmTime) { // 현재 시간이 알람 시간과 일치하는지 확인
            playAlarmSound(); // 알람 소리 재생
            showNotification('Alarm', 'Your scheduled alarm time has been reached!'); // 알람 알림 표시
            alarmTime = null; // 알람 시간 초기화
            $('#alarm-time').val(''); // 입력 필드 초기화
            $('.alarm-indicator').hide(); // 알람 인디케이터 숨기기
        }
    }

    // 매 분마다 알람 체크
    setInterval(checkAlarm, 1000); // 1초마다 checkAlarm 함수 호출

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
            setAlarm(selectedTime);
        } else {
            // 알람 취소 처리
            chrome.runtime.sendMessage({ type: 'CANCEL_ALARM' });
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