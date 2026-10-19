import { publicHeader } from '../Navigation.js';

export function LandingPage() {
  return `<div class="landing-page">
    ${publicHeader()}
    <main>
      <section class="hero landing-hero">
        <div class="hero-copy">
          <span class="eyebrow">A learning community from Kenya</span>
          <h1>Bring a question.<br><span>Find your people.</span></h1>
          <p>Bright Path is a place for learners to share revision materials, find study partners, and ask for help—from secondary school to campus and beyond.</p>
          <div class="hero-buttons">
            <a class="btn" href="#signup" data-page="signup">Join the community <span>→</span></a>
            <a class="btn btn-light" href="#login" data-page="login">Log in</a>
          </div>
          <div class="social-proof"><span>Start with one question, one useful note, or a study group.</span></div>
        </div>
        <div class="hero-image" role="img" aria-label="Students at Shela Primary School in Lamu County, Kenya, learning together">
          <div class="image-note">Shela Primary School<br><span>Lamu County, Kenya</span></div>
        </div>
      </section>

      <section class="landing-paths" aria-labelledby="landing-paths-title">
        <div class="landing-paths-heading">
          <span class="eyebrow">A good place to begin</span>
          <h2 id="landing-paths-title">What are you working on?</h2>
        </div>
        <div class="landing-path-list">
          <a class="landing-path" href="#resources" data-page="resources">
            <span class="landing-path-number">01</span>
            <span class="landing-path-copy"><strong>Looking for notes?</strong><span>Browse and share study resources.</span></span>
            <span class="landing-path-arrow" aria-hidden="true">↗</span>
          </a>
          <a class="landing-path" href="#groups" data-page="groups">
            <span class="landing-path-number">02</span>
            <span class="landing-path-copy"><strong>Rather study together?</strong><span>Find a group or start one.</span></span>
            <span class="landing-path-arrow" aria-hidden="true">↗</span>
          </a>
          <a class="landing-path" href="#qa" data-page="qa">
            <span class="landing-path-number">03</span>
            <span class="landing-path-copy"><strong>Got a question?</strong><span>Ask it. Someone else may know.</span></span>
            <span class="landing-path-arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section class="landing-beginning">
        <div>
          <span class="eyebrow">A note about where we are</span>
          <h2>We’re just getting started.</h2>
        </div>
        <div class="landing-beginning-copy">
          <p>There may not be a group for your subject or a stack of notes yet. That’s the point: the first one can come from you.</p>
          <a class="text-link" href="#signup" data-page="signup">Make the first contribution <span aria-hidden="true">→</span></a>
          <p class="landing-ai-note">Curious about <a href="#ai" data-page="ai">AI study tools</a>? Use the tools, keep your own curiosity.</p>
        </div>
      </section>
    </main>

    <footer class="footer landing-footer">
      <div><span class="brand brand-footer">Bright Path</span><p>Learning goes further when we share it.</p></div>
      <div class="footer-credit">
        <p>Community-led. Built to grow with learners.</p>
        <p>Photo: Female students at Shela Primary School, Lamu County, by Queen Asali, Wikimedia Commons, licensed under CC BY-SA 4.0.</p>
      </div>
    </footer>
  </div>`;
}
