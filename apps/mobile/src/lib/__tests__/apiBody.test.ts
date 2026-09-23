/**
 * The body API surface — the URLs, and only the URLs.
 *
 * Every screen test mocks this module, so nothing else exercises the string
 * that goes on the wire. The same gap `api-nutrition.ts` had before G7's close
 * and `api-analysis.ts` before G8's.
 */
import { bodyApi } from '../api-body';
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

describe('the dashboard', () => {
  it('sends NO date by default', async () => {
    await bodyApi.dashboard();
    // I7. `?date=` here would be the client answering a question that is not
    // its to answer, and it would be wrong exactly for travellers.
    expect(mockApi.get).toHaveBeenCalledWith('/dashboard');
  });

  it('sends one when a specific day is asked for', async () => {
    await bodyApi.dashboard('2026-09-21');
    expect(mockApi.get).toHaveBeenCalledWith('/dashboard?date=2026-09-21');
  });
});

describe('paths', () => {
  it('addresses body metrics, the series and the photos', async () => {
    await bodyApi.metrics();
    await bodyApi.metrics('waist_cm', { from: '2026-09-01', to: '2026-09-23' });
    await bodyApi.series();
    await bodyApi.deleteMetric('m1');
    await bodyApi.photos();
    await bodyApi.createPhoto({
      image_key: 'uploads/u/1.jpg', pose: 'front', taken_at: null,
      notes: null, client_id: null,
    });
    await bodyApi.deletePhoto('p1');

    expect(mockApi.get).toHaveBeenCalledWith('/body-metrics?metric_key=body_weight');
    expect(mockApi.get).toHaveBeenCalledWith(
      '/body-metrics?metric_key=waist_cm&from=2026-09-01&to=2026-09-23',
    );
    // The series is a DIFFERENT route from the list: one point per day versus
    // every entry, and a typo here would quietly return the wrong question.
    expect(mockApi.get).toHaveBeenCalledWith('/analytics/body?metric_key=body_weight');
    expect(mockApi.del).toHaveBeenCalledWith('/body-metrics/m1');
    expect(mockApi.get).toHaveBeenCalledWith('/progress-photos');
    expect(mockApi.post).toHaveBeenCalledWith('/progress-photos', expect.anything());
    expect(mockApi.del).toHaveBeenCalledWith('/progress-photos/p1');
  });

  it('has no route that posts a measurement directly', () => {
    // It goes through the outbox. A direct POST here is how somebody reaches
    // past the queue and loses a weigh-in taken in a basement gym.
    const surface = Object.keys(bodyApi);
    expect(surface).not.toContain('createMetric');
    expect(surface).not.toContain('logMetric');
  });
});
