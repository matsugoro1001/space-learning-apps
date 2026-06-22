import re

with open('/Users/goromatsunaga2/Library/CloudStorage/GoogleDrive-matsunaga@jenaplanschool.ac.jp/マイドライブ/01理科/03中3理科/02宇宙/space-simulations/custom-sims.js', 'r') as f:
    code = f.read()

# 1. Revert getTilt
tilt_pattern = r"function getTilt\(\) \{\n.*?return 0; // Spring/Autumn\n  \}"
tilt_replacement = """function getTilt() {
    if (currentSeason === 'summer') return 23.4 * Math.PI / 180; 
    if (currentSeason === 'winter') return -23.4 * Math.PI / 180; 
    return 0; 
  }"""
code = re.sub(tilt_pattern, tilt_replacement, code, flags=re.DOTALL)

# 2. Revert sunSide and sun rays
sun_rays_pattern = r"(// ----- Draw Sun Rays -----.*?ctxSeasons.fillText\('太 陽 の 光', cw - 150, 40\);\n\s*\})"
sun_rays_replacement = """// ----- Draw Sun Rays -----
    ctxSeasons.strokeStyle = 'rgba(255, 200, 50, 0.6)';
    ctxSeasons.lineWidth = 3;
    ctxSeasons.beginPath();
    for(let i = -100; i <= 100; i += 30) {
      // draw rays from left
      ctxSeasons.moveTo(20, cy + i);
      ctxSeasons.lineTo(cx - 30, cy + i);
      // arrowhead
      ctxSeasons.moveTo(cx - 40, cy + i - 5);
      ctxSeasons.lineTo(cx - 30, cy + i);
      ctxSeasons.lineTo(cx - 40, cy + i + 5);
    }
    ctxSeasons.stroke();
    
    ctxSeasons.fillStyle = '#ffcc00';
    ctxSeasons.font = 'bold 20px sans-serif';
    ctxSeasons.fillText('太 陽 の 光', 30, 40);"""
code = re.sub(sun_rays_pattern, sun_rays_replacement, code, flags=re.DOTALL)

# 3. Revert Day/Night background
dn_pattern = r"(ctxSeasons.fillStyle = '#66ccff'; // Day\n\s*ctxSeasons.fillRect\(0, 0, cw, ch\);\n\s*ctxSeasons.fillStyle = 'rgba\(10, 20, 40, 0.9\)'; // Night\n\s*if \(sunSide === 'left'\) \{\n\s*ctxSeasons.fillRect\(cx, 0, cw - cx, ch\);\n\s*\} else \{\n\s*ctxSeasons.fillRect\(0, 0, cx, ch\);\n\s*\})"
dn_replacement = """ctxSeasons.fillStyle = '#66ccff'; // Day
    ctxSeasons.fillRect(0, 0, cx, ch);
    
    ctxSeasons.fillStyle = 'rgba(10, 20, 40, 0.9)'; // Night
    ctxSeasons.fillRect(cx, 0, cw - cx, ch);"""
code = re.sub(dn_pattern, dn_replacement, code, flags=re.DOTALL)

# 4. Revert isDay
is_day_pattern = r"const isDay = \(sunSide === 'left'\) \? \(p.rx <= 0\) : \(p.rx >= 0\);"
is_day_replacement = r"const isDay = p.rx <= 0;"
code = code.replace(is_day_pattern, is_day_replacement)

is_jp_day_pattern = r"const isJpDay = \(sunSide === 'left'\) \? \(pJp.rx <= 0\) : \(pJp.rx >= 0\);"
is_jp_day_replacement = r"const isJpDay = pJp.rx <= 0;"
code = code.replace(is_jp_day_pattern, is_jp_day_replacement)

# 5. Revert earthRotation
er_pattern = r"(let earthRotation = -\(simTime / 12\) \* Math.PI;\n\s*if \(sunSide === 'left'\) \{\n\s*earthRotation \+= 2 \* Math.PI;\n\s*\} else \{\n\s*earthRotation \+= Math.PI;\n\s*\})"
er_replacement = "const earthRotation = -(simTime / 12) * Math.PI;"
code = re.sub(er_pattern, er_replacement, code)

# 6. Rewrite Noon Elevation Angle section
noon_pattern = r"// ----- Draw Noon Elevation Angle \(南中高度\) -----.*?ctxSeasons.fillText\(altitude.toFixed\(1\) \+ '°', textBaseX, pNoon.y \+ 45\);"

noon_replacement = """// ----- Draw Noon Elevation Angle (南中高度) -----
    // Noon is always on the LEFT (lon = Math.PI)
    const noonLon = Math.PI;
    const pNoon = projectEarth(latJp, noonLon, tilt);
    
    // Normal vector
    const nx = pNoon.rx / R;
    const nz = pNoon.rz / R;
    const normX = nx;
    const normY = -nz;
    
    // South tangent
    const pNoonSouth = projectEarth(latJp - 0.01, noonLon, tilt);
    const sxRaw = pNoonSouth.rx - pNoon.rx;
    const syRaw = -(pNoonSouth.rz - pNoon.rz);
    const sl = Math.hypot(sxRaw, syRaw);
    const southDir = { x: sxRaw / sl, y: syRaw / sl };
    
    const groundLength = 80;
    const g1x = pNoon.x - southDir.x * groundLength; // North
    const g1y = pNoon.y - southDir.y * groundLength;
    const g2x = pNoon.x + southDir.x * groundLength; // South
    const g2y = pNoon.y + southDir.y * groundLength;
    
    // Draw Ground
    ctxSeasons.beginPath();
    ctxSeasons.moveTo(g1x, g1y);
    ctxSeasons.lineTo(g2x, g2y);
    ctxSeasons.strokeStyle = '#aaaaaa';
    ctxSeasons.lineWidth = 2;
    ctxSeasons.stroke();
    
    ctxSeasons.fillStyle = '#aaaaaa';
    ctxSeasons.fillText('南', g2x + 10, g2y + 5);
    ctxSeasons.fillText('北', g1x - 25, g1y + 5);
    
    // Observer
    ctxSeasons.beginPath();
    ctxSeasons.moveTo(pNoon.x, pNoon.y);
    ctxSeasons.lineTo(pNoon.x + normX * 25, pNoon.y + normY * 25);
    ctxSeasons.strokeStyle = '#ffffff';
    ctxSeasons.lineWidth = 3;
    ctxSeasons.stroke();
    
    ctxSeasons.beginPath();
    ctxSeasons.arc(pNoon.x + normX * 28, pNoon.y + normY * 28, 4, 0, Math.PI*2);
    ctxSeasons.fillStyle = '#ffffff';
    ctxSeasons.fill();
    
    // Sun Ray (dashed)
    const toSunX = -1; // Sun is ALWAYS on the LEFT
    ctxSeasons.beginPath();
    ctxSeasons.setLineDash([5, 5]);
    ctxSeasons.moveTo(pNoon.x + toSunX * 150, pNoon.y);
    ctxSeasons.lineTo(pNoon.x, pNoon.y);
    // Use slightly white/yellow to not clash with text
    ctxSeasons.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctxSeasons.lineWidth = 2;
    ctxSeasons.stroke();
    ctxSeasons.setLineDash([]);
    
    // Angle Wedge
    const angleSouth = Math.atan2(southDir.y, southDir.x);
    const angleSun = Math.atan2(0, toSunX);
    
    ctxSeasons.beginPath();
    ctxSeasons.moveTo(pNoon.x, pNoon.y);
    ctxSeasons.arc(pNoon.x, pNoon.y, 40, Math.min(angleSun, angleSouth), Math.max(angleSun, angleSouth));
    ctxSeasons.closePath();
    ctxSeasons.fillStyle = 'rgba(100, 150, 255, 0.5)';
    ctxSeasons.fill();
    ctxSeasons.strokeStyle = '#4488ff';
    ctxSeasons.lineWidth = 1;
    ctxSeasons.stroke();
    
    // Text labels for altitude
    // Use white text with black shadow to make it very clear
    ctxSeasons.shadowColor = 'rgba(0,0,0,0.8)';
    ctxSeasons.shadowBlur = 4;
    ctxSeasons.fillStyle = '#ffffff';
    ctxSeasons.font = 'bold 14px sans-serif';
    const textBaseX = pNoon.x - 120;
    ctxSeasons.fillText('南中高度', textBaseX, pNoon.y + 20);
    
    const declination = (currentSeason === 'summer') ? 23.4 : (currentSeason === 'winter') ? -23.4 : 0;
    const altitude = 90 - 35 + declination;
    ctxSeasons.fillText(altitude.toFixed(1) + '°', textBaseX, pNoon.y + 40);
    
    // Formula
    ctxSeasons.font = '12px sans-serif';
    ctxSeasons.fillStyle = '#dddddd';
    let formulaStr = '';
    if (currentSeason === 'summer') {
      formulaStr = '(90° - 緯度 + 23.4°)';
    } else if (currentSeason === 'winter') {
      formulaStr = '(90° - 緯度 - 23.4°)';
    } else {
      formulaStr = '(90° - 緯度)';
    }
    ctxSeasons.fillText(formulaStr, textBaseX, pNoon.y + 55);
    
    ctxSeasons.shadowBlur = 0; // Reset shadow"""

code = re.sub(noon_pattern, noon_replacement, code, flags=re.DOTALL)

with open('/Users/goromatsunaga2/Library/CloudStorage/GoogleDrive-matsunaga@jenaplanschool.ac.jp/マイドライブ/01理科/03中3理科/02宇宙/space-simulations/custom-sims.js', 'w') as f:
    f.write(code)

print("Revert and fix applied successfully.")
