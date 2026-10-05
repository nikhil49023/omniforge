'use client';

import React, { useRef, useEffect, useState } from 'react';
import { sound } from '@/lib/sound';
import { jevEngine, JevDecision } from '@/lib/jev';
import { fetchBossTaunt } from '@/lib/groq-taunt';

export interface GameStats {
  playerHp: number;
  bossHp: number;
  adrenaline: number;
  combo: number;
  maxCombo: number;
  parries: number;
  gameOver: boolean;
  victory: boolean;
  bossTaunt: string | null;
  lastJevDecision: JevDecision | null;
  bulletTimeActive: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

interface AfterImage {
  x: number;
  y: number;
  alpha: number;
  facing: number;
  color: string;
}

export function GameCanvas({ onStatsUpdate }: { onStatsUpdate?: (stats: GameStats) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game State Refs (avoid react re-render lag in 60fps loop)
  const stateRef = useRef({
    // Player
    player: {
      x: 180,
      y: 0,
      vx: 0,
      vy: 0,
      width: 36,
      height: 70,
      hp: 100,
      maxHp: 100,
      isGrounded: false,
      facing: 1, // 1 right, -1 left
      state: 'idle' as 'idle' | 'running' | 'slashing' | 'parrying' | 'dashing',
      stateTimer: 0,
      dashCooldown: 0,
      parryWindow: 0,
      adrenaline: 100,
    },
    // Boss (JEV)
    boss: {
      x: 620,
      y: 0,
      vx: 0,
      vy: 0,
      width: 44,
      height: 78,
      hp: 100,
      maxHp: 100,
      isGrounded: false,
      facing: -1,
      state: 'idle' as 'idle' | 'running' | 'slashing' | 'parrying' | 'dashing' | 'stunned',
      stateTimer: 0,
      decisionCooldown: 0,
      attackCooldown: 30,
    },
    // Visuals
    particles: [] as Particle[],
    afterImages: [] as AfterImage[],
    screenShake: 0,
    timeDilation: 1.0,
    bulletTimeActive: false,
    slashArc: null as { x: number; y: number; facing: number; progress: number; color: string } | null,
    bossSlashArc: null as { x: number; y: number; facing: number; progress: number; color: string } | null,
    // Metrics
    combo: 0,
    maxCombo: 0,
    parriesLanded: 0,
    playerHistory: [] as string[],
    lastJevDecision: null as JevDecision | null,
    gameOver: false,
    victory: false,
    bossTaunt: null as string | null,
  });

  const keysRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      // Start sound on first keypress
      sound.startAmbientBGM();

      // Quick hotkeys
      if (e.code === 'KeyJ') triggerPlayerAttack();
      if (e.code === 'KeyK') triggerPlayerParry();
      if (e.code === 'KeyL' || e.code === 'ShiftLeft') triggerPlayerDash();
      if (e.code === 'Space') toggleBulletTime(true);
      if (e.code === 'KeyR' && stateRef.current.gameOver) restartGame();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      if (e.code === 'Space') toggleBulletTime(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const triggerPlayerAttack = () => {
    const s = stateRef.current;
    if (s.gameOver || s.player.state === 'slashing' || s.player.state === 'dashing') return;

    s.player.state = 'slashing';
    s.player.stateTimer = 18;
    s.playerHistory.push('slashing');
    if (s.playerHistory.length > 5) s.playerHistory.shift();

    sound.playSlash();
    s.slashArc = {
      x: s.player.x + (s.player.facing === 1 ? 25 : -25),
      y: s.player.y - 35,
      facing: s.player.facing,
      progress: 0,
      color: '#06b6d4',
    };
  };

  const triggerPlayerParry = () => {
    const s = stateRef.current;
    if (s.gameOver || s.player.state === 'slashing' || s.player.state === 'dashing') return;

    s.player.state = 'parrying';
    s.player.stateTimer = 16;
    s.player.parryWindow = 12; // 200ms active window
    s.playerHistory.push('parrying');
    if (s.playerHistory.length > 5) s.playerHistory.shift();
  };

  const triggerPlayerDash = () => {
    const s = stateRef.current;
    if (s.gameOver || s.player.dashCooldown > 0) return;

    s.player.state = 'dashing';
    s.player.stateTimer = 14;
    s.player.dashCooldown = 40;
    s.player.vx = s.player.facing * 18;
    s.playerHistory.push('dashing');
    if (s.playerHistory.length > 5) s.playerHistory.shift();

    sound.playDash();

    // Spawn afterimages
    for (let i = 0; i < 4; i++) {
      s.afterImages.push({
        x: s.player.x - s.player.facing * (i * 12),
        y: s.player.y,
        alpha: 0.6 - i * 0.12,
        facing: s.player.facing,
        color: '#06b6d4',
      });
    }
  };

  const toggleBulletTime = (enable: boolean) => {
    const s = stateRef.current;
    if (enable && s.player.adrenaline > 10) {
      s.bulletTimeActive = true;
      s.timeDilation = 0.28;
      sound.playBulletTime(true);
    } else {
      s.bulletTimeActive = false;
      s.timeDilation = 1.0;
      sound.playBulletTime(false);
    }
  };

  const spawnHitParticles = (x: number, y: number, color: string, count = 18) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: Math.random() * 3 + 1.5,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02,
      });
    }
  };

  const restartGame = () => {
    const s = stateRef.current;
    s.player.x = 180;
    s.player.y = 0;
    s.player.hp = 100;
    s.player.state = 'idle';
    s.player.adrenaline = 100;

    s.boss.x = 620;
    s.boss.y = 0;
    s.boss.hp = 100;
    s.boss.state = 'idle';

    s.combo = 0;
    s.gameOver = false;
    s.victory = false;
    s.bossTaunt = null;
    s.particles = [];
    s.afterImages = [];
    s.screenShake = 0;
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const loop = (timestamp: number) => {
      const s = stateRef.current;
      const dt = s.timeDilation;
      const groundY = canvas.height - 110;

      // Handle Screen Shake
      if (s.screenShake > 0) {
        s.screenShake *= 0.88;
        if (s.screenShake < 0.2) s.screenShake = 0;
      }

      // Adrenaline drain/regen
      if (s.bulletTimeActive) {
        s.player.adrenaline -= 0.6;
        if (s.player.adrenaline <= 0) {
          s.player.adrenaline = 0;
          s.bulletTimeActive = false;
          s.timeDilation = 1.0;
        }
      } else if (s.player.adrenaline < 100) {
        s.player.adrenaline += 0.15;
      }

      // 1. PLAYER UPDATE
      if (!s.gameOver) {
        // Cooldowns
        if (s.player.dashCooldown > 0) s.player.dashCooldown -= 1;
        if (s.player.parryWindow > 0) s.player.parryWindow -= dt;

        if (s.player.stateTimer > 0) {
          s.player.stateTimer -= dt;
          if (s.player.stateTimer <= 0) {
            s.player.state = 'idle';
          }
        }

        // Horizontal Movement
        if (s.player.state !== 'dashing') {
          let moveX = 0;
          if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) moveX -= 1;
          if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) moveX += 1;

          if (moveX !== 0 && s.player.state !== 'slashing') {
            s.player.vx = moveX * 6.5;
            s.player.facing = moveX > 0 ? 1 : -1;
            if (s.player.state === 'idle') s.player.state = 'running';
          } else {
            s.player.vx *= 0.78;
            if (s.player.state === 'running') s.player.state = 'idle';
          }
        }

        // Jump
        if ((keysRef.current['KeyW'] || keysRef.current['ArrowUp']) && s.player.isGrounded) {
          s.player.vy = -14;
          s.player.isGrounded = false;
        }

        // Physics
        s.player.x += s.player.vx * dt;
        s.player.vy += 0.85 * dt; // Gravity
        s.player.y += s.player.vy * dt;

        if (s.player.y >= groundY) {
          s.player.y = groundY;
          s.player.vy = 0;
          s.player.isGrounded = true;
        }

        // Boundaries
        s.player.x = Math.max(60, Math.min(canvas.width - 60, s.player.x));
      }

      // 2. JEV SYSTEM 1 AI UPDATE
      if (!s.gameOver) {
        s.boss.facing = s.boss.x > s.player.x ? -1 : 1;

        if (s.boss.stateTimer > 0) {
          s.boss.stateTimer -= dt;
          if (s.boss.stateTimer <= 0) {
            s.boss.state = 'idle';
          }
        }

        s.boss.decisionCooldown -= dt;
        s.boss.attackCooldown -= dt;

        // Run JEV System 1 Evaluation when ready
        if (s.boss.decisionCooldown <= 0 && s.boss.state !== 'stunned') {
          const telemetry = {
            playerX: s.player.x,
            bossX: s.boss.x,
            distance: Math.abs(s.player.x - s.boss.x),
            playerAction: s.player.state,
            playerAttackFrame: Math.floor(18 - s.player.stateTimer),
            playerHealth: s.player.hp,
            bossHealth: s.boss.hp,
            playerComboStreak: s.combo,
            bulletTimeActive: s.bulletTimeActive,
            recentPlayerPatterns: s.playerHistory,
          };

          const decision = jevEngine.evaluate(telemetry, timestamp);
          s.lastJevDecision = decision;
          s.boss.decisionCooldown = 8; // Evaluate every ~8 frames (~130ms)

          // Execute JEV Decision
          if (decision.action === 'PARRY') {
            s.boss.state = 'parrying';
            s.boss.stateTimer = 16;
          } else if (decision.action === 'COUNTER_SLASH' && s.boss.attackCooldown <= 0) {
            s.boss.state = 'slashing';
            s.boss.stateTimer = 20;
            s.boss.attackCooldown = 45;
            sound.playSlash();
            s.bossSlashArc = {
              x: s.boss.x + (s.boss.facing === 1 ? 30 : -30),
              y: s.boss.y - 35,
              facing: s.boss.facing,
              progress: 0,
              color: '#ef4444',
            };
          } else if (decision.action === 'RETREAT_DASH') {
            s.boss.state = 'dashing';
            s.boss.stateTimer = 14;
            s.boss.vx = -s.boss.facing * 14;
            sound.playDash();
          } else if (decision.action === 'HEAVY_LUNGE' && s.boss.attackCooldown <= 0) {
            s.boss.state = 'slashing';
            s.boss.stateTimer = 22;
            s.boss.vx = s.boss.facing * 12;
            s.boss.attackCooldown = 50;
            sound.playSlash();
          } else if (decision.action === 'ADVANCE') {
            s.boss.vx = s.boss.facing * 4.2;
          } else {
            s.boss.vx *= 0.8;
          }
        }

        // Boss Physics
        s.boss.x += s.boss.vx * dt;
        s.boss.x = Math.max(80, Math.min(canvas.width - 80, s.boss.x));
        s.boss.y = groundY;
      }

      // 3. COMBAT HITBOX RESOLUTION
      if (!s.gameOver) {
        const dist = Math.abs(s.player.x - s.boss.x);
        const inHitRange = dist < 85;

        // Player Slashing -> Boss Check
        if (s.player.state === 'slashing' && inHitRange && s.player.stateTimer > 8 && s.player.stateTimer < 14) {
          if (s.boss.state === 'parrying') {
            // JEV successfully parried player!
            sound.playClash();
            s.screenShake = 12;
            spawnHitParticles((s.player.x + s.boss.x) / 2, groundY - 40, '#f59e0b', 24);
            s.player.vx = -s.player.facing * 10;
            s.player.state = 'idle';
            s.player.stateTimer = 0;
            s.combo = 0;
          } else if (s.boss.state !== 'dashing') {
            // Player lands a hit!
            sound.playHit();
            s.screenShake = 8;
            s.boss.hp = Math.max(0, s.boss.hp - 12);
            s.boss.vx = s.player.facing * 9;
            s.boss.state = 'stunned';
            s.boss.stateTimer = 14;
            s.combo += 1;
            s.maxCombo = Math.max(s.maxCombo, s.combo);
            s.player.adrenaline = Math.min(100, s.player.adrenaline + 15);
            spawnHitParticles(s.boss.x, groundY - 40, '#ef4444', 20);

            if (s.boss.hp <= 0) {
              s.gameOver = true;
              s.victory = true;
              fetchBossTaunt('victory', { combo: s.maxCombo, parries: s.parriesLanded }).then((t) => {
                s.bossTaunt = t;
              });
            }
          }
        }

        // Boss Slashing -> Player Check
        if (s.boss.state === 'slashing' && inHitRange && s.boss.stateTimer > 8 && s.boss.stateTimer < 16) {
          if (s.player.state === 'parrying' && s.player.parryWindow > 0) {
            // PLAYER PERFECT PARRY!
            sound.playParry();
            s.screenShake = 16;
            s.parriesLanded += 1;
            s.combo += 2;
            s.boss.state = 'stunned';
            s.boss.stateTimer = 35; // JEV heavily stunned
            s.boss.vx = -s.boss.facing * 12;
            s.player.adrenaline = Math.min(100, s.player.adrenaline + 30);
            spawnHitParticles((s.player.x + s.boss.x) / 2, groundY - 40, '#10b981', 30);
          } else if (s.player.state !== 'dashing') {
            // Player takes hit!
            sound.playHit();
            s.screenShake = 14;
            s.player.hp = Math.max(0, s.player.hp - 18);
            s.player.vx = s.boss.facing * 11;
            s.combo = 0;
            spawnHitParticles(s.player.x, groundY - 40, '#06b6d4', 22);

            if (s.player.hp <= 0) {
              s.gameOver = true;
              s.victory = false;
              fetchBossTaunt('defeat', { combo: s.maxCombo, parries: s.parriesLanded }).then((t) => {
                s.bossTaunt = t;
              });
            }
          }
        }
      }

      // 4. RENDER PASS
      ctx.save();

      // Screen shake translation
      if (s.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * s.screenShake;
        const shakeY = (Math.random() - 0.5) * s.screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // Background Void
      ctx.fillStyle = '#06080F';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cyberpunk Grid Lines (Perspective Floor)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 1);
      ctx.lineTo(canvas.width, groundY + 1);
      ctx.stroke();

      // Vertical perspective lines
      for (let x = 0; x <= canvas.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x + (x - canvas.width / 2) * 0.8, canvas.height);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
        ctx.stroke();
      }

      // Render AfterImages
      for (let i = s.afterImages.length - 1; i >= 0; i--) {
        const img = s.afterImages[i]!;
        img.alpha -= 0.05;
        if (img.alpha <= 0) {
          s.afterImages.splice(i, 1);
          continue;
        }
        ctx.fillStyle = img.color;
        ctx.globalAlpha = img.alpha * 0.4;
        ctx.fillRect(img.x - 18, groundY - 70, 36, 70);
      }
      ctx.globalAlpha = 1.0;

      // Render Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i]!;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.25 * dt;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          s.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Render Player (Neon Cyan Cyber-Ninja)
      ctx.save();
      ctx.translate(s.player.x, s.player.y);
      ctx.scale(s.player.facing, 1);

      // Shadow
      ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (Sleek Geometric Vector)
      ctx.fillStyle = s.player.state === 'dashing' ? 'rgba(6, 182, 212, 0.4)' : '#0891b2';
      ctx.fillRect(-12, -68, 24, 68);

      // Neon Core Line
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -65);
      ctx.lineTo(0, -10);
      ctx.stroke();

      // Cyan Visor
      ctx.fillStyle = '#67e8f9';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.fillRect(2, -60, 10, 4);
      ctx.shadowBlur = 0;

      // Katana Blade
      ctx.strokeStyle = s.player.state === 'parrying' ? '#10b981' : '#06b6d4';
      ctx.lineWidth = 3;
      ctx.shadowColor = s.player.state === 'parrying' ? '#10b981' : '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      if (s.player.state === 'parrying') {
        // Vertical Guard Stance
        ctx.moveTo(14, -68);
        ctx.lineTo(14, -10);
      } else if (s.player.state === 'slashing') {
        // Horizontal Slash Strike
        ctx.moveTo(-10, -35);
        ctx.lineTo(38, -35);
      } else {
        // Ready Stance
        ctx.moveTo(10, -50);
        ctx.lineTo(26, -20);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();

      // Render Boss (JEV Sentinel - Crimson Red)
      ctx.save();
      ctx.translate(s.boss.x, s.boss.y);
      ctx.scale(s.boss.facing, 1);

      // Boss Shadow
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boss Body
      ctx.fillStyle = s.boss.state === 'stunned' ? '#581c1c' : '#991b1b';
      ctx.fillRect(-15, -78, 30, 78);

      // JEV Crimson Core Line
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -74);
      ctx.lineTo(0, -12);
      ctx.stroke();

      // Boss Red Laser Visor
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 16;
      ctx.fillRect(2, -70, 12, 5);
      ctx.shadowBlur = 0;

      // JEV Katana
      ctx.strokeStyle = s.boss.state === 'parrying' ? '#f59e0b' : '#ef4444';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      if (s.boss.state === 'parrying') {
        ctx.moveTo(16, -78);
        ctx.lineTo(16, -12);
      } else if (s.boss.state === 'slashing') {
        ctx.moveTo(-12, -40);
        ctx.lineTo(44, -40);
      } else {
        ctx.moveTo(12, -55);
        ctx.lineTo(30, -22);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();

      // Render Slash Light Arcs
      if (s.slashArc) {
        s.slashArc.progress += 0.15;
        if (s.slashArc.progress >= 1.0) {
          s.slashArc = null;
        } else {
          ctx.strokeStyle = s.slashArc.color;
          ctx.lineWidth = 4;
          ctx.shadowColor = s.slashArc.color;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          const startAngle = s.slashArc.facing === 1 ? -Math.PI / 3 : (4 * Math.PI) / 3;
          const endAngle = s.slashArc.facing === 1 ? Math.PI / 3 : (2 * Math.PI) / 3;
          ctx.arc(s.slashArc.x, s.slashArc.y, 45, startAngle, endAngle);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore();

      // Notify parent HUD
      if (onStatsUpdate) {
        onStatsUpdate({
          playerHp: s.player.hp,
          bossHp: s.boss.hp,
          adrenaline: s.player.adrenaline,
          combo: s.combo,
          maxCombo: s.maxCombo,
          parries: s.parriesLanded,
          gameOver: s.gameOver,
          victory: s.victory,
          bossTaunt: s.bossTaunt,
          lastJevDecision: s.lastJevDecision,
          bulletTimeActive: s.bulletTimeActive,
        });
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [onStatsUpdate]);

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800 bg-[#06080F] shadow-2xl shadow-cyan-950/20">
      <canvas
        ref={canvasRef}
        width={960}
        height={620}
        className="w-full h-full block cursor-crosshair"
      />
    </div>
  );
}
