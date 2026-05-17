import fs from 'fs';
import yaml from 'js-yaml';

/**
 * Read and parse a YAML file.
 */
export function readYaml(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return yaml.load(content);
}

/**
 * Write a JS object as YAML to a file.
 */
export function writeYaml(filePath, data) {
  const content = yaml.dump(data, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
  fs.writeFileSync(filePath, content, 'utf-8');
}
