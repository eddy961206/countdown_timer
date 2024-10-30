

$(document).ready(function () {
    let timer;
    let totalSeconds = 0;
    let isPaused = false;

    function updateDisplay(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        $('#time-display').text(
            `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
    }

    function startTimer() {
        if (timer) return; // Prevent multiple intervals
        timer = setInterval(function () {
            if (totalSeconds > 0) {
                totalSeconds--;
                updateDisplay(totalSeconds);
            } else {
                clearInterval(timer);
                timer = null;
                alert('Time is up!');
            }
        }, 1000);
    }

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
    });

    $('#pause').click(function () {
        if (timer) {
            clearInterval(timer);
            timer = null;
            isPaused = true;
        }
    });

    $('#reset').click(function () {
        clearInterval(timer);
        timer = null;
        isPaused = false;
        totalSeconds = 0;
        updateDisplay(totalSeconds);
        $('#hours').val(0);
        $('#minutes').val(0);
        $('#seconds').val(0);
    });
});
