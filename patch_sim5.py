import re

with open('/Users/goromatsunaga2/Library/CloudStorage/GoogleDrive-matsunaga@jenaplanschool.ac.jp/マイドライブ/01理科/03中3理科/02宇宙/space-simulations/custom-sims.js', 'r') as f:
    code = f.read()

# 1. Update getTilt
code = re.sub(
    r"function getTilt\(\) \{\n.*?return 0; \n\s*\}",
    """function getTilt() {
    if (currentSeason === 'summer' || currentSeason === 'winter') {
      return -23.4 * Math.PI / 180; // Always tilted Right
    }
    return 0; // Spring/Autumn
  }""",
    code, flags=re.DOTALL
)

# 2. Add sunSide and modify sun rays
sun_rays_pattern = r"(// ----- Draw Sun Rays -----.*?ctxSeasons.fillText\('太 陽 の 光', 30, 40\);\n)"
sun_rays_replacement = """// ----- Draw Sun Rays -----
    const sunSide = (currentSeason === 'summer') ? 'right' : 'left';
    
    ctxSeasons.strokeStyle = 'rgba(255, 200, 50, 0.6)';
    ctxSeasons.lineWidth = 3;
    ctxSeasons.beginPath();
    for(let i = -100; i <= 100; i += 30) {
      if (sunSide === 'left') {
        ctxSeasons.moveTo(20, cy + i);
        ctxSeasons.lineTo(cx - 30, cy + i);
        ctxSeasons.moveTo(cx - 40, cy + i - 5);
        ctxSeasons.lineTo(cx - 30, cy + i);
        ctxSeasons.lineTo(cx - 40, cy + i + 5);
      } else {
        ctxSeasons.moveTo(cw - 20, cy + i);
        ctxSeasons.lineTo(cx + 30, cy + i);
        ctxSeasons.moveTo(cx + 40, cy + i - 5);
        ctxSeasons.lineTo(cx + 30, cy + i);
        ctxSeasons.lineTo(cx + 40, cy + i + 5);
      }
    }
    ctxSeasons.stroke();
    
    ctxSeasons.fillStyle = '#ffcc00';
    ctxSeasons.font = 'bold 20px sans-serif';
    if (sunSide === 'left') {
      ctxSeasons.fillText('太 陽 の 光', 30, 40);
    } else {
      ctxSeasons.fillText('太 陽 の 光', cw - 150, 40);
    }
"""
code = re.sub(sun_rays_pattern, sun_rays_replacement, code, flags=re.DOTALL)

# 3. Modify Day/Night background
dn_pattern = r"(ctxSeasons.fillStyle = '#66ccff'; // Day\n\s*ctxSeasons.fillRect\(0, 0, cx, ch\);\n\s*ctxSeasons.fillStyle = 'rgba\(10, 20, 40, 0.9\)'; // Night\n\s*ctxSeasons.fillRect\(cx, 0, cw - cx, ch\);)"
dn_replacement = """ctxSeasons.fillStyle = '#66ccff'; // Day
    ctxSeasons.fillRect(0, 0, cw, ch);
    ctxSeasons.fillStyle = 'rgba(10, 20, 40, 0.9)'; // Night
    if (sunSide === 'left') {
      ctxSeasons.fillRect(cx, 0, cw - cx, ch);
    } else {
      ctxSeasons.fillRect(0, 0, cx, ch);
    }"""
code = re.sub(dn_pattern, dn_replacement, code, flags=re.DOTALL)

# 4. Modify Japan line day/night
is_day_pattern = r"const isDay = p.rx <= 0;"
is_day_replacement = r"const isDay = (sunSide === 'left') ? (p.rx <= 0) : (p.rx >= 0);"
code = code.replace(is_day_pattern, is_day_replacement)

is_jp_day_pattern = r"const isJpDay = pJp.rx <= 0;"
is_jp_day_replacement = r"const isJpDay = (sunSide === 'left') ? (pJp.rx <= 0) : (pJp.rx >= 0);"
code = code.replace(is_jp_day_pattern, is_jp_day_replacement)

# 5. Modify earthRotation and lonJp
er_pattern = r"(const earthRotation = -\(simTime / 12\) \* Math.PI;)"
er_replacement = """let earthRotation = -(simTime / 12) * Math.PI;
    if (sunSide === 'left') {
      earthRotation += 2 * Math.PI;
    } else {
      earthRotation += Math.PI;
    }"""
code = code.replace(er_pattern, er_replacement)

lonJp_pattern = r"const lonJp = -\(simTime / 12\) \* Math.PI;"
lonJp_replacement = "const lonJp = earthRotation;"
code = code.replace(lonJp_pattern, lonJp_replacement)

# 6. Modify Noon Elevation Angle drawing
noon_pattern = r"// ----- Draw Noon Elevation Angle \(南中高度\) -----.*?ctxSeasons.fillText\(altitude.toFixed\(1\) \+ '°', pNoon.x - 45, pNoon.y \+ 45\);"

noon_replacement = """// ----- Draw Noon Elevation Angle (南中高度) -----
    const noonLon = (sunSide === 'left') ? Math.PI : 0;
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
    const toSunX = (sunSide === 'left') ? -1 : 1;
    ctxSeasons.beginPath();
    ctxSeasons.setLineDash([5, 5]);
    ctxSeasons.moveTo(pNoon.x + toSunX * 150, pNoon.y);
    ctxSeasons.lineTo(pNoon.x, pNoon.y);
    ctxSeasons.strokeStyle = 'rgba(255, 200, 50, 0.9)';
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
    ctxSeasons.fillStyle = 'rgba(100, 150, 255, 0.6)';
    ctxSeasons.fill();
    ctxSeasons.strokeStyle = '#4488ff';
    ctxSeasons.lineWidth = 1;
    ctxSeasons.stroke();
    
    ctxSeasons.fillStyle = '#ffaa00';
    ctxSeasons.font = '14px sans-serif';
    const textBaseX = (sunSide === 'left') ? (pNoon.x - 70) : (pNoon.x + 20);
    ctxSeasons.fillText('南中高度', textBaseX, pNoon.y + 25);
    
    // altitude = 90 - lat + declination
    const declination = (currentSeason === 'summer') ? 23.4 : (currentSeason === 'winter') ? -23.4 : 0;
    const altitude = 90 - 35 + declination;
    ctxSeasons.fillText(altitude.toFixed(1) + '°', textBaseX, pNoon.y + 45);"""

code = re.sub(noon_pattern, noon_replacement, code, flags=re.DOTALL)

with open('/Users/goromatsunaga2/Library/CloudStorage/GoogleDrive-matsunaga@jenaplanschool.ac.jp/マイドライブ/01理科/03中3理科/02宇宙/space-simulations/custom-sims.js', 'w') as f:
    f.write(code)

print("Patch applied successfully.")
