/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as coins from "../coins.js";
import type * as courses from "../courses.js";
import type * as crons from "../crons.js";
import type * as gamification from "../gamification.js";
import type * as http from "../http.js";
import type * as lessons from "../lessons.js";
import type * as payments from "../payments.js";
import type * as progress from "../progress.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  coins: typeof coins;
  courses: typeof courses;
  crons: typeof crons;
  gamification: typeof gamification;
  http: typeof http;
  lessons: typeof lessons;
  payments: typeof payments;
  progress: typeof progress;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
