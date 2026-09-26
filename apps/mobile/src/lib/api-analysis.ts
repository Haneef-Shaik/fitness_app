/**
 * AI food analysis (G8) — H-06 … H-09, H-18.
 *
 * **Submitting returns 202 and an id.** Nothing here waits for a model: the
 * work happens in a separate worker process and the client polls. A surface
 * that blocked on the analysis would put a model's latency on a user's screen
 * and, worse, would make the app feel broken when the provider is slow.
 */
import type {
  ConfirmIn, FoodAnalysis, ImageAnalysisIn, Meal, AnalysisQuota, AnalysisSettings,
  TextAnalysisIn, UploadSign, UploadSignIn,
} from '@fitlog/api-types';
import { api } from './api';

export const analysisApi = {
  /** Read BEFORE offering the button (02 §5.4), never after it is pressed. */
  quota: () => api.get<AnalysisQuota>('/food-analysis/quota'),

  /**
   * K-08 — usage, who receives a photo, and the low-confidence threshold.
   * From the server's configuration, so the disclosure is where photos go.
   */
  settings: () => api.get<AnalysisSettings>('/food-analysis/settings'),

  analyseText: (body: TextAnalysisIn) =>
    api.post<FoodAnalysis>('/food-analysis/text', body),
  analyseImage: (body: ImageAnalysisIn) =>
    api.post<FoodAnalysis>('/food-analysis/image', body),

  get: (id: string) => api.get<FoodAnalysis>(`/food-analysis/${id}`),
  list: () => api.get<FoodAnalysis[]>('/food-analyses'),

  /**
   * H-08's save. Writes `meal_items`; leaves the analysis untouched.
   *
   * Idempotent on the ANALYSIS server-side, so a double tap and a second
   * device reviewing the same photo produce one meal between them.
   */
  confirm: (id: string, body: ConfirmIn) =>
    api.post<Meal>(`/food-analysis/${id}/confirm`, body),

  /** H-18's "delete all photos". The records stay; the photographs go. */
  deleteImages: () => api.del<{ photos_deleted: number }>('/food-analyses/images'),

  signUpload: (body: UploadSignIn) => api.post<UploadSign>('/uploads/sign', body),
};
