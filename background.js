// 알람 설정 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SET_ALARM') {
        // Chrome 알람 API를 사용하여 알람 설정
        chrome.alarms.create('timer', {
            when: request.alarmTime
        });
    } else if (request.type === 'SET_TIMER') {
        const when = Date.now() + (request.seconds * 1000);
        chrome.alarms.create('timer', {
            when: when
        });
    }
});

// 알람이 울릴 때 처리
chrome.alarms.onAlarm.addListener((alarm) => {
    // 알림 표시
    chrome.notifications.create({
        type: 'basic',
        iconUrl: '/assets/images/icon2.png',
        title: 'Time is up!',
        message: 'Your timer/alarm has finished!'
    });

    // 팝업이나 콘텐츠 스크립트에 메시지 전송
    chrome.runtime.sendMessage({ type: 'PLAY_ALARM_SOUND' });
});