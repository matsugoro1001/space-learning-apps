export function initMoonPhases() {
  const timeSlider = document.getElementById('time-slider');
  const dayDisplay = document.getElementById('day-display');
  const phaseNameEl = document.getElementById('moon-phase-name');
  
  const orbitCanvas = document.getElementById('moon-orbit-canvas');
  const viewCanvas = document.getElementById('moon-view-canvas');
  
  if (!orbitCanvas || !viewCanvas) return;
  
  const ctxOrbit = orbitCanvas.getContext('2d');
  const ctxView = viewCanvas.getContext('2d');
  
  // Settings
  const orbitRadius = 130;
  const earthRadius = 25;
  const moonRadius = 12;
  const cycleDays = 29.53;
  
  function getPhaseName(day) {
    if (day < 1 || day > 28.5) return '新月（しんげつ）';
    if (day >= 1 && day < 6.5) return '三日月（みかづき）';
    if (day >= 6.5 && day < 8.5) return '上弦の月（じょうげんのつき）';
    if (day >= 8.5 && day < 14) return '十三夜（じゅうさんや）など';
    if (day >= 14 && day < 16) return '満月（まんげつ）';
    if (day >= 16 && day < 21) return '立待月・居待月など';
    if (day >= 21 && day < 23) return '下弦の月（かげんのつき）';
    return '有明の月（ありあけのつき）';
  }

  function draw() {
    const day = parseFloat(timeSlider.value);
    dayDisplay.textContent = `${day.toFixed(1)}日経過`;
    phaseNameEl.textContent = getPhaseName(day);
    
    // Calculate angle: 0 days = 0 rad (New moon, between Earth and Sun). 
    // Sun is to the RIGHT.
    // So angle = 0 means Moon is on the right of Earth.
    // Wait, in astronomy, Sun is usually drawn on the right. 
    // New moon is at 0 degrees (right).
    // Counter-clockwise rotation.
    const angle = (day / cycleDays) * Math.PI * 2;
    
    drawOrbit(angle);
    drawView(angle);
  }

  function drawOrbit(angle) {
    const w = orbitCanvas.width;
    const h = orbitCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    
    ctxOrbit.clearRect(0, 0, w, h);
    
    // Draw Sunlight Arrows
    ctxOrbit.fillStyle = 'rgba(255, 204, 0, 0.2)';
    ctxOrbit.fillRect(w - 60, 0, 60, h);
    ctxOrbit.fillStyle = '#ffcc00';
    ctxOrbit.font = '16px sans-serif';
    ctxOrbit.textAlign = 'center';
    ctxOrbit.fillText('太 陽 の 光', w - 30, 30);
    
    // Draw Orbit Line
    ctxOrbit.beginPath();
    ctxOrbit.arc(cx, cy, orbitRadius, 0, Math.PI * 2);
    ctxOrbit.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctxOrbit.setLineDash([5, 5]);
    ctxOrbit.stroke();
    ctxOrbit.setLineDash([]);
    
    // Draw Earth
    // Right half is day (facing sun), left half is night
    ctxOrbit.beginPath();
    ctxOrbit.arc(cx, cy, earthRadius, 0, Math.PI * 2);
    ctxOrbit.fillStyle = '#1e3a8a'; // Night
    ctxOrbit.fill();
    
    ctxOrbit.beginPath();
    ctxOrbit.arc(cx, cy, earthRadius, -Math.PI/2, Math.PI/2);
    ctxOrbit.fillStyle = '#60a5fa'; // Day
    ctxOrbit.fill();
    ctxOrbit.strokeStyle = '#fff';
    ctxOrbit.stroke();
    
    // Draw Moon
    const mx = cx + Math.cos(angle) * orbitRadius;
    const my = cy - Math.sin(angle) * orbitRadius; // Subtract to go CCW (Standard Math coordinate system)
    
    // Moon background (Night)
    ctxOrbit.beginPath();
    ctxOrbit.arc(mx, my, moonRadius, 0, Math.PI * 2);
    ctxOrbit.fillStyle = '#333';
    ctxOrbit.fill();
    
    // Moon Day (facing right)
    ctxOrbit.beginPath();
    ctxOrbit.arc(mx, my, moonRadius, -Math.PI/2, Math.PI/2);
    ctxOrbit.fillStyle = '#fff';
    ctxOrbit.fill();
    ctxOrbit.stroke();
  }

  function drawView(angle) {
    const w = viewCanvas.width;
    const h = viewCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = 80;
    
    ctxView.clearRect(0, 0, w, h);
    
    // Background (night sky)
    ctxView.beginPath();
    ctxView.arc(cx, cy, radius, 0, Math.PI * 2);
    ctxView.fillStyle = '#222';
    ctxView.fill();
    
    // To calculate the phase, we use the angle.
    // angle = 0 -> New moon (all dark)
    // angle = PI/2 -> First quarter (right half illuminated)
    // angle = PI -> Full moon (all illuminated)
    // angle = 3PI/2 -> Last quarter (left half illuminated)
    
    // We draw the illuminated part using arcs and ellipses.
    // The illuminated edge is a semicircle on the right or left.
    // The terminator is an ellipse.
    
    const phase = angle % (Math.PI * 2);
    
    ctxView.save();
    ctxView.translate(cx, cy);
    
    // Normalize phase to 0 - 2PI
    // Draw base dark moon
    ctxView.beginPath();
    ctxView.arc(0, 0, radius, 0, Math.PI * 2);
    ctxView.fillStyle = '#222';
    ctxView.fill();
    
    ctxView.fillStyle = '#fff';
    
    if (phase <= Math.PI) {
      // Waxing (New to Full) - Right side is illuminated
      // Draw right half
      ctxView.beginPath();
      ctxView.arc(0, 0, radius, -Math.PI/2, Math.PI/2);
      ctxView.fill();
      
      // Draw terminator ellipse
      // When phase = 0, ellipse covers right half (dark)
      // When phase = PI/2, ellipse is flat (line)
      // When phase = PI, ellipse covers left half (light) - wait, Math.cos(phase) goes 1 -> -1
      const width = radius * Math.cos(phase);
      
      ctxView.beginPath();
      ctxView.ellipse(0, 0, Math.abs(width), radius, 0, 0, Math.PI * 2);
      if (phase < Math.PI / 2) {
        ctxView.fillStyle = '#222'; // Dark covers part of right
      } else {
        ctxView.fillStyle = '#fff'; // Light covers part of left
      }
      ctxView.fill();
      
    } else {
      // Waning (Full to New) - Left side is illuminated
      // Draw left half
      ctxView.beginPath();
      ctxView.arc(0, 0, radius, Math.PI/2, 3*Math.PI/2);
      ctxView.fill();
      
      const width = radius * Math.cos(phase); // goes -1 -> 1
      
      ctxView.beginPath();
      ctxView.ellipse(0, 0, Math.abs(width), radius, 0, 0, Math.PI * 2);
      if (phase < 3 * Math.PI / 2) {
        ctxView.fillStyle = '#fff'; // Light covers part of right
      } else {
        ctxView.fillStyle = '#222'; // Dark covers part of left
      }
      ctxView.fill();
    }
    
    // Draw craters (Optional, just add some texture)
    ctxView.globalAlpha = 0.1;
    ctxView.fillStyle = '#000';
    ctxView.beginPath(); ctxView.arc(20, -20, 15, 0, Math.PI*2); ctxView.fill();
    ctxView.beginPath(); ctxView.arc(-30, 10, 20, 0, Math.PI*2); ctxView.fill();
    ctxView.beginPath(); ctxView.arc(10, 40, 10, 0, Math.PI*2); ctxView.fill();
    
    ctxView.restore();
  }

  // Event Listeners
  timeSlider.addEventListener('input', draw);
  
  // Initial draw
  draw();
}
