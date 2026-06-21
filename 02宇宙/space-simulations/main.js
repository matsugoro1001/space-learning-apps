function initSunAnatomy() {
  const container = document.getElementById('sun-anatomy-container');
  if (!container) return;

  container.innerHTML = `
    <div class="sun-canvas-wrapper" style="text-align: center;">
      <canvas id="sun-anatomy-canvas" width="500" height="500" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);"></canvas>
    </div>
    <div class="explanation-box glass-panel" style="margin-top: 2rem; padding: 1.5rem; max-width: 800px; width: 100%;">
      <h3 style="color: var(--accent-color); margin-bottom: 1rem;">🔍 太陽の各部の解説</h3>
      <ul style="line-height: 1.8; list-style-type: none; padding: 0;">
        <li><strong style="color: #ffcc00;">黒点（こくてん）：</strong> 太陽の表面（光球）にある黒いシミのような部分。まわりより温度が低いため黒く見えます。（約4000℃）</li>
        <li><strong style="color: #ffcc00;">プロミネンス（紅炎）：</strong> 太陽のふちから炎のように立ち上がる巨大なガスののかたまりです。</li>
        <li><strong style="color: #ffcc00;">コロナ：</strong> 太陽のまわりにある、真珠色に輝く非常に高温（100万℃以上）の薄いガスの層です。皆既日食のときによく見えます。</li>
        <li><strong style="color: #ffcc00;">光球（こうきゅう）：</strong> 私たちがいつも見ている太陽の表面です。（約6000℃）</li>
        <li><strong style="color: #ffcc00;">中心部（核）：</strong> 非常に高い温度（約1600万℃）と圧力で、核融合反応が起きて莫大なエネルギーが生み出されています。</li>
      </ul>
    </div>
  `;

  const canvas = document.getElementById('sun-anatomy-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let time = 0;
  function drawSun() {
    time += 0.02;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = 120;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background (Space)
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Corona (Outer glow)
    const glowRadius = r + 60 + Math.sin(time * 3) * 10;
    const grad = ctx.createRadialGradient(cx, cy, r, cx, cy, glowRadius);
    grad.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Prominences (Red flames on edge)
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 4; i++) {
      ctx.rotate((Math.PI / 2) * i + time * 0.1);
      ctx.beginPath();
      ctx.moveTo(r - 5, 0);
      ctx.quadraticCurveTo(r + 30 + Math.sin(time*5+i)*10, 20, r - 5, 40);
      ctx.fillStyle = 'rgba(255, 50, 0, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 150, 0, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
    
    // Photosphere (Sun body)
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffaa00';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff5500';
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Sunspots (Black spots)
    ctx.fillStyle = '#331100';
    ctx.beginPath(); ctx.arc(cx - 30, cy + 20, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 38, cy + 15, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 40, cy - 30, 8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 50, cy - 25, 4, 0, Math.PI*2); ctx.fill();
    
    // Core (Cutout section)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -Math.PI / 4, Math.PI / 6);
    ctx.lineTo(cx, cy);
    ctx.fillStyle = '#ffea00';
    ctx.fill();
    ctx.strokeStyle = '#ff3300';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Core center
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r * 0.3, -Math.PI / 4, Math.PI / 6);
    ctx.lineTo(cx, cy);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // Labels
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    
    // Lines and texts
    const drawLabel = (lx, ly, tx, ty, text) => {
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(tx, ty); 
      ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillText(text, tx + (tx > cx ? 20 : -20), ty + 5);
    };
    
    drawLabel(cx - 34, cy + 18, cx - 120, cy + 80, '黒点');
    drawLabel(cx, cy - r - 20, cx, cy - r - 80, 'コロナ');
    drawLabel(cx - r + 10, cy, cx - r - 60, cy, 'プロミネンス');
    drawLabel(cx - 50, cy - 50, cx - 100, cy - 100, '光球');
    drawLabel(cx + 20, cy - 5, cx + 120, cy - 5, '中心部（核）');
    
    requestAnimationFrame(drawSun);
  }
  
  drawSun();
}
function initMoonPhases() {
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
    
    const angle = (day / cycleDays) * Math.PI * 2;
    
    drawOrbit(angle);
    drawView(angle, day);
  }

  function drawOrbit(angle) {
    const w = orbitCanvas.width;
    const h = orbitCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    
    ctxOrbit.clearRect(0, 0, w, h);
    
    // Draw Sun on the right edge
    ctxOrbit.beginPath();
    ctxOrbit.arc(w + 20, cy, 60, 0, Math.PI * 2);
    ctxOrbit.fillStyle = '#ff9900';
    ctxOrbit.shadowColor = '#ffcc00';
    ctxOrbit.shadowBlur = 30;
    ctxOrbit.fill();
    ctxOrbit.shadowBlur = 0; // reset
    ctxOrbit.fillStyle = '#fff';
    ctxOrbit.font = 'bold 18px sans-serif';
    ctxOrbit.textAlign = 'right';
    ctxOrbit.fillText('太陽', w - 10, cy + 6);
    
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
    
    // Draw Person (Observer)
    const px = cx + Math.cos(angle) * earthRadius;
    const py = cy - Math.sin(angle) * earthRadius;
    
    ctxOrbit.save();
    ctxOrbit.translate(px, py);
    // Rotate so "up" is pointing away from Earth center
    ctxOrbit.rotate(-angle); 
    
    // Draw stick figure
    ctxOrbit.strokeStyle = '#ffcc00';
    ctxOrbit.lineWidth = 2;
    ctxOrbit.beginPath();
    // Body
    ctxOrbit.moveTo(0, 0);
    ctxOrbit.lineTo(10, 0); // pointing outwards
    // Head
    ctxOrbit.arc(13, 0, 3, 0, Math.PI*2);
    // Arms
    ctxOrbit.moveTo(5, 0);
    ctxOrbit.lineTo(8, -5);
    ctxOrbit.moveTo(5, 0);
    ctxOrbit.lineTo(8, 5);
    // Legs
    ctxOrbit.moveTo(0, 0);
    ctxOrbit.lineTo(-4, -4);
    ctxOrbit.moveTo(0, 0);
    ctxOrbit.lineTo(-4, 4);
    ctxOrbit.stroke();
    
    ctxOrbit.restore();

    // Label "人" (Always upright, offset from the line of sight)
    ctxOrbit.fillStyle = '#ffcc00';
    ctxOrbit.font = '12px sans-serif';
    ctxOrbit.textAlign = 'center';
    
    // Offset angle slightly so it doesn't overlap the dashed line
    const textAngle = angle + 0.3; 
    const tx = cx + Math.cos(textAngle) * (earthRadius + 20);
    const ty = cy - Math.sin(textAngle) * (earthRadius + 20);
    ctxOrbit.fillText('観測者', tx, ty + 4);
    ctxOrbit.lineWidth = 1; // reset

    // Draw Line of sight
    const mx = cx + Math.cos(angle) * orbitRadius;
    const my = cy - Math.sin(angle) * orbitRadius;
    
    ctxOrbit.beginPath();
    ctxOrbit.moveTo(px, py);
    ctxOrbit.lineTo(mx, my);
    ctxOrbit.strokeStyle = 'rgba(255, 204, 0, 0.5)';
    ctxOrbit.setLineDash([2, 2]);
    ctxOrbit.stroke();
    ctxOrbit.setLineDash([]);
    
    // Draw Moon background (Night)
    ctxOrbit.beginPath();
    ctxOrbit.arc(mx, my, moonRadius, 0, Math.PI * 2);
    ctxOrbit.fillStyle = '#333';
    ctxOrbit.fill();
    
    // Moon Day (facing right toward Sun)
    ctxOrbit.beginPath();
    ctxOrbit.arc(mx, my, moonRadius, -Math.PI/2, Math.PI/2);
    ctxOrbit.fillStyle = '#fff';
    ctxOrbit.fill();
    ctxOrbit.strokeStyle = '#fff';
    ctxOrbit.stroke();
  }

  function drawView(angle, day) {
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
    
    // Draw craters
    ctxView.globalAlpha = 0.1;
    ctxView.fillStyle = '#000';
    ctxView.beginPath(); ctxView.arc(20, -20, 15, 0, Math.PI*2); ctxView.fill();
    ctxView.beginPath(); ctxView.arc(-30, 10, 20, 0, Math.PI*2); ctxView.fill();
    ctxView.beginPath(); ctxView.arc(10, 40, 10, 0, Math.PI*2); ctxView.fill();
    
    ctxView.restore();
    ctxView.globalAlpha = 1.0;

    // Explicitly show "見えない" when it's new moon
    if (day < 1 || day > 28.5) {
      ctxView.fillStyle = '#ff6666';
      ctxView.font = 'bold 24px sans-serif';
      ctxView.textAlign = 'center';
      ctxView.fillText('真っ暗で見えない', cx, cy + 8);
      // add dashed outline to show where it should be
      ctxView.beginPath();
      ctxView.arc(cx, cy, radius, 0, Math.PI * 2);
      ctxView.strokeStyle = '#ff6666';
      ctxView.setLineDash([5, 5]);
      ctxView.stroke();
      ctxView.setLineDash([]);
    }
  }

  // Event Listeners
  timeSlider.addEventListener('input', draw);
  
  // Initial draw
  draw();
}

document.addEventListener('DOMContentLoaded', () => {
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.sim-section');

  // Navigation Logic
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons and sections
      navBtns.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      // Add active class to clicked button
      btn.classList.add('active');

      // Show target section
      const targetId = btn.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      
      if (targetSection) {
        targetSection.classList.add('active');
      } else {
        // Show placeholder if section doesn't exist yet
        document.getElementById('placeholder').classList.add('active');
      }
    });
  });

  // Initialize Simulations
  initSunAnatomy();
  initMoonPhases();
});


