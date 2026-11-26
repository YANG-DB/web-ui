const request = require('supertest');
const app = require('./server');

describe('Mock server: ontologies, templates and sample results', () => {
  describe('GET /api/ontology?type=', () => {
    it.each([
      ['dragons', 'Dragons'],
      ['linkedin', 'LinkedIn'],
      ['flights', 'Flights']
    ])('serves the %s ontology', async (type, ont) => {
      const response = await request(app).get(`/api/ontology?type=${type}`).expect(200);
      expect(response.body.data[0].ont.toLowerCase()).toBe(ont.toLowerCase());
    });

    it('falls back to Dragons for an unknown type', async () => {
      const response = await request(app).get('/api/ontology?type=nope').expect(200);
      expect(response.body.data[0].ont).toBe('Dragons');
    });
  });

  describe('GET /api/ontologies', () => {
    it('lists the three mock ontologies', async () => {
      const response = await request(app).get('/api/ontologies').expect(200);
      expect(response.body.ontologies.map(o => o.id)).toEqual(['dragons', 'linkedin', 'flights']);
      response.body.ontologies.forEach(o => {
        expect(o).toHaveProperty('name');
        expect(o).toHaveProperty('description');
      });
    });
  });

  describe('GET /api/ontology/:type/templates', () => {
    it('serves templates for a known ontology', async () => {
      const response = await request(app).get('/api/ontology/dragons/templates').expect(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('query');
    });

    it('returns 404 for an unknown ontology', async () => {
      const response = await request(app).get('/api/ontology/nope/templates').expect(404);
      expect(response.body.message).toMatch(/nope/);
    });
  });

  describe('GET /api/ontology/:type/results', () => {
    it('serves sample results for a known ontology', async () => {
      const response = await request(app).get('/api/ontology/flights/results').expect(200);
      expect(response.body).toBeTruthy();
    });

    it('returns 404 for an unknown ontology', async () => {
      const response = await request(app).get('/api/ontology/nope/results').expect(404);
      expect(response.body.message).toMatch(/nope/);
    });
  });

  describe('POST /api/results', () => {
    it('serves the same results when collapsed', async () => {
      const plain = await request(app).post('/api/results').send({ query: {} }).expect(200);
      const collapsed = await request(app).post('/api/results').send({ query: {}, collapsed: true }).expect(200);
      expect(collapsed.body).toEqual(plain.body);
    });
  });

  describe('OPTIONS preflight', () => {
    it('answers with CORS headers', async () => {
      const response = await request(app).options('/api/results');
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });
});
