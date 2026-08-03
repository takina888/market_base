import fs from 'node:fs';
import vm from 'node:vm';

const routeSource = fs.readFileSync(new URL('../world-route/world-route.js', import.meta.url), 'utf8');
const dataSource = fs.readFileSync(new URL('../world-route/world-route-data.js', import.meta.url), 'utf8');

const match = routeSource.match(/const REGION_VIEWPORTS = Object\.freeze\((\{[\s\S]*?\})\);/);
if (!match) throw new Error('REGION_VIEWPORTS was not found');
const viewports = vm.runInNewContext(`(${match[1]})`);

const sandbox = {};
sandbox.window = sandbox;
vm.runInNewContext(dataSource, sandbox);
const countries = sandbox.MB_WORLD_ROUTE_V323?.countries;
if (!Array.isArray(countries) || countries.length < 20) {
  throw new Error('World route country data is incomplete');
}

const project = ({ lat, lon }) => ({
  x: ((lon + 180) / 360) * 1000,
  y: ((90 - lat) / 180) * 500
});

for (const country of countries) {
  const viewport = viewports[country.region];
  if (!viewport) continue;
  const right = viewport.x + viewport.width;
  const bottom = viewport.y + viewport.height;
  if (Math.abs((viewport.width / viewport.height) - 2) > 0.001) {
    throw new Error(`${country.region}: viewport ratio must match the 2:1 map frame`);
  }
  for (const route of country.variants) {
    for (const step of route.steps) {
      const point = project(step);
      if (point.x < viewport.x || point.x > right || point.y < viewport.y || point.y > bottom) {
        throw new Error(`${country.name}/${step.label}: route point is outside ${country.region} viewport`);
      }
    }
  }
}

for (const region of ['東アジア', '東南アジア', '南アジア']) {
  if (!viewports[region] || viewports[region].width >= 500) {
    throw new Error(`${region}: expected a regional zoom under 500 units wide`);
  }
}

console.log('V333.7 route viewport checks passed');
