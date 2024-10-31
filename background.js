// 알람 설정 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SET_ALARM') {
        // 알람 설정
        chrome.alarms.create('alarm', {
            when: request.alarmTime
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

// 알람이 울릴 때 처리
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'timer') {
        // 타이머 종료 시 처리
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '/assets/images/icon2.png',
            title: 'Time is up!',
            message: 'Your timer has finished!'
        });

        // 팝업이나 콘텐츠 스크립트에 메시지 전송
        chrome.runtime.sendMessage({ type: 'PLAY_ALARM_SOUND' });
    } else if (alarm.name === 'alarm') {
        // 알람 종료 시 처리
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '/assets/images/icon2.png',
            title: 'Alarm',
            message: 'Your scheduled alarm time has been reached!'
        });

        // 팝업이나 콘텐츠 스크립트에 메시지 전송
        chrome.runtime.sendMessage({ type: 'PLAY_ALARM_SOUND' });
    }
});