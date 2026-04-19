import { defineApp } from "convex/server";
import path from "path";

export default defineApp({
  name: "mobile",
  functions: "./convex",
});