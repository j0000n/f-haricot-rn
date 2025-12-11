/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as allergies from "../allergies.js";
import type * as auth from "../auth.js";
import type * as customThemes from "../customThemes.js";
import type * as dietary from "../dietary.js";
import type * as fileUrls from "../fileUrls.js";
import type * as foodLibrary from "../foodLibrary.js";
import type * as households from "../households.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as inventory from "../inventory.js";
import type * as nutritionProfiles from "../nutritionProfiles.js";
import type * as qrEvents from "../qrEvents.js";
import type * as promptGenerators from "../promptGenerators.js";
import type * as recipes from "../recipes.js";
import type * as tasks from "../tasks.js";
import type * as testFunction from "../testFunction.js";
import type * as testFunctionNode from "../testFunctionNode.js";
import type * as translationGuides from "../translationGuides.js";
import type * as users from "../users.js";
import type * as world from "../world.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  allergies: typeof allergies;
  auth: typeof auth;
  customThemes: typeof customThemes;
  dietary: typeof dietary;
  fileUrls: typeof fileUrls;
  foodLibrary: typeof foodLibrary;
  households: typeof households;
  http: typeof http;
  images: typeof images;
  inventory: typeof inventory;
  nutritionProfiles: typeof nutritionProfiles;
  qrEvents: typeof qrEvents;
  promptGenerators: typeof promptGenerators;
  recipes: typeof recipes;
  tasks: typeof tasks;
  testFunction: typeof testFunction;
  testFunctionNode: typeof testFunctionNode;
  translationGuides: typeof translationGuides;
  users: typeof users;
  world: typeof world;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
