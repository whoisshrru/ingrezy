const sharp = require('d:/ingrezy/admin/node_modules/sharp');
const path = require('path');
const fs = require('fs');

const outDir = 'D:/ingrezy/mobile/assets/splash';

async function generateSvgProduct(svgString, outName, width = 400, height = 480) {
  const buffer = Buffer.from(svgString);
  const outFile = path.join(outDir, outName);
  await sharp(buffer, { density: 150 })
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 95 })
    .toFile(outFile);
  console.log('Generated:', outFile);
}

// 1. Realistic Basmati Rice Bag (Woven burlap / royal basmati sack)
const riceBagSvg = `
<svg width="400" height="480" viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="riceSack" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#b8935c"/>
      <stop offset="15%" stop-color="#dfc495"/>
      <stop offset="50%" stop-color="#eed8af"/>
      <stop offset="85%" stop-color="#dfc495"/>
      <stop offset="100%" stop-color="#9d7842"/>
    </linearGradient>
    <linearGradient id="riceBlue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e3c72"/>
      <stop offset="100%" stop-color="#0f2042"/>
    </linearGradient>
    <linearGradient id="goldSheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d4af37"/>
      <stop offset="50%" stop-color="#fff2a3"/>
      <stop offset="100%" stop-color="#aa7c11"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Bag Body with 3D Gusset contour -->
  <g filter="url(#shadow)">
    <!-- Main Sack Form -->
    <path d="M 70 80 Q 60 240 65 420 Q 65 440 85 445 L 315 445 Q 335 440 335 420 Q 340 240 330 80 Q 200 65 70 80 Z" fill="url(#riceSack)" />
    
    <!-- Sewn Top Lip / Crimp -->
    <path d="M 65 80 Q 200 60 335 80 L 338 60 Q 200 42 62 60 Z" fill="#9d7842" stroke="#5d401a" stroke-width="2"/>
    <!-- Stitched Thread Line -->
    <path d="M 68 70 Q 200 52 332 70" stroke="#fff8e7" stroke-width="3" stroke-dasharray="6,4" fill="none"/>
    
    <!-- Top Royal Blue Banner -->
    <path d="M 72 105 Q 200 95 328 105 L 325 210 Q 200 230 75 210 Z" fill="url(#riceBlue)" />
    <!-- Gold Border around Banner -->
    <path d="M 72 105 Q 200 95 328 105 L 325 210 Q 200 230 75 210 Z" fill="none" stroke="url(#goldSheen)" stroke-width="4"/>
    
    <!-- Brand Crest -->
    <circle cx="200" cy="140" r="24" fill="url(#goldSheen)"/>
    <circle cx="200" cy="140" r="20" fill="#0f2042"/>
    <text x="200" y="146" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="url(#goldSheen)" text-anchor="middle">★</text>
    
    <text x="200" y="180" font-family="'Trebuchet MS', Arial, sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle" letter-spacing="3">ROYAL</text>
    <text x="200" y="202" font-family="Georgia, serif" font-weight="700" font-style="italic" font-size="16" fill="url(#goldSheen)" text-anchor="middle" letter-spacing="1">BASMATI RICE</text>

    <!-- Center Window / Graphic -->
    <ellipse cx="200" cy="300" rx="90" ry="70" fill="#ffffff" stroke="url(#goldSheen)" stroke-width="3"/>
    
    <!-- Realistic Rice Grains in Oval -->
    <g fill="#f7f5ee" stroke="#ded8c4" stroke-width="1.2">
      <ellipse cx="170" cy="280" rx="14" ry="4" transform="rotate(-25 170 280)"/>
      <ellipse cx="200" cy="275" rx="16" ry="4" transform="rotate(10 200 275)"/>
      <ellipse cx="230" cy="285" rx="15" ry="4" transform="rotate(35 230 285)"/>
      <ellipse cx="160" cy="305" rx="15" ry="4" transform="rotate(15 160 305)"/>
      <ellipse cx="195" cy="310" rx="17" ry="4.5" transform="rotate(-10 195 310)"/>
      <ellipse cx="235" cy="315" rx="14" ry="4" transform="rotate(-30 235 315)"/>
      <ellipse cx="180" cy="330" rx="16" ry="4" transform="rotate(40 180 330)"/>
      <ellipse cx="215" cy="332" rx="15" ry="4" transform="rotate(5 215 332)"/>
    </g>
    
    <!-- 100% Aged Basmati Seal -->
    <rect x="130" y="380" width="140" height="32" rx="16" fill="#0f2042" stroke="url(#goldSheen)" stroke-width="2"/>
    <text x="200" y="401" font-family="Arial, sans-serif" font-weight="800" font-size="13" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">PREMIUM 5 KG</text>
    
    <!-- Bottom Hem Stitch -->
    <path d="M 68 435 L 332 435" stroke="#7a5522" stroke-width="2" stroke-dasharray="4,3"/>
  </g>
</svg>
`;

// 2. Realistic Chakki Fresh Atta Bag (100% Whole Wheat Flour)
const attaBagSvg = `
<svg width="400" height="480" viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="attaBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#d67b27"/>
      <stop offset="18%" stop-color="#f8a349"/>
      <stop offset="50%" stop-color="#fbc179"/>
      <stop offset="82%" stop-color="#f8a349"/>
      <stop offset="100%" stop-color="#bf6312"/>
    </linearGradient>
    <linearGradient id="greenBand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#137536"/>
      <stop offset="100%" stop-color="#0a461e"/>
    </linearGradient>
    <linearGradient id="redBadge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d32f2f"/>
      <stop offset="100%" stop-color="#8e0000"/>
    </linearGradient>
    <filter id="attaShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <g filter="url(#attaShadow)">
    <!-- Standup Gusset Pouch Body -->
    <path d="M 75 70 L 325 70 Q 345 250 330 430 Q 330 445 315 445 L 85 445 Q 70 445 70 430 Q 55 250 75 70 Z" fill="url(#attaBody)"/>
    
    <!-- Heat Sealed Top Bar -->
    <rect x="73" y="55" width="254" height="20" rx="3" fill="#bf6312" stroke="#873f00" stroke-width="1.5"/>
    <!-- Zigzag Crimp Pattern -->
    <path d="M 75 65 L 325 65" stroke="#ffd9aa" stroke-width="2" stroke-dasharray="3,2"/>
    
    <!-- Top Green Quality Banner -->
    <path d="M 74 75 L 326 75 L 328 150 Q 200 170 72 150 Z" fill="url(#greenBand)"/>
    <text x="200" y="112" font-family="'Impact', 'Arial Black', sans-serif" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="2">CHAKKI FRESH</text>
    <text x="200" y="140" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#ffe082" text-anchor="middle" letter-spacing="3">ATTA</text>
    
    <!-- Red Badge in Center -->
    <circle cx="200" cy="230" r="50" fill="url(#redBadge)" stroke="#ffffff" stroke-width="3"/>
    <text x="200" y="222" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle">100%</text>
    <text x="200" y="242" font-family="Arial, sans-serif" font-weight="bold" font-size="13" fill="#ffe082" text-anchor="middle">WHOLE WHEAT</text>
    
    <!-- Wheat Sheaves Icon Left & Right -->
    <g fill="#ffe082">
      <ellipse cx="120" cy="300" rx="20" ry="6" transform="rotate(-40 120 300)"/>
      <ellipse cx="125" cy="315" rx="22" ry="6" transform="rotate(-30 125 315)"/>
      <ellipse cx="132" cy="330" rx="22" ry="6" transform="rotate(-20 132 330)"/>
      
      <ellipse cx="280" cy="300" rx="20" ry="6" transform="rotate(40 280 300)"/>
      <ellipse cx="275" cy="315" rx="22" ry="6" transform="rotate(30 275 315)"/>
      <ellipse cx="268" cy="330" rx="22" ry="6" transform="rotate(20 268 330)"/>
    </g>
    
    <!-- Golden Roti graphic -->
    <circle cx="200" cy="335" r="42" fill="#f5d089" stroke="#b27f29" stroke-width="2"/>
    <circle cx="192" cy="328" r="4" fill="#a46d1b" opacity="0.6"/>
    <circle cx="212" cy="340" r="5" fill="#a46d1b" opacity="0.6"/>
    <circle cx="188" cy="348" r="3.5" fill="#a46d1b" opacity="0.6"/>
    
    <!-- Bottom Net Weight Badge -->
    <rect x="125" y="395" width="150" height="30" rx="6" fill="#137536" stroke="#ffffff" stroke-width="1.5"/>
    <text x="200" y="416" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#ffffff" text-anchor="middle" letter-spacing="1">NET WT. 5 KG</text>
  </g>
</svg>
`;

// 3. Realistic Toor Dal Pulse Packet (Transparent window with yellow lentils)
const dalPacketSvg = `
<svg width="400" height="480" viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dalPouch" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#145a32"/>
      <stop offset="20%" stop-color="#1e8449"/>
      <stop offset="50%" stop-color="#2ecc71"/>
      <stop offset="80%" stop-color="#1e8449"/>
      <stop offset="100%" stop-color="#145a32"/>
    </linearGradient>
    <linearGradient id="dalWindow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f4d03f"/>
      <stop offset="100%" stop-color="#d4ac0d"/>
    </linearGradient>
    <filter id="dalShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <g filter="url(#dalShadow)">
    <!-- Standup Pouch -->
    <path d="M 80 60 L 320 60 Q 338 250 326 425 Q 326 440 310 440 L 90 440 Q 74 440 74 425 Q 62 250 80 60 Z" fill="url(#dalPouch)"/>
    
    <!-- Top Seal & Notch -->
    <rect x="78" y="48" width="244" height="18" rx="3" fill="#0e3d22"/>
    <path d="M 80 57 L 320 57" stroke="#82e0aa" stroke-width="1.5" stroke-dasharray="3,2"/>
    <!-- Easy Tear Notch -->
    <polygon points="76,57 84,53 84,61" fill="#ffffff"/>
    <polygon points="324,57 316,53 316,61" fill="#ffffff"/>

    <!-- Brand Header -->
    <rect x="95" y="80" width="210" height="52" rx="8" fill="#ffffff" />
    <text x="200" y="105" font-family="'Impact', 'Arial Black', sans-serif" font-size="22" fill="#b7950b" text-anchor="middle" letter-spacing="1">PREMIUM</text>
    <text x="200" y="124" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#145a32" text-anchor="middle" letter-spacing="2">TOOR DAL</text>

    <!-- Transparent Oval Window Showing Yellow Lentils -->
    <ellipse cx="200" cy="245" rx="85" ry="75" fill="url(#dalWindow)" stroke="#ffffff" stroke-width="4"/>
    
    <!-- Individual Lentil Dals texture -->
    <g fill="#f9e79f" stroke="#b7950b" stroke-width="1">
      <ellipse cx="150" cy="210" rx="9" ry="6"/>
      <ellipse cx="180" cy="205" rx="8" ry="6"/>
      <ellipse cx="215" cy="210" rx="9" ry="6"/>
      <ellipse cx="245" cy="215" rx="8" ry="6"/>
      <ellipse cx="140" cy="235" rx="9" ry="6"/>
      <ellipse cx="170" cy="232" rx="9" ry="6"/>
      <ellipse cx="200" cy="230" rx="9" ry="6.5"/>
      <ellipse cx="230" cy="232" rx="9" ry="6"/>
      <ellipse cx="260" cy="238" rx="8" ry="6"/>
      <ellipse cx="150" cy="260" rx="9" ry="6"/>
      <ellipse cx="185" cy="258" rx="8" ry="6"/>
      <ellipse cx="218" cy="255" rx="9" ry="6"/>
      <ellipse cx="250" cy="262" rx="8" ry="6"/>
      <ellipse cx="165" cy="285" rx="9" ry="6"/>
      <ellipse cx="200" cy="282" rx="9" ry="6"/>
      <ellipse cx="235" cy="285" rx="9" ry="6"/>
    </g>

    <!-- Glossy Plastic Specular Highlight on Window -->
    <path d="M 140 195 Q 200 180 260 205 Q 240 215 180 205 Q 150 205 140 195 Z" fill="#ffffff" opacity="0.4"/>

    <!-- Unpolished Badge -->
    <rect x="120" y="340" width="160" height="28" rx="14" fill="#f39c12" stroke="#ffffff" stroke-width="2"/>
    <text x="200" y="359" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#ffffff" text-anchor="middle" letter-spacing="1">100% UNPOLISHED</text>

    <!-- Weight & Nutrition -->
    <text x="200" y="405" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">NET WT. 1 KG</text>
  </g>
</svg>
`;

// 4. Realistic Sunflower Cooking Oil Bottle
const oilBottleSvg = `
<svg width="400" height="480" viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Liquid Gradient -->
    <linearGradient id="oilGold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#d4ac0d"/>
      <stop offset="25%" stop-color="#f7dc6f"/>
      <stop offset="50%" stop-color="#fcf3cf"/>
      <stop offset="75%" stop-color="#f7dc6f"/>
      <stop offset="100%" stop-color="#b7950b"/>
    </linearGradient>
    <!-- Plastic Bottle Sheen -->
    <linearGradient id="plasticSheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6"/>
      <stop offset="30%" stop-color="#ffffff" stop-opacity="0.1"/>
      <stop offset="70%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.4"/>
    </linearGradient>
    <filter id="bottleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <g filter="url(#bottleShadow)">
    <!-- Yellow Cap -->
    <rect x="178" y="25" width="44" height="22" rx="4" fill="#e67e22" stroke="#b95e09" stroke-width="1.5"/>
    <!-- Thread ring -->
    <rect x="174" y="47" width="52" height="8" rx="2" fill="#d35400"/>
    
    <!-- Bottle Neck -->
    <path d="M 182 55 L 218 55 L 226 100 Q 260 125 270 170 L 270 410 Q 270 435 240 440 L 160 440 Q 130 435 130 410 L 130 170 Q 140 125 174 100 Z" fill="url(#oilGold)" stroke="#d4ac0d" stroke-width="2"/>
    
    <!-- Transparent Plastic Highlights & Ribs -->
    <path d="M 182 55 L 218 55 L 226 100 Q 260 125 270 170 L 270 410 Q 270 435 240 440 L 160 440 Q 130 435 130 410 L 130 170 Q 140 125 174 100 Z" fill="url(#plasticSheen)"/>

    <!-- Ergonomic Ribbed Grooves on Bottle -->
    <line x1="145" y1="160" x2="255" y2="160" stroke="#fcf3cf" stroke-width="3" opacity="0.8"/>
    <line x1="140" y1="180" x2="260" y2="180" stroke="#fcf3cf" stroke-width="3" opacity="0.8"/>
    <line x1="140" y1="360" x2="260" y2="360" stroke="#fcf3cf" stroke-width="3" opacity="0.8"/>
    <line x1="145" y1="380" x2="255" y2="380" stroke="#fcf3cf" stroke-width="3" opacity="0.8"/>

    <!-- Front Label Wrap -->
    <rect x="135" y="205" width="130" height="135" rx="6" fill="#ffffff" stroke="#e67e22" stroke-width="2"/>
    
    <!-- Sunflower Graphic -->
    <circle cx="200" cy="245" r="16" fill="#6e2c00"/>
    <!-- Petals -->
    <g fill="#f39c12">
      <ellipse cx="200" cy="222" rx="5" ry="10"/>
      <ellipse cx="200" cy="268" rx="5" ry="10"/>
      <ellipse cx="177" cy="245" rx="10" ry="5"/>
      <ellipse cx="223" cy="245" rx="10" ry="5"/>
      <ellipse cx="184" cy="229" rx="8" ry="8" transform="rotate(45 184 229)"/>
      <ellipse cx="216" cy="229" rx="8" ry="8" transform="rotate(-45 216 229)"/>
      <ellipse cx="184" cy="261" rx="8" ry="8" transform="rotate(-45 184 261)"/>
      <ellipse cx="216" cy="261" rx="8" ry="8" transform="rotate(45 216 261)"/>
    </g>

    <!-- Brand Text -->
    <text x="200" y="285" font-family="'Impact', Arial, sans-serif" font-size="16" fill="#b95e09" text-anchor="middle" letter-spacing="1">SUNFLOWER</text>
    <text x="200" y="302" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#27ae60" text-anchor="middle">REFINED OIL</text>
    <text x="200" y="324" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#b95e09" text-anchor="middle">1 LITRE</text>

    <!-- Strong Specular Sheen Stripe on Left -->
    <path d="M 145 110 L 155 110 L 152 420 L 142 420 Z" fill="#ffffff" opacity="0.6"/>
  </g>
</svg>
`;

// 5. Realistic Sugar Standup Pouch
const sugarPacketSvg = `
<svg width="400" height="480" viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sugarPouch" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0288d1"/>
      <stop offset="25%" stop-color="#29b6f6"/>
      <stop offset="50%" stop-color="#81d4fa"/>
      <stop offset="75%" stop-color="#29b6f6"/>
      <stop offset="100%" stop-color="#0277bd"/>
    </linearGradient>
    <filter id="sugarShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <g filter="url(#sugarShadow)">
    <path d="M 80 65 L 320 65 Q 336 250 324 425 Q 324 440 308 440 L 92 440 Q 76 440 76 425 Q 64 250 80 65 Z" fill="url(#sugarPouch)"/>
    
    <!-- Top Zip Seal -->
    <rect x="78" y="52" width="244" height="18" rx="3" fill="#01579b"/>
    <path d="M 80 61 L 320 61" stroke="#b3e5fc" stroke-width="1.5" stroke-dasharray="3,2"/>
    
    <!-- Sparkling Sugar Brand Banner -->
    <rect x="100" y="90" width="200" height="65" rx="10" fill="#ffffff"/>
    <text x="200" y="125" font-family="'Impact', Arial, sans-serif" font-size="28" fill="#0277bd" text-anchor="middle" letter-spacing="2">PURE</text>
    <text x="200" y="145" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#0288d1" text-anchor="middle" letter-spacing="3">REFINED SUGAR</text>

    <!-- Translucent Window with Sugar Crystals -->
    <ellipse cx="200" cy="255" rx="80" ry="65" fill="#f5fafd" stroke="#ffffff" stroke-width="4"/>
    
    <!-- Sugar Crystal Cubes & Facets -->
    <g fill="#ffffff" stroke="#b3e5fc" stroke-width="1">
      <rect x="155" y="225" width="18" height="18" rx="2" transform="rotate(15 155 225)"/>
      <rect x="190" y="218" width="20" height="20" rx="2" transform="rotate(-10 190 218)"/>
      <rect x="225" y="228" width="16" height="16" rx="2" transform="rotate(30 225 228)"/>
      <rect x="145" y="255" width="16" height="16" rx="2" transform="rotate(-20 145 255)"/>
      <rect x="180" y="252" width="22" height="22" rx="2" transform="rotate(25 180 252)"/>
      <rect x="220" y="258" width="18" height="18" rx="2" transform="rotate(-15 220 258)"/>
      <rect x="170" y="285" width="18" height="18" rx="2" transform="rotate(5 170 285)"/>
      <rect x="205" y="288" width="17" height="17" rx="2" transform="rotate(-25 205 288)"/>
    </g>

    <!-- Sparkle Stars -->
    <text x="145" y="225" font-size="20" fill="#ffffff">✧</text>
    <text x="245" y="240" font-size="24" fill="#ffffff">✦</text>
    <text x="185" y="310" font-size="18" fill="#ffffff">✧</text>

    <!-- Sulfur Free Seal -->
    <rect x="125" y="345" width="150" height="26" rx="13" fill="#ffffff"/>
    <text x="200" y="363" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#0277bd" text-anchor="middle" letter-spacing="1">100% SULPHUR FREE</text>

    <!-- Weight -->
    <text x="200" y="410" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">NET WT. 1 KG</text>
  </g>
</svg>
`;

// 6. Realistic Turmeric Masala (Haldi Powder) Pouch
const haldiPacketSvg = `
<svg width="400" height="480" viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="haldiPouch" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#c67d00"/>
      <stop offset="25%" stop-color="#f39c12"/>
      <stop offset="50%" stop-color="#f1c40f"/>
      <stop offset="75%" stop-color="#f39c12"/>
      <stop offset="100%" stop-color="#b77700"/>
    </linearGradient>
    <linearGradient id="foilTop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffd54f"/>
      <stop offset="50%" stop-color="#fff8e1"/>
      <stop offset="100%" stop-color="#ffb300"/>
    </linearGradient>
    <filter id="haldiShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <g filter="url(#haldiShadow)">
    <path d="M 85 70 L 315 70 Q 330 250 320 425 Q 320 440 305 440 L 95 440 Q 80 440 80 425 Q 70 250 85 70 Z" fill="url(#haldiPouch)"/>
    
    <!-- Metallic Foil Header -->
    <rect x="83" y="56" width="234" height="22" rx="3" fill="url(#foilTop)" stroke="#b77700" stroke-width="1.5"/>
    <path d="M 85 67 L 315 67" stroke="#946000" stroke-width="1.5" stroke-dasharray="3,2"/>
    
    <!-- Red Accent Header -->
    <rect x="105" y="95" width="190" height="50" rx="6" fill="#c0392b" stroke="#ffffff" stroke-width="2"/>
    <text x="200" y="126" font-family="'Impact', Arial, sans-serif" font-size="22" fill="#ffffff" text-anchor="middle" letter-spacing="2">PURE SPICES</text>
    <text x="200" y="140" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#ffd54f" text-anchor="middle" letter-spacing="2">AUTHENTIC AROMA</text>

    <!-- Turmeric Graphic: Golden Bowl with Ground Turmeric -->
    <circle cx="200" cy="250" r="60" fill="#8e5b00" stroke="#ffd54f" stroke-width="3"/>
    <ellipse cx="200" cy="265" rx="55" ry="35" fill="#f1c40f"/>
    <!-- Turmeric Powder mound -->
    <path d="M 155 265 Q 200 215 245 265 Z" fill="#f39c12" stroke="#d68910" stroke-width="2"/>
    <!-- Turmeric Roots on Side -->
    <path d="M 150 280 Q 140 310 160 325 Q 175 320 165 295 Z" fill="#d4ac0d" stroke="#7d6608" stroke-width="1.5"/>

    <text x="200" y="350" font-family="'Impact', Arial, sans-serif" font-size="26" fill="#78281f" text-anchor="middle" letter-spacing="1">TURMERIC</text>
    <text x="200" y="375" font-family="Georgia, serif" font-weight="bold" font-style="italic" font-size="18" fill="#ffffff" text-anchor="middle">Haldi Powder</text>

    <!-- Net wt -->
    <rect x="140" y="395" width="120" height="26" rx="6" fill="#78281f"/>
    <text x="200" y="413" font-family="Arial, sans-serif" font-weight="bold" font-size="13" fill="#ffffff" text-anchor="middle">100g PACK</text>
  </g>
</svg>
`;

// 7. Realistic Red Chilli Powder (Mirchi Powder) Pouch
const chilliPacketSvg = `
<svg width="400" height="480" viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="chilliPouch" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#922b21"/>
      <stop offset="25%" stop-color="#c0392b"/>
      <stop offset="50%" stop-color="#e74c3c"/>
      <stop offset="75%" stop-color="#c0392b"/>
      <stop offset="100%" stop-color="#78281f"/>
    </linearGradient>
    <linearGradient id="chilliFoil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e67e22"/>
      <stop offset="50%" stop-color="#f39c12"/>
      <stop offset="100%" stop-color="#d35400"/>
    </linearGradient>
    <filter id="chilliShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <g filter="url(#chilliShadow)">
    <path d="M 85 70 L 315 70 Q 330 250 320 425 Q 320 440 305 440 L 95 440 Q 80 440 80 425 Q 70 250 85 70 Z" fill="url(#chilliPouch)"/>
    
    <!-- Metallic Seal -->
    <rect x="83" y="56" width="234" height="22" rx="3" fill="url(#chilliFoil)" stroke="#78281f" stroke-width="1.5"/>
    <path d="M 85 67 L 315 67" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3,2"/>

    <!-- Brand Badge -->
    <rect x="105" y="95" width="190" height="48" rx="6" fill="#1b4f72" stroke="#ffffff" stroke-width="2"/>
    <text x="200" y="125" font-family="'Impact', Arial, sans-serif" font-size="22" fill="#ffffff" text-anchor="middle" letter-spacing="2">TIKHALAL</text>
    <text x="200" y="138" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#f39c12" text-anchor="middle" letter-spacing="2">EXTRA HOT &amp; SPICY</text>

    <!-- Two Whole Red Chillies & Powder Graphic -->
    <circle cx="200" cy="245" r="60" fill="#641e16" stroke="#f39c12" stroke-width="3"/>
    <!-- Red Chilli 1 -->
    <path d="M 160 210 Q 185 240 180 280 Q 172 282 170 270 Q 175 235 152 215 Z" fill="#e74c3c" stroke="#922b21" stroke-width="1.5"/>
    <path d="M 152 215 Q 148 205 145 200" stroke="#27ae60" stroke-width="3" stroke-linecap="round" fill="none"/>
    <!-- Red Chilli 2 -->
    <path d="M 235 210 Q 210 240 218 280 Q 225 282 227 270 Q 220 235 245 215 Z" fill="#c0392b" stroke="#78281f" stroke-width="1.5"/>
    <path d="M 245 215 Q 250 205 252 200" stroke="#27ae60" stroke-width="3" stroke-linecap="round" fill="none"/>
    
    <!-- Red Spice Powder mound -->
    <ellipse cx="200" cy="275" rx="35" ry="15" fill="#e74c3c" stroke="#922b21" stroke-width="1.5"/>

    <text x="200" y="348" font-family="'Impact', Arial, sans-serif" font-size="24" fill="#ffffff" text-anchor="middle" letter-spacing="1">RED CHILLI</text>
    <text x="200" y="373" font-family="Georgia, serif" font-weight="bold" font-style="italic" font-size="18" fill="#f39c12" text-anchor="middle">Lal Mirch Powder</text>

    <!-- Weight -->
    <rect x="140" y="395" width="120" height="26" rx="6" fill="#1b4f72"/>
    <text x="200" y="413" font-family="Arial, sans-serif" font-weight="bold" font-size="13" fill="#ffffff" text-anchor="middle">100g PACK</text>
  </g>
</svg>
`;

// 8. Realistic Garam Masala Pouch
const garamMasalaSvg = `
<svg width="400" height="480" viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="garamPouch" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4a235a"/>
      <stop offset="25%" stop-color="#5b2c6f"/>
      <stop offset="50%" stop-color="#7d3c98"/>
      <stop offset="75%" stop-color="#5b2c6f"/>
      <stop offset="100%" stop-color="#3b1747"/>
    </linearGradient>
    <linearGradient id="royalGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d4ac0d"/>
      <stop offset="50%" stop-color="#f7dc6f"/>
      <stop offset="100%" stop-color="#b7950b"/>
    </linearGradient>
    <filter id="garamShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <g filter="url(#garamShadow)">
    <path d="M 85 70 L 315 70 Q 330 250 320 425 Q 320 440 305 440 L 95 440 Q 80 440 80 425 Q 70 250 85 70 Z" fill="url(#garamPouch)"/>
    
    <!-- Gold Foil Header -->
    <rect x="83" y="56" width="234" height="22" rx="3" fill="url(#royalGold)" stroke="#3b1747" stroke-width="1.5"/>
    <path d="M 85 67 L 315 67" stroke="#3b1747" stroke-width="1.5" stroke-dasharray="3,2"/>

    <!-- Royal Masala Shield -->
    <rect x="105" y="95" width="190" height="48" rx="6" fill="#196f3d" stroke="url(#royalGold)" stroke-width="2"/>
    <text x="200" y="125" font-family="'Impact', Arial, sans-serif" font-size="20" fill="url(#royalGold)" text-anchor="middle" letter-spacing="2">ROYAL BLEND</text>
    <text x="200" y="138" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#ffffff" text-anchor="middle" letter-spacing="1">AROMATIC &amp; RICH</text>

    <!-- Star Anise & Cinnamon Graphic -->
    <circle cx="200" cy="245" r="60" fill="#2c1435" stroke="url(#royalGold)" stroke-width="3"/>
    
    <!-- Star Anise in Center -->
    <g fill="#a04000" stroke="#562502" stroke-width="1.2">
      <ellipse cx="200" cy="225" rx="7" ry="14"/>
      <ellipse cx="200" cy="265" rx="7" ry="14"/>
      <ellipse cx="180" cy="245" rx="14" ry="7"/>
      <ellipse cx="220" cy="245" rx="14" ry="7"/>
      <ellipse cx="186" cy="231" rx="8" ry="12" transform="rotate(45 186 231)"/>
      <ellipse cx="214" cy="231" rx="8" ry="12" transform="rotate(-45 214 231)"/>
      <ellipse cx="186" cy="259" rx="8" ry="12" transform="rotate(-45 186 259)"/>
      <ellipse cx="214" cy="259" rx="8" ry="12" transform="rotate(45 214 259)"/>
      <circle cx="200" cy="245" r="7" fill="#6e2c00"/>
    </g>

    <text x="200" y="348" font-family="'Impact', Arial, sans-serif" font-size="22" fill="#ffffff" text-anchor="middle" letter-spacing="1">GARAM MASALA</text>
    <text x="200" y="373" font-family="Georgia, serif" font-weight="bold" font-style="italic" font-size="16" fill="url(#royalGold)" text-anchor="middle">Special Chef Blend</text>

    <!-- Weight -->
    <rect x="140" y="395" width="120" height="26" rx="6" fill="#196f3d" stroke="url(#royalGold)" stroke-width="1"/>
    <text x="200" y="413" font-family="Arial, sans-serif" font-weight="bold" font-size="13" fill="#ffffff" text-anchor="middle">100g PACK</text>
  </g>
</svg>
`;

async function main() {
  await generateSvgProduct(riceBagSvg, 'rice_bag.png');
  await generateSvgProduct(attaBagSvg, 'atta_bag.png');
  await generateSvgProduct(dalPacketSvg, 'dal_packet.png');
  await generateSvgProduct(oilBottleSvg, 'oil_bottle.png');
  await generateSvgProduct(sugarPacketSvg, 'sugar_packet.png');
  await generateSvgProduct(haldiPacketSvg, 'haldi_packet.png');
  await generateSvgProduct(chilliPacketSvg, 'chilli_packet.png');
  await generateSvgProduct(garamMasalaSvg, 'garam_masala.png');
  console.log('All Indian grocery packages generated successfully!');
}

main();
