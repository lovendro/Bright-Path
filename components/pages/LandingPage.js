import { brand, publicHeader } from '../Navigation.js';
import { icon } from '../Icons.js';

const features = [
  ['resources', 'blue', 'Access Resources', 'Discover notes, books, past papers, articles and useful learning materials.', 'Browse Resources', 'resources'],
  ['groups', 'teal', 'Join Study Groups', 'Learn together, exchange ideas and stay motivated with other students.', 'Find a Group', 'groups'],
  ['questions', 'amber', 'Ask & Solve', 'Post difficult questions and get help from learners who understand the topic.', 'Ask a Question', 'qa'],
  ['ai', 'violet', 'Learn AI Wisely', 'Use AI as a learning tool without replacing your own critical thinking.', 'Explore AI Guides', 'ai']
];

export function LandingPage() {
  return `<div class="landing-page">
    ${publicHeader()}
    <main>
      <section class="hero landing-hero">
        <div class="hero-copy">
          <span class="eyebrow">Knowledge · Community · A brighter tomorrow</span>
          <h1>Learn.<br>Share.<br><span>Grow together.</span></h1>
          <p>Bright Path is a nonprofit learning community where students and learners find shared resources, solve problems together, and learn to use AI responsibly.</p>
          <div class="hero-buttons">
            <a class="btn" href="#signup" data-page="signup">Get started <span aria-hidden="true">→</span></a>
            <a class="btn btn-light" href="#resources" data-page="resources">Explore resources</a>
          </div>
          <a class="landing-secondary-link" href="#groups" data-page="groups">Or find a study group <span aria-hidden="true">↗</span></a>
        </div>
        <div class="hero-image" role="img" aria-label="Students at Shela Primary School in Lamu County, Kenya, learning together">
          <div class="image-note">Learning is better<br>when we share it.<span>Shela · Lamu County</span></div>
        </div>
      </section>

      <section class="landing-features" aria-labelledby="landing-features-title">
        <div class="landing-section-heading">
          <span class="eyebrow">A community built around learning</span>
          <h2 id="landing-features-title">A brighter path, together.</h2>
          <p>Whatever you’re learning, you don’t have to do it alone.</p>
        </div>
        <div class="landing-feature-grid">
          ${features.map(([iconName, accent, title, description, action, page]) => `<article class="landing-feature-card accent-${accent}">
            <div class="feature-icon" aria-hidden="true">${icon(iconName, 22)}</div>
            <h3>${title}</h3>
            <p>${description}</p>
            <a href="#${page}" data-page="${page}">${action} <span aria-hidden="true">→</span></a>
          </article>`).join('')}
        </div>
      </section>

      <section class="landing-resource-search" aria-labelledby="landing-search-title">
        <div class="landing-search-copy">
          <span class="eyebrow">Find your next useful resource</span>
          <h2 id="landing-search-title">What would you like to learn?</h2>
          <p>Search shared materials by subject, topic, or title.</p>
        </div>
        <form class="landing-search-form" id="landing-resource-search">
          <label class="sr-only" for="landing-search-input">Search learning resources</label>
          <span aria-hidden="true">⌕</span>
          <input id="landing-search-input" name="search" type="search" placeholder="Search reading materials, subjects, topics..." autocomplete="off">
          <button class="btn" type="submit">Search</button>
        </form>
        <div class="landing-search-chips" aria-label="Popular subjects">
          ${['Mathematics', 'Science', 'Technology', 'Architecture', 'Business', 'Study skills'].map(subject => `<button type="button" data-search-term="${subject}">${subject}</button>`).join('')}
        </div>
      </section>

      <section class="landing-community">
        <div class="landing-community-image" role="img" aria-label="Students learning together at Shela Primary School"></div>
        <div class="landing-community-copy">
          <span class="eyebrow">People · Ideas · Brighter futures</span>
          <h2>A nonprofit for a brighter future.</h2>
          <p>We believe access to education grows when people share what they know. Bright Path brings learners together to find materials, help one another, and build confidence—including learning to use AI as a tool, not a substitute for understanding.</p>
          <a class="btn btn-light" href="#signup" data-page="signup">Be part of the community <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </main>

    <footer class="footer landing-footer">
      <div class="landing-footer-brand">
        ${brand}
        <p>People · Ideas · Brighter futures</p>
      </div>
      <nav class="landing-footer-links" aria-label="Footer">
        <a href="#home" data-page="home">Home</a>
        <a href="#resources" data-page="resources">Resources</a>
        <a href="#groups" data-page="groups">Study Groups</a>
        <a href="#community" data-page="community">Community</a>
        <a href="#ai" data-page="ai">AI Learning Hub</a>
      </nav>
      <div class="footer-credit">
        <p>Community-led. Built to grow with learners.</p>
        <p>Photo: Female students at Shela Primary School, Lamu County, by Queen Asali, Wikimedia Commons, licensed under CC BY-SA 4.0.</p>
      </div>
    </footer>
  </div>`;
}
