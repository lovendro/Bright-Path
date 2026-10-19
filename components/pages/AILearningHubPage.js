const guides = [
  ['Start here', 'Introduction to AI for Students', 'What AI can help with, where it can fall short, and how to stay in charge of your learning.'],
  ['Research', 'Use AI to Explore a Topic', 'Generate questions and directions for research, then verify findings with trusted sources.'],
  ['Study skills', 'AI for Note-Taking', 'Turn your own notes into summaries and practice prompts without skipping the learning.'],
  ['Critical thinking', 'Check AI Answers', 'Look for evidence, compare reliable references, and notice when a confident answer may be wrong.'],
  ['Academic integrity', 'Use AI Responsibly', 'Understand your institution’s rules and make sure submitted work reflects your own understanding.'],
  ['Practice', 'Ask AI to Teach, Not Answer', 'Request hints, examples, and practice problems before asking for a complete solution.']
];

export function AILearningHubPage() {
  return `<div class="welcome-row"><div><span class="eyebrow">Study skills for a changing world</span><h1>AI Learning Hub</h1><p>Learn to use AI effectively and responsibly in your studies.</p></div></div>
    <section class="ai-banner"><div class="feature-icon" aria-hidden="true">✦</div><div><span class="eyebrow">Learn smarter, not less</span><h2>Use AI as a tool, not a shortcut.</h2><p>Try the problem yourself first. Ask for a hint or explanation when you get stuck, then check the answer and explain the idea in your own words.</p></div></section>
    <section class="ai-hub-section"><div class="panel-head"><div><span class="eyebrow">Practical guides</span><h2>Build good AI study habits</h2></div></div><div class="ai-guide-grid">${guides.map(([category, title, description], index) => `<article class="ai-guide"><span class="ai-guide-category">${category}</span><div class="feature-icon" aria-hidden="true">${['✦', '⌕', '▤', '✓', '◇', '?'][index]}</div><h3>${title}</h3><p>${description}</p></article>`).join('')}</div></section>
    <section class="ai-principles"><h2>Keep your learning at the center</h2><ul><li>Ask for explanations, examples, practice, or feedback.</li><li>Verify important claims with reliable sources.</li><li>Follow your school’s academic-integrity rules.</li><li>Don’t submit work you can’t explain yourself.</li></ul></section>
    <p class="prototype-note">These are Bright Path’s built-in learning principles, not community posts.</p>`;
}
