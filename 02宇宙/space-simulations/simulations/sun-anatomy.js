export function initSunAnatomy() {
  const container = document.getElementById('sun-anatomy-container');
  if (!container) return;

  container.innerHTML = `
    <div class="sun-image-wrapper">
      <img src="images/sun.jpg" alt="太陽のすがた" id="sun-anatomy-img">
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
}
