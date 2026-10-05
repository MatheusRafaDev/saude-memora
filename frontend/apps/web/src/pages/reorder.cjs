const fs = require('fs');
const path = 'c:/Users/rafae/Documents/GitHub/saude-memora/frontend/artifacts/saudememora/src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const heroMatch = content.match(/(      \{\/\* Hero Welcome Banner \*\/\}(.|\n)*?      <\/section>\n)/);
const metricsMatch = content.match(/(      \{\/\* Main Unified Metrics Banner \*\/\}(.|\n)*?      <\/section>\n)/);
const tableMatch = content.match(/(      \{\/\* Single Unified Documents Table \*\/\}(.|\n)*?      <\/section>\n)/);
const healthMatch = content.match(/(      \{\/\* Patient Health Context \(Alerts & Profile\) \*\/\}(.|\n)*?      <\/section>\n)/);

if (heroMatch && metricsMatch && tableMatch && healthMatch) {
  const hero = heroMatch[1];
  const metrics = metricsMatch[1];
  const table = tableMatch[1];
  const health = healthMatch[1];

  let contentNoSections = content.replace(hero, '').replace(metrics, '').replace(table, '').replace(health, '');
  const newOrder = hero + '\n' + health + '\n' + metrics + '\n' + table + '\n';
  
  const parts = contentNoSections.split('<div className=\"page-enter space-y-8 pb-10\">\n');
  const finalContent = parts[0] + '<div className=\"page-enter space-y-8 pb-10\">\n\n' + newOrder + parts[1].replace(/^\s+/, '');
  
  fs.writeFileSync(path, finalContent, 'utf8');
  console.log('Sections reorganized successfully.');
} else {
  console.log('Could not match sections');
}
