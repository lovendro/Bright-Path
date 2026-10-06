import { publicHeader } from '../Navigation.js';

export function LandingPage() {
  return `${publicHeader()}
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">A community-powered learning space</span>
        <h1>Learn Together.<br><span>Grow Further.</span></h1>
        <p>Bright Path is a Kenyan-rooted, non-profit learning community for sharing study materials, forming study groups, and helping one another learn.</p>
        <div class="hero-buttons">
          <a class="btn" href="#signup" data-page="signup">Create your account <span>→</span></a>
          <a class="btn btn-light" href="#login" data-page="login">Log in</a>
        </div>
        <div class="social-proof"><span>For learners in high school, university, and the wider community.</span></div>
      </div>
      <div class="hero-image" role="img" aria-label="Female students at Shela Primary School in Lamu County, Kenya, during a digital-literacy learning session">
        <div class="image-note">Kenyan learners.<br>One shared path. <span>🌱</span></div>
      </div>
    </section>
    <div class="feature-row">
      <article class="feature-card"><div class="feature-icon">▣</div><div><h3>Share Resources</h3><p>Build a library together, one contribution at a time.</p></div></article>
      <article class="feature-card"><div class="feature-icon">♧</div><div><h3>Form Study Groups</h3><p>Find people who want to learn alongside you.</p></div></article>
      <article class="feature-card"><div class="feature-icon">?</div><div><h3>Ask & Answer</h3><p>Turn learning questions into shared understanding.</p></div></article>
      <article class="feature-card"><div class="feature-icon">✦</div><div><h3>Use AI Thoughtfully</h3><p>Learn with technology without losing your own voice.</p></div></article>
    </div>
    <section class="section">
      <div class="section-heading"><h2>A new community starts with you</h2><p>Bright Path is brand new. There are no pre-filled groups or posts—what you create can be the first.</p></div>
      <div class="steps">
        <div class="step"><span class="step-num">1</span><div><h3>Create an account</h3><p>Set up your learner profile to get started.</p></div></div>
        <div class="step"><span class="step-num">2</span><div><h3>Start something</h3><p>Share a resource, ask a question, or create a study group.</p></div></div>
        <div class="step"><span class="step-num">3</span><div><h3>Invite your community</h3><p>Bring other learners in and grow Bright Path together.</p></div></div>
      </div>
      <div class="center-action"><a class="btn" href="#signup" data-page="signup">Be one of the first <span>→</span></a></div>
    </section>
    <footer class="footer">
      <div><span class="brand brand-footer">Bright Path</span><p>Better learning, brighter futures.</p></div>
      <div class="footer-credit"><p>Community-led. Non-profit in spirit. Built to grow with learners.</p><p>Photos: <a href="https://commons.wikimedia.org/wiki/File:Female_students_at_Shela_Primary_School_-_Lamu_County,_Kenya.jpg" target="_blank" rel="noreferrer">Female students at Shela Primary School, Lamu County</a> and <a href="https://commons.wikimedia.org/wiki/File:Kenyan_teacher_training_students.jpg" target="_blank" rel="noreferrer">Kenyan teacher training students</a> by Queen Asali, Wikimedia Commons, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>.</p></div>
    </footer>`;
}
