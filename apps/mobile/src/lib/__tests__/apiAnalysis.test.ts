/**
 * The AI analysis API surface — the URLs, and only the URLs.
 *
 * Every screen test mocks this module, so nothing else exercises the string
 * that actually goes on the wire. The same gap `api-nutrition.ts` had before
 * G7's close, found the same way.
 */
import { analysisApi } from '../api-analysis';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(() => Promise.resolve({})),
    post: jest.fn(() => Promise.resolve({})),
    del: jest.fn(() => Promise.resolve({})),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

it('addresses every analysis route where the server put it', async () => {
  await analysisApi.quota();
  await analysisApi.analyseText({ text: '2 eggs', client_id: null });
  await analysisApi.analyseImage({ image_key: 'uploads/u/1.jpg', client_id: null });
  await analysisApi.get('a1');
  await analysisApi.list();
  await analysisApi.confirm('a1', {
    meal_type: 'lunch', consumed_at: null, client_id: null, items: [],
  });
  await analysisApi.deleteImages();
  await analysisApi.signUpload({ content_type: 'image/jpeg', byte_size: 1024 });

  expect(mockApi.get).toHaveBeenCalledWith('/food-analysis/quota');
  expect(mockApi.post).toHaveBeenCalledWith('/food-analysis/text', {
    text: '2 eggs', client_id: null,
  });
  expect(mockApi.post).toHaveBeenCalledWith('/food-analysis/image', {
    image_key: 'uploads/u/1.jpg', client_id: null,
  });
  expect(mockApi.get).toHaveBeenCalledWith('/food-analysis/a1');
  // Plural for the list, singular for one — two different routes, and a typo
  // here would 404 only on a device.
  expect(mockApi.get).toHaveBeenCalledWith('/food-analyses');
  expect(mockApi.post).toHaveBeenCalledWith('/food-analysis/a1/confirm', expect.anything());
  expect(mockApi.del).toHaveBeenCalledWith('/food-analyses/images');
  expect(mockApi.post).toHaveBeenCalledWith('/uploads/sign', {
    content_type: 'image/jpeg', byte_size: 1024,
  });
});

it('has no route that runs a model in the request path', () => {
  // Analysis is a job. A surface that could block on a model is how one slow
  // plate photograph takes the API down (I14).
  const surface = Object.keys(analysisApi);
  expect(surface).not.toContain('analyseNow');
  expect(surface).not.toContain('runModel');
});
