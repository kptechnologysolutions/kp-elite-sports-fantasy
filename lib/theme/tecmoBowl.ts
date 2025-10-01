// Tecmo Bowl Retro Gaming Theme
export const tecmoBowlTheme = {
  colors: {
    // Classic NES palette
    background: '#000000',
    field: '#0585CC', // Classic Tecmo Bowl blue field
    fieldLines: '#FFFFFF',
    
    // Team colors
    primary: '#FF0000', // Red team
    secondary: '#0000FF', // Blue team
    
    // UI Colors
    text: '#FFFFFF',
    textMuted: '#C0C0C0',
    accent: '#FFD700', // Gold for highlights
    success: '#00FF00', // Bright green
    danger: '#FF0000', // Bright red
    warning: '#FFFF00', // Yellow
    
    // Pixel borders
    border: '#404040',
    borderAccent: '#808080',
  },
  
  fonts: {
    // 8-bit style fonts
    heading: '"Press Start 2P", "Courier New", monospace',
    body: '"Courier New", monospace',
    mono: '"Courier New", monospace',
  },
  
  spacing: {
    pixelGrid: '8px', // Base 8px grid for that pixel-perfect feel
  },
  
  animations: {
    // Retro blink animation
    blink: 'blink 1s step-start infinite',
    flash: 'flash 0.5s step-start',
    pixelMove: 'pixelMove 0.3s step-start',
  },
  
  sounds: {
    touchdown: '/sounds/touchdown.mp3',
    select: '/sounds/select.mp3',
    move: '/sounds/move.mp3',
  }
};

// CSS classes for Tecmo Bowl styling
export const tecmoClasses = {
  // Pixel perfect borders
  pixelBorder: 'shadow-[0_0_0_2px_#000,0_0_0_4px_#fff,0_0_0_6px_#000]',
  pixelBorderSm: 'shadow-[0_0_0_1px_#000,0_0_0_2px_#fff]',
  
  // 8-bit style buttons
  button8Bit: `
    relative px-4 py-2 
    bg-gradient-to-b from-gray-400 to-gray-600
    text-white font-bold
    shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.5),inset_2px_2px_0px_rgba(255,255,255,0.5)]
    active:shadow-[inset_2px_2px_0px_rgba(0,0,0,0.5),inset_-2px_-2px_0px_rgba(255,255,255,0.5)]
    hover:brightness-110
    transition-none
  `,
  
  // Retro text effects
  pixelText: 'font-mono text-white tracking-wider',
  glowText: 'text-shadow-[0_0_10px_currentColor]',
  
  // Field grid pattern
  fieldGrid: `
    bg-[#0585CC]
    bg-[linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)]
    bg-[size:20px_20px]
  `,
  
  // Score display
  scoreDisplay: `
    bg-black text-yellow-400 
    font-mono font-bold text-2xl
    px-4 py-2
    shadow-[0_0_0_2px_#FFD700,0_0_0_4px_#000]
  `,
  
  // Player sprite container
  playerSprite: `
    relative
    pixel-art
    image-rendering-pixelated
    image-rendering-crisp-edges
  `,
  
  // Menu styling
  retroMenu: `
    bg-blue-900
    border-4 border-double border-white
    text-white
    font-mono
  `,
  
  // Alert/notification styling
  pixelAlert: `
    bg-black
    border-2 border-white
    text-white
    font-mono
    animate-pulse
  `,
};

// Keyframe animations
export const tecmoAnimations = `
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  @keyframes flash {
    0%, 25%, 50%, 75%, 100% { background: inherit; }
    12.5%, 37.5%, 62.5%, 87.5% { background: white; }
  }
  
  @keyframes pixelMove {
    0% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    50% { transform: translateX(8px); }
    75% { transform: translateX(-8px); }
    100% { transform: translateX(0); }
  }
  
  @keyframes touchdown {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
`;

// ASCII Art for headers
export const tecmoAsciiArt = {
  touchdown: `
████████╗██████╗ ██╗
╚══██╔══╝██╔══██╗██║
   ██║   ██║  ██║██║
   ██║   ██║  ██║╚═╝
   ██║   ██████╔╝██╗
   ╚═╝   ╚═════╝ ╚═╝
  `,
  
  gameOver: `
 ██████╗  █████╗ ███╗   ███╗███████╗
██╔════╝ ██╔══██╗████╗ ████║██╔════╝
██║  ███╗███████║██╔████╔██║█████╗  
██║   ██║██╔══██║██║╚██╔╝██║██╔══╝  
╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗
 ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝
  `,
  
  ready: `
██████╗ ███████╗ █████╗ ██████╗ ██╗   ██╗
██╔══██╗██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝
██████╔╝█████╗  ███████║██║  ██║ ╚████╔╝ 
██╔══██╗██╔══╝  ██╔══██║██║  ██║  ╚██╔╝  
██║  ██║███████╗██║  ██║██████╔╝   ██║   
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝   
  `,
};

// Utility function to apply Tecmo Bowl theme
export const applyTecmoTheme = () => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--tecmo-bg', tecmoBowlTheme.colors.background);
    document.documentElement.style.setProperty('--tecmo-field', tecmoBowlTheme.colors.field);
    document.documentElement.style.setProperty('--tecmo-text', tecmoBowlTheme.colors.text);
    document.documentElement.style.setProperty('--tecmo-accent', tecmoBowlTheme.colors.accent);
    
    // Add pixel font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = tecmoAnimations;
    document.head.appendChild(style);
  }
};