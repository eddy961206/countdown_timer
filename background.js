

// 타이머, 알람 설정 처리
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
        // 타이머 설정
        const when = Date.now() + (request.seconds * 1000);
        chrome.alarms.create('timer', {
            when: when
        });
    } else if (request.type === 'CANCEL_ALARM') {
        chrome.alarms.clear('alarm');
    }
});

// 타이머, 알람 울릴 때 처리
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'timer') {
        // 타이머 종료 시 처리
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '/assets/images/icon2.png',
            title: 'Time is up!',
            message: 'Your timer has finished!'
        });
    } else if (alarm.name === 'alarm') {
        // 알람 종료 시 처리
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '/assets/images/icon2.png',
            title: 'Alarm',
            message: 'Your scheduled alarm time has been reached!'
        });
    }
});