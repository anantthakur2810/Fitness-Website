/**
 * Anytime Fitness Sector 34, Sohna — Home Landing Page
 * Showcases club information, facilities, photo gallery with lightbox,
 * interactive virtual walkthrough video player, Google Map embed, and all official social handles.
 */

import { store } from './store.js';
import { formatINR, getOverviewMetrics } from './penalty.js';
import { CONFIG } from './config.js';

const GALLERY_PHOTOS = [
  {
    src: './images/hero-gym.jpg',
    title: 'Main Training Floor',
    tag: '24/7 Open Floor',
    caption: 'Expansive training deck with Olympic squat racks, dual-pulley cable stations, and signature ambient lighting.'
  },
  {
    src: './images/strength-zone.jpg',
    title: 'Strength & Free Weights',
    tag: 'Hammer Strength',
    caption: 'Commercial-grade dumbbells, calibrated Olympic plates, and plate-loaded isolation machines.'
  },
  {
    src: './images/cardio-turf.jpg',
    title: 'Cardio & Functional Turf',
    tag: 'Sprint Track',
    caption: 'Green sprint turf lane with push sleds, battle ropes, kettlebells, and curved non-motorized treadmills.'
  },
  {
    src: './images/studio-lounge.jpg',
    title: 'Coaching & Recovery Lounge',
    tag: 'InBody & PT',
    caption: 'Dedicated personal training studio, recovery stretching zone, and InBody composition assessment station.'
  }
];

const TOUR_SCENES = [
  {
    src: './images/hero-gym.jpg',
    title: '01 · Main Strength & Cable Deck',
    subtitle: 'Open 24/7 with Smart Key-Fob Access • Sector 34, Sohna',
    zoomFrom: 1.0,
    zoomTo: 1.12,
    panX: 0.04,
    panY: 0.02
  },
  {
    src: './images/strength-zone.jpg',
    title: '02 · Free Weights & Olympic Lifting',
    subtitle: 'Heavy-Duty Dumbbells & Calibrated Plates',
    zoomFrom: 1.12,
    zoomTo: 1.02,
    panX: -0.04,
    panY: 0.01
  },
  {
    src: './images/cardio-turf.jpg',
    title: '03 · Functional Turf & Cardio Zone',
    subtitle: 'Sprint Lane, Sleds, Battle Ropes & Curved Treadmills',
    zoomFrom: 1.02,
    zoomTo: 1.14,
    panX: 0.03,
    panY: -0.02
  },
  {
    src: './images/studio-lounge.jpg',
    title: '04 · Personal Training & InBody Studio',
    subtitle: '4th & 5th Floor, The Leaf Mall, Sector 34, Sohna',
    zoomFrom: 1.1,
    zoomTo: 1.0,
    panX: -0.03,
    panY: 0.02
  }
];

const SOCIAL_LINKS = [
  {
    name: `Instagram (${CONFIG.gymBranch} Branch)`,
    handle: '@anytimefitnesssec34sohna',
    url: CONFIG.instagramUrl,
    badge: 'Local Club',
    color: '#e1306c',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`
  },
  {
    name: 'YouTube Channel',
    handle: '@AnytimeFitnessIndiaATFITNESSIN',
    url: CONFIG.youtubeUrl,
    badge: 'Workouts & Tours',
    color: '#ff0000',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>`
  },
  {
    name: 'Facebook',
    handle: 'facebook.com/ATFitnessIN',
    url: CONFIG.facebookUrl,
    badge: 'Community',
    color: '#1877f2',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>`
  },
  {
    name: 'X (Twitter)',
    handle: '@ATFitnessIN',
    url: CONFIG.xUrl,
    badge: 'Updates',
    color: '#a1a1aa',
    icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>`
  },
  {
    name: 'LinkedIn',
    handle: 'Anytime Fitness India',
    url: CONFIG.linkedinUrl,
    badge: 'Corporate',
    color: '#0a66c2',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>`
  },
  {
    name: 'Official Club Portal',
    handle: 'anytimefitness.co.in/gyms/sohna-haryana',
    url: CONFIG.websiteUrl,
    badge: 'Website',
    color: '#9333ea',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
  },
  {
    name: 'WhatsApp Front Desk',
    handle: CONFIG.gymPhone,
    url: `https://wa.me/${CONFIG.gymWhatsApp}?text=Hi%20Anytime%20Fitness%20Sohna%2C%20I%20would%20like%20to%20know%20about%20membership%20plans.`,
    badge: 'Direct Chat',
    color: '#22c55e',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`
  }
];

let tourAnimationId = null;

export function cleanupHomeEffects() {
  if (tourAnimationId) {
    cancelAnimationFrame(tourAnimationId);
    tourAnimationId = null;
  }
}

export function renderHome(container) {
  cleanupHomeEffects();

  const metrics = getOverviewMetrics();
  const plans = store.getPlans();

  container.innerHTML = `
    <div class="home-page">
      <!-- 1. HERO SECTION -->
      <section class="home-hero">
        <div class="home-hero-content">
          <div class="hero-pill">
            <span class="pulse-dot"></span>
            <span>Open 24/7 · Sector 34, Sohna · Global Club Access</span>
          </div>
          <h1 class="hero-title">
            Train Anytime.<br/>
            <span class="hero-accent">Strong Every Day.</span>
          </h1>
          <p class="hero-subtitle">
            Welcome to <strong>Anytime Fitness — Sector 34, Sohna</strong> (4th &amp; 5th Floor, The Leaf Mall). 
            Experience commercial Hammer Strength equipment, dedicated functional turf, certified personal coaches, and 24-hour smart key-fob access across 5,000+ clubs worldwide.
          </p>

          <div class="hero-quick-stats">
            <div class="hero-stat">
              <div class="hero-stat-val">24 / 7</div>
              <div class="hero-stat-lbl">365 Days Access</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-val">5,000+</div>
              <div class="hero-stat-lbl">Global Clubs</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-val">${metrics.activeMembers}+</div>
              <div class="hero-stat-lbl">Active Members</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-val">${plans.length}</div>
              <div class="hero-stat-lbl">Flexible Plans</div>
            </div>
          </div>

          <div class="hero-portal-bar">
            <button type="button" class="btn btn-primary" onclick="openAuthModal('member')" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; font-weight: 700;">
              <span>Member Sign In →</span>
            </button>
            <button type="button" class="btn btn-secondary" onclick="openAuthModal('admin')" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.15rem;">
              <span>Admin Console</span>
            </button>
            <button type="button" class="btn btn-secondary" onclick="scrollToHomeSection('home-facilities')" style="padding: 0.75rem 1rem;">
              <span>Facilities ↓</span>
            </button>
          </div>
        </div>

        <div class="home-hero-media">
          <div class="hero-image-frame" onclick="openPhotoLightbox(0)">
            <img src="./images/hero-gym.jpg" alt="Anytime Fitness Sector 34 Sohna Gym Floor" loading="eager" />
            <div class="hero-image-caption">
              <span class="badge badge-active">The Leaf Mall · 4th &amp; 5th Floor</span>
              <span style="font-size: 0.78rem; color: #e4e4e7;">Click to enlarge</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. CLUB HIGHLIGHTS & FACILITIES -->
      <section class="home-section" id="home-facilities">
        <div class="section-head">
          <div>
            <h2 class="section-title">Facilities</h2>
            <p class="section-subtitle">Amenities and training equipment in Sohna</p>
          </div>
        </div>

        <div class="facilities-grid">
          <div class="facility-card">
            <div class="facility-icon">🕒</div>
            <h3>24/7 Smart Access</h3>
            <p>Work out on your schedule—early mornings, late nights, or holidays with secure smart key-fob entry and 24-hour CCTV monitoring.</p>
          </div>
          <div class="facility-card">
            <div class="facility-icon">🏋️</div>
            <h3>Strength &amp; Free Weights</h3>
            <p>Olympic lifting platforms, calibrated bumper plates, heavy dumbbells up to 60 kg, and Hammer Strength plate-loaded machines.</p>
          </div>
          <div class="facility-card">
            <div class="facility-icon">🏃</div>
            <h3>Cardio &amp; Sprint Turf</h3>
            <p>Dedicated green functional turf lane with weighted push sleds, kettlebells, battle ropes, curved treadmills, and stair climbers.</p>
          </div>
          <div class="facility-card">
            <div class="facility-icon">📊</div>
            <h3>InBody Body Scans</h3>
            <p>Track muscle mass, body fat percentage, and metabolic rate accurately with periodic InBody composition assessments.</p>
          </div>
          <div class="facility-card">
            <div class="facility-icon">👨‍🏫</div>
            <h3>Certified Personal Trainers</h3>
            <p>1-on-1 customized programming for fat loss, strength progression, athletic conditioning, and injury rehabilitation.</p>
          </div>
          <div class="facility-card">
            <div class="facility-icon">🚿</div>
            <h3>Private Suites &amp; Parking</h3>
            <p>Hygienic private shower suites, digital lockers, filtered hydration stations, high-speed Wi-Fi, and convenient mall parking.</p>
          </div>
        </div>
      </section>

      <!-- 3. PHOTO GALLERY -->
      <section class="home-section" id="home-gallery">
        <div class="section-head">
          <div>
            <h2 class="section-title">Photo Gallery</h2>
            <p class="section-subtitle">Inside our Sector 34, Sohna club</p>
          </div>
          <a href="https://www.instagram.com/anytimefitnesssec34sohna/" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary">
            Instagram ↗
          </a>
        </div>

        <div class="gallery-grid">
          ${GALLERY_PHOTOS.map((photo, idx) => `
            <div class="gallery-card" onclick="openPhotoLightbox(${idx})">
              <div class="gallery-img-wrap">
                <img src="${photo.src}" alt="${photo.title}" loading="lazy" />
                <span class="gallery-tag">${photo.tag}</span>
              </div>
              <div class="gallery-body">
                <h3>${photo.title}</h3>
                <p>${photo.caption}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 4. VIRTUAL VIDEO TOUR & REELS SHOWCASE -->
      <section class="home-section" id="home-tour">
        <div class="section-head">
          <div>
            <h2 class="section-title">Virtual Tour</h2>
            <p class="section-subtitle">Club walkthrough and training reels</p>
          </div>
        </div>

        <div class="video-showcase-grid">
          <!-- Interactive Cinematic Video Tour Player -->
          <div class="video-player-card">
            <div class="video-viewport">
              <canvas id="gym-tour-canvas" width="960" height="540"></canvas>
              <div class="video-overlay-top">
                <span class="video-live-badge">▶ WALKTHROUGH</span>
                <span class="video-timer tabular-nums" id="tour-timer">00:00 / 00:24</span>
              </div>
              <div class="video-overlay-bottom">
                <div>
                  <div class="video-scene-title" id="tour-scene-title">${TOUR_SCENES[0].title}</div>
                  <div class="video-scene-sub" id="tour-scene-sub">${TOUR_SCENES[0].subtitle}</div>
                </div>
              </div>
            </div>

            <div class="video-controls-bar">
              <button type="button" class="btn btn-sm btn-accent" id="tour-play-btn">Pause Tour</button>
              <div class="video-progress-track" id="tour-progress-track" title="Click to jump">
                <div class="video-progress-fill" id="tour-progress-fill"></div>
              </div>
              <div class="video-chapters">
                ${TOUR_SCENES.map((s, i) => `
                  <button type="button" class="chapter-pill ${i === 0 ? 'active' : ''}" data-scene="${i}">
                    Zone ${i + 1}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Video Channels & Reels Links -->
          <div class="video-links-column">
            <a href="https://www.instagram.com/anytimefitnesssec34sohna/reels/" target="_blank" rel="noopener noreferrer" class="reel-link-card">
              <div class="reel-thumb">
                <img src="./images/strength-zone.jpg" alt="Instagram Reels Preview" />
                <span class="reel-play-icon">▶</span>
              </div>
              <div class="reel-info">
                <span class="badge badge-overdue" style="margin-bottom: 0.35rem;">Instagram Reels</span>
                <h4>@anytimefitnesssec34sohna</h4>
                <p>Watch daily member PR lifts, floor tours, transformation stories, and trainer form breakdowns filmed right in Sohna.</p>
                <span class="reel-cta">Watch Reels on Instagram ↗</span>
              </div>
            </a>

            <a href="https://www.youtube.com/@AnytimeFitnessIndiaATFITNESSIN" target="_blank" rel="noopener noreferrer" class="reel-link-card">
              <div class="reel-thumb">
                <img src="./images/cardio-turf.jpg" alt="YouTube Club Tours Preview" />
                <span class="reel-play-icon">▶</span>
              </div>
              <div class="reel-info">
                <span class="badge badge-pending" style="margin-bottom: 0.35rem;">Official YouTube</span>
                <h4>Anytime Fitness India</h4>
                <p>Explore full 4K club walkthroughs, guided workout routines, nutrition seminars, and national community challenges.</p>
                <span class="reel-cta">Watch on YouTube ↗</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      <!-- 5. MEMBERSHIP PLANS PREVIEW -->
      <section class="home-section" id="home-plans">
        <div class="section-head">
          <div>
            <h2 class="section-title">Membership Plans</h2>
            <p class="section-subtitle">Flexible membership tiers and pricing</p>
          </div>
          <button type="button" class="btn btn-sm btn-secondary" onclick="openAuthModal('member')">Join Club →</button>
        </div>

        <div class="plans-list">
          ${plans.slice(0, 4).map(p => `
            <div class="plan-item">
              <div class="plan-item-name">${p.plan_name}</div>
              <div class="plan-item-price">${formatINR(p.monthly_fee)} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">/ mo</span></div>
              <div class="plan-item-duration">${p.duration_months} Month${p.duration_months > 1 ? 's' : ''} • Total ${formatINR(p.duration_months * p.monthly_fee)}</div>
              <button type="button" class="btn btn-sm btn-primary" style="margin-top: auto;" onclick="openAuthModal('member')">
                Select Plan →
              </button>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 6. LOCATION MAP & CONTACT -->
      <section class="home-section" id="home-location">
        <div class="section-head">
          <div>
            <h2 class="section-title">Location &amp; Hours</h2>
            <p class="section-subtitle">Open 24/7 at The Leaf Mall, Sector 34, Sohna</p>
          </div>
          <a href="https://maps.app.goo.gl/yWkfrEVoVgs1v3Ao6" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-accent">
            Directions ↗
          </a>
        </div>

        <div class="location-grid">
          <div class="map-embed-card">
            <iframe
              title="Anytime Fitness Sector 34 Sohna Location Map"
              src="https://maps.google.com/maps?q=Anytime+Fitness+Sector+34+Sohna+The+Leaf+Mall+Haryana&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style="border:0; min-height: 360px;"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          <div class="location-info-card">
            <div class="loc-block">
              <div class="loc-label">Club Address</div>
              <div class="loc-value">
                <strong>Anytime Fitness — Sector 34, Sohna</strong><br/>
                4th &amp; 5th Floor, The Leaf Mall,<br/>
                Sector 34, Sohna, Gurugram,<br/>
                Haryana 122103
              </div>
            </div>

            <div class="loc-block">
              <div class="loc-label">Access &amp; Staffed Hours</div>
              <div class="loc-value">
                <div><strong>Gym Access:</strong> Open 24 Hours · 365 Days</div>
                <div><strong>Staffed Desk:</strong> 6:00 AM – 10:00 PM Daily</div>
              </div>
            </div>

            <div class="loc-block">
              <div class="loc-label">Contact &amp; Inquiries</div>
              <div class="loc-value" style="display: flex; flex-direction: column; gap: 0.45rem;">
                <a href="tel:+918796567500" class="member-link">📞 +91 87965 67500</a>
                <a href="https://wa.me/918796567500" target="_blank" rel="noopener noreferrer" class="member-link">💬 WhatsApp Front Desk</a>
                <a href="https://www.anytimefitness.co.in/gyms/sohna-haryana/" target="_blank" rel="noopener noreferrer" class="member-link">🌐 anytimefitness.co.in/gyms/sohna-haryana</a>
              </div>
            </div>

            <div style="margin-top: auto; display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <a href="https://maps.app.goo.gl/yWkfrEVoVgs1v3Ao6" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="flex: 1;">
                Open Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 7. ALL SOCIAL MEDIA HANDLES -->
      <section class="home-section">
        <div class="section-head">
          <div>
            <h2 class="section-title">Social Channels</h2>
            <p class="section-subtitle">Follow our Sohna club and official Anytime Fitness handles</p>
          </div>
        </div>

        <div class="socials-grid">
          ${SOCIAL_LINKS.map(s => `
            <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="social-card">
              <div class="social-icon" style="color: ${s.color}; background: ${s.color}1a; border-color: ${s.color}40;">
                ${s.icon}
              </div>
              <div class="social-meta">
                <div class="social-top">
                  <span class="social-name">${s.name}</span>
                  <span class="social-badge">${s.badge}</span>
                </div>
                <div class="social-handle">${s.handle}</div>
              </div>
              <span class="social-arrow">↗</span>
            </a>
          `).join('')}
        </div>
      </section>
    </div>
  `;

  initTourPlayer(container);
}

/**
 * Smooth HTML5 Canvas Ken Burns Virtual Tour Video Player
 * Plays a continuous 24-second multi-zone tour with play/pause, timeline scrubbing, and chapter controls.
 */
function initTourPlayer(container) {
  const canvas = container.querySelector('#gym-tour-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const playBtn = container.querySelector('#tour-play-btn');
  const progressFill = container.querySelector('#tour-progress-fill');
  const progressTrack = container.querySelector('#tour-progress-track');
  const timerEl = container.querySelector('#tour-timer');
  const titleEl = container.querySelector('#tour-scene-title');
  const subEl = container.querySelector('#tour-scene-sub');
  const chapterBtns = container.querySelectorAll('.chapter-pill');

  const SCENE_DURATION_MS = 6000;
  const TOTAL_DURATION_MS = SCENE_DURATION_MS * TOUR_SCENES.length;

  let isPlaying = true;
  let elapsedMs = 0;
  let lastFrameTime = performance.now();

  // Preload scene images
  const loadedImages = TOUR_SCENES.map(scene => {
    const img = new Image();
    img.src = scene.src;
    return img;
  });

  function formatTime(ms) {
    const sec = Math.floor(ms / 1000);
    return `00:${String(sec).padStart(2, '0')}`;
  }

  function updateUI(sceneIndex) {
    const scene = TOUR_SCENES[sceneIndex];
    if (titleEl && titleEl.textContent !== scene.title) {
      titleEl.textContent = scene.title;
      subEl.textContent = scene.subtitle;
    }
    if (progressFill) {
      progressFill.style.width = `${(elapsedMs / TOTAL_DURATION_MS) * 100}%`;
    }
    if (timerEl) {
      timerEl.textContent = `${formatTime(elapsedMs)} / ${formatTime(TOTAL_DURATION_MS)}`;
    }
    chapterBtns.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === sceneIndex);
    });
  }

  function drawSceneImage(img, scene, progress, alpha = 1) {
    if (!img.complete || img.naturalWidth === 0) return;

    const w = canvas.width;
    const h = canvas.height;
    const zoom = scene.zoomFrom + (scene.zoomTo - scene.zoomFrom) * progress;

    // Cover fit calculation
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = w / h;
    let drawW, drawH;
    if (imgRatio > canvasRatio) {
      drawH = h * zoom;
      drawW = drawH * imgRatio;
    } else {
      drawW = w * zoom;
      drawH = drawW / imgRatio;
    }

    const offsetX = (w - drawW) / 2 + scene.panX * w * (progress - 0.5);
    const offsetY = (h - drawH) / 2 + scene.panY * h * (progress - 0.5);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    ctx.restore();
  }

  function frame(now) {
    // Stop cleanly if user navigated away from Home
    if (!document.body.contains(canvas)) {
      cleanupHomeEffects();
      return;
    }

    const dt = now - lastFrameTime;
    lastFrameTime = now;

    if (isPlaying) {
      elapsedMs = (elapsedMs + dt) % TOTAL_DURATION_MS;
    }

    const sceneIndex = Math.floor(elapsedMs / SCENE_DURATION_MS);
    const sceneProgress = (elapsedMs % SCENE_DURATION_MS) / SCENE_DURATION_MS;
    const nextIndex = (sceneIndex + 1) % TOUR_SCENES.length;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw current scene
    drawSceneImage(loadedImages[sceneIndex], TOUR_SCENES[sceneIndex], sceneProgress, 1);

    // Smooth crossfade during last 15% of each scene
    if (sceneProgress > 0.85) {
      const fadeAlpha = (sceneProgress - 0.85) / 0.15;
      drawSceneImage(loadedImages[nextIndex], TOUR_SCENES[nextIndex], 0, fadeAlpha);
    }

    // Subtle cinematic bottom gradient
    const grad = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height);
    grad.addColorStop(0, 'rgba(9, 9, 11, 0)');
    grad.addColorStop(1, 'rgba(9, 9, 11, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.45);

    updateUI(sceneIndex);
    tourAnimationId = requestAnimationFrame(frame);
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      playBtn.textContent = isPlaying ? '⏸ Pause Tour' : '▶ Play Tour';
      lastFrameTime = performance.now();
    });
  }

  if (progressTrack) {
    progressTrack.addEventListener('click', (e) => {
      const rect = progressTrack.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      elapsedMs = ratio * TOTAL_DURATION_MS;
    });
  }

  chapterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.scene, 10);
      elapsedMs = idx * SCENE_DURATION_MS;
      if (!isPlaying) {
        isPlaying = true;
        if (playBtn) playBtn.textContent = '⏸ Pause Tour';
      }
    });
  });

  tourAnimationId = requestAnimationFrame(frame);
}

// Photo Lightbox Modal
if (typeof window !== 'undefined') {
  window.openPhotoLightbox = function (index) {
    const photo = GALLERY_PHOTOS[index] || GALLERY_PHOTOS[0];
    const dialog = document.getElementById('modal-generic');
    if (!dialog) return;

    dialog.innerHTML = `
      <div class="modal-head">
        <div>
          <span class="modal-head-title">${photo.title}</span>
          <span class="badge badge-active" style="margin-left: 0.5rem;">${photo.tag}</span>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body-content" style="padding: 1rem;">
        <img src="${photo.src}" alt="${photo.title}" style="width: 100%; border-radius: var(--radius-md); max-height: 65vh; object-fit: cover;" />
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.25rem;">${photo.caption}</p>
      </div>
      <div class="modal-foot" style="justify-content: space-between;">
        <div style="display: flex; gap: 0.4rem;">
          ${GALLERY_PHOTOS.map((_, i) => `
            <button type="button" class="btn btn-sm ${i === index ? 'btn-accent' : 'btn-secondary'}" onclick="openPhotoLightbox(${i})">
              ${i + 1}
            </button>
          `).join('')}
        </div>
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>
      </div>
    `;

    if (!dialog.open) dialog.showModal();
  };
}
