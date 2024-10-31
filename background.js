

// 타이머 및 알람 설정 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SET_ALARM') {
        // 기존 알람이 있으면 취소
        chrome.alarms.clear('alarm', () => {
            // 새로운 알람 설정
            chrome.alarms.create('alarm', {
                when: request.alarmTime
            });
        });
    } else if (request.type === 'SET_TIMER') {
        // 기존 타이머가 있으면 취소
        chrome.alarms.clear('timer', () => {
            // 새로운 타이머 설정
            chrome.alarms.create('timer', {
                when: request.targetTime
            });
        });
    } else if (request.type === 'CANCEL_ALARM') {
        chrome.alarms.clear('alarm');
    } else if (request.type === 'CANCEL_TIMER') {
        chrome.alarms.clear('timer');
    }
});

// 알람 및 타이머가 울릴 때 처리
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'timer') {
        // 타이머 종료 시 알림 표시
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '/assets/images/icon2.png',
            title: 'Timer',
            message: 'The timer has ended!'
        });

        // 아이콘 배지 텍스트 초기화
        chrome.action.setBadgeText({ text: '' });

        // 상태 초기화
        chrome.storage.local.set({
            totalSeconds: 0,
            isPaused: false,
            targetTime: null
        });
    } else if (alarm.name === 'alarm') {
        // 알람 시각 도달 시 알림 표시
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '/assets/images/icon2.png',
            title: 'Alarm',
            message: 'Your scheduled alarm time has been reached!'
        });

        // 아이콘 배지 텍스트 초기화
        chrome.action.setBadgeText({ text: '' });

        // 알람 시간 초기화
        chrome.storage.local.set({
            alarmTime: null
        });
    }
});