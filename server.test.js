const request = require('supertest');
const app = require('./server');

describe('Server API Tests', () => {
  describe('GET /api/ontology', () => {
    it('should return ontology data with correct structure', async () => {
      const response = await request(app)
        .get('/api/ontology')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0]).toHaveProperty('entityTypes');
      expect(response.body.data[0]).toHaveProperty('relationshipTypes');
      expect(response.body.data[0]).toHaveProperty('properties');
    });

    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/ontology')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should return Dragons ontology', async () => {
      const response = await request(app)
        .get('/api/ontology')
        .expect(200);

      expect(response.body.data[0].ont).toBe('Dragons');
    });
  });

  describe('GET /api/structure', () => {
    it('should return structure data', async () => {
      const response = await request(app)
        .get('/api/structure')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('structure');
      expect(response.body).toHaveProperty('primitives');
      expect(response.body).toHaveProperty('operators');
    });

    it('should include primitives array', async () => {
      const response = await request(app)
        .get('/api/structure')
        .expect(200);

      expect(Array.isArray(response.body.primitives)).toBe(true);
      expect(response.body.primitives).toContain('string');
      expect(response.body.primitives).toContain('int');
      expect(response.body.primitives).toContain('date');
    });

    it('should include operators object', async () => {
      const response = await request(app)
        .get('/api/structure')
        .expect(200);

      expect(response.body.operators).toHaveProperty('eq');
      expect(response.body.operators).toHaveProperty('ne');
      expect(response.body.operators).toHaveProperty('gt');
    });
  });

  describe('POST /api/results', () => {
    it('should return results for normal query', async () => {
      const response = await request(app)
        .post('/api/results')
        .send({ query: 'test query' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should return results for collapsed query', async () => {
      const response = await request(app)
        .post('/api/results')
        .send({ query: 'test query', collapsed: true })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should accept JSON request body', async () => {
      const response = await request(app)
        .post('/api/results')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ query: 'test query' }))
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('POST /api/update', () => {
    it('should return update data', async () => {
      const response = await request(app)
        .post('/api/update')
        .send({ nodeId: '123' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('GET /api/schema', () => {
    it('should return list of schemas', async () => {
      const response = await request(app)
        .get('/api/schema')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('schema');
      expect(Array.isArray(response.body.schema)).toBe(true);
      expect(response.body.schema.length).toBeGreaterThan(0);
    });

    it('should return schemas with id and label', async () => {
      const response = await request(app)
        .get('/api/schema')
        .expect(200);

      const firstSchema = response.body.schema[0];
      expect(firstSchema).toHaveProperty('id');
      expect(firstSchema).toHaveProperty('label');
    });

    it('should include Schema A in the list', async () => {
      const response = await request(app)
        .get('/api/schema')
        .expect(200);

      const schemaA = response.body.schema.find(s => s.id === 'A');
      expect(schemaA).toBeDefined();
      expect(schemaA.label).toBe('Schema A');
    });
  });

  describe('GET /api/schema/:id', () => {
    it('should return specific schema by id', async () => {
      const response = await request(app)
        .get('/api/schema/A')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('A');
      expect(response.body.A).toHaveProperty('label');
      expect(response.body.A).toHaveProperty('value');
    });

    it('should return schema with GraphQL query', async () => {
      const response = await request(app)
        .get('/api/schema/A')
        .expect(200);

      expect(response.body.A.value).toContain('query');
      expect(response.body.A.value).toContain('person');
    });
  });

  describe('POST /api/schema', () => {
    it('should successfully save schema with label', async () => {
      const response = await request(app)
        .post('/api/schema')
        .send({ label: 'Test Schema', value: 'query { test }' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.status).toBe('Success');
    });

    it('should return 400 when label is missing', async () => {
      const response = await request(app)
        .post('/api/schema')
        .send({ value: 'query { test }' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.message).toBe('No label included');
    });

    it('should return 400 when label is empty string', async () => {
      const response = await request(app)
        .post('/api/schema')
        .send({ label: '', value: 'query { test }' })
        .expect(400);

      expect(response.body.message).toBe('No label included');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers on all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/ontology' },
        { method: 'get', path: '/api/structure' },
        { method: 'get', path: '/api/schema' },
        { method: 'post', path: '/api/results' },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path)
          .send({});

        expect(response.headers['access-control-allow-origin']).toBe('*');
        expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
        expect(response.headers['access-control-allow-methods']).toContain('GET');
        expect(response.headers['access-control-allow-methods']).toContain('POST');
      }
    });
  });

  describe('Content-Type Headers', () => {
    it('should return JSON for all API endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/ontology' },
        { method: 'get', path: '/api/structure' },
        { method: 'get', path: '/api/schema' },
        { method: 'get', path: '/api/schema/A' },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.headers['content-type']).toMatch(/json/);
      }
    });
  });
});
