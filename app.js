// Constants for SVG Gauge math
const GAUGE_CIRCUMFERENCE = 188.5; // 270 degree arc of radius 40

// DOM Elements
const speedGauge = document.getElementById('speedGauge');
const speedValue = document.getElementById('speedValue');
const digitalSpeedValue = document.getElementById('digitalSpeedValue');
const speedNeedle = document.getElementById('speedNeedle');
const rpmGauge = document.getElementById('rpmGauge');
const rpmValue = document.getElementById('rpmValue');
const digitalRpmValue = document.getElementById('digitalRpmValue');
const rpmNeedle = document.getElementById('rpmNeedle');
const tempFill = document.getElementById('tempFill');
const tempValue = document.getElementById('tempValue');
const fuelFill = document.getElementById('fuelFill');
const fuelValue = document.getElementById('fuelValue');
const gearValue = document.getElementById('gearValue');
const batteryFill = document.getElementById('batteryFill');
const batteryValue = document.getElementById('batteryValue');
const throttleFill = document.getElementById('throttleFill');
const throttleValue = document.getElementById('throttleValue');
const loadFill = document.getElementById('loadFill');
const loadValue = document.getElementById('loadValue');
const intakeFill = document.getElementById('intakeFill');
const intakeValue = document.getElementById('intakeValue');
const logBody = document.getElementById('logBody');
const btnDashboard = document.getElementById('btnDashboard');
const btnLogs = document.getElementById('btnLogs');
const dashboardView = document.getElementById('dashboardView');
const logView = document.getElementById('logView');
const btnToggleSim = document.getElementById('btnToggleSim');
const connectionDot = document.getElementById('connectionDot');
const connectionStatus = document.getElementById('connectionStatus');
const tempStatusBox = document.getElementById('tempStatusBox');
const tempStatusText = document.getElementById('tempStatusText');

// Login Elements
const loginOverlay = document.getElementById('loginOverlay');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const btnLogin = document.getElementById('btnLogin');
const loginError = document.getElementById('loginError');

// Check Session on Load
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        if (loginOverlay) loginOverlay.classList.add('hidden');
    }

  btnToggleSim.innerText = 'Start Monitoring';
    btnToggleSim.classList.add('stopped');

    if (connectionDot)
        connectionDot.className = 'status-dot disconnected';

    if (connectionStatus)
        connectionStatus.innerText = 'Monitoring Stopped';

    resetDashboard();
}

});

// Login Logic
function handleLogin() {s
    const user = loginUser.value;
    const pass = loginPass.value;

    // CREDENTIALS: admin / 911208
    if (user === 'admin' && pass === '911208') {
        sessionStorage.setItem('isLoggedIn', 'true');
        loginOverlay.classList.add('hidden');
        loginError.style.display = 'none';
    } else {
        loginError.style.display = 'block';
        // Shake animation
        const loginBox = document.querySelector('.login-box');
        loginBox.style.animation = 'none';
        loginBox.offsetHeight; // trigger reflow
        loginBox.style.animation = 'shake 0.4s';
    }
}

if (btnLogin) {
    btnLogin.addEventListener('click', handleLogin);
}

// Allow login with Enter key
[loginUser, loginPass].forEach(input => {
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }
});

// History Elements
const btnHistory = document.getElementById('btnHistory');
const historyView = document.getElementById('historyView');
const historyBody = document.getElementById('historyBody');
const overallAvgSpeedEl = document.getElementById('overallAvgSpeed');
const overallAvgRpmEl = document.getElementById('overallAvgRpm');

// History Tracking Variables
let historyData = [];
let currentIntervalSpeeds = [];
let currentIntervalRpms = [];
let totalSamplesSpeed = 0;
let totalSamplesRpm = 0;
let sumSpeed = 0;
let sumRpm = 0;

// Function to draw analog ticks
function drawAnalogTicks(svgElementId, maxVal, step, isRPM) {
    const svg = document.getElementById(svgElementId);
    if (!svg) return;
    
    const ticksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    for (let val = 0; val <= maxVal; val += step) {
        const percentage = val / maxVal;
        const angleDeg = -135 + (percentage * 270);
        // Convert to radians for math (0 is up, so angle from top)
        const angleRad = (angleDeg - 90) * (Math.PI / 180);
        
        // Tick marks
        const innerR = 32;
        const outerR = 36;
        const x1 = 50 + innerR * Math.cos(angleRad);
        const y1 = 50 + innerR * Math.sin(angleRad);
        const x2 = 50 + outerR * Math.cos(angleRad);
        const y2 = 50 + outerR * Math.sin(angleRad);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', 'rgba(255, 255, 255, 0.7)');
        line.setAttribute('stroke-width', '1.5');
        ticksGroup.appendChild(line);
        
        // Text numbers
        let displayVal = isRPM ? (val / 1000).toString() : val.toString();
        const textR = 28; // Closer to edge
        const tx = 50 + textR * Math.cos(angleRad);
        const ty = 50 + textR * Math.sin(angleRad);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', tx);
        text.setAttribute('y', ty);
        text.setAttribute('fill', 'rgba(255, 255, 255, 0.8)');
        text.setAttribute('font-size', '4');
        text.setAttribute('font-family', 'Orbitron, sans-serif');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.textContent = displayVal;
        
        ticksGroup.appendChild(text);
    }
    
    svg.insertBefore(ticksGroup, svg.querySelector('.gauge-needle'));
}

// Draw ticks on load
drawAnalogTicks('speedSvg', 220, 20, false);
drawAnalogTicks('rpmSvg', 8000, 1000, true);

// Update Gauge Function
function updateGauge(element, value, max, needleElement) {
    // Clamp value between 0 and max
    value = Math.max(0, Math.min(value, max));
    // Calculate percentage (0 to 1)
    const percentage = value / max;
    // Calculate stroke-dashoffset (188.5 is empty, 0 is full)
    if (element) {
        const offset = GAUGE_CIRCUMFERENCE - (percentage * GAUGE_CIRCUMFERENCE);
        element.style.strokeDashoffset = offset;
    }
    
    // Update needle rotation
    if (needleElement) {
        const angle = -135 + (percentage * 270);
        needleElement.style.transform = `rotate(${angle}deg)`;
    }
}

// Update UI Function
function updateDashboard(data) {
    // Update Speed (Max 220 km/h)
    if (data.speed !== undefined) {
        if (speedValue) speedValue.innerText = Math.round(data.speed);
        if (digitalSpeedValue) digitalSpeedValue.innerText = Math.round(data.speed);
        updateGauge(speedGauge, data.speed, 220, speedNeedle);
        
        // Track Speed for history
        if (isMonitoring) {
            currentIntervalSpeeds.push(data.speed);
            sumSpeed += data.speed;
            totalSamplesSpeed++;
        }
    }

    // Update RPM (Max 8000 RPM)
    if (data.rpm !== undefined) {
        const rpmDisplay = (data.rpm / 1000).toFixed(1);
        if (rpmValue) rpmValue.innerText = rpmDisplay;
        if (digitalRpmValue) digitalRpmValue.innerText = rpmDisplay;
        updateGauge(rpmGauge, data.rpm, 8000, rpmNeedle);
        
        // Track RPM for history
        if (isMonitoring) {
            currentIntervalRpms.push(data.rpm);
            sumRpm += data.rpm;
            totalSamplesRpm++;
        }
        
        // Update gear if present
        if (data.gear !== undefined && gearValue) {
            gearValue.innerText = data.gear;
        }
    }

    // Update Temp
    if (data.temp !== undefined) {
        tempValue.innerText = `${Math.round(data.temp)}°C`;
        // Assuming normal temp is 90, max is 130
        const tempPercent = Math.min(100, (data.temp / 130) * 100);
        tempFill.style.width = `${tempPercent}%`;
        
        // Temperature Status Box Logic
        if (tempStatusBox && tempStatusText) {
            tempStatusBox.className = 'temp-status-box'; // reset
            
            if (data.temp < 80) {
                tempStatusBox.classList.add('state-blue');
                tempStatusText.innerHTML = 'ENGINE<br>COLD';
                tempFill.className = 'progress-fill neon-blue';
            } else if (data.temp <= 105) {
                tempStatusBox.classList.add('state-yellow');
                tempStatusText.innerHTML = 'TEMP<br>OPTIMAL';
                tempFill.className = 'progress-fill neon-orange';
            } else {
                tempStatusBox.classList.add('state-red');
                tempStatusText.innerHTML = 'ENGINE<br>OVERHEAT!';
                tempFill.className = 'progress-fill neon-red';
            }
        }
    }

    // Update Fuel
    if (data.fuel !== undefined) {
        fuelValue.innerText = `${Math.round(data.fuel)}%`;
        fuelFill.style.width = `${data.fuel}%`;
        
        if (data.fuel < 15) {
            fuelFill.className = 'progress-fill neon-red';
        } else {
            fuelFill.className = 'progress-fill neon-green';
        }
    }

    // Update Gear
    if (data.gear !== undefined && gearValue) {
        gearValue.innerText = data.gear;
    }

    // Update Battery
    if (data.battery !== undefined) {
        batteryValue.innerText = `${data.battery.toFixed(1)}V`;
        const batPercent = Math.min(100, Math.max(0, (data.battery - 10) / 5 * 100)); // 10V to 15V
        batteryFill.style.width = `${batPercent}%`;
        if (data.battery < 11.5) batteryFill.className = 'progress-fill neon-red';
        else batteryFill.className = 'progress-fill neon-blue';
    }

    // Update Throttle
    if (data.throttle !== undefined) {
        throttleValue.innerText = `${Math.round(data.throttle)}%`;
        throttleFill.style.width = `${data.throttle}%`;
    }

    // Update Engine Load
    if (data.load !== undefined) {
        loadValue.innerText = `${Math.round(data.load)}%`;
        loadFill.style.width = `${data.load}%`;
    }

    // Update Intake Temp
    if (data.intake !== undefined) {
        intakeValue.innerText = `${Math.round(data.intake)}°C`;
        const intakePercent = Math.min(100, (data.intake / 100) * 100);
        intakeFill.style.width = `${intakePercent}%`;
    }
}

// Function to reset dashboard to zero/off state
function resetDashboard() {
    updateDashboard({
        speed: 0,
        rpm: 0,
        temp: 0,
        fuel: 0,
        gear: '-',
        battery: 0,
        throttle: 0,
        load: 0,
        intake: 0
    });
    
    // Clear logs if needed or just leave them
}


// Function to add log entry
function addCanLog(id, dlc, dataHex) {
    const row = document.createElement('tr');
    row.className = 'log-new';
    
    const time = new Date().toISOString().split('T')[1].slice(0, -1); // Get HH:MM:SS.mmm
    
    row.innerHTML = `
        <td>${time}</td>
        <td>0x${id.toString(16).toUpperCase().padStart(3, '0')}</td>
        <td>${dlc}</td>
        <td>${dataHex}</td>
    `;
    
    logBody.insertBefore(row, logBody.firstChild);
    
    // Keep only last 50 logs to prevent memory issues
    if (logBody.children.length > 50) {
        logBody.removeChild(logBody.lastChild);
    }
}

// -------------------------------------------------------------
// SIMULATION MODE
// -------------------------------------------------------------
let simSpeed = 0;
let simRpm = 800;
let simTemp = 85;
let simFuel = 75;
let simBattery = 13.8;
let simThrottle = 0;
let simLoad = 20;
let simIntake = 35;
let simGear = 'P';

let simulationInterval = null;
let isMonitoring = false;

function simulateCanData() {
    if (!isMonitoring) return;

    // Randomize slightly to make it look alive
    const accel = (Math.random() - 0.4) * 2;
    simSpeed += accel;
    if (simSpeed < 0) simSpeed = 0;
    if (simSpeed > 220) simSpeed = 220;

    simThrottle = accel > 0 ? accel * 50 : 0; // Throttle increases when accelerating
    if (simThrottle > 100) simThrottle = 100;
    if (simSpeed === 0 && accel <= 0) simThrottle = 0;

    simLoad = 20 + simThrottle * 0.8 + (Math.random() * 5);
    
    // RPM correlates with speed roughly, with gear shifts
    const gearRatio = Math.max(1, Math.ceil(simSpeed / 40));
    simRpm = 800 + (simSpeed / gearRatio) * 50 + (Math.random() * 200 - 100);
    if (simSpeed === 0) {
        simTemp = 100 + Math.random() * 15;
        simRpm = 800 + (Math.random() * 50); // Idling
    }

    if (simSpeed === 0) simGear = 'N';
    else if (gearRatio === 1) simGear = '1';
    else simGear = gearRatio.toString();

    simTemp += (Math.random() - 0.45) * 0.1;
    if (simTemp < 80) simTemp = 80;
    
    simIntake = 30 + (simSpeed * 0.1) + (Math.random() * 2);

    simBattery = 13.5 + (simRpm / 8000) * 1.0 + (Math.random() * 0.1);
    
    simFuel -= 0.001; // slowly draining
    
    // Update Dashboard
    updateDashboard({
        speed: simSpeed,
        rpm: simRpm,
        temp: simTemp,
        fuel: simFuel,
        gear: simGear,
        battery: simBattery,
        throttle: simThrottle,
        load: simLoad,
        intake: simIntake
    });

    // Generate random CAN logs
    const ids = [0x120, 0x1A6, 0x240, 0x3E8];
    const randId = ids[Math.floor(Math.random() * ids.length)];
    const randData = Array.from({length: 8}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(' ').toUpperCase();
    addCanLog(randId, 8, randData);
}

// Function to start/stop monitoring
function toggleMonitoring() {
    isMonitoring = !isMonitoring;
    
    const dashboardGrid = document.getElementById('dashboardView');
    const timestamp = new Date().toLocaleTimeString();
    
    if (isMonitoring) {

readFirebaseData();

        btnToggleSim.innerText = 'Stop Monitoring';
        btnToggleSim.classList.remove('stopped');
        if (dashboardGrid) dashboardGrid.classList.remove('dashboard-off');
        
        if (connectionDot) connectionDot.className = 'status-dot simulated';
        if (connectionStatus) connectionStatus.innerText = 'Simulated Data';

        logEventToHistory(timestamp, 'Monitoring Started', 'status-start');
    } else {
        btnToggleSim.innerText = 'Start Monitoring';
        btnToggleSim.classList.add('stopped');
        if (dashboardGrid) dashboardGrid.classList.add('dashboard-off');
        
        resetDashboard();
        
        if (connectionDot) connectionDot.className = 'status-dot disconnected';
        if (connectionStatus) connectionStatus.innerText = 'Monitoring Stopped';

        logEventToHistory(timestamp, 'Monitoring Stopped', 'status-stop');
    }
}

function logEventToHistory(time, message, className) {
    const row = document.createElement('tr');
    row.className = className;
    row.innerHTML = `
        <td>${time}</td>
        <td colspan="3" style="text-align: center; font-weight: 600; letter-spacing: 1px;">${message}</td>
    `;
    if (historyBody) {
        historyBody.insertBefore(row, historyBody.firstChild);
        // Limit to 50 rows
        if (historyBody.children.length > 50) {
            historyBody.removeChild(historyBody.lastChild);
        }
    }
}

window.toggleMonitoring = toggleMonitoring;

// Start simulation loop (every 100ms)
//simulationInterval = setInterval(simulateCanData, 100);

// Firebase Realtime Data
async function readFirebaseData() {

if (!isMonitoring) return;

    try {

        const response = await fetch(
            'https://cardashboardmonitor-default-rtdb.asia-southeast1.firebasedatabase.app/car.json'
        );

        const data = await response.json();

        if (!data) return;

        updateDashboard(data);

// Tambahkan CAN Log dari Firebase
if (data.canlog) {

if (window.lastCanLog !== data.canlog) {

    window.lastCanLog = data.canlog;

    addCanLog(
        0x7E8,
        8,
        data.canlog
    );
}

}

        document.getElementById('connectionDot').className =
            'status-dot connected';

        document.getElementById('connectionStatus').innerText =
            'Firebase Connected';

    } catch (err) {

        document.getElementById('connectionDot').className =
            'status-dot disconnected';

        document.getElementById('connectionStatus').innerText =
            'Firebase Error';

        console.error(err);
    }
}

// Ambil data setiap 1 detik
setInterval(readFirebaseData, 100);

// Jangan langsung membaca Firebase saat halaman dibuka
if (isMonitoring) {
    readFirebaseData();
}

/*
// -------------------------------------------------------------
// REAL WEBSOCKET CONNECTION (Template for future use)
// -------------------------------------------------------------
const ws = new WebSocket('ws://[ESP32_IP]/ws');

ws.onopen = () => {
    document.getElementById('connectionDot').className = 'status-dot connected';
    document.getElementById('connectionStatus').innerText = 'Connected';
};

ws.onclose = () => {
    document.getElementById('connectionDot').className = 'status-dot disconnected';
    document.getElementById('connectionStatus').innerText = 'Disconnected';
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        // Assuming ESP32 sends: {"speed": 60, "rpm": 3000, "temp": 90, "fuel": 50, "can_id": 288, "can_data": "AA BB CC"}
        updateDashboard(data);
        
        if (data.can_id) {
            addCanLog(data.can_id, 8, data.can_data);
        }
    } catch (e) {
        console.error("Error parsing CAN data", e);
    }
};
*/

// -------------------------------------------------------------
// TAB SWITCHING LOGIC
// -------------------------------------------------------------

if (btnDashboard && btnLogs) {
    btnDashboard.addEventListener('click', () => {
        btnDashboard.classList.add('active');
        btnLogs.classList.remove('active');
        btnHistory.classList.remove('active');
        dashboardView.style.display = 'grid';
        logView.style.display = 'none';
        historyView.style.display = 'none';
    });

    btnLogs.addEventListener('click', () => {
        btnLogs.classList.add('active');
        btnDashboard.classList.remove('active');
        btnHistory.classList.remove('active');
        dashboardView.style.display = 'none';
        logView.style.display = 'block';
        historyView.style.display = 'none';
    });

    btnHistory.addEventListener('click', () => {
        btnHistory.classList.add('active');
        btnDashboard.classList.remove('active');
        btnLogs.classList.remove('active');
        dashboardView.style.display = 'none';
        logView.style.display = 'none';
        historyView.style.display = 'block';
    });
}

// -------------------------------------------------------------
// HISTORY LOGGING (EVERY 10 SECONDS)
// -------------------------------------------------------------
setInterval(() => {
    if (!isMonitoring) return;

    const avgSpeed = currentIntervalSpeeds.length > 0 
        ? currentIntervalSpeeds.reduce((a, b) => a + b, 0) / currentIntervalSpeeds.length 
        : 0;
    
    const avgRpm = currentIntervalRpms.length > 0 
        ? currentIntervalRpms.reduce((a, b) => a + b, 0) / currentIntervalRpms.length 
        : 0;

    let condition = "OPTIMAL";
    let conditionClass = "state-yellow";
    if (simTemp < 80) {
        condition = "COLD";
        conditionClass = "state-blue";
    } else if (simTemp > 105) {
        condition = "OVERHEAT";
        conditionClass = "state-red";
    }

    const logEntry = {
        timestamp: new Date().toLocaleTimeString(),
        speed: avgSpeed.toFixed(1),
        rpm: (avgRpm / 1000).toFixed(2),
        condition: condition,
        conditionClass: conditionClass
    };

    // Add to history table
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${logEntry.timestamp}</td>
        <td>${logEntry.speed}</td>
        <td>${logEntry.rpm}</td>
        <td class="${logEntry.conditionClass}" style="font-weight: 800; text-shadow: none;">${logEntry.condition}</td>
    `;
    
    if (historyBody) {
        historyBody.insertBefore(row, historyBody.firstChild);
        // Limit to 50 rows
        if (historyBody.children.length > 50) {
            historyBody.removeChild(historyBody.lastChild);
        }
    }

    // Update overall averages
    if (overallAvgSpeedEl) {
        const overallAvg = sumSpeed / totalSamplesSpeed;
        overallAvgSpeedEl.innerText = `${overallAvg.toFixed(1)} km/h`;
    }
    
    if (overallAvgRpmEl) {
        const overallAvg = (sumRpm / totalSamplesRpm) / 1000;
        overallAvgRpmEl.innerText = overallAvg.toFixed(2);
    }

    // Reset interval arrays
    currentIntervalSpeeds = [];
    currentIntervalRpms = [];
}, 10000);
