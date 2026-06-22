// ==========================================
// 2. 太陽の一日の動き (Sun Motion 3D)
// ==========================================
const sunCanvas = document.getElementById('sun-motion-canvas');
if (sunCanvas) {
  const ctxSun = sunCanvas.getContext('2d');
  const sunTimeSlider = document.getElementById('sun-time-slider');
  const sunTimeDisplay = document.getElementById('sun-time-display');
  const sunStatus = document.getElementById('sun-status');
  const seasonBtns = document.querySelectorAll('.season-btn');
  
  let currentSeason = 'summer'; // summer, spring-autumn, winter
  
  // 3D Camera Controls
  let camYaw = -Math.PI / 6;
  let camPitch = Math.PI / 6;
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  
  sunCanvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    sunCanvas.style.cursor = 'grabbing';
  });
  
  window.addEventListener('mouseup', () => {
    isDragging = false;
    sunCanvas.style.cursor = 'grab';
  });
  
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    
    // Adjust sensitivity
    camYaw -= dx * 0.01;
    camPitch -= dy * 0.01;
    
    // Clamp pitch so it doesn't flip upside down
    camPitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, camPitch));
    
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    
    drawSunMotion();
  });
  
  sunCanvas.style.cursor = 'grab';
  
  function drawSunMotion() {
    const time = parseFloat(sunTimeSlider.value);
    
    const h = Math.floor(time);
    const m = time % 1 === 0 ? '00' : '30';
    sunTimeDisplay.textContent = `${h}:${m}`;
    
    ctxSun.fillStyle = '#050510';
    ctxSun.fillRect(0, 0, sunCanvas.width, sunCanvas.height);
    
    const cw = sunCanvas.width;
    const ch = sunCanvas.height;
    const cx = cw / 2;
    const cy = ch / 2 + 30;
    const R = 150; // Sphere radius
    
    ctxSun.save();
    
    // 3D Projection (Z is UP, X is EAST, Y is NORTH)
    const project = (x, y, z) => {
      const x1 = x * Math.cos(camYaw) - y * Math.sin(camYaw);
      const y1 = x * Math.sin(camYaw) + y * Math.cos(camYaw);
      const sx = cx + x1;
      const sy = cy - z * Math.cos(camPitch) + y1 * Math.sin(camPitch);
      return { x: sx, y: sy };
    };
    
    // Latitude (Japan = 35 deg)
    const lat = 35 * Math.PI / 180;
    
    // Axis vector (North pole)
    const axis = { x: 0, y: Math.cos(lat), z: Math.sin(lat) };
    
    // Equator basis vectors
    const u = { x: 1, y: 0, z: 0 }; // East
    const v = { x: 0, y: -Math.sin(lat), z: Math.cos(lat) }; // South-UP
    
    // 1. Draw Celestial Sphere Outline
    ctxSun.beginPath();
    ctxSun.arc(cx, cy, R, 0, Math.PI*2);
    ctxSun.fillStyle = 'rgba(255,255,255,0.02)';
    ctxSun.fill();
    ctxSun.strokeStyle = 'rgba(255,255,255,0.1)';
    ctxSun.stroke();
    
    // 2. Draw Ground (Z=0)
    ctxSun.beginPath();
    for(let a=0; a<=Math.PI*2; a+=0.1) {
      const p = project(R*Math.cos(a), R*Math.sin(a), 0);
      if(a===0) ctxSun.moveTo(p.x, p.y);
      else ctxSun.lineTo(p.x, p.y);
    }
    ctxSun.fillStyle = 'rgba(20, 50, 30, 0.8)';
    ctxSun.fill();
    ctxSun.strokeStyle = '#336644';
    ctxSun.stroke();
    
    // Compass labels
    const drawLabel = (x, y, z, text) => {
      const p = project(x, y, z);
      ctxSun.fillStyle = '#aaa';
      ctxSun.font = '14px sans-serif';
      ctxSun.textAlign = 'center';
      ctxSun.fillText(text, p.x, p.y);
    };
    drawLabel(R+20, 0, 0, '東');
    drawLabel(-R-20, 0, 0, '西');
    drawLabel(0, R+20, 0, '北');
    drawLabel(0, -R-20, 0, '南');
    
    // Draw Axis line
    const axisTop = project(axis.x * R * 1.2, axis.y * R * 1.2, axis.z * R * 1.2);
    const axisBot = project(-axis.x * R * 1.2, -axis.y * R * 1.2, -axis.z * R * 1.2);
    ctxSun.beginPath();
    ctxSun.moveTo(axisBot.x, axisBot.y);
    ctxSun.lineTo(axisTop.x, axisTop.y);
    ctxSun.strokeStyle = 'rgba(255,255,255,0.3)';
    ctxSun.setLineDash([5,5]);
    ctxSun.stroke();
    ctxSun.setLineDash([]);
    ctxSun.fillStyle = '#aaa';
    ctxSun.fillText('天の北極', axisTop.x, axisTop.y - 10);
    
    // 3. Draw Sun Paths
    const paths = {
      'summer': { tilt: 23.4, color: '#ff6666' },
      'spring-autumn': { tilt: 0, color: '#ffff66' },
      'winter': { tilt: -23.4, color: '#66ccff' }
    };
    
    let currentSun3D = null;
    let isSunAbove = false;
    let currentAngleDeg = 0;
    
    Object.keys(paths).forEach(key => {
      const tiltRad = paths[key].tilt * Math.PI / 180;
      const shift = R * Math.sin(tiltRad);
      const circleR = R * Math.cos(tiltRad);
      
      const isCurrent = (key === currentSeason);
      
      // We will draw above ground and below ground separately
      ctxSun.lineWidth = isCurrent ? 3 : 1;
      
      const drawPathSegment = (zCond, dash) => {
        ctxSun.beginPath();
        let first = true;
        for(let a=0; a<=Math.PI*2; a+=0.05) {
          const x = shift * axis.x + circleR * (u.x * Math.cos(a) + v.x * Math.sin(a));
          const y = shift * axis.y + circleR * (u.y * Math.cos(a) + v.y * Math.sin(a));
          const z = shift * axis.z + circleR * (u.z * Math.cos(a) + v.z * Math.sin(a));
          
          if (zCond(z)) {
            const p = project(x, y, z);
            if(first) { ctxSun.moveTo(p.x, p.y); first = false; }
            else { ctxSun.lineTo(p.x, p.y); }
          } else {
            first = true;
          }
        }
        ctxSun.strokeStyle = isCurrent ? paths[key].color : 'rgba(255,255,255,0.1)';
        if(dash) ctxSun.setLineDash([4,4]); else ctxSun.setLineDash([]);
        if(!isCurrent && dash) ctxSun.strokeStyle = 'rgba(255,255,255,0.05)';
        ctxSun.stroke();
      };
      
      // Above ground (Z >= 0)
      drawPathSegment(z => z >= -0.1, false);
      // Below ground (Z < 0)
      drawPathSegment(z => z < 0.1, true);
      
      // Calculate current sun position
      if (isCurrent) {
        // Angle mapping: t=6 -> a=0 (East), t=12 -> a=PI/2 (South), t=18 -> a=PI (West)
        const angle = ((time - 6) / 24) * 2 * Math.PI;
        currentAngleDeg = angle * 180 / Math.PI;
        
        const x = shift * axis.x + circleR * (u.x * Math.cos(angle) + v.x * Math.sin(angle));
        const y = shift * axis.y + circleR * (u.y * Math.cos(angle) + v.y * Math.sin(angle));
        const z = shift * axis.z + circleR * (u.z * Math.cos(angle) + v.z * Math.sin(angle));
        
        currentSun3D = {x, y, z};
        isSunAbove = (z >= 0);
      }
    });
    
    // 4. Draw Sun
    if (currentSun3D) {
      const sp = project(currentSun3D.x, currentSun3D.y, currentSun3D.z);
      
      // Draw drop line
      if (isSunAbove) {
        const gp = project(currentSun3D.x, currentSun3D.y, 0);
        ctxSun.beginPath(); ctxSun.moveTo(sp.x, sp.y); ctxSun.lineTo(gp.x, gp.y);
        ctxSun.strokeStyle = 'rgba(255,170,0,0.5)'; ctxSun.setLineDash([3,3]); ctxSun.stroke();
        ctxSun.setLineDash([]);
      }
      
      ctxSun.beginPath();
      ctxSun.arc(sp.x, sp.y, 12, 0, Math.PI*2);
      ctxSun.fillStyle = isSunAbove ? '#ffaa00' : '#885500';
      ctxSun.fill();
      if (isSunAbove) {
        ctxSun.shadowBlur = 15; ctxSun.shadowColor = '#ffaa00'; ctxSun.fill(); ctxSun.shadowBlur = 0;
      }
      
      // Status Text Updates
      let statusText = "夜間（地平線の下）";
      
      // Z座標が地平線（Z=0）に非常に近いかどうかで日の出・日の入りを判定
      // 太陽の高さがプラマイ数ピクセルの時を判定
      if (Math.abs(currentSun3D.z) < 8) {
         let aDeg = currentAngleDeg % 360;
         if (aDeg < 0) aDeg += 360;
         if (aDeg < 90 || aDeg > 270) {
            statusText = "🌅 日の出";
         } else {
            statusText = "🌇 日の入り";
         }
      } else if (isSunAbove) {
        statusText = "昼間";
        let aDeg = currentAngleDeg % 360;
        if (aDeg < 0) aDeg += 360;
        // 南中は aDeg が 90 付近の時
        if (aDeg > 85 && aDeg < 95) {
          statusText = "🌞 南中（一番高い！）";
        }
      }
      
      if(sunStatus) {
        sunStatus.textContent = statusText;
        sunStatus.style.color = (statusText.includes('夜間')) ? '#888' : '#ffcc00';
      }
    }
    
    // Add explanatory text on canvas
    
    // 現在選択されている季節を大きく表示
    const seasonNames = {
      'summer': '夏至',
      'spring-autumn': '春分・秋分',
      'winter': '冬至'
    };
    ctxSun.fillStyle = '#fff';
    ctxSun.font = 'bold 24px sans-serif';
    ctxSun.textAlign = 'right';
    const seasonName = seasonNames[currentSeason];
    ctxSun.fillText(`現在: ${seasonName}`, cw - 20, 40);

    // 凡例表示
    ctxSun.fillStyle = '#fff';
    ctxSun.font = '14px sans-serif';
    ctxSun.textAlign = 'left';
    ctxSun.textAlign = 'left';
    ctxSun.fillText('実線: 地面の上（昼）', 10, 20);
    ctxSun.setLineDash([4,4]);
    ctxSun.beginPath(); ctxSun.moveTo(10, 35); ctxSun.lineTo(40, 35); ctxSun.strokeStyle='#fff'; ctxSun.stroke();
    ctxSun.setLineDash([]);
    ctxSun.fillText('点線: 地面の下（夜）', 45, 40);
    
    ctxSun.restore();
  }
  
  seasonBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      seasonBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentSeason = e.target.dataset.season;
      drawSunMotion();
    });
  });
  
  sunTimeSlider.addEventListener('input', () => {
    currentSunTime = parseFloat(sunTimeSlider.value);
    drawSunMotion();
  });
  
  const playBtn = document.getElementById('sun-play-btn');
  let isPlaying = true;
  let animId = null;
  let lastTime = performance.now();
  let currentSunTime = parseFloat(sunTimeSlider.value);

  if (playBtn) {
    playBtn.textContent = '⏸ 一時停止';
    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      playBtn.textContent = isPlaying ? '⏸ 一時停止' : '▶ 再生';
      if (isPlaying) {
        lastTime = performance.now();
        animateSun();
      } else {
        cancelAnimationFrame(animId);
      }
    });
  }

  function animateSun() {
    if (!isPlaying) return;
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    
    currentSunTime += dt * 2.0; // 2 hours per second
    if (currentSunTime >= 24) currentSunTime -= 24;
    sunTimeSlider.value = currentSunTime;
    drawSunMotion();
    
    animId = requestAnimationFrame(animateSun);
  }

  animateSun();
}

// ==========================================
// 3. 星の一日の動き シミュレーション (3D + 4 Skies)
// ==========================================
const starsSpaceCanvas = document.getElementById('stars-space-canvas');
if (starsSpaceCanvas) {
  const ctxSpace = starsSpaceCanvas.getContext('2d');
  
  // 4 directional canvases
  const ctxEast = document.getElementById('stars-east-canvas').getContext('2d');
  const ctxWest = document.getElementById('stars-west-canvas').getContext('2d');
  const ctxSouth = document.getElementById('stars-south-canvas').getContext('2d');
  const ctxNorth = document.getElementById('stars-north-canvas').getContext('2d');
  
  const spaceW = starsSpaceCanvas.width;
  const spaceH = starsSpaceCanvas.height;
  const skyW = 300;
  const skyH = 300;
  
  const R = 180; // Sphere radius
  
  // Camera state for space view
  let spaceYaw = -Math.PI / 6;
  let spacePitch = Math.PI / 6;
  let isDraggingSpace = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  
  starsSpaceCanvas.addEventListener('mousedown', e => {
    isDraggingSpace = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    starsSpaceCanvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', () => {
    isDraggingSpace = false;
    starsSpaceCanvas.style.cursor = 'grab';
  });
  window.addEventListener('mousemove', e => {
    if (!isDraggingSpace) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    spaceYaw -= dx * 0.01;
    spacePitch -= dy * 0.01;
    spacePitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, spacePitch));
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });
  
  starsSpaceCanvas.addEventListener('touchstart', e => {
    if (e.touches.length > 0) {
      isDraggingSpace = true;
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
    }
  });
  window.addEventListener('touchend', () => { isDraggingSpace = false; });
  window.addEventListener('touchmove', e => {
    if (!isDraggingSpace || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - lastMouseX;
    const dy = e.touches[0].clientY - lastMouseY;
    spaceYaw -= dx * 0.01;
    spacePitch -= dy * 0.01;
    spacePitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, spacePitch));
    lastMouseX = e.touches[0].clientX;
    lastMouseY = e.touches[0].clientY;
  });

  // Generate stars
  const stars = [];
  for (let i = 0; i < 300; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = R * Math.sin(phi) * Math.cos(theta);
    const y = R * Math.sin(phi) * Math.sin(theta);
    const z = R * Math.cos(phi);
    const size = Math.random() * 1.5 + 0.5;
    const brightness = Math.random() * 0.5 + 0.5;
    const colors = ['#ffffff', '#aaccff', '#ffddaa', '#ffeeaa'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    stars.push({x0: x, y0: y, z0: z, size, brightness, color});
  }

  // Add constellations
  const addConstellation = (points, baseTheta, basePhi, color, name) => {
    points.forEach(p => {
      const r = R * 0.99;
      const alpha = p.x / r;
      const beta = p.y / r;
      const theta = baseTheta + alpha;
      const phi = basePhi + beta;
      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.sin(phi) * Math.sin(theta);
      const z = R * Math.cos(phi);
      if (p.isLabel) {
        stars.push({x0: x, y0: y, z0: z, size: 0, isLabel: true, name: name});
      } else {
        stars.push({x0: x, y0: y, z0: z, size: 2.5, brightness: 1.0, color: color, isConstellation: true});
      }
    });
  };

  addConstellation([
    {x: -15, y: 0}, {x: 0, y: 0}, {x: 15, y: 0},
    {x: -25, y: -40}, {x: 30, y: -30}, {x: -30, y: 40}, {x: 25, y: 50},
    {x: 0, y: -50, isLabel: true}
  ], 0, Math.PI/2, '#aaddff', 'オリオン座');

  addConstellation([
    {x: -60, y: -40}, {x: -30, y: 10}, {x: 0, y: -20}, {x: 30, y: 20}, {x: 60, y: -30, isLabel: true}
  ], Math.PI, Math.PI/6, '#ffccaa', 'カシオペヤ座');

  // Add Polaris (North Star) exactly at the celestial north pole
  const latP = 35 * Math.PI / 180;
  stars.push({
    x0: 0, y0: R * Math.cos(latP), z0: R * Math.sin(latP),
    size: 4, brightness: 1.5, color: '#ffff00', isConstellation: true, name: '北極星'
  });

  // Big Dipper (北斗七星) - Near North Pole
  addConstellation([
    {x: -40, y: -20}, {x: -20, y: -15}, {x: 0, y: -5}, {x: 10, y: 10}, {x: 15, y: 30}, {x: 35, y: 35}, {x: 40, y: 15, isLabel: true}
  ], Math.PI * 0.8, Math.PI/4, '#aaffff', '北斗七星');

  // Scorpius (さそり座) - Near South, low altitude in summer
  addConstellation([
    {x: -30, y: 40}, {x: -15, y: 20}, {x: 0, y: 0}, {x: 15, y: -10}, {x: 30, y: -25}, {x: 20, y: -45}, {x: -5, y: -50, isLabel: true}
  ], -Math.PI/2, Math.PI - Math.PI/4, '#ff5555', 'さそり座');

  // Cygnus / Summer Triangle (夏の大三角)
  addConstellation([
    {x: 0, y: 0, isLabel: true}, {x: 20, y: 30}, {x: -20, y: 30}, {x: 0, y: 60}, {x: 0, y: -30}
  ], 0, Math.PI/3, '#ffffff', 'はくちょう座');

  const rotateAroundAxis = (x, y, z, angle) => {
    const lat = 35 * Math.PI / 180;
    const tilt = Math.PI / 2 - lat;
    let y1 = y * Math.cos(tilt) - z * Math.sin(tilt);
    let z1 = y * Math.sin(tilt) + z * Math.cos(tilt);
    let x1 = x;
    let x2 = x1 * Math.cos(angle) - y1 * Math.sin(angle);
    let y2 = x1 * Math.sin(angle) + y1 * Math.cos(angle);
    let z2 = z1;
    let x3 = x2;
    let y3 = y2 * Math.cos(-tilt) - z2 * Math.sin(-tilt);
    let z3 = y2 * Math.sin(-tilt) + z2 * Math.cos(-tilt);
    return {x: x3, y: y3, z: z3};
  };

  const projectPoint = (x, y, z, yaw, pitch, cx, cy) => {
    const x1 = x * Math.cos(yaw) - y * Math.sin(yaw);
    const y1 = x * Math.sin(yaw) + y * Math.cos(yaw);
    const sx = cx + x1;
    const sy = cy - z * Math.cos(pitch) + y1 * Math.sin(pitch);
    const depth = y1 * Math.cos(pitch) + z * Math.sin(pitch);
    return { x: sx, y: sy, depth: depth };
  };

  const drawGround = (ctx, cw, ch, yaw, pitch, cx, cy) => {
    ctx.beginPath();
    for(let a=0; a<=Math.PI*2; a+=0.1) {
      const p = projectPoint(R*Math.cos(a), R*Math.sin(a), 0, yaw, pitch, cx, cy);
      if(a===0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.fillStyle = 'rgba(10, 30, 15, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#225533';
    ctx.stroke();
  };

  let simTime = 0;
  let lastT = performance.now();

  function renderAll() {
    const now = performance.now();
    const dt = (now - lastT) / 1000;
    lastT = now;
    simTime += dt;
    const rotAngle = -simTime * 0.25; // Speed of rotation

    // ----- DRAW SPACE VIEW -----
    ctxSpace.fillStyle = '#050510';
    ctxSpace.fillRect(0, 0, spaceW, spaceH);
    ctxSpace.save();
    
    const scx = spaceW / 2;
    const scy = spaceH / 2 + 30;

    drawGround(ctxSpace, spaceW, spaceH, spaceYaw, spacePitch, scx, scy);

    const drawLabelSpace = (x, y, z, text) => {
      const p = projectPoint(x, y, z, spaceYaw, spacePitch, scx, scy);
      ctxSpace.fillStyle = '#aaa'; ctxSpace.font = '14px sans-serif'; ctxSpace.textAlign = 'center'; ctxSpace.fillText(text, p.x, p.y);
    };
    drawLabelSpace(R+20, 0, 0, '東'); drawLabelSpace(-R-20, 0, 0, '西'); drawLabelSpace(0, R+20, 0, '北'); drawLabelSpace(0, -R-20, 0, '南');

    const lat = 35 * Math.PI / 180;
    const axisTop = projectPoint(0, R * Math.cos(lat), R * Math.sin(lat), spaceYaw, spacePitch, scx, scy);
    const centerSpace = projectPoint(0, 0, 0, spaceYaw, spacePitch, scx, scy);
    ctxSpace.beginPath(); ctxSpace.moveTo(axisTop.x, axisTop.y); ctxSpace.lineTo(centerSpace.x, centerSpace.y);
    ctxSpace.strokeStyle = 'rgba(255,255,255,0.3)'; ctxSpace.setLineDash([5,5]); ctxSpace.stroke(); ctxSpace.setLineDash([]);
    
    // celestial sphere
    ctxSpace.beginPath();
    ctxSpace.arc(scx, scy, R, 0, Math.PI*2);
    ctxSpace.fillStyle = 'rgba(255,255,255,0.02)';
    ctxSpace.fill();
    ctxSpace.strokeStyle = 'rgba(255,255,255,0.1)';
    ctxSpace.stroke();

    const renderList = [];
    stars.forEach(s => {
      const rot = rotateAroundAxis(s.x0, s.y0, s.z0, rotAngle);
      if (rot.z >= -2) {
        const p = projectPoint(rot.x, rot.y, rot.z, spaceYaw, spacePitch, scx, scy);
        renderList.push({ ...p, s: s, origZ: rot.z });
      }
    });
    renderList.sort((a, b) => b.depth - a.depth);
    renderList.forEach(item => {
      if (item.s.isLabel) {
        ctxSpace.fillStyle = '#ffaa00'; ctxSpace.font = '12px sans-serif'; ctxSpace.fillText(item.s.name, item.x, item.y);
      } else {
        ctxSpace.beginPath(); ctxSpace.arc(item.x, item.y, item.s.size, 0, Math.PI*2);
        ctxSpace.fillStyle = item.s.color || '#fff'; ctxSpace.globalAlpha = Math.min(1, item.origZ / 10) * item.s.brightness; ctxSpace.fill(); ctxSpace.globalAlpha = 1.0;
      }
    });

    
    // Draw a simplified stickman for observer
    const ppHead = projectPoint(0, 0, 15, spaceYaw, spacePitch, scx, scy);
    const ppNeck = projectPoint(0, 0, 10, spaceYaw, spacePitch, scx, scy);
    const ppWaist = projectPoint(0, 0, 5, spaceYaw, spacePitch, scx, scy);
    const ppLeftArm = projectPoint(6, 0, 8, spaceYaw, spacePitch, scx, scy);
    const ppRightArm = projectPoint(-6, 0, 8, spaceYaw, spacePitch, scx, scy);
    const ppLeftLeg = projectPoint(4, 0, 0, spaceYaw, spacePitch, scx, scy);
    const ppRightLeg = projectPoint(-4, 0, 0, spaceYaw, spacePitch, scx, scy);

    ctxSpace.strokeStyle = '#ffaa00'; ctxSpace.lineWidth = 2;
    ctxSpace.beginPath(); ctxSpace.moveTo(ppNeck.x, ppNeck.y); ctxSpace.lineTo(ppWaist.x, ppWaist.y); ctxSpace.stroke();
    ctxSpace.beginPath(); ctxSpace.moveTo(ppLeftArm.x, ppLeftArm.y); ctxSpace.lineTo(ppRightArm.x, ppRightArm.y); ctxSpace.stroke();
    ctxSpace.beginPath(); ctxSpace.moveTo(ppWaist.x, ppWaist.y); ctxSpace.lineTo(ppLeftLeg.x, ppLeftLeg.y); ctxSpace.stroke();
    ctxSpace.beginPath(); ctxSpace.moveTo(ppWaist.x, ppWaist.y); ctxSpace.lineTo(ppRightLeg.x, ppRightLeg.y); ctxSpace.stroke();
    ctxSpace.beginPath(); ctxSpace.arc(ppHead.x, ppHead.y, 4, 0, Math.PI*2); ctxSpace.fillStyle='#ffaa00'; ctxSpace.fill();
    ctxSpace.lineWidth = 1;
    ctxSpace.font = '12px sans-serif'; ctxSpace.fillText('観測者', ppHead.x, ppHead.y - 10);
    ctxSpace.restore();

    // ----- DRAW 4 SKY VIEWS (PERSPECTIVE) -----
    // Idealized Orthographic Projection for textbook-style straight lines
    const projectIdeal = (x, y, z, viewAngle, cx, cy) => {
      // viewAngle: 0=East, PI/2=North, -PI/2=South, PI=West
      const scale = 1.0;
      let sx = cx;
      let sy = cy - z * scale;
      let depth = 0;
      
      if (Math.abs(viewAngle) < 0.1) { // East
        // Looking East (+X). Right is South (-Y).
        sx = cx - y * scale;
        depth = x;
      } else if (Math.abs(viewAngle - Math.PI) < 0.1) { // West
        // Looking West (-X). Right is North (+Y).
        sx = cx + y * scale;
        depth = -x;
      } else if (Math.abs(viewAngle - Math.PI/2) < 0.1) { // North
        // Look North (+Y). But pitch up to look at Polaris!
        // Polaris is at elevation = lat (35 deg).
        // Let's just project along the axis of rotation for perfect circles!
        const lat = 35 * Math.PI / 180;
        // x is East (+). y is North (+). z is Up (+).
        // Axis is in YZ plane: y_axis = R*cos(lat), z_axis = R*sin(lat).
        // If we look down the axis, the new X is East (x). The new Y is perpendicular to axis in YZ plane.
        // perp_y = y * sin(lat) - z * cos(lat)
        sx = cx + x * scale;
        sy = cy + (y * Math.sin(lat) - z * Math.cos(lat)) * scale;
        depth = y * Math.cos(lat) + z * Math.sin(lat);
      } else if (Math.abs(viewAngle + Math.PI/2) < 0.1) { // South
        // Look South (-Y). Right is West (-X).
        sx = cx - x * scale;
        depth = -y;
      }
      return { x: sx, y: sy, depth: depth };
    };

    const drawGroundIdeal = (ctx, viewAngle, cx, cy) => {
      ctx.fillStyle = 'rgba(10, 30, 15, 1.0)';
      if (Math.abs(viewAngle - Math.PI/2) < 0.1) { // North (look up at Polaris)
        // Horizon is a curve
        ctx.beginPath();
        const lat = 35 * Math.PI / 180;
        for(let x = -R; x <= R; x += 5) {
          const y = Math.sqrt(R*R - x*x); // North horizon circle
          const sy = cy + (y * Math.sin(lat) - 0 * Math.cos(lat)) * 1.0;
          if(x === -R) ctx.moveTo(cx + x, sy);
          else ctx.lineTo(cx + x, sy);
        }
        ctx.lineTo(skyW, skyH);
        ctx.lineTo(0, skyH);
        ctx.fill();
      } else {
        // Flat horizon for East, West, South
        ctx.fillRect(0, cy, skyW, skyH - cy);
      }
      
      ctx.strokeStyle = '#225533';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (Math.abs(viewAngle - Math.PI/2) < 0.1) {
        const lat = 35 * Math.PI / 180;
        for(let x = -R; x <= R; x += 5) {
          const y = Math.sqrt(R*R - x*x);
          const sy = cy + (y * Math.sin(lat)) * 1.0;
          if(x === -R) ctx.moveTo(cx + x, sy);
          else ctx.lineTo(cx + x, sy);
        }
      } else {
        ctx.moveTo(0, cy); ctx.lineTo(skyW, cy);
      }
      ctx.stroke();
    };

    const skyViews = [
      { ctx: ctxEast, viewAngle: 0 }, // East
      { ctx: ctxWest, viewAngle: Math.PI }, // West
      { ctx: ctxSouth, viewAngle: -Math.PI / 2 }, // South
      { ctx: ctxNorth, viewAngle: Math.PI / 2 } // North
    ];

    skyViews.forEach(view => {
      const ctx = view.ctx;
      const viewAngle = view.viewAngle;
      const cx = skyW / 2;
      const cy = skyH - 60; // Horizon near the bottom

      // Fade out previous frame to create star trails
      ctx.fillStyle = 'rgba(5, 5, 16, 0.15)';
      ctx.fillRect(0, 0, skyW, skyH);
      ctx.save();
      
      const renderListSky = [];
      stars.forEach(s => {
        const rot = rotateAroundAxis(s.x0, s.y0, s.z0, rotAngle);
        if (rot.z >= -2) {
          const p = projectIdeal(rot.x, rot.y, rot.z, viewAngle, cx, cy);
          if (p.depth > 0) {
            renderListSky.push({ ...p, s: s, origZ: rot.z });
          }
        }
      });
      renderListSky.sort((a, b) => b.depth - a.depth); // Draw furthest first
      renderListSky.forEach(item => {
        if (item.s.isLabel) {
          ctx.fillStyle = '#ffaa00'; ctx.font = '10px sans-serif'; ctx.fillText(item.s.name, item.x, item.y);
        } else {
          let size = item.s.size; 
          size = Math.max(0.5, Math.min(6, size));
          if (item.s.name === '北極星') size *= 1.5; 
          ctx.beginPath(); ctx.arc(item.x, item.y, size, 0, Math.PI*2); 
          ctx.fillStyle = item.s.color || '#fff'; ctx.globalAlpha = Math.max(0, Math.min(1, item.origZ / 10)) * item.s.brightness; ctx.fill(); ctx.globalAlpha = 1.0;
          if (item.s.name === '北極星') {
             ctx.fillStyle = '#ffff00'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('北極星', item.x + 8, item.y);
          }
        }
      });
      
      drawGroundIdeal(ctx, viewAngle, cx, cy);
      
      // Draw cardinal direction letters
      const drawLabelIdeal = (x, y, z, text) => {
        const p = projectIdeal(x, y, z, viewAngle, cx, cy);
        if (p.depth > 0) {
          ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(text, p.x, Math.max(cy + 20, p.y + 20));
        }
      };
      drawLabelIdeal(R, 0, 0, '東');
      drawLabelIdeal(-R, 0, 0, '西');
      drawLabelIdeal(0, R, 0, '北');
      drawLabelIdeal(0, -R, 0, '南');
      
      // Draw cartoon back of head based on user reference
      ctx.save();
      ctx.translate(cx, skyH + 5); // Shift down to bottom edge
      ctx.scale(0.5, 0.5); // Scale down to 50% so it doesn't block stars
      
      const hx = 0;
      const hy = 0; 
      
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const outlineColor = '#1A2A3A';
      const skinColor = '#B88B6E';
      const shirtColor = '#FEF9E7';
      const dotColor = '#F4D03F';
      
      // 1. Shirt
      ctx.fillStyle = shirtColor;
      ctx.strokeStyle = outlineColor;
      ctx.beginPath();
      ctx.arc(hx, hy + 10, 35, Math.PI, 0); // body dome
      ctx.fill();
      ctx.stroke();
      
      // Shirt dots
      ctx.fillStyle = dotColor;
      for (let dx = -20; dx <= 20; dx += 10) {
         for (let dy = -10; dy <= 10; dy += 10) {
            if (dx*dx + dy*dy < 600) {
               ctx.beginPath(); ctx.arc(hx + dx, hy + dy + 15, 3, 0, Math.PI*2); ctx.fill();
            }
         }
      }
      
      // 2. Neck
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.moveTo(hx - 15, hy - 15);
      ctx.lineTo(hx - 15, hy - 5);
      ctx.quadraticCurveTo(hx, hy + 5, hx + 15, hy - 5); // curved neck base
      ctx.lineTo(hx + 15, hy - 15);
      ctx.fill();
      ctx.stroke();
      
      // 3. Ears
      ctx.beginPath();
      ctx.moveTo(hx - 30, hy - 45); 
      ctx.quadraticCurveTo(hx - 60, hy - 40, hx - 55, hy - 20); 
      ctx.quadraticCurveTo(hx - 40, hy - 20, hx - 25, hy - 30); 
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx - 35, hy - 28); ctx.quadraticCurveTo(hx - 30, hy - 23, hx - 25, hy - 25); ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(hx + 30, hy - 45); 
      ctx.quadraticCurveTo(hx + 60, hy - 40, hx + 55, hy - 20); 
      ctx.quadraticCurveTo(hx + 40, hy - 20, hx + 25, hy - 30); 
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx + 35, hy - 28); ctx.quadraticCurveTo(hx + 30, hy - 23, hx + 25, hy - 25); ctx.stroke();
      
      // 4. Head
      ctx.beginPath();
      ctx.arc(hx, hy - 50, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      ctx.restore();
    });

    requestAnimationFrame(renderAll);
  }

  renderAll();
}

// ==========================================
// 4. 地球の公転と見える星座 (Earth Orbit)
// ==========================================
const orbitCanvas = document.getElementById('earth-orbit-canvas');
if (orbitCanvas) {
  const ctxOrbit4 = orbitCanvas.getContext('2d');
  const monthSlider = document.getElementById('month-slider');
  const monthDisplay = document.getElementById('month-display');
  
  const zodiac = [
    "いて座", "やぎ座", "みずがめ座", "うお座", "おひつじ座", "おうし座",
    "ふたご座", "かに座", "しし座", "おとめ座", "てんびん座", "さそり座"
  ];
  // ざっくりと、8月（夏）の真夜中に南中するのは「いて座/さそり座」付近。
  // 配置を調整します。
  
  function drawEarthOrbit() {
    const month = parseInt(monthSlider.value);
    
    let seasonText = '';
    if (month >= 3 && month <= 5) seasonText = '春';
    else if (month >= 6 && month <= 8) seasonText = '夏';
    else if (month >= 9 && month <= 11) seasonText = '秋';
    else seasonText = '冬';
    
    monthDisplay.textContent = `${month}月（${seasonText}）`;
    
    ctxOrbit4.fillStyle = '#050510';
    ctxOrbit4.fillRect(0, 0, orbitCanvas.width, orbitCanvas.height);
    
    const cw = orbitCanvas.width;
    const ch = orbitCanvas.height;
    const cx = cw / 2;
    const cy = ch / 2;
    const orbitR = 120;
    const zodiacR = 210;
    
    ctxOrbit4.save();
    
    // Draw Zodiac Ring
    ctxOrbit4.strokeStyle = 'rgba(255,255,255,0.1)';
    ctxOrbit4.beginPath(); ctxOrbit4.arc(cx, cy, zodiacR, 0, Math.PI*2); ctxOrbit4.stroke();
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI/2;
      const zx = cx + zodiacR * Math.cos(angle);
      const zy = cy + zodiacR * Math.sin(angle);
      
      ctxOrbit4.fillStyle = '#888';
      ctxOrbit4.font = '14px sans-serif';
      ctxOrbit4.textAlign = 'center';
      ctxOrbit4.fillText(zodiac[i], zx, zy + 5);
    }
    
    // Draw Sun
    ctxOrbit4.beginPath(); ctxOrbit4.arc(cx, cy, 25, 0, Math.PI*2);
    ctxOrbit4.fillStyle = '#ff3300'; ctxOrbit4.fill();
    ctxOrbit4.fillStyle = '#fff';
    ctxOrbit4.font = '12px sans-serif'; ctxOrbit4.fillText('太陽', cx, cy + 4);
    
    // Draw Earth Orbit
    ctxOrbit4.strokeStyle = 'rgba(100, 150, 255, 0.3)';
    ctxOrbit4.beginPath(); ctxOrbit4.arc(cx, cy, orbitR, 0, Math.PI*2); ctxOrbit4.stroke();
    
    // Calculate Earth position. 
    // 7月（month 7）に太陽がふたご座（PI/2）の方向になるように調整します。
    // month=7 の時、(7+2)/12 * 2PI = 270度（-PI/2）。地球は上で、太陽は下（ふたご座）になります。
    const earthAngle = ((month + 2) / 12) * Math.PI * 2;
    const ex = cx + orbitR * Math.cos(earthAngle);
    const ey = cy + orbitR * Math.sin(earthAngle);
    
    // Draw Earth
    ctxOrbit4.beginPath(); ctxOrbit4.arc(ex, ey, 12, 0, Math.PI*2);
    ctxOrbit4.fillStyle = '#3399ff'; ctxOrbit4.fill();
    
    // Draw Line of Sight (Midnight)
    // Away from the sun
    ctxOrbit4.beginPath();
    ctxOrbit4.moveTo(ex, ey);
    const losX = cx + (orbitR + 100) * Math.cos(earthAngle);
    const losY = cy + (orbitR + 100) * Math.sin(earthAngle);
    ctxOrbit4.lineTo(losX, losY);
    ctxOrbit4.strokeStyle = '#ffff00';
    ctxOrbit4.setLineDash([5,5]);
    ctxOrbit4.lineWidth = 2;
    ctxOrbit4.stroke();
    ctxOrbit4.setLineDash([]);
    
    ctxOrbit4.fillStyle = '#ffff00';
    ctxOrbit4.fillText('真夜中の空', ex + 30 * Math.cos(earthAngle), ey + 30 * Math.sin(earthAngle));
    
    ctxOrbit4.restore();
  }
  
  monthSlider.addEventListener('input', drawEarthOrbit);
  drawEarthOrbit();
}

// ==========================================
// 8. 日食・月食のしくみ (Eclipses 3D)
// ==========================================
const eclipsesCanvas = document.getElementById('eclipses-canvas');
const viewCanvas = document.getElementById('eclipse-view-canvas');
if (eclipsesCanvas && viewCanvas) {
  const ctxEcl = eclipsesCanvas.getContext('2d');
  const ctxView = viewCanvas.getContext('2d');
  
  const earthOrbitSlider = document.getElementById('earth-orbit-slider');
  const moonOrbitSlider = document.getElementById('moon-orbit-slider');
  const tiltToggle = document.getElementById('tilt-toggle');
  const eclStatus = document.getElementById('eclipse-status');
  
  function drawEclipses() {
    const earthAngleDeg = parseInt(earthOrbitSlider.value);
    const moonAngleDeg = parseInt(moonOrbitSlider.value);
    const useTilt = tiltToggle.checked;
    
    // Convert to radians
    const earthTheta = earthAngleDeg * Math.PI / 180;
    const moonTheta = moonAngleDeg * Math.PI / 180;
    
    // Sizes and Distances
    const sunR = 40;
    const earthR = 15;
    const moonR = 5;
    const earthOrbitRadius = 220;
    const moonOrbitRadius = 60;
    
    // Canvas centers
    const cw = eclipsesCanvas.width;
    const ch = eclipsesCanvas.height;
    const cx = cw / 2;
    const cy = ch / 2;
    
    // Pseudo 3D Projection (Isometric-ish)
    // We tilt the view so we are looking down at an angle.
    const viewPitch = 1.0; // Top-down view (squish Y axis is 1)
    
    const project = (x, y, z) => {
      // True top-down view
      return { x: cx + x, y: cy + y };
    };
    
    // 1. Calculate Earth Position
    // Earth orbits in XY plane (Z=0)
    const ex = earthOrbitRadius * Math.cos(earthTheta);
    const ey = earthOrbitRadius * Math.sin(earthTheta);
    const ez = 0;
    
    // 2. Calculate Moon Position
    // Moon orbits Earth. 
    // If tilted, the nodes are fixed in space. Let's say nodes are at 0 and 180 degrees.
    // So Z is max at 90 deg and min at 270 deg.
    // Z = moonOrbitRadius * sin(moonTheta) * sin(tilt)
    const tiltAngle = useTilt ? (5.1 * 4) * Math.PI / 180 : 0; // Exaggerate tilt (x4) for visibility
    
    // Moon's relative position to Earth
    const mrx = moonOrbitRadius * Math.cos(moonTheta);
    const mry = moonOrbitRadius * Math.sin(moonTheta);
    const mrz = mry * Math.tan(tiltAngle); // Tilt along the Y axis of the orbit
    
    const mx = ex + mrx;
    const my = ey + mry;
    const mz = ez + mrz;
    
    // Drawing
    ctxEcl.fillStyle = '#050510';
    ctxEcl.fillRect(0, 0, cw, ch);
    
    const earth3D = project(ex, ey, ez);
    const moon3D = project(mx, my, mz);
    const sun3D = project(0, 0, 0);

    ctxEcl.save();
    
    // A. Draw Earth Orbit Ring
    ctxEcl.beginPath();
    for (let a = 0; a <= Math.PI*2; a += 0.1) {
      const p = project(earthOrbitRadius * Math.cos(a), earthOrbitRadius * Math.sin(a), 0);
      if (a === 0) ctxEcl.moveTo(p.x, p.y);
      else ctxEcl.lineTo(p.x, p.y);
    }
    ctxEcl.strokeStyle = 'rgba(255,255,255,0.2)';
    ctxEcl.stroke();
    
    // B. Draw Moon Orbit Ring (Tilted) around Earth
    ctxEcl.beginPath();
    for (let a = 0; a <= Math.PI*2; a += 0.1) {
      const px = moonOrbitRadius * Math.cos(a);
      const py = moonOrbitRadius * Math.sin(a);
      const pz = py * Math.tan(tiltAngle);
      const p = project(ex + px, ey + py, ez + pz);
      if (a === 0) ctxEcl.moveTo(p.x, p.y);
      else ctxEcl.lineTo(p.x, p.y);
    }
    ctxEcl.strokeStyle = useTilt ? 'rgba(100,200,255,0.5)' : 'rgba(200,200,200,0.5)';
    ctxEcl.stroke();
    
    // Line of Nodes (交点)
    const node1 = project(ex + moonOrbitRadius, ey, ez);
    const node2 = project(ex - moonOrbitRadius, ey, ez);
    ctxEcl.beginPath(); ctxEcl.moveTo(node1.x, node1.y); ctxEcl.lineTo(node2.x, node2.y);
    ctxEcl.strokeStyle = 'rgba(255,0,0,0.5)'; ctxEcl.setLineDash([3,3]); ctxEcl.stroke(); ctxEcl.setLineDash([]);
    ctxEcl.fillStyle = 'rgba(255,0,0,0.8)'; ctxEcl.font = '10px sans-serif'; ctxEcl.fillText('交点', node1.x, node1.y-5);
    
    // C. Draw Sun, Earth, Moon (sort by Y depth for simple z-indexing)
    // Actually in our projection, lower Y in 3D is further away? 
    // Wait, project() uses `y * viewPitch`. So larger y is lower on screen (closer).
    const objects = [
      { name: 'Sun', x: 0, y: 0, z: 0, r: sunR, color: '#ffaa00' },
      { name: 'Earth', x: ex, y: ey, z: ez, r: earthR, color: '#3399ff' },
      { name: 'Moon', x: mx, y: my, z: mz, r: moonR, color: '#dddddd' }
    ];
    
    // Sort by 3D Y coordinate (which maps to depth in our setup where Y is away/towards)
    objects.sort((a, b) => a.y - b.y);
    
    objects.forEach(obj => {
      const p = project(obj.x, obj.y, obj.z);
      
      // Draw shadow cones behind Sun
      if (obj.name === 'Sun') {
        // We draw shadow cones originating from Earth and Moon
        // Earth Shadow
        drawShadowCone(ex, ey, ez, earthR, 'rgba(0,0,0,0.5)');
        // Moon Shadow
        drawShadowCone(mx, my, mz, moonR, 'rgba(0,0,0,0.8)');
      }
      
      ctxEcl.beginPath();
      ctxEcl.arc(p.x, p.y, obj.r, 0, Math.PI*2);
      ctxEcl.fillStyle = obj.color;
      
      if (obj.name === 'Sun') {
        ctxEcl.shadowBlur = 20; ctxEcl.shadowColor = '#ffaa00';
      } else {
        ctxEcl.shadowBlur = 0;
      }
      ctxEcl.fill();
      ctxEcl.shadowBlur = 0;
      
      // Label
      ctxEcl.fillStyle = '#fff'; ctxEcl.font = '12px sans-serif';
      ctxEcl.fillText(obj.name === 'Sun' ? '太陽' : (obj.name === 'Earth' ? '地球' : '月'), p.x + obj.r + 5, p.y);
    });
    
    function drawShadowCone(ox, oy, oz, objR, color) {
      // Shadow points away from Sun (0,0,0)
      const dist = Math.sqrt(ox*ox + oy*oy + oz*oz);
      if (dist === 0) return;
      
      const dirX = ox / dist;
      const dirY = oy / dist;
      const dirZ = oz / dist;
      
      const shadowLen = objR * 10;
      
      // Base of cone is perpendicular to dir
      // Simplification: just draw a line and some width in 2D
      const pStart = project(ox, oy, oz);
      const pEnd = project(ox + dirX * shadowLen, oy + dirY * shadowLen, oz + dirZ * shadowLen);
      
      ctxEcl.beginPath();
      ctxEcl.moveTo(pStart.x, pStart.y);
      ctxEcl.lineTo(pEnd.x - objR*dirY, pEnd.y + objR*dirX); // rough approx of width
      ctxEcl.lineTo(pEnd.x + objR*dirY, pEnd.y - objR*dirX);
      ctxEcl.fillStyle = color;
      ctxEcl.fill();
    }
    
    ctxEcl.restore();
    
    // ----------------------------------------
    // Collision Detection & View Panel
    // ----------------------------------------
    // To check eclipse, we check if Moon is in Earth's shadow (Lunar Eclipse)
    // or if Moon is between Earth and Sun (Solar Eclipse).
    
    // Lunar Eclipse: Moon must be near (ex * k, ey * k, ez * k) where k > 1.
    // Solar Eclipse: Moon must be near (ex * k, ey * k, ez * k) where 0 < k < 1.
    
    // Calculate angle difference from Sun-Earth line
    const earthAngle = Math.atan2(ey, ex);
    const moonGlobalAngle = Math.atan2(my, mx);
    
    // Angle diff relative to Earth (where is Moon from Earth vs Sun from Earth)
    // Sun is at (0,0). So vector from Earth to Sun is (-ex, -ey).
    const sunAngleFromEarth = Math.atan2(-ey, -ex);
    
    let diff = moonTheta - sunAngleFromEarth;
    // Normalize to 0 - 2PI
    while (diff < 0) diff += Math.PI * 2;
    while (diff >= Math.PI * 2) diff -= Math.PI * 2;
    const diffDeg = diff * 180 / Math.PI;
    
    // Check Z distance at Full Moon / New Moon
    const zDist = mz - ez; // vertical distance from Earth's orbital plane
    
    let status = "日食も月食も起きていない";
    let color = "#fff";
    
    let isSolar = false;
    let isLunar = false;
    
    // diffDeg: 0 is New Moon, 180 is Full Moon.
    let isNewMoon = diffDeg > 350 || diffDeg < 10;
    let isFullMoon = diffDeg > 170 && diffDeg < 190;
    
    if (isNewMoon) {
       if (Math.abs(zDist) < 8) {
          status = "🌞 日食発生！（月が太陽を隠している）";
          color = "#ff3333";
          isSolar = true;
       } else {
          status = "❌ 日食はおきない（月が軌道の傾きにより太陽からズレている）";
          color = "#aaaaaa";
       }
    } else if (isFullMoon) {
       if (Math.abs(zDist) < 8) {
          status = "🌑 月食発生！（月が地球の影に入った）";
          color = "#ff3333";
          isLunar = true;
       } else {
          status = "❌ 月食はおきない（月が軌道の傾きにより地球の影からズレている）";
          color = "#aaaaaa";
       }
    } else {
       status = "日食も月食も起きていない";
       color = "#fff";
    }
    
    eclStatus.textContent = status;
    eclStatus.style.color = color;
    
    // Draw small dot on the Moon to look nice
    ctxEcl.beginPath(); ctxEcl.arc(moon3D.x, moon3D.y, 1, 0, Math.PI*2); 
    ctxEcl.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctxEcl.fill();
    
    // Draw View Canvas (Sub screen)
    ctxView.fillStyle = '#000';
    ctxView.fillRect(0, 0, viewCanvas.width, viewCanvas.height);
    
    const vcx = viewCanvas.width / 2;
    const vcy = viewCanvas.height / 2;
    
    if (diffDeg > 90 && diffDeg < 270) {
      // Looking away from sun (Night, where Full Moon happens)
      ctxView.fillStyle = '#333';
      ctxView.font = '12px sans-serif';
      ctxView.fillText('真夜中の空', 5, 15);
      
      let angleDiff = diffDeg - 180;
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;
      const drawX = vcx - (angleDiff * 3); // Negative because increasing angle goes left 
      
      // Draw Earth's shadow always in the center (anti-solar point)
      ctxView.beginPath(); ctxView.arc(vcx, vcy, 40, 0, Math.PI*2);
      ctxView.fillStyle = 'rgba(0,0,0,0.6)';
      ctxView.fill();
      ctxView.strokeStyle = 'rgba(255,100,100,0.3)';
      ctxView.stroke();

      // Draw Moon
      const drawY = vcy - (zDist * 2);
      ctxView.beginPath(); ctxView.arc(drawX, drawY, 20, 0, Math.PI*2);
      
      // If Moon is inside shadow, make it red
      const distToCenter = Math.hypot(drawX - vcx, drawY - vcy);
      if (distToCenter < 40) {
        ctxView.fillStyle = '#aa3333'; // Blood moon
      } else {
        ctxView.fillStyle = '#eeeeee';
      }
      ctxView.fill();
      
    } else {
      // Looking towards sun (Day, where New Moon happens)
      ctxView.fillStyle = '#333';
      ctxView.font = '12px sans-serif';
      ctxView.fillText('昼間の空', 5, 15);
      
      // Draw Sun
      ctxView.beginPath(); ctxView.arc(vcx, vcy, 30, 0, Math.PI*2);
      ctxView.fillStyle = '#ffaa00'; ctxView.fill();
      ctxView.shadowBlur = 20; ctxView.shadowColor = '#ffaa00'; ctxView.fill();
      ctxView.shadowBlur = 0;
      
      let angleDiff = diffDeg;
      if (angleDiff > 180) angleDiff -= 360;
      const drawX = vcx - (angleDiff * 3);
      
      // Draw Moon passing in front
      const drawY = vcy - (zDist * 2);
      ctxView.beginPath(); ctxView.arc(drawX, drawY, 28, 0, Math.PI*2);
      ctxView.fillStyle = '#111'; // Dark silhouette of Moon
      ctxView.fill();
    }
  }
  
  earthOrbitSlider.addEventListener('input', drawEclipses);
  moonOrbitSlider.addEventListener('input', drawEclipses);
  tiltToggle.addEventListener('change', drawEclipses);
  
  drawEclipses();
}


// ==========================================
// 5. 地軸の傾きと季節の変化 (Simulation 5)
// ==========================================
const seasonsCanvas = document.getElementById('seasons-canvas');
if (seasonsCanvas) {
  const ctxSeasons = seasonsCanvas.getContext('2d');
  const seasonBtns = document.querySelectorAll('.season-view-btn');
  const timeSlider = document.getElementById('seasons-time-slider');
  const playBtn = document.getElementById('seasons-play-btn');
  
  let currentSeason = 'summer';
  let isPlaying = true;
  let simTime = 12; // 0 to 24 hours
  let lastFrameTime = performance.now();
  let animId = null;
  
  const cw = seasonsCanvas.width;
  const ch = seasonsCanvas.height;
  const cx = cw / 2 + 50; // shift right slightly to leave room for sun rays
  const cy = ch / 2;
  const R = 130; // Earth radius
  
  // Japan latitude
  const latJp = 35 * Math.PI / 180;
  
  // Interaction
  seasonBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      seasonBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentSeason = e.target.dataset.season;
      drawSeasons();
    });
  });
  
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      playBtn.textContent = isPlaying ? '⏸ 一時停止' : '▶ 再生';
      if (isPlaying) {
        lastFrameTime = performance.now();
        animateSeasons();
      } else {
        cancelAnimationFrame(animId);
      }
    });
  }
  
  if (timeSlider) {
    timeSlider.addEventListener('input', () => {
      simTime = parseFloat(timeSlider.value);
      drawSeasons();
    });
  }
  
  function getTilt() {
    // Sun comes from LEFT (-X). 
    // Positive tilt means x1 = x0*cos - z0*sin.
    // North pole is z0=R, x0=0.
    // x1 = x0*cos(tilt) - z0*sin(tilt)
    // If tilt is positive, x1 is NEGATIVE for the North Pole (towards Sun at -X -> Summer).
    if (currentSeason === 'summer') return 23.4 * Math.PI / 180; 
    if (currentSeason === 'winter') return -23.4 * Math.PI / 180; 
    return 0; 
  }
  
  // 3D projection for Earth surface
  // We project a point (x,y,z) rotated by tilt.
  // Original coords: z is UP (North Pole), x is Right, y is Out of screen
  // Sun is at -X.
  function projectEarth(lat, lon, tilt) {
    // 1. Sphere coords
    const x0 = R * Math.cos(lat) * Math.cos(lon);
    const y0 = R * Math.cos(lat) * Math.sin(lon); // y0 > 0 is front
    const z0 = R * Math.sin(lat);
    
    // 2. Apply tilt around Y axis
    // Tilt negative -> rotates North Pole left (towards -X)
    const x1 = x0 * Math.cos(tilt) - z0 * Math.sin(tilt);
    const y1 = y0;
    const z1 = x0 * Math.sin(tilt) + z0 * Math.cos(tilt);
    
    return { x: cx + x1, y: cy - z1, depth: y1, rx: x1, ry: y1, rz: z1 };
  }
  
  function drawSeasons() {
    ctxSeasons.fillStyle = '#050510';
    ctxSeasons.fillRect(0, 0, cw, ch);
    
    const tilt = getTilt();
    
    // ----- Draw Sun Rays -----
    ctxSeasons.strokeStyle = 'rgba(255, 200, 50, 0.6)';
    ctxSeasons.lineWidth = 3;
    ctxSeasons.beginPath();
    for(let i = -100; i <= 100; i += 30) {
      // draw rays from left
      ctxSeasons.moveTo(20, cy + i);
      // ray ends at the terminator or edge of earth
      ctxSeasons.lineTo(cx - 30, cy + i);
      
      // arrowhead
      ctxSeasons.moveTo(cx - 40, cy + i - 5);
      ctxSeasons.lineTo(cx - 30, cy + i);
      ctxSeasons.lineTo(cx - 40, cy + i + 5);
    }
    ctxSeasons.stroke();
    
    ctxSeasons.fillStyle = '#ffcc00';
    ctxSeasons.font = 'bold 20px sans-serif';
    ctxSeasons.fillText('太 陽 の 光', 30, 40);
    
    // ----- Draw Earth Back Half -----
    // To make it look 3D, we can draw the whole sphere, but we will use a gradient
    ctxSeasons.save();
    
    // Base Earth Circle
    ctxSeasons.beginPath();
    ctxSeasons.arc(cx, cy, R, 0, Math.PI*2);
    ctxSeasons.clip();
    
    // Draw Day/Night
    // Sun comes from -X direction.
    // In our projection, the un-rotated X determines Day/Night?
    // No, the light hits the rotated sphere from the left.
    // So if rx < 0, it's Day. If rx > 0, it's Night.
    // Since tilt is just in XY plane (screen), the terminator is exactly a vertical line passing through (cx, cy)!
    
    ctxSeasons.fillStyle = '#66ccff'; // Day
    ctxSeasons.fillRect(0, 0, cx, ch);
    
    ctxSeasons.fillStyle = 'rgba(10, 20, 40, 0.9)'; // Night
    ctxSeasons.fillRect(cx, 0, cw - cx, ch);
    
    // Draw Earth Texture/Continents? Too complex. Just blue oceans.
    
    // Draw Latitude Lines (Back)
    ctxSeasons.lineWidth = 1;
    ctxSeasons.strokeStyle = 'rgba(255,255,255,0.2)';
    
    const drawLatitude = (lat, color, width, drawFront) => {
      ctxSeasons.beginPath();
      let first = true;
      for (let lon = 0; lon <= Math.PI*2; lon += 0.05) {
        const p = projectEarth(lat, lon, tilt);
        const isFront = p.depth > 0;
        if (isFront === drawFront) {
          if (first) { ctxSeasons.moveTo(p.x, p.y); first = false; }
          else ctxSeasons.lineTo(p.x, p.y);
        } else {
          first = true;
        }
      }
      ctxSeasons.strokeStyle = color;
      ctxSeasons.lineWidth = width;
      ctxSeasons.stroke();
    };
    
    // We modify drawLatitude to color day and night differently for the Japan line
    const drawDayNightLatitude = (lat, tilt, drawFront) => {
      ctxSeasons.lineWidth = 3;
      let first = true;
      for (let lon = 0; lon <= Math.PI*2; lon += 0.05) {
        const p = projectEarth(lat, lon, tilt);
        const isFront = p.depth > 0;
        
        if (isFront === drawFront) {
          if (first) { ctxSeasons.beginPath(); ctxSeasons.moveTo(p.x, p.y); first = false; }
          else {
            // Color based on rx (Day is rx < 0, Night is rx > 0)
            const isDay = p.rx <= 0;
            ctxSeasons.lineTo(p.x, p.y);
            // We stroke segment by segment to change color
            ctxSeasons.strokeStyle = isDay ? (isFront ? '#33ff33' : 'rgba(50,255,50,0.3)') : (isFront ? '#006600' : 'rgba(0,100,0,0.3)');
            ctxSeasons.stroke();
            ctxSeasons.beginPath();
            ctxSeasons.moveTo(p.x, p.y);
          }
        } else {
          first = true;
        }
      }
    };

    // Equator
    drawLatitude(0, 'rgba(255,50,50,0.3)', 2, false);
    drawLatitude(0, 'rgba(255,50,50,0.8)', 2, true);
    
    // Japan line with Day/Night colors
    drawDayNightLatitude(latJp, tilt, false); // Back
    drawDayNightLatitude(latJp, tilt, true);  // Front

    
    // Draw Axis
    const axisTop = projectEarth(Math.PI/2, 0, tilt);
    const axisBot = projectEarth(-Math.PI/2, 0, tilt);
    
    ctxSeasons.restore(); // Remove clip
    
    // Draw Axis Line extending out
    ctxSeasons.beginPath();
    ctxSeasons.moveTo(axisBot.x + (axisBot.x - cx)*0.2, axisBot.y + (axisBot.y - cy)*0.2);
    ctxSeasons.lineTo(axisTop.x + (axisTop.x - cx)*0.2, axisTop.y + (axisTop.y - cy)*0.2);
    ctxSeasons.strokeStyle = '#fff';
    ctxSeasons.lineWidth = 2;
    ctxSeasons.stroke();
    
    // Draw North Pole Label
    ctxSeasons.fillStyle = '#fff';
    ctxSeasons.font = '14px sans-serif';
    ctxSeasons.fillText('北極', axisTop.x - 10, axisTop.y - 15);
    ctxSeasons.fillText('地軸', axisTop.x + 20, axisTop.y - 5);
    
    // Draw Japan Marker
    // lonJp mapping: 0h = midnight (+X), 6h = sunrise (Back), 12h = noon (-X, left), 18h = sunset (Front)
    // Earth rotates CCW from North pole, so angle decreases in our right-handed coordinate system
    const lonJp = -(simTime / 12) * Math.PI;
    const pJp = projectEarth(latJp, lonJp, tilt);
    const isFront = pJp.depth > 0;
    
    ctxSeasons.globalAlpha = isFront ? 1.0 : 0.2;
    
    ctxSeasons.beginPath();
    ctxSeasons.arc(pJp.x, pJp.y, isFront ? 6 : 4, 0, Math.PI*2);
    // Color based on rx (Day is rx <= 0)
    const isJpDay = pJp.rx <= 0;
    ctxSeasons.fillStyle = isJpDay ? '#ffff00' : '#444400';
    ctxSeasons.fill();
    ctxSeasons.strokeStyle = '#000';
    ctxSeasons.stroke();
    
    // Add text for Japan
    ctxSeasons.fillStyle = '#fff';
    ctxSeasons.font = 'bold 12px sans-serif';
    ctxSeasons.fillText('日本', pJp.x + 10, pJp.y - 10);
    
    ctxSeasons.globalAlpha = 1.0;
    
    // Label for Equator and Lat
    const pEq = projectEarth(0, 0, tilt);
    ctxSeasons.fillStyle = '#ff8888';
    ctxSeasons.fillText('赤道', pEq.x + 10, pEq.y);
    
    // ----- Draw Noon Elevation Angle (南中高度) -----
    // Only highlight when Japan is near noon (simTime approx 12)
    // Noon in our simulation is when lonJp = PI. So simTime = 0 is noon?
    // Wait, lonJp = Math.PI - (simTime / 24) * 2PI.
    // If simTime = 12, lonJp = 0 (Midnight, +X).
    // If simTime = 0 or 24, lonJp = PI (-X, Noon).
    // Let's adjust so simTime = 12 is NOON.
    // Noon means it's on the extreme left (sun side).
    // Show noon elevation graphic always, but placed at the noon position
    const pNoon = projectEarth(latJp, Math.PI, tilt); // Extreme left point
    
    // Ground Tangent Vector at noon
    // At noon (lon=PI), original pos: x0 = -R*cos(lat), y0 = 0, z0 = R*sin(lat).
    // The "Up" vector (Normal) is exactly the position vector from center!
    // Normal = (-cos(lat), 0, sin(lat))
    // Rotated Normal by tilt:
    const nx = -Math.cos(latJp) * Math.cos(tilt) - Math.sin(latJp) * Math.sin(tilt);
    const ny = 0;
    const nz = -Math.cos(latJp) * Math.sin(tilt) + Math.sin(latJp) * Math.cos(tilt);
    
    // Ground is perpendicular to Normal.
    // In the 2D plane (XY screen), the Normal is (nx, -nz).
    // So the ground tangent is (nz, nx).
    const groundDir = { x: nz, y: nx };
    // Normalize
    const gl = Math.hypot(groundDir.x, groundDir.y);
    groundDir.x /= gl;
    groundDir.y /= gl;
    
    const groundLength = 60;
    const g1x = pNoon.x - groundDir.x * groundLength;
    const g1y = pNoon.y - groundDir.y * groundLength;
    const g2x = pNoon.x + groundDir.x * groundLength;
    const g2y = pNoon.y + groundDir.y * groundLength;
    
    ctxSeasons.beginPath();
    ctxSeasons.moveTo(g1x, g1y);
    ctxSeasons.lineTo(g2x, g2y);
    ctxSeasons.strokeStyle = '#aaaaaa';
    ctxSeasons.lineWidth = 2;
    ctxSeasons.stroke();
    ctxSeasons.fillStyle = '#aaaaaa';
    ctxSeasons.fillText('地面', g2x + 5, g2y + 5);
    
    // Sun Ray at noon
    // Sun ray is horizontal (coming from left).
    ctxSeasons.beginPath();
    ctxSeasons.moveTo(pNoon.x - 100, pNoon.y);
    ctxSeasons.lineTo(pNoon.x, pNoon.y);
    ctxSeasons.strokeStyle = 'rgba(255, 200, 50, 0.8)';
    ctxSeasons.stroke();
    
    // Angle Arc
    // We want to draw the angle between ground and horizontal ray.
    // The ray comes from left (-X direction, angle PI).
    // But relative to the point pNoon, the ray comes from the left.
    // So the angle is between Ground and the Horizontal line towards the left.
    // Let's compute angle
    // ground vector pointing "South" (away from North pole)
    // normal is up. Ground vector pointing south is (nz, nx) if nx is negative?
    // Let's just use atan2.
    // Horizontal sun ray vector pointing RIGHT (into the point): (1, 0)
    // The ground tangent pointing "south" is (nz, nx)
    let angleSun = 0; // standard angle for (1,0) is 0
    let angleGround = Math.atan2(groundDir.y, groundDir.x);
    // If the ground points left, we reverse it
    if (groundDir.x < 0) {
      angleGround = Math.atan2(-groundDir.y, -groundDir.x);
    }
    
    ctxSeasons.beginPath();
    ctxSeasons.arc(pNoon.x, pNoon.y, 30, Math.min(0, angleGround), Math.max(0, angleGround));
    ctxSeasons.strokeStyle = '#ffaa00';
    ctxSeasons.stroke();
    
    ctxSeasons.fillStyle = '#ffaa00';
    ctxSeasons.font = '14px sans-serif';
    ctxSeasons.fillText('南中高度', pNoon.x - 45, pNoon.y + 25);
    
    // Calculate noon altitude (90 - lat + declination)
    const declination = -tilt * 180 / Math.PI; // summer: tilt is negative -> decl is positive
    const altitude = 90 - 35 + declination;
    ctxSeasons.fillText(altitude.toFixed(1) + '°', pNoon.x - 45, pNoon.y + 45);
    
    // UI Updates
    const h = Math.floor(simTime);
    const m = Math.floor((simTime - h) * 60);
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    ctxSeasons.fillStyle = '#fff';
    ctxSeasons.font = 'bold 16px sans-serif';
    ctxSeasons.fillText(`時刻: ${timeStr}`, cw - 120, 30);
    
    const seasonNames = {
      'summer': '夏至（昼が長い・南中高度が高い）',
      'spring-autumn': '春分・秋分（昼夜が同じ・南中高度が中くらい）',
      'winter': '冬至（夜が長い・南中高度が低い）'
    };
    ctxSeasons.fillText(`季節: ${seasonNames[currentSeason]}`, 20, ch - 20);
    
    // Explicitly show daytime length indicator
    ctxSeasons.fillStyle = '#33ff33';
    ctxSeasons.font = 'bold 14px sans-serif';
    ctxSeasons.fillText('■ 昼の長さ（明るい緑）', 20, ch - 45);
    ctxSeasons.fillStyle = '#006600';
    ctxSeasons.fillText('■ 夜の長さ（暗い緑）', 180, ch - 45);

  }
  
  function animateSeasons() {
    if (!isPlaying) return;
    const now = performance.now();
    const dt = (now - lastFrameTime) / 1000;
    lastFrameTime = now;
    
    simTime += dt * 1.5; // 1.5 hours per second
    if (simTime >= 24) simTime -= 24;
    
    if (timeSlider) timeSlider.value = simTime;
    
    drawSeasons();
    animId = requestAnimationFrame(animateSeasons);
  }
  
  animateSeasons();
  
  // Custom Math fix for lonJp
  // We want simTime=12 to be lonJp=Math.PI (Noon)
  // We want simTime=0 to be lonJp=0 (Midnight)
  // lonJp = Math.PI - (simTime - 12)/12 * Math.PI = Math.PI * (24 - simTime) / 12 ... wait.
  // We can just redefine inside drawSeasons:
  // const lonJp = (12 - simTime) / 12 * Math.PI;
  // Let's modify the file string dynamically.
}

// ==========================================
// 8. 日食・月食のしくみ (Simulation 8)
// ==========================================
const eclipsesCanvas = document.getElementById('eclipses-canvas');
if (eclipsesCanvas) {
  const ctxE = eclipsesCanvas.getContext('2d');
  const viewCanvas = document.getElementById('eclipse-view-canvas');
  const ctxV = viewCanvas.getContext('2d');
  
  const earthOrbitSlider = document.getElementById('earth-orbit-slider');
  const moonOrbitSlider = document.getElementById('moon-orbit-slider');
  const tiltToggle = document.getElementById('tilt-toggle');
  const statusText = document.getElementById('eclipse-status');
  
  let animIdEclipses = null;
  
  const cw = eclipsesCanvas.width;
  const ch = eclipsesCanvas.height;
  const cx = cw / 2;
  const cy = ch / 2;
  
  const earthRadius = 20;
  const moonRadius = 6;
  const orbitRadius = 150;
  const tiltAngle = 15 * Math.PI / 180; // Exaggerated 15 degrees
  
  function drawEclipses() {
    const earthAngle = parseFloat(earthOrbitSlider.value) * Math.PI / 180; 
    const moonAngle = parseFloat(moonOrbitSlider.value) * Math.PI / 180;
    const isTilted = tiltToggle.checked;
    
    ctxE.clearRect(0, 0, cw, ch);
    ctxV.clearRect(0, 0, viewCanvas.width, viewCanvas.height);
    
    const viewTilt = 20 * Math.PI / 180; 
    
    // Sun rays from the left
    ctxE.strokeStyle = 'rgba(255, 200, 50, 0.4)';
    ctxE.lineWidth = 2;
    ctxE.beginPath();
    for(let i = -100; i <= 100; i += 20) {
      ctxE.moveTo(0, cy + i * Math.cos(viewTilt));
      ctxE.lineTo(cx - 30, cy + i * Math.cos(viewTilt));
    }
    ctxE.stroke();
    
    function project3D(x, y, z) {
      const yp = y * Math.cos(viewTilt) - z * Math.sin(viewTilt);
      const zp = y * Math.sin(viewTilt) + z * Math.cos(viewTilt);
      return { px: cx + x, py: cy - yp, pz: zp };
    }
    
    // Moon orbit path
    ctxE.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctxE.lineWidth = 1;
    ctxE.beginPath();
    for (let a = 0; a <= Math.PI * 2; a += 0.05) {
      let mx = orbitRadius * Math.cos(a);
      let my = orbitRadius * Math.sin(a);
      let mz = 0;
      
      if (isTilted) {
        let tx = mx * Math.cos(-earthAngle) - my * Math.sin(-earthAngle);
        let ty = mx * Math.sin(-earthAngle) + my * Math.cos(-earthAngle);
        let tz = ty * Math.sin(tiltAngle);
        ty = ty * Math.cos(tiltAngle);
        mx = tx * Math.cos(earthAngle) - ty * Math.sin(earthAngle);
        my = tx * Math.sin(earthAngle) + ty * Math.cos(earthAngle);
        mz = tz;
      }
      
      const p = project3D(mx, my, mz);
      if (a === 0) ctxE.moveTo(p.px, p.py);
      else ctxE.lineTo(p.px, p.py);
    }
    ctxE.closePath();
    ctxE.stroke();
    
    // Moon position
    let moonX = orbitRadius * Math.cos(moonAngle);
    let moonY = orbitRadius * Math.sin(moonAngle);
    let moonZ = 0;
    
    if (isTilted) {
      let tx = moonX * Math.cos(-earthAngle) - moonY * Math.sin(-earthAngle);
      let ty = moonX * Math.sin(-earthAngle) + moonY * Math.cos(-earthAngle);
      let tz = ty * Math.sin(tiltAngle);
      ty = ty * Math.cos(tiltAngle);
      moonX = tx * Math.cos(earthAngle) - ty * Math.sin(earthAngle);
      moonY = tx * Math.sin(earthAngle) + ty * Math.cos(earthAngle);
      moonZ = tz;
    }
    
    const pMoon = project3D(moonX, moonY, moonZ);
    const pE = project3D(0, 0, 0);
    
    // Earth Umbra
    ctxE.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctxE.beginPath();
    const shadowLen = orbitRadius + 50;
    const shadowWidth = earthRadius * 0.8;
    const pS1 = project3D(shadowLen, -shadowWidth, 0);
    const pS2 = project3D(shadowLen, shadowWidth, 0);
    ctxE.moveTo(pE.px, pE.py - earthRadius);
    ctxE.lineTo(pS1.px, pS1.py);
    ctxE.lineTo(pS2.px, pS2.py);
    ctxE.lineTo(pE.px, pE.py + earthRadius);
    ctxE.fill();
    
    // Earth
    ctxE.fillStyle = '#4488ff';
    ctxE.beginPath();
    ctxE.arc(pE.px, pE.py, earthRadius, 0, Math.PI*2);
    ctxE.fill();
    ctxE.fillStyle = 'rgba(0,0,0,0.5)';
    ctxE.beginPath();
    ctxE.arc(pE.px, pE.py, earthRadius, -Math.PI/2, Math.PI/2);
    ctxE.fill();
    
    // Moon Umbra
    ctxE.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctxE.beginPath();
    const mS1 = project3D(moonX + orbitRadius, moonY - moonRadius, moonZ);
    const mS2 = project3D(moonX + orbitRadius, moonY + moonRadius, moonZ);
    ctxE.moveTo(pMoon.px, pMoon.py - moonRadius);
    ctxE.lineTo(mS1.px, mS1.py);
    ctxE.lineTo(mS2.px, mS2.py);
    ctxE.lineTo(pMoon.px, pMoon.py + moonRadius);
    ctxE.fill();
    
    // Moon
    ctxE.fillStyle = '#dddddd';
    ctxE.beginPath();
    ctxE.arc(pMoon.px, pMoon.py, moonRadius, 0, Math.PI*2);
    ctxE.fill();
    ctxE.fillStyle = 'rgba(0,0,0,0.6)';
    ctxE.beginPath();
    ctxE.arc(pMoon.px, pMoon.py, moonRadius, -Math.PI/2, Math.PI/2);
    ctxE.fill();
    
    // Collision & Status
    let status = "日食も月食も起きていない";
    let statusColor = "#aaaaaa";
    let eclipseType = 'none';
    
    const sunApparentRadius = 40;
    const moonApparentRadius = 40;
    const shadowApparentRadius = 90;
    const viewScale = 3;
    
    let dist = Math.sqrt(moonY*moonY + moonZ*moonZ);
    let viewDist = dist * viewScale;
    
    if (moonX < -orbitRadius * 0.9) {
      if (viewDist < 10) {
        status = "皆既日食！";
        statusColor = "#ff4444";
        eclipseType = 'solar-total';
      } else if (viewDist < sunApparentRadius + moonApparentRadius) {
        status = "部分日食！";
        statusColor = "#ffaa00";
        eclipseType = 'solar-partial';
      }
    } else if (moonX > orbitRadius * 0.9) {
      if (viewDist < shadowApparentRadius - moonApparentRadius) {
        status = "皆既月食！";
        statusColor = "#ff4444";
        eclipseType = 'lunar-total';
      } else if (viewDist < shadowApparentRadius + moonApparentRadius) {
        status = "部分月食！";
        statusColor = "#ffaa00";
        eclipseType = 'lunar-partial';
      }
    }
    
    statusText.innerText = status;
    statusText.style.color = statusColor;
    
    // View Canvas
    const vcx = viewCanvas.width / 2;
    const vcy = viewCanvas.height / 2;
    
    ctxV.fillStyle = (eclipseType === 'solar-total') ? '#111' : '#4488ff';
    if (moonX > 0) ctxV.fillStyle = '#050510'; 
    ctxV.fillRect(0, 0, viewCanvas.width, viewCanvas.height);
    
    if (moonX < 0) {
      // Sun
      ctxV.fillStyle = '#ffcc00';
      ctxV.beginPath();
      ctxV.arc(vcx, vcy, sunApparentRadius, 0, Math.PI*2);
      ctxV.fill();
      // Moon
      ctxV.fillStyle = '#111';
      ctxV.beginPath();
      ctxV.arc(vcx - moonY * viewScale, vcy - moonZ * viewScale, moonApparentRadius, 0, Math.PI*2);
      ctxV.fill();
    } else {
      // Earth Shadow
      ctxV.fillStyle = 'rgba(0,0,0,0.6)';
      ctxV.beginPath();
      ctxV.arc(vcx, vcy, shadowApparentRadius, 0, Math.PI*2);
      ctxV.fill();
      // Moon
      ctxV.fillStyle = eclipseType.startsWith('lunar') ? '#aa3322' : '#eeeeee';
      if (eclipseType === 'lunar-partial') ctxV.fillStyle = '#ddaa88';
      ctxV.beginPath();
      ctxV.arc(vcx + moonY * viewScale, vcy - moonZ * viewScale, moonApparentRadius, 0, Math.PI*2);
      ctxV.fill();
    }
  }
  
  function animateEclipses() {
    drawEclipses();
    animIdEclipses = requestAnimationFrame(animateEclipses);
  }
  
  earthOrbitSlider.addEventListener('input', drawEclipses);
  moonOrbitSlider.addEventListener('input', drawEclipses);
  tiltToggle.addEventListener('change', drawEclipses);
  
  const observer = new MutationObserver(() => {
    if (document.getElementById('sim-eclipses').classList.contains('active')) {
      if (!animIdEclipses) animateEclipses();
    } else {
      if (animIdEclipses) {
        cancelAnimationFrame(animIdEclipses);
        animIdEclipses = null;
      }
    }
  });
  observer.observe(document.getElementById('sim-eclipses'), { attributes: true, attributeFilter: ['class'] });
  
  if (document.getElementById('sim-eclipses').classList.contains('active')) {
    animateEclipses();
  }
}
