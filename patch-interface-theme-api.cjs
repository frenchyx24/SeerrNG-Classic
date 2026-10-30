const fs = require('node:fs');
const specPath = '/app/seerr-api.yml';
const spec = fs.readFileSync(specPath, 'utf8');

if (spec.includes('  /interface-themes:')) {
  console.log('Theme routes already declared in OpenAPI spec.');
  process.exit(0);
}

const marker = '\npaths:\n';
if (!spec.includes(marker)) throw new Error('OpenAPI paths section not found');
const routes = `  /interface-themes:
    get:
      tags: [public]
      security: []
      summary: List installed interface themes
      responses:
        '200':
          description: Installed theme manifests
  /interface-themes/{id}/theme.css:
    get:
      tags: [public]
      security: []
      summary: Serve an installed interface theme stylesheet
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Theme stylesheet
          content:
            text/css:
              schema:
                type: string
        '404':
          description: Theme not installed
`;
fs.writeFileSync(specPath, spec.replace(marker, marker + routes), 'utf8');
console.log('Added public interface-theme routes to OpenAPI spec.');
